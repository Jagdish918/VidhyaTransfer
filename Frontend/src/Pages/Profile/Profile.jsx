import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useUser } from "../../util/UserContext";
import { toast } from "react-toastify";
import axios from "axios";
import { FaGithub, FaLinkedin, FaLink, FaEdit, FaStar, FaUserPlus, FaCheck, FaExclamationTriangle, FaUserMinus, FaTimes } from "react-icons/fa";
import Box from "./Box";
import { storeSanitizedUserData } from "../../util/sanitizeUserData";
import ReportModal from "../Report/Report";
import RatingModal from "../Rating/RatingModal";


const Profile = () => {
  const { user, setUser } = useUser();
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
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
        User not found.
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Sidebar (Sticky) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24 space-y-6">

              {/* Profile Header */}
              <div className="flex flex-col items-center text-center">
                <img
                  src={profileUser.picture || "/default-avatar.png"}
                  alt={profileUser.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 shadow-sm mb-4"
                />
                <h1 className="text-2xl font-bold text-gray-900">{profileUser.name}</h1>
                <p className="text-gray-500 text-sm">@{profileUser.username || "username"}</p>

                {/* Bio */}
                {profileUser.bio && <p className="text-gray-700 mt-4 leading-relaxed">{profileUser.bio}</p>}

                {/* Edit Profile Button */}
                {isOwnProfile && (
                  <Link to="/edit_profile" className="mt-6 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none w-full justify-center no-underline">
                    <FaEdit className="mr-2 text-gray-500" />
                    Edit Profile
                  </Link>
                )}

                {/* Connect/Follow Actions for Other Users */}
                {!isOwnProfile && id && (
                  <div className="grid grid-cols-2 gap-2 w-full mt-6">
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
                      className={`flex items-center justify-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium transition-all
                        ${profileUser.status === "Connect"
                          ? 'bg-blue-600 hover:bg-blue-700 text-white border-transparent'
                          : profileUser.status === "Connected"
                            ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'
                            : profileUser.status === "Pending"
                              ? isHoveringConnect
                                ? 'bg-red-50 text-red-600 border-red-200 cursor-pointer'
                                : 'bg-yellow-50 text-yellow-700 border-yellow-300 cursor-pointer'
                              : 'bg-gray-100 text-gray-400 border-transparent cursor-not-allowed'}`}
                    >
                      {connectLoading ? "..." :
                        profileUser.status === "Connect" ? <><FaUserPlus className="mr-2" /> Connect</> :
                          profileUser.status === "Connected" ? <><FaUserMinus className="mr-2" /> Disconnect</> :
                            profileUser.status === "Pending" ? (
                              isHoveringConnect
                                ? <><FaTimes className="mr-2" size={12} /> Cancel Request</>
                                : <><FaCheck className="mr-2" /> Pending</>
                            ) :
                              <><FaCheck className="mr-2" /> {profileUser.status}</>
                      }
                    </button>
                    <button
                      onClick={() => setIsReportModalOpen(true)}
                      className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <FaExclamationTriangle className="mr-2" /> Report
                    </button>
                  </div>
                )}
              </div>

              <hr className="border-gray-100" />

              {/* Social Handles */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Social Handles</h3>
                <div className="flex gap-4 justify-center">
                  {profileUser.githubLink && (
                    <a href={profileUser.githubLink} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-900 transition-colors">
                      <FaGithub size={24} />
                    </a>
                  )}
                  {profileUser.linkedinLink && (
                    <a href={profileUser.linkedinLink} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-700 transition-colors">
                      <FaLinkedin size={24} />
                    </a>
                  )}
                  {profileUser.portfolioLink && (
                    <a href={profileUser.portfolioLink} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-600 transition-colors">
                      <FaLink size={24} />
                    </a>
                  )}
                  {!profileUser.githubLink && !profileUser.linkedinLink && !profileUser.portfolioLink && (
                    <p className="text-sm text-gray-400 italic">No social links added</p>
                  )}
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Details */}
              <div className="space-y-3 text-sm">
                {profileUser.email && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email</span>
                    <span className="font-medium text-gray-900">{profileUser.email}</span>
                  </div>
                )}
                {profileUser.phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone</span>
                    <span className="font-medium text-gray-900">{profileUser.phone}</span>
                  </div>
                )}
                {/* Onboarding Data: Preferences */}
                {profileUser.preferences?.availability > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Availability</span>
                    <span className="font-medium text-gray-900 text-right">{profileUser.preferences.availability} hrs/week</span>
                  </div>
                )}
                {profileUser.preferences?.mode && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mode</span>
                    <span className="font-medium text-gray-900">{profileUser.preferences.mode}</span>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Right Column: Main Content */}
          <div className="lg:col-span-2 space-y-8">

            {/* Skills Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Skills</h2>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Proficient At</h3>
                <div className="flex flex-wrap gap-2">
                  {profileUser.skillsProficientAt?.length > 0 ? (
                    profileUser.skillsProficientAt.map((skill, idx) => (
                      <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {typeof skill === 'string' ? skill : skill.name}
                        {/* Proficiency indicator could go here */}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm italic">No skills listed</span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Interested In Learning</h3>
                <div className="flex flex-wrap gap-2">
                  {profileUser.skillsToLearn?.length > 0 ? (
                    profileUser.skillsToLearn.map((skill, idx) => (
                      <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-green-50 text-green-700 border border-green-100">
                        {typeof skill === 'string' ? skill : skill.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm italic">No interests listed</span>
                  )}
                </div>
              </div>
            </div>

            {/* Ratings & Reviews */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Ratings & Reviews</h2>
                  <p className="text-xs text-gray-500 mt-1">{ratings.length} reviews total</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                    <FaStar className="text-yellow-400 mr-1" />
                    <span className="font-bold text-gray-900">{profileUser.rating?.toFixed(1) || "0.0"}</span>
                    <span className="text-gray-500 text-xs ml-1">/ 5</span>
                  </div>
                  {!isOwnProfile && (
                    <button
                      onClick={() => setIsRatingModalOpen(true)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      Rate this User
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {ratings.length > 0 ? (
                  ratings.map((r, i) => (
                    <div key={i} className="border-b border-gray-50 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <img
                            src={r.rater?.picture || "/default-avatar.png"}
                            className="h-10 w-10 rounded-full object-cover mr-3 border border-gray-100"
                            alt=""
                          />
                          <div>
                            <span className="font-bold text-sm text-gray-900 block">{r.rater?.name}</span>
                            <span className="text-[10px] text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex text-yellow-400 text-xs gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <FaStar key={i} className={i < r.rating ? "text-yellow-400" : "text-gray-200"} />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed pl-[52px]">{r.description}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-400 text-sm italic">No reviews yet. Be the first to rate!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Video Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Introduction Video</h2>
              {profileUser.tutorialVideo ? (
                <div className="rounded-2xl overflow-hidden shadow-lg aspect-video bg-black">
                  <video
                    src={profileUser.tutorialVideo}
                    controls
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gray-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-200">
                  <div className="text-center text-gray-400">
                    <span className="text-4xl block mb-3 opacity-50">🎥</span>
                    <p className="text-sm font-medium">Video introduction coming soon</p>
                  </div>
                </div>
              )}
            </div>

            {/* Registered Events Section - Only for own profile */}
            {isOwnProfile && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Your Registered Events</h2>
                  <Link to="/utilisation" className="text-xs font-bold text-blue-600 hover:underline">Explore More</Link>
                </div>

                {eventsLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : myEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myEvents.map((event) => (
                      <Link
                        key={event._id}
                        to={`/events/${event._id}`}
                        className="group bg-gray-50 hover:bg-white p-4 rounded-xl border border-transparent hover:border-blue-100 hover:shadow-md transition-all no-underline"
                      >
                        <div className="flex items-start gap-4">
                          {event.image ? (
                            <img src={event.image} className="w-16 h-16 rounded-lg object-cover" alt="" />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center text-blue-500">
                              <FaCalendarAlt />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 truncate mb-1 group-hover:text-blue-600">{event.title}</h4>
                            <p className="text-[10px] text-gray-500 font-medium mb-2">{new Date(event.date).toLocaleDateString()} • {event.startTime}</p>
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${new Date(event.date) > new Date() ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {new Date(event.date) > new Date() ? 'upcoming' : 'concluded'}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-gray-400 text-sm italic mb-4">You haven't registered for any events yet.</p>
                    <Link to="/utilisation" className="inline-flex items-center text-xs font-bold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors no-underline">
                      Find Events
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Education */}
            {profileUser.education?.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Education</h2>
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
            )}

            {/* Projects */}
            {profileUser.projects?.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Projects</h2>
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
  );
};

export default Profile;
