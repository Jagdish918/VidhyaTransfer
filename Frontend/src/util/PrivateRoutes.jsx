import { Outlet, Navigate } from "react-router-dom";
import { useUser } from "./UserContext";
import { useEffect, useState } from "react";
import axios from "axios";

const PrivateRoutes = () => {
  const { user } = useUser();
  const [checking, setChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const userInfo = localStorage.getItem("userInfo");
      
      // If user is in context or localStorage, allow access
      if (user || userInfo) {
        setIsAuthenticated(true);
        setChecking(false);
        return;
      }

      // Try to verify with backend (for cookie-based auth)
      try {
        try {
          const { data } = await axios.get("/user/registered/getDetails");
          if (data.success && data.data) {
            localStorage.setItem("userInfo", JSON.stringify(data.data));
            setIsAuthenticated(true);
            setChecking(false);
            return;
          }
        } catch (regError) {
          try {
            const { data } = await axios.get("/user/unregistered/getDetails");
            if (data.success && data.data) {
              localStorage.setItem("userInfo", JSON.stringify(data.data));
              setIsAuthenticated(true);
              setChecking(false);
              return;
            }
          } catch (unregError) {
            // No valid session
            setIsAuthenticated(false);
            setChecking(false);
          }
        }
      } catch (error) {
        setIsAuthenticated(false);
        setChecking(false);
      }
    };

    checkAuth();
  }, [user]);

  if (checking) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'var(--grey)'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Outlet />;
  }
  
  return <Navigate to="/login" replace />;
};

export default PrivateRoutes;
