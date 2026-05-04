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
import { FaSearch, FaPlus, FaImage, FaVideo, FaCalendarAlt, FaQuestion, FaTimes, FaHashtag } from "react-icons/fa";

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

  // Trending tags & search
  const [trendingTags, setTrendingTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState(""); // The currently active search/filter
  const [searchLoading, setSearchLoading] = useState(false);

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
        // Only add to feed if not in search mode
        if (!activeSearch) {
          setPosts((prev) => [newPost, ...prev]);
          setNewPostsCount((prev) => prev + 1);
          toast.info("📬 New post available!", { autoClose: 2000 });
        }
      });

      socketRef.current.on("post updated", ({ postId, likesCount, commentsCount, comment, userId, type }) => {
        setPosts((prev) =>
          prev.map((post) => {
            if (post._id !== postId) return post;

            const updatedPost = {
              ...post,
              likesCount,
              commentsCount
            };

            if (type === "like" && userId) {
              const currentLikes = post.likes || [];
              const isAlreadyLiked = currentLikes.some(l => (l._id || l) === userId);

              if (isAlreadyLiked) {
                updatedPost.likes = currentLikes.filter(l => (l._id || l) !== userId);
              } else {
                updatedPost.likes = [...currentLikes, userId];
              }
            }

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
  }, [activeSearch]);

  // Fetch trending tags
  const fetchTrendingTags = useCallback(async () => {
    try {
      const { data } = await axios.get("/post/trending-tags");
      if (data.success) {
        setTrendingTags(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching trending tags:", error);
    }
  }, []);

  useEffect(() => {
    fetchTrendingTags();
  }, [fetchTrendingTags]);

  const fetchPosts = useCallback(
    async (pageNum) => {
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
          // skip
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

  // Search posts
  const searchPosts = useCallback(async (query, pageNum = 1) => {
    if (!query.trim()) return;
    setSearchLoading(true);
    setLoading(true);
    try {
      const { data } = await axios.get("/post/search", {
        params: { q: query, page: pageNum, limit: 10 },
      });
      if (data.success) {
        setPosts((prev) =>
          pageNum === 1 ? data.data.posts : [...prev, ...data.data.posts]
        );
        setHasMore(data.data.hasMore);
      }
    } catch (error) {
      console.error("Error searching posts:", error);
      toast.error(error.response?.data?.message || "Search failed");
    } finally {
      setLoading(false);
      setSearchLoading(false);
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!activeSearch) {
      setPage(1);
      setPosts([]);
      fetchPosts(1);
    }
  }, [fetchPosts, activeSearch]);

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
      if (activeSearch) {
        searchPosts(activeSearch, page);
      } else {
        fetchPosts(page);
      }
    }
  }, [page, fetchPosts, searchPosts, activeSearch]);

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
        // Clear any search and refresh feed
        handleClearSearch();
        fetchPosts(1);
        fetchTrendingTags(); // Refresh trending tags after new post
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error creating post");
    }
  };

  const handleUpdateConnection = useCallback((userId, newStatus) => {
    setPosts(prev => prev.map(p => {
      if ((p.author && p.author._id === userId) || p.author === userId) {
        return { ...p, author: { ...p.author, status: newStatus } };
      }
      return p;
    }));
  }, []);

  // Search handlers
  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setActiveSearch(searchQuery.trim());
    setPage(1);
    setPosts([]);
    setInitialLoading(true);
    searchPosts(searchQuery.trim(), 1);
  };

  const handleTagClick = (tag) => {
    const query = `#${tag}`;
    setSearchQuery(query);
    setActiveSearch(query);
    setPage(1);
    setPosts([]);
    setInitialLoading(true);
    searchPosts(query, 1);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setActiveSearch("");
    setPage(1);
    setPosts([]);
    setInitialLoading(true);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr,300px] gap-8 items-start">
          <div className="hidden lg:flex flex-col gap-6 sticky top-24">
            {/* User Profile Card */}
            <div className="bg-white rounded-3xl p-6 shadow-soft border border-slate-100 group transition-all duration-500 hover:shadow-card">
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 to-blue-500 rounded-full animate-pulse opacity-20 blur-xl group-hover:opacity-40 transition-opacity"></div>
                  <img
                    src={user?.picture || "https://ui-avatars.com/api/?name=" + (user?.name || "Me") + "&background=random&size=200"}
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
                  View Profile
                </button>
              </div>
            </div>

          </div>

          {/* Column 2: Main Feed Content (Scrollable) */}
          <div className="pb-24">

            {/* Active Search Banner */}
            {activeSearch && (
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-2xl px-5 py-3.5 mb-6 flex items-center justify-between shadow-sm animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-cyan-500 rounded-xl flex items-center justify-center shadow-md">
                    {activeSearch.startsWith('#') ? <FaHashtag size={12} className="text-white" /> : <FaSearch size={12} className="text-white" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Showing results for</p>
                    <p className="text-sm font-bold text-slate-900">{activeSearch}</p>
                  </div>
                </div>
                <button
                  onClick={handleClearSearch}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 text-xs font-bold rounded-xl border border-slate-200 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm"
                >
                  <FaTimes size={10} /> Clear
                </button>
              </div>
            )}

            {/* Create Post Box */}
            <div className="bg-white rounded-3xl border border-slate-100 p-4 mb-8 shadow-soft group transition-all hover:shadow-card">
              <div className="flex gap-4 mb-4">
                <img
                  src={user?.picture || "https://ui-avatars.com/api/?name=" + (user?.name || "Me") + "&background=random&size=100"}
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

            {newPostsCount > 0 && !activeSearch && (
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
                      <span className="text-2xl opacity-80">{activeSearch ? '🔍' : '📭'}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      {activeSearch ? 'No posts found' : 'No posts yet'}
                    </h3>
                    <p className="text-sm text-slate-600 max-w-xs mx-auto mb-6">
                      {activeSearch
                        ? `No posts matching "${activeSearch}" were found.`
                        : 'Be the first to share your thoughts!'}
                    </p>
                    {activeSearch ? (
                      <button
                        onClick={handleClearSearch}
                        className="px-6 py-2.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-all"
                      >
                        Back to Feed
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsPostModalOpen(true)}
                        className="px-6 py-2.5 bg-cyan-500 text-dark-bg text-sm font-semibold rounded-lg hover:bg-cyan-400 transition-all shadow-md"
                      >
                        Create Post
                      </button>
                    )}
                  </div>
                ) : (
                  posts.map((post, index) => (
                    <div
                      key={post._id}
                      ref={index === posts.length - 1 ? lastPostElementRef : null}
                    >
                      <PostCard
                        post={post}
                        onDelete={(postId) => setPosts(prev => prev.filter(p => p._id !== postId))}
                        onUpdateConnection={handleUpdateConnection}
                      />
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

            {/* Trending Tags & Search */}
            <div className="bg-white rounded-3xl p-6 shadow-soft border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Trending Tags</h3>
              </div>

              {/* Search Widget */}
              <form onSubmit={handleSearchSubmit} className="relative mb-5">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search #hashtag or @username"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-4 pr-20 py-2.5 text-[13px] font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(""); if (activeSearch) handleClearSearch(); }}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all"
                    >
                      <FaTimes size={10} />
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={!searchQuery.trim() || searchLoading}
                    className="p-1.5 text-slate-400 hover:text-cyan-600 rounded-lg hover:bg-cyan-50 transition-all disabled:opacity-30"
                  >
                    <FaSearch size={13} />
                  </button>
                </div>
              </form>

              {/* Tags List */}
              <div className="flex flex-col gap-2.5">
                {trendingTags.length > 0 ? (
                  trendingTags.map((topic, i) => (
                    <button
                      key={i}
                      onClick={() => handleTagClick(topic.tag)}
                      className={`flex items-center justify-between group cursor-pointer w-full text-left px-3 py-2 rounded-xl transition-all ${activeSearch === `#${topic.tag}`
                          ? 'bg-cyan-50 border border-cyan-200'
                          : 'hover:bg-slate-50 border border-transparent'
                        }`}
                    >
                      <span className={`text-sm font-bold transition-colors ${activeSearch === `#${topic.tag}` ? 'text-cyan-600' : 'text-slate-700 group-hover:text-cyan-500'
                        }`}>#{topic.tag}</span>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border transition-all ${activeSearch === `#${topic.tag}`
                          ? 'text-cyan-600 bg-cyan-100 border-cyan-200'
                          : 'text-slate-400 bg-slate-50 border-slate-100 group-hover:border-cyan-100 group-hover:text-cyan-600'
                        }`}>{topic.count} {topic.count === 1 ? 'post' : 'posts'}</span>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <FaHashtag className="mx-auto text-slate-200 mb-2" size={24} />
                    <p className="text-xs text-slate-400 font-semibold">No trending tags yet</p>
                    <p className="text-[10px] text-slate-300 mt-1">Start posting with #hashtags!</p>
                  </div>
                )}
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