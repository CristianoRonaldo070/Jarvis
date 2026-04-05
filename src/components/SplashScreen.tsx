import { useEffect, useState } from "react";
import { playBootSound, resumeAudioContext } from "@/lib/soundEffects";

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [showText, setShowText] = useState(false);
  const [bootPlayed, setBootPlayed] = useState(false);

  useEffect(() => {
    // Play boot sound on first user interaction or after short delay
    const playBoot = () => {
      if (!bootPlayed) {
        resumeAudioContext();
        playBootSound();
        setBootPlayed(true);
      }
    };

    // Try to play immediately, and also on click for autoplay restrictions
    const timer = setTimeout(playBoot, 300);
    document.addEventListener("click", playBoot, { once: true });
    document.addEventListener("touchstart", playBoot, { once: true });

    const t1 = setTimeout(() => setShowText(true), 800);
    const t2 = setTimeout(onComplete, 3500);

    return () => {
      clearTimeout(timer);
      clearTimeout(t1);
      clearTimeout(t2);
      document.removeEventListener("click", playBoot);
      document.removeEventListener("touchstart", playBoot);
    };
  }, [onComplete, bootPlayed]);

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      {/* Arc Reactor */}
      <div className="relative w-48 h-48">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-arc-spin" />
        {/* Middle ring */}
        <div className="absolute inset-4 rounded-full border border-primary/50 animate-arc-spin-reverse" />
        {/* Inner ring with dashes */}
        <div className="absolute inset-8 rounded-full border-2 border-dashed border-primary/40 animate-arc-spin" />
        {/* Core glow */}
        <div className="absolute inset-12 rounded-full bg-primary/10 animate-orb-breathe flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-primary/20 shadow-[0_0_60px_20px_hsl(190_100%_50%_/_0.3)]" />
        </div>
        {/* Corner accents */}
        {[0, 90, 180, 270].map((deg) => (
          <div
            key={deg}
            className="absolute w-2 h-2 bg-primary rounded-full"
            style={{
              top: "50%",
              left: "50%",
              transform: `rotate(${deg}deg) translateY(-90px) translate(-50%, -50%)`,
            }}
          />
        ))}
      </div>

      {/* JARVIS Text */}
      {showText && (
        <div className="absolute bottom-1/3 animate-fade-up">
          <h1 className="font-orbitron text-4xl md:text-5xl tracking-[0.3em] text-primary animate-text-glow">
            J.A.R.V.I.S.
          </h1>
          <p className="text-center text-muted-foreground mt-3 font-rajdhani tracking-widest text-sm">
            JUST A RATHER VERY INTELLIGENT SYSTEM
          </p>
        </div>
      )}
    </div>
  );
};

export default SplashScreen;
