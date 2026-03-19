import React, { useState, useEffect } from "react";
import { FaUser, FaBell, FaLock, FaPalette, FaMoon, FaSun, FaTrash } from "react-icons/fa";
import { useUser } from "../../util/UserContext";
import { toast } from "react-toastify";
import axios from "axios";

// Settings constant state moved to functional component

const Settings = () => {
  const { user, setUser } = useUser();
  const [activeTab, setActiveTab] = useState("Account");
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
  ];

  return (
    <div className="min-h-screen bg-dark-bg py-4 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-500">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 text-center lg:text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-br from-cyan-500 to-emerald-500 bg-clip-text text-transparent tracking-tight">Settings</h1>
          <p className="mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Manage your account preferences and app behavior</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar */}
          <div className="w-full lg:w-72 flex-shrink-0">
            <nav className="bg-dark-card rounded-2xl shadow-card overflow-hidden border border-dark-border p-1.5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all rounded-xl mb-1 last:mb-0 ${activeTab === tab.id
                    ? "bg-cyan-500 text-dark-bg font-black shadow-lg shadow-cyan-500/20 transform scale-[1.02]"
                    : "bg-transparent text-slate-500 font-bold hover:bg-dark-hover hover:text-slate-900"
                    }`}
                >
                  <span className={`text-xl ${activeTab === tab.id ? "text-dark-bg" : "text-cyan-500"}`}>{tab.icon}</span>
                  <span className="text-[11px] uppercase tracking-widest">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-4">

            {/* Account Settings */}
            {activeTab === "Account" && (
              <div className="bg-dark-card rounded-[2.5rem] shadow-card p-6 border border-dark-border animate-fadeIn">
                <h2 className="text-xl font-bold text-slate-900 mb-4 border-b border-dark-border pb-3 tracking-tight">Account Settings</h2>
                <form onSubmit={handleSaveAccount} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Name</label>
                    <input
                      type="text"
                      className="w-full px-5 py-2.5 bg-dark-bg border border-dark-border rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all shadow-sm font-medium text-slate-900"
                      value={settings.name}
                      onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Email</label>
                    <input
                      type="email"
                      className="w-full px-5 py-2.5 bg-slate-50 border border-dark-border rounded-xl text-slate-500 cursor-not-allowed font-medium shadow-inner"
                      value={settings.email}
                      disabled
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-slate-700">Password</label>
                      <button
                        type="button"
                        onClick={() => setIsChangingPassword(!isChangingPassword)}
                        className="text-sm text-cyan-500 hover:underline"
                      >
                        {isChangingPassword ? "Cancel" : "Change"}
                      </button>
                    </div>
                    {isChangingPassword ? (
                      <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-dark-border">
                        <input
                          type="password"
                          placeholder="Current Password"
                          value={passwordState.current}
                          onChange={(e) => setPasswordState({ ...passwordState, current: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-dark-border bg-white text-slate-900 focus:ring-2 focus:ring-cyan-500 outline-none"
                        />
                        <input
                          type="password"
                          placeholder="New Password (min 8 chars)"
                          value={passwordState.new}
                          onChange={(e) => setPasswordState({ ...passwordState, new: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-dark-border bg-white text-slate-900 focus:ring-2 focus:ring-cyan-500 outline-none"
                        />
                        <input
                          type="password"
                          placeholder="Confirm New Password"
                          value={passwordState.confirm}
                          onChange={(e) => setPasswordState({ ...passwordState, confirm: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-dark-border bg-white text-slate-900 focus:ring-2 focus:ring-cyan-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleChangePassword}
                          className="px-4 py-2 bg-cyan-500 text-dark-bg font-medium rounded-md hover:bg-cyan-600 transition-colors shadow-sm text-sm"
                        >
                          Save New Password
                        </button>
                      </div>
                    ) : (
                      <input
                        type="password"
                        value="********"
                        disabled
                        className="w-full px-4 py-3 rounded-lg border border-dark-border bg-slate-50 text-slate-500 cursor-not-allowed"
                      />
                    )}
                  </div>
                  <div className="pt-6">
                    <button type="submit" className="w-full sm:w-auto px-10 py-4 bg-cyan-500 text-dark-bg font-black text-[10px] uppercase tracking-widest rounded-[1.2rem] hover:bg-cyan-600 transition-all shadow-lg shadow-cyan-500/20 hover:shadow-xl">
                      Update Account Info
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === "Notifications" && (
              <div className="bg-dark-card rounded-[2.5rem] shadow-card p-6 border border-dark-border animate-fadeIn">
                <h2 className="text-2xl font-black text-slate-900 mb-8 border-b border-dark-border pb-6 tracking-tight">Notification Settings</h2>
                <div className="space-y-8">
                  {[
                    { key: "emailParam", label: "Email Notifications", desc: "Receive emails about your account activity and updates." }, // key changed from 'email' to 'emailParam' to avoid conflict
                    { key: "inAppNotifications", label: "In-App Notifications", desc: "Get notified when someone connects or messages you." },
                    { key: "chatAlerts", label: "Chat Alerts", desc: "Receive push notifications for new messages." }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-6 rounded-[1.5rem] bg-slate-50 border border-dark-border transition-all hover:shadow-md">
                      <div>
                        <p className="font-black text-slate-900 text-sm uppercase tracking-wider mb-1">{item.label}</p>
                        <p className="text-[10px] font-bold text-slate-500">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => handleToggle(item.key)}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none shadow-inner ${settings[item.key] ? 'bg-cyan-500' : 'bg-slate-200'
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
              <div className="bg-dark-card rounded-[2.5rem] shadow-card p-6 border border-dark-border animate-fadeIn">
                <h2 className="text-2xl font-black text-slate-900 mb-8 border-b border-dark-border pb-6 tracking-tight">Privacy Settings</h2>
                <div className="space-y-8">
                  <div className="flex items-center justify-between p-6 rounded-[1.5rem] bg-slate-50 border border-dark-border transition-all hover:shadow-md">
                    <div>
                      <p className="font-black text-slate-900 text-sm uppercase tracking-wider mb-1">Show my profile publicly</p>
                      <p className="text-[10px] font-bold text-slate-500">Allow other users to find your profile in search and discovery.</p>
                    </div>
                    <button
                      onClick={() => handleToggle('publicProfile')}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none shadow-inner ${settings.publicProfile ? 'bg-cyan-500' : 'bg-slate-200'
                        }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform ${settings.publicProfile ? 'translate-x-7' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>

                  <div className="pt-8 mt-4 border-t border-dark-border">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-red-500 mb-3">Danger Zone</h3>
                    <p className="text-[10px] font-bold text-slate-500 mb-6">Once you delete your account, there is no going back. Please be certain.</p>
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
      const { data } = await axios.post("/onboarding/preferences", payload);

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
    <div className="bg-dark-card rounded-[2.5rem] shadow-card p-6 border border-dark-border animate-fadeIn">
      <h2 className="text-2xl font-black text-slate-900 mb-8 border-b border-dark-border pb-6 tracking-tight">Role & Preferences</h2>

      <div className="space-y-8">
        {/* 1. Learning */}
        <div className="p-6 rounded-[1.5rem] bg-slate-50 border border-dark-border">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Learning Goal</h3>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={() => setPreferences(p => ({ ...p, primaryGoal: "Skill Gain" }))}
              className={`flex-1 w-full px-6 py-4 rounded-[1.2rem] transition-all shadow-sm text-[10px] uppercase font-black tracking-widest ${preferences.primaryGoal === "Skill Gain" ? "bg-cyan-900 text-white ring-2 ring-offset-2 ring-cyan-900 transform scale-[1.02]" : "bg-white text-slate-600 hover:bg-slate-50 border border-dark-border"}`}
            >
              I want to Learn (Skill Gain)
            </button>
            <button
              onClick={() => setPreferences(p => ({ ...p, primaryGoal: "Peer Swap" }))}
              className={`flex-1 w-full px-6 py-4 rounded-[1.2rem] transition-all shadow-sm text-[10px] uppercase font-black tracking-widest ${preferences.primaryGoal === "Peer Swap" ? "bg-cyan-500 text-dark-bg ring-2 ring-offset-2 ring-cyan-500 transform scale-[1.02]" : "bg-white text-slate-600 hover:bg-slate-50 border border-dark-border"}`}
            >
              Peer Swap
            </button>
          </div>
        </div>

        {/* 2. Teaching */}
        <div className="p-6 rounded-[1.5rem] bg-slate-50 border border-dark-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-black text-slate-900 text-sm uppercase tracking-wider mb-1">Teaching</p>
              <p className="text-[10px] font-bold text-slate-500">Enable this to appear in the "Mentors" section.</p>
            </div>
            <button
              onClick={(e) => {
                setWantToTeach(!wantToTeach);
                if (wantToTeach) handleRateChange('mentorship', 0);
              }}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none shadow-inner flex-shrink-0 ${wantToTeach ? 'bg-cyan-500' : 'bg-slate-200'
                }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform ${wantToTeach ? 'translate-x-7' : 'translate-x-1'
                  }`}
              />
            </button>
          </div>
          {wantToTeach && (
            <div className="mt-6 animate-fade-in bg-white p-6 rounded-[1.2rem] border border-dark-border shadow-sm">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Hourly Rate (Credits)</label>
              <div className="flex items-center gap-3">
                <span className="text-slate-400 font-black">₹</span>
                <input
                  type="number"
                  min="0"
                  value={preferences.rates.mentorship}
                  onChange={(e) => handleRateChange('mentorship', e.target.value)}
                  className="w-32 px-4 py-3 bg-dark-bg border border-dark-border rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all shadow-inner font-bold text-slate-900"
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 rounded-[1.5rem] bg-white border border-dark-border shadow-card space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Utilization Services</h3>

          {/* Instant Help */}
          <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-dark-border transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <label className="font-black text-slate-900 text-sm uppercase tracking-wider mb-1 cursor-pointer select-none">Instant Help Provider</label>
              <button
                onClick={() => handleUtilizationToggle("Instant Help")}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none shadow-inner flex-shrink-0 ${preferences.utilization.includes("Instant Help") ? 'bg-cyan-500' : 'bg-slate-200'
                  }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform ${preferences.utilization.includes("Instant Help") ? 'translate-x-7' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>
            {preferences.utilization.includes("Instant Help") && (
              <div className="mt-5 animate-fade-in bg-white p-5 rounded-[1.2rem] shadow-sm border border-dark-border">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Rate per Session</label>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 font-black">₹</span>
                  <input
                    type="number" min="0"
                    value={preferences.rates.instantHelp}
                    onChange={(e) => handleRateChange('instantHelp', e.target.value)}
                    className="w-32 px-4 py-3 bg-dark-bg border border-dark-border rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all shadow-inner font-bold text-slate-900"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Expert */}
          <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-dark-border transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <label className="font-black text-slate-900 text-sm uppercase tracking-wider mb-1 cursor-pointer select-none">Freelance Expert</label>
              <button
                onClick={() => handleUtilizationToggle("Hire Expert")}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none shadow-inner flex-shrink-0 ${preferences.utilization.includes("Hire Expert") ? 'bg-cyan-500' : 'bg-slate-200'
                  }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform ${preferences.utilization.includes("Hire Expert") ? 'translate-x-7' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>
            {preferences.utilization.includes("Hire Expert") && (
              <div className="mt-5 animate-fade-in bg-white p-5 rounded-[1.2rem] shadow-sm border border-dark-border">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Hourly/Project Rate</label>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 font-black">₹</span>
                  <input
                    type="number" min="0"
                    value={preferences.rates.freelance}
                    onChange={(e) => handleRateChange('freelance', e.target.value)}
                    className="w-32 px-4 py-3 bg-dark-bg border border-dark-border rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all shadow-inner font-bold text-slate-900"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-dark-border">
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full sm:w-auto px-10 py-4 bg-cyan-900 text-white font-black text-[10px] uppercase tracking-widest rounded-[1.2rem] hover:bg-cyan-950 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  );


};
export default Settings;
