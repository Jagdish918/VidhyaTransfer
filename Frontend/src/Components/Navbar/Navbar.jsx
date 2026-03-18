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
    <nav className="bg-white/90 backdrop-blur-md border-b border-gray-100 py-3 sticky top-0 z-40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] font-['Montserrat'] transition-all">
      <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to={user ? "/feed" : "/"} className="flex items-center gap-3 no-underline cursor-pointer group">
          <div className="w-10 h-10 rounded-[1rem] bg-[#013e38] flex items-center justify-center shadow-md group-hover:bg-[#3bb4a1] transition-colors">
            <FaGraduationCap className="text-[24px] text-white" />
          </div>
          <span className="text-2xl font-black text-[#013e38] tracking-tight group-hover:text-[#3bb4a1] transition-colors">VidhyaTransfer</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.filter(item => item.path !== '/notifications').map((item) => (
            item.isAnchor ? (
              <a
                key={item.path}
                href={item.path}
                onClick={(e) => handleScrollToSection(e, item.path.substring(1))}
                className="text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-[#013e38] no-underline transition-colors duration-200 cursor-pointer"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.path}
                to={item.path}
                className={`text-[11px] font-black uppercase tracking-widest no-underline transition-colors duration-200 cursor-pointer ${isActive(item.path) ? 'text-[#3bb4a1]' : 'text-gray-400 hover:text-[#013e38]'
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
              <Link to="/notifications" className="relative text-gray-400 hover:text-[#013e38] transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
                {/* Notification Red Dot */}
                <span className="absolute top-0 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white transform translate-x-1/2 -translate-y-1/4"></span>
              </Link>

              {/* Credits Button */}
              <Link
                to="/credits"
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#fafafa] text-[#013e38] rounded-full border border-gray-100 hover:bg-[#013e38] hover:text-white transition-all text-decoration-none shadow-sm hover:shadow-md group"
              >
                <span className="text-lg">💎</span>
                <span className="font-black text-[11px] uppercase tracking-widest">{user.credits || 0}</span>
              </Link>

              <div className="h-8 w-px bg-gray-200 mx-2 hidden sm:block"></div>

              <div className="relative profile-dropdown-container">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 bg-transparent border-none cursor-pointer focus:outline-none hover:opacity-80 transition-opacity"
                >
                  <img
                    src={user.picture || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcToK4qEfbnd-RN82wdL2awn_PMviy_pelocqQ"}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100 shadow-sm"
                  />
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                {showDropdown && (
                  <div className="absolute top-[calc(100%+10px)] right-0 bg-white border border-gray-100 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] min-w-[220px] z-[1001] overflow-hidden animate-fadeIn py-2">
                    <div className="px-5 py-4 border-b border-gray-50 bg-[#fafafa]">
                      <p className="text-[11px] font-black uppercase tracking-widest text-gray-900 truncate mb-1">{user.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 truncate tracking-wide">{user.email}</p>
                    </div>
                    {user.username ? (
                      <Link
                        to={`/profile/${user.username}`}
                        className="flex items-center w-full px-5 py-3.5 text-[11px] uppercase font-black tracking-widest text-gray-500 hover:bg-[#fafafa] hover:text-[#013e38] transition-colors bg-transparent border-none text-left no-underline"
                        onClick={() => setShowDropdown(false)}
                      >
                        <FaUser className="mr-3 text-lg" />
                        Profile
                      </Link>
                    ) : (
                      <Link
                        to="/profile"
                        className="flex items-center w-full px-5 py-3.5 text-[11px] uppercase font-black tracking-widest text-gray-500 hover:bg-[#fafafa] hover:text-[#013e38] transition-colors bg-transparent border-none text-left no-underline"
                        onClick={() => setShowDropdown(false)}
                      >
                        <FaUser className="mr-3 text-lg" />
                        Profile
                      </Link>
                    )}
                    <Link
                      to="/settings"
                      className="flex items-center w-full px-5 py-3.5 text-[11px] uppercase font-black tracking-widest text-gray-500 hover:bg-[#fafafa] hover:text-[#013e38] transition-colors bg-transparent border-none text-left no-underline"
                      onClick={() => setShowDropdown(false)}
                    >
                      <FaCog className="mr-3 text-lg" />
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-5 py-3.5 text-[11px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors bg-transparent border-none text-left cursor-pointer border-t border-gray-50 mt-1"
                    >
                      <FaSignOutAlt className="mr-3 text-lg" />
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
              <div className="hidden sm:flex items-center gap-4">
                <button
                  onClick={handleLogin}
                  className="px-6 py-3 bg-transparent text-[#013e38] hover:bg-[#fafafa] rounded-[1.2rem] text-[10px] uppercase tracking-widest font-black transition-all duration-200 cursor-pointer border-none"
                >
                  Login
                </button>
                <button
                  onClick={handleGetStarted}
                  className="px-8 py-3 bg-[#013e38] text-white rounded-[1.2rem] text-[10px] uppercase tracking-widest font-black transition-all duration-200 shadow-md hover:-translate-y-0.5 hover:shadow-lg hover:bg-[#3bb4a1] cursor-pointer border-none"
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
        <div className="md:hidden fixed inset-0 top-[73px] bg-white z-[999] animate-fadeIn font-['Montserrat']">
          <div className="p-6 flex flex-col gap-4">
            {navLinks.map((item) => (
              item.isAnchor ? (
                <a
                  key={item.path}
                  href={item.path}
                  onClick={(e) => handleScrollToSection(e, item.path.substring(1))}
                  className="text-[13px] font-black uppercase tracking-widest text-gray-800 hover:text-[#3bb4a1] no-underline py-4 border-b border-gray-50 transition-colors"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-[13px] font-black uppercase tracking-widest no-underline py-4 border-b border-gray-50 transition-colors ${isActive(item.path) ? 'text-[#3bb4a1]' : 'text-gray-800 hover:text-[#3bb4a1]'
                    }`}
                >
                  {item.label}
                </Link>
              )
            ))}
            {!user && (
              <div className="flex flex-col gap-3 mt-6">
                <button
                  onClick={handleLogin}
                  className="w-full py-4 bg-[#fafafa] text-[#013e38] rounded-[1.2rem] text-[11px] font-black uppercase tracking-widest transition-all"
                >
                  Login
                </button>
                <button
                  onClick={handleGetStarted}
                  className="w-full py-4 bg-[#013e38] text-white rounded-[1.2rem] text-[11px] font-black uppercase tracking-widest shadow-lg hover:shadow-xl hover:bg-[#3bb4a1] transition-all"
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
