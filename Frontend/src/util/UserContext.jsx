import React, { useState, useEffect, createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { storeSanitizedUserData, getSanitizedUserData } from "./sanitizeUserData";
import { io } from "socket.io-client";

const UserContext = createContext();

const UserContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [incomingInstantHelp, setIncomingInstantHelp] = useState(null);
  const [activeInstantHelpSession, setActiveInstantHelpSession] = useState(null);
  const [wasAccepted, setWasAccepted] = useState(false);
  const socketRef = React.useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const userInfoString = localStorage.getItem("userInfo");
      const hasSessionCookie = document.cookie.includes("hasSession=true");

      // If we don't have a hint from localStorage OR a cookie, don't ping the server.
      // This prevents the console from being flooded with 401 (Unauthorized) errors.
      if (!userInfoString && !hasSessionCookie) {
        setLoading(false);
        return;
      }

      if (userInfoString) {
        try {
          const userInfo = JSON.parse(userInfoString);
          setUser(userInfo);
          // Still set loading to false but we might want to refresh details 
          // to ensure the session is still active.
          setLoading(false);
          // If we have a session hint cookie, let's verify it in the background
          if (hasSessionCookie) {
            // Background refresh logic could go here
          }
          return;
        } catch (error) {
          console.error("Error parsing userInfo:", error);
        }
      }

      // Try to fetch user data from backend (for Google OAuth or cookie-based auth)
      try {
        // Try registered user first
        try {
          const { data } = await axios.get("/user/registered/getDetails");
          if (data.success && data.data) {
            storeSanitizedUserData(data.data);
            setUser(data.data);
            setLoading(false);
            return;
          }
        } catch (regError) {
          // If registered user fails, try unregistered user
          try {
            const { data } = await axios.get("/user/unregistered/getDetails");
            if (data.success && data.data) {
              storeSanitizedUserData(data.data);
              setUser(data.data);
              setLoading(false);
              return;
            }
          } catch (unregError) {
            // No user found, continue to check URL
          }
        }
      } catch (error) {
        console.log("No user session found");
      }

      setLoading(false);
      // Don't redirect logged-in users away from any page
      // Only redirect to login if on a protected route AND no user found
      const currentPath = window.location.pathname;
      const protectedRoutes = ["feed", "profile", "edit_profile", "peer-swap", "skill-gain", "resources", "utilisation", "onboarding"];

      // Only redirect if we're on a protected route and have no user
      if (protectedRoutes.some(route => currentPath.includes(route))) {
        const userInfo = localStorage.getItem("userInfo");
        if (currentPath !== "/login" && !user && !userInfo) {
          navigate("/login", { replace: true });
        }
      }
    };

    fetchUserData();
  }, []); // navigate is stable, no need to include in deps

  // Global Axios Interceptor for 403 (Banned) and 401 (Unauthorized) handling
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          if (error.response.status === 403) {
            // Check for specific ban message if possible
            const errorMessage = String(error.response.data?.message || "").toLowerCase();
            if (errorMessage.includes("banned") || errorMessage.includes("suspended")) {
              toast.error("Your account has been banned. You have been logged out.");
              setUser(null);
              localStorage.removeItem("userInfo");
              // Clear cookies just in case (though httpOnly can't be cleared from JS, backend should clear them)
              document.cookie = "hasSession=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
              navigate("/login");
            }
          } else if (error.response.status === 401) {
            // If token has expired or is invalid, force logout
            const errorMessage = String(error.response.data?.message || "").toLowerCase();
            if (errorMessage.includes("login") || errorMessage.includes("expired") || errorMessage.includes("invalid")) {
              toast.error("Session expired. Please log in again.");
              setUser(null);
              localStorage.removeItem("userInfo");
              document.cookie = "hasSession=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
              navigate("/login");
            }
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [navigate, setUser]);

  // ✅ Persist user state to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      storeSanitizedUserData(user);
    } else {
      localStorage.removeItem("userInfo");
    }
  }, [user]);

  // ✅ Socket Initialization — use user._id as stable dependency
  const userIdRef = React.useRef(null);
  
  useEffect(() => {
    const userId = user?._id;
    
    // User logged out
    if (!userId) {
      if (socketRef.current) {
        console.log("[Socket] User logged out, disconnecting...");
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        userIdRef.current = null;
      }
      return;
    }

    // Already connected for this user
    if (socketRef.current && userIdRef.current === userId) return;
    
    // Different user or first connection — clean up old if needed
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const backendUrl = import.meta.env.DEV 
      ? import.meta.env.VITE_LOCALHOST 
      : import.meta.env.VITE_SERVER_URL;

    console.log(`[Socket] Initializing connection to ${backendUrl} for user: ${user.username}...`);
    
    const newSocket = io(backendUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      forceNew: true
    });

    newSocket.on("connect", () => {
      console.log("[Socket] Connected! ID:", newSocket.id);
      newSocket.emit("setup", { userId: user._id, username: user.username });
    });

    newSocket.on("connected", () => {
      console.log("[Socket] Backend confirmed setup! User room joined.");
    });

    newSocket.on("connect_error", (err) => {
      console.error("[Socket] Connection Error:", err.message);
    });

    newSocket.on("callUser", (data) => {
      console.log("[Socket] INCOMING CALL from:", data.name, "signal:", data.signal ? "yes" : "no");
      setIncomingCall(data);
    });

    newSocket.on("callEnded", () => {
      console.log("[Socket] Call Ended signal received");
      setIncomingCall(null);
    });

    // ─── Instant Help Socket Events ───────────────────────────────────────
    newSocket.on("instantHelpRequest", (data) => {
      console.log("[Socket] INCOMING INSTANT HELP REQUEST from:", data.learner?.name);
      setIncomingInstantHelp(data);
    });

    newSocket.on("instantHelpAccepted", (data) => {
      console.log("[Socket] Instant help ACCEPTED by provider:", data.provider?.name);
      // Store session info so Chat.jsx can auto-select and start call
      setActiveInstantHelpSession({
        sessionId: data.sessionId,
        partnerId: data.provider?._id,
        partnerName: data.provider?.name,
        partnerPicture: data.provider?.picture,
        skill: data.skill,
        role: "learner",
      });
      import("react-toastify").then(({ toast }) => {
        toast.success(`${data.provider?.name} accepted your instant help request! Starting meeting...`);
      });
      window.dispatchEvent(new CustomEvent("instantHelpNavigateToChat", { detail: data }));
    });

    newSocket.on("instantHelpDeclined", (data) => {
      console.log("[Socket] Instant help DECLINED");
      import("react-toastify").then(({ toast }) => {
        toast.info(data.message || "Your instant help request was declined. Credits refunded.");
      });
      // Refresh user credits
      import("axios").then(({ default: axios }) => {
        axios.get("/user/registered/getDetails").then(({ data: userData }) => {
          if (userData.success && userData.data) {
            setUser(prev => ({ ...prev, credits: userData.data.credits }));
          }
        }).catch(() => {});
      });
    });

    newSocket.on("instantHelpSessionEnded", (data) => {
      console.log("[Socket] Instant help session ENDED");
      import("react-toastify").then(({ toast }) => {
        toast.info(data.message || "The instant help session has ended.");
      });
    });

    socketRef.current = newSocket;
    userIdRef.current = userId;
    setSocket(newSocket);

    return () => {
      // Only cleanup on true unmount (component destruction)
    };
  }, [user?._id]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  return (
    <UserContext.Provider value={{ 
      user, 
      setUser, 
      socket, 
      incomingCall, 
      setIncomingCall,
      incomingInstantHelp,
      setIncomingInstantHelp,
      activeInstantHelpSession,
      setActiveInstantHelpSession,
      wasAccepted,
      setWasAccepted
    }}>
      {children}
    </UserContext.Provider>
  );
};

const useUser = () => {
  return useContext(UserContext);
};

export { UserContextProvider, useUser };
