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

  const [expanded, setExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(false); // Mock save state

  const toggleSave = () => {
    setIsSaved(!isSaved);
    toast.success(isSaved ? "Post removed from saved" : "Post saved successfully");
  };

  const sharePost = async () => {
    const shareData = {
      title: `Post by ${post.author?.name}`,
      text: post.content,
      url: window.location.href, // Or specific post URL if available
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share canceled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-0 mb-8 hover:shadow-xl transition-all duration-300 group overflow-hidden ring-1 ring-transparent hover:ring-[#3bb4a1]/20">

      {/* Header */}
      <div className="p-6 pb-4 flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Link to={`/profile/${post.author?._id || post.author?.username}`} className="flex-shrink-0 relative">
            <img
              src={post.author?.picture || "/default-avatar.png"}
              alt={post.author?.name || "User"}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md group-hover:scale-105 transition-transform duration-200"
            />
          </Link>
          <div>
            <h4 className="font-bold text-gray-900 text-lg leading-tight flex items-center gap-2 font-['Oswald'] tracking-wide">
              <Link to={`/profile/${post.author?._id || post.author?.username}`} className="hover:text-[#3bb4a1] transition-colors">
                {post.author?.name || "Unknown User"}
              </Link>
              {!isAuthor && !isConnected && (
                <button
                  onClick={handleConnect}
                  className="bg-[#3bb4a1]/10 text-[#3bb4a1] hover:bg-[#3bb4a1] hover:text-white px-2.5 py-1 rounded-lg transition-all text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                >
                  <FaUserPlus /> Connect
                </button>
              )}
            </h4>
            <div className="flex items-center text-xs text-gray-400 mt-1.5 gap-2 font-medium font-['Montserrat']">
              <span className="text-[#3bb4a1] font-semibold">{post.author?.role || "Member"}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
              <span>{formatTime(post.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {post.type && (
            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-widest uppercase ${getBadgeColor(post.type)} border border-current/20`}>
              {post.type}
            </span>
          )}
          {isAuthor && (
            <button
              className="text-gray-300 hover:text-red-500 transition-colors bg-transparent hover:bg-red-50 p-2 rounded-xl"
              onClick={handleDelete}
              title="Delete post"
            >
              <FaTrash size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 mb-4">
        <div className="relative">
          <p className={`text-gray-700 leading-relaxed text-[15px] whitespace-pre-wrap font-['Montserrat'] ${!expanded && post.content.length > 300 ? 'line-clamp-3' : ''}`}>
            {post.content}
          </p>
          {post.content.length > 300 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 text-[#3bb4a1] font-bold text-sm hover:underline focus:outline-none"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>

        {/* Improved Media Grid */}
        {post.attachments && post.attachments.length > 0 && (
          <div className="mt-5 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
            {post.attachments.map((att, idx) => {
              const isImage = att.startsWith('data:image') || /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|ico)$/i.test(att) || att.includes('/image/upload/');
              const isVideo = /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(att) || att.includes('/video/upload/');

              // Only handling single items purely for this snippet, real grid logic needs mapped return
              // Simulating a simple stack for now, ideally this should be a proper grid helper
              if (isImage) {
                return (
                  <div key={idx} className="relative group/media cursor-pointer bg-gray-50" onClick={() => window.open(att, '_blank')}>
                    <img src={att} alt={`Post media ${idx + 1}`} className="w-full h-auto max-h-[600px] object-cover hover:opacity-95 transition-opacity" />
                  </div>
                );
              } else if (isVideo) {
                return (
                  <div key={idx} className="bg-black relative aspect-video">
                    <video src={att} controls className="w-full h-full" />
                  </div>
                );
              } else {
                return (
                  <a key={idx} href={att} download target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-gray-50 border-t border-gray-100 first:border-t-0 hover:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                      <FaShare />
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-gray-800">Attachment {idx + 1}</span>
                      <span className="text-xs text-gray-500">Click to download</span>
                    </div>
                  </a>
                );
              }
            })}
          </div>
        )}
      </div>

      {/* Tags */}
      {post.skills && post.skills.length > 0 && (
        <div className="px-6 flex flex-wrap gap-2 mb-6">
          {post.skills.map((skill, index) => (
            <span key={index} className="inline-flex items-center px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#3bb4a1]/5 text-[#3bb4a1] border border-[#3bb4a1]/20 hover:bg-[#3bb4a1] hover:text-white transition-all cursor-pointer uppercase tracking-wide">
              #{skill.name}
            </span>
          ))}
        </div>
      )}

      {/* Actions Bar */}
      <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 grid grid-cols-4 gap-2">
        {/* Like Button */}
        <button
          className={`flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all group/like ${isLiked
            ? "text-red-500 bg-red-50 shadow-sm ring-1 ring-red-100"
            : "text-gray-500 hover:bg-white hover:text-red-500 hover:shadow-md"}`}
          onClick={handleLike}
        >
          <FaHeart className={`text-lg transition-transform duration-300 ${isLiked ? "scale-110 fill-current" : "group-hover/like:scale-125"}`} />
          <span>{likesCount}</span>
        </button>

        {/* Comment Button */}
        <button
          className={`flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${showComments
            ? "text-[#3bb4a1] bg-[#3bb4a1]/10 shadow-sm ring-1 ring-[#3bb4a1]/20"
            : "text-gray-500 hover:bg-white hover:text-[#3bb4a1] hover:shadow-md"}`}
          onClick={() => setShowComments(!showComments)}
        >
          <FaComment className="text-lg" />
          <span>{commentsCount}</span>
        </button>

        {/* Share Button */}
        <button
          onClick={sharePost}
          className="flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-white hover:text-blue-500 hover:shadow-md transition-all"
        >
          <FaShare className="text-lg" />
          <span className="hidden sm:inline">Share</span>
        </button>

        {/* Save Button */}
        <button
          onClick={toggleSave}
          className={`flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${isSaved
            ? "text-yellow-600 bg-yellow-50 shadow-sm ring-1 ring-yellow-100"
            : "text-gray-500 hover:bg-white hover:text-yellow-500 hover:shadow-md"}`}
        >
          <FaBookmark className={`text-lg transition-transform ${isSaved ? "scale-110 fill-current" : ""}`} />
          <span className="hidden sm:inline">{isSaved ? "Saved" : "Save"}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-6 py-6 border-t border-gray-100 bg-gray-50/30 animate-fadeIn">
          <div className="space-y-5 mb-6 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
            {comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                <FaComment className="text-3xl mb-3 opacity-20" />
                <p className="text-sm font-medium">Be the first to share your thoughts!</p>
              </div>
            ) : (
              comments.map((comment, index) => (
                <div key={index} className="flex gap-4 group/comment">
                  <img
                    src={comment.user?.picture || "/default-avatar.png"}
                    alt={comment.user?.name || "User"}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-white shadow-sm mt-1"
                  />
                  <div className="flex-1">
                    <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm border border-gray-100 relative group-hover/comment:shadow-md transition-all">
                      <div className="flex justify-between items-center mb-2">
                        <Link to={`/profile/${comment.user?._id}`} className="text-sm font-bold text-gray-900 hover:text-[#3bb4a1] transition-colors font-['Oswald'] tracking-wide">
                          {comment.user?.name || "Unknown"}
                        </Link>
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                          {formatTime(comment.createdAt || new Date())}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed font-['Montserrat']">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleComment} className="flex items-end gap-3 p-2 bg-white rounded-3xl border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-[#3bb4a1]/20 focus-within:border-[#3bb4a1] transition-all">
            <img
              src={user?.picture || "/default-avatar.png"}
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm ml-1 mb-1"
              alt="Me"
            />
            <div className="flex-1 mb-1">
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full bg-transparent border-none p-2 text-sm text-gray-800 placeholder-gray-400 focus:ring-0 outline-none font-['Montserrat']"
                maxLength={500}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              className="p-3 mb-1 mr-1 bg-[#013e38] text-white rounded-full hover:bg-[#3bb4a1] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center group/send"
            >
              <svg className="w-4 h-4 rotate-90 translate-x-px group-hover/send:translate-x-0.5 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PostCard;

