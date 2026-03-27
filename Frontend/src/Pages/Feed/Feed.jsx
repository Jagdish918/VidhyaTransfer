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
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const observer = useRef();
  const socketRef = useRef(null);

  const [suggestedPeers, setSuggestedPeers] = useState([]);

  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        const { data } = await axios.get("/user/discover", { params: { limit: 5 } });
        if (data.success) {
          setSuggestedPeers(data.data.users.slice(0, 5));
        }
      } catch (err) {
        console.warn("Could not fetch sidebar data", err);
      }
    };
    fetchSidebarData();
  }, []);

  useEffect(() => {
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

      socketRef.current.on("post updated", ({ postId, likesCount, commentsCount, comment, userId, type }) => {
        setPosts((prev) =>
          prev.map((post) => {
            if (post._id !== postId) return post;

            // Reconstruct basic counts
            const updatedPost = {
              ...post,
              likesCount,
              commentsCount
            };

            // Sync the 'likes' array so users see their heart stay red
            if (type === "like" && userId) {
              const currentLikes = post.likes || [];
              const isAlreadyLiked = currentLikes.some(l => (l._id || l) === userId);

              if (isAlreadyLiked) {
                updatedPost.likes = currentLikes.filter(l => (l._id || l) !== userId);
              } else {
                updatedPost.likes = [...currentLikes, userId];
              }
            }

            // Sync comments array
            if (type === "comment" && comment) {
              const currentComments = post.comments || [];
              const alreadyHas = currentComments.some(c => c._id === comment._id);
              if (!alreadyHas) {
                updatedPost.comments = [...currentComments, comment];
              }
            }

            return updatedPost;
          })
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
          params: { page: pageNum, limit: 10 },
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
    setPage(1);
    setPosts([]);
    fetchPosts(1);
  }, [fetchPosts]);

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
      fetchPosts(page);
    }
  }, [page, fetchPosts]);

  const handleCreatePost = async (postData) => {
    try {
      const { data } = await axios.post("/post", postData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      if (data.success) {
        toast.success("Post created successfully");
        setIsPostModalOpen(false);
          fetchPosts(1);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error creating post");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr,300px] gap-8 items-start">
          <div className="hidden lg:flex flex-col gap-6 sticky top-24">
            {/* User Profile Card */}
            <div className="bg-white rounded-3xl p-6 shadow-soft border border-slate-100 group transition-all duration-500 hover:shadow-card">
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 to-blue-500 rounded-full animate-pulse opacity-20 blur-xl group-hover:opacity-40 transition-opacity"></div>
                  <img
                    src={user?.picture || "/default-avatar.png"}
                    alt="Me"
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-xl relative z-10"
                  />
                  <div className="absolute bottom-1 right-1 w-6 h-6 bg-cyan-500 border-4 border-white rounded-full flex items-center justify-center shadow-lg z-20">
                    <span className="text-[10px] text-white">✓</span>
                  </div>
                </div>
                <h4 className="font-bold text-slate-900 text-lg mb-1">{user?.name}</h4>
                <p className="text-sm text-slate-500 font-medium mb-4">@{user?.username}</p>
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-2xl text-sm font-bold shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 hover:-translate-y-0.5 transition-all"
                >
                  Edit Profile
                </button>
              </div>
            </div>

          </div>

          {/* Column 2: Main Feed Content (Scrollable) */}
          <div className="pb-24">

            {/* Create Post Box */}
            <div className="bg-white rounded-3xl border border-slate-100 p-4 mb-8 shadow-soft group transition-all hover:shadow-card">
              <div className="flex gap-4 mb-4">
                <img
                  src={user?.picture || "/default-avatar.png"}
                  alt="My avatar"
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-50"
                />
                <button
                  onClick={() => setIsPostModalOpen(true)}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 rounded-2xl px-6 py-3.5 text-left text-sm text-slate-500 font-bold transition-all"
                >
                  Write something for {user?.name?.split(' ')[0]}...
                </button>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="flex gap-1 sm:gap-2">
                  {[
                    { icon: FaImage, color: 'text-blue-500', label: 'Photo', bg: 'hover:bg-blue-50' },
                    { icon: FaVideo, color: 'text-green-500', label: 'Video', bg: 'hover:bg-green-50' },
                    { icon: FaCalendarAlt, color: 'text-orange-500', label: 'Event', bg: 'hover:bg-orange-50' }
                  ].map((item, i) => (
                    <button
                      key={i}
                      onClick={() => setIsPostModalOpen(true)}
                      className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 ${item.bg} transition-all`}
                    >
                      <item.icon size={16} className={item.color} />
                      <span className="hidden sm:inline">{item.label}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setIsPostModalOpen(true)}
                  className="p-3 bg-cyan-500 text-white rounded-xl shadow-lg shadow-cyan-500/20 hover:scale-110 transition-transform"
                >
                  <FaPlus size={14} />
                </button>
              </div>
            </div>

            {newPostsCount > 0 && (
              <button
                onClick={() => {
                  setNewPostsCount(0);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="mb-6 w-full py-3 bg-cyan-500/10 text-cyan-400 rounded-xl text-sm font-bold shadow-md hover:bg-cyan-500/20 transition-all border border-cyan-500/30"
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
              <div className="space-y-6">
                {posts.length === 0 && !loading ? (
                  <div className="text-center py-20 bg-dark-card rounded-2xl border border-dashed border-dark-border shadow-soft">
                    <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-5 border border-dark-border">
                      <span className="text-2xl opacity-80">📭</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">No posts yet</h3>
                    <p className="text-sm text-slate-600 max-w-xs mx-auto mb-6">
                      Be the first to share your thoughts!
                    </p>
                    <button
                      onClick={() => setIsPostModalOpen(true)}
                      className="px-6 py-2.5 bg-cyan-500 text-dark-bg text-sm font-semibold rounded-lg hover:bg-cyan-400 transition-all shadow-md"
                    >
                      Create Post
                    </button>
                  </div>
                ) : (
                  posts.map((post, index) => (
                    <div
                      key={post._id}
                      ref={index === posts.length - 1 ? lastPostElementRef : null}
                    >
                      <PostCard post={post} />
                    </div>
                  ))
                )}

                {loading && (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-dark-border border-t-cyan-500"></div>
                  </div>
                )}

                {!hasMore && posts.length > 0 && (
                  <div className="text-center py-12">
                    <p className="text-slate-600 text-xs font-semibold uppercase tracking-widest">You're all caught up!</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="hidden lg:flex flex-col gap-6 sticky top-24">
            {/* Discover Peers */}
            <div className="bg-white rounded-3xl p-6 shadow-soft border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Discover Peers</h3>
                <button onClick={() => navigate('/discover')} className="text-[10px] font-bold text-cyan-500 hover:text-cyan-600 uppercase">View All</button>
              </div>
              <div className="flex flex-col gap-5">
                {suggestedPeers.map((peer) => (
                  <div key={peer._id} className="flex items-center gap-3 group">
                    <div className="relative cursor-pointer" onClick={() => navigate(`/profile/${peer.username}`)}>
                      <img
                        src={peer.picture || "/default-avatar.png"}
                        alt={peer.name}
                        className="w-11 h-11 rounded-2xl object-cover ring-2 ring-slate-50 group-hover:ring-cyan-100 transition-all"
                      />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1 cursor-pointer" onClick={() => navigate(`/profile/${peer.username}`)}>
                      <span className="text-sm font-bold text-slate-900 truncate group-hover:text-cyan-500 transition-colors">
                        {peer.name}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium truncate">@{peer.username}</span>
                    </div>
                    <button 
                      onClick={() => navigate(`/profile/${peer.username}`)}
                      className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-cyan-500 hover:text-white transition-all shadow-sm"
                    >
                      <FaUserPlus size={12} />
                    </button>
                  </div>
                ))}
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
        className="fixed bottom-8 right-8 w-14 h-14 bg-cyan-500 hover:bg-cyan-400 rounded-full shadow-soft flex items-center justify-center text-dark-bg text-xl hover:scale-105 transition-transform z-50 group border border-cyan-400/50"
      >
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-400 rounded-full border-2 border-white animate-pulse"></span>
        <FaQuestion className="group-hover:rotate-12 transition-transform font-black" />
      </button>

      <DailyQuizModal
        isOpen={showQuizModal}
        onClose={() => setShowQuizModal(false)}
      />
    </div>
  );
};

export default Feed;