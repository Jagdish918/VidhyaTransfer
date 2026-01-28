import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { io } from "socket.io-client";
import { useUser } from "../../util/UserContext";
import PostCard from "./PostCard";
import CreatePostModal from "./CreatePostModal";
import PostSkeleton from "./PostSkeleton";
import { FaFire, FaUserPlus, FaHashtag } from "react-icons/fa";

const Feed = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [posts, setPosts] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedDomain, setSelectedDomain] = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newPostsCount, setNewPostsCount] = useState(0);
  const observer = useRef();
  const socketRef = useRef(null);

  const domains = ["All", "Programming", "Design", "Business", "Marketing", "Writing"];
  const trendingSkills = ["JavaScript", "DigitalMarketing", "UIUX", "DataScience", "React", "Python"];
  const suggestedPeers = [
    { id: 1, name: "Sarah Chen", role: "Product Designer", avatar: null, mutual: 3 },
    { id: 2, name: "Mike Johnson", role: "Frontend Dev", avatar: null, mutual: 1 },
    { id: 3, name: "Emma Wilson", role: "Data Analyst", avatar: null, mutual: 5 },
  ];

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
        setShowCreateModal(false);
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
    <div className="h-[calc(100vh-80px)] bg-[#f0f2f5] font-['Montserrat'] overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 h-full pt-6">

        {/* Left Sidebar - Fixed */}
        <div className="hidden lg:block lg:col-span-3 h-full overflow-y-auto scrollbar-hide pb-10">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-8">
            <div>
              <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4 px-2 font-['Oswald']">Feeds</h3>
              <div className="space-y-2">
                {domains.map((domain) => (
                  <button
                    key={domain}
                    onClick={() => setSelectedDomain(domain)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 duration-200 group ${selectedDomain === domain
                      ? "bg-[#3bb4a1] text-white shadow-md shadow-[#3bb4a1]/20"
                      : "text-gray-600 hover:bg-gray-50 hover:text-[#3bb4a1]"
                      } `}
                  >
                    <span className={`text-lg ${selectedDomain === domain ? 'text-white' : 'text-gray-400 group-hover:text-[#3bb4a1] transition-colors'}`}>
                      {domain === 'All' ? '🏠' : '#'}
                    </span>
                    {domain}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4 px-2 flex items-center gap-2 font-['Oswald']">
                <FaFire className="text-orange-500" /> Trending Topics
              </h3>
              <div className="flex flex-wrap gap-2 px-1">
                {trendingSkills.slice(0, 5).map(skill => (
                  <span key={skill} className="text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-[#3bb4a1] hover:text-[#3bb4a1] cursor-pointer transition-all">
                    #{skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Filter */}
        <div className="lg:hidden col-span-1 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide mb-4">
          <div className="flex space-x-2">
            {domains.map((domain) => (
              <button
                key={domain}
                onClick={() => setSelectedDomain(domain)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold border transition-all ${selectedDomain === domain
                  ? "bg-[#3bb4a1] text-white border-[#3bb4a1] shadow-lg shadow-[#3bb4a1]/20"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  } `}
              >
                {domain}
              </button>
            ))}
          </div>
        </div>

        {/* Main Feed - Scrollable */}
        <div className="lg:col-span-6 h-full overflow-y-scroll scrollbar-hide pb-20 px-1" id="feed-scroll-container">
          <div className="space-y-6">
            {/* Create Post Box */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 transition-shadow hover:shadow-md">
              <div className="flex gap-4 mb-4">
                <img
                  src={user?.picture || "/default-avatar.png"}
                  alt="Profile"
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0"
                />
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex-1 bg-gray-50 hover:bg-gray-100 text-left text-gray-500 rounded-2xl px-5 py-3 transition-all border border-gray-100 cursor-pointer group"
                >
                  <span className="font-semibold text-gray-700 block mb-1 group-hover:text-[#013e38] transition-colors">Start a post</span>
                  <span className="text-xs text-gray-400">Share your learning journey, ask questions...</span>
                </button>
              </div>
              <div className="flex justify-between items-center sm:px-2 pt-2 border-t border-gray-50">
                <div className="flex gap-6">
                  <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 text-gray-500 hover:text-[#3bb4a1] text-sm font-semibold transition-colors py-2">
                    <span className="text-green-500 text-lg">🖼️</span> Media
                  </button>
                  <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 text-gray-500 hover:text-[#3bb4a1] text-sm font-semibold transition-colors py-2">
                    <span className="text-purple-500 text-lg">📅</span> Event
                  </button>
                  <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 text-gray-500 hover:text-[#3bb4a1] text-sm font-semibold transition-colors py-2">
                    <span className="text-red-500 text-lg">📝</span> Article
                  </button>
                </div>
              </div>
            </div>

            {newPostsCount > 0 && (
              <button
                onClick={() => {
                  setNewPostsCount(0);
                  document.getElementById('feed-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full py-3 bg-[#3bb4a1]/10 text-[#3bb4a1] rounded-xl text-sm font-bold hover:bg-[#3bb4a1]/20 transition-all flex items-center justify-center gap-3 backdrop-blur-sm sticky top-0 z-10 border border-[#3bb4a1]/20"
              >
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3bb4a1] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#3bb4a1]"></span>
                </span>
                {newPostsCount} New Posts
              </button>
            )}

            {/* Skeleton Loaders */}
            {initialLoading && (
              <>
                <PostSkeleton />
                <PostSkeleton />
              </>
            )}

            {!initialLoading && (() => {
              // Client-side search filtering
              const filteredPosts = searchQuery
                ? posts.filter(post =>
                  post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  post.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  post.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
                )
                : posts;

              return (
                <>
                  {filteredPosts.length === 0 && !loading && (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
                      <div className="mx-auto w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                        <span className="text-4xl grayscale opacity-50">📭</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 font-['Oswald']">
                        No posts yet
                      </h3>
                      <p className="text-gray-500 max-w-sm mx-auto mb-6">
                        Be the first to share your knowledge or ask a question in the <span className="font-semibold text-[#013e38]">{selectedDomain}</span> domain!
                      </p>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-8 py-3 bg-[#3bb4a1] text-white font-bold rounded-xl hover:bg-[#2fa08e] transition-all shadow-lg shadow-[#3bb4a1]/30 hover:-translate-y-0.5"
                      >
                        Create Post
                      </button>
                    </div>
                  )}

                  {filteredPosts.map((post, index) => (
                    <div
                      key={post._id}
                      ref={index === filteredPosts.length - 1 ? lastPostElementRef : null}
                    >
                      <PostCard post={post} />
                    </div>
                  ))}
                </>
              );
            })()}

            {loading && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-[#3bb4a1]"></div>
              </div>
            )}

            {!hasMore && posts.length > 0 && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-xl mb-3">🎉</div>
                <p className="text-gray-400 text-sm font-medium">You're all caught up!</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Fixed */}
        <div className="hidden lg:block lg:col-span-3 h-full overflow-y-auto scrollbar-hide pb-10 space-y-6">
          {/* Suggested Connections */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-extrabold text-gray-900 font-['Oswald'] tracking-wide">SUGGESTED FOR YOU</h3>
              <button className="text-xs font-bold text-[#3bb4a1] hover:text-[#013e38] transition-colors">SEE ALL</button>
            </div>

            <div className="space-y-5">
              {suggestedPeers.map(peer => (
                <div key={peer.id} className="flex items-center gap-3 group">
                  <div className="relative">
                    <img
                      src={peer.avatar || `https://ui-avatars.com/api/?name=${peer.name}&background=random`}
                      alt={peer.name}
                      className="w-10 h-10 rounded-full object-cover border border-gray-100 group-hover:border-[#3bb4a1] transition-colors"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-[#3bb4a1] transition-colors">{peer.name}</h4>
                    <p className="text-xs text-gray-500 truncate">{peer.role}</p>
                  </div>
                  <button className="p-2 text-[#3bb4a1] hover:bg-[#3bb4a1]/10 rounded-full transition-colors" title="Connect">
                    <FaUserPlus />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Promo / Footer Links */}
          <div className="bg-gradient-to-br from-[#013e38] to-[#3bb4a1] rounded-2xl shadow-lg p-6 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 bg-white/5 rounded-full -mr-4 -mt-4 transform group-hover:scale-110 transition-transform duration-700"></div>
            <h3 className="font-extrabold text-lg mb-2 font-['Oswald'] tracking-wide relative z-10">PREMIUM ACCESS</h3>
            <p className="text-sm text-blue-50/80 mb-6 leading-relaxed relative z-10">Unlock advanced analytics, unlimited peer connections, and exclusive content.</p>
            <button className="w-full py-2.5 bg-white text-[#013e38] font-bold rounded-xl text-sm hover:bg-gray-50 transition-all shadow-lg relative z-10 transform hover:-translate-y-0.5">
              Try Premium Free
            </button>
          </div>

          {/* <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-400 px-4 justify-center font-medium">
            <a href="#" className="hover:text-[#3bb4a1] transition-colors">About</a>
            <a href="#" className="hover:text-[#3bb4a1] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#3bb4a1] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#3bb4a1] transition-colors">Help</a>
            <span className="opacity-50">© 2026 SkillSwap</span>
          </div> */}
        </div>
      </div>

      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePost}
        />
      )}
    </div>
  );
};

export default Feed;