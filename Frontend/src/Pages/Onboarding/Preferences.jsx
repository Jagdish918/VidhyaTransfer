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
    // Populate from store if available
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

      // utilization check (optional)

      // Rate validation if applicable
      if (primaryGoal === "Skill Gain" && wantToTeach && preferences.rates.mentorship < 0) {
        toast.error("Please enter a valid positive credit rate for teaching");
        setLoading(false);
        return;
      }

      // Additional validations
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

      // Backend sync
      let success = false;
      try {
        const { data } = await axios.post("/onboarding/registered/preferences", payload);
        if (data && data.data && data.data.user) {
          setUser(data.data.user);
          storeSanitizedUserData(data.data.user);
          success = true;
        }
      } catch (err) {
        try {
          // Fallback
          const { data } = await axios.post("/onboarding/preferences", payload);
          if (data && data.data && data.data.user) {
            setUser(data.data.user);
            storeSanitizedUserData(data.data.user);
            success = true;
          }
        } catch (inner) {
          console.warn("Backend sync failed", inner);
          const msg = inner.response?.data?.message || "Failed to save preferences";
          toast.error(msg);
          setLoading(false);
          return;
        }
      }

      if (success) {
        // Mark as complete locally and redirect
        completeOnboarding();
        toast.success("All set! Redirecting to feed...");
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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-xl mx-auto space-y-8">
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

          <h2 className="text-3xl font-extrabold text-gray-900">Preferences</h2>
          <p className="mt-2 text-sm text-gray-600">Customize your experience</p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-6">

          {/* Preference Sections */}

          {/* 1. Learning Preferences */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">1. Learning Focus</h3>
            <p className="text-sm text-gray-500 mb-4">Select this if you arrived here primarily to learn new skills.</p>

            <div
              onClick={() => setPrimaryGoal("Skill Gain")}
              className={`cursor-pointer p-4 rounded-lg border-2 transition-all flex items-start gap-3 ${primaryGoal === "Skill Gain" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-green-200"
                }`}
            >
              <div className="flex-shrink-0 mt-1">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${primaryGoal === "Skill Gain" ? "border-green-500 bg-green-500" : "border-gray-400"}`}>
                  {primaryGoal === "Skill Gain" && <div className="w-2 h-2 rounded-full bg-white"></div>}
                </div>
              </div>
              <div>
                <div className="font-semibold text-gray-900">I want to Learn</div>
                <div className="text-xs text-gray-500 mt-1">
                  We'll help you find mentors and peers. The skills you selected in the previous step are what you'll be learning.
                </div>
              </div>
            </div>
          </div>

          {/* 2. Teaching Preferences */}
          <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">2. Teaching Focus</h3>
            <p className="text-sm text-gray-500 mb-4">Share your expertise and earn credits. You can be both a learner and a teacher.</p>

            <div className="bg-white rounded-lg border border-gray-200 p-4 transition-all hover:border-blue-300">
              <div className="flex items-center mb-2">
                <input
                  id="wantToTeach"
                  type="checkbox"
                  checked={wantToTeach}
                  onChange={(e) => {
                    setWantToTeach(e.target.checked);
                    if (!e.target.checked) handleRateChange('mentorship', 0);
                  }}
                  className="focus:ring-blue-500 h-5 w-5 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="wantToTeach" className="ml-3 block text-base font-medium text-gray-900 cursor-pointer">
                  I want to Mentor/Teach others
                </label>
              </div>

              {wantToTeach && (
                <div className="ml-8 mt-3 animate-fade-in pl-4 border-l-2 border-blue-100">
                  <p className="text-sm text-gray-600 mb-3">
                    Great! Your profile will be listed in the <strong>Skill Gain (Mentors)</strong> section based on your proficient skills.
                  </p>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Set your Mentorship Rate (Credits/Hour)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={preferences.rates.mentorship}
                      onChange={(e) => handleRateChange('mentorship', e.target.value)}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-32 sm:text-sm border-gray-300 rounded-md p-2 border"
                      placeholder="e.g. 50"
                    />
                    <span className="text-gray-500 text-sm">credits</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Set to 0 if you want to volunteer for free.</p>
                </div>
              )}
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Toggles */}
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="notifications"
                  name="notifications"
                  type="checkbox"
                  checked={preferences.notifications}
                  onChange={handleChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="notifications" className="font-medium text-gray-700">Enable notifications</label>
                <p className="text-gray-500">Receive updates about new matches and messages.</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="autoMatch"
                  name="autoMatch"
                  type="checkbox"
                  checked={preferences.autoMatch}
                  onChange={handleChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="autoMatch" className="font-medium text-gray-700">Auto-match tutors</label>
                <p className="text-gray-500">Automatically suggest tutors for your desired skills.</p>
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Inputs */}
          <div>
            <label htmlFor="availability" className="block text-sm font-medium text-gray-700">Availability (Hours per Week)</label>
            <div className="mt-1">
              <input
                type="number"
                id="availability"
                name="availability"
                value={preferences.availability}
                onChange={handleChange}
                min="0"
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                placeholder="e.g. 10"
              />
            </div>
          </div>

          {/* 3. Utilization Options */}
          <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">3. Utilization & Services</h3>
            <p className="text-sm text-gray-500 mb-4">How else would you like to use VidhyaTransfer? (Optional)</p>

            <div className="space-y-4">
              {/* Instant Help */}
              <div className={`border rounded-lg p-4 transition-all ${preferences.utilization?.includes("Instant Help") ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-blue-200"}`}>
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="util-Instant Help"
                      type="checkbox"
                      checked={preferences.utilization?.includes("Instant Help")}
                      onChange={() => {
                        handleUtilizationChange("Instant Help");
                        if (preferences.utilization.includes("Instant Help")) handleRateChange('instantHelp', 0);
                      }}
                      className="focus:ring-blue-500 h-5 w-5 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm flex-1">
                    <label htmlFor="util-Instant Help" className="font-bold text-gray-800 cursor-pointer">Provide Instant Help</label>
                    <p className="text-gray-500 text-xs mt-1">Make yourself available for quick bug fixes or questions from others.</p>
                  </div>
                </div>
                {preferences.utilization?.includes("Instant Help") && (
                  <div className="ml-8 mt-3 animate-fade-in">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Rate per session (Credits)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={preferences.rates.instantHelp}
                        onChange={(e) => handleRateChange('instantHelp', e.target.value)}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-32 sm:text-xs border-gray-300 rounded-md p-2 border"
                        placeholder="e.g. 20"
                      />
                      <span className="text-xs text-gray-500">credits</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Hire Expert */}
              <div className={`border rounded-lg p-4 transition-all ${preferences.utilization?.includes("Hire Expert") ? "border-purple-400 bg-purple-50" : "border-gray-200 hover:border-purple-200"}`}>
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="util-Hire Expert"
                      type="checkbox"
                      checked={preferences.utilization?.includes("Hire Expert")}
                      onChange={() => {
                        handleUtilizationChange("Hire Expert");
                        if (preferences.utilization.includes("Hire Expert")) handleRateChange('freelance', 0);
                      }}
                      className="focus:ring-purple-500 h-5 w-5 text-purple-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm flex-1">
                    <label htmlFor="util-Hire Expert" className="font-bold text-gray-800 cursor-pointer">Work as an Expert/Freelancer</label>
                    <p className="text-gray-500 text-xs mt-1">Offer your services for larger projects or gigs.</p>
                  </div>
                </div>
                {preferences.utilization?.includes("Hire Expert") && (
                  <div className="ml-8 mt-3 animate-fade-in">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Hourly/Project Rate (Credits)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={preferences.rates.freelance}
                        onChange={(e) => handleRateChange('freelance', e.target.value)}
                        className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-32 sm:text-xs border-gray-300 rounded-md p-2 border"
                        placeholder="e.g. 100"
                      />
                      <span className="text-xs text-gray-500">credits</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Events */}
              <div className={`border rounded-lg p-4 transition-all ${preferences.utilization?.includes("Events") ? "border-amber-400 bg-amber-50" : "border-gray-200 hover:border-amber-200"}`}>
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="util-Events"
                      type="checkbox"
                      checked={preferences.utilization?.includes("Events")}
                      onChange={() => handleUtilizationChange("Events")}
                      className="focus:ring-amber-500 h-5 w-5 text-amber-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm flex-1">
                    <label htmlFor="util-Events" className="font-bold text-gray-800 cursor-pointer">Participate in Events</label>
                    <p className="text-gray-500 text-xs mt-1">Get notified about webinars, hackathons, and workshops.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Skills Tag Input */}
          <div>
            <label htmlFor="skillsLearning" className="block text-sm font-medium text-gray-700">Additional Interests (Optional)</label>
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                id="skillsLearning"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddSkill()}
                placeholder="Type and press Enter, e.g. 'Chess'"
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Add
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {preferences.skillsInterestedInLearning?.map((skill, index) => (
                <span key={index} className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="ml-1.5 inline-flex items-center justify-center text-blue-400 hover:text-blue-600 focus:outline-none"
                  >
                    <span className="sr-only">Remove {skill}</span>
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => navigate("/onboarding/skills")}
              className="w-1/2 flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-1/2 flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all"
            >
              {loading ? "Finishing..." : "Complete Onboarding"}
            </button>
          </div>
        </div>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Step 3 of 3</span>
            </div>
          </div>
          <div className="mt-4 flex gap-1 justify-center">
            <div className="h-1.5 w-16 bg-blue-600 rounded-full"></div>
            <div className="h-1.5 w-16 bg-blue-600 rounded-full"></div>
            <div className="h-1.5 w-16 bg-blue-600 rounded-full"></div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Preferences;


