import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import SplashScreen from "@/components/SplashScreen";

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  const onSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  useEffect(() => {
    if (!showSplash && !loading) {
      if (user) {
        // User is logged in — check if onboarding is complete
        if (profile?.username) {
          navigate("/dashboard");
        } else {
          navigate("/onboarding");
        }
      } else {
        navigate("/auth");
      }
    }
  }, [showSplash, loading, user, profile, navigate]);

  if (showSplash) return <SplashScreen onComplete={onSplashComplete} />;
  return null;
};

export default Index;
