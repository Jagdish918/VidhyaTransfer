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
  const [desiredSkills, setDesiredSkills] = useState(onboardingData.skills.teaching || []); 

  const [selectedSkill, setSelectedSkill] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Programming");
  const [autoMatch, setAutoMatch] = useState(false);

  const categories = ["Programming", "Design", "Business", "Marketing", "Writing"];
  const proficiencyLevels = ["Beginner", "Intermediate", "Advanced", "Expert"];

  useEffect(() => {
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
      updateSkills({
        teaching: currentSkills,
        learning: desiredSkills
      });

      const payload = {
        currentSkills,
        desiredSkills,
      };

      // Backend sync
      await axios.post("/onboarding/skill-profile", payload);

      toast.success("Skills saved!");
      navigate("/onboarding/preferences");
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
        <div className="text-center">
          {/* Logo Header */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shadow-sm">
                <FaGraduationCap className="text-3xl text-cyan-400" />
              </div>
              <span className="text-2xl font-bold text-slate-900 tracking-tight">VidhyaTransfer</span>
            </div>
          </div>

          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Your Skills</h2>
          <p className="mt-2 text-xs font-medium text-slate-600">Manage what you know and what you want to learn</p>
        </div>

        {/* Current Skills Section */}
        <div className="bg-dark-card p-6 md:p-8 rounded-3xl shadow-card border border-dark-border">
          <h3 className="text-lg font-bold text-slate-900 mb-6 tracking-tight">Current Skills (I can teach)</h3>

          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="block w-full rounded-xl bg-dark-bg border border-dark-border text-slate-800 shadow-sm focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 sm:text-sm p-3.5 outline-none transition-all"
            >
              <option value="" className="bg-dark-bg text-slate-600">Select a skill...</option>
              {skills.map((skill) => (
                <option key={skill} value={skill} className="bg-dark-card">{skill}</option>
              ))}
            </select>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full sm:w-1/3 rounded-xl bg-dark-bg border border-dark-border text-slate-800 shadow-sm focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 sm:text-sm p-3.5 outline-none transition-all"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-dark-card">{cat}</option>
              ))}
            </select>
            <button
              onClick={handleAddCurrentSkill}
              type="button"
              className="inline-flex justify-center items-center py-3.5 px-6 border border-cyan-500/20 shadow-sm text-xs font-bold uppercase tracking-widest rounded-xl text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-dark-bg transition-all"
            >
              Add
            </button>
          </div>

          <div className="space-y-4">
            {currentSkills.map((skill, index) => (
              <div key={index} className="bg-dark-bg p-5 rounded-2xl border border-dark-border relative group hover:border-cyan-500/30 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-base font-bold text-slate-800">{skill.name}</h4>
                    <span className="inline-block mt-2 text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{skill.category}</span>
                  </div>
                  <button onClick={() => handleRemoveCurrentSkill(index)} className="text-slate-600 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/10">
                    <span className="text-xl leading-none">×</span>
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-dark-border">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 block mb-3">Proficiency: <span className="text-cyan-400 ml-1">{skill.proficiency}</span></label>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="1"
                    value={proficiencyLevels.indexOf(skill.proficiency)}
                    onChange={(e) => handleUpdateProficiency(index, proficiencyLevels[parseInt(e.target.value)], true)}
                    className="w-full h-2 bg-dark-card rounded-lg appearance-none cursor-pointer accent-cyan-500 border border-dark-border"
                  />
                  <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-slate-600 mt-2">
                    <span>Beginner</span>
                    <span>Expert</span>
                  </div>
                </div>
              </div>
            ))}
            {currentSkills.length === 0 && (
              <p className="text-center text-[10px] uppercase font-bold tracking-widest text-slate-600 italic py-6">No skills added yet.</p>
            )}
          </div>
        </div>

        {/* Desired Skills Section */}
        <div className="bg-dark-card p-6 md:p-8 rounded-3xl shadow-card border border-dark-border">
          <h3 className="text-lg font-bold text-slate-900 mb-6 tracking-tight">Desired Skills (I want to learn)</h3>

          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="block w-full rounded-xl bg-dark-bg border border-dark-border text-slate-800 shadow-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 sm:text-sm p-3.5 outline-none transition-all"
            >
              <option value="" className="bg-dark-bg text-slate-600">Select a skill...</option>
              {skills.map((skill) => (
                <option key={skill} value={skill} className="bg-dark-card">{skill}</option>
              ))}
            </select>
            <button
              onClick={handleAddDesiredSkill}
              type="button"
              className="inline-flex justify-center items-center py-3.5 px-6 border border-purple-500/20 shadow-sm text-xs font-bold uppercase tracking-widest rounded-xl text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-dark-bg transition-all"
            >
              Add
            </button>
          </div>

          <div className="space-y-4">
            {desiredSkills.map((skill, index) => (
              <div key={index} className="bg-dark-bg p-5 rounded-2xl border border-dark-border relative group hover:border-purple-500/30 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-base font-bold text-slate-800">#{skill.name}</h4>
                  <button onClick={() => handleRemoveDesiredSkill(index)} className="text-slate-600 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/10">
                    <span className="text-xl leading-none">×</span>
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-dark-border">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 block mb-3">Target Proficiency: <span className="text-purple-400 ml-1">{skill.proficiency}</span></label>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="1"
                    value={proficiencyLevels.indexOf(skill.proficiency)}
                    onChange={(e) => handleUpdateProficiency(index, proficiencyLevels[parseInt(e.target.value)], false)}
                    className="w-full h-2 bg-dark-card rounded-lg appearance-none cursor-pointer accent-purple-500 border border-dark-border"
                  />
                  <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-slate-600 mt-2">
                    <span>Beginner</span>
                    <span>Expert</span>
                  </div>
                </div>
              </div>
            ))}
            {desiredSkills.length === 0 && (
              <p className="text-center text-[10px] uppercase font-bold tracking-widest text-slate-600 italic py-6">No desired skills added yet.</p>
            )}
          </div>

          <div className="mt-6 flex items-center p-4 bg-dark-bg rounded-xl border border-dark-border cursor-pointer" onClick={() => setAutoMatch(!autoMatch)}>
            <div className={`relative w-4 h-4 rounded border flex items-center justify-center transition-colors ${autoMatch ? 'bg-purple-500 border-purple-500' : 'bg-dark-card border-dark-border'}`}>
              <input
                id="auto-match"
                type="checkbox"
                checked={autoMatch}
                onChange={(e) => setAutoMatch(e.target.checked)}
                className="opacity-0 absolute inset-0 cursor-pointer"
              />
              {autoMatch && <span className="text-dark-bg text-[10px] font-black">✓</span>}
            </div>
            <label htmlFor="auto-match" className="ml-3 block text-sm font-bold text-slate-700 cursor-pointer">
              Auto-match tutors for these skills
            </label>
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button
              onClick={() => navigate("/onboarding/personal-info")}
              className="w-full sm:w-1/3 px-6 py-4 border border-dark-border text-xs font-bold uppercase tracking-widest rounded-xl text-slate-600 bg-dark-card hover:text-cyan-400 hover:border-cyan-500/30 hover:bg-slate-800 shadow-sm transition-all"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full sm:w-2/3 px-8 py-4 border border-transparent text-xs font-bold uppercase tracking-widest rounded-xl text-dark-bg bg-cyan-500 hover:bg-cyan-400 shadow-lg shadow-cyan-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save & Continue"}
            </button>
          </div>
        </div>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark-border" />
            </div>
            <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest">
              <span className="px-4 bg-dark-bg text-slate-600 border border-dark-border rounded-full py-1">Step 2 of 3</span>
            </div>
          </div>
          <div className="mt-6 flex gap-2 justify-center">
            <div className="h-1.5 w-16 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
            <div className="h-1.5 w-16 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
            <div className="h-1.5 w-16 bg-dark-border rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillProfile;
