import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "./UserContext";
import axios from "axios";
import { toast } from "react-toastify";

const OnboardingGuard = ({ children }) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      // Check localStorage first
      const userInfo = localStorage.getItem("userInfo");
      if (!user && !userInfo) {
        // No user found, redirect to login
        navigate("/login", { replace: true });
        setChecking(false);
        return;
      }

      try {
        // Check onboarding status - try registered first (most common case)
        let onboardingData;
        try {
          const { data } = await axios.get("/onboarding/registered/status");
          onboardingData = data;
        } catch (error) {
          // Try unregistered endpoint
          try {
            const { data } = await axios.get("/onboarding/status");
            onboardingData = data;
          } catch (err) {
            console.error("Error checking onboarding:", err);
            // If error, allow access (might be a network issue or user is already registered)
            setChecking(false);
            return;
          }
        }

        if (onboardingData?.success) {
          const { completed, step } = onboardingData.data;

          // If not completed, redirect to appropriate step
          if (!completed) {
            if (step === 0) {
              navigate("/onboarding/personal-info", { replace: true });
            } else if (step === 1) {
              navigate("/onboarding/skills", { replace: true });
            } else if (step === 2) {
              navigate("/onboarding/preferences", { replace: true });
            } else {
              navigate("/onboarding/personal-info", { replace: true });
            }
          } else {
            // Onboarding completed, allow access to feed
            setChecking(false);
          }
        } else {
          // If can't get status, allow access
          setChecking(false);
        }
      } catch (error) {
        console.error("Error in onboarding check:", error);
        // On error, allow access to feed (don't block user)
        setChecking(false);
      }
    };

    // Small delay to ensure user context is loaded
    const timer = setTimeout(() => {
      checkOnboarding();
    }, 100);

    return () => clearTimeout(timer);
  }, [user, navigate]);

  if (checking) {
    return (
      <>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          background: 'var(--grey)'
        }}>
          <div style={{ textAlign: 'center', color: 'white', fontFamily: 'var(--secfont)' }}>
            <div style={{
              border: '3px solid rgba(59, 180, 161, 0.3)',
              borderTop: '3px solid var(--cyan)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <p>Checking onboarding status...</p>
          </div>
        </div>
      </>
    );
  }

  return children;
};

export default OnboardingGuard;

