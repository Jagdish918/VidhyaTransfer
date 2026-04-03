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

  const handleSendOtp = async () => {
    if (!email) { toast.error("Please enter email"); return; }
    setLoading(true);
    try {
      const { data } = await axios.post("/auth/send-otp", { email });
      if (data.success) {
        setOtpSent(true);
        setOtpTimer(60);
        toast.success(data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (activeTab === "login") {
        // Login logic
        let response;
        if (loginMethod === "otp") {
          if (!otpSent) {
            await handleSendOtp();
            return;
          }
          if (!otp) { toast.error("Please enter OTP"); setLoading(false); return; }
          response = await axios.post("/auth/login-with-otp", { email, otp });
        } else {
          response = await axios.post("/auth/login", { email, password });
        }

        const { data } = response;

        if (data.success) {
          toast.success(data.message || "Login successful");

          const userInfo = data.data.user;
          storeSanitizedUserData(userInfo);
          setUser(userInfo);

          // Check onboarding status
          try {
            const { data: statusRes } = await axios.get("/onboarding/status");
            if (statusRes?.success) {
              const { completed, step } = statusRes.data;
              if (!completed) {
                if (step === 0) navigate("/onboarding/personal-info");
                else if (step === 1) navigate("/onboarding/skills");
                else if (step === 2) navigate("/onboarding/preferences");
                else navigate("/onboarding/personal-info");
              } else {
                navigate("/feed");
              }
            } else {
              navigate("/feed");
            }
          } catch (error) {
            console.error("Error checking onboarding:", error);
            navigate("/feed");
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

        if (name.length < 3) {
          toast.error("Name must be at least 3 characters");
          setLoading(false);
          return;
        }

        if (password.length < 8) {
          toast.error("Password must be at least 8 characters");
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
    <div className="min-h-screen bg-dark-bg font-sans p-4 flex items-center justify-center">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center w-full px-4">
        {/* Left Section - Promotional Content */}
        <div className="flex flex-col gap-4 py-4 lg:pl-10">
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 m-0 leading-tight tracking-tight">Start Your Skill Journey</h1>
          <p className="text-lg text-slate-600 leading-relaxed m-0 max-w-[500px]">
            Join thousands of learners exchanging knowledge and building skills together.
          </p>
          <div className="relative mt-5 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <img
              src="https://media.licdn.com/dms/image/v2/D4D12AQF8Zym1URlUdw/article-cover_image-shrink_720_1280/article-cover_image-shrink_720_1280/0/1675779883789?e=2147483647&v=beta&t=Sdl1tnLrAV89A5FJHCK95ruH4oA8kWjvL7YfPLRFDH4"
              alt="Skill Learning"
              className="relative w-full max-w-[500px] h-auto rounded-2xl shadow-xl border border-dark-border"
            />
            <div className="absolute top-4 right-4 bg-cyan-500 text-dark-bg px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold shadow-lg shadow-cyan-500/30">
              <span className="text-base font-extrabold">✓</span>
              <span>500+ Skills</span>
            </div>
          </div>
        </div>

        {/* Right Section - Login/Register Form */}
        <div className="flex justify-center items-center lg:pr-10">
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-[440px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100">
            {/* Tabs */}
            <div className="flex gap-2 mb-3 bg-slate-100 p-1 rounded-2xl">
              <button
                className={`flex-1 py-3 px-6 border-0 rounded-xl text-sm font-bold cursor-pointer transition-all duration-300 ${activeTab === "login"
                  ? "bg-white text-slate-700 shadow-sm"
                  : "bg-transparent text-slate-500 hover:text-slate-700"
                  }`}
                onClick={() => setActiveTab("login")}
                disabled={loading}
              >
                Login
              </button>
              <button
                className={`flex-1 py-3 px-6 border-0 rounded-xl text-sm font-bold cursor-pointer transition-all duration-300 ${activeTab === "register"
                  ? "bg-white text-slate-700 shadow-sm"
                  : "bg-transparent text-slate-500 hover:text-slate-700"
                  }`}
                onClick={() => setActiveTab("register")}
                disabled={loading}
              >
                Register
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {activeTab === "login" && (
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setLoginMethod("password")}
                    className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${loginMethod === "password" ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                  >
                    Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod("otp")}
                    className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${loginMethod === "otp" ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                  >
                    OTP
                  </button>
                </div>
              )}

              {activeTab === "register" && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 transition-all duration-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400 font-medium shadow-sm"
                    required
                    disabled={loading}
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700">Email Address</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 transition-all duration-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400 font-medium shadow-sm"
                  required
                  disabled={loading || (loginMethod === "otp" && otpSent)}
                />
              </div>

              {(activeTab === "register" || loginMethod === "password") && (
                <div className="flex flex-col gap-2 relative">
                  <label className="text-sm font-semibold text-slate-700">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 transition-all duration-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400 font-medium shadow-sm"
                      required
                      disabled={loading}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0 transition-colors"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              )}

              {loginMethod === "otp" && otpSent && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Enter OTP</label>
                  <input
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="p-3.5 px-4 bg-dark-bg border border-dark-border rounded-xl text-slate-800 transition-all duration-200 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 placeholder:text-slate-600 text-center tracking-[0.5em] font-mono text-lg"
                    required
                    disabled={loading}
                    maxLength={6}
                  />
                  <div className="text-right mt-1">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={otpTimer > 0}
                      className={`text-[11px] font-bold uppercase tracking-widest bg-transparent border-0 cursor-pointer transition-colors ${otpTimer > 0 ? "text-slate-600" : "text-cyan-600 hover:text-cyan-500"}`}
                    >
                      {otpTimer > 0 ? `Resend in ${otpTimer}s` : "Resend OTP"}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "register" && (
                <div className="flex flex-col gap-2 relative">
                  <label className="text-sm font-semibold text-slate-700">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 transition-all duration-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400 font-medium shadow-sm"
                      required
                      disabled={loading}
                      minLength={6}
                    />
                  </div>
                </div>
              )}

              {activeTab === "login" && loginMethod === "password" && (
                <div className="flex justify-between items-center mt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="peer w-4 h-4 cursor-pointer opacity-0 absolute"
                        disabled={loading}
                      />
                      <div className="w-4 h-4 rounded border border-dark-border bg-dark-bg peer-checked:bg-cyan-500 peer-checked:border-cyan-500 transition-all flex items-center justify-center">
                        {rememberMe && <span className="text-dark-bg text-[10px] font-black">✓</span>}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-600">Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="text-xs text-cyan-600 no-underline font-bold hover:text-cyan-500 transition-colors">Forgot password?</Link>
                </div>
              )}

              {activeTab === "login" && loginMethod === "otp" && !otpSent ? (
                <Button
                  type="button"
                  onClick={handleSendOtp}
                  className="w-full p-3.5 mt-2 bg-blue-600 text-white border-0 rounded-xl text-sm font-bold cursor-pointer transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send OTP"}
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="w-full p-3.5 mt-2 bg-blue-600 text-white border-0 rounded-xl text-sm font-bold cursor-pointer transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? "Processing..." : (activeTab === "register" ? "Continue" : (loginMethod === "otp" ? "Verify & Login" : "Login"))}
                </Button>
              )}
            </form>

            {/* Separator */}
            <div className="flex items-center gap-4 my-3">
              <div className="flex-1 h-px bg-dark-border"></div>
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">OR</span>
              <div className="flex-1 h-px bg-dark-border"></div>
            </div>

            {/* Google Login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full p-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-sm font-bold cursor-pointer transition-all duration-300 flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-dark-border rounded-[2rem] p-8 md:p-10 w-full max-w-md shadow-2xl animate-fade-in relative">
            <button
              onClick={() => { setShowRegOtpModal(false); setLoading(false); }}
              className="absolute top-6 right-6 text-slate-600 hover:text-cyan-600 border-none bg-transparent cursor-pointer text-xl transition-colors"
            >
              ×
            </button>

            <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center tracking-tight">Verify Email</h2>
            <p className="text-slate-600 text-sm text-center mb-8 font-medium">Enter the 6-digit code sent to <span className="text-slate-700">{email}</span></p>

            <div className="flex flex-col gap-6">
              <input
                type="text"
                placeholder="000000"
                value={regOtp}
                onChange={(e) => setRegOtp(e.target.value)}
                className="text-center text-3xl tracking-[0.5em] p-4 bg-dark-bg border border-dark-border rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none font-mono text-cyan-600 transition-all font-bold"
                maxLength={6}
              />

              <Button
                onClick={handleVerifyRegistrationOtp}
                disabled={loading}
                className="w-full py-4 bg-cyan-500 text-dark-bg rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-cyan-400 transition-all disabled:opacity-50 shadow-lg shadow-cyan-500/20"
              >
                {loading ? "Verifying..." : "Verify & Complete"}
              </Button>
            </div>

            <div className="mt-8 text-center text-xs font-bold text-slate-600 uppercase tracking-widest">
              <p>
                Didn't receive code? {" "}
                <button
                  onClick={handleResendOtp}
                  disabled={otpTimer > 0}
                  className={`font-bold bg-transparent border-none cursor-pointer transition-colors uppercase tracking-widest ml-1 ${otpTimer > 0 ? "text-slate-700" : "text-cyan-600 hover:text-cyan-500"}`}
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
