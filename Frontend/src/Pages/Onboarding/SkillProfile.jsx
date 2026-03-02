import React, { useState, useEffect } from "react";
import { FaGraduationCap } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { skills } from "../Register/Skills";
import { useUserStore } from "../../store/useUserStore";

const SkillProfile = () => {
  const navigate = useNavigate();
  const { updateSkills, onboardingData } = useUserStore();
  const [loading, setLoading] = useState(false);

  // Local state for UI interaction
  const [currentSkills, setCurrentSkills] = useState(onboardingData.skills.learning || []);
  const [desiredSkills, setDesiredSkills] = useState(onboardingData.skills.teaching || []); // Note: store structure might be confusing, let's map correctly. 
  // Store has "learning" and "teaching". Usually "current skills" = what I can teach, "desired skills" = what I want to learn.
  // Checking existing code: 
  // currentSkills -> skillsProficientAt (Teaching)
  // desiredSkills -> skillsToLearn (Learning)

  const [selectedSkill, setSelectedSkill] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Programming");
  const [autoMatch, setAutoMatch] = useState(false);

  const categories = ["Programming", "Design", "Business", "Marketing", "Writing"];

  const proficiencyLevels = ["Beginner", "Intermediate", "Advanced", "Expert"];

  useEffect(() => {
    // If store is empty, try to populate from passed data or backend (simulated by just using store default)
    if (onboardingData.skills.teaching && onboardingData.skills.teaching.length > 0) {
      setCurrentSkills(onboardingData.skills.teaching);
    }
    if (onboardingData.skills.learning && onboardingData.skills.learning.length > 0) {
      setDesiredSkills(onboardingData.skills.learning);
    }
  }, [onboardingData.skills]);

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
        proficiency: "Intermediate",
      },
    ]);
    setSelectedSkill("");
  };

  const handleRemoveCurrentSkill = (index) => {
    setCurrentSkills(currentSkills.filter((_, i) => i !== index));
  };

  const handleUpdateProficiency = (index, proficiency, isCurrent) => {
    if (isCurrent) {
      const updated = [...currentSkills];
      updated[index].proficiency = proficiency;
      setCurrentSkills(updated);
    } else {
      const updated = [...desiredSkills];
      updated[index].proficiency = proficiency;
      setDesiredSkills(updated);
    }
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
      toast.error("Please add at least one current skill (what you can teach)");
      return;
    }
    if (desiredSkills.length === 0) {
      toast.error("Please add at least one desired skill (what you want to learn)");
      return;
    }

    setLoading(true);
    try {
      // Update store
      updateSkills({
        teaching: currentSkills,
        learning: desiredSkills
      });

      const payload = {
        currentSkills,
        desiredSkills,
      };

      // Backend sync
      try {
        await axios.post("/onboarding/registered/skill-profile", payload);
      } catch (err) {
        try {
          await axios.post("/onboarding/skill-profile", payload);
        } catch (inner) {
          console.warn("Backend sync failed", inner);
        }
      }

      toast.success("Skills saved!");
      navigate("/onboarding/preferences");
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          {/* Logo Header */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-[10px] bg-blue-50 flex items-center justify-center">
                <FaGraduationCap className="text-[28px] text-blue-500" />
              </div>
              <span className="text-2xl font-bold text-gray-800 font-sans">VidhyaTransfer</span>
            </div>
          </div>

          <h2 className="text-3xl font-extrabold text-gray-900">Your Skills</h2>
          <p className="mt-2 text-sm text-gray-600">Manage what you know and what you want to learn</p>
        </div>

        {/* Current Skills Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Current Skills (I can teach)</h3>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            >
              <option value="">Select a skill...</option>
              {skills.map((skill) => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full sm:w-1/3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button
              onClick={handleAddCurrentSkill}
              type="button"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add
            </button>
          </div>

          <div className="space-y-4">
            {currentSkills.map((skill, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-md border border-gray-200 relative group">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-md font-bold text-gray-800">{skill.name}</h4>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">{skill.category}</span>
                  </div>
                  <button onClick={() => handleRemoveCurrentSkill(index)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <span className="text-xl">×</span>
                  </button>
                </div>

                <div className="mt-3">
                  <label className="text-xs text-gray-500 block mb-1">Proficiency: {skill.proficiency}</label>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="1"
                    value={proficiencyLevels.indexOf(skill.proficiency)}
                    onChange={(e) => handleUpdateProficiency(index, proficiencyLevels[parseInt(e.target.value)], true)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Beginner</span>
                    <span>Expert</span>
                  </div>
                </div>
              </div>
            ))}
            {currentSkills.length === 0 && (
              <p className="text-center text-gray-400 italic py-4">No skills added yet.</p>
            )}
          </div>
        </div>

        {/* Desired Skills Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Desired Skills (I want to learn)</h3>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            >
              <option value="">Select a skill...</option>
              {skills.map((skill) => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>
            <button
              onClick={handleAddDesiredSkill}
              type="button"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Add
            </button>
          </div>

          <div className="space-y-4">
            {desiredSkills.map((skill, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-md border border-gray-200 relative group">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-md font-bold text-gray-800">#{skill.name}</h4>
                  <button onClick={() => handleRemoveDesiredSkill(index)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <span className="text-xl">×</span>
                  </button>
                </div>

                <div className="mt-3">
                  <label className="text-xs text-gray-500 block mb-1">Target Proficiency: {skill.proficiency}</label>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="1"
                    value={proficiencyLevels.indexOf(skill.proficiency)}
                    onChange={(e) => handleUpdateProficiency(index, proficiencyLevels[parseInt(e.target.value)], false)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                  />
                </div>
              </div>
            ))}
            {desiredSkills.length === 0 && (
              <p className="text-center text-gray-400 italic py-4">No desired skills added yet.</p>
            )}
          </div>

          <div className="mt-4 flex items-center">
            <input
              id="auto-match"
              type="checkbox"
              checked={autoMatch}
              onChange={(e) => setAutoMatch(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="auto-match" className="ml-2 block text-sm text-gray-900">
              Auto-match tutors for these skills
            </label>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="flex gap-4 w-full sm:w-auto">
            <button
              onClick={() => navigate("/onboarding/personal-info")}
              className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-8 shadow-sm transition-transform"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10 shadow-lg transition-transform hover:-translate-y-0.5"
            >
              {loading ? "Saving..." : "Save & Continue"}
            </button>
          </div>
        </div>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Step 2 of 3</span>
            </div>
          </div>
          <div className="mt-4 flex gap-1 justify-center">
            <div className="h-1.5 w-16 bg-blue-600 rounded-full"></div>
            <div className="h-1.5 w-16 bg-blue-600 rounded-full"></div>
            <div className="h-1.5 w-16 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillProfile;
