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
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
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
        setIsPostModalOpen(false);
        if (!socketRef.current?.connected) {
          fetchPosts(1, selectedDomain);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error creating post");
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] bg-dark-bg font-sans overflow-hidden flex flex-col">
      <div className="flex-1 max-w-[1280px] mx-auto px-6 h-full flex flex-col pt-4 overflow-hidden">
        {/* Mobile Filter */}
        <div className="lg:hidden overflow-x-auto py-2 mb-2 scrollbar-hide shrink-0">
          <div className="flex space-x-2">
            {domains.map((domain) => (
              <button
                key={domain}
                onClick={() => setSelectedDomain(domain)}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-xs font-semibold transition-all ${selectedDomain === domain
                  ? "bg-cyan-500 text-dark-bg shadow-md shadow-cyan-500/20"
                  : "bg-dark-card text-slate-600 border border-dark-border hover:text-slate-900 hover:bg-dark-hover"
                  } `}
              >
                {domain}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px,1fr,300px] gap-6 items-start h-full pb-10">
          {/* Column 1: Navigation & Profile (Fixed) */}
          <div className="hidden lg:block h-full">
            <div className="flex flex-col gap-5 items-end pr-2">
              {/* User Mini Profile Card */}
              <div className="w-full max-w-[260px] bg-dark-card rounded-2xl p-4 shadow-card border border-dark-border group hover:border-cyan-500/30 transition-all duration-300">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-3">
                    <img 
                      src={user?.picture || "/default-avatar.png"} 
                      alt="Me" 
                      className="w-20 h-20 rounded-full object-cover ring-2 ring-cyan-500/30 group-hover:ring-cyan-400 p-1 transition-all duration-300"
                    />
                    <span className="absolute bottom-1 right-1 w-5 h-5 bg-cyan-500 border-2 border-dark-card rounded-full flex items-center justify-center text-[10px] text-dark-bg font-bold">✓</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-base mb-1">{user?.name}</h4>
                  <p className="text-sm text-slate-600 mb-3">@{user?.username}</p>
                  <button 
                    onClick={() => navigate('/profile')}
                    className="w-full py-2.5 bg-white hover:bg-cyan-500 text-slate-700 hover:text-dark-bg border border-dark-border hover:border-cyan-500 rounded-lg text-sm font-semibold transition-all"
                  >
                    View Profile
                  </button>
                </div>
              </div>

              {/* Domains Navigation */}
              
            </div>
          </div>

          {/* Column 2: Main Feed Content (Scrollable) */}
          <div className="h-full overflow-y-auto custom-scrollbar px-1 pb-24">
            {/* Create Post Box */}
            <div className="bg-dark-card rounded-2xl border border-dark-border p-3 mb-4 shadow-card hover:border-cyan-500/30 transition-colors">
              <div className="flex gap-3 mb-3">
                <img
                  src={user?.picture || "/default-avatar.png"}
                  alt="My avatar"
                  className="w-10 h-10 rounded-full object-cover border border-dark-border"
                />
                <button
                  onClick={() => setIsPostModalOpen(true)}
                  className="flex-1 bg-white hover:bg-dark-hover rounded-full px-5 py-2.5 text-left text-sm text-slate-600 font-medium transition-all border border-dark-border"
                >
                  Start a post...
                </button>
              </div>
              <div className="flex items-center justify-between border-t border-dark-border pt-3">
                <div className="flex gap-2 sm:gap-4">
                  <button 
                    onClick={() => setIsPostModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-cyan-500/10 hover:text-cyan-700 transition-all"
                  >
                    <FaImage size={16} className="text-cyan-500" /> <span className="hidden sm:inline">Photo</span>
                  </button>
                  <button 
                    onClick={() => setIsPostModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-green-500/10 hover:text-green-700 transition-all"
                  >
                    <FaVideo size={16} className="text-green-500" /> <span className="hidden sm:inline">Video</span>
                  </button>
                  <button 
                    onClick={() => setIsPostModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-orange-500/10 hover:text-orange-700 transition-all"
                  >
                    <FaCalendarAlt size={16} className="text-orange-500" /> <span className="hidden sm:inline">Event</span>
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
                      <div className="text-center py-20 bg-dark-card rounded-2xl border border-dashed border-dark-border shadow-soft">
                        <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-5 border border-dark-border">
                          <span className="text-2xl opacity-80">📭</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">No posts yet</h3>
                        <p className="text-sm text-slate-600 max-w-xs mx-auto mb-6">
                          Be the first to share in the <span className="text-cyan-700 font-semibold">{selectedDomain}</span> domain!
                        </p>
                        <button
                          onClick={() => setIsPostModalOpen(true)}
                          className="px-6 py-2.5 bg-cyan-500 text-dark-bg text-sm font-semibold rounded-lg hover:bg-cyan-400 transition-all shadow-md"
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

          {/* Column 3: Suggestions (Unscrollable) */}
          <div className="hidden lg:block h-full">
            <div className="max-w-[260px]">
              <div className="bg-dark-card rounded-2xl border border-dark-border p-5 shadow-card">
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-4">Discover Peers</h3>
                <div className="flex flex-col gap-4">
                  {suggestedPeers.map((peer) => (
                    <div key={peer._id} className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate(`/profile/${peer.username}`)}>
                      <div className="relative">
                        <img 
                          src={peer.picture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                          alt={peer.name} 
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-cyan-500 transition-all"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900 group-hover:text-cyan-700 transition-colors">{peer.name.split(' ')[0]}</span>
                        <span className="text-xs text-slate-600">@{peer.username}</span>
                      </div>
                      <div className="ml-auto w-8 h-8 rounded-full bg-white flex items-center justify-center border border-dark-border group-hover:border-cyan-500 group-hover:text-cyan-700 transition-all">
                        <FaUserPlus size={12} className="text-slate-600" />
                      </div>
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