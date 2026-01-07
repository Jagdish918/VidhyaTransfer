import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { skills } from "../Register/Skills";
import "./Onboarding.css";

const SkillProfile = ({ onComplete }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentSkills, setCurrentSkills] = useState([]);
  const [desiredSkills, setDesiredSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Programming");
  const [selectedProficiency, setSelectedProficiency] = useState("Intermediate");
  const [autoMatch, setAutoMatch] = useState(false);

  const categories = ["Programming", "Design", "Business", "Marketing", "Writing"];

  const proficiencyLevels = {
    current: ["Beginner", "Intermediate", "Advanced", "Expert"],
    desired: ["Beginner", "Intermediate", "Advanced", "Expert"],
  };

  useEffect(() => {
    // Load existing skills if available
    const loadSkills = async () => {
      try {
        const userData = await axios.get("/user/unregistered/getDetails");
        if (userData.data.success && userData.data.data) {
          if (userData.data.data.skillsProficientAt?.length > 0) {
            setCurrentSkills(userData.data.data.skillsProficientAt);
          }
          if (userData.data.data.skillsToLearn?.length > 0) {
            setDesiredSkills(userData.data.data.skillsToLearn);
          }
        }
      } catch (error) {
        try {
          const userData = await axios.get("/user/registered/getDetails");
          if (userData.data.success && userData.data.data) {
            if (userData.data.data.skillsProficientAt?.length > 0) {
              setCurrentSkills(userData.data.data.skillsProficientAt);
            }
            if (userData.data.data.skillsToLearn?.length > 0) {
              setDesiredSkills(userData.data.data.skillsToLearn);
            }
          }
        } catch (err) {
          console.log("Could not load skills");
        }
      }
    };
    loadSkills();
  }, []);

  const handleAddCurrentSkill = () => {
    if (!selectedSkill || selectedSkill === "Select some skill") {
      toast.error("Please select a skill");
      return;
    }

    if (currentSkills.find((s) => s.name === selectedSkill)) {
      toast.error("Skill already added");
      return;
    }

    setCurrentSkills([
      ...currentSkills,
      {
        name: selectedSkill,
        category: selectedCategory,
        proficiency: selectedProficiency,
      },
    ]);
    setSelectedSkill("");
  };

  const handleRemoveCurrentSkill = (index) => {
    setCurrentSkills(currentSkills.filter((_, i) => i !== index));
  };

  const handleUpdateProficiency = (index, proficiency) => {
    const updated = [...currentSkills];
    updated[index].proficiency = proficiency;
    setCurrentSkills(updated);
  };

  const handleAddDesiredSkill = () => {
    if (!selectedSkill || selectedSkill === "Select some skill") {
      toast.error("Please select a skill");
      return;
    }

    if (desiredSkills.find((s) => s.name === selectedSkill)) {
      toast.error("Skill already added");
      return;
    }

    setDesiredSkills([
      ...desiredSkills,
      {
        name: selectedSkill,
        proficiency: "Beginner",
        autoMatchTutors: autoMatch,
      },
    ]);
    setSelectedSkill("");
  };

  const handleRemoveDesiredSkill = (index) => {
    setDesiredSkills(desiredSkills.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (currentSkills.length === 0) {
      toast.error("Please add at least one current skill");
      return;
    }

    if (desiredSkills.length === 0) {
      toast.error("Please add at least one desired skill");
      return;
    }

    setLoading(true);
    try {
      // Try registered user endpoint first (most common case)
      try {
        const { data } = await axios.post("/onboarding/registered/skill-profile", {
          currentSkills,
          desiredSkills,
        });
        if (data.success) {
          toast.success("Skill profile saved successfully");
          if (onComplete) {
            onComplete();
          } else {
            navigate("/onboarding/preferences");
          }
          setLoading(false);
          return;
        }
      } catch (regError) {
        // If registered fails, try unregistered endpoint
        try {
          const { data } = await axios.post("/onboarding/skill-profile", {
            currentSkills,
            desiredSkills,
          });
          if (data.success) {
            toast.success("Skill profile saved successfully");
            if (onComplete) {
              onComplete();
            } else {
              navigate("/onboarding/preferences");
            }
            setLoading(false);
            return;
          }
        } catch (unregError) {
          // Both failed, show error
          const errorMessage = unregError.response?.data?.message || regError.response?.data?.message || "Error saving skill profile";
          toast.error(errorMessage);
          if (errorMessage.includes("Please Login") || errorMessage.includes("Unauthorized")) {
            localStorage.removeItem("userInfo");
            navigate("/login");
          }
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Error saving skill profile";
      toast.error(errorMessage);
      if (errorMessage.includes("Please Login") || errorMessage.includes("Unauthorized")) {
        localStorage.removeItem("userInfo");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-container">
      <div className="skills-wrapper">
        <h2 className="onboarding-title">Your Skills</h2>
        <p className="onboarding-subtitle">Manage what you know and what you want to learn</p>

        <div className="skills-container">
          {/* Current Skills Section */}
          <div className="skills-section">
            <h3 className="skills-section-title">Current Skills</h3>
            <div className="skill-input-group">
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="skill-select"
              >
                <option>Select some skill</option>
                {skills.map((skill) => (
                  <option key={skill} value={skill}>
                    {skill}
                  </option>
                ))}
              </select>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="category-select"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <button type="button" onClick={handleAddCurrentSkill} className="btn-add-skill">
                Add Skill
              </button>
            </div>

            {currentSkills.map((skill, index) => (
              <div key={index} className="skill-item">
                <div className="skill-header">
                  <span className="skill-name">{skill.name}</span>
                  <span className="skill-category-badge">{skill.category}</span>
                  <button
                    onClick={() => handleRemoveCurrentSkill(index)}
                    className="btn-remove-skill"
                    type="button"
                  >
                    ×
                  </button>
                </div>
                <div className="proficiency-slider-container">
                  <input
                    type="range"
                    min="0"
                    max="4"
                    value={proficiencyLevels.current.indexOf(skill.proficiency)}
                    onChange={(e) =>
                      handleUpdateProficiency(
                        index,
                        proficiencyLevels.current[parseInt(e.target.value)]
                      )
                    }
                    className="proficiency-slider"
                  />
                  <div className="slider-labels">
                    {proficiencyLevels.current.map((level) => (
                      <span
                        key={level}
                        className={
                          level === skill.proficiency ? "slider-label active" : "slider-label"
                        }
                      >
                        {level}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {currentSkills.length === 0 && (
              <p className="empty-state">No skills added yet. Add your first skill above!</p>
            )}

            <p className="tip-text">Tip: drag slider to adjust proficiency.</p>
          </div>

          {/* Desired Skills Section */}
          <div className="skills-section">
            <h3 className="skills-section-title">Skills You Want to Learn</h3>
            <div className="skill-input-group">
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="skill-select"
              >
                <option>Select some skill</option>
                {skills.map((skill) => (
                  <option key={skill} value={skill}>
                    {skill}
                  </option>
                ))}
              </select>
              <button type="button" onClick={handleAddDesiredSkill} className="btn-add-skill">
                Add Desired Skill
              </button>
            </div>

            {desiredSkills.map((skill, index) => (
              <div key={index} className="skill-item">
                <div className="skill-header">
                  <span className="skill-name">#{skill.name}</span>
                  <button
                    onClick={() => handleRemoveDesiredSkill(index)}
                    className="btn-remove-skill"
                    type="button"
                  >
                    ×
                  </button>
                </div>
                <div className="proficiency-slider-container">
                  <input
                    type="range"
                    min="0"
                    max="4"
                    value={proficiencyLevels.desired.indexOf(skill.proficiency)}
                    onChange={(e) => {
                      const updated = [...desiredSkills];
                      updated[index].proficiency =
                        proficiencyLevels.desired[parseInt(e.target.value)];
                      setDesiredSkills(updated);
                    }}
                    className="proficiency-slider"
                  />
                  <div className="slider-labels">
                    {proficiencyLevels.desired.map((level) => (
                      <span
                        key={level}
                        className={
                          level === skill.proficiency ? "slider-label active" : "slider-label"
                        }
                      >
                        {level}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {desiredSkills.length === 0 && (
              <p className="empty-state">No desired skills added yet. Add your first skill above!</p>
            )}

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={autoMatch}
                onChange={(e) => setAutoMatch(e.target.checked)}
              />
              Auto-match tutors for these skills
            </label>
          </div>
        </div>

        <div className="onboarding-actions">
          <button onClick={handleSubmit} className="btn-primary" disabled={loading}>
            {loading ? "Saving..." : "Save & Continue"}
          </button>
        </div>

        <div className="progress-indicator">
          <div className="progress-bar">
            <div className="progress-step"></div>
            <div className="progress-step active"></div>
            <div className="progress-step"></div>
          </div>
          <p className="progress-text">Step 2 of 3</p>
        </div>
      </div>
    </div>
  );
};

export default SkillProfile;


