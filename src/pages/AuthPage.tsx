import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import HUDLoader from "@/components/HUDLoader";
import { playClickSound, playErrorSound, playLoginSound, resumeAudioContext } from "@/lib/soundEffects";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  const { signIn, signUp, profile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    resumeAudioContext();
    playClickSound();
    setErrorMsg("");
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          setLoading(false);
          playErrorSound();
          setErrorMsg(error);
          return;
        }
        playLoginSound();
        // Wait a moment for profile to load
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        if (password.length < 6) {
          setLoading(false);
          playErrorSound();
          setErrorMsg("Password must be at least 6 characters");
          return;
        }
        const { error } = await signUp(email, password);
        if (error) {
          setLoading(false);
          playErrorSound();
          setErrorMsg(error);
          return;
        }
        playLoginSound();
        // New user — go to onboarding
        setTimeout(() => {
          navigate("/onboarding");
        }, 1500);
      }
    } catch (err: any) {
      setLoading(false);
      playErrorSound();
      setErrorMsg(err.message || "Something went wrong");
    }
  };

  if (loading)
    return <HUDLoader text={isLogin ? "AUTHENTICATING..." : "INITIALIZING PROFILE..."} />;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(hsl(190 100% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(190 100% 50%) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      <div className="w-full max-w-md animate-fade-up">
        {/* JARVIS Header */}
        <h1 className="font-orbitron text-3xl text-center text-primary animate-text-glow tracking-[0.2em] mb-2">
          J.A.R.V.I.S.
        </h1>
        <p className="text-center text-muted-foreground text-sm mb-8 tracking-widest font-rajdhani">
          {isLogin ? "WELCOME BACK, SIR" : "NEW USER REGISTRATION"}
        </p>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-md border border-destructive/50 bg-destructive/10 text-center">
            <p className="text-sm font-rajdhani tracking-wider text-red-400">{errorMsg}</p>
          </div>
        )}

        {/* Auth Card */}
        <div className="glassmorphic rounded-xl p-8 animate-glow-pulse">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="font-orbitron text-xs tracking-widest text-muted-foreground mb-2 block">
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="jarvis-input w-full"
                placeholder="stark@avengers.com"
                required
              />
            </div>
            <div>
              <label className="font-orbitron text-xs tracking-widest text-muted-foreground mb-2 block">
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="jarvis-input w-full"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            <button type="submit" className="jarvis-btn w-full">
              {isLogin ? "ACCESS SYSTEM" : "CREATE PROFILE"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                playClickSound();
                setIsLogin(!isLogin);
                setErrorMsg("");
              }}
              className="text-muted-foreground hover:text-primary transition-colors text-sm font-rajdhani tracking-wider"
            >
              {isLogin ? "New user? Register here" : "Existing user? Login here"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
