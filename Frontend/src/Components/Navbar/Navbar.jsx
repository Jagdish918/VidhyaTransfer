import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaGraduationCap, FaUser, FaSignOutAlt, FaCog, FaBars, FaTimes } from "react-icons/fa";
import { useUser } from "../../util/UserContext";
import axios from "axios";

import { useUserStore } from "../../store/useUserStore";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useUser();
  const { resetOnboarding } = useUserStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (!event.target.closest('.profile-dropdown-container')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleGetStarted = () => {
    navigate('/login');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = async () => {
    try {
      await axios.post("/auth/logout");
      localStorage.removeItem("userInfo");
      setUser(null);
      resetOnboarding();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.removeItem("userInfo");
      setUser(null);
      resetOnboarding();
      navigate("/");
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleScrollToSection = (e, sectionId) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setMobileMenuOpen(false);
  };

  const navLinks = user ? [
    { path: '/feed', label: 'Feed' },
    { path: '/peer-swap', label: 'Peer Swap' },
    { path: '/skill-gain', label: 'Skill Gain' },
    { path: '/resources', label: 'Resources' },
    { path: '/utilisation', label: 'Utilisation' },
    { path: '/chat', label: 'Chat' },
    { path: '/notifications', label: 'Notification' }
  ] : [
    { path: '/', label: 'Home' },
    { path: '/about_us', label: 'About' },
    { path: '#features', label: 'Features', isAnchor: true },
    { path: '#how-it-works', label: 'How It Works', isAnchor: true }
  ];

  if (location.pathname.startsWith("/onboarding")) {
    return null;
  }

  return (
    <nav className="bg-white/80 backdrop-blur-lg border-b border-dark-border sticky top-0 z-40 transition-all">
      <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to={user ? "/feed" : "/"} className="flex items-center gap-3 no-underline cursor-pointer group">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm group-hover:bg-indigo-100 transition-colors">
            <FaGraduationCap className="text-[20px] text-indigo-600" />
          </div>
          <span className="text-lg font-semibold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">VidhyaTransfer</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-2">
          {navLinks.filter(item => item.path !== '/notifications').map((item) => (
            item.isAnchor ? (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => handleScrollToSection(e, item.path.substring(1))}
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-indigo-700 hover:bg-slate-100 no-underline transition-colors duration-200 cursor-pointer"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer no-underline ${isActive(item.path)
                  ? 'text-indigo-700 bg-indigo-50 ring-1 ring-inset ring-indigo-100'
                  : 'text-slate-600 hover:text-indigo-700 hover:bg-slate-100'
                  }`}
              >
                {item.label}
              </Link>
            )
          ))}
        </div>

        {/* Action Buttons / Profile / Hamburger */}
        <div className="flex items-center gap-5 relative">
          {user ? (
            <div className="flex items-center gap-5">
              {/* Notification Icon */}
              <Link to="/notifications" className="relative p-2 rounded-full text-slate-600 hover:text-indigo-700 hover:bg-slate-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
                {/* Notification Red Dot */}
                <span className="absolute top-1 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
              </Link>

              {/* Credits Button */}
              <Link
                to="/credits"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 hover:bg-indigo-100 transition-colors no-underline font-medium"
              >
                <span className="text-sm">💎</span>
                <span className="text-sm">{user.credits || 0}</span>
              </Link>

              <div className="h-6 w-px bg-dark-border mx-1 hidden sm:block"></div>

              <div className="relative profile-dropdown-container">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 bg-transparent border-none cursor-pointer focus:outline-none hover:opacity-80 transition-opacity"
                >
                  <img
                    src={user.picture || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcToK4qEfbnd-RN82wdL2awn_PMviy_pelocqQ"}
                    alt="Profile"
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-dark-border shadow-sm"
                  />
                  <svg className={`w-4 h-4 text-slate-600 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                {showDropdown && (
                  <div className="absolute top-[calc(100%+12px)] right-0 bg-white border border-dark-border rounded-xl shadow-soft min-w-[220px] z-[1001] overflow-hidden py-2">
                    <div className="px-5 py-4 border-b border-dark-border bg-slate-50">
                      <p className="text-sm font-semibold text-slate-900 truncate mb-1">{user.name}</p>
                      <p className="text-xs text-slate-600 truncate">{user.email}</p>
                    </div>
                    {user.username ? (
                      <Link
                        to={`/profile/${user.username}`}
                        className="flex items-center w-full px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-700 transition-colors bg-transparent border-none text-left no-underline"
                        onClick={() => setShowDropdown(false)}
                      >
                        <FaUser className="mr-3 text-slate-600" />
                        Profile
                      </Link>
                    ) : (
                      <Link
                        to="/profile"
                        className="flex items-center w-full px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-700 transition-colors bg-transparent border-none text-left no-underline"
                        onClick={() => setShowDropdown(false)}
                      >
                        <FaUser className="mr-3 text-slate-600" />
                        Profile
                      </Link>
                    )}
                    <Link
                      to="/settings"
                      className="flex items-center w-full px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-700 transition-colors bg-transparent border-none text-left no-underline"
                      onClick={() => setShowDropdown(false)}
                    >
                      <FaCog className="mr-3 text-slate-600" />
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-5 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors bg-transparent border-none text-left cursor-pointer border-t border-dark-border mt-1"
                    >
                      <FaSignOutAlt className="mr-3 text-red-500" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
              <button
                className="md:hidden text-xl text-slate-600 p-2 hover:bg-slate-100 rounded-md"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <FaTimes /> : <FaBars />}
              </button>
            </div>
          ) : (
            <>
              <div className="hidden sm:flex items-center gap-4">
                <button
                  onClick={handleLogin}
                  className="px-4 py-2 bg-transparent text-slate-700 hover:text-indigo-700 rounded-lg text-sm font-medium transition-colors cursor-pointer border-none"
                >
                  Log in
                </button>
                <button
                  onClick={handleGetStarted}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm hover:bg-indigo-500 cursor-pointer border-none"
                >
                  Get Started
                </button>
              </div>
              <button
                className="md:hidden text-xl text-slate-600 p-2 hover:bg-slate-100 rounded-md"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <FaTimes /> : <FaBars />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-white/95 backdrop-blur-md z-[999] border-t border-dark-border h-screen">
          <div className="p-6 flex flex-col gap-2">
            {navLinks.map((item) => (
              item.isAnchor ? (
                <a
                  key={item.path}
                  href={item.path}
                  onClick={(e) => handleScrollToSection(e, item.path.substring(1))}
                  className="text-base font-medium text-slate-700 hover:text-indigo-700 no-underline py-4 border-b border-dark-border transition-colors"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-base font-medium no-underline py-4 border-b border-dark-border transition-colors ${isActive(item.path)
                    ? 'text-indigo-700'
                    : 'text-slate-700 hover:text-indigo-700'
                    }`}
                >
                  {item.label}
                </Link>
              )
            ))}
            {!user && (
              <div className="flex flex-col gap-4 mt-6">
                <button
                  onClick={handleLogin}
                  className="w-full py-3 bg-white border border-dark-border text-slate-700 rounded-lg text-sm font-medium transition-colors hover:bg-slate-50"
                >
                  Log in
                </button>
                <button
                  onClick={handleGetStarted}
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-indigo-500 transition-colors"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
