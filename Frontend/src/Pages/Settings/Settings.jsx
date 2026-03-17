import React, { useState, useEffect } from "react";
import { FaUser, FaBell, FaLock, FaPalette, FaMoon, FaSun, FaTrash } from "react-icons/fa";
import { useUser } from "../../util/UserContext";
import { toast } from "react-toastify";
import axios from "axios";

// Helper to manage dark mode
const useDarkMode = () => {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  return [theme, setTheme];
};

const Settings = () => {
  const { user, setUser } = useUser();
  const [activeTab, setActiveTab] = useState("Account");
  const [theme, setTheme] = useDarkMode();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordState, setPasswordState] = useState({ current: "", new: "", confirm: "" });

  // Settings State
  const [settings, setSettings] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    emailParam: true,
    inAppNotifications: true,
    chatAlerts: false,
    publicProfile: true,
  });

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    try {
      if (!settings.name.trim()) {
        toast.error("Name cannot be empty");
        return;
      }

      const payload = {
        name: settings.name,
        username: user.username,
        linkedinLink: user.linkedinLink || "",
        githubLink: user.githubLink || "",
        portfolioLink: user.portfolioLink || "",
        skillsProficientAt: user.skillsProficientAt || [],
        skillsToLearn: user.skillsToLearn || [],
        picture: user.picture || ""
      };

      const { data } = await axios.post("/user/registered/saveRegDetails", payload);

      if (data.success && data.data) {
        setUser(data.data);
        // Also update local storage sanitized data if needed
        try {
          const { storeSanitizedUserData } = await import("../../util/sanitizeUserData");
          storeSanitizedUserData(data.data);
        } catch (e) { console.warn("Could not update sanitised data", e); }
        toast.success("Account info updated successfully!");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update account info");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordState.new !== passwordState.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    try {
      const { data } = await axios.post("/auth/change-password", {
        currentPassword: passwordState.current,
        newPassword: passwordState.new
      });
      if (data.success) {
        toast.success("Password changed successfully!");
        setIsChangingPassword(false);
        setPasswordState({ current: "", new: "", confirm: "" });
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to change password");
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      toast.info("Account deletion processed (simulated).");
    }
  };

  const tabs = [
    { id: "Account", icon: <FaUser />, label: "Account" },
    { id: "Notifications", icon: <FaBell />, label: "Notifications" },
    { id: "Preferences", icon: <FaPalette />, label: "Preferences" }, // Using FaPalette as placeholder
    { id: "Privacy", icon: <FaLock />, label: "Privacy" },
    { id: "Appearance", icon: <FaMoon />, label: "Appearance" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your account preferences and app behavior</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <nav className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-6 py-4 text-left transition-colors border-l-4 ${activeTab === tab.id
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-600 text-blue-600 dark:text-blue-400 font-medium"
                    : "border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">

            {/* Account Settings */}
            {activeTab === "Account" && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sm:p-8 animate-fadeIn">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 border-b dark:border-gray-700 pb-4">Account Settings</h2>
                <form onSubmit={handleSaveAccount} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                      value={settings.name}
                      onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      value={settings.email}
                      disabled
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                      <button 
                        type="button" 
                        onClick={() => setIsChangingPassword(!isChangingPassword)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {isChangingPassword ? "Cancel" : "Change"}
                      </button>
                    </div>
                    {isChangingPassword ? (
                      <div className="space-y-3 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <input
                          type="password"
                          placeholder="Current Password"
                          value={passwordState.current}
                          onChange={(e) => setPasswordState({ ...passwordState, current: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <input
                          type="password"
                          placeholder="New Password (min 8 chars)"
                          value={passwordState.new}
                          onChange={(e) => setPasswordState({ ...passwordState, new: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <input
                          type="password"
                          placeholder="Confirm New Password"
                          value={passwordState.confirm}
                          onChange={(e) => setPasswordState({ ...passwordState, confirm: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button 
                          type="button" 
                          onClick={handleChangePassword}
                          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors shadow-sm text-sm"
                        >
                          Save New Password
                        </button>
                      </div>
                    ) : (
                      <input
                        type="password"
                        value="********"
                        disabled
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      />
                    )}
                  </div>
                  <div className="pt-4">
                    <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                      Update Account Info
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === "Notifications" && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sm:p-8 animate-fadeIn">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 border-b dark:border-gray-700 pb-4">Notification Settings</h2>
                <div className="space-y-6">
                  {[
                    { key: "emailParam", label: "Email Notifications", desc: "Receive emails about your account activity and updates." }, // key changed from 'email' to 'emailParam' to avoid conflict
                    { key: "inAppNotifications", label: "In-App Notifications", desc: "Get notified when someone connects or messages you." },
                    { key: "chatAlerts", label: "Chat Alerts", desc: "Receive push notifications for new messages." }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => handleToggle(item.key)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings[item.key] ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings[item.key] ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Privacy Settings */}
            {activeTab === "Privacy" && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sm:p-8 animate-fadeIn">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 border-b dark:border-gray-700 pb-4">Privacy Settings</h2>
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Show my profile publicly</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Allow other users to find your profile in search and discovery.</p>
                    </div>
                    <button
                      onClick={() => handleToggle('publicProfile')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings.publicProfile ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.publicProfile ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>

                  <div className="pt-6 border-t dark:border-gray-700">
                    <h3 className="text-lg font-medium text-red-600 mb-2">Danger Zone</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                    <button onClick={handleDeleteAccount} className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-medium rounded-lg transition-colors">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Settings */}
            {activeTab === "Preferences" && (
              <PreferenceSettings user={user} />
            )}

            {/* Appearance Settings */}
            {activeTab === "Appearance" && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sm:p-8 animate-fadeIn">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 border-b dark:border-gray-700 pb-4">Appearance</h2>

                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Theme</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Customize how the app looks on your device.</p>
                    </div>
                    <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                      <button
                        onClick={() => setTheme("light")}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${theme === "light" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 dark:text-gray-400"
                          }`}
                      >
                        <FaSun /> Light
                      </button>
                      <button
                        onClick={() => setTheme("dark")}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${theme === "dark" ? "bg-gray-600 text-white shadow-sm" : "text-gray-500 dark:text-gray-400"
                          }`}
                      >
                        <FaMoon /> Dark
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Primary Color</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Select the main accent color for buttons and links.</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-600 ring-2 ring-offset-2 ring-blue-600 cursor-pointer"></div>
                      <div className="w-8 h-8 rounded-full bg-green-600 cursor-pointer opacity-50 hover:opacity-100 transition-opacity"></div>
                      <div className="w-8 h-8 rounded-full bg-purple-600 cursor-pointer opacity-50 hover:opacity-100 transition-opacity"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const PreferenceSettings = ({ user }) => {
  const { setUser } = useUser();
  const [preferences, setPreferences] = useState({
    primaryGoal: user?.primaryGoal || "Peer Swap",
    utilization: user?.preferences?.utilization || [],
    rates: user?.preferences?.rates || { mentorship: 0, instantHelp: 0, freelance: 0 }
  });
  const [loading, setLoading] = useState(false);

  // Derived state for teaching toggle
  // If rate > 0, we assume they want to teach. But strictly we should check their intent.
  // For now, let's use rate > 0 as a proxy or just rely on them setting it.
  // Let's add a local toggle for better UX.
  const [wantToTeach, setWantToTeach] = useState(preferences.rates.mentorship > 0);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Re-use the onboarding endpoint or create a new settings update endpoint
      // Usually we use /registered/updateDetails or similar.
      // But here we might just need to patch preferences.
      // Let's assume we use the updatePreferences endpoint from onboarding controller logic OR create a specific one.
      // Since `updatePreferences` in backend is robust, we can use `/onboarding/registered/preferences`.
      // Check usage in Preferences.jsx: axios.post("/onboarding/registered/preferences", payload)

      const payload = { preferences, primaryGoal: preferences.primaryGoal };

      // Note: In real app, we should probably have a dedicated settings endpoint, but this might work if auth matches.
      // However, onboarding/preferences might force onboardingCompleted=true etc. which is fine.
      const { data } = await axios.post("/onboarding/registered/preferences", payload);

      if (data.success && data.data.user) {
        setUser(data.data.user);
        // Also update local storage sanitized data if needed
        try {
          const { storeSanitizedUserData } = await import("../../util/sanitizeUserData");
          storeSanitizedUserData(data.data.user);
        } catch (e) { console.warn("Could not update sanitised data", e); }
      }

      toast.success("Preferences updated successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleRateChange = (type, value) => {
    setPreferences(prev => ({
      ...prev,
      rates: { ...prev.rates, [type]: parseInt(value) || 0 }
    }));
  };

  const handleUtilizationToggle = (type) => {
    setPreferences(prev => {
      let newer = [...prev.utilization];
      if (newer.includes(type)) newer = newer.filter(t => t !== type);
      else newer.push(type);

      // Logic to reset rate if unchecked?
      // If we uncheck instant help, maybe reset rate to 0?
      // Optional, but good for data consistency.
      const newRates = { ...prev.rates };
      if (!newer.includes("Instant Help")) newRates.instantHelp = 0;
      if (!newer.includes("Hire Expert")) newRates.freelance = 0;

      return { ...prev, utilization: newer, rates: newRates };
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sm:p-8 animate-fadeIn">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 border-b dark:border-gray-700 pb-4">Role & Preferences</h2>

      <div className="space-y-8">
        {/* 1. Learning */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Learning Goal</h3>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPreferences(p => ({ ...p, primaryGoal: "Skill Gain" }))}
              className={`px-4 py-2 rounded-lg border transition-colors ${preferences.primaryGoal === "Skill Gain" ? "bg-green-50 border-green-500 text-green-700" : "border-gray-200 text-gray-600"}`}
            >
              I want to Learn (Skill Gain)
            </button>
            <button
              onClick={() => setPreferences(p => ({ ...p, primaryGoal: "Peer Swap" }))}
              className={`px-4 py-2 rounded-lg border transition-colors ${preferences.primaryGoal === "Peer Swap" ? "bg-blue-50 border-blue-500 text-blue-700" : "border-gray-200 text-gray-600"}`}
            >
              Peer Swap
            </button>
          </div>
        </div>

        {/* 2. Teaching */}
        <div className="border-t pt-4 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Teaching</h3>
              <p className="text-xs text-gray-500">Enable this to appear in the "Mentors" section.</p>
            </div>
            <input
              type="checkbox"
              checked={wantToTeach}
              onChange={(e) => {
                setWantToTeach(e.target.checked);
                if (!e.target.checked) handleRateChange('mentorship', 0);
              }}
              className="w-5 h-5 text-blue-600 rounded"
            />
          </div>
          {wantToTeach && (
            <div className="ml-4 animate-fade-in bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hourly Rate (Credits)</label>
              <input
                type="number"
                min="0"
                value={preferences.rates.mentorship}
                onChange={(e) => handleRateChange('mentorship', e.target.value)}
                className="w-32 px-3 py-2 border rounded-md"
              />
            </div>
          )}
        </div>

        {/* 3. Utilization */}
        <div className="border-t pt-4 dark:border-gray-700 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Utilization Services</h3>

          {/* Instant Help */}
          <div className="bg-gray-50 dark:bg-gray-700/20 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium text-gray-700 dark:text-gray-200">Instant Help Provider</label>
              <input
                type="checkbox"
                checked={preferences.utilization.includes("Instant Help")}
                onChange={() => handleUtilizationToggle("Instant Help")}
                className="w-4 h-4"
              />
            </div>
            {preferences.utilization.includes("Instant Help") && (
              <div className="mt-2">
                <label className="block text-xs text-gray-500 mb-1">Rate per Session</label>
                <input
                  type="number" min="0"
                  value={preferences.rates.instantHelp}
                  onChange={(e) => handleRateChange('instantHelp', e.target.value)}
                  className="w-24 px-2 py-1 border rounded text-sm"
                />
              </div>
            )}
          </div>

          {/* Expert */}
          <div className="bg-gray-50 dark:bg-gray-700/20 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium text-gray-700 dark:text-gray-200">Freelance Expert</label>
              <input
                type="checkbox"
                checked={preferences.utilization.includes("Hire Expert")}
                onChange={() => handleUtilizationToggle("Hire Expert")}
                className="w-4 h-4"
              />
            </div>
            {preferences.utilization.includes("Hire Expert") && (
              <div className="mt-2">
                <label className="block text-xs text-gray-500 mb-1">Hourly/Project Rate</label>
                <input
                  type="number" min="0"
                  value={preferences.rates.freelance}
                  onChange={(e) => handleRateChange('freelance', e.target.value)}
                  className="w-24 px-2 py-1 border rounded text-sm"
                />
              </div>
            )}
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            {loading ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  );


};
export default Settings;
