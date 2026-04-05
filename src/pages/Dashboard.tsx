import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings, Mic, MicOff, Volume2, VolumeX, Key } from "lucide-react";
import VoiceVisualizer from "@/components/VoiceVisualizer";
import { useAuth } from "@/contexts/AuthContext";
import { askJarvis, clearConversation, DEFAULT_GEMINI_KEY } from "@/lib/gemini";
import {
  startListening,
  stopListening,
  speak,
  stopSpeaking,
  getIsSpeaking,
  isSpeechRecognitionSupported,
  findBestVoice,
  setVoice,
  getAvailableVoices,
} from "@/lib/speechService";
import {
  playActivateSound,
  playDeactivateSound,
  playProcessingSound,
  playResponseSound,
  playErrorSound,
  playLogoutSound,
  playClickSound,
  resumeAudioContext,
} from "@/lib/soundEffects";

type JarvisState = "idle" | "listening" | "processing" | "speaking" | "error";

const Dashboard = () => {
  const [greeting, setGreeting] = useState("Good evening");
  const [jarvisState, setJarvisState] = useState<JarvisState>("idle");
  const [statusText, setStatusText] = useState("STANDBY MODE");
  const [lastTranscript, setLastTranscript] = useState("");
  const [lastResponse, setLastResponse] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [selectedVoiceName, setSelectedVoiceName] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const { user, profile, signOut, updateProfile, loading } = useAuth();
  const stateRef = useRef<JarvisState>("idle");

  // Keep stateRef in sync
  useEffect(() => {
    stateRef.current = jarvisState;
  }, [jarvisState]);

  // Auth check
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }
    if (!loading && user && !profile?.username) {
      navigate("/onboarding");
      return;
    }
  }, [loading, user, profile, navigate]);

  // Set greeting
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");
  }, []);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const v = getAvailableVoices();
      setVoices(v);
      if (v.length > 0 && !selectedVoiceName) {
        const best = findBestVoice();
        if (best) {
          setSelectedVoiceName(best.name);
          setVoice(best);
        }
      }
    };
    loadVoices();
    window.speechSynthesis?.addEventListener?.("voiceschanged", loadVoices);
    return () => {
      window.speechSynthesis?.removeEventListener?.("voiceschanged", loadVoices);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
      stopSpeaking();
    };
  }, []);

  const handleVoiceChange = (name: string) => {
    setSelectedVoiceName(name);
    const voice = voices.find((v) => v.name === name) || null;
    setVoice(voice);
  };

  const apiKey = profile?.gemini_api_key || DEFAULT_GEMINI_KEY;
  const username = profile?.username || "User";
  const interests = profile?.interests || [];

  // ─── Core Voice Loop ───

  const activate = useCallback(() => {
    resumeAudioContext();

    if (jarvisState === "speaking") {
      stopSpeaking();
      setJarvisState("idle");
      setStatusText("STANDBY MODE");
      playDeactivateSound();
      return;
    }

    if (jarvisState === "listening" || jarvisState === "processing") {
      stopListening();
      stopSpeaking();
      setJarvisState("idle");
      setStatusText("STANDBY MODE");
      playDeactivateSound();
      return;
    }

    if (!apiKey) {
      setErrorMessage("Please set your Gemini API key in Settings");
      playErrorSound();
      setShowSettings(true);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      setErrorMessage("Speech recognition not supported. Use Chrome or Edge.");
      playErrorSound();
      return;
    }

    setErrorMessage("");
    playActivateSound();
    setJarvisState("listening");
    setStatusText("LISTENING...");
    setLastTranscript("");

    startListening(
      // onResult
      async (transcript) => {
        setLastTranscript(transcript);
        setJarvisState("processing");
        setStatusText("PROCESSING...");
        playProcessingSound();

        try {
          const response = await askJarvis(transcript, apiKey, username, interests);
          setLastResponse(response);
          playResponseSound();
          setJarvisState("speaking");
          setStatusText("SPEAKING...");

          speak(
            response,
            () => {
              // onStart
            },
            () => {
              // onEnd
              if (stateRef.current === "speaking") {
                setJarvisState("idle");
                setStatusText("STANDBY MODE");
              }
            },
            (error) => {
              console.error("TTS Error:", error);
              setJarvisState("idle");
              setStatusText("STANDBY MODE");
            }
          );
        } catch (err: any) {
          console.error("AI Error:", err);
          playErrorSound();

          if (err.message === "API_KEY_MISSING") {
            setErrorMessage("API key missing. Set it in Settings.");
            setShowSettings(true);
          } else {
            setErrorMessage("Couldn't process that. Try again.");
          }
          setJarvisState("error");
          setStatusText("ERROR");
          setTimeout(() => {
            setJarvisState("idle");
            setStatusText("STANDBY MODE");
            setErrorMessage("");
          }, 3000);
        }
      },
      // onEnd
      () => {
        if (stateRef.current === "listening") {
          // No speech detected
          setJarvisState("idle");
          setStatusText("STANDBY MODE");
        }
      },
      // onError
      (error) => {
        if (error === "no-speech") {
          setStatusText("NO SPEECH DETECTED");
          setTimeout(() => {
            setJarvisState("idle");
            setStatusText("STANDBY MODE");
          }, 2000);
        } else {
          playErrorSound();
          setErrorMessage(`Mic error: ${error}`);
          setJarvisState("error");
          setStatusText("MIC ERROR");
          setTimeout(() => {
            setJarvisState("idle");
            setStatusText("STANDBY MODE");
            setErrorMessage("");
          }, 3000);
        }
      }
    );
  }, [jarvisState, apiKey, username, interests]);

  const handleLogout = async () => {
    playLogoutSound();
    stopListening();
    stopSpeaking();
    clearConversation();
    await signOut();
    navigate("/auth");
  };

  const handleSaveApiKey = async () => {
    if (apiKeyInput.trim()) {
      await updateProfile({ gemini_api_key: apiKeyInput.trim() });
      setApiKeyInput("");
      setShowSettings(false);
      playClickSound();
    }
  };

  if (loading) return null;

  const isActive = jarvisState !== "idle" && jarvisState !== "error";

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(190 100% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(190 100% 50%) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-10 py-4 border-b border-border/50">
        <h1 className="font-orbitron text-xl md:text-2xl tracking-[0.2em] text-primary animate-text-glow">
          J.A.R.V.I.S.
        </h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              playClickSound();
              setShowSettings(!showSettings);
            }}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-rajdhani tracking-wider text-sm"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-rajdhani tracking-wider text-sm"
          >
            <LogOut className="w-4 h-4" />
            LOGOUT
          </button>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="relative z-20 border-b border-border/50 animate-fade-up">
          <div className="px-6 md:px-10 py-6 glassmorphic">
            <h3 className="font-orbitron text-sm tracking-[0.15em] text-primary mb-4">
              SETTINGS
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {/* API Key */}
              <div>
                <label className="font-orbitron text-xs tracking-widest text-muted-foreground mb-2 block">
                  <Key className="w-3 h-3 inline mr-2" />
                  GEMINI API KEY
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="jarvis-input flex-1"
                    placeholder={apiKey ? "••••••••" : "Enter API key..."}
                  />
                  <button onClick={handleSaveApiKey} className="jarvis-btn text-xs px-4">
                    SAVE
                  </button>
                </div>
                {apiKey && (
                  <p className="text-xs text-primary/50 font-rajdhani mt-1">✓ API key configured</p>
                )}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary/40 font-rajdhani hover:text-primary/70 transition-colors underline"
                >
                  Get free key from Google AI Studio
                </a>
              </div>

              {/* Voice Selection */}
              <div>
                <label className="font-orbitron text-xs tracking-widest text-muted-foreground mb-2 block">
                  <Volume2 className="w-3 h-3 inline mr-2" />
                  JARVIS VOICE
                </label>
                <select
                  value={selectedVoiceName}
                  onChange={(e) => handleVoiceChange(e.target.value)}
                  className="jarvis-input w-full bg-background"
                >
                  {voices.filter(v => v.lang.startsWith('en')).map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                  {voices.filter(v => !v.lang.startsWith('en')).map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    speak("Hello " + username + ". JARVIS online and ready to assist.", undefined, undefined, undefined);
                  }}
                  className="text-xs text-primary/40 font-rajdhani hover:text-primary/70 transition-colors underline mt-1 block"
                >
                  Test voice
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="mt-4 text-xs text-muted-foreground font-rajdhani tracking-wider hover:text-primary transition-colors"
            >
              Close Settings
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-4">
        {/* Greeting */}
        <p className="font-rajdhani text-muted-foreground tracking-widest text-sm mb-2 animate-fade-up">
          {greeting.toUpperCase()},
        </p>
        <h2 className="font-orbitron text-2xl md:text-3xl text-primary animate-text-glow tracking-wider mb-8 animate-fade-up">
          {username.toUpperCase()}
        </h2>

        {/* AI Orb Visualizer */}
        <div className="relative">
          <VoiceVisualizer state={jarvisState} />
          {/* Status text */}
          <p
            className={`text-center font-orbitron text-xs tracking-[0.3em] mt-4 transition-colors duration-300 ${
              jarvisState === "error"
                ? "text-red-400"
                : jarvisState === "listening"
                ? "text-primary"
                : jarvisState === "processing"
                ? "text-yellow-400"
                : jarvisState === "speaking"
                ? "text-emerald-400"
                : "text-muted-foreground"
            }`}
          >
            {statusText}
          </p>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <p className="mt-3 text-xs text-red-400/80 font-rajdhani tracking-wider animate-fade-up text-center max-w-md">
            {errorMessage}
          </p>
        )}

        {/* Transcript Display */}
        {lastTranscript && (
          <div className="mt-4 max-w-lg text-center animate-fade-up">
            <p className="text-xs text-muted-foreground/50 font-orbitron tracking-widest mb-1">YOU SAID</p>
            <p className="text-sm text-muted-foreground font-rajdhani tracking-wider">
              "{lastTranscript}"
            </p>
          </div>
        )}

        {/* Response Display */}
        {lastResponse && jarvisState !== "listening" && (
          <div className="mt-3 max-w-lg text-center animate-fade-up">
            <p className="text-xs text-primary/40 font-orbitron tracking-widest mb-1">JARVIS</p>
            <p className="text-sm text-foreground/70 font-rajdhani tracking-wider leading-relaxed line-clamp-3">
              {lastResponse}
            </p>
          </div>
        )}

        {/* Activate Button */}
        <button
          onClick={activate}
          className={`mt-8 jarvis-btn transition-all duration-500 flex items-center gap-3 ${
            jarvisState === "listening"
              ? "bg-primary/20 border-primary shadow-[0_0_40px_hsl(190_100%_50%_/_0.4)]"
              : jarvisState === "processing"
              ? "bg-yellow-500/10 border-yellow-500/50 shadow-[0_0_30px_hsl(45_100%_50%_/_0.2)]"
              : jarvisState === "speaking"
              ? "bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_30px_hsl(150_100%_50%_/_0.2)]"
              : "opacity-60 hover:opacity-100"
          }`}
        >
          {jarvisState === "listening" ? (
            <>
              <Mic className="w-4 h-4 animate-pulse" />
              LISTENING
            </>
          ) : jarvisState === "processing" ? (
            <>
              <MicOff className="w-4 h-4" />
              PROCESSING
            </>
          ) : jarvisState === "speaking" ? (
            <>
              <VolumeX className="w-4 h-4" />
              STOP SPEAKING
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              ACTIVATE
            </>
          )}
        </button>

        {/* Keyboard shortcut hint */}
        <p className="mt-3 text-xs text-muted-foreground/30 font-rajdhani tracking-wider">
          Tap to talk with JARVIS
        </p>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/30 py-4 px-6 md:px-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                jarvisState === "listening"
                  ? "bg-primary animate-glow-pulse"
                  : jarvisState === "processing"
                  ? "bg-yellow-400 animate-pulse"
                  : jarvisState === "speaking"
                  ? "bg-emerald-400 animate-glow-pulse"
                  : jarvisState === "error"
                  ? "bg-red-400"
                  : "bg-muted-foreground/30"
              }`}
            />
            <span className="font-rajdhani text-xs tracking-widest text-muted-foreground">
              SYSTEM {isActive ? "ACTIVE" : "IDLE"}
            </span>
          </div>
          <span className="font-rajdhani text-xs tracking-widest text-muted-foreground">
            STARK INDUSTRIES © {new Date().getFullYear()}
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
