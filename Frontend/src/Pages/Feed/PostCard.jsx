import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { FaHeart, FaComment, FaTrash, FaShare, FaBookmark, FaUserPlus, FaEllipsisH } from "react-icons/fa";
import { useUser } from "../../util/UserContext";

const PostCard = ({ post }) => {
  const { user } = useUser();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [commentsCount, setCommentsCount] = useState(post.comments?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState(post.comments || []);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false); // Mock connection status

  useEffect(() => {
    if (user && post.likes) {
      setIsLiked(post.likes.some((like) => like._id === user._id || like === user._id));
    }
    setLikesCount(post.likes?.length || 0);
    setCommentsCount(post.comments?.length || 0);
    setComments(post.comments || []);

    const checkConnectionStatus = async () => {
      if (user && post.author?._id && user._id !== post.author._id) {
        try {
          // We can use the profile details endpoint which returns 'status' relative to current user
          const { data } = await axios.get(`/user/registered/getDetails/${post.author._id}`);
          if (data.success && data.data.status !== "Connect") {
            setIsConnected(true);
          }
        } catch (error) {
          console.error("Error checking connection status", error);
        }
      }
    };
    checkConnectionStatus();
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

  const handleConnect = async () => {
    try {
      await axios.post("http://localhost:8000/request/create", { receiverID: post.author._id }, { withCredentials: true });
      toast.success(`Connection request sent to ${post.author?.name}`);
      // We can't easily change isConnected state to true because it's not "connected" yet, it's "pending".
      // But for UI feedback we can disable button or show "Pending".
      // For simplicity, we just toast success. 
    } catch (error) {
      console.error(error);
      if (error.response?.status === 400 && error.response.data.message.includes("Request already exists")) {
        toast.info("Connection request already sent.");
      } else {
        toast.error("Failed to connect.");
      }
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

  // Tag badges color mapping based on type
  const getBadgeColor = (type) => {
    switch (type) {
      case 'Learning Progress': return 'bg-green-100 text-green-700';
      case 'Question': return 'bg-orange-100 text-orange-700';
      case 'Opportunity': return 'bg-purple-100 text-purple-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${post.author?._id || post.author?.username}`} className="flex-shrink-0">
            <img
              src={post.author?.picture || "/default-avatar.png"}
              alt={post.author?.name || "User"}
              className="w-12 h-12 rounded-full object-cover border border-gray-100 hover:opacity-90 transition-opacity"
            />
          </Link>
          <div>
            <h4 className="font-bold text-gray-900 text-base leading-tight flex items-center gap-2">
              <Link to={`/profile/${post.author?._id || post.author?.username}`} className="hover:text-blue-600 transition-colors">
                {post.author?.name || "Unknown User"}
              </Link>
              {!isAuthor && !isConnected && (
                <button
                  onClick={handleConnect}
                  className="text-blue-600 hover:bg-blue-50 p-1 rounded-full transition-colors text-xs font-semibold flex items-center gap-1"
                >
                  <FaUserPlus /> Connect
                </button>
              )}
            </h4>
            <div className="flex items-center text-xs text-gray-500 mt-0.5 gap-2">
              <span>{post.author?.role || "Member"}</span>
              <span>•</span>
              <span>{formatTime(post.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {post.type && (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getBadgeColor(post.type)}`}>
              {post.type}
            </span>
          )}
          {isAuthor && (
            <button
              className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
              onClick={handleDelete}
              title="Delete post"
            >
              <FaTrash size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-gray-800 leading-relaxed text-[15px] whitespace-pre-wrap">{post.content}</p>

        {/* Render attachments */}
        {post.attachments && post.attachments.length > 0 && (
          <div className={`grid gap-2 mt-3 ${post.attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {post.attachments.map((att, idx) => {
              // Simple check for image data URI or URL
              const isImage = att.startsWith('data:image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(att);

              if (isImage) {
                return (
                  <div key={idx} className="bg-gray-100 rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                    <img src={att} alt={`Attachment ${idx + 1}`} className="w-full h-auto max-h-96 object-cover" />
                  </div>
                );
              } else {
                return (
                  <a key={idx} href={att} download={`attachment-${idx}`} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                      <FaShare />
                    </div>
                    <span className="text-sm font-medium text-gray-700 truncate">Document Attachment {idx + 1}</span>
                  </a>
                );
              }
            })}
          </div>
        )}
      </div>

      {/* Tags */}
      {post.skills && post.skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.skills.map((skill, index) => (
            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer">
              #{skill.name}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-gray-500">
        <div className="flex items-center gap-6">
          <button
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${isLiked ? "text-red-500" : "hover:text-red-500"}`}
            onClick={handleLike}
          >
            <FaHeart className={isLiked ? "fill-current" : ""} />
            <span>{likesCount} Likes</span>
          </button>
          <button
            className="flex items-center gap-2 text-sm font-medium hover:text-blue-500 transition-colors"
            onClick={() => setShowComments(!showComments)}
          >
            <FaComment />
            <span>{commentsCount} Comments</span>
          </button>
          <button
            className="flex items-center gap-2 text-sm font-medium hover:text-green-500 transition-colors"
          >
            <FaShare />
            <span>Share</span>
          </button>
        </div>
        <button
          className="hover:text-yellow-500 transition-colors"
        >
          <FaBookmark />
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-100 animate-fadeIn">
          <div className="space-y-4 mb-4 max-h-60 overflow-y-auto custom-scrollbar">
            {comments.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-2">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((comment, index) => (
                <div key={index} className="flex gap-3">
                  <img
                    src={comment.user?.picture || "/default-avatar.png"}
                    alt={comment.user?.name || "User"}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="bg-gray-50 rounded-lg p-3 flex-1">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-sm font-semibold text-gray-900">{comment.user?.name || "Unknown"}</span>
                      <span className="text-xs text-gray-400">{formatTime(comment.createdAt || new Date())}</span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleComment} className="flex items-center gap-2 relative">
            <img
              src={user?.picture || "/default-avatar.png"}
              className="w-8 h-8 rounded-full object-cover"
              alt="Me"
            />
            <input
              type="text"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              maxLength={500}
            />
            <button
              type="submit"
              className="absolute right-2 p-1.5 text-blue-600 hover:text-blue-700 font-medium rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !newComment.trim()}
            >
              <svg className="w-5 h-5 rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PostCard;

