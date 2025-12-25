import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import { FaGoogle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useUser } from "../../util/UserContext";

const Login = () => {
  const [activeTab, setActiveTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useUser();

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8000/auth/google";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (activeTab === "login") {
        // Login logic
        const { data } = await axios.post("/auth/login", { email, password });
        
        if (data.success) {
          toast.success(data.message || "Login successful");
          
          const userInfo = data.data.user;
          localStorage.setItem("userInfo", JSON.stringify(userInfo));
          setUser(userInfo);
          
          // Always redirect to home page
          navigate("/");
        }
      } else {
        // Register logic
        if (!name || !email || !password) {
          toast.error("Please fill all fields");
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          toast.error("Password must be at least 6 characters");
          setLoading(false);
          return;
        }

        const { data } = await axios.post("/auth/register", { name, email, password });
        
        if (data.success) {
          toast.success(data.message || "Registration successful");
          
          const userInfo = data.data.user;
          localStorage.setItem("userInfo", JSON.stringify(userInfo));
          setUser(userInfo);
          
          // Redirect to home page
          navigate("/");
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      if (error?.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.contentWrapper}>
        {/* Left Section - Promotional Content */}
        <div style={styles.leftSection}>
          <h1 style={styles.promoTitle}>Start Your Skill Journey</h1>
          <p style={styles.promoSubtitle}>
            Join thousands of learners exchanging knowledge and building skills together.
          </p>
          <div style={styles.imageWrapper}>
            <img 
              src="https://media.licdn.com/dms/image/v2/D4D12AQF8Zym1URlUdw/article-cover_image-shrink_720_1280/article-cover_image-shrink_720_1280/0/1675779883789?e=2147483647&v=beta&t=Sdl1tnLrAV89A5FJHCK95ruH4oA8kWjvL7YfPLRFDH4" 
              alt="Skill Learning" 
              style={styles.promoImage}
            />
            <div style={styles.badge}>
              <span style={styles.checkmark}>✓</span>
              <span style={styles.badgeText}>500+ Skills</span>
            </div>
          </div>
        </div>

        {/* Right Section - Login/Register Form */}
        <div style={styles.rightSection}>
          <div style={styles.formCard}>
            {/* Tabs */}
            <div style={styles.tabs}>
              <button
                style={activeTab === "login" ? styles.activeTab : styles.inactiveTab}
                onClick={() => setActiveTab("login")}
                disabled={loading}
              >
                Login
              </button>
              <button
                style={activeTab === "register" ? styles.activeTab : styles.inactiveTab}
                onClick={() => setActiveTab("register")}
                disabled={loading}
              >
                Register
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={styles.form}>
              {activeTab === "register" && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={styles.input}
                    required
                    disabled={loading}
                  />
                </div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>Email Address</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  required
                  disabled={loading}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              {activeTab === "login" && (
                <div style={styles.optionsRow}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={styles.checkbox}
                      disabled={loading}
                    />
                    <span style={styles.checkboxText}>Remember me</span>
                  </label>
                  <a href="#" style={styles.forgotLink}>Forgot password?</a>
                </div>
              )}

              <Button
                type="submit"
                style={styles.continueButton}
                disabled={loading}
              >
                {loading ? "Processing..." : "Continue"}
              </Button>
            </form>

            {/* Separator */}
            <div style={styles.separator}>
              <div style={styles.separatorLine}></div>
              <span style={styles.separatorText}>OR</span>
              <div style={styles.separatorLine}></div>
            </div>

            {/* Google Login */}
            <Button
              onClick={handleGoogleLogin}
              style={styles.googleButton}
              disabled={loading}
            >
              <FaGoogle style={{ fontSize: "1.2rem", marginRight: "8px" }} />
              Sign in with Google
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#FFFFFF',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: '20px',
  },
  contentWrapper: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '60px',
    alignItems: 'center',
    minHeight: 'calc(100vh - 40px)',
  },
  leftSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    padding: '40px 0',
  },
  promoTitle: {
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    fontWeight: '800',
    color: '#1F2937',
    margin: 0,
    lineHeight: '1.2',
    letterSpacing: '-1px',
  },
  promoSubtitle: {
    fontSize: '1.125rem',
    color: '#6B7280',
    lineHeight: '1.7',
    margin: 0,
    maxWidth: '500px',
  },
  imageWrapper: {
    position: 'relative',
    marginTop: '20px',
  },
  promoImage: {
    width: '100%',
    maxWidth: '600px',
    height: 'auto',
    borderRadius: '16px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
  },
  badge: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: '#10B981',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.875rem',
    fontWeight: '600',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
  },
  checkmark: {
    fontSize: '1rem',
    fontWeight: 'bold',
  },
  badgeText: {
    fontSize: '0.875rem',
  },
  rightSection: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formCard: {
    background: 'white',
    borderRadius: '24px',
    padding: '40px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
    border: '1px solid #E5E7EB',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '32px',
    background: '#F3F4F6',
    padding: '4px',
    borderRadius: '12px',
  },
  activeTab: {
    flex: 1,
    padding: '12px 24px',
    background: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1F2937',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.2s ease',
  },
  inactiveTab: {
    flex: 1,
    padding: '12px 24px',
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#6B7280',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    padding: '12px 16px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '1rem',
    color: '#1F2937',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  optionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  },
  checkboxText: {
    fontSize: '0.875rem',
    color: '#374151',
  },
  forgotLink: {
    fontSize: '0.875rem',
    color: '#3B82F6',
    textDecoration: 'none',
    fontWeight: '500',
  },
  continueButton: {
    width: '100%',
    padding: '14px',
    background: '#3B82F6',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '8px',
  },
  separator: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    margin: '24px 0',
  },
  separatorLine: {
    flex: 1,
    height: '1px',
    background: '#E5E7EB',
  },
  separatorText: {
    fontSize: '0.875rem',
    color: '#6B7280',
    fontWeight: '500',
  },
  googleButton: {
    width: '100%',
    padding: '14px',
    background: 'white',
    color: '#374151',
    border: '1px solid #D1D5DB',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

// Add hover effects
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  input:focus {
    border-color: #3B82F6 !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
  }
  button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
  }
  .inactive-tab:hover {
    color: #1F2937 !important;
  }
  @media (max-width: 1024px) {
    .content-wrapper {
      grid-template-columns: 1fr !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default Login;
