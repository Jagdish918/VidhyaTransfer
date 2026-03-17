import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaChalkboardTeacher, FaStar, FaSearch, FaArrowRight, FaGraduationCap } from "react-icons/fa";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const SkillGain = () => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchMentors = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/user/mentors", {
        params: { search: debouncedSearch }
      });
      if (data.success) {
        setMentors(data.data.users);
      }
    } catch (error) {
      console.error("Error fetching mentors", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentors();
  }, [debouncedSearch]);

  const renderMentorCard = (mentor, idx) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      key={mentor._id}
      className="bg-white rounded-[2.5rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(59,180,161,0.12)] transition-all duration-500 border border-gray-50 flex flex-col group relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#3bb4a1]/5 rounded-bl-[6rem] -mr-6 -mt-6 transition-all duration-700 group-hover:bg-[#3bb4a1]/10 group-hover:scale-110" />

      {/* Recommended Badge */}
      {mentor.relevanceScore > 0 && (
        <div className="absolute top-6 left-6 z-20">
          <span className="bg-[#3bb4a1] text-white text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg shadow-[#3bb4a1]/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
            Recommended
          </span>
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="relative mb-4">
          <img
            src={mentor.picture || `https://ui-avatars.com/api/?name=${mentor.name}&background=random`}
            alt={mentor.name}
            className="w-20 h-20 rounded-[2.2rem] object-cover ring-8 ring-gray-50 group-hover:ring-[#3bb4a1]/10 transition-all duration-500 shadow-xl"
          />
          <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-[#3bb4a1] to-[#013e38] text-white p-2 rounded-xl shadow-lg border-2 border-white">
            <FaGraduationCap size={10} />
          </div>
        </div>

        <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#3bb4a1] transition-colors mb-0.5">{mentor.name}</h3>
        <p className="text-[10px] text-gray-400 font-bold tracking-tight mb-3">@{mentor.username}</p>

        <div className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest mb-4">
          <FaStar size={8} />
          <span>{mentor.rating || "New Master"}</span>
        </div>

        <div className="flex flex-wrap justify-center gap-1.5 mb-5 w-full">
          {mentor.skillsProficientAt?.slice(0, 3).map((skill, idx) => (
            <span key={idx} className="bg-gray-50 text-gray-500 text-[8px] uppercase tracking-[0.15em] px-2.5 py-1.5 rounded-lg font-black border border-gray-100 group-hover:border-[#3bb4a1]/30 group-hover:bg-[#3bb4a1]/5 transition-all">
              {skill.name || skill}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-5 border-t border-gray-50 flex justify-between items-center relative z-10">
        <div>
          <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest leading-none mb-1.5">Mentorship</p>
          <p className="text-[#3bb4a1] font-black text-lg">{mentor.preferences?.rates?.mentorship || 0}<span className="text-[10px] ml-1 font-bold">Cr/hr</span></p>
        </div>
        <Link
          to={`/profile/${mentor.username}`}
          className="bg-[#013e38] text-white text-[9px] uppercase font-black tracking-[0.2em] px-6 py-3 rounded-xl hover:bg-[#3bb4a1] hover:shadow-[0_15px_30px_rgba(59,180,161,0.3)] transition-all no-underline flex items-center gap-2 group/btn"
        >
          Explore <FaArrowRight size={8} className="group-hover/btn:translate-x-1 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#fafafa] pt-10 pb-24 font-['Montserrat']">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header Content */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-block bg-[#3bb4a1]/10 text-[#3bb4a1] px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.25em] mb-4"
          >
            Skill Gain Programs
          </motion.div>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 leading-[1.1] tracking-tight">
            Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3bb4a1] to-[#013e38]">Master</span>
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto text-sm font-medium leading-relaxed">
            Connect with verified industry experts and accelerate your learning curve through personalized 1-on-1 mentorship.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-12 relative group">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <FaSearch className="text-gray-300 group-focus-within:text-[#3bb4a1] transition-colors scale-110" />
          </div>
          <input
            type="text"
            placeholder="Search masters by skill, domain or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-14 pr-7 py-3.5 border-none rounded-[2rem] bg-white text-gray-900 focus:ring-4 focus:ring-[#3bb4a1]/10 transition-all shadow-[0_15px_50px_rgba(0,0,0,0.03)] placeholder:text-gray-300 text-sm font-semibold"
          />
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="bg-white rounded-[2.5rem] p-8 shadow-sm animate-pulse h-[450px] border border-gray-50"></div>
              ))}
            </div>
          ) : mentors.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-24 bg-white rounded-[4rem] border border-gray-50 shadow-sm max-w-2xl mx-auto flex flex-col items-center"
            >
              <div className="bg-gray-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-10 text-gray-200">
                <FaChalkboardTeacher size={40} />
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Expanding the Registry</h3>
              <p className="text-gray-400 font-medium text-lg max-w-sm">We're currently onboarding new masters. Try adjusting your search filters.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
              {mentors.map(renderMentorCard)}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SkillGain;
