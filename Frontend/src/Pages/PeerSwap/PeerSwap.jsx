import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../../util/UserContext";
import axios from "axios";
import { FaSearch, FaChalkboardTeacher, FaUserGraduate, FaComments, FaUserPlus, FaUserTimes, FaClock, FaArrowRight, FaUsers } from "react-icons/fa";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";

const PeerSwap = () => {
  const { user, socket } = useUser();
  const navigate = useNavigate();
  const [peers, setPeers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [existingChats, setExistingChats] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    domain: "",
    skill: "",
    level: ""
  });

  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const fetchPeers = async (pageNum) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const queryParams = new URLSearchParams({
        page: pageNum,
        limit: 50,
        search: debouncedSearch
      });

      const discoverRes = await axios.get(`/user/discover?${queryParams}`, { withCredentials: true });
      const responseData = discoverRes.data?.data || {};
      const users = responseData.users || [];
      const pagination = responseData.pagination || { pages: 1 };

      if (pageNum === 1) {
        setPeers(users);
      } else {
        setPeers(prev => {
          const newPeers = users.filter(u => !prev.some(p => p._id === u._id));
          return [...prev, ...newPeers];
        });
      }
      setTotalPages(pagination.pages);
    } catch (error) {
      console.error("Error fetching peers:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPeers(page);
  }, [page, debouncedSearch]);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const chatRes = await axios.get("/chat", { withCredentials: true });
        setExistingChats(chatRes.data.data || []);
      } catch (err) {
        console.warn("Could not fetch chats", err);
      }
    };
    fetchChats();
  }, []);

  // Real-time status update for peers
  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = ({ userId, isOnline }) => {
      setPeers(prev => prev.map(p => p._id === userId ? { ...p, isOnline } : p));
    };

    socket.on("user status update", handleStatusUpdate);
    return () => socket.off("user status update", handleStatusUpdate);
  }, [socket]);

  const isConnected = (peerId) => {
    return existingChats.some(chat => chat.users.some(u => u._id === peerId || u === peerId));
  };

  const [sentRequests, setSentRequests] = useState(new Set());

  useEffect(() => {
    const fetchSentRequests = async () => {
      try {
        const { data } = await axios.get("/request/getSentRequests", { withCredentials: true });
        if (data.success) {
          const sentIds = new Set(data.data.map(req => req.receiver));
          setSentRequests(sentIds);
        }
      } catch (error) {
        console.error("Error fetching sent requests:", error);
      }
    };
    fetchSentRequests();
  }, []);

  const handleConnect = async (peerId) => {
    try {
      await axios.post("/request/create", { receiverID: peerId }, { withCredentials: true });
      toast.success("Connection request sent!");
      setSentRequests(prev => new Set(prev).add(peerId));
    } catch (error) {
      console.error("Connection error:", error);
      if (error.response?.status === 400 && error.response.data.message.includes("Request already exists")) {
        toast.info("Request already pending.");
        setSentRequests(prev => new Set(prev).add(peerId));
      } else {
        toast.error("Failed to send request.");
      }
    }
  };

  const handleUnsendRequest = async (peerId) => {
    try {
      await axios.post("/request/cancel", { receiverID: peerId }, { withCredentials: true });
      toast.info("Connection request canceled.");
      setSentRequests(prev => {
        const next = new Set(prev);
        next.delete(peerId);
        return next;
      });
    } catch (error) {
      console.error("Error canceling request:", error);
      toast.error("Failed to cancel request.");
    }
  };

  const handleLoadMore = () => {
    if (page < totalPages) {
      setPage(prev => prev + 1);
    }
  };

  const renderPeerCard = (peer, idx) => {
    const connected = isConnected(peer._id);
    const isSent = sentRequests.has(peer._id);
    const role = peer.education?.[0]?.degree
      ? `${peer.education[0].degree}`
      : peer.projects?.[0]?.title
        ? `Owner: ${peer.projects[0].title}`
        : "VidhyaTransfer Peer";

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(idx * 0.03, 0.3) }}
        key={peer._id}
        className="bg-dark-card rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-dark-border flex flex-col h-full group relative overflow-hidden hover:-translate-y-1"
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-[3.5rem] -mr-5 -mt-5 transition-all duration-500 group-hover:bg-indigo-500/10 group-hover:scale-110" />

        {/* Best Match Badge */}
        {peer.matchScore > 0 && (
          <div className="absolute top-4 left-4 z-20">
            <span className={`text-[10px] font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2 ${peer.matchScore >= 10 ? "text-indigo-700 bg-indigo-50 ring-1 ring-inset ring-indigo-100" : "text-amber-800 bg-amber-50 ring-1 ring-inset ring-amber-100"}`}>
              <span className="w-1.5 h-1.5 bg-current rounded-full"></span>
              {peer.matchScore >= 10 ? "Mutual Peer Match" : "Skill Match"}
            </span>
          </div>
        )}

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="relative mb-3 mt-1">
            <img
              src={peer.picture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
              alt={peer.name}
              className="w-14 h-14 rounded-xl object-cover ring-4 ring-white group-hover:ring-indigo-200 transition-all duration-300 shadow-sm"
            />

          </div>

          <h3 className="text-base font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors mb-0.5 leading-tight line-clamp-1">{peer.name}</h3>

          <p className="text-sm text-slate-600 font-medium mb-3 line-clamp-1">{role}</p>

          <div className="space-y-3 w-full mb-5 relative">
            {/* Matching Highlight */}

            <div className="bg-slate-50 rounded-lg p-2.5 border border-dark-border group-hover:bg-dark-hover transition-colors">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1">
                <FaChalkboardTeacher size={12} className="text-indigo-600" /> Offering
              </div>
              <p className="text-sm font-medium text-slate-900 text-left line-clamp-1">
                {peer.skillsProficientAt?.[0]?.name || "Expert Insights"}
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2.5 border border-dark-border group-hover:bg-dark-hover transition-colors">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1">
                <FaUserGraduate size={12} className="text-indigo-600" /> Learning
              </div>
              <p className="text-sm font-medium text-slate-900 text-left line-clamp-1">
                {peer.skillsToLearn?.[0]?.name || "New Frontiers"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-3 relative z-10">
          <Link
            to={`/profile/${peer.username || peer._id}`}
            className="py-3 text-center text-slate-700 font-semibold text-sm bg-white rounded-xl hover:bg-slate-50 transition-colors border border-dark-border no-underline"
          >
            Profile
          </Link>
          {connected ? (
            <button
              onClick={() => navigate('/chat')}
              className="py-3 flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors shadow-sm font-semibold text-sm"
            >
              <FaComments /> Talk
            </button>
          ) : isSent ? (
            <button
              onClick={() => handleUnsendRequest(peer._id)}
              className="py-3 flex items-center justify-center gap-2 bg-white border border-dark-border text-slate-700 rounded-xl hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors font-semibold text-sm group/unsend"
            >
              <FaClock className="group-hover/unsend:hidden" />
              <span className="group-hover/unsend:hidden uppercase font-black">Hold</span>
              <FaUserTimes className="hidden group-hover/unsend:block" />
              <span className="hidden group-hover/unsend:block uppercase font-black">Cancel</span>
            </button>
          ) : (
            <button
              onClick={() => handleConnect(peer._id)}
              className="py-3 flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors shadow-sm font-semibold text-sm group/btn"
            >
              <FaUserPlus className="group-hover/btn:scale-110 transition-transform" /> Connect
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-dark-bg pt-6 pb-16 font-sans">
      <div className="max-w-[1280px] mx-auto px-6">

        {/* Header Content */}
        <div className="text-center mb-6 animate-fade-in">

          <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-3 leading-tight tracking-tight">
            Find your next <span className="text-indigo-700">peer match</span>
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto text-base leading-relaxed">
            Connect with community members for mutual value exchange. Share your mastery and learn new frontiers through peer-to-peer collaboration.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-6 relative group animate-fade-in">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <FaSearch className="text-slate-600 group-focus-within:text-indigo-600 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search peers by expertise, goal or name..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="block w-full pl-11 pr-4 py-3 bg-dark-card border border-dark-border rounded-2xl text-slate-900 focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-200/60 transition-all shadow-sm placeholder:text-slate-600 text-base"
          />
        </div>

        {/* Peers Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="bg-dark-card rounded-2xl p-6 shadow-card animate-pulse h-72 border border-dark-border">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 mx-auto mb-4 border border-dark-border" />
                  <div className="h-3 bg-slate-100 border border-dark-border rounded-full w-3/4 mx-auto mb-2" />
                  <div className="h-2 bg-slate-100 border border-dark-border rounded-full w-1/2 mx-auto mb-5" />
                  <div className="h-14 bg-slate-100 border border-dark-border rounded-xl mb-3" />
                  <div className="h-14 bg-slate-100 border border-dark-border rounded-xl" />
                </div>
              ))}
            </div>
          ) : peers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20 bg-dark-card rounded-3xl border border-dark-border shadow-card max-w-2xl mx-auto flex flex-col items-center"
            >
              <div className="bg-slate-50 border border-dark-border rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 text-slate-600">
                <FaUsers size={48} />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-3 tracking-tight">No peers found</h3>
              <p className="text-slate-600 text-base max-w-sm">Try a broader search (name, skill, or domain) to see more matches.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {peers.map(renderPeerCard)}
            </div>
          )}
        </AnimatePresence>

        {/* Load More Button */}
        {page < totalPages && (
          <div className="flex justify-center mt-10">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-8 py-3 bg-white border border-dark-border text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-3"
            >
              {loadingMore ? (
                <>
                  <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                  Synchronizing...
                </>
              ) : (
                <>
                  Discover more <FaArrowRight size={12} className="text-indigo-600" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PeerSwap;
