import React, { useState, useEffect } from "react";
import { FaGraduationCap } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { useUser } from "../../util/UserContext";
import { useUserStore } from "../../store/useUserStore";
import { storeSanitizedUserData } from "../../util/sanitizeUserData";

const Preferences = () => {
  const navigate = useNavigate();
  const { updatePreferences, completeOnboarding, onboardingData } = useUserStore();
  const { setUser } = useUser();
  const [loading, setLoading] = useState(false);

  // Local state
  const [primaryGoal, setPrimaryGoal] = useState("Peer Swap");
  const [preferences, setPreferences] = useState({
    notifications: onboardingData.preferences.notifications ?? true,
    autoMatch: onboardingData.preferences.autoMatch ?? false,
    availability: onboardingData.preferences.availability ?? 0,
    utilization: onboardingData.preferences.utilization ?? [],
    rates: onboardingData.preferences.rates ?? { mentorship: 0, instantHelp: 0, freelance: 0 },
    skillsInterestedInLearning: onboardingData.preferences.skillsInterestedInLearning ?? [],
  });
  const [wantToTeach, setWantToTeach] = useState(false);
  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    setPreferences(prev => ({
      ...prev,
      ...onboardingData.preferences
    }));
  }, [onboardingData.preferences]);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setPreferences((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleUtilizationChange = (option) => {
    setPreferences((prev) => {
      const current = prev.utilization || [];
      if (current.includes(option)) {
        return { ...prev, utilization: current.filter(o => o !== option) };
      } else {
        return { ...prev, utilization: [...current, option] };
      }
    });
  };

  const handleRateChange = (type, value) => {
    setPreferences(prev => ({
      ...prev,
      rates: {
        ...prev.rates,
        [type]: parseInt(value) || 0
      }
    }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !preferences.skillsInterestedInLearning.includes(newSkill.trim())) {
      setPreferences((prev) => ({
        ...prev,
        skillsInterestedInLearning: [...(prev.skillsInterestedInLearning || []), newSkill.trim()],
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
      if (preferences.availability < 0) {
        toast.error("Availability must be a positive number");
        setLoading(false);
        return;
      }

      if (primaryGoal === "Skill Gain" && wantToTeach && preferences.rates.mentorship < 0) {
        toast.error("Please enter a valid positive credit rate for teaching");
        setLoading(false);
        return;
      }

      if (preferences.utilization) {
        if (preferences.utilization.includes("Instant Help") && preferences.rates.instantHelp < 0) {
          toast.error("Instant Help rate cannot be negative");
          setLoading(false);
          return;
        }
        if (preferences.utilization.includes("Hire Expert") && preferences.rates.freelance < 0) {
          toast.error("Freelance rate cannot be negative");
          setLoading(false);
          return;
        }
      }

      updatePreferences({ ...preferences, primaryGoal });

      const payload = { preferences, primaryGoal };
      
      const { data } = await axios.post("/onboarding/preferences", payload);
      
      if (data && data.success && data.data.user) {
        setUser(data.data.user);
        storeSanitizedUserData(data.data.user);
        completeOnboarding();
        toast.success("Onboarding complete! Welcome to VidhyaTransfer.");
        navigate("/feed");
      }

    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-xl mx-auto space-y-8 animate-fade-in">
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

          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Preferences</h2>
          <p className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-600">Customize your experience</p>
        </div>

        <div className="bg-dark-card p-6 md:p-10 rounded-3xl shadow-card border border-dark-border space-y-8">

          {/* 1. Learning Preferences */}
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-2 tracking-tight">1. Learning Focus</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-5">Select this if you arrived here primarily to learn new skills.</p>

            <div
              onClick={() => setPrimaryGoal("Skill Gain")}
              className={`cursor-pointer p-5 rounded-2xl border transition-all flex items-start gap-4 ${
                primaryGoal === "Skill Gain" ? "border-cyan-500 bg-cyan-500/10" : "border-dark-border bg-dark-bg hover:border-cyan-500/30"
              }`}
            >
              <div className="flex-shrink-0 mt-1">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                  primaryGoal === "Skill Gain" ? "border-cyan-500 bg-cyan-500" : "border-slate-600 bg-dark-bg"
                }`}>
                  {primaryGoal === "Skill Gain" && <div className="w-2 h-2 rounded-full bg-dark-bg"></div>}
                </div>
              </div>
              <div>
                <div className={`font-bold ${primaryGoal === "Skill Gain" ? "text-cyan-400" : "text-slate-800"}`}>I want to Learn</div>
                <div className="text-[11px] text-slate-600 mt-2 font-medium leading-relaxed">
                  We'll help you find mentors and peers. The skills you selected in the previous step are what you'll be learning.
                </div>
              </div>
            </div>
          </div>

          {/* 2. Teaching Preferences */}
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-2 tracking-tight">2. Teaching Focus</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-5">Share your expertise and earn credits.</p>

            <div className={`rounded-2xl border transition-all p-5 ${wantToTeach ? "border-cyan-500/50 bg-cyan-500/5" : "bg-dark-bg border-dark-border hover:border-cyan-500/30"}`}>
              <div className="flex items-center cursor-pointer" onClick={() => {
                setWantToTeach(!wantToTeach);
                if (wantToTeach) handleRateChange('mentorship', 0);
              }}>
                 <div className={`relative w-5 h-5 rounded border flex items-center justify-center transition-colors mr-4 ${wantToTeach ? 'bg-cyan-500 border-cyan-500' : 'bg-dark-card border-dark-border'}`}>
                    <input
                      id="wantToTeach"
                      type="checkbox"
                      checked={wantToTeach}
                      onChange={(e) => {
                        setWantToTeach(e.target.checked);
                        if (!e.target.checked) handleRateChange('mentorship', 0);
                      }}
                      className="opacity-0 absolute inset-0 cursor-pointer"
                    />
                    {wantToTeach && <span className="text-dark-bg text-xs font-black">✓</span>}
                 </div>
                <label htmlFor="wantToTeach" className={`block text-sm font-bold cursor-pointer ${wantToTeach ? "text-cyan-400" : "text-slate-800"}`}>
                  I want to Mentor/Teach others
                </label>
              </div>

              {wantToTeach && (
                <div className="ml-9 mt-5 pl-5 border-l-2 border-cyan-500/20 animate-fade-in">
                  <p className="text-[11px] text-slate-600 mb-4 font-medium leading-relaxed">
                    Great! Your profile will be listed in the <strong className="text-slate-800">Skill Gain (Mentors)</strong> section based on your proficient skills.
                  </p>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">Set your Mentorship Rate (Credits/Hour)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      value={preferences.rates.mentorship}
                      onChange={(e) => handleRateChange('mentorship', e.target.value)}
                      className="w-32 px-4 py-3 bg-dark-card border border-dark-border rounded-xl shadow-sm text-slate-800 placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 sm:text-sm transition-all"
                      placeholder="e.g. 50"
                    />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">credits</span>
                  </div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mt-2">Set to 0 if you want to volunteer for free.</p>
                </div>
              )}
            </div>
          </div>

          <hr className="border-dark-border" />

          {/* Toggles */}
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex items-center h-5 mt-0.5">
                <input
                  id="notifications"
                  name="notifications"
                  type="checkbox"
                  checked={preferences.notifications}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-dark-border bg-dark-card text-cyan-500 focus:ring-cyan-500/50 focus:ring-offset-dark-bg transition-all"
                />
              </div>
              <div className="ml-4">
                <label htmlFor="notifications" className="text-sm font-bold text-slate-800 cursor-pointer">Enable notifications</label>
                <p className="text-[11px] font-medium text-slate-600 mt-1">Receive updates about new matches and messages.</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5 mt-0.5">
                <input
                  id="autoMatch"
                  name="autoMatch"
                  type="checkbox"
                  checked={preferences.autoMatch}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-dark-border bg-dark-card text-cyan-500 focus:ring-cyan-500/50 focus:ring-offset-dark-bg transition-all"
                />
              </div>
              <div className="ml-4">
                <label htmlFor="autoMatch" className="text-sm font-bold text-slate-800 cursor-pointer">Auto-match tutors</label>
                <p className="text-[11px] font-medium text-slate-600 mt-1">Automatically suggest tutors for your desired skills.</p>
              </div>
            </div>
          </div>

          <hr className="border-dark-border" />

          {/* Inputs */}
          <div>
            <label htmlFor="availability" className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">Availability (Hours per Week)</label>
            <input
              type="number"
              id="availability"
              name="availability"
              value={preferences.availability}
              onChange={handleChange}
              min="0"
              className="w-full sm:w-1/2 px-4 py-3 bg-dark-bg border border-dark-border rounded-xl shadow-sm text-slate-800 placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 sm:text-sm transition-all"
              placeholder="e.g. 10"
            />
          </div>

          {/* 3. Utilization Options */}
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-2 tracking-tight">3. Utilization & Services</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-5">How else would you like to use VidhyaTransfer? (Optional)</p>

            <div className="space-y-4">
              {/* Instant Help */}
              <div className={`rounded-xl border transition-all p-4 ${preferences.utilization?.includes("Instant Help") ? "border-blue-500/50 bg-blue-500/10" : "bg-dark-bg border-dark-border hover:border-blue-500/30"}`}>
                <div className="flex items-start">
                  <div className="flex items-center h-5 mt-0.5">
                    <input
                      id="util-Instant-Help"
                      type="checkbox"
                      checked={preferences.utilization?.includes("Instant Help")}
                      onChange={() => {
                        handleUtilizationChange("Instant Help");
                        if (preferences.utilization.includes("Instant Help")) handleRateChange('instantHelp', 0);
                      }}
                      className="w-4 h-4 rounded border-dark-border bg-dark-card text-blue-500 focus:ring-blue-500/50 focus:ring-offset-dark-bg transition-all"
                    />
                  </div>
                  <div className="ml-4 flex-1">
                    <label htmlFor="util-Instant-Help" className={`text-sm font-bold cursor-pointer transition-colors ${preferences.utilization?.includes("Instant Help") ? "text-blue-400" : "text-slate-800"}`}>Provide Instant Help</label>
                    <p className="text-[11px] font-medium text-slate-600 mt-1">Make yourself available for quick bug fixes or questions from others.</p>
                  </div>
                </div>
                {preferences.utilization?.includes("Instant Help") && (
                  <div className="ml-8 mt-4 animate-fade-in pl-4 border-l-2 border-blue-500/20">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">Rate per session (Credits)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        value={preferences.rates.instantHelp}
                        onChange={(e) => handleRateChange('instantHelp', e.target.value)}
                        className="w-32 px-4 py-2.5 bg-dark-card border border-dark-border rounded-xl shadow-sm text-slate-800 placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm transition-all"
                        placeholder="e.g. 20"
                      />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">credits</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Hire Expert */}
              <div className={`rounded-xl border transition-all p-4 ${preferences.utilization?.includes("Hire Expert") ? "border-purple-500/50 bg-purple-500/10" : "bg-dark-bg border-dark-border hover:border-purple-500/30"}`}>
                <div className="flex items-start">
                  <div className="flex items-center h-5 mt-0.5">
                    <input
                      id="util-Hire-Expert"
                      type="checkbox"
                      checked={preferences.utilization?.includes("Hire Expert")}
                      onChange={() => {
                        handleUtilizationChange("Hire Expert");
                        if (preferences.utilization.includes("Hire Expert")) handleRateChange('freelance', 0);
                      }}
                      className="w-4 h-4 rounded border-dark-border bg-dark-card text-purple-500 focus:ring-purple-500/50 focus:ring-offset-dark-bg transition-all"
                    />
                  </div>
                  <div className="ml-4 flex-1">
                    <label htmlFor="util-Hire-Expert" className={`text-sm font-bold cursor-pointer transition-colors ${preferences.utilization?.includes("Hire Expert") ? "text-purple-400" : "text-slate-800"}`}>Work as an Expert/Freelancer</label>
                    <p className="text-[11px] font-medium text-slate-600 mt-1">Offer your services for larger projects or gigs.</p>
                  </div>
                </div>
                {preferences.utilization?.includes("Hire Expert") && (
                  <div className="ml-8 mt-4 animate-fade-in pl-4 border-l-2 border-purple-500/20">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">Hourly/Project Rate (Credits)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        value={preferences.rates.freelance}
                        onChange={(e) => handleRateChange('freelance', e.target.value)}
                        className="w-32 px-4 py-2.5 bg-dark-card border border-dark-border rounded-xl shadow-sm text-slate-800 placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 text-sm transition-all"
                        placeholder="e.g. 100"
                      />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">credits</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Events */}
              <div className={`rounded-xl border transition-all p-4 ${preferences.utilization?.includes("Events") ? "border-amber-500/50 bg-amber-500/10" : "bg-dark-bg border-dark-border hover:border-amber-500/30"}`}>
                <div className="flex items-start">
                  <div className="flex items-center h-5 mt-0.5">
                    <input
                      id="util-Events"
                      type="checkbox"
                      checked={preferences.utilization?.includes("Events")}
                      onChange={() => handleUtilizationChange("Events")}
                      className="w-4 h-4 rounded border-dark-border bg-dark-card text-amber-500 focus:ring-amber-500/50 focus:ring-offset-dark-bg transition-all"
                    />
                  </div>
                  <div className="ml-4 flex-1">
                    <label htmlFor="util-Events" className={`text-sm font-bold cursor-pointer transition-colors ${preferences.utilization?.includes("Events") ? "text-amber-400" : "text-slate-800"}`}>Participate in Events</label>
                    <p className="text-[11px] font-medium text-slate-600 mt-1">Get notified about webinars, hackathons, and workshops.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-dark-border" />

          {/* Skills Tag Input */}
          <div>
            <label htmlFor="skillsLearning" className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">Additional Interests (Optional)</label>
            <div className="mt-2 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                id="skillsLearning"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddSkill()}
                placeholder="Type and press Enter, e.g. 'Chess'"
                className="flex-1 px-4 py-3.5 bg-dark-bg border border-dark-border rounded-xl shadow-sm text-slate-800 placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 sm:text-sm transition-all"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="inline-flex justify-center items-center px-8 py-3.5 border border-cyan-500/20 text-xs font-bold uppercase tracking-widest rounded-xl text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-dark-bg transition-all"
              >
                Add
              </button>
            </div>
            {preferences.skillsInterestedInLearning && preferences.skillsInterestedInLearning.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2.5 p-4 rounded-xl border border-dark-border bg-dark-bg">
                {preferences.skillsInterestedInLearning.map((skill, index) => (
                  <span key={index} className="inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-2 inline-flex items-center justify-center text-cyan-600 hover:text-red-400 focus:outline-none transition-colors"
                    >
                      <span className="text-sm leading-none">×</span>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-dark-border">
            <button
              onClick={() => navigate("/onboarding/skills")}
              className="w-full sm:w-1/3 flex justify-center py-4 px-4 border border-dark-border rounded-xl shadow-sm text-xs font-bold uppercase tracking-widest text-slate-600 bg-dark-card hover:bg-slate-800 hover:text-cyan-400 hover:border-cyan-500/30 focus:outline-none transition-all"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full sm:w-2/3 flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-cyan-500/20 text-xs font-bold uppercase tracking-widest text-dark-bg bg-cyan-500 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-dark-bg disabled:opacity-50 transition-all hover:-translate-y-0.5"
            >
              {loading ? "Finishing..." : "Complete Onboarding"}
            </button>
          </div>
        </div>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark-border" />
            </div>
            <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest">
              <span className="px-4 bg-dark-bg text-slate-600 border border-dark-border py-1 rounded-full shadow-sm">Step 3 of 3</span>
            </div>
          </div>
          <div className="mt-6 flex gap-2 justify-center">
            <div className="h-1.5 w-16 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
            <div className="h-1.5 w-16 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
            <div className="h-1.5 w-16 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Preferences;
