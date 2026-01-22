import React, { useState, useEffect } from "react";
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
  const [preferences, setPreferences] = useState({
    notifications: onboardingData.preferences.notifications ?? true,
    autoMatch: onboardingData.preferences.autoMatch ?? false,
    availability: onboardingData.preferences.availability ?? 0,
    mode: onboardingData.preferences.mode ?? "",
    skillsInterestedInLearning: onboardingData.preferences.skillsInterestedInLearning ?? [], // This seems redundant with "Desired Skills" but keeping it to match existing backend
  });
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

      if (!preferences.mode) {
        toast.error("Please select a learning mode");
        setLoading(false);
        return;
      }

      updatePreferences(preferences);

      // Backend sync
      let success = false;
      try {
        const { data } = await axios.post("/onboarding/registered/preferences", { preferences });
        if (data && data.data && data.data.user) {
          setUser(data.data.user);
          storeSanitizedUserData(data.data.user);
          success = true;
        }
      } catch (err) {
        try {
          // Fallback
          const { data } = await axios.post("/onboarding/preferences", { preferences });
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
          <h2 className="text-3xl font-extrabold text-gray-900">Preferences</h2>
          <p className="mt-2 text-sm text-gray-600">Customize your experience</p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-6">

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

          <div>
            <label htmlFor="mode" className="block text-sm font-medium text-gray-700">Preferred Learning Mode</label>
            <div className="mt-1">
              <select
                id="mode"
                name="mode"
                value={preferences.mode}
                onChange={handleChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
              >
                <option value="" disabled>Select Mode</option>
                <option value="Online">Online</option>
                <option value="Instant Help">Instant Help</option>
                <option value="Events">Events</option>
              </select>
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

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all"
          >
            {loading ? "Finishing..." : "Complete Onboarding"}
          </button>
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


