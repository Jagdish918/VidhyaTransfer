import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { FaHeart, FaComment, FaTrash, FaShare, FaBookmark, FaUserPlus, FaReply } from "react-icons/fa";
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
  // 'Connect' | 'Pending' | 'Connected'
  const [connectStatus, setConnectStatus] = useState("Connect");

  // Per-comment reply state: { [commentId]: { show: bool, input: string, loading: bool } }
  const [replyState, setReplyState] = useState({});

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
          const { data } = await axios.get(`/user/registered/getDetails/${post.author._id}`);
          if (data.success) {
            const status = data.data.status; // 'Connect' | 'Pending' | 'Connected'
            setConnectStatus(status || "Connect");
          }
        } catch (error) { /* ignore */ }
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
    if (!newComment.trim()) return;
    setLoading(true);
    try {
      const { data } = await axios.post(`/post/${post._id}/comment`, { content: newComment });
      if (data.success) {
        setComments(prev => [...prev, data.data]);
        setCommentsCount(c => c + 1);
        setNewComment("");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error adding comment");
    } finally {
      setLoading(false);
    }
  };

  // --- Comment Like ---
  const handleCommentLike = async (commentId) => {
    try {
      const { data } = await axios.post(`/post/${post._id}/comment/${commentId}/like`);
      if (data.success) {
        setComments(prev => prev.map(c =>
          c._id === commentId
            ? {
              ...c,
              likes: data.data.isLiked
                ? [...(c.likes || []), user._id]
                : (c.likes || []).filter(id => id !== user._id && id?._id !== user._id),
              _likesCount: data.data.likesCount,
            }
            : c
        ));
      }
    } catch (error) {
      toast.error("Error liking comment");
    }
  };

  // --- Reply Input toggle ---
  const toggleReplyInput = (commentId) => {
    setReplyState(prev => ({
      ...prev,
      [commentId]: {
        show: !prev[commentId]?.show,
        input: prev[commentId]?.input || "",
        loading: false,
        showReplies: prev[commentId]?.showReplies ?? true,
      }
    }));
  };

  // --- Submit Reply ---
  const handleReply = async (e, commentId) => {
    e.preventDefault();
    const input = replyState[commentId]?.input?.trim();
    if (!input) return;
    setReplyState(prev => ({ ...prev, [commentId]: { ...prev[commentId], loading: true } }));
    try {
      const { data } = await axios.post(`/post/${post._id}/comment/${commentId}/reply`, { content: input });
      if (data.success) {
        setComments(prev => prev.map(c =>
          c._id === commentId
            ? { ...c, replies: [...(c.replies || []), data.data] }
            : c
        ));
        setReplyState(prev => ({ ...prev, [commentId]: { ...prev[commentId], input: "", loading: false, show: false, showReplies: true } }));
      }
    } catch (error) {
      toast.error("Error adding reply");
      setReplyState(prev => ({ ...prev, [commentId]: { ...prev[commentId], loading: false } }));
    }
  };

  // --- Reply Like ---
  const handleReplyLike = async (commentId, replyId) => {
    try {
      const { data } = await axios.post(`/post/${post._id}/comment/${commentId}/reply/${replyId}/like`);
      if (data.success) {
        setComments(prev => prev.map(c =>
          c._id === commentId
            ? {
              ...c,
              replies: (c.replies || []).map(r =>
                r._id === replyId
                  ? {
                    ...r,
                    likes: data.data.isLiked
                      ? [...(r.likes || []), user._id]
                      : (r.likes || []).filter(id => id !== user._id && id?._id !== user._id),
                    _likesCount: data.data.likesCount,
                  }
                  : r
              )
            }
            : c
        ));
      }
    } catch (error) {
      toast.error("Error liking reply");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      const { data } = await axios.delete(`/post/${post._id}`);
      if (data.success) { toast.success("Post deleted"); window.location.reload(); }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error deleting post");
    }
  };

  const handleConnect = async () => {
    setConnectStatus("Pending"); // optimistic update
    try {
      await axios.post("http://localhost:8000/request/create", { receiverID: post.author._id }, { withCredentials: true });
      toast.success(`Connection request sent to ${post.author?.name}`);
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.message.includes("Request already exists")) {
        toast.info("Connection request already sent.");
        setConnectStatus("Pending"); // keep as pending
      } else {
        toast.error("Failed to connect.");
        setConnectStatus("Connect"); // revert
      }
    }
  };

  const handleCancelRequest = async () => {
    setConnectStatus("Connect"); // optimistic revert
    try {
      await axios.post("http://localhost:8000/request/cancel", { receiverID: post.author._id }, { withCredentials: true });
      toast.success("Request cancelled");
    } catch (error) {
      toast.error("Failed to cancel request");
      setConnectStatus("Pending"); // revert on error
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

  const isCommentLiked = (comment) => {
    if (!user || !comment.likes) return false;
    return comment.likes.some(id => (id?._id || id) === user._id);
  };

  const isReplyLiked = (reply) => {
    if (!user || !reply.likes) return false;
    return reply.likes.some(id => (id?._id || id) === user._id);
  };

  const isAuthor = user && (post.author?._id === user._id || post.author === user._id);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* Avatar */}
        <Link to={`/profile/${post.author?._id || post.author?.username}`} className="flex-shrink-0">
          <img
            src={post.author?.picture || "/default-avatar.png"}
            alt={post.author?.name || "User"}
            className="w-12 h-12 rounded-full object-cover border border-gray-100"
          />
        </Link>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <Link to={`/profile/${post.author?._id || post.author?.username}`} className="font-bold text-gray-900 hover:text-[#3f51b5] transition-colors truncate no-underline">
              {post.author?.name || "Unknown User"}
            </Link>
            <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{formatTime(post.createdAt)}</span>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed mb-4">{post.content}</p>

          {/* Media */}
          {post.attachments && post.attachments.length > 0 && (
            <div className="mb-4 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
              {post.attachments.map((att, idx) => {
                const isImage = att.startsWith('data:image') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(att) || att.includes('/image/upload/');
                const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(att) || att.includes('/video/upload/');
                if (isImage) return <img key={idx} src={att} alt="Post" className="w-full h-auto max-h-[500px] object-cover" />;
                if (isVideo) return <video key={idx} src={att} controls className="w-full max-h-[500px]" />;
                return null;
              })}
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {post.skills && post.skills.map((skill, index) => (
              <span key={index} className="px-3 py-1 rounded-full text-[11px] font-medium bg-[#f0f3ff] text-[#3f51b5]">{skill.name}</span>
            ))}
            {post.domain && post.domain !== "All" && (
              <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-[#fff4e5] text-[#b45309]">{post.domain}</span>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-6">
            <button onClick={handleLike} className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${isLiked ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}>
              <FaHeart className={isLiked ? "fill-current" : ""} />
              <span>{likesCount}</span>
            </button>
            <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-[#3f51b5] transition-colors">
              <FaComment />
              <span>{commentsCount}</span>
            </button>
            {!isAuthor && (
              <button
                onClick={
                  connectStatus === "Connect" ? handleConnect
                    : connectStatus === "Pending" ? handleCancelRequest
                      : undefined
                }
                disabled={connectStatus === "Connected"}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${connectStatus === "Connect"
                    ? "bg-[#3f51b5] text-white hover:bg-[#303f9f] shadow-sm border-transparent"
                    : connectStatus === "Pending"
                      ? "bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                      : "bg-gray-100 text-gray-400 border-transparent cursor-not-allowed"
                  }`}
                title={connectStatus === "Pending" ? "Click to cancel request" : ""}
              >
                {connectStatus === "Connect" && "Connect"}
                {connectStatus === "Pending" && "Pending · Cancel?"}
                {connectStatus === "Connected" && "Connected ✓"}
              </button>
            )}
            {isAuthor && (
              <button onClick={handleDelete} className="text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                <FaTrash size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Comments Section ── */}
      {showComments && (
        <div className="mt-5 pt-5 border-t border-gray-100">
          <div className="space-y-4 mb-4">
            {comments.map((comment) => {
              const commentLiked = isCommentLiked(comment);
              const commentLikesCount = comment._likesCount ?? (comment.likes?.length || 0);
              const rs = replyState[comment._id] || {};

              return (
                <div key={comment._id} className="flex gap-3">
                  <img
                    src={comment.user?.picture || "/default-avatar.png"}
                    alt={comment.user?.name}
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-1"
                  />
                  <div className="flex-1">
                    {/* Comment bubble */}
                    <div className="bg-gray-50 rounded-2xl px-4 py-2.5">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-gray-900">{comment.user?.name}</span>
                        <span className="text-[10px] text-gray-400">{formatTime(comment.createdAt)}</span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{comment.content}</p>
                    </div>

                    {/* Comment actions */}
                    <div className="flex items-center gap-3 mt-1 pl-2">
                      <button
                        onClick={() => handleCommentLike(comment._id)}
                        className={`flex items-center gap-1 text-[10px] font-semibold transition-colors ${commentLiked ? "text-red-500" : "text-gray-400 hover:text-red-400"}`}
                      >
                        <FaHeart size={9} /> {commentLikesCount > 0 && commentLikesCount}
                      </button>
                      <button
                        onClick={() => toggleReplyInput(comment._id)}
                        className="flex items-center gap-1 text-[10px] font-semibold text-gray-400 hover:text-[#3f51b5] transition-colors"
                      >
                        <FaReply size={9} /> Reply
                      </button>
                      {comment.replies?.length > 0 && (
                        <button
                          onClick={() => setReplyState(prev => ({ ...prev, [comment._id]: { ...prev[comment._id], showReplies: !(prev[comment._id]?.showReplies ?? true) } }))}
                          className="text-[10px] font-semibold text-[#3f51b5] hover:underline"
                        >
                          {(rs.showReplies ?? true) ? `▲ Hide` : `▼ ${comment.replies.length} repl${comment.replies.length === 1 ? 'y' : 'ies'}`}
                        </button>
                      )}
                    </div>

                    {/* Reply input */}
                    {rs.show && (
                      <form onSubmit={(e) => handleReply(e, comment._id)} className="flex gap-2 mt-2 pl-2">
                        <input
                          type="text"
                          placeholder={`Reply to ${comment.user?.name}...`}
                          value={rs.input || ""}
                          onChange={(e) => setReplyState(prev => ({ ...prev, [comment._id]: { ...prev[comment._id], input: e.target.value } }))}
                          className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 text-[11px] focus:ring-1 focus:ring-[#3f51b5] outline-none"
                        />
                        <button
                          type="submit"
                          disabled={rs.loading || !rs.input?.trim()}
                          className="bg-[#3f51b5] text-white px-3 py-1.5 rounded-full text-[11px] font-bold disabled:opacity-50"
                        >
                          {rs.loading ? "..." : "Reply"}
                        </button>
                      </form>
                    )}

                    {/* Replies ladder */}
                    {(rs.showReplies ?? true) && comment.replies?.length > 0 && (
                      <div className="mt-2 pl-3 border-l-2 border-gray-100 space-y-2">
                        {comment.replies.map((reply) => {
                          const replyLiked = isReplyLiked(reply);
                          const replyLikesCount = reply._likesCount ?? (reply.likes?.length || 0);
                          return (
                            <div key={reply._id} className="flex gap-2">
                              <img
                                src={reply.user?.picture || "/default-avatar.png"}
                                alt={reply.user?.name}
                                className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-0.5"
                              />
                              <div className="flex-1">
                                <div className="bg-gray-50 rounded-xl px-3 py-2">
                                  <div className="flex justify-between items-center mb-0.5">
                                    <span className="text-[11px] font-bold text-gray-900">{reply.user?.name}</span>
                                    <span className="text-[9px] text-gray-400">{formatTime(reply.createdAt)}</span>
                                  </div>
                                  <p className="text-[11px] text-gray-600">{reply.content}</p>
                                </div>
                                <button
                                  onClick={() => handleReplyLike(comment._id, reply._id)}
                                  className={`flex items-center gap-1 text-[10px] font-semibold mt-0.5 pl-2 transition-colors ${replyLiked ? "text-red-500" : "text-gray-400 hover:text-red-400"}`}
                                >
                                  <FaHeart size={8} /> {replyLikesCount > 0 && replyLikesCount}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* New Comment Input */}
          <form onSubmit={handleComment} className="flex gap-2">
            <input
              type="text"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 bg-gray-50 border-none rounded-full px-4 py-2 text-xs focus:ring-1 focus:ring-[#3f51b5] outline-none"
            />
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              className="bg-[#3f51b5] text-white px-4 py-2 rounded-full text-xs font-bold disabled:opacity-50"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PostCard;

