import React, { useState, useEffect } from "react";
import { FaUser, FaBell, FaLock, FaPalette, FaMoon, FaSun, FaTrash } from "react-icons/fa";
import { useUser } from "../../util/UserContext";
import { toast } from "react-toastify";

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
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("Account");
  const [theme, setTheme] = useDarkMode();

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

  const handleSaveAccount = (e) => {
    e.preventDefault();
    // Simulate API call
    toast.success("Account info updated successfully!");
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
    <div className="min-h-screen bg-[#fafafa] dark:bg-gray-900 transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8 font-['Montserrat']">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 text-center lg:text-left">
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">Settings</h1>
          <p className="mt-3 text-sm font-bold text-gray-400 uppercase tracking-widest">Manage your account preferences and app behavior</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar */}
          <div className="w-full lg:w-72 flex-shrink-0">
            <nav className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-gray-50 dark:border-gray-700 p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-4 px-6 py-5 text-left transition-all rounded-[2rem] mb-1 last:mb-0 ${activeTab === tab.id
                    ? "bg-[#013e38] text-white font-black shadow-md transform scale-[1.02]"
                    : "bg-transparent text-gray-500 font-bold hover:bg-[#fafafa] dark:hover:bg-gray-700/50 hover:text-gray-900"
                    }`}
                >
                  <span className={`text-xl ${activeTab === tab.id ? "text-[#3bb4a1]" : ""}`}>{tab.icon}</span>
                  <span className="text-[11px] uppercase tracking-widest">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">

            {/* Account Settings */}
            {activeTab === "Account" && (
              <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 sm:p-10 border border-gray-50 dark:border-gray-700 animate-fadeIn">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-8 border-b border-gray-100 dark:border-gray-700 pb-6 tracking-tight">Account Settings</h2>
                <form onSubmit={handleSaveAccount} className="space-y-8">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Name</label>
                    <input
                      type="text"
                      className="w-full px-5 py-4 bg-[#fafafa] dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-[1.2rem] focus:bg-white focus:ring-2 focus:ring-[#3bb4a1] outline-none transition-all shadow-sm font-medium text-gray-900 dark:text-white"
                      value={settings.name}
                      onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Email</label>
                    <input
                      type="email"
                      className="w-full px-5 py-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-[1.2rem] text-gray-500 dark:text-gray-400 cursor-not-allowed font-medium shadow-inner"
                      value={settings.email}
                      disabled
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Password</label>
                      <button type="button" className="text-[10px] font-black uppercase tracking-widest text-[#3bb4a1] hover:text-[#013e38] transition-colors">Change</button>
                    </div>
                    <input
                      type="password"
                      value="********"
                      disabled
                      className="w-full px-5 py-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-[1.2rem] text-gray-500 dark:text-gray-400 cursor-not-allowed font-medium shadow-inner tracking-[0.3em]"
                    />
                  </div>
                  <div className="pt-6">
                    <button type="submit" className="w-full sm:w-auto px-10 py-4 bg-[#013e38] text-white font-black text-[10px] uppercase tracking-widest rounded-[1.2rem] hover:bg-[#3bb4a1] transition-all shadow-lg hover:shadow-xl">
                      Update Account Info
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === "Notifications" && (
              <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 sm:p-10 border border-gray-50 dark:border-gray-700 animate-fadeIn">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-8 border-b border-gray-100 dark:border-gray-700 pb-6 tracking-tight">Notification Settings</h2>
                <div className="space-y-8">
                  {[
                    { key: "emailParam", label: "Email Notifications", desc: "Receive emails about your account activity and updates." }, // key changed from 'email' to 'emailParam' to avoid conflict
                    { key: "inAppNotifications", label: "In-App Notifications", desc: "Get notified when someone connects or messages you." },
                    { key: "chatAlerts", label: "Chat Alerts", desc: "Receive push notifications for new messages." }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-6 rounded-[1.5rem] bg-[#fafafa] dark:bg-gray-700/30 border border-gray-100 dark:border-gray-600 transition-all hover:shadow-md">
                      <div>
                        <p className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-wider mb-1">{item.label}</p>
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-400">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => handleToggle(item.key)}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none shadow-inner ${settings[item.key] ? 'bg-[#3bb4a1]' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                      >
                        <span
                          className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform ${settings[item.key] ? 'translate-x-7' : 'translate-x-1'
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
              <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 sm:p-10 border border-gray-50 dark:border-gray-700 animate-fadeIn">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-8 border-b border-gray-100 dark:border-gray-700 pb-6 tracking-tight">Privacy Settings</h2>
                <div className="space-y-8">
                  <div className="flex items-center justify-between p-6 rounded-[1.5rem] bg-[#fafafa] dark:bg-gray-700/30 border border-gray-100 dark:border-gray-600 transition-all hover:shadow-md">
                    <div>
                      <p className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-wider mb-1">Show my profile publicly</p>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-400">Allow other users to find your profile in search and discovery.</p>
                    </div>
                    <button
                      onClick={() => handleToggle('publicProfile')}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none shadow-inner ${settings.publicProfile ? 'bg-[#3bb4a1]' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform ${settings.publicProfile ? 'translate-x-7' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>

                  <div className="pt-8 mt-4 border-t border-gray-100 dark:border-gray-700">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-red-500 mb-3">Danger Zone</h3>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-400 mb-6">Once you delete your account, there is no going back. Please be certain.</p>
                    <button onClick={handleDeleteAccount} className="px-8 py-4 bg-red-50 text-red-600 border border-red-100 hover:bg-red-500 hover:text-white hover:border-red-500 text-[10px] uppercase tracking-widest font-black rounded-[1.2rem] transition-all shadow-sm">
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
              <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 sm:p-10 border border-gray-50 dark:border-gray-700 animate-fadeIn">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-8 border-b border-gray-100 dark:border-gray-700 pb-6 tracking-tight">Appearance Settings</h2>

                <div className="space-y-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 rounded-[1.5rem] bg-[#fafafa] dark:bg-gray-700/30 border border-gray-100 dark:border-gray-600">
                    <div>
                      <p className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-wider mb-1">Theme</p>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-400">Customize how the app looks on your device.</p>
                    </div>
                    <div className="flex bg-gray-200 dark:bg-gray-800 p-1.5 rounded-[1.2rem] shadow-inner">
                      <button
                        onClick={() => setTheme("light")}
                        className={`flex items-center gap-3 px-6 py-3 rounded-[1rem] text-[10px] uppercase font-black tracking-widest transition-all ${theme === "light" ? "bg-white text-[#013e38] shadow-md" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                          }`}
                      >
                        <FaSun className="text-lg" /> Light
                      </button>
                      <button
                        onClick={() => setTheme("dark")}
                        className={`flex items-center gap-3 px-6 py-3 rounded-[1rem] text-[10px] uppercase font-black tracking-widest transition-all ${theme === "dark" ? "bg-gray-700 text-white shadow-md" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                          }`}
                      >
                        <FaMoon className="text-lg" /> Dark
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 rounded-[1.5rem] bg-[#fafafa] dark:bg-gray-700/30 border border-gray-100 dark:border-gray-600">
                    <div>
                      <p className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-wider mb-1">Primary Color</p>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-400">Select the main accent color for buttons and links.</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#013e38] ring-4 ring-offset-2 ring-[#3bb4a1] cursor-pointer shadow-md"></div>
                      <div className="w-10 h-10 rounded-full bg-blue-600 cursor-pointer opacity-50 hover:opacity-100 transition-all hover:scale-110 shadow-sm"></div>
                      <div className="w-10 h-10 rounded-full bg-purple-600 cursor-pointer opacity-50 hover:opacity-100 transition-all hover:scale-110 shadow-sm"></div>
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
      const axios = (await import("axios")).default;
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
    <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 sm:p-10 border border-gray-50 dark:border-gray-700 animate-fadeIn">
      <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-8 border-b border-gray-100 dark:border-gray-700 pb-6 tracking-tight">Role & Preferences</h2>

      <div className="space-y-8">
        {/* 1. Learning */}
        <div className="p-6 rounded-[1.5rem] bg-[#fafafa] dark:bg-gray-700/30 border border-gray-100 dark:border-gray-600">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4">Learning Goal</h3>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={() => setPreferences(p => ({ ...p, primaryGoal: "Skill Gain" }))}
              className={`flex-1 w-full px-6 py-4 rounded-[1.2rem] transition-all shadow-sm text-[10px] uppercase font-black tracking-widest ${preferences.primaryGoal === "Skill Gain" ? "bg-[#013e38] text-white ring-2 ring-offset-2 ring-[#013e38] dark:ring-offset-gray-800 transform scale-[1.02]" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"}`}
            >
              I want to Learn (Skill Gain)
            </button>
            <button
              onClick={() => setPreferences(p => ({ ...p, primaryGoal: "Peer Swap" }))}
              className={`flex-1 w-full px-6 py-4 rounded-[1.2rem] transition-all shadow-sm text-[10px] uppercase font-black tracking-widest ${preferences.primaryGoal === "Peer Swap" ? "bg-[#3bb4a1] text-white ring-2 ring-offset-2 ring-[#3bb4a1] dark:ring-offset-gray-800 transform scale-[1.02]" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"}`}
            >
              Peer Swap
            </button>
          </div>
        </div>

        {/* 2. Teaching */}
        <div className="p-6 rounded-[1.5rem] bg-[#fafafa] dark:bg-gray-700/30 border border-gray-100 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-wider mb-1">Teaching</p>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-400">Enable this to appear in the "Mentors" section.</p>
            </div>
            <button
              onClick={(e) => {
                setWantToTeach(!wantToTeach);
                if (wantToTeach) handleRateChange('mentorship', 0);
              }}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none shadow-inner flex-shrink-0 ${wantToTeach ? 'bg-[#3bb4a1]' : 'bg-gray-300 dark:bg-gray-600'
                }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform ${wantToTeach ? 'translate-x-7' : 'translate-x-1'
                  }`}
              />
            </button>
          </div>
          {wantToTeach && (
            <div className="mt-6 animate-fade-in bg-white dark:bg-gray-800 p-6 rounded-[1.2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
              <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Hourly Rate (Credits)</label>
              <div className="flex items-center gap-3">
                <span className="text-gray-400 font-black">₹</span>
                <input
                  type="number"
                  min="0"
                  value={preferences.rates.mentorship}
                  onChange={(e) => handleRateChange('mentorship', e.target.value)}
                  className="w-32 px-4 py-3 bg-[#fafafa] dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#3bb4a1] outline-none transition-all shadow-inner font-bold text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. Utilization */}
        <div className="p-6 rounded-[1.5rem] bg-white border border-gray-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:bg-gray-800 dark:border-gray-700 space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Utilization Services</h3>

          {/* Instant Help */}
          <div className="bg-[#fafafa] dark:bg-gray-700/30 p-6 rounded-[1.5rem] border border-gray-100 dark:border-gray-600 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <label className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-wider mb-1 cursor-pointer select-none">Instant Help Provider</label>
              <button
                onClick={() => handleUtilizationToggle("Instant Help")}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none shadow-inner flex-shrink-0 ${preferences.utilization.includes("Instant Help") ? 'bg-[#3bb4a1]' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform ${preferences.utilization.includes("Instant Help") ? 'translate-x-7' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>
            {preferences.utilization.includes("Instant Help") && (
              <div className="mt-5 animate-fade-in bg-white dark:bg-gray-800 p-5 rounded-[1.2rem] shadow-sm border border-gray-100 dark:border-gray-700">
                <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Rate per Session</label>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 font-black">₹</span>
                  <input
                    type="number" min="0"
                    value={preferences.rates.instantHelp}
                    onChange={(e) => handleRateChange('instantHelp', e.target.value)}
                    className="w-32 px-4 py-3 bg-[#fafafa] dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#3bb4a1] outline-none transition-all shadow-inner font-bold text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Expert */}
          <div className="bg-[#fafafa] dark:bg-gray-700/30 p-6 rounded-[1.5rem] border border-gray-100 dark:border-gray-600 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <label className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-wider mb-1 cursor-pointer select-none">Freelance Expert</label>
              <button
                onClick={() => handleUtilizationToggle("Hire Expert")}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none shadow-inner flex-shrink-0 ${preferences.utilization.includes("Hire Expert") ? 'bg-[#3bb4a1]' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform ${preferences.utilization.includes("Hire Expert") ? 'translate-x-7' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>
            {preferences.utilization.includes("Hire Expert") && (
              <div className="mt-5 animate-fade-in bg-white dark:bg-gray-800 p-5 rounded-[1.2rem] shadow-sm border border-gray-100 dark:border-gray-700">
                <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Hourly/Project Rate</label>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 font-black">₹</span>
                  <input
                    type="number" min="0"
                    value={preferences.rates.freelance}
                    onChange={(e) => handleRateChange('freelance', e.target.value)}
                    className="w-32 px-4 py-3 bg-[#fafafa] dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#3bb4a1] outline-none transition-all shadow-inner font-bold text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full sm:w-auto px-10 py-4 bg-[#013e38] text-white font-black text-[10px] uppercase tracking-widest rounded-[1.2rem] hover:bg-[#3bb4a1] transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  );


};
export default Settings;
