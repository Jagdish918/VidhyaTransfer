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
    { id: "Privacy", icon: <FaLock />, label: "Privacy" },
    { id: "Appearance", icon: <FaPalette />, label: "Appearance" },
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
                      <button type="button" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Change</button>
                    </div>
                    <input
                      type="password"
                      value="********"
                      disabled
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400"
                    />
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

export default Settings;
