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
  const contentExcerpt = post.content?.length > 150 ? post.content.substring(0, 150) + "..." : post.content;

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-gray-100 mb-5 overflow-hidden max-w-[580px] mx-auto transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] group/post">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${post.author?.username || post.author?._id}`}>
            <img
              src={post.author?.picture || "/default-avatar.png"}
              alt={post.author?.name}
              className="w-10 h-10 rounded-full object-cover border border-gray-100"
            />
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <Link to={`/profile/${post.author?.username || post.author?._id}`} className="text-[13px] font-bold text-gray-900 no-underline hover:text-[#3bb4a1] transition-colors leading-tight">
                {post.author?.name || "Anonymous"}
              </Link>
              {!isAuthor && (
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-300 transform scale-75">•</span>
                  <button 
                    onClick={
                      connectStatus === "Connect" ? handleConnect
                        : connectStatus === "Pending" ? handleCancelRequest
                          : undefined
                    }
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md transition-all ${
                      connectStatus === "Connect" ? "text-[#3bb4a1] bg-[#3bb4a1]/5 hover:bg-[#3bb4a1] hover:text-white" : 
                      connectStatus === "Pending" ? "text-amber-600 bg-amber-50 hover:bg-red-50 hover:text-red-500" : "text-gray-400 bg-gray-50"
                    }`}
                  >
                    {connectStatus === "Connect" ? "Connect" : connectStatus === "Pending" ? "Sent" : "Connected"}
                  </button>
                </div>
              )}
            </div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{formatTime(post.createdAt)}</span>
          </div>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowOptions(!showOptions)}
            className="p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors"
          >
            <FaEllipsisH />
          </button>
          {showOptions && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden py-1">
              {isAuthor && (
                <button 
                  onClick={() => { handleDelete(); setShowOptions(false); }}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2"
                >
                  <FaTrash size={10} /> Delete Post
                </button>
              )}
              <button 
                onClick={() => setShowOptions(false)}
                className="w-full text-left px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                Hide Post
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-4">
        <p className="text-[13px] text-gray-700 leading-[1.7] whitespace-pre-wrap font-medium">
          {showFullContent ? post.content : contentExcerpt}
          {post.content?.length > 150 && !showFullContent && (
            <button 
              onClick={() => setShowFullContent(true)}
              className="ml-1 text-[#3bb4a1] font-black uppercase text-[10px] tracking-widest hover:text-[#013e38] transition-colors outline-none"
            >
              See more
            </button>
          )}
        </p>
      </div>

      {/* Media */}
      {post.attachments && post.attachments.length > 0 && (
        <div className="w-full bg-gray-50 overflow-hidden border-y border-gray-50">
          {post.attachments.map((att, idx) => {
            const isImage = att.startsWith('data:image') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(att) || att.includes('/image/upload/');
            const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(att) || att.includes('/video/upload/');
            if (isImage) return <img key={idx} src={att} alt="Post media" className="w-full h-auto object-cover select-none" />;
            if (isVideo) return <video key={idx} src={att} controls className="w-full h-auto" />;
            return null;
          })}
        </div>
      )}

      {/* Actions */}
      <div className="p-1 flex items-center justify-between border-t border-gray-50 bg-white">
        <button 
          onClick={handleLike}
          className={`flex-1 py-1.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-gray-50 group/btn ${isLiked ? "text-red-500" : "text-gray-400 hover:text-gray-900"}`}
        >
          <div className="flex items-center gap-2">
            {isLiked ? <FaHeart size={15} /> : <FaRegHeart size={15} className="group-hover/btn:scale-110 transition-transform" />}
            <span className="text-[10px] font-black uppercase tracking-[0.15em]">Like</span>
            {likesCount > 0 && <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${isLiked ? 'bg-red-50' : 'bg-gray-50'}`}>{likesCount.toLocaleString()}</span>}
          </div>
        </button>
        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex-1 py-1.5 rounded-xl flex items-center justify-center gap-2 text-gray-400 hover:text-gray-900 transition-all hover:bg-gray-50 group/btn"
        >
          <div className="flex items-center gap-2">
            <FaComment size={15} className="group-hover/btn:scale-110 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.15em]">Comment</span>
            {commentsCount > 0 && <span className="text-[10px] font-black bg-gray-50 px-1.5 py-0.5 rounded-full">{commentsCount.toLocaleString()}</span>}
          </div>
        </button>
        <button 
          onClick={() => {
            if(navigator.share) {
              navigator.share({ title: 'VidhyaTransfer Post', text: post.content, url: window.location.href });
            } else {
              toast.info("Sharing not supported on this browser");
            }
          }}
          className="flex-1 py-1.5 rounded-xl flex items-center justify-center gap-2 text-gray-400 hover:text-gray-900 transition-all hover:bg-gray-50 group/btn"
        >
          <div className="flex items-center gap-2">
            <FaShare size={15} className="group-hover/btn:scale-110 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.15em]">Share</span>
          </div>
        </button>
        <button className="flex-1 py-1.5 rounded-xl flex items-center justify-center gap-2 text-gray-400 hover:text-gray-900 transition-all hover:bg-gray-50 group/btn">
          <div className="flex items-center gap-2">
            <FaRegBookmark size={15} className="group-hover/btn:scale-110 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.15em]">Save</span>
          </div>
        </button>
      </div>


      {/* ── Comments Section ── */}
      {showComments && (
        <div className="bg-gray-50/50 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="px-4 py-6 space-y-6">
            {comments.map((comment) => {
              const commentLiked = isCommentLiked(comment);
              const commentLikesCount = comment._likesCount ?? (comment.likes?.length || 0);
              const rs = replyState[comment._id] || {};

              return (
                <div key={comment._id} className="group/comment">
                  <div className="flex gap-3">
                    <img
                      src={comment.user?.picture || "/default-avatar.png"}
                      alt={comment.user?.name}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[13px] font-bold text-gray-900">{comment.user?.name}</span>
                        <span className="text-[11px] text-gray-400 font-medium">{formatTime(comment.createdAt)}</span>
                      </div>
                      <p className="text-[13px] text-gray-700 leading-relaxed mb-2 break-words">
                        {comment.content}
                      </p>
                      
                      {/* Interaction Options */}
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleCommentLike(comment._id)}
                          className={`flex items-center gap-1.5 text-[11px] font-bold transition-colors ${commentLiked ? "text-red-500" : "text-gray-400 hover:text-gray-900"}`}
                        >
                          <FaHeart size={10} className={commentLiked ? "fill-current" : ""} />
                          {commentLikesCount > 0 && <span>{commentLikesCount}</span>}
                          <span>Like</span>
                        </button>
                        <button
                          onClick={() => toggleReplyInput(comment._id)}
                          className="text-[11px] font-bold text-gray-400 hover:text-gray-900 transition-colors"
                        >
                          Reply
                        </button>
                        {comment.replies?.length > 0 && (
                          <button
                            onClick={() => setReplyState(prev => ({ ...prev, [comment._id]: { ...prev[comment._id], showReplies: !(prev[comment._id]?.showReplies ?? true) } }))}
                            className="text-[11px] font-bold text-[#3bb4a1] hover:text-[#013e38] transition-colors"
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
                            className="w-7 h-7 rounded-full object-cover"
                          />
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              placeholder={`Reply to ${comment.user?.name}...`}
                              value={rs.input || ""}
                              onChange={(e) => setReplyState(prev => ({ ...prev, [comment._id]: { ...prev[comment._id], input: e.target.value } }))}
                              className="w-full bg-white border border-gray-200 rounded-lg pl-3 pr-10 py-1.5 text-[13px] focus:ring-2 focus:ring-[#3bb4a1]/20 focus:border-[#3bb4a1] outline-none transition-all"
                            />
                            <button
                              type="submit"
                              disabled={rs.loading || !rs.input?.trim()}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#3bb4a1] hover:text-[#013e38] disabled:opacity-30 p-1"
                            >
                              <FaShare size={12} />
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Threaded Replies */}
                      {(rs.showReplies ?? true) && comment.replies?.length > 0 && (
                        <div className="mt-4 space-y-4 border-l border-gray-100 ml-1 pl-4">
                          {comment.replies.map((reply) => {
                            const replyLiked = isReplyLiked(reply);
                            const replyLikesCount = reply._likesCount ?? (reply.likes?.length || 0);
                            return (
                              <div key={reply._id} className="flex gap-3">
                                <img
                                  src={reply.user?.picture || "/default-avatar.png"}
                                  alt={reply.user?.name}
                                  className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[12px] font-bold text-gray-900">{reply.user?.name}</span>
                                    <span className="text-[11px] text-gray-400 font-medium">{formatTime(reply.createdAt)}</span>
                                  </div>
                                  <p className="text-[12px] text-gray-700 leading-relaxed mb-1.5 break-words">
                                    {reply.content}
                                  </p>
                                  <button
                                    onClick={() => handleReplyLike(comment._id, reply._id)}
                                    className={`flex items-center gap-1.5 text-[10px] font-bold transition-colors ${replyLiked ? "text-red-500" : "text-gray-400 hover:text-gray-900"}`}
                                  >
                                    <FaHeart size={9} className={replyLiked ? "fill-current" : ""} />
                                    {replyLikesCount > 0 && <span>{replyLikesCount}</span>}
                                    <span>Like</span>
                                  </button>
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
          <div className="p-4 border-t border-gray-100 bg-white">
            <form onSubmit={handleComment} className="flex items-center gap-3">
              <img
                src={user?.picture || "/default-avatar.png"}
                alt="My avatar"
                className="w-8 h-8 rounded-full object-cover border border-gray-100"
              />
              <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-xl px-4 py-2.5 text-[13px] font-medium placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#3bb4a1]/20 transition-all"
                />
                <button
                  type="submit"
                  disabled={loading || !newComment.trim()}
                  className="absolute right-3 text-[#3bb4a1] hover:text-[#013e38] disabled:opacity-30 transition-colors p-1"
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

