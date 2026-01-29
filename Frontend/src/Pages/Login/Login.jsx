import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import { FaGoogle } from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useUser } from "../../util/UserContext";
import { storeSanitizedUserData } from "../../util/sanitizeUserData";

const Login = () => {
  const [activeTab, setActiveTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useUser();

  // OTP Login States
  const [loginMethod, setLoginMethod] = useState("password"); // "password" or "otp"
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Registration OTP State
  const [showRegOtpModal, setShowRegOtpModal] = useState(false);
  const [regOtp, setRegOtp] = useState("");

  // Timer & Limits
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpAttempts, setOtpAttempts] = useState(0);

  // Reset OTP state when inputs change
  React.useEffect(() => {
    setOtpSent(false);
    setOtp("");
    setOtpTimer(0);
    setOtpAttempts(0);
  }, [email, loginMethod, activeTab]);

  // Timer Logic
  React.useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handleResendOtp = async () => {
    if (otpAttempts >= 3) {
      toast.error("Maximum resend attempts reached. Please try again later.");
      return;
    }

    if (otpTimer > 0) return;

    try {
      // Re-trigger the send OTP logic based on context
      if (activeTab === "register") {
        const { data } = await axios.post("/auth/send-registration-otp", { name, email, password });
        if (data.success) toast.success("OTP Resent!");
      } else {
        // Login OTP resend
        const { data } = await axios.post("/auth/send-otp", { email });
        if (data.success) toast.success("OTP Resent!");
      }

      setOtpAttempts(prev => prev + 1);
      setOtpTimer(60); // 60 seconds cooldown
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to resend OTP");
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${axios.defaults.baseURL}/auth/google`;
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
          storeSanitizedUserData(userInfo);
          setUser(userInfo);

          // Check onboarding status and redirect accordingly
          try {
            let onboardingStatus;
            try {
              // move the api logic to api folder
              const onboardingRes = await axios.get("/onboarding/registered/status");
              onboardingStatus = onboardingRes.data;
            } catch (err) {
              // Try unregistered endpoint
              try {
                const onboardingRes = await axios.get("/onboarding/status");
                onboardingStatus = onboardingRes.data;
              } catch (unregErr) {
                console.error("Error checking onboarding:", unregErr);
                // Default to landing page if can't check
                navigate("/");
                return;
              }
            }

            if (onboardingStatus?.success) {
              const { completed, step } = onboardingStatus.data;
              if (!completed) {
                // Redirect to appropriate onboarding step
                if (step === 0) {
                  navigate("/onboarding/personal-info");
                } else if (step === 1) {
                  navigate("/onboarding/skills");
                } else if (step === 2) {
                  navigate("/onboarding/preferences");
                } else {
                  navigate("/onboarding/personal-info");
                }
              } else {
                // Onboarding completed, go to landing page
                navigate("/feed");
              }
            } else {
              // If can't check status, default to landing page
              navigate("/feed");
            }
          } catch (error) {
            console.error("Error checking onboarding:", error);
            // On error, default to landing page
            navigate("/");
          }
        }
      } else {
        // Register logic
        if (!name || !email || !password || !confirmPassword) {
          toast.error("Please fill all fields");
          setLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          toast.error("Passwords do not match");
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          toast.error("Password must be at least 6 characters");
          setLoading(false);
          return;
        }

        // Send Registration OTP
        const { data } = await axios.post("/auth/send-registration-otp", { name, email, password });

        if (data.success) {
          toast.success(data.message || "OTP sent to email");
          setShowRegOtpModal(true);
          setOtpTimer(60);
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
      if (!showRegOtpModal) {
        setLoading(false);
      }
    }
  };

  const handleVerifyRegistrationOtp = async () => {
    if (!regOtp) {
      toast.error("Please enter OTP");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post("/auth/verify-registration-otp", { email, otp: regOtp });
      if (data.success) {
        toast.success("Registration successful");
        setShowRegOtpModal(false);

        const userInfo = data.data.user;
        storeSanitizedUserData(userInfo);
        setUser(userInfo);

        navigate("/onboarding/personal-info");
      }
    } catch (error) {
      console.error("OTP Error", error);
      toast.error(error?.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans p-5">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[calc(100vh-40px)]">
        {/* Left Section - Promotional Content */}
        <div className="flex flex-col gap-6 py-10">
          <h1 className="text-4xl md:text-5xl lg:text-5xl font-extrabold text-gray-800 m-0 leading-tight tracking-tight">Start Your Skill Journey</h1>
          <p className="text-lg text-gray-500 leading-relaxed m-0 max-w-[500px]">
            Join thousands of learners exchanging knowledge and building skills together.
          </p>
          <div className="relative mt-5">
            <img
              src="https://media.licdn.com/dms/image/v2/D4D12AQF8Zym1URlUdw/article-cover_image-shrink_720_1280/article-cover_image-shrink_720_1280/0/1675779883789?e=2147483647&v=beta&t=Sdl1tnLrAV89A5FJHCK95ruH4oA8kWjvL7YfPLRFDH4"
              alt="Skill Learning"
              className="w-full max-w-[600px] h-auto rounded-2xl shadow-xl"
            />
            <div className="absolute top-4 right-4 bg-emerald-500 text-white px-4 py-2 rounded-3xl flex items-center gap-2 text-sm font-semibold shadow-lg shadow-emerald-500/30">
              <span className="text-base font-bold">✓</span>
              <span className="text-sm">500+ Skills</span>
            </div>
          </div>
        </div>

        {/* Right Section - Login/Register Form */}
        <div className="flex justify-center items-center">
          <div className="bg-white rounded-3xl p-10 w-full max-w-[480px] shadow-lg border border-gray-200">
            {/* Tabs */}
            <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-xl">
              <button
                className={`flex-1 py-3 px-6 border-0 rounded-lg text-base font-semibold cursor-pointer transition-all duration-200 ${activeTab === "login"
                  ? "bg-white text-gray-800 shadow-sm"
                  : "bg-transparent text-gray-500 hover:text-gray-800"
                  }`}
                onClick={() => setActiveTab("login")}
                disabled={loading}
              >
                Login
              </button>
              <button
                className={`flex-1 py-3 px-6 border-0 rounded-lg text-base font-semibold cursor-pointer transition-all duration-200 ${activeTab === "register"
                  ? "bg-white text-gray-800 shadow-sm"
                  : "bg-transparent text-gray-500 hover:text-gray-800"
                  }`}
                onClick={() => setActiveTab("register")}
                disabled={loading}
              >
                Register
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {activeTab === "login" && (
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setLoginMethod("password")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${loginMethod === "password" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod("otp")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${loginMethod === "otp" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    OTP
                  </button>
                </div>
              )}

              {activeTab === "register" && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="p-3 px-4 border border-gray-300 rounded-lg text-base text-gray-800 transition-all duration-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    required
                    disabled={loading}
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Email Address</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="p-3 px-4 border border-gray-300 rounded-lg text-base text-gray-800 transition-all duration-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  required
                  disabled={loading || (loginMethod === "otp" && otpSent)}
                />
              </div>

              {loginMethod === "password" && (
                <div className="flex flex-col gap-2 relative">
                  <label className="text-sm font-semibold text-gray-700">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-3 px-4 border border-gray-300 rounded-lg text-base text-gray-800 transition-all duration-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      required
                      disabled={loading}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer p-0"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              )}

              {loginMethod === "otp" && otpSent && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">Enter OTP</label>
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="p-3 px-4 border border-gray-300 rounded-lg text-base text-gray-800 transition-all duration-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    required
                    disabled={loading}
                  />
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={otpTimer > 0}
                      className={`text-xs bg-transparent border-0 cursor-pointer hover:underline ${otpTimer > 0 ? "text-gray-400" : "text-blue-600"}`}
                    >
                      {otpTimer > 0 ? `Resend in ${otpTimer}s` : "Resend OTP"}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "register" && (
                <div className="flex flex-col gap-2 relative">
                  <label className="text-sm font-semibold text-gray-700">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-3 px-4 border border-gray-300 rounded-lg text-base text-gray-800 transition-all duration-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      required
                      disabled={loading}
                      minLength={6}
                    />
                  </div>
                </div>
              )}

              {activeTab === "login" && loginMethod === "password" && (
                <div className="flex justify-between items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 cursor-pointer"
                      disabled={loading}
                    />
                    <span className="text-sm text-gray-700">Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="text-sm text-blue-500 no-underline font-medium hover:text-blue-600">Forgot password?</Link>
                </div>
              )}

              {activeTab === "login" && loginMethod === "otp" && !otpSent ? (
                <Button
                  type="button"
                  onClick={() => axios.post("/auth/send-otp", { email }).then(res => { if (res.data.success) { setOtpSent(true); setOtpTimer(60); toast.success(res.data.message); } }).catch(err => toast.error(err.response?.data?.message || "Failed"))}
                  className="w-full p-3.5 bg-blue-500 text-white border-0 rounded-xl text-base font-semibold cursor-pointer transition-all duration-200 mt-2 hover:bg-blue-600 hover:-translate-y-0.5 hover:shadow-lg shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send OTP"}
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="w-full p-3.5 bg-blue-500 text-white border-0 rounded-xl text-base font-semibold cursor-pointer transition-all duration-200 mt-2 hover:bg-blue-600 hover:-translate-y-0.5 hover:shadow-lg shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? "Processing..." : (activeTab === "register" ? "Continue" : (loginMethod === "otp" ? "Verify & Login" : "Login"))}
                </Button>
              )}
            </form>

            {/* Separator */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-sm text-gray-500 font-medium">OR</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* Google Login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full p-3.5 bg-white text-gray-800 border border-gray-300 rounded-xl text-base font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 hover:bg-gray-50 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
      </div>
      {/* OTP Modal */}
      {showRegOtpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md m-4 shadow-2xl animate-fade-in relative">
            <button
              onClick={() => { setShowRegOtpModal(false); setLoading(false); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer text-xl"
            >
              ×
            </button>

            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Verify Email</h2>
            <p className="text-gray-500 text-center mb-6">Enter the 6-digit code sent to {email}</p>

            <div className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="000000"
                value={regOtp}
                onChange={(e) => setRegOtp(e.target.value)}
                className="text-center text-3xl tracking-widest p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none font-mono"
                maxLength={6}
              />

              <Button
                onClick={handleVerifyRegistrationOtp}
                disabled={loading}
                className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-70"
              >
                {loading ? "Verifying..." : "Verify & Complete Registration"}
              </Button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Didn't receive code? {" "}
                <button
                  onClick={handleResendOtp}
                  disabled={otpTimer > 0}
                  className={`font-semibold bg-transparent border-none cursor-pointer hover:underline ${otpTimer > 0 ? "text-gray-400" : "text-blue-600"}`}
                >
                  {otpTimer > 0 ? `Resend in ${otpTimer}s` : "Resend"}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
