import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import HUDLoader from "@/components/HUDLoader";
import { playClickSound, playLoginSound, resumeAudioContext } from "@/lib/soundEffects";

const ALL_INTERESTS = [
  "Artificial Intelligence", "Programming", "Robotics", "Blockchain", "Gaming",
  "Cybersecurity", "Data Science", "Cloud Computing", "Web Development", "Machine Learning",
  "Music", "Travel", "Fitness", "Movies", "Science",
  "Art & Design", "Food & Cooking", "Space & Astronomy", "Photography", "Cryptocurrency",
  "Virtual Reality", "3D Printing", "Quantum Computing", "Drones", "Electric Vehicles",
  "Meditation", "Reading", "Fashion", "Sports", "Entrepreneurship",
];

const OnboardingPage = () => {
  const [step, setStep] = useState<"interests" | "username" | "apikey">("interests");
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [username, setUsername] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();

  // If user already completed onboarding, redirect
  useEffect(() => {
    if (profile?.username) {
      navigate("/dashboard");
    }
  }, [profile, navigate]);

  // If not logged in, redirect to auth
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const filtered = useMemo(
    () => ALL_INTERESTS.filter((i) => i.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  const toggle = (interest: string) => {
    resumeAudioContext();
    playClickSound();
    setSelected((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : prev.length < 5
        ? [...prev, interest]
        : prev
    );
  };

  const handleInterestsSubmit = () => {
    if (selected.length === 0) return;
    playClickSound();
    setStep("username");
  };

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    playClickSound();
    setStep("apikey");
  };

  const handleApiKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await updateProfile({
      username: username.trim(),
      interests: selected,
      gemini_api_key: apiKey.trim() || null,
    });

    if (error) {
      console.error("Profile save error:", error);
      setSaving(false);
      return;
    }

    playLoginSound();
    setTimeout(() => {
      navigate("/dashboard");
    }, 1200);
  };

  if (saving) return <HUDLoader text="CONFIGURING JARVIS..." />;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(hsl(190 100% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(190 100% 50%) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {step === "interests" ? (
        <div className="w-full max-w-2xl animate-fade-up">
          <h1 className="font-orbitron text-2xl text-primary animate-text-glow tracking-[0.15em] text-center mb-2">
            SELECT YOUR INTERESTS
          </h1>
          <p className="text-center text-muted-foreground text-sm mb-6 font-rajdhani tracking-wider">
            Choose up to 5 areas — JARVIS will personalize responses for you — {selected.length}/5 selected
          </p>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="jarvis-input w-full pl-10"
              placeholder="Search interests..."
            />
          </div>

          {/* Interest Grid */}
          <div className="flex flex-wrap gap-3 justify-center mb-8 max-h-[400px] overflow-y-auto pr-2">
            {filtered.map((interest) => {
              const isSelected = selected.includes(interest);
              return (
                <button
                  key={interest}
                  onClick={() => toggle(interest)}
                  className={`px-4 py-2 rounded-full text-sm font-rajdhani tracking-wider transition-all duration-300 border ${
                    isSelected
                      ? "bg-primary/20 border-primary text-primary shadow-[0_0_15px_hsl(190_100%_50%_/_0.3)]"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>

          <div className="text-center">
            <button
              onClick={handleInterestsSubmit}
              disabled={selected.length === 0}
              className="jarvis-btn disabled:opacity-30 disabled:cursor-not-allowed"
            >
              CONTINUE
            </button>
          </div>
        </div>
      ) : step === "username" ? (
        <div className="w-full max-w-md animate-fade-up text-center">
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto rounded-full border border-primary/30 flex items-center justify-center animate-glow-pulse mb-6">
              <div className="w-8 h-8 rounded-full bg-primary/20 shadow-[0_0_30px_10px_hsl(190_100%_50%_/_0.2)]" />
            </div>
            <h1 className="font-orbitron text-2xl text-primary animate-text-glow tracking-[0.15em] mb-2">
              WHAT SHOULD I CALL YOU?
            </h1>
            <p className="text-muted-foreground text-sm font-rajdhani tracking-wider">
              Enter a name for JARVIS to address you by
            </p>
          </div>

          <form onSubmit={handleUsernameSubmit}>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="jarvis-input w-full text-center text-lg mb-6"
              placeholder="e.g. Tony"
              required
              autoFocus
            />
            <button type="submit" className="jarvis-btn">
              CONTINUE
            </button>
          </form>
        </div>
      ) : (
        <div className="w-full max-w-md animate-fade-up text-center">
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto rounded-full border border-primary/30 flex items-center justify-center animate-glow-pulse mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
            </div>
            <h1 className="font-orbitron text-2xl text-primary animate-text-glow tracking-[0.15em] mb-2">
              GEMINI API KEY
            </h1>
            <p className="text-muted-foreground text-sm font-rajdhani tracking-wider mb-1">
              Enter your free Google Gemini API key for AI capabilities
            </p>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/70 text-xs font-rajdhani tracking-wider hover:text-primary transition-colors underline"
            >
              Get free API key from Google AI Studio →
            </a>
          </div>

          <form onSubmit={handleApiKeySubmit}>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="jarvis-input w-full text-center mb-2"
              placeholder="AIza..."
              autoFocus
            />
            <p className="text-muted-foreground/50 text-xs font-rajdhani mb-6">
              Your key is stored securely and never shared
            </p>
            <div className="flex gap-3 justify-center">
              <button type="submit" className="jarvis-btn">
                {apiKey.trim() ? "INITIALIZE JARVIS" : "SKIP FOR NOW"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default OnboardingPage;
