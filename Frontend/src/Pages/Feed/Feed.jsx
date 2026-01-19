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
      const { data } = await axios.post("/post", postData);
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
    <div className="min-h-screen bg-gray-50 pt-6 pb-12">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Sidebar - Navigation & Filters */}
        <div className="hidden lg:block lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-24 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Feeds</h3>
              <div className="space-y-1">
                {domains.map((domain) => (
                  <button
                    key={domain}
                    onClick={() => setSelectedDomain(domain)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-3 ${selectedDomain === domain
                      ? "bg-blue-50 text-blue-600 border border-blue-100 shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      } `}
                  >
                    <span className={`${selectedDomain === domain ? 'text-blue-500' : 'text-gray-400'}`}>
                      {domain === 'All' ? '🏠' : '#'}
                    </span>
                    {domain}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
                <FaFire className="text-orange-500" /> Trending Topics
              </h3>
              <div className="flex flex-wrap gap-2 px-1">
                {trendingSkills.slice(0, 5).map(skill => (
                  <span key={skill} className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded-md hover:bg-gray-200 cursor-pointer">
                    #{skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Filter */}
        <div className="lg:hidden col-span-1 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          <div className="flex space-x-2">
            {domains.map((domain) => (
              <button
                key={domain}
                onClick={() => setSelectedDomain(domain)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium border transition-all ${selectedDomain === domain
                  ? "bg-blue-600 text-white border-blue-600 shadow-md"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  } `}
              >
                {domain}
              </button>
            ))}
          </div>
        </div>

        {/* Main Feed */}
        <div className="lg:col-span-6 space-y-6">
          {/* Create Post Box */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5">
            <div className="flex gap-4 mb-4">
              <img
                src={user?.picture || "/default-avatar.png"}
                alt="Profile"
                className="w-12 h-12 rounded-full object-cover border border-gray-100 flex-shrink-0"
              />
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex-1 bg-gray-50 hover:bg-gray-100 text-left text-gray-500 rounded-xl px-4 py-3 transition-all border border-gray-200 shadow-inner text-sm sm:text-base cursor-pointer"
              >
                <span className="font-medium text-gray-700 block mb-0.5">Start a post</span>
                <span className="text-xs text-gray-400">Share your learning journey, ask questions, or offer help...</span>
              </button>
            </div>
            <div className="flex justify-between items-center sm:px-2 pt-2">
              <div className="flex gap-4">
                <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors">
                  <span className="text-green-500">🖼️</span> Media
                </button>
                <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors">
                  <span className="text-purple-500">📅</span> Event
                </button>
                <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors">
                  <span className="text-red-500">📝</span> Article
                </button>
              </div>
            </div>
          </div>

          {newPostsCount > 0 && (
            <button
              onClick={() => { setNewPostsCount(0); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 shadow-sm border border-blue-100"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              {newPostsCount} New Posts
            </button>
          )}

          <div className="space-y-6">
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
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm border-dashed">
                      <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                        <span className="text-2xl">📭</span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">
                        No posts yet
                      </h3>
                      <p className="text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                        Be the first to share your knowledge or ask a question in the {selectedDomain} domain!
                      </p>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}

            {!hasMore && posts.length > 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">All caught up! 🎉</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Suggested & Trending */}
        <div className="hidden lg:block lg:col-span-3 space-y-6">
          {/* Suggested Connections */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-24">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-gray-900">Suggested For You</h3>
              <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">See All</button>
            </div>

            <div className="space-y-4">
              {suggestedPeers.map(peer => (
                <div key={peer.id} className="flex items-start gap-3">
                  <img
                    src={peer.avatar || `https://ui-avatars.com/api/?name=${peer.name}&background=random`}
                    alt={peer.name}
                    className="w-10 h-10 rounded-full object-cover border border-gray-100"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">{peer.name}</h4>
                    <p className="text-xs text-gray-500 truncate">{peer.role}</p>
                    <button className="mt-2 w-full py-1.5 flex items-center justify-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                      <FaUserPlus /> Connect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Promo / Footer Links */}
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md p-5 text-white">
            <h3 className="font-bold text-lg mb-2">Premium Access</h3>
            <p className="text-sm text-blue-100 mb-4">Unlock advanced analytics and unlimited peer connections.</p>
            <button className="w-full py-2 bg-white text-blue-600 font-semibold rounded-lg text-sm hover:bg-blue-50 transition-colors">
              Try Premium
            </button>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-400 px-2 justify-center">
            <a href="#" className="hover:underline">About</a>
            <a href="#" className="hover:underline">Privacy</a>
            <a href="#" className="hover:underline">Terms</a>
            <a href="#" className="hover:underline">Help</a>
            <span>© 2026 SkillSwap</span>
          </div>
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