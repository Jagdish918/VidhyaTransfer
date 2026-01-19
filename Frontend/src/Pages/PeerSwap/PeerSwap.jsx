import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../../util/UserContext";
import axios from "axios";
import { FaSearch, FaFilter, FaChalkboardTeacher, FaUserGraduate, FaComments, FaUserPlus } from "react-icons/fa";
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

  const handleConnect = async (peerId) => {
    try {
      await axios.post("http://localhost:8000/request/create", { receiverID: peerId }, { withCredentials: true });
      toast.success("Connection request sent!");
    } catch (error) {
      console.error("Connection error:", error);
      if (error.response?.status === 400 && error.response.data.message.includes("Request already exists")) {
        toast.info("Request already pending.");
      } else {
        toast.error("Failed to send request.");
      }
    }
  };

  const handleLoadMore = () => {
    if (page < totalPages) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header & Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Find Your Perfect Peer Match</h1>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search for peers, specific skills, or names..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Peers Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-xl h-80 animate-pulse shadow-sm border border-gray-100"></div>
            ))}
          </div>
        ) : peers.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 text-lg">No peers found matching your criteria.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center text-gray-500 text-sm px-1">
              <span>Showing {peers.length} peers</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {peers.map(peer => {
                const connected = isConnected(peer._id);
                // Derived Role
                const role = peer.education?.[0]?.degree
                  ? `${peer.education[0].degree} @ ${peer.education[0].institution}`
                  : peer.projects?.[0]?.title
                    ? `Project: ${peer.projects[0].title}`
                    : peer.bio?.substring(0, 30) || "SkillSwap Member";

                return (
                  <div key={peer._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all group flex flex-col h-full">
                    {/* Card Header */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex gap-4">
                        <div className="relative">
                          <img
                            src={peer.picture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                            alt={peer.name}
                            className="w-12 h-12 rounded-full object-cover border border-gray-100"
                          />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg leading-tight hover:text-blue-600 transition-colors cursor-pointer">
                            <Link to={`/profile/${peer.username || peer._id}`}>{peer.name}</Link>
                          </h3>
                          <p className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">{role}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-green-500 uppercase tracking-wide bg-green-50 px-2 py-1 rounded-md">
                        Online
                      </span>
                    </div>

                    {/* Teaching & Learning Blocks */}
                    <div className="space-y-3 mb-6 flex-1">
                      {/* Teaching */}
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 mb-1 uppercase tracking-wider">
                          <FaChalkboardTeacher className="text-lg" /> Teaching
                        </div>
                        <p className="text-sm font-medium text-gray-800 ml-7">
                          {peer.skillsProficientAt?.[0]?.name || "Mentorship"}
                        </p>
                      </div>

                      {/* Learning */}
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-pink-600 mb-1 uppercase tracking-wider">
                          <FaUserGraduate className="text-lg" /> Learning
                        </div>
                        <p className="text-sm font-medium text-gray-800 ml-7">
                          {peer.skillsToLearn?.[0]?.name || "New Skills"}
                        </p>
                      </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex gap-3 mt-auto">
                      <Link to={`/profile/${peer.username || peer._id}`} className="flex-1 py-2.5 text-center text-blue-600 font-semibold text-sm border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                        View Profile
                      </Link>
                      {connected ? (
                        <button
                          onClick={() => navigate('/chat')}
                          className="w-12 flex items-center justify-center bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                          title="Message"
                        >
                          <FaComments />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConnect(peer._id)}
                          className="w-12 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                          title="Connect"
                        >
                          <FaUserPlus />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Load More Button */}
            {page < totalPages && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
                >
                  {loadingMore ? "Loading..." : "Load More Peers"}
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
