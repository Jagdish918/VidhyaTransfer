import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../../util/UserContext";
import axios from "axios";
import { FaSearch, FaFilter, FaChalkboardTeacher, FaUserGraduate, FaComments, FaUserPlus, FaUserTimes, FaClock } from "react-icons/fa";
import { toast } from "react-toastify";

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

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const fetchPeers = async (pageNum) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const queryParams = new URLSearchParams({
        page: pageNum,
        limit: 20,
        search: debouncedSearch
      });

      const discoverRes = await axios.get(`http://localhost:8000/user/discover?${queryParams}`, { withCredentials: true });
      const { users, pagination } = discoverRes.data.data;

      if (pageNum === 1) {
        setPeers(users);
      } else {
        // Append unique users
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
        const chatRes = await axios.get("http://localhost:8000/chat", { withCredentials: true });
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
    // Fetch initial sent requests
    const fetchSentRequests = async () => {
      try {
        const { data } = await axios.get("http://localhost:8000/request/getSentRequests", { withCredentials: true });
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
      await axios.post("http://localhost:8000/request/create", { receiverID: peerId }, { withCredentials: true });
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
      await axios.post("http://localhost:8000/request/cancel", { receiverID: peerId }, { withCredentials: true });
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

  return (
    <div className="min-h-screen bg-[#f0f2f5] py-10 px-4 sm:px-6 lg:px-8 font-['Montserrat']">
      <div className="max-w-[1400px] mx-auto space-y-10">

        {/* Header & Search */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-16 bg-[#3bb4a1]/5 rounded-full -mr-8 -mt-8 pointer-events-none"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 font-['Oswald'] uppercase tracking-wide">
              Find Your <span className="text-[#3bb4a1]">Perfect Peer</span> Match
            </h1>
            <p className="text-gray-500 mb-8 max-w-2xl text-sm">
              Connect with peers who can help you grow. Swap skills, share knowledge, and accelerate your learning journey together.
            </p>

            <div className="flex flex-col md:flex-row gap-4 items-center max-w-4xl">
              <div className="flex-1 w-full relative group">
                <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#3bb4a1] transition-colors" />
                <input
                  type="text"
                  placeholder="Search for peers, specific skills, or names..."
                  className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#3bb4a1] focus:border-[#3bb4a1] outline-none transition-all shadow-inner text-gray-700 placeholder-gray-400 font-medium"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
              <button className="px-8 py-4 bg-[#013e38] text-white font-bold rounded-2xl hover:bg-[#012b27] transition-all shadow-lg shadow-[#013e38]/20 flex items-center gap-2 uppercase tracking-wider text-sm whitespace-nowrap">
                <FaFilter className="text-[#3bb4a1]" /> Filters
              </button>
            </div>
          </div>
        </div>

        {/* Peers Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="bg-white rounded-3xl h-96 animate-pulse shadow-sm border border-gray-100 p-6 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="space-y-2 flex-1">
                  <div className="h-20 bg-gray-100 rounded-xl"></div>
                  <div className="h-20 bg-gray-100 rounded-xl"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : peers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaSearch className="text-4xl text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 font-['Oswald']">No peers found</h3>
            <p className="text-gray-500 max-w-md mx-auto">We couldn't find any peers matching your search criteria. Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center px-2">
              <span className="text-gray-500 font-semibold text-sm bg-white px-4 py-1.5 rounded-full shadow-sm border border-gray-100">
                Found <span className="text-[#3bb4a1] font-bold">{peers.length}</span> potential matches
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {peers.map(peer => {
                const connected = isConnected(peer._id);
                const isSent = sentRequests.has(peer._id);

                // Derived Role
                const role = peer.education?.[0]?.degree
                  ? `${peer.education[0].degree} @ ${peer.education[0].institution}`
                  : peer.projects?.[0]?.title
                    ? `Project: ${peer.projects[0].title}`
                    : peer.bio?.substring(0, 30) || "SkillSwap Member";

                return (
                  <div key={peer._id} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full relative overflow-hidden ring-1 ring-transparent hover:ring-[#3bb4a1]/20">
                    {/* Decorative Header */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#013e38] to-[#3bb4a1]"></div>

                    {/* Card Header */}
                    <div className="flex items-start gap-4 mb-6 pt-2">
                      <div className="relative">
                        <img
                          src={peer.picture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                          alt={peer.name}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm" title="Online"></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-lg leading-tight hover:text-[#3bb4a1] transition-colors cursor-pointer truncate font-['Oswald'] tracking-wide">
                          <Link to={`/profile/${peer.username || peer._id}`} className="no-underline">{peer.name}</Link>
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 font-medium">{role}</p>
                      </div>
                    </div>

                    {/* Teaching & Learning Blocks */}
                    <div className="space-y-3 mb-6 flex-1">
                      {/* Teaching */}
                      <div className="bg-[#e6f7f4] rounded-xl p-4 border border-[#bcece5]/50 group-hover:bg-[#d1f2ed] transition-colors">
                        <div className="flex items-center gap-2 text-[10px] font-extrabold text-[#013e38] mb-1.5 uppercase tracking-widest font-['Oswald']">
                          <FaChalkboardTeacher className="text-base text-[#3bb4a1]" /> Teaching
                        </div>
                        <p className="text-sm font-semibold text-gray-800 ml-6 truncate">
                          {peer.skillsProficientAt?.[0]?.name || "Mentorship"}
                        </p>
                      </div>

                      {/* Learning */}
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 group-hover:bg-gray-100/80 transition-colors">
                        <div className="flex items-center gap-2 text-[10px] font-extrabold text-gray-500 mb-1.5 uppercase tracking-widest font-['Oswald']">
                          <FaUserGraduate className="text-base text-gray-400" /> Learning
                        </div>
                        <p className="text-sm font-semibold text-gray-800 ml-6 truncate">
                          {peer.skillsToLearn?.[0]?.name || "New Skills"}
                        </p>
                      </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex gap-3 mt-auto">
                      <Link
                        to={`/profile/${peer.username || peer._id}`}
                        className="flex-1 py-3 text-center text-gray-600 font-bold text-xs sm:text-sm bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200 no-underline"
                      >
                        Profile
                      </Link>
                      {connected ? (
                        <button
                          onClick={() => navigate('/chat')}
                          className="flex-1 py-3 flex items-center justify-center gap-2 bg-[#3bb4a1] text-white rounded-xl hover:bg-[#2fa08e] transition-colors shadow-md hover:shadow-lg font-bold text-xs sm:text-sm"
                        >
                          <FaComments /> Chat
                        </button>
                      ) : isSent ? (
                        <button
                          onClick={() => handleUnsendRequest(peer._id)}
                          className="flex-1 py-3 flex items-center justify-center gap-2 bg-white border-2 border-gray-100 text-gray-400 rounded-xl hover:bg-red-50 hover:border-red-100 hover:text-red-500 transition-all font-bold text-xs sm:text-sm group/unsend shadow-sm"
                        >
                          <FaClock className="group-hover/unsend:hidden" />
                          <span className="group-hover/unsend:hidden">Requested</span>
                          <FaUserTimes className="hidden group-hover/unsend:block" />
                          <span className="hidden group-hover/unsend:block">Unsend</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConnect(peer._id)}
                          className="flex-1 py-3 flex items-center justify-center gap-2 bg-[#013e38] text-white rounded-xl hover:bg-[#012b27] transition-colors shadow-md hover:shadow-lg font-bold text-xs sm:text-sm group/btn"
                        >
                          <FaUserPlus className="group-hover/btn:scale-110 transition-transform" /> Connect
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Load More Button */}
            {page < totalPages && (
              <div className="flex justify-center mt-12 mb-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-10 py-3 bg-white border-2 border-[#3bb4a1] text-[#3bb4a1] font-bold rounded-xl hover:bg-[#3bb4a1] hover:text-white transition-all shadow-md  uppercase tracking-wide text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span> Loading...
                    </span>
                  ) : "Load More Peers"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PeerSwap;
