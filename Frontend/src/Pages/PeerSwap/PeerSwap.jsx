import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../../util/UserContext";
import axios from "axios";
import { FaSearch, FaChalkboardTeacher, FaUserGraduate, FaComments, FaUserPlus, FaUserTimes, FaClock, FaArrowRight, FaUsers } from "react-icons/fa";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";

const PeerSwap = () => {
  const { user } = useUser();
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
      const { users, pagination } = discoverRes.data.data;

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
        className="bg-white rounded-[2.5rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(59,180,161,0.12)] transition-all duration-500 border border-gray-50 flex flex-col group relative overflow-hidden h-full"
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#3bb4a1]/5 rounded-bl-[6rem] -mr-6 -mt-6 transition-all duration-700 group-hover:bg-[#3bb4a1]/10 group-hover:scale-110" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="relative mb-5">
            <img
              src={peer.picture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
              alt={peer.name}
              className="w-20 h-20 rounded-[1.8rem] object-cover ring-8 ring-gray-50 group-hover:ring-[#3bb4a1]/10 transition-all duration-500 shadow-xl"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm"></span>
          </div>

          <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#3bb4a1] transition-colors mb-0.5">{peer.name}</h3>
          <p className="text-[10px] text-gray-400 font-bold tracking-tight mb-4">{role}</p>

          <div className="space-y-3 w-full mb-6">
            <div className="bg-emerald-50/50 rounded-2xl p-3.5 border border-emerald-100/50 group-hover:bg-emerald-50 transition-colors">
              <div className="flex items-center gap-2 text-[8px] font-black text-[#3bb4a1] mb-1.5 uppercase tracking-[0.2em]">
                <FaChalkboardTeacher size={10} /> Offering
              </div>
              <p className="text-[11px] font-bold text-gray-700 text-left line-clamp-1">
                {peer.skillsProficientAt?.[0]?.name || "Expert Insights"}
              </p>
            </div>
            <div className="bg-blue-50/50 rounded-2xl p-3.5 border border-blue-100/50 group-hover:bg-blue-50 transition-colors">
              <div className="flex items-center gap-2 text-[8px] font-black text-blue-500 mb-1.5 uppercase tracking-[0.2em]">
                <FaUserGraduate size={10} /> Learning
              </div>
              <p className="text-[11px] font-bold text-gray-700 text-left line-clamp-1">
                {peer.skillsToLearn?.[0]?.name || "New Frontiers"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-3 relative z-10">
          <Link
            to={`/profile/${peer.username || peer._id}`}
            className="py-3.5 text-center text-[#013e38] font-black text-[10px] uppercase tracking-widest bg-gray-50 rounded-xl hover:bg-gray-100 transition-all border border-transparent no-underline"
          >
            Bio
          </Link>
          {connected ? (
            <button
              onClick={() => navigate('/chat')}
              className="py-3.5 flex items-center justify-center gap-2 bg-[#3bb4a1] text-white rounded-xl hover:bg-[#2fa08e] transition-all shadow-md hover:shadow-lg font-black text-[10px] uppercase tracking-widest"
            >
              <FaComments /> Talk
            </button>
          ) : isSent ? (
            <button
              onClick={() => handleUnsendRequest(peer._id)}
              className="py-3.5 flex items-center justify-center gap-2 bg-white border border-gray-100 text-gray-400 rounded-xl hover:bg-red-50 hover:border-red-100 hover:text-red-500 transition-all font-black text-[10px] uppercase tracking-widest group/unsend"
            >
              <FaClock className="group-hover/unsend:hidden" />
              <span className="group-hover/unsend:hidden uppercase font-black">Hold</span>
              <FaUserTimes className="hidden group-hover/unsend:block" />
              <span className="hidden group-hover/unsend:block uppercase font-black">Cancel</span>
            </button>
          ) : (
            <button
              onClick={() => handleConnect(peer._id)}
              className="py-3.5 flex items-center justify-center gap-2 bg-[#013e38] text-white rounded-xl hover:bg-[#3bb4a1] transition-all shadow-xl shadow-[#013e38]/10 hover:shadow-[#3bb4a1]/30 font-black text-[10px] uppercase tracking-widest group/btn"
            >
              <FaUserPlus className="group-hover/btn:scale-110 transition-transform" /> Swap
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#fafafa] pt-10 pb-32 font-['Montserrat']">
      <div className="max-w-[1440px] mx-auto px-8">

        {/* Header Content */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-block bg-[#3bb4a1]/10 text-[#3bb4a1] px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.25em] mb-4"
          >
            Community Marketplace
          </motion.div>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 leading-[1.1] tracking-tight">
            Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3bb4a1] to-[#013e38]">Peer Match</span>
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto text-sm font-medium leading-relaxed">
            Connect with community members for mutual value exchange. Share your mastery and learn new frontiers through peer-to-peer collaboration.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-12 relative group">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <FaSearch className="text-gray-300 group-focus-within:text-[#3bb4a1] transition-colors scale-110" />
          </div>
          <input
            type="text"
            placeholder="Search peers by expertise, goal or name..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="block w-full pl-14 pr-7 py-3.5 border-none rounded-[2rem] bg-white text-gray-900 focus:ring-4 focus:ring-[#3bb4a1]/10 transition-all shadow-[0_20px_60px_rgba(0,0,0,0.035)] placeholder:text-gray-300 text-sm font-semibold"
          />
        </div>

        {/* Peers Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="bg-white rounded-[2.5rem] p-8 shadow-sm animate-pulse h-72 border border-gray-50">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 mx-auto mb-4" />
                  <div className="h-3 bg-gray-100 rounded-full w-3/4 mx-auto mb-2" />
                  <div className="h-2 bg-gray-100 rounded-full w-1/2 mx-auto mb-6" />
                  <div className="h-14 bg-gray-50 rounded-2xl mb-3" />
                  <div className="h-14 bg-gray-50 rounded-2xl" />
                </div>
              ))}
            </div>
          ) : peers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-32 bg-white rounded-[4rem] border border-gray-100 shadow-sm max-w-2xl mx-auto flex flex-col items-center"
            >
              <div className="bg-gray-50 rounded-full w-28 h-28 flex items-center justify-center mx-auto mb-10 text-gray-200">
                <FaUsers size={48} />
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">The Crowd is Gathering</h3>
              <p className="text-gray-400 font-medium text-lg max-w-sm">No peers currently match that signal. Try casting a wider net with your search.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
              {peers.map(renderPeerCard)}
            </div>
          )}
        </AnimatePresence>

        {/* Load More Button */}
        {page < totalPages && (
          <div className="flex justify-center mt-20">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-12 py-4 bg-[#013e38] text-white text-[10px] font-black uppercase tracking-[0.25em] rounded-2xl hover:bg-[#3bb4a1] hover:shadow-[#3bb4a1]/30 transition-all shadow-xl shadow-[#013e38]/20 disabled:opacity-50 flex items-center gap-4"
            >
              {loadingMore ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Synchronizing...
                </>
              ) : (
                <>
                  Discover More <FaArrowRight size={8} />
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
