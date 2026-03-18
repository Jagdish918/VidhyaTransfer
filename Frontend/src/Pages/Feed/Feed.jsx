import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { io } from "socket.io-client";
import { useUser } from "../../util/UserContext";
import PostCard from "./PostCard";
import CreatePostModal from "./CreatePostModal";
import PostSkeleton from "./PostSkeleton";
import DailyQuizModal from "./DailyQuizModal";
import { FaSearch, FaFilter, FaBell, FaCommentDots, FaUserCircle, FaPlus, FaImage, FaVideo, FaCalendarAlt, FaUserPlus, FaQuestion } from "react-icons/fa";

const Feed = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [posts, setPosts] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedDomain, setSelectedDomain] = useState("All");
  const [isPostModalOpen, setIsPostModalOpen] = useState(false); // Changed from showCreateModal
  const [searchQuery, setSearchQuery] = useState("");
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const observer = useRef();
  const socketRef = useRef(null);

  const domains = ["All", "Programming", "Design", "Business", "Marketing", "Writing"];
  const trendingSkills = ["JavaScript", "DigitalMarketing", "UIUX", "DataScience", "React", "Python"];
  const [suggestedPeers, setSuggestedPeers] = useState([]);

  useEffect(() => {
    const fetchSuggestedPeers = async () => {
      try {
        const { data } = await axios.get("/user/discover", { params: { limit: 5 } });
        if (data.success) {
          setSuggestedPeers(data.data.users.slice(0, 5));
        }
      } catch (err) {
        console.warn("Could not fetch suggested peers", err);
      }
    };
    fetchSuggestedPeers();
  }, []);

  useEffect(() => {
    // Initialize socket connection
    try {
      const baseURL = axios.defaults.baseURL;
      socketRef.current = io(baseURL, {
        withCredentials: true,
      });

      socketRef.current.on("connect", () => {
        console.log("Connected to socket");
        socketRef.current.emit("join feed");
      });

      socketRef.current.on("new post", (newPost) => {
        setPosts((prev) => [newPost, ...prev]);
        setNewPostsCount((prev) => prev + 1);
        toast.info("📬 New post available!", { autoClose: 2000 });
      });

      socketRef.current.on("post updated", ({ postId, likesCount, commentsCount }) => {
        setPosts((prev) =>
          prev.map((post) =>
            post._id === postId
              ? { ...post, likes: post.likes.slice(0, likesCount), likesCount, commentsCount }
              : post
          )
        );
      });

      socketRef.current.on("disconnect", () => {
        console.log("Socket disconnected");
      });

      socketRef.current.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });
    } catch (error) {
      console.error("Error initializing socket:", error);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const fetchPosts = useCallback(
    async (pageNum, domain) => {
      setLoading(true);
      try {
        const { data } = await axios.get("/post/feed", {
          params: { page: pageNum, limit: 10, domain: domain === "All" ? "" : domain },
        });

        if (data.success) {
          setPosts((prev) =>
            pageNum === 1 ? data.data.posts : [...prev, ...data.data.posts]
          );
          setHasMore(data.data.hasMore);
        }
      } catch (error) {
        console.error("Error loading feed:", error);
        if (error.response?.status === 401) {
          // toast.error("Please login to view feed");
        } else {
          if (pageNum > 1) toast.error("Error loading more posts");
        }
      } finally {
        setLoading(false);
        if (pageNum === 1) setInitialLoading(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    // Reset and fetch posts when domain changes
    setPage(1);
    setPosts([]);
    fetchPosts(1, selectedDomain);
  }, [selectedDomain, fetchPosts]);

  const lastPostElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  useEffect(() => {
    if (page > 1) {
      fetchPosts(page, selectedDomain);
    }
  }, [page, selectedDomain, fetchPosts]);

  const handleCreatePost = async (postData) => {
    try {
      const { data } = await axios.post("/post", postData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      if (data.success) {
        toast.success("Post created successfully");
        setIsPostModalOpen(false); // Changed from setShowCreateModal
        // Post will be added via socket or manual refetch if socket fails
        if (!socketRef.current?.connected) {
          fetchPosts(1, selectedDomain);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error creating post");
    }
  };

  return (
    <div className="h-screen bg-[#fafafa] font-['Montserrat'] overflow-hidden flex flex-col">
      <div className="flex-1 max-w-[1400px] mx-auto px-4 lg:px-6 h-full flex flex-col pt-6 overflow-hidden">
        {/* Mobile Filter */}
        <div className="lg:hidden overflow-x-auto py-4 scrollbar-hide shrink-0">
          <div className="flex space-x-2">
            {domains.map((domain) => (
              <button
                key={domain}
                onClick={() => setSelectedDomain(domain)}
                className={`whitespace-nowrap px-6 py-2.5 rounded-full text-[10px] uppercase font-black tracking-widest transition-all ${selectedDomain === domain
                  ? "bg-[#013e38] text-white shadow-lg shadow-[#013e38]/20"
                  : "bg-white text-gray-400 border border-gray-100 hover:text-gray-900"
                  } `}
              >
                {domain}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start h-full pb-10">
          {/* Column 1: Navigation & Profile (Fixed) */}
          <div className="hidden lg:block lg:col-span-3 pt-4 h-full">
            <div className="flex flex-col gap-6 items-end pr-4">
              {/* User Mini Profile Card */}
              <div className="w-full max-w-[240px] bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 group hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] transition-all duration-500">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <img 
                      src={user?.picture || "/default-avatar.png"} 
                      alt="Me" 
                      className="w-20 h-20 rounded-[1.5rem] object-cover ring-4 ring-[#3bb4a1]/10 group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#3bb4a1] border-4 border-white rounded-full flex items-center justify-center text-[10px] text-white">✓</span>
                  </div>
                  <h4 className="font-black text-gray-900 text-sm tracking-tight mb-0.5">{user?.name}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">@{user?.username}</p>
                  <button 
                    onClick={() => navigate('/profile')}
                    className="w-full py-2.5 bg-[#fafafa] hover:bg-[#3bb4a1] hover:text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all"
                  >
                    View Profile
                  </button>
                </div>
              </div>

              {/* Domains Navigation */}
              <div className="w-full max-w-[240px]">
                <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 pl-6 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#3bb4a1] rounded-full"></span>
                  Explore Domains
                </h3>
                <div className="space-y-1">
                  {domains.map((domain) => (
                    <button
                      key={domain}
                      onClick={() => setSelectedDomain(domain)}
                      className={`w-full text-left px-6 py-3.5 rounded-2xl text-[10px] uppercase font-black tracking-widest transition-all duration-300 ${selectedDomain === domain
                        ? "bg-[#013e38] text-white shadow-xl shadow-[#013e38]/10 translate-x-1"
                        : "text-gray-400 hover:bg-white hover:text-gray-900 border border-transparent hover:border-gray-50"
                        } `}
                    >
                      {domain}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Main Feed Content (Scrollable) */}
          <div className="lg:col-span-6 h-full overflow-y-auto scrollbar-hide pt-4 px-6 pb-32">
            {/* Create Post Box */}
            <div className="bg-white rounded-xl border border-gray-100 p-3 mb-6 shadow-sm group">
              <div className="flex gap-3 mb-3">
                <img
                  src={user?.picture || "/default-avatar.png"}
                  alt="My avatar"
                  className="w-9 h-9 rounded-full object-cover border border-gray-50"
                />
                <button
                  onClick={() => setIsPostModalOpen(true)}
                  className="flex-1 bg-gray-50 hover:bg-gray-100 rounded-lg px-4 py-2 text-left text-[12px] text-gray-400 font-medium transition-all flex items-center"
                >
                  Start a post...
                </button>
              </div>
              <div className="flex items-center justify-between border-t border-gray-50 pt-2.5">
                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsPostModalOpen(true)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] font-bold text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-all"
                  >
                    <FaImage size={14} className="text-blue-400" /> Photo
                  </button>
                  <button 
                    onClick={() => setIsPostModalOpen(true)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] font-bold text-gray-400 hover:bg-green-50 hover:text-green-500 transition-all"
                  >
                    <FaVideo size={14} className="text-green-400" /> Video
                  </button>
                  <button 
                    onClick={() => setIsPostModalOpen(true)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] font-bold text-gray-400 hover:bg-orange-50 hover:text-orange-500 transition-all"
                  >
                    <FaCalendarAlt size={14} className="text-orange-400" /> Event
                  </button>
                </div>
                <button 
                   onClick={() => setIsPostModalOpen(true)}
                   className="px-4 py-1.5 bg-[#013e38] text-white rounded-md text-[11px] font-bold hover:bg-[#3bb4a1] transition-all"
                >
                  Post
                </button>
              </div>
            </div>

            {newPostsCount > 0 && (
              <button
                onClick={() => {
                  setNewPostsCount(0);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="mb-8 w-full py-4 bg-[#3bb4a1]/10 text-[#3bb4a1] rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.25em] hover:bg-[#3bb4a1]/20 transition-all border border-[#3bb4a1]/20"
              >
                {newPostsCount} New Posts
              </button>
            )}

            {/* Content List */}
            {initialLoading ? (
              <div className="space-y-6">
                <PostSkeleton />
                <PostSkeleton />
              </div>
            ) : (
              <div className="space-y-8">
                {(() => {
                  const filteredPosts = searchQuery
                    ? posts.filter(post =>
                      post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      post.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      post.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    : posts;

                  if (filteredPosts.length === 0 && !loading) {
                    return (
                      <div className="text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                        <div className="mx-auto w-20 h-20 bg-[#fafafa] rounded-full flex items-center justify-center mb-6">
                          <span className="text-3xl opacity-50">📭</span>
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight">No posts yet</h3>
                        <p className="text-sm font-medium text-gray-500 max-w-sm mx-auto mb-8">
                          Be the first to share in the <span className="font-bold text-[#3bb4a1]">{selectedDomain}</span> domain!
                        </p>
                        <button
                          onClick={() => setShowCreateModal(true)}
                          className="px-8 py-4 bg-[#013e38] text-white text-[10px] uppercase font-black tracking-[0.25em] rounded-[1.2rem] hover:bg-[#3bb4a1] transition-all shadow-xl shadow-[#013e38]/20 hover:shadow-[#3bb4a1]/30"
                        >
                          Create Post
                        </button>
                      </div>
                    );
                  }

                  return filteredPosts.map((post, index) => (
                    <div
                      key={post._id}
                      ref={index === filteredPosts.length - 1 ? lastPostElementRef : null}
                    >
                      <PostCard post={post} />
                    </div>
                  ));
                })()}

                {loading && (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-gray-100 border-t-[#3bb4a1]"></div>
                  </div>
                )}

                {!hasMore && posts.length > 0 && (
                  <div className="text-center py-16">
                    <p className="text-gray-300 text-[10px] font-black uppercase tracking-[0.25em]">You're all caught up!</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Column 3: Suggestions (Unscrollable) */}
          <div className="hidden lg:block lg:col-span-3 pt-4">
            <div className="max-w-[220px]">
              <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">Discover</h3>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                  {suggestedPeers.map((peer) => (
                    <div key={peer._id} className="flex flex-col items-center gap-1.5 group cursor-pointer min-w-[48px]" onClick={() => navigate(`/profile/${peer.username}`)}>
                      <div className="relative">
                        <img 
                          src={peer.picture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                          alt={peer.name} 
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-[#3bb4a1] group-hover:scale-105 transition-all"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gray-100 rounded-full flex items-center justify-center border-2 border-white group-hover:bg-[#3bb4a1] transition-colors">
                          <FaPlus size={4} className="text-gray-400 group-hover:text-white" />
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-gray-500 group-hover:text-gray-900 transition-colors">{peer.name.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isPostModalOpen && (
        <CreatePostModal
          onClose={() => setIsPostModalOpen(false)}
          onSubmit={handleCreatePost}
        />
      )}

      {/* Floating Daily Quiz Button */}
      <button 
        onClick={() => setShowQuizModal(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-[#013e38] to-[#3bb4a1] rounded-full shadow-2xl flex items-center justify-center text-white text-2xl hover:scale-110 transition-transform z-50 group border-4 border-white"
      >
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        <FaQuestion className="group-hover:rotate-12 transition-transform" />
      </button>

      <DailyQuizModal 
        isOpen={showQuizModal} 
        onClose={() => setShowQuizModal(false)} 
      />
    </div>
  );
};

export default Feed;