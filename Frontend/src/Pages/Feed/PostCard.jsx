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
    <div className="bg-white rounded-[2.5rem] border border-gray-50 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 hover:shadow-[0_20px_50px_rgba(59,180,161,0.12)] group">
      <div className="flex gap-5">
        {/* Avatar */}
        <Link to={`/profile/${post.author?._id || post.author?.username}`} className="flex-shrink-0">
          <img
            src={post.author?.picture || "/default-avatar.png"}
            alt={post.author?.name || "User"}
            className="w-14 h-14 rounded-[1.2rem] object-cover ring-4 ring-gray-50 group-hover:ring-[#3bb4a1]/10 transition-all shadow-sm"
          />
        </Link>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <Link to={`/profile/${post.author?._id || post.author?.username}`} className="text-lg font-black text-gray-900 hover:text-[#3bb4a1] transition-colors truncate no-underline tracking-tight">
              {post.author?.name || "Unknown User"}
            </Link>
            <span className="text-[10px] font-black uppercase text-gray-400 whitespace-nowrap ml-2 tracking-widest">{formatTime(post.createdAt)}</span>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed mb-4">{post.content}</p>

          {/* Media */}
          {post.attachments && post.attachments.length > 0 && (
            <div className="mb-6 rounded-[1.5rem] overflow-hidden border border-gray-50 bg-[#fafafa]">
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
          <div className="flex flex-wrap gap-2 mb-8">
            {post.skills && post.skills.map((skill, index) => (
              <span key={index} className="px-4 py-1.5 rounded-[1rem] text-[9px] font-black uppercase tracking-[0.1em] bg-[#3bb4a1]/10 text-[#013e38]">{skill.name}</span>
            ))}
            {post.domain && post.domain !== "All" && (
              <span className="px-4 py-1.5 rounded-[1rem] text-[9px] font-black uppercase tracking-[0.1em] bg-amber-50 text-amber-700">{post.domain}</span>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-5">
            <button onClick={handleLike} className={`flex items-center gap-1.5 text-xs font-black transition-colors ${isLiked ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}>
              <FaHeart className={isLiked ? "fill-current scale-110 transition-transform" : ""} size={14} />
              <span>{likesCount}</span>
            </button>
            <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 text-xs font-black text-gray-400 hover:text-[#3bb4a1] transition-colors">
              <FaComment size={14} />
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
                className={`px-5 py-2.5 rounded-[1rem] text-[9px] uppercase font-black tracking-widest transition-all ${connectStatus === "Connect"
                    ? "bg-[#013e38] text-white hover:bg-[#3bb4a1] shadow-lg shadow-[#013e38]/20"
                    : connectStatus === "Pending"
                      ? "bg-yellow-50 text-yellow-700 hover:bg-red-50 hover:text-red-600"
                      : "bg-[#fafafa] text-gray-400 cursor-not-allowed"
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
                <div key={comment._id} className="flex gap-4">
                  <img
                    src={comment.user?.picture || "/default-avatar.png"}
                    alt={comment.user?.name}
                    className="w-10 h-10 rounded-xl object-cover flex-shrink-0 mt-2 border border-gray-50"
                  />
                  <div className="flex-1">
                    {/* Comment bubble */}
                    <div className="bg-[#fafafa] rounded-[1.5rem] px-5 py-4 border border-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-black text-gray-900 tracking-tight">{comment.user?.name}</span>
                        <span className="text-[9px] uppercase font-black tracking-widest text-gray-400">{formatTime(comment.createdAt)}</span>
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
                          className="text-[10px] font-black text-[#3bb4a1] hover:underline uppercase tracking-wider"
                        >
                          {(rs.showReplies ?? true) ? `▲ Hide` : `▼ ${comment.replies.length} repl${comment.replies.length === 1 ? 'y' : 'ies'}`}
                        </button>
                      )}
                    </div>

                    {/* Reply input */}
                    {rs.show && (
                      <form onSubmit={(e) => handleReply(e, comment._id)} className="flex gap-3 mt-4 pl-3">
                        <input
                          type="text"
                          placeholder={`Reply to ${comment.user?.name}...`}
                          value={rs.input || ""}
                          onChange={(e) => setReplyState(prev => ({ ...prev, [comment._id]: { ...prev[comment._id], input: e.target.value } }))}
                          className="flex-1 bg-white border-2 border-transparent hover:border-gray-50 rounded-[1rem] px-4 py-2 text-[11px] font-semibold focus:ring-4 focus:ring-[#3bb4a1]/10 outline-none transition-all shadow-sm"
                        />
                        <button
                          type="submit"
                          disabled={rs.loading || !rs.input?.trim()}
                          className="bg-[#013e38] text-white px-5 py-2 rounded-[1rem] text-[9px] uppercase tracking-widest font-black disabled:opacity-50 hover:bg-[#3bb4a1] hover:shadow-lg transition-all"
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
          <form onSubmit={handleComment} className="flex gap-3 mt-6">
            <input
              type="text"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 bg-white border-2 border-transparent hover:border-gray-50 rounded-[1.2rem] px-5 py-3 text-sm font-medium focus:ring-4 focus:ring-[#3bb4a1]/10 outline-none transition-all shadow-[0_4px_15px_rgba(0,0,0,0.02)]"
            />
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              className="bg-[#013e38] text-white px-6 py-3 rounded-[1.2rem] text-[10px] uppercase tracking-widest font-black disabled:opacity-50 hover:bg-[#3bb4a1] hover:shadow-lg transition-all"
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

