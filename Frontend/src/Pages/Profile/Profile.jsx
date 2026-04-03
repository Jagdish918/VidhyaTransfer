import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useUser } from "../../util/UserContext";
import { toast } from "react-toastify";
import axios from "axios";
import { FaGithub, FaLinkedin, FaLink, FaEdit, FaStar, FaUserPlus, FaCheck, FaExclamationTriangle, FaUserMinus, FaTimes, FaCalendarAlt } from "react-icons/fa";
import Box from "./Box";
import { storeSanitizedUserData } from "../../util/sanitizeUserData";
import ReportModal from "../Report/Report";
import RatingModal from "../Rating/RatingModal";


const Profile = () => {
  const { user, setUser, socket } = useUser();
  const [profileUser, setProfileUser] = useState(null);
  const { id } = useParams(); // Changed from username to id as per App.jsx
  const [loading, setLoading] = useState(true);
  const [connectLoading, setConnectLoading] = useState(false);
  const [isHoveringConnect, setIsHoveringConnect] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratings, setRatings] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const navigate = useNavigate();

  const isOwnProfile = (user && (user.username === id || user._id === id)) || (!id && user);

  useEffect(() => {
    // ... existing useEffect logic
    const getUser = async () => {
      setLoading(true);
      try {
        // If no id param, identify the current user
        if (!id) {
          // 1. Try fetching as Registered User (most common/desired)
          try {
            const { data } = await axios.get("/user/registered/getDetails");
            if (data.success) {
              setProfileUser(data.data);
              // Update context if needed, but primarily set profile data
              if (!user?.username && data.data.username) {
                setUser(data.data);
                storeSanitizedUserData(data.data);
              }
              setLoading(false);
              return;
            }
          } catch (regError) {
            // 2. If Registered fetch fails, try Unregistered User
            try {
              const { data } = await axios.get("/user/unregistered/getDetails");
              if (data.success) {
                setProfileUser(data.data);
                setLoading(false);
                return;
              }
            } catch (unregError) {
              // Both failed
              console.error("Failed to fetch user profile", unregError);
            }
          }
        } else {
          // Viewing another user's profile (by ID or username)
          try {
            const { data } = await axios.get(`/user/registered/getDetails/${id}`);
            if (data.success) {
              setProfileUser(data.data);
            }
          } catch (error) {
            console.error("User not found", error);
            setProfileUser(null);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    // If viewing own profile and user context exists, use it immediately
    if (!id && user?.username) {
      setProfileUser(user);
      setLoading(false);
      // Still fetch fresh data in background
      getUser();
    } else {
      getUser();
    }
  }, [id, user, setUser]);

  // Real-time status update
  useEffect(() => {
    if (!socket || !profileUser?._id) return;

    const handleStatusUpdate = ({ userId, isOnline }) => {
      if (profileUser._id === userId) {
        setProfileUser(prev => prev ? { ...prev, isOnline } : prev);
      }
    };

    socket.on("user status update", handleStatusUpdate);
    return () => socket.off("user status update", handleStatusUpdate);
  }, [socket, profileUser?._id]);

  useEffect(() => {
    if (profileUser?.username) {
      fetchRatings();
      if (isOwnProfile) fetchMyEvents();
    }
  }, [profileUser]);

  const fetchRatings = async () => {
    try {
      const { data } = await axios.get(`/rating/getRatings/${profileUser.username}`);
      if (data.success) {
        setRatings(data.data);
      }
    } catch (error) {
      console.error("Error fetching ratings", error);
    }
  };

  const fetchMyEvents = async () => {
    if (!isOwnProfile) return;
    setEventsLoading(true);
    try {
      const { data } = await axios.get("/events/user/my-events");
      if (data.success) {
        setMyEvents(data.data);
      }
    } catch (error) {
      console.error("Error fetching my events", error);
    } finally {
      setEventsLoading(false);
    }
  };

  const onRatingSuccess = () => {
    fetchRatings();
    // Refresh user details to get updated avg rating
    const getUser = async () => {
      const endpoint = id ? `/user/registered/getDetails/${id}` : "/user/registered/getDetails";
      const { data } = await axios.get(endpoint);
      if (data.success) setProfileUser(data.data);
    }
    getUser();
  };

  const convertDate = (dateTimeString) => {
    if (!dateTimeString) return "";
    const date = new Date(dateTimeString);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  const connectHandler = async () => {
    try {
      setConnectLoading(true);
      const { data } = await axios.post(`/request/create`, {
        receiverID: profileUser._id,
      });
      toast.success(data.message);
      setProfileUser((prevState) => ({
        ...prevState,
        status: "Pending",
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Error sending request");
    } finally {
      setConnectLoading(false);
    }
  };

  const disconnectHandler = async () => {
    if (!window.confirm(`Are you sure you want to disconnect from ${profileUser.name}? This will also delete your chat history.`)) return;
    try {
      setConnectLoading(true);
      await axios.post(`/request/disconnect`, { targetUserId: profileUser._id });
      toast.success(`Disconnected from ${profileUser.name}`);
      setProfileUser((prevState) => ({
        ...prevState,
        status: "Connect",
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Error disconnecting");
    } finally {
      setConnectLoading(false);
    }
  };

  const cancelRequestHandler = async () => {
    try {
      setConnectLoading(true);
      await axios.post(`/request/cancel`, { receiverID: profileUser._id });
      toast.success("Request cancelled");
      setProfileUser((prevState) => ({
        ...prevState,
        status: "Connect",
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Error cancelling request");
    } finally {
      setConnectLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-dark-bg pt-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg text-slate-600 pt-16">
        User not found.
      </div>
    )
  }

  // ── Decoration Helpers ──────────────────────────────────────────
  const getAvatarFrameClass = (frame) => {
    const frames = {
      'none': '',
      'golden-ring': 'ring-[3px] ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]',
      'neon-pulse': 'ring-[3px] ring-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.6)] animate-pulse',
      'emerald-glow': 'ring-[3px] ring-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]',
      'ruby-blaze': 'ring-[3px] ring-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]',
      'ice-crystal': 'ring-[3px] ring-blue-300 shadow-[0_0_20px_rgba(147,197,253,0.6)]',
      'aurora-borealis': 'ring-[3px] ring-purple-400 shadow-[0_0_20px_rgba(192,132,252,0.5)] animate-pulse',
    };
    return frames[frame] || '';
  };

  const getCardThemeClass = (card) => {
    const cards = {
      'default': '',
      'gradient-ocean': 'bg-gradient-to-br from-cyan-500 to-blue-600',
      'dark-cosmos': 'bg-gradient-to-br from-slate-900 to-indigo-950',
      'sunset-blaze': 'bg-gradient-to-br from-orange-400 to-rose-500',
      'forest-mist': 'bg-gradient-to-br from-emerald-500 to-teal-700',
      'lavender-dream': 'bg-gradient-to-br from-purple-400 to-pink-500',
    };
    return cards[card] || '';
  };

  const isCustomCard = profileUser?.profileDecoration?.profileCard && profileUser.profileDecoration.profileCard !== 'default';
  const cardTextClass = isCustomCard ? 'text-white' : '';
  const cardSubTextClass = isCustomCard ? 'text-white/70' : 'text-slate-600';
  const cardBorderClass = isCustomCard ? 'border-white/10' : 'border-dark-border';

  return (
    <>
      <div className="min-h-screen bg-dark-bg py-4 pt-4 font-sans">
        <div className="app-container">

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[360px,1fr] gap-6">

            {/* Left Column: Sidebar (Sticky) */}
            <div className="lg:col-span-1">
              <div className={`rounded-2xl shadow-card border p-3 lg:sticky lg:top-20 space-y-4 max-h-[calc(100vh-100px)] overflow-y-auto no-scrollbar relative overflow-hidden ${isCustomCard ? getCardThemeClass(profileUser?.profileDecoration?.profileCard) + ' ' + cardBorderClass : 'bg-dark-card border-dark-border'}`}>

                {/* Profile Effect Overlay */}
                {profileUser?.profileDecoration?.profileEffect && profileUser.profileDecoration.profileEffect !== 'none' && (
                  <div className={`absolute inset-0 pointer-events-none z-0 profile-effect-${profileUser.profileDecoration.profileEffect}`}></div>
                )}

                {/* Profile Header */}
                <div className="flex flex-col items-center text-center relative z-10">
                  <img
                    src={profileUser.picture || "https://ui-avatars.com/api/?name=" + (profileUser.name || profileUser.username || "U") + "&background=random&size=200"}
                    alt={profileUser.name}
                    className={`w-20 h-20 rounded-2xl object-cover border-4 shadow-sm mb-3 ${isCustomCard ? 'border-white/20' : 'border-dark-card ring-2 ring-dark-border'} ${getAvatarFrameClass(profileUser?.profileDecoration?.avatarFrame)}`}
                  />
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2 justify-center">
                    {profileUser.name}

                  </h1>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">@{profileUser.username || "username"}</p>


                  {/* Bio */}
                  {profileUser.bio && <p className={`mt-4 leading-relaxed font-medium text-sm ${isCustomCard ? 'text-white/90' : 'text-slate-700'}`}>{profileUser.bio}</p>}

                  {/* Edit Profile Button */}
                  {isOwnProfile && (
                    <Link to="/edit_profile" className={`mt-4 inline-flex items-center px-4 h-9 border shadow-soft text-[10px] uppercase tracking-widest font-bold rounded-xl transition-all w-full justify-center no-underline ${isCustomCard ? 'border-white/20 text-white bg-white/10 hover:bg-white/20' : 'border-dark-border text-slate-700 bg-white hover:bg-dark-hover hover:text-cyan-700 hover:border-cyan-500/30'}`}>
                      <FaEdit className="mr-2 text-cyan-500 text-sm" />
                      Edit Profile
                    </Link>
                  )}

                  {/* Connect/Follow Actions for Other Users */}
                  {!isOwnProfile && id && (
                    <div className="grid grid-cols-2 gap-3 w-full mt-8">
                      <button
                        onClick={
                          profileUser.status === "Connect" ? connectHandler
                            : profileUser.status === "Connected" ? disconnectHandler
                              : profileUser.status === "Pending" ? cancelRequestHandler
                                : undefined
                        }
                        disabled={connectLoading}
                        onMouseEnter={() => setIsHoveringConnect(true)}
                        onMouseLeave={() => setIsHoveringConnect(false)}
                        className={`flex items-center justify-center px-4 h-10 rounded-xl shadow-sm text-[10px] uppercase tracking-widest font-bold transition-all border
                        ${profileUser.status === "Connect"
                            ? 'bg-cyan-500 hover:bg-cyan-400 text-dark-bg border-transparent shadow-[0_0_15px_rgba(94,234,212,0.3)]'
                            : profileUser.status === "Connected"
                              ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20'
                              : profileUser.status === "Pending"
                                ? isHoveringConnect
                                  ? 'bg-red-500/10 text-red-400 border-red-500/20 cursor-pointer'
                                  : 'bg-amber-500/10 text-amber-500 border-amber-500/20 cursor-pointer'
                                : 'bg-dark-bg text-slate-600 border-dark-border cursor-not-allowed'}`}
                      >
                        {connectLoading ? "..." :
                          profileUser.status === "Connect" ? <><FaUserPlus className="mr-1.5 text-sm" /> Connect</> :
                            profileUser.status === "Connected" ? <><FaUserMinus className="mr-1.5 text-sm" /> Disconnect</> :
                              profileUser.status === "Pending" ? (
                                isHoveringConnect
                                  ? <><FaTimes className="mr-1.5 text-sm" /> Cancel</>
                                  : <><FaCheck className="mr-1.5 text-sm" /> Pending</>
                              ) :
                                <><FaCheck className="mr-1.5 text-sm" /> {profileUser.status}</>
                        }
                      </button>
                      <button
                        onClick={() => setIsReportModalOpen(true)}
                        className="flex items-center justify-center px-4 h-10 border border-dark-border rounded-xl text-[10px] uppercase tracking-widest font-bold text-slate-600 bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all"
                      >
                        <FaExclamationTriangle className="mr-1.5 text-red-500 text-sm" /> Report
                      </button>
                    </div>
                  )}
                </div>

                <hr className={isCustomCard ? 'border-white/10' : 'border-dark-border'} />

                {/* Social Handles */}
                <div className="relative z-10">
                  <h3 className={`text-[9px] font-bold uppercase tracking-widest mb-4 text-center ${cardSubTextClass}`}>Social Handles</h3>
                  <div className="flex gap-4 justify-center">
                    {profileUser.githubLink && (
                      <a href={profileUser.githubLink} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center bg-white rounded-xl text-slate-600 hover:text-slate-900 hover:bg-dark-hover transition-all border border-dark-border">
                        <FaGithub size={18} />
                      </a>
                    )}
                    {profileUser.linkedinLink && (
                      <a href={profileUser.linkedinLink} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center bg-white rounded-xl text-slate-600 hover:text-[#0077b5] hover:bg-dark-hover transition-all border border-dark-border hover:border-[#0077b5]/30">
                        <FaLinkedin size={18} />
                      </a>
                    )}
                    {profileUser.portfolioLink && (
                      <a href={profileUser.portfolioLink} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center bg-white rounded-xl text-slate-600 hover:text-cyan-700 hover:bg-dark-hover transition-all border border-dark-border hover:border-cyan-500/30">
                        <FaLink size={18} />
                      </a>
                    )}
                    {!profileUser.githubLink && !profileUser.linkedinLink && !profileUser.portfolioLink && (
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 italic">No social links</p>
                    )}
                  </div>
                </div>

                <hr className={isCustomCard ? 'border-white/10' : 'border-dark-border'} />

                {/* Details */}
                <div className={`space-y-3 text-sm p-4 rounded-xl border relative z-10 ${isCustomCard ? 'bg-white/10 border-white/10' : 'bg-dark-bg border-dark-border'}`}>
                  {profileUser.email && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-slate-600">Email</span>
                      <span className="font-semibold text-slate-900 truncate">{profileUser.email}</span>
                    </div>
                  )}
                  {profileUser.phone && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-slate-600">Phone</span>
                      <span className="font-semibold text-slate-900">{profileUser.phone}</span>
                    </div>
                  )}
                  {/* Onboarding Data: Preferences */}
                  {profileUser.preferences?.availability > 0 && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-slate-600">Availability</span>
                      <span className="font-semibold text-slate-900">{profileUser.preferences.availability} hrs/week</span>
                    </div>
                  )}
                  {profileUser.preferences?.mode && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-slate-600">Mode</span>
                      <span className="font-semibold text-slate-900">{profileUser.preferences.mode}</span>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Right Column: Main Content */}
            <div className="space-y-6">

              {/* Skills Section */}
              <div className="bg-dark-card rounded-2xl shadow-card border border-dark-border p-4">
                <h2 className="text-xl font-bold text-slate-900 mb-4 tracking-tight">Skills and Interests</h2>

                <div className="mb-4">
                  <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Proficient At</h3>
                  <div className="flex flex-wrap gap-2.5">
                    {profileUser.skillsProficientAt?.length > 0 ? (
                      profileUser.skillsProficientAt.map((skill, idx) => (
                        <span key={idx} className="inline-flex items-center px-4 py-2 rounded-xl text-[10px] uppercase font-bold tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm transition-all hover:bg-cyan-500/20">
                          {typeof skill === 'string' ? skill : skill.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest italic">No skills listed</span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Interested In Learning</h3>
                  <div className="flex flex-wrap gap-2.5">
                    {profileUser.skillsToLearn?.length > 0 ? (
                      profileUser.skillsToLearn.map((skill, idx) => (
                        <span key={idx} className="inline-flex items-center px-4 py-2 rounded-xl text-[10px] uppercase font-bold tracking-widest bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-sm transition-all hover:bg-purple-500/20">
                          {typeof skill === 'string' ? skill : skill.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest italic">No interests listed</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Ratings & Reviews */}
              <div className="bg-dark-card rounded-2xl shadow-card border border-dark-border p-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Ratings & Reviews</h2>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">{ratings.length} reviews total</p>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className="flex items-center bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20 shadow-sm">
                      <FaStar className="text-amber-400 mr-2 text-sm" />
                      <span className="font-bold text-amber-500">{profileUser.rating?.toFixed(1) || "0.0"}</span>
                      <span className="text-amber-500/50 text-xs ml-1 font-bold">/ 5</span>
                    </div>
                    {!isOwnProfile && (
                      <button
                        onClick={() => setIsRatingModalOpen(true)}
                        className="text-[10px] uppercase tracking-widest font-bold text-cyan-500 hover:text-cyan-400 transition-colors"
                      >
                        Rate this User
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  {ratings.length > 0 ? (
                    ratings.map((r, i) => (
                      <div key={i} className="bg-dark-bg p-4 rounded-xl border border-dark-border transition-all hover:border-cyan-500/30">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <img
                              src={r.rater?.picture || "https://ui-avatars.com/api/?name=" + (r.rater?.name || "U") + "&background=random&size=100"}
                              className="h-12 w-12 rounded-[1rem] object-cover mr-4 border border-dark-border"
                              alt=""
                            />
                            <div>
                              <span className="font-bold text-sm text-slate-900 block">{r.rater?.name}</span>
                              <span className="text-[9px] uppercase tracking-widest font-bold text-slate-600">{new Date(r.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex text-amber-400 text-sm gap-1 bg-dark-card px-3 py-1.5 rounded-full border border-dark-border shadow-sm">
                            {[...Array(5)].map((_, i) => (
                              <FaStar key={i} className={i < r.rating ? "text-amber-400" : "text-slate-600"} />
                            ))}
                          </div>
                        </div>
                        <p className="text-slate-700 text-sm leading-relaxed font-medium bg-dark-card p-3 rounded-lg border border-dark-border">{r.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 bg-dark-bg rounded-xl border border-dashed border-dark-border">
                      <div className="w-12 h-12 bg-dark-card rounded-xl flex items-center justify-center mx-auto mb-3 border border-dark-border shadow-sm">
                        <FaStar className="text-slate-600 text-2xl" />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 italic">No reviews yet. Be the first to rate!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Video Section */}
              <div className="bg-dark-card rounded-2xl shadow-card border border-dark-border p-4">
                <h2 className="text-xl font-bold text-slate-900 mb-4 tracking-tight">Introduction Video</h2>
                {profileUser.tutorialVideo ? (
                  <div className="rounded-2xl overflow-hidden shadow-lg aspect-video bg-black border border-dark-border">
                    <video
                      src={profileUser.tutorialVideo}
                      controls
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-dark-bg rounded-2xl flex items-center justify-center border-2 border-dashed border-dark-border">
                    <div className="text-center text-slate-600">
                      <span className="text-4xl block mb-4 opacity-50">🎥</span>
                      <p className="text-[10px] font-bold uppercase tracking-widest">Video introduction coming soon</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Registered Events Section - Only for own profile */}
              {isOwnProfile && (
                <div className="bg-dark-card rounded-2xl shadow-card border border-dark-border p-3">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Your Registered Events</h2>
                    <Link to="/utilisation" className="text-[10px] font-bold uppercase tracking-widest text-cyan-500 hover:text-cyan-400 transition-colors no-underline">Explore More</Link>
                  </div>

                  {eventsLoading ? (
                    <div className="flex justify-center py-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                    </div>
                  ) : myEvents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {myEvents.map((event) => (
                        <Link
                          key={event._id}
                          to={`/events/${event._id}`}
                          className="group bg-dark-bg hover:bg-slate-800 p-5 rounded-2xl border border-dark-border hover:border-cyan-500/30 hover:shadow-lg transition-all no-underline"
                        >
                          <div className="flex items-start gap-4">
                            {event.image ? (
                              <img src={event.image} className="w-16 h-16 rounded-[1rem] object-cover shadow-sm border border-dark-border" alt="" />
                            ) : (
                              <div className="w-16 h-16 rounded-[1rem] bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 shadow-sm">
                                <FaCalendarAlt size={20} />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-slate-900 truncate mb-1 group-hover:text-cyan-700 transition-colors">{event.title}</h4>
                              <p className="text-[9px] uppercase tracking-widest font-bold text-slate-600 mb-3">{new Date(event.date).toLocaleDateString()} • {event.startTime}</p>
                              <span className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest border shadow-sm ${new Date(event.date) > new Date() ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-dark-card text-slate-600 border-dark-border'}`}>
                                {new Date(event.date) > new Date() ? 'upcoming' : 'concluded'}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-dark-bg rounded-2xl border border-dashed border-dark-border">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 italic mb-5">You haven't registered for any events yet.</p>
                      <Link to="/utilisation" className="inline-flex items-center text-[10px] uppercase tracking-widest font-bold bg-dark-card border border-dark-border text-slate-700 px-6 py-3 rounded-xl hover:text-cyan-700 hover:border-cyan-500/50 transition-all no-underline">
                        Find Events
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Education */}
              {profileUser.education?.length > 0 && (
                <div className="bg-dark-card rounded-2xl shadow-card border border-dark-border p-3">
                  <h2 className="text-lg font-bold text-slate-900 mb-6 tracking-tight">Education</h2>
                  <div className="space-y-6">
                    {profileUser.education.map((edu, index) => (
                      <Box
                        key={index}
                        head={edu.institution}
                        date={convertDate(edu.startDate) + " - " + convertDate(edu.endDate)}
                        spec={edu.degree}
                        desc={edu.description}
                        score={edu.score}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {profileUser.projects?.length > 0 && (
                <div className="bg-dark-card rounded-2xl shadow-card border border-dark-border p-3">
                  <h2 className="text-lg font-bold text-slate-900 mb-6 tracking-tight">Projects</h2>
                  <div className="space-y-6">
                    {profileUser.projects.map((proj, index) => (
                      <Box
                        key={index}
                        head={proj.title}
                        date={convertDate(proj.startDate) + " - " + convertDate(proj.endDate)}
                        desc={proj.description}
                        skills={proj.techStack}
                      />
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div >
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          reportedUsername={profileUser?.username}
          reporterUsername={user?.username}
        />
        <RatingModal
          isOpen={isRatingModalOpen}
          onClose={() => setIsRatingModalOpen(false)}
          targetUsername={profileUser?.username}
          onRatingSuccess={onRatingSuccess}
        />
      </div >

      {/* Profile Effect CSS Keyframes */}
      <style>{`
        .profile-effect-sparkle {
          background-image: radial-gradient(2px 2px at 20% 30%, rgba(255,215,0,0.8), transparent),
                            radial-gradient(2px 2px at 40% 20%, rgba(255,215,0,0.6), transparent),
                            radial-gradient(2px 2px at 60% 50%, rgba(255,215,0,0.7), transparent),
                            radial-gradient(2px 2px at 80% 40%, rgba(255,215,0,0.5), transparent),
                            radial-gradient(2px 2px at 10% 70%, rgba(255,215,0,0.6), transparent),
                            radial-gradient(2px 2px at 70% 80%, rgba(255,215,0,0.4), transparent),
                            radial-gradient(2px 2px at 50% 10%, rgba(255,215,0,0.7), transparent),
                            radial-gradient(2px 2px at 30% 60%, rgba(255,215,0,0.5), transparent);
          animation: sparkleAnim 3s ease-in-out infinite;
        }
        @keyframes sparkleAnim {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        .profile-effect-aurora {
          background: linear-gradient(135deg, rgba(139,92,246,0.15), rgba(34,211,238,0.15), rgba(139,92,246,0.15));
          background-size: 400% 400%;
          animation: auroraAnim 6s ease infinite;
        }
        @keyframes auroraAnim {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .profile-effect-fireflies {
          background-image: radial-gradient(3px 3px at 15% 25%, rgba(251,191,36,0.7), transparent),
                            radial-gradient(3px 3px at 45% 65%, rgba(251,191,36,0.5), transparent),
                            radial-gradient(3px 3px at 75% 35%, rgba(251,191,36,0.6), transparent),
                            radial-gradient(3px 3px at 25% 85%, rgba(251,191,36,0.4), transparent),
                            radial-gradient(3px 3px at 85% 75%, rgba(251,191,36,0.5), transparent);
          animation: firefliesAnim 4s ease-in-out infinite alternate;
        }
        @keyframes firefliesAnim {
          0% { opacity: 0.2; transform: translateY(0); }
          100% { opacity: 0.7; transform: translateY(-5px); }
        }
        .profile-effect-matrix-rain {
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 10px,
            rgba(34,197,94,0.05) 10px,
            rgba(34,197,94,0.05) 20px
          );
          animation: matrixAnim 2s linear infinite;
        }
        @keyframes matrixAnim {
          0% { background-position: 0 0; }
          100% { background-position: 0 20px; }
        }
      `}</style>
    </>
  );
};

export default Profile;