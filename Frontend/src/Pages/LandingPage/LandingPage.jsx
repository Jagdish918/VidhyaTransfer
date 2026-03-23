import React from "react";
import { useNavigate } from "react-router-dom";
import { FaUsers, FaBook, FaStar, FaClock, FaCoins } from "react-icons/fa";
import { useUser } from "../../util/UserContext";

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  const handleGetStarted = () => {
    navigate(user ? '/feed' : '/login');
  };

  const handleStartLearning = () => {
    navigate(user ? '/feed' : '/login');
  };

  const handleExploreSkills = () => {
    const element = document.getElementById('features');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 font-sans">
      {/* Hero Section */}
      <div className="pt-20 px-5 pb-16 max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold bg-gradient-to-br from-blue-500 to-green-500 bg-clip-text text-transparent leading-[1.2] m-0 tracking-tight">
              Learn & Share Skills with Your Community
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed m-0 max-w-[600px]">
              Exchange knowledge, earn credits, and grow together. Connect with learners and experts in a collaborative platform designed for everyone.
            </p>
            <div className="flex gap-4 mt-2">
              <button
                onClick={handleStartLearning}
                className="px-8 py-3.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl text-base font-semibold cursor-pointer transition-all duration-300 shadow-lg hover:-translate-y-0.5 hover:shadow-blue-500/40 border-none"
              >
                Start Learning
              </button>
              <button
                onClick={handleExploreSkills}
                className="px-8 py-3.5 bg-white text-blue-500 border-2 border-blue-500 rounded-xl text-base font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                Explore Skills
              </button>
            </div>
            <div className="flex gap-10 mt-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <FaUsers className="text-2xl text-amber-500" />
                </div>
                <span className="text-base font-semibold text-gray-800">10,000+ Active Members</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <FaBook className="text-2xl text-amber-500" />
                </div>
                <span className="text-base font-semibold text-gray-800">500+ Skills Available</span>
              </div>
            </div>
          </div>
          <div className="flex justify-center items-start">
            <div className="bg-white rounded-[20px] p-8 shadow-2xl w-full max-w-[400px] border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-xl font-bold text-gray-800 mb-1">Sarah Johnson</div>
                  <div className="text-sm text-gray-500">Graphic Designer</div>
                </div>
                <div className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">Active</div>
              </div>
              <div className="text-sm text-gray-500 mb-2">Teaching Now</div>
              <div className="text-lg font-semibold text-gray-800 mb-5">Advanced Photoshop Techniques</div>
              <div className="flex gap-6 mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <FaClock className="text-base text-gray-500" />
                  <span className="text-sm text-gray-500">45 min session</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaCoins className="text-base text-gray-500" />
                  <span className="text-sm text-gray-500">+50 Credits</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-3xl font-extrabold text-gray-800">4.9</div>
                <div className="flex gap-0.5">
                  <FaStar className="text-xl text-amber-500" />
                </div>
                <div className="text-sm text-gray-500 ml-2">Avg Rating</div>
                <div className="text-xs text-gray-400 ml-auto">120 students enrolled</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-20 px-5 bg-white max-w-[1280px] mx-auto">
        <h2 className="text-3xl md:text-5xl font-extrabold text-gray-800 text-center mb-4">Features</h2>
        <p className="text-lg text-gray-500 text-center max-w-[700px] mx-auto mb-16 leading-relaxed">
          Discover what makes VidhyaTransfer the perfect platform for skill exchange and learning.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-[1200px] mx-auto">
          <div className="bg-white rounded-[20px] p-10 px-8 border border-gray-200 text-center transition-all duration-300 shadow-sm hover:-translate-y-1 hover:shadow-xl">
            <div className="w-20 h-20 rounded-[20px] bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <FaUsers className="text-5xl text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Connect with Experts</h3>
            <p className="text-base text-gray-500 leading-relaxed m-0">
              Find and connect with skilled professionals who are ready to share their expertise with you.
            </p>
          </div>
          <div className="bg-white rounded-[20px] p-10 px-8 border border-gray-200 text-center transition-all duration-300 shadow-sm hover:-translate-y-1 hover:shadow-xl">
            <div className="w-20 h-20 rounded-[20px] bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <FaCoins className="text-5xl text-amber-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Credit System</h3>
            <p className="text-base text-gray-500 leading-relaxed m-0">
              Earn credits by teaching and use them to learn new skills from others in the community.
            </p>
          </div>
          <div className="bg-white rounded-[20px] p-10 px-8 border border-gray-200 text-center transition-all duration-300 shadow-sm hover:-translate-y-1 hover:shadow-xl">
            <div className="w-20 h-20 rounded-[20px] bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <FaBook className="text-5xl text-emerald-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Diverse Skills</h3>
            <p className="text-base text-gray-500 leading-relaxed m-0">
              Access hundreds of skills across various domains, from technical to creative.
            </p>
          </div>
        </div>
      </div>

      {/* How SkillSwap Works Section */}
      <div id="how-it-works" className="py-20 px-5 bg-white max-w-[1280px] mx-auto">
        <h2 className="text-3xl md:text-5xl font-extrabold text-gray-800 text-center mb-4">How VidhyaTransfer Works</h2>
        <p className="text-lg text-gray-500 text-center max-w-[700px] mx-auto mb-16 leading-relaxed">
          A simple, credit-based system that makes learning and teaching accessible to everyone.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-[1200px] mx-auto">
          <div className="bg-white rounded-[20px] p-10 px-8 border border-gray-200 text-center transition-all duration-300 shadow-sm hover:-translate-y-1 hover:shadow-xl">
            <div className="w-20 h-20 rounded-[20px] bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <FaUsers className="text-5xl text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Create Your Profile</h3>
            <p className="text-base text-gray-500 leading-relaxed m-0">
              Set up your profile, showcase your skills, and let others know what you can teach or want to learn.
            </p>
          </div>
          <div className="bg-white rounded-[20px] p-10 px-8 border border-gray-200 text-center transition-all duration-300 shadow-sm hover:-translate-y-1 hover:shadow-xl">
            <div className="w-20 h-20 rounded-[20px] bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <FaCoins className="text-5xl text-amber-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Earn Credits</h3>
            <p className="text-base text-gray-500 leading-relaxed m-0">
              Teach others and earn credits that you can use to learn new skills from experts in your community.
            </p>
          </div>
          <div className="bg-white rounded-[20px] p-10 px-8 border border-gray-200 text-center transition-all duration-300 shadow-sm hover:-translate-y-1 hover:shadow-xl">
            <div className="w-20 h-20 rounded-[20px] bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <FaBook className="text-5xl text-emerald-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Learn & Grow</h3>
            <p className="text-base text-gray-500 leading-relaxed m-0">
              Connect with mentors, attend sessions, and continuously expand your knowledge base.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
