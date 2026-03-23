import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaChalkboardTeacher, FaStar, FaSearch, FaArrowRight, FaGraduationCap, FaCalendarAlt, FaUserPlus } from "react-icons/fa";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import BookSessionModal from "../Sessions/BookSessionModal";
import { useUser } from "../../util/UserContext";
import { toast } from "react-toastify";

const SkillGain = () => {
  const { user } = useUser();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [bookingMentor, setBookingMentor] = useState(null);
  const [connectedIds, setConnectedIds] = useState(new Set());
  const [sendingRequest, setSendingRequest] = useState(null);

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

  // Fetch connections to know which mentors we can book with
  const fetchConnections = async () => {
    try {
      const { data } = await axios.get("/user/registered/connections");
      if (data.success && data.data) {
        const ids = new Set(
          data.data.map((conn) => conn._id)
        );
        setConnectedIds(ids);
      }
    } catch (err) {
      console.error("Error fetching connections", err);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  useEffect(() => {
    fetchMentors();
  }, [debouncedSearch]);

  const handleSendRequest = async (mentorId) => {
    setSendingRequest(mentorId);
    try {
      const { data } = await axios.post("/request/create", { receiverID: mentorId });
      if (data.success) {
        toast.success("Connection request sent!");
        // Update local state to reflect the change immediately
        setMentors(prev => prev.map(m => m._id === mentorId ? { ...m, connectionStatus: "Pending" } : m));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send request");
    } finally {
      setSendingRequest(null);
    }
  };

  const handleCancelRequest = async (mentorId) => {
    setSendingRequest(mentorId);
    try {
      const { data } = await axios.post("/request/cancel", { receiverID: mentorId });
      if (data.success) {
        toast.info("Connection request cancelled");
        // Update local state to reflect the change immediately
        setMentors(prev => prev.map(m => m._id === mentorId ? { ...m, connectionStatus: "Connect" } : m));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel request");
    } finally {
      setSendingRequest(null);
    }
  };

  const renderMentorCard = (mentor, idx) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      key={mentor._id}
      className="bg-dark-card rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-dark-border flex flex-col h-full group relative overflow-hidden hover:-translate-y-1"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-bl-[6rem] -mr-6 -mt-6 transition-all duration-700 group-hover:bg-cyan-500/10 group-hover:scale-110" />

      {/* Recommended Badge */}
      {mentor.matchScore > 0 && (
        <div className="absolute top-6 left-6 z-20">
          <span className="bg-gradient-to-r from-teal-400 to-cyan-500 text-dark-bg text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg shadow-cyan-500/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-dark-bg/80 rounded-full animate-pulse"></span>
            Skill Match
          </span>
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="relative mb-2 mt-1">
          <img
            src={mentor.picture || `https://ui-avatars.com/api/?name=${mentor.name}&background=random`}
            alt={mentor.name}
            className="w-14 h-14 rounded-xl object-cover ring-4 ring-white group-hover:ring-cyan-500/20 transition-all duration-300 shadow-sm"
          />
          <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-cyan-400 to-cyan-500 text-dark-bg p-2 rounded-xl shadow-lg border-2 border-dark-card">
            <FaGraduationCap size={10} />
          </div>
        </div>

        <h3 className="text-base font-semibold text-slate-900 group-hover:text-cyan-700 transition-colors mb-0.5 line-clamp-1">{mentor.name}</h3>
        <p className="text-sm text-slate-600 font-medium mb-3 line-clamp-1">@{mentor.username}</p>

        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest mb-3 shadow-sm">
          <FaStar size={8} />
          <span>{mentor.rating || "New Master"}</span>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-3 w-full">
          {mentor.skillsProficientAt?.slice(0, 3).map((skill, idx) => (
            <span key={idx} className="bg-white text-slate-700 text-[11px] px-2.5 py-1 rounded-lg font-medium border border-dark-border group-hover:border-cyan-500/30 group-hover:text-cyan-700 transition-colors">
              {skill.name || skill}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-dark-border relative z-10">
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest leading-none mb-1.5">Mentorship</p>
            <p className="text-cyan-400 font-black text-lg">{mentor.preferences?.rates?.mentorship || 0}<span className="text-[10px] ml-1 font-bold">Credits/h</span></p>
          </div>
          <Link
            to={`/profile/${mentor.username}`}
            className="bg-white text-slate-700 text-[9px] uppercase font-bold tracking-[0.15em] px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all no-underline border border-dark-border"
          >
            Profile
          </Link>
        </div>
        {mentor.connectionStatus === "Connected" || connectedIds.has(mentor._id) ? (
          <button
            onClick={() => setBookingMentor(mentor)}
            className="w-full bg-indigo-600 text-white text-[10px] uppercase font-bold tracking-[0.15em] px-4 py-3 rounded-xl hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
          >
            <FaCalendarAlt size={10} /> Book Session
          </button>
        ) : mentor.connectionStatus === "Pending" ? (
          <button
            onClick={() => handleCancelRequest(mentor._id)}
            disabled={sendingRequest === mentor._id}
            className="w-full bg-slate-500 text-white text-[10px] uppercase font-bold tracking-[0.15em] px-4 py-3 rounded-xl hover:bg-slate-600 shadow-sm transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-50"
          >
            <FaUserPlus size={10} /> {sendingRequest === mentor._id ? "Cancelling..." : "Cancel Request"}
          </button>
        ) : (
          <button
            onClick={() => handleSendRequest(mentor._id)}
            disabled={sendingRequest === mentor._id}
            className="w-full bg-emerald-600 text-white text-[10px] uppercase font-bold tracking-[0.15em] px-4 py-3 rounded-xl hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-50"
          >
            <FaUserPlus size={10} /> {sendingRequest === mentor._id ? "Sending..." : "Connect First"}
          </button>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-dark-bg pt-4 pb-12 font-sans">
      <div className="max-w-[1280px] mx-auto px-6">

        {/* Header Content */}
        <div className="text-center mb-4 animate-fade-in">

          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-2 leading-tight tracking-tight">
            Find your <span className="text-cyan-700">Mentor</span>
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto text-base leading-relaxed">
            Connect with verified industry experts and accelerate your learning curve through personalized 1-on-1 mentorship.
          </p>
          <Link
            to="/sessions"
            className="inline-flex items-center gap-2 mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-semibold no-underline transition-colors"
          >
            <FaCalendarAlt size={12} /> View My Sessions <FaArrowRight size={10} />
          </Link>
        </div>

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-4 relative group animate-fade-in">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <FaSearch className="text-slate-600 group-focus-within:text-cyan-700 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search masters by skill, domain or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-11 pr-4 py-2.5 bg-dark-card border border-dark-border rounded-xl text-slate-900 focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all shadow-sm placeholder:text-slate-600 text-base"
          />
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="bg-dark-card rounded-2xl p-6 shadow-card animate-pulse h-[320px] border border-dark-border"></div>
              ))}
            </div>
          ) : mentors.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-10 bg-dark-card rounded-2xl border border-dark-border shadow-card max-w-2xl mx-auto flex flex-col items-center"
            >
              <div className="bg-dark-bg border border-dark-border rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 text-slate-600 shadow-inner">
                <FaChalkboardTeacher size={40} />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-4 tracking-tight">No masters found</h3>
              <p className="text-slate-600 text-base max-w-sm">Try adjusting your search filters to see more results.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {mentors.map(renderMentorCard)}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Booking Modal */}
      {bookingMentor && (
        <BookSessionModal
          mentor={bookingMentor}
          onClose={() => setBookingMentor(null)}
          onBooked={() => setBookingMentor(null)}
        />
      )}
    </div>
  );
};

export default SkillGain;

