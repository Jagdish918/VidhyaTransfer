import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { FaHeart, FaRegHeart, FaComment, FaShare, FaBookmark, FaRegBookmark, FaEllipsisH, FaTrash } from "react-icons/fa";
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
  const [showFullContent, setShowFullContent] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    setIsLiked(post.likes?.some((like) => (like._id || like) === user?._id) || false);
    setLikesCount(post.likesCount ?? (post.likes?.length || 0));
    setCommentsCount(post.commentsCount ?? (post.comments?.length || 0));
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
      await axios.post("/request/create", { receiverID: post.author._id }, { withCredentials: true });
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
      await axios.post("/request/cancel", { receiverID: post.author._id }, { withCredentials: true });
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
  const contentExcerpt = post.content?.length > 150 ? post.content.substring(0, 150) + "..." : post.content;

  return (
    <div className="bg-white rounded-3xl shadow-soft border border-slate-100 mb-8 overflow-hidden transition-all duration-300 hover:shadow-card hover:border-cyan-500/20 group/post">
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center gap-4">
          <Link to={`/profile/${post.author?.username || post.author?._id}`} className="relative group/avatar">
            <div className="absolute inset-0 bg-cyan-500 rounded-2xl blur opacity-0 group-hover/avatar:opacity-20 transition-opacity"></div>
            <img
              src={post.author?.picture || "/default-avatar.png"}
              alt={post.author?.name}
              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-50 group-hover/avatar:ring-white transition-all relative z-10"
            />
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <Link to={`/profile/${post.author?.username || post.author?._id}`} className="text-[15px] font-bold text-slate-900 no-underline hover:text-cyan-600 transition-colors leading-tight">
                {post.author?.name || "Anonymous"}
              </Link>
              {!isAuthor && (
                <div className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <button
                    onClick={
                      connectStatus === "Connect" ? handleConnect
                        : connectStatus === "Pending" ? handleCancelRequest
                          : undefined
                    }
                    className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-lg transition-all ${connectStatus === "Connect" ? "text-cyan-600 bg-cyan-50 hover:bg-cyan-600 hover:text-white" :
                        connectStatus === "Pending" ? "text-amber-600 bg-amber-50 hover:bg-red-50 hover:text-red-600" : "text-slate-400 bg-slate-50"
                      }`}
                  >
                    {connectStatus === "Connect" ? "Connect" : connectStatus === "Pending" ? "Sent" : "Connected"}
                  </button>
                </div>
              )}
            </div>
            <span className="text-xs text-slate-400 font-semibold mt-1">{formatTime(post.createdAt)}</span>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="p-2 text-slate-600 hover:bg-dark-hover hover:text-slate-900 rounded-full transition-colors"
          >
            <FaEllipsisH />
          </button>
          {showOptions && (
            <div className="absolute right-0 mt-2 w-40 bg-dark-card border border-dark-border rounded-xl shadow-card z-20 overflow-hidden py-1">
              {isAuthor && (
                <button
                  onClick={() => { handleDelete(); setShowOptions(false); }}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <FaTrash size={12} /> Delete Post
                </button>
              )}
              <button
                onClick={() => setShowOptions(false)}
                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-dark-hover hover:text-slate-900 transition-colors"
              >
                Hide Post
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-6 mt-[-8px]">
        <p className="text-[15px] text-slate-600 leading-[1.6] whitespace-pre-wrap font-medium">
          {showFullContent ? post.content : contentExcerpt}
          {post.content?.length > 150 && !showFullContent && (
            <button
              onClick={() => setShowFullContent(true)}
              className="ml-1 text-cyan-600 font-bold text-xs hover:underline transition-all"
            >
              read more
            </button>
          )}
        </p>
      </div>

      {/* Media */}
      {post.attachments && post.attachments.length > 0 && (
        <div className="w-full bg-dark-bg overflow-hidden border-y border-dark-border">
          {post.attachments.map((att, idx) => {
            const isImage = att.startsWith('data:image') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(att) || att.includes('/image/upload/');
            const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(att) || att.includes('/video/upload/');
            if (isImage) return <img key={idx} src={att} alt="Post media" className="w-full h-auto object-cover max-h-[500px] select-none" />;
            if (isVideo) return <video key={idx} src={att} controls className="w-full h-auto max-h-[500px]" />;
            return null;
          })}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-2 flex items-center justify-between border-t border-slate-50 bg-white">
        <button
          onClick={handleLike}
          className={`flex-1 py-3 rounded-2xl flex items-center justify-center gap-2.5 transition-all hover:bg-slate-50 group/btn ${isLiked ? "text-red-500" : "text-slate-500 hover:text-slate-900"}`}
        >
          <div className="flex items-center gap-2">
            {isLiked ? <FaHeart size={18} /> : <FaRegHeart size={18} className="group-hover/btn:scale-110 transition-transform" />}
            <span className="text-[13px] font-bold">Like</span>
            {likesCount > 0 && <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-lg ${isLiked ? 'bg-red-50' : 'bg-slate-100'}`}>{likesCount.toLocaleString()}</span>}
          </div>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex-1 py-3 rounded-2xl flex items-center justify-center gap-2.5 text-slate-500 hover:text-slate-900 transition-all hover:bg-slate-50 group/btn"
        >
          <div className="flex items-center gap-2">
            <FaComment size={18} className="group-hover/btn:scale-110 transition-transform" />
            <span className="text-[13px] font-bold">Comment</span>
            {commentsCount > 0 && <span className="text-[11px] font-extrabold bg-slate-100 px-2 py-0.5 rounded-lg">{commentsCount.toLocaleString()}</span>}
          </div>
        </button>
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: 'VidhyaTransfer Post', text: post.content, url: window.location.href });
            } else {
              toast.info("Sharing not supported on this browser");
            }
          }}
          className="flex-1 py-3 rounded-2xl flex items-center justify-center gap-2.5 text-slate-500 hover:text-slate-900 transition-all hover:bg-slate-50 group/btn"
        >
          <FaShare size={18} className="group-hover/btn:scale-110 transition-transform" />
          <span className="text-[13px] font-bold">Share</span>
        </button>
      </div>


      {/* ── Comments Section ── */}
      {showComments && (
        <div className="bg-slate-50 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="px-6 py-6 space-y-6">
            {comments.map((comment) => {
              const commentLiked = isCommentLiked(comment);
              const commentLikesCount = comment._likesCount ?? (comment.likes?.length || 0);
              const rs = replyState[comment._id] || {};

              return (
                <div key={comment._id} className="group/comment">
                  <div className="flex gap-4">
                    <img
                      src={comment.user?.picture || "/default-avatar.png"}
                      alt={comment.user?.name}
                      className="w-10 h-10 rounded-2xl object-cover flex-shrink-0 mt-0.5 border border-white shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm inline-block max-w-full">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-slate-900">{comment.user?.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{formatTime(comment.createdAt)}</span>
                        </div>
                        <p className="text-[13px] text-slate-600 leading-relaxed break-words font-medium">
                          {comment.content}
                        </p>
                      </div>

                      {/* Interaction Options */}
                      <div className="flex items-center gap-6 mt-3 ml-1">
                        <button
                          onClick={() => handleCommentLike(comment._id)}
                          className={`flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest transition-colors ${commentLiked ? "text-red-500" : "text-slate-400 hover:text-slate-900"}`}
                        >
                          <FaHeart size={12} className={commentLiked ? "fill-current" : ""} />
                          {commentLikesCount > 0 && <span>{commentLikesCount}</span>}
                          <span>Like</span>
                        </button>
                        <button
                          onClick={() => toggleReplyInput(comment._id)}
                          className="text-[11px] font-extrabold text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors"
                        >
                          Reply
                        </button>
                        {comment.replies?.length > 0 && (
                          <button
                            onClick={() => setReplyState(prev => ({ ...prev, [comment._id]: { ...prev[comment._id], showReplies: !(prev[comment._id]?.showReplies ?? true) } }))}
                            className="text-[11px] font-extrabold text-cyan-500 hover:text-cyan-600 uppercase tracking-widest transition-colors"
                          >
                            {(rs.showReplies ?? true) ? "Hide replies" : `Show ${comment.replies.length} ${comment.replies.length === 1 ? "reply" : "replies"}`}
                          </button>
                        )}
                      </div>

                      {/* Reply input */}
                      {rs.show && (
                        <form onSubmit={(e) => handleReply(e, comment._id)} className="flex gap-3 mt-4">
                          <img
                            src={user?.picture || "/default-avatar.png"}
                            alt="Your avatar"
                            className="w-8 h-8 rounded-xl object-cover border border-white shadow-sm"
                          />
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              placeholder={`Reply to ${comment.user?.name.split(' ')[0]}...`}
                              value={rs.input || ""}
                              onChange={(e) => setReplyState(prev => ({ ...prev, [comment._id]: { ...prev[comment._id], input: e.target.value } }))}
                              className="w-full bg-white border border-slate-100 rounded-xl pl-4 pr-12 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-cyan-500/5 focus:border-cyan-500 outline-none transition-all shadow-sm font-medium"
                            />
                            <button
                              type="submit"
                              disabled={rs.loading || !rs.input?.trim()}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-cyan-500 hover:text-cyan-600 disabled:opacity-30 p-2"
                            >
                              <FaShare size={14} />
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Threaded Replies */}
                      {(rs.showReplies ?? true) && comment.replies?.length > 0 && (
                        <div className="mt-5 space-y-4 border-l-2 border-slate-200 ml-5 pl-5">
                          {comment.replies.map((reply) => {
                            const replyLiked = isReplyLiked(reply);
                            const replyLikesCount = reply._likesCount ?? (reply.likes?.length || 0);
                            return (
                              <div key={reply._id} className="flex gap-4">
                                <img
                                  src={reply.user?.picture || "/default-avatar.png"}
                                  alt={reply.user?.name}
                                  className="w-8 h-8 rounded-xl object-cover flex-shrink-0 mt-0.5 border border-white shadow-sm"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="bg-white border border-slate-100 rounded-2xl px-4 py-2.5 shadow-sm inline-block max-w-full">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className="text-sm font-bold text-slate-900">{reply.user?.name}</span>
                                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{formatTime(reply.createdAt)}</span>
                                    </div>
                                    <p className="text-[13px] text-slate-600 leading-relaxed break-words font-medium">
                                      {reply.content}
                                    </p>
                                  </div>
                                  <div className="mt-2 ml-1">
                                    <button
                                      onClick={() => handleReplyLike(comment._id, reply._id)}
                                      className={`flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest transition-colors ${replyLiked ? "text-red-500" : "text-slate-400 hover:text-slate-900"}`}
                                    >
                                      <FaHeart size={10} className={replyLiked ? "fill-current" : ""} />
                                      {replyLikesCount > 0 && <span>{replyLikesCount}</span>}
                                      <span>Like</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* New Comment Input */}
          <div className="p-6 border-t border-slate-100 bg-white">
            <form onSubmit={handleComment} className="flex items-center gap-4">
              <img
                src={user?.picture || "/default-avatar.png"}
                alt="My avatar"
                className="w-10 h-10 rounded-2xl object-cover border border-slate-100"
              />
              <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  placeholder="Share your thoughts..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] px-6 py-3.5 text-sm text-slate-900 font-bold placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-cyan-500/5 focus:border-cyan-500 transition-all shadow-inner"
                />
                <button
                  type="submit"
                  disabled={loading || !newComment.trim()}
                  className="absolute right-4 bg-cyan-500 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-cyan-600 disabled:opacity-30 transition-all shadow-lg shadow-cyan-500/20"
                >
                  <FaShare size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
