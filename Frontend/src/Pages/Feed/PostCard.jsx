import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { FaHeart, FaComment, FaTrash } from "react-icons/fa";
import { useUser } from "../../util/UserContext";
import "./Feed.css";

const PostCard = ({ post }) => {
  const { user } = useUser();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [commentsCount, setCommentsCount] = useState(post.comments?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState(post.comments || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && post.likes) {
      setIsLiked(post.likes.some((like) => like._id === user._id || like === user._id));
    }
    setLikesCount(post.likes?.length || 0);
    setCommentsCount(post.comments?.length || 0);
    setComments(post.comments || []);
  }, [post, user]);

  const handleLike = async () => {
    try {
      const { data } = await axios.post(`/post/${post._id}/like`);
      if (data.success) {
        setIsLiked(data.data.isLiked);
        setLikesCount(data.data.likesCount);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error liking post");
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`/post/${post._id}/comment`, {
        content: newComment,
      });
      if (data.success) {
        setComments([...comments, data.data]);
        setCommentsCount(commentsCount + 1);
        setNewComment("");
        toast.success("Comment added");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error adding comment");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      const { data } = await axios.delete(`/post/${post._id}`);
      if (data.success) {
        toast.success("Post deleted");
        window.location.reload();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error deleting post");
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInSeconds = Math.floor((now - postDate) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const isAuthor = user && (post.author?._id === user._id || post.author === user._id);

  return (
    <div className="post-card">
      <div className="post-header">
        <div className="post-author">
          <img
            src={post.author?.picture || "/default-avatar.png"}
            alt={post.author?.name || "User"}
            className="author-avatar"
          />
          <div className="author-info">
            <h4 className="author-name">{post.author?.name || "Unknown User"}</h4>
            <span className="post-time">{formatTime(post.createdAt)}</span>
          </div>
        </div>
        {isAuthor && (
          <button className="btn-delete-post" onClick={handleDelete} title="Delete post">
            <FaTrash />
          </button>
        )}
      </div>

      <div className="post-content">
        <p>{post.content}</p>
      </div>

      {post.skills && post.skills.length > 0 && (
        <div className="post-skills">
          {post.skills.map((skill, index) => (
            <span key={index} className="skill-tag">
              {skill.name}
            </span>
          ))}
        </div>
      )}

      <div className="post-actions">
        <button
          className={`action-btn ${isLiked ? "liked" : ""}`}
          onClick={handleLike}
        >
          <FaHeart className={isLiked ? "filled" : ""} />
          <span>{likesCount}</span>
        </button>
        <button
          className="action-btn"
          onClick={() => setShowComments(!showComments)}
        >
          <FaComment />
          <span>{commentsCount}</span>
        </button>
      </div>

      {showComments && (
        <div className="comments-section">
          <div className="comments-list">
            {comments.length === 0 ? (
              <p className="no-comments">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((comment, index) => (
                <div key={index} className="comment-item">
                  <img
                    src={comment.user?.picture || "/default-avatar.png"}
                    alt={comment.user?.name || "User"}
                    className="comment-avatar"
                  />
                  <div className="comment-content">
                    <span className="comment-author">{comment.user?.name || "Unknown"}</span>
                    <p>{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleComment} className="comment-form">
            <input
              type="text"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="comment-input"
              maxLength={500}
            />
            <button type="submit" className="btn-comment" disabled={loading || !newComment.trim()}>
              {loading ? "Posting..." : "Post"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PostCard;

