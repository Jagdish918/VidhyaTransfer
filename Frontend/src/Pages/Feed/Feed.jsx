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
import { FaFire, FaUserPlus, FaHashtag, FaQuestion } from "react-icons/fa";

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
  const [showQuizModal, setShowQuizModal] = useState(false);
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
    <div className="min-h-screen bg-[#f8fafe] font-sans pb-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">

        {/* Mobile Filter */}
        <div className="lg:hidden overflow-x-auto pb-4 scrollbar-hide mb-4">
          <div className="flex space-x-2">
            {domains.map((domain) => (
              <button
                key={domain}
                onClick={() => setSelectedDomain(domain)}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-all ${selectedDomain === domain
                  ? "bg-[#3f51b5] text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-100"
                  } `}
              >
                {domain}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Column 1: Domain Filter */}
          <div className="hidden lg:block lg:col-span-2 sticky top-24">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6 px-2">Domain Filter</h3>
            <div className="space-y-1">
              {domains.map((domain) => (
                <button
                  key={domain}
                  onClick={() => setSelectedDomain(domain)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${selectedDomain === domain
                    ? "bg-[#3f51b5] text-white shadow-md shadow-blue-500/10"
                    : "text-gray-600 hover:bg-white hover:text-[#3f51b5]"
                    } `}
                >
                  {domain}
                </button>
              ))}
            </div>
          </div>

          {/* Column 2: Main Feed Content (Scrollable) */}
          <div className="lg:col-span-7">
            {/* Create Post Box */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-8 shadow-sm">
              <div className="flex gap-4 mb-4">
                <img
                  src={user?.picture || "/default-avatar.png"}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-sm"
                />
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex-1 bg-gray-50 hover:bg-gray-100 text-left text-gray-400 rounded-xl px-4 py-2.5 transition-all text-sm border-none cursor-pointer"
                >
                  What's on your mind? Share an update or an image...
                </button>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                <div className="flex gap-6">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 text-gray-500 hover:text-[#3f51b5] text-[11px] font-bold transition-colors py-1 group"
                  >
                    <span className="text-xl group-hover:scale-110 transition-transform">🖼️</span>
                    <span>Photo</span>
                  </button>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 text-gray-500 hover:text-[#3f51b5] text-[11px] font-bold transition-colors py-1 group"
                  >
                    <span className="text-xl group-hover:scale-110 transition-transform">📹</span>
                    <span>Video</span>
                  </button>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 text-gray-500 hover:text-[#3f51b5] text-[11px] font-bold transition-colors py-1 group"
                  >
                    <span className="text-xl group-hover:scale-110 transition-transform">📅</span>
                    <span>Event</span>
                  </button>
                </div>
              </div>
            </div>

            {newPostsCount > 0 && (
              <button
                onClick={() => {
                  setNewPostsCount(0);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="mb-8 w-full py-3 bg-[#3f51b5]/10 text-[#3f51b5] rounded-xl text-xs font-bold hover:bg-[#3f51b5]/20 transition-all border border-[#3f51b5]/20"
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
                      <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                        <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                          <span className="text-2xl opacity-50">📭</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No posts yet</h3>
                        <p className="text-sm text-gray-500 max-w-sm mx-auto mb-8">
                          Be the first to share in the <span className="font-semibold text-[#3f51b5]">{selectedDomain}</span> domain!
                        </p>
                        <button
                          onClick={() => setShowCreateModal(true)}
                          className="px-8 py-3 bg-[#3f51b5] text-white text-sm font-bold rounded-xl hover:bg-[#303f9f] transition-all shadow-lg"
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
                    <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-gray-200 border-t-[#3f51b5]"></div>
                  </div>
                )}

                {!hasMore && posts.length > 0 && (
                  <div className="text-center py-16">
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-widest">You're all caught up!</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Column 3: Premium Notice & Suggestions */}
          <div className="hidden lg:block lg:col-span-3 sticky top-24 space-y-6">
            <div className="bg-gradient-to-br from-[#3f51b5] to-[#5c6bc0] rounded-2xl p-6 text-white shadow-lg overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 bg-white/10 rounded-full -mr-6 -mt-6 transform group-hover:scale-110 transition-transform duration-700"></div>
              <h3 className="font-bold text-lg mb-2 relative z-10">Premium Access</h3>
              <p className="text-xs text-blue-50/80 mb-6 leading-relaxed relative z-10">Unlock advanced analytics, unlimited peer connections, and exclusive content.</p>
              <button className="w-full py-2 bg-white text-[#3f51b5] font-bold rounded-xl text-xs hover:bg-gray-50 transition-all shadow-md relative z-10">
                Upgrade Now
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6">Suggested Skills</h3>
              <div className="flex flex-wrap gap-2">
                {trendingSkills.map(skill => (
                  <span key={skill} className="text-[10px] font-bold bg-gray-50 text-gray-500 border border-gray-100 px-3 py-1.5 rounded-lg hover:border-[#3f51b5] hover:text-[#3f51b5] cursor-pointer transition-all uppercase tracking-tight">
                    #{skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
              <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                <span className="font-bold">Did you know?</span> Verified profiles get 3x more connection requests. Complete your profile today!
              </p>
            </div>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
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