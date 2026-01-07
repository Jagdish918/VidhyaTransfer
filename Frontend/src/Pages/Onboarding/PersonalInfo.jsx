import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { useUser } from "../../util/UserContext";
import "./Onboarding.css";

const PersonalInfo = ({ onComplete }) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
    country: "",
  });

  useEffect(() => {
    // Load existing data if available and set email from user context
    const loadData = async () => {
      // Set email from user context (read-only)
      if (user?.email) {
        setFormData(prev => ({ ...prev, email: user.email }));
      }

      try {
        const { data } = await axios.get("/onboarding/status");
        if (data.data.step > 0) {
          // Try to load user data
          try {
            const userData = await axios.get("/user/unregistered/getDetails");
            if (userData.data.success) {
              const userInfo = userData.data.data;
              setFormData({
                name: userInfo.name || "",
                email: userInfo.email || user?.email || "",
                age: userInfo.personalInfo?.age || userInfo.age || "",
                country: userInfo.personalInfo?.country || userInfo.country || "",
              });
            }
          } catch (error) {
            // Try registered user
            try {
              const userData = await axios.get("/user/registered/getDetails");
              if (userData.data.success) {
                const userInfo = userData.data.data;
                setFormData({
                  name: userInfo.name || "",
                  email: userInfo.email || user?.email || "",
                  age: userInfo.personalInfo?.age || userInfo.age || "",
                  country: userInfo.personalInfo?.country || userInfo.country || "",
                });
              }
            } catch (err) {
              // Keep email from user context
            }
          }
        }
      } catch (error) {
        // Error loading status, but keep email from user context
      }
    };
    loadData();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Email is read-only, don't allow changes
    if (name === "email") return;
    
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!formData.name.trim()) {
      toast.error("Full name is required");
      setLoading(false);
      return;
    }

    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Valid email is required");
      setLoading(false);
      return;
    }

    if (formData.age && (isNaN(formData.age) || parseInt(formData.age) < 1 || parseInt(formData.age) > 150)) {
      toast.error("Please enter a valid age");
      setLoading(false);
      return;
    }

    try {
      // Try registered user endpoint first (most common case)
      try {
        const { data } = await axios.post("/onboarding/registered/personal-info", formData);
        if (data.success) {
          toast.success("Personal info saved successfully");
          if (onComplete) {
            onComplete();
          } else {
            navigate("/onboarding/skills");
          }
          setLoading(false);
          return;
        }
      } catch (regError) {
        // Try unregistered user endpoint
        try {
          const { data } = await axios.post("/onboarding/personal-info", formData);
          if (data.success) {
            toast.success("Personal info saved successfully");
            if (onComplete) {
              onComplete();
            } else {
              navigate("/onboarding/skills");
            }
            setLoading(false);
            return;
          }
        } catch (unregError) {
          const errorMessage = unregError.response?.data?.message || regError.response?.data?.message || "Error saving personal info";
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error saving personal info");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <h2 className="onboarding-title">Onboarding - Step 1: Personal Info</h2>
        <p className="onboarding-subtitle">Tell us about yourself to get started.</p>

        <form onSubmit={handleSubmit} className="onboarding-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email address"
              required
              readOnly
              style={{ backgroundColor: "#F3F4F6", cursor: "not-allowed" }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="age">Age (Optional)</label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="Enter your age"
              min="1"
              max="150"
            />
          </div>

          <div className="form-group">
            <label htmlFor="country">Country</label>
            <input
              type="text"
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              placeholder="Enter your country"
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Saving..." : "Save & Continue"}
          </button>
        </form>

        <div className="progress-indicator">
          <div className="progress-bar">
            <div className="progress-step active"></div>
            <div className="progress-step"></div>
            <div className="progress-step"></div>
          </div>
          <p className="progress-text">Step 1 of 3</p>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfo;


