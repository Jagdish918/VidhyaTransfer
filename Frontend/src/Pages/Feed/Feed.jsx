import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { io } from "socket.io-client";
import { useUser } from "../../util/UserContext";
import PostCard from "./PostCard";
import CreatePostModal from "./CreatePostModal";
import "./Feed.css";

const Feed = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedDomain, setSelectedDomain] = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const observer = useRef();
  const socketRef = useRef(null);

  const domains = ["All", "Programming", "Design", "Business", "Marketing", "Writing"];

  useEffect(() => {
    // Initialize socket connection
    try {
      const baseURL = import.meta.env.VITE_LOCALHOST || "http://localhost:8000";
      socketRef.current = io(baseURL, {
        withCredentials: true,
      });

      socketRef.current.on("connect", () => {
        console.log("Connected to socket");
        socketRef.current.emit("join feed");
      });

      socketRef.current.on("new post", (newPost) => {
        setPosts((prev) => [newPost, ...prev]);
        toast.info("New post available!");
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
          toast.error("Please login to view feed");
          localStorage.removeItem("userInfo");
          navigate("/login");
        } else {
          toast.error(error.response?.data?.message || "Error loading feed");
        }
      } finally {
        setLoading(false);
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
        // Post will be added via socket
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error creating post");
    }
  };

  return (
    <div className="feed-page">
      <div className="feed-container">
        <div className="feed-sidebar">
          <h3 className="sidebar-title">Domain Filter</h3>
          <div className="domain-filters">
            {domains.map((domain) => (
              <button
                key={domain}
                className={`domain-filter-btn ${selectedDomain === domain ? "active" : ""}`}
                onClick={() => setSelectedDomain(domain)}
              >
                {domain}
              </button>
            ))}
          </div>
        </div>

        <div className="feed-main">
          <div className="feed-header">
            <h2 className="feed-title">Feed</h2>
            <button
              className="btn-create-post"
              onClick={() => setShowCreateModal(true)}
            >
              + Create Post
            </button>
          </div>

          <div className="posts-list">
            {posts.length === 0 && !loading && (
              <div className="empty-feed">
                <p>No posts yet. Be the first to create a post!</p>
              </div>
            )}
            {posts.map((post, index) => (
              <div
                key={post._id}
                ref={index === posts.length - 1 ? lastPostElementRef : null}
              >
                <PostCard post={post} />
              </div>
            ))}
          </div>

          {loading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading more posts...</p>
            </div>
          )}

          {!hasMore && posts.length > 0 && (
            <div className="end-of-feed">
              <p>You've reached the end of the feed</p>
            </div>
          )}
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


