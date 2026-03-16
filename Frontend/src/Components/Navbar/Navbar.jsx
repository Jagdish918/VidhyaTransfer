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
    <nav className="bg-white border-b border-gray-200 py-3 sticky top-0 z-40 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to={user ? "/feed" : "/"} className="flex items-center gap-3 no-underline cursor-pointer group">
          <div className="w-10 h-10 rounded-[10px] bg-blue-50 flex items-center justify-center">
            <FaGraduationCap className="text-[28px] text-blue-500" />
          </div>
          <span className="text-2xl font-bold text-gray-800 font-sans">VidhyaTransfer</span>
        </Link>

        {/* Desktop Navigation Links - Notification removed */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.filter(item => item.path !== '/notifications').map((item) => (
            item.isAnchor ? (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => handleScrollToSection(e, item.path.substring(1))}
                className="text-base font-medium text-gray-500 hover:text-blue-500 no-underline transition-colors duration-200 cursor-pointer"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.path}
                to={item.path}
                className={`text-base font-medium no-underline transition-colors duration-200 cursor-pointer ${isActive(item.path) ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'
                  }`}
              >
                {item.label}
              </Link>
            )
          ))}
        </div>

        {/* Action Buttons / Profile / Hamburger */}
        <div className="flex items-center gap-4 relative">
          {user ? (
            <div className="flex items-center gap-6">
              {/* Notification Icon */}
              <Link to="/notifications" className="relative text-gray-500 hover:text-blue-500 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
                {/* Notification Red Dot */}
                <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white transform translate-x-1/4 -translate-y-1/4"></span>
              </Link>

              {/* Credits Button */}
              <Link
                to="/credits"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 rounded-full border border-amber-200 hover:shadow-sm transition-all text-decoration-none"
              >
                <span className="text-lg">💎</span>
                <span className="font-bold text-sm">{user.credits || 0}</span>
              </Link>

              <div className="h-8 w-px bg-gray-200 mx-2 hidden sm:block"></div>

              <div className="relative profile-dropdown-container">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 bg-transparent border-none cursor-pointer focus:outline-none"
                >
                  <img
                    src={user.picture || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcToK4qEfbnd-RN82wdL2awn_PMviy_pelocqQ"}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                  />
                  <svg className={`w-4 h-4 text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                {showDropdown && (
                  <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl min-w-[200px] z-[1001] overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    {user.username ? (
                      <Link
                        to={`/profile/${user.username}`}
                        className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors bg-transparent border-none text-left no-underline"
                        onClick={() => setShowDropdown(false)}
                      >
                        <FaUser className="mr-3 text-gray-400" />
                        Profile
                      </Link>
                    ) : (
                      <Link
                        to="/profile"
                        className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors bg-transparent border-none text-left no-underline"
                        onClick={() => setShowDropdown(false)}
                      >
                        <FaUser className="mr-3 text-gray-400" />
                        Profile
                      </Link>
                    )}
                    <Link
                      to="/settings"
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors bg-transparent border-none text-left no-underline"
                      onClick={() => setShowDropdown(false)}
                    >
                      <FaCog className="mr-3 text-gray-400" />
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors bg-transparent border-none text-left cursor-pointer font-medium border-t border-gray-50"
                    >
                      <FaSignOutAlt className="mr-3" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
              <button
                className="md:hidden text-2xl text-gray-600 p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <FaTimes /> : <FaBars />}
              </button>
            </div>
          ) : (
            <>
              <div className="hidden sm:flex items-center gap-3">
                <button
                  onClick={handleLogin}
                  className="px-5 py-2.5 bg-transparent text-gray-700 hover:bg-gray-100 rounded-lg text-base font-medium transition-all duration-200 cursor-pointer border-none"
                >
                  Login
                </button>
                <button
                  onClick={handleGetStarted}
                  className="px-6 py-2.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-3xl text-base font-semibold transition-all duration-200 shadow-md hover:-translate-y-0.5 hover:shadow-blue-500/40 cursor-pointer border-none"
                >
                  Get Started
                </button>
              </div>
              <button
                className="md:hidden text-2xl text-gray-600 p-2"
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
        <div className="md:hidden fixed inset-0 top-[73px] bg-white z-[999] animate-fadeIn">
          <div className="p-6 flex flex-col gap-4">
            {navLinks.map((item) => (
              item.isAnchor ? (
                <a
                  key={item.path}
                  href={item.path}
                  onClick={(e) => handleScrollToSection(e, item.path.substring(1))}
                  className="text-xl font-semibold text-gray-800 no-underline py-2 border-b border-gray-100"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-xl font-semibold no-underline py-2 border-b border-gray-100 ${isActive(item.path) ? 'text-blue-500' : 'text-gray-800'
                    }`}
                >
                  {item.label}
                </Link>
              )
            ))}
            {!user && (
              <div className="flex flex-col gap-3 mt-4">
                <button
                  onClick={handleLogin}
                  className="w-full py-4 bg-gray-100 text-gray-800 rounded-xl font-bold transition-all"
                >
                  Login
                </button>
                <button
                  onClick={handleGetStarted}
                  className="w-full py-4 bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-200"
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
