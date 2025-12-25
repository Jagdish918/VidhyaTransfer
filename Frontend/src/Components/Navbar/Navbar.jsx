import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaGraduationCap, FaUser, FaSignOutAlt } from "react-icons/fa";
import { useUser } from "../../util/UserContext";
import axios from "axios";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useUser();
  const [showDropdown, setShowDropdown] = useState(false);

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

  const handleGetStarted = () => {
    navigate('/login');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = async () => {
    try {
      await axios.get("/auth/logout");
      localStorage.removeItem("userInfo");
      setUser(null);
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.removeItem("userInfo");
      setUser(null);
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
  };

  return (
    <>
      <style>{`
        .navbar-link:hover {
          color: #3B82F6 !important;
        }
        .navbar-login-button:hover {
          background: #F3F4F6 !important;
        }
        .navbar-get-started-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4) !important;
        }
        .profile-dropdown:hover {
          background: #F3F4F6 !important;
        }
        .dropdown-menu {
          display: ${showDropdown ? 'block' : 'none'};
        }
        @media (max-width: 768px) {
          .navbar-nav-links {
            display: none !important;
          }
        }
      `}</style>
      <nav style={styles.navbar}>
        <div style={styles.container}>
          {/* Logo */}
          <Link to="/" style={styles.logo}>
            <div style={styles.logoIcon}>
              <FaGraduationCap style={{ fontSize: '28px', color: '#3B82F6' }} />
            </div>
            <span style={styles.logoText}>SkillSwap</span>
          </Link>

          {/* Navigation Links */}
          <div style={styles.navLinks} className="navbar-nav-links">
            <Link 
              to="/" 
              className="navbar-link"
              style={{
                ...styles.navLink,
                ...(isActive('/') ? styles.activeNavLink : {})
              }}
            >
              Home
            </Link>
            <Link 
              to="/about_us" 
              className="navbar-link"
              style={{
                ...styles.navLink,
                ...(isActive('/about_us') ? styles.activeNavLink : {})
              }}
            >
              About
            </Link>
            <a 
              href="#features" 
              className="navbar-link"
              onClick={(e) => handleScrollToSection(e, 'features')}
              style={styles.navLink}
            >
              Features
            </a>
            <a 
              href="#how-it-works" 
              className="navbar-link"
              onClick={(e) => handleScrollToSection(e, 'how-it-works')}
              style={styles.navLink}
            >
              How It Works
            </a>
          </div>

          {/* Action Buttons / Profile Dropdown */}
          <div style={styles.actionButtons}>
            {user ? (
              <div className="profile-dropdown-container" style={styles.profileDropdownContainer}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  style={styles.profileButton}
                  className="profile-dropdown"
                >
                  <img
                    src={user.picture || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcToK4qEfbnd-RN82wdL2awn_PMviy_pelocqQ"}
                    alt="Profile"
                    style={styles.profileImage}
                  />
                  <span style={styles.profileName}>{user.name || user.username || "Profile"}</span>
                </button>
                {showDropdown && (
                  <div style={styles.dropdownMenu} className="dropdown-menu">
                    {user.username ? (
                      <Link
                        to={`/profile/${user.username}`}
                        style={styles.dropdownItem}
                        onClick={() => setShowDropdown(false)}
                      >
                        <FaUser style={{ marginRight: '8px' }} />
                        Profile
                      </Link>
                    ) : (
                      <div style={{ ...styles.dropdownItem, color: '#9CA3AF', cursor: 'default' }}>
                        <FaUser style={{ marginRight: '8px' }} />
                        Profile (Complete registration)
                      </div>
                    )}
                    <button
                      onClick={handleLogout}
                      style={styles.dropdownItem}
                    >
                      <FaSignOutAlt style={{ marginRight: '8px' }} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button 
                  onClick={handleLogin}
                  className="navbar-login-button"
                  style={styles.loginButton}
                >
                  Login
                </button>
                <button 
                  onClick={handleGetStarted}
                  className="navbar-get-started-button"
                  style={styles.getStartedButton}
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

const styles = {
  navbar: {
    background: '#FFFFFF',
    borderBottom: '1px solid #E5E7EB',
    padding: '16px 0',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  logoIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '32px',
  },
  navLink: {
    fontSize: '1rem',
    fontWeight: '500',
    color: '#6B7280',
    textDecoration: 'none',
    transition: 'color 0.2s ease',
    cursor: 'pointer',
  },
  activeNavLink: {
    color: '#3B82F6',
  },
  actionButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    position: 'relative',
  },
  loginButton: {
    padding: '10px 20px',
    background: 'transparent',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  getStartedButton: {
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '24px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
  },
  profileDropdownContainer: {
    position: 'relative',
  },
  profileButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    background: 'transparent',
    border: '1px solid #E5E7EB',
    borderRadius: '24px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  profileImage: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  profileName: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#1F2937',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '8px',
    background: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
    minWidth: '180px',
    zIndex: 1001,
    overflow: 'hidden',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    fontSize: '0.875rem',
    color: '#374151',
    textDecoration: 'none',
    background: 'transparent',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'background 0.2s ease',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
};

// Add hover effect for dropdown items
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .dropdown-item:hover {
    background: #F3F4F6 !important;
  }
`;
document.head.appendChild(styleSheet);

export default Navbar;
