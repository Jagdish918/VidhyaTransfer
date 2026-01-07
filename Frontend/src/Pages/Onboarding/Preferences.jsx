import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import "./Onboarding.css";

const Preferences = ({ onComplete }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    notifications: true,
    autoMatch: false,
    availability: 0,
    mode: "Online",
    skillsInterestedInLearning: [],
  });
  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    // Load existing preferences if available
    const loadPreferences = async () => {
      try {
        const userData = await axios.get("/user/registered/getDetails");
        if (userData.data.success && userData.data.data?.preferences) {
          setPreferences({
            notifications: userData.data.data.preferences.notifications ?? true,
            autoMatch: userData.data.data.preferences.autoMatch ?? false,
            availability: userData.data.data.preferences.availability ?? 0,
            mode: userData.data.data.preferences.mode ?? "Online",
            skillsInterestedInLearning: userData.data.data.preferences.skillsInterestedInLearning ?? [],
          });
        }
      } catch (error) {
        try {
          const userData = await axios.get("/user/unregistered/getDetails");
          if (userData.data.success && userData.data.data?.preferences) {
            setPreferences({
              notifications: userData.data.data.preferences.notifications ?? true,
              autoMatch: userData.data.data.preferences.autoMatch ?? false,
              availability: userData.data.data.preferences.availability ?? 0,
              mode: userData.data.data.preferences.mode ?? "Online",
              skillsInterestedInLearning: userData.data.data.preferences.skillsInterestedInLearning ?? [],
            });
          }
        } catch (err) {
          // Keep defaults
        }
      }
    };
    loadPreferences();
  }, []);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    if (type === "checkbox") {
      setPreferences((prev) => ({ ...prev, [name]: checked }));
    } else {
      setPreferences((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !preferences.skillsInterestedInLearning.includes(newSkill.trim())) {
      setPreferences((prev) => ({
        ...prev,
        skillsInterestedInLearning: [...prev.skillsInterestedInLearning, newSkill.trim()],
      }));
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setPreferences((prev) => ({
      ...prev,
      skillsInterestedInLearning: prev.skillsInterestedInLearning.filter((skill) => skill !== skillToRemove),
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Validate availability
      if (preferences.availability < 0) {
        toast.error("Availability must be a positive number");
        setLoading(false);
        return;
      }

      // Try registered user endpoint first (most common case)
      try {
        const { data } = await axios.post("/onboarding/registered/preferences", { preferences });
        if (data.success) {
          toast.success("Preferences saved successfully!");
          if (onComplete) {
            onComplete();
          } else {
            navigate("/");
          }
          setLoading(false);
          return;
        }
      } catch (regError) {
        // Try unregistered user endpoint
        try {
          const { data } = await axios.post("/onboarding/preferences", { preferences });
          if (data.success) {
            toast.success("Preferences saved successfully!");
            if (onComplete) {
              onComplete();
            } else {
              navigate("/");
            }
            setLoading(false);
            return;
          }
        } catch (unregError) {
          const errorMessage = unregError.response?.data?.message || regError.response?.data?.message || "Error saving preferences";
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error saving preferences");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <h2 className="onboarding-title">Onboarding - Step 3: Preferences</h2>
        <p className="onboarding-subtitle">Customize your experience</p>

        <div className="preferences-form">
          <div className="preference-item">
            <label className="preference-label">
              <input
                type="checkbox"
                name="notifications"
                checked={preferences.notifications}
                onChange={handleChange}
              />
              <span>Enable notifications</span>
            </label>
            <p className="preference-description">
              Receive updates about new matches, messages, and activity
            </p>
          </div>

          <div className="preference-item">
            <label className="preference-label">
              <input
                type="checkbox"
                name="autoMatch"
                checked={preferences.autoMatch}
                onChange={handleChange}
              />
              <span>Auto-match tutors</span>
            </label>
            <p className="preference-description">
              Automatically find and suggest tutors for skills you want to learn
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="availability">Availability (Hours per Week)</label>
            <input
              type="number"
              id="availability"
              name="availability"
              value={preferences.availability}
              onChange={handleChange}
              placeholder="Enter hours per week"
              min="0"
              max="168"
            />
          </div>

          <div className="form-group">
            <label htmlFor="mode">Mode</label>
            <select
              id="mode"
              name="mode"
              value={preferences.mode}
              onChange={handleChange}
              className="form-group select"
            >
              <option value="Online">Online</option>
              <option value="Instant Help">Instant Help</option>
              <option value="Events">Events</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="skillsLearning">Skills Interested in Learning</label>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <input
                type="text"
                id="skillsLearning"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Enter a skill"
                onKeyPress={(e) => e.key === "Enter" && handleAddSkill()}
                style={{ flex: 1 }}
              />
              <button type="button" onClick={handleAddSkill} className="btn-add-skill">
                Add
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {preferences.skillsInterestedInLearning.map((skill, index) => (
                <span
                  key={index}
                  style={{
                    background: "#3B82F6",
                    color: "white",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "20px",
                    fontSize: "0.875rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "white",
                      cursor: "pointer",
                      fontSize: "1rem",
                      padding: 0,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <button onClick={handleSubmit} className="btn-primary" disabled={loading}>
          {loading ? "Saving..." : "Complete Onboarding"}
        </button>

        <div className="progress-indicator">
          <div className="progress-bar">
            <div className="progress-step"></div>
            <div className="progress-step"></div>
            <div className="progress-step active"></div>
          </div>
          <p className="progress-text">Step 3 of 3</p>
        </div>
      </div>
    </div>
  );
};

export default Preferences;


