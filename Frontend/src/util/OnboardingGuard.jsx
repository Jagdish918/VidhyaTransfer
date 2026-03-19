import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "./UserContext";
import axios from "axios";
import { toast } from "react-toastify";

const OnboardingGuard = ({ children }) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false); // Changed to false by default

  useEffect(() => {
    const checkOnboarding = async () => {
      // Check localStorage first for quick access
      const userInfo = localStorage.getItem("userInfo");

      if (!user && !userInfo) {
        // No user found, redirect to login
        navigate("/login", { replace: true });
        return;
      }

      // Parse user info from localStorage
      let parsedUser = null;
      try {
        parsedUser = userInfo ? JSON.parse(userInfo) : user;
      } catch (e) {
        parsedUser = user;
      }

      // If user has onboardingCompleted flag in localStorage, skip API check
      if (parsedUser?.onboardingCompleted === true) {
        return;
      }

      // If user has username, they're likely a registered user who completed onboarding
      if (parsedUser?.username) {
        return;
      }

      // Only make API call if we're unsure about onboarding status
      setChecking(true);
      try {
        // Check onboarding status
        let onboardingData;
        try {
          const { data } = await axios.get("/onboarding/status");
          onboardingData = data;
        } catch (error) {
          console.error("Error checking onboarding:", error);
          // If error, allow access (might be a network issue or user is already registered)
          setChecking(false);
          return;
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

    checkOnboarding();
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
          background: '#f9fafb'
        }}>
          <div style={{ textAlign: 'center', color: '#374151' }}>
            <div style={{
              border: '3px solid rgba(59, 130, 246, 0.3)',
              borderTop: '3px solid #3b82f6',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <p>Verifying access...</p>
          </div>
        </div>
      </>
    );
  }

  return children;
};

export default OnboardingGuard;
