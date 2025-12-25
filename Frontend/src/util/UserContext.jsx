import React, { useState, useEffect, createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

const UserContext = createContext();

const UserContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const userInfoString = localStorage.getItem("userInfo");
      
      if (userInfoString) {
        try {
          const userInfo = JSON.parse(userInfoString);
          setUser(userInfo);
          setLoading(false);
        } catch (error) {
          console.error("Error parsing userInfo:", error);
          setLoading(false);
        }
      } else {
        // Try to fetch user data from backend (for Google OAuth or cookie-based auth)
        try {
          // Try registered user first
          try {
            const { data } = await axios.get("/user/registered/getDetails");
            if (data.success && data.data) {
              localStorage.setItem("userInfo", JSON.stringify(data.data));
              setUser(data.data);
              setLoading(false);
              return;
            }
          } catch (regError) {
            // If registered user fails, try unregistered user
            try {
              const { data } = await axios.get("/user/unregistered/getDetails");
              if (data.success && data.data) {
                localStorage.setItem("userInfo", JSON.stringify(data.data));
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
        const temp = window.location.href.split("/");
        const url = temp.pop();
        if (url !== "about_us" && url !== "#why-skill-swap" && url !== "" && url !== "login") {
          // Don't redirect if already on login page
          if (url !== "login") {
            navigate("/login");
          }
        }
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>;
};

const useUser = () => {
  return useContext(UserContext);
};

export { UserContextProvider, useUser };
