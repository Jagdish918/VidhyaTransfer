import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUser } from "../../util/UserContext";
import { toast } from "react-toastify";
import { FaCalendarAlt, FaClock, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaStar, FaChalkboardTeacher, FaGraduationCap, FaArrowRight } from "react-icons/fa";
import { Link } from "react-router-dom";

const STATUS_CONFIG = {
  pending:        { label: "Pending",    color: "bg-amber-50 text-amber-700 border-amber-200",   icon: FaHourglassHalf },
  accepted:       { label: "Accepted",   color: "bg-blue-50 text-blue-700 border-blue-200",      icon: FaCheckCircle },
  declined:       { label: "Declined",   color: "bg-red-50 text-red-600 border-red-200",         icon: FaTimesCircle },
  completed:      { label: "Completed",  color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: FaCheckCircle },
  auto_completed: { label: "Auto-Completed", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: FaCheckCircle },
  cancelled:      { label: "Cancelled",  color: "bg-slate-100 text-slate-600 border-slate-200",  icon: FaTimesCircle },
  disputed:       { label: "Disputed",   color: "bg-orange-50 text-orange-700 border-orange-200", icon: FaHourglassHalf },
  in_progress:    { label: "In Progress", color: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: FaClock },
};

const Sessions = () => {
  const { user } = useUser();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // "all" | "learner" | "mentor"
  const [completingId, setCompletingId] = useState(null);
  const [rating, setRating] = useState(0);
  const [reviewNote, setReviewNote] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== "all") params.role = filter;
      const { data } = await axios.get("/sessions/my", { params });
      if (data.success) {
        setSessions(data.data.sessions);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [filter]);

  const handleAccept = async (sessionId) => {
    setActionLoading(sessionId);
    try {
      const { data } = await axios.patch(`/sessions/${sessionId}/accept`);
      if (data.success) {
        toast.success("Session accepted!");
        fetchSessions();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to accept");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (sessionId) => {
    if (!window.confirm("Are you sure you want to decline? Credits will be refunded to the learner.")) return;
    setActionLoading(sessionId);
    try {
      const { data } = await axios.patch(`/sessions/${sessionId}/decline`);
      if (data.success) {
        toast.success("Session declined. Credits refunded.");
        fetchSessions();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to decline");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (sessionId) => {
    if (!window.confirm("Cancel this session? Credits will be refunded.")) return;
    setActionLoading(sessionId);
    try {
      const { data } = await axios.patch(`/sessions/${sessionId}/cancel`);
      if (data.success) {
        toast.success("Session cancelled. Credits refunded.");
        fetchSessions();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel");
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (sessionId) => {
    setActionLoading(sessionId);
    try {
      const { data } = await axios.patch(`/sessions/${sessionId}/complete`, {
        rating: rating || undefined,
        reviewNote: reviewNote || undefined,
      });
      if (data.success) {
        toast.success("Session completed! Credits released to mentor.");
        setCompletingId(null);
        setRating(0);
        setReviewNote("");
        fetchSessions();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to complete");
    } finally {
      setActionLoading(null);
    }
  };

  const isMyRole = (session, role) => {
    if (role === "learner") return session.learner?._id === user?._id;
    if (role === "mentor") return session.mentor?._id === user?._id;
    return false;
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", {
      weekday: "short", day: "numeric", month: "short", year: "numeric",
    });
  };

  const formatTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit", minute: "2-digit",
    });
  };

  const filters = [
    { key: "all", label: "All Sessions" },
    { key: "learner", label: "As Learner" },
    { key: "mentor", label: "As Mentor" },
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-dark-bg pt-6 pb-10 font-sans">
      <div className="max-w-[960px] mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">Sessions</h1>
            <p className="mt-1 text-sm text-slate-600">Manage your mentorship sessions and escrow payments.</p>
          </div>
          <Link
            to="/skill-gain"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-500 transition-colors no-underline shadow-sm"
          >
            <FaGraduationCap size={14} /> Find Mentors
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 bg-dark-card p-1.5 rounded-xl border border-dark-border w-fit">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all ${
                filter === f.key
                  ? "bg-white text-slate-900 shadow-sm border border-dark-border"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-dark-card rounded-xl p-6 animate-pulse h-32 border border-dark-border" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16 bg-dark-card rounded-2xl border border-dashed border-dark-border">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dark-border">
              <FaCalendarAlt className="text-slate-400 text-2xl" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No sessions yet</h3>
            <p className="text-sm text-slate-600 mb-6 max-w-sm mx-auto">
              Book a session with a mentor from the Skill Gain page to get started.
            </p>
            <Link
              to="/skill-gain"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-500 transition-colors no-underline"
            >
              Browse Mentors <FaArrowRight size={12} />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              const iAmLearner = isMyRole(session, "learner");
              const iAmMentor = isMyRole(session, "mentor");
              const otherPerson = iAmLearner ? session.mentor : session.learner;
              const statusCfg = STATUS_CONFIG[session.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusCfg.icon;

              return (
                <div
                  key={session._id}
                  className="bg-dark-card rounded-xl border border-dark-border p-5 shadow-card hover:border-indigo-200 transition-all"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={otherPerson?.picture || "https://ui-avatars.com/api/?name=" + (otherPerson?.name || "U") + "&background=random&size=100"}
                        alt={otherPerson?.name}
                        className="w-11 h-11 rounded-xl object-cover border border-dark-border flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            to={`/profile/${otherPerson?.username}`}
                            className="text-sm font-semibold text-slate-900 hover:text-indigo-700 transition-colors no-underline truncate"
                          >
                            {otherPerson?.name}
                          </Link>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            {iAmLearner ? "Mentor" : "Learner"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">@{otherPerson?.username}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border flex-shrink-0 ${statusCfg.color}`}>
                      <StatusIcon size={10} /> {statusCfg.label}
                    </span>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Skill</p>
                      <p className="text-sm font-semibold text-slate-900 truncate">{session.skill}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Date</p>
                      <p className="text-sm font-semibold text-slate-900">{formatDate(session.scheduledAt)}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Time</p>
                      <p className="text-sm font-semibold text-slate-900">{formatTime(session.scheduledAt)}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Credits</p>
                      <p className="text-sm font-semibold text-indigo-700">{session.creditsEscrowed} cr</p>
                    </div>
                  </div>

                  {session.message && (
                    <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 mb-4 italic">
                      "{session.message}"
                    </p>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-dark-border">
                    {/* Mentor actions for pending sessions */}
                    {iAmMentor && session.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleAccept(session._id)}
                          disabled={actionLoading === session._id}
                          className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === session._id ? "..." : "Accept"}
                        </button>
                        <button
                          onClick={() => handleDecline(session._id)}
                          disabled={actionLoading === session._id}
                          className="px-4 py-2 bg-white text-red-600 border border-red-200 text-xs font-semibold rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </>
                    )}

                    {/* Learner can confirm completion */}
                    {iAmLearner && ["accepted", "in_progress"].includes(session.status) && (
                      <>
                        {completingId === session._id ? (
                          <div className="flex items-center gap-3 flex-wrap w-full">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => setRating(star)}
                                  className={`text-lg transition-colors ${star <= rating ? "text-amber-400" : "text-slate-300 hover:text-amber-300"}`}
                                >
                                  <FaStar />
                                </button>
                              ))}
                            </div>
                            <input
                              type="text"
                              value={reviewNote}
                              onChange={(e) => setReviewNote(e.target.value)}
                              placeholder="Short review (optional)"
                              className="flex-1 min-w-[150px] px-3 py-1.5 border border-dark-border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none"
                            />
                            <button
                              onClick={() => handleComplete(session._id)}
                              disabled={actionLoading === session._id}
                              className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === session._id ? "..." : "Confirm"}
                            </button>
                            <button
                              onClick={() => { setCompletingId(null); setRating(0); setReviewNote(""); }}
                              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setCompletingId(session._id)}
                            className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-500 transition-colors"
                          >
                            <FaCheckCircle className="inline mr-1.5" size={12} />
                            Mark Completed
                          </button>
                        )}
                      </>
                    )}

                    {/* Cancel: pending → either party, accepted → only mentor */}
                    {session.status === "pending" && (
                      <button
                        onClick={() => handleCancel(session._id)}
                        disabled={actionLoading === session._id}
                        className="px-4 py-2 bg-white text-slate-600 border border-dark-border text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 ml-auto"
                      >
                        Cancel Session
                      </button>
                    )}
                    {session.status === "accepted" && iAmMentor && (
                      <button
                        onClick={() => handleCancel(session._id)}
                        disabled={actionLoading === session._id}
                        className="px-4 py-2 bg-white text-slate-600 border border-dark-border text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 ml-auto"
                      >
                        Cancel Session
                      </button>
                    )}

                    {/* Completed badge */}
                    {["completed", "auto_completed"].includes(session.status) && session.rating && (
                      <div className="flex items-center gap-1 text-amber-500 ml-auto">
                        {[...Array(session.rating)].map((_, i) => <FaStar key={i} size={12} />)}
                        {session.reviewNote && (
                          <span className="text-xs text-slate-500 ml-2 italic">"{session.reviewNote}"</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sessions;
