import { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { skills } from "../Register/Skills";
import { FaImage, FaVideo, FaLink, FaPaperclip, FaTimes, FaCamera, FaHashtag, FaPlus } from "react-icons/fa";

const CreatePostModal = ({ onClose, onSubmit }) => {
  const [content, setContent] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Programming");
  const [postType, setPostType] = useState("Learning Progress");
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Hashtag state
  const [hashtags, setHashtags] = useState([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [previousHashtags, setPreviousHashtags] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const categories = ["Programming", "Design", "Business", "Marketing", "Writing"];
  const postTypes = [
    "Learning Progress",
    "Skill Achievement",
    "Question",
    "Opportunity",
    "Announcement",
    "Resource Share",
    "VidhyaTransfer Request",
    "Skill Offer"
  ];

  // Fetch user's previous hashtags on mount
  useEffect(() => {
    const fetchPreviousHashtags = async () => {
      try {
        const { data } = await axios.get("/post/my-hashtags");
        if (data.success) {
          setPreviousHashtags(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching previous hashtags:", error);
      }
    };
    fetchPreviousHashtags();
  }, []);

  const handleAddHashtag = (tag) => {
    if (!tag) return;
    let cleanTag = tag.trim().toLowerCase().replace(/^#+/, '').replace(/[^a-z0-9_]/g, '');
    if (!cleanTag) {
      toast.error("Invalid hashtag");
      return;
    }
    if (hashtags.includes(cleanTag)) {
      toast.error("Hashtag already added");
      return;
    }
    if (hashtags.length >= 10) {
      toast.error("Maximum 10 hashtags allowed");
      return;
    }
    setHashtags([...hashtags, cleanTag]);
    setHashtagInput("");
    setShowSuggestions(false);
  };

  const handleHashtagInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddHashtag(hashtagInput);
    }
    if (e.key === 'Backspace' && !hashtagInput && hashtags.length > 0) {
      setHashtags(hashtags.slice(0, -1));
    }
  };

  const removeHashtag = (index) => {
    setHashtags(hashtags.filter((_, i) => i !== index));
  };

  // Filter suggestions based on input
  const filteredSuggestions = previousHashtags.filter(
    (t) => !hashtags.includes(t.tag) && t.tag.includes(hashtagInput.toLowerCase().replace(/^#+/, ''))
  );

  const handleAddSkill = () => {
    if (!selectedSkill || selectedSkill === "Select a skill") {
      toast.error("Please select a skill");
      return;
    }

    if (selectedSkills.find((s) => s.name === selectedSkill)) {
      toast.error("Skill already added");
      return;
    }

    setSelectedSkills([
      ...selectedSkills,
      { name: selectedSkill, category: selectedCategory },
    ]);
    setSelectedSkill("");
  };

  const handleRemoveSkill = (index) => {
    setSelectedSkills(selectedSkills.filter((_, i) => i !== index));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + attachments.length > 4) {
      toast.error("Maximum 4 attachments allowed");
      return;
    }
    setAttachments([...attachments, ...files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim() && attachments.length === 0) {
      toast.error("Post content or attachment is required");
      return;
    }

    if (content.length > 1000) {
      toast.error("Post content should be less than 1000 characters");
      return;
    }

    // Combine inline hashtags from content + dedicated hashtag field
    const contentTags = content.match(/#[\w]+/g);
    const inlineTags = contentTags ? contentTags.map(t => t.slice(1).toLowerCase()) : [];
    const allTags = [...new Set([...hashtags, ...inlineTags])];

    if (allTags.length === 0) {
      toast.error("Add at least one hashtag using the tag field or include #tags in your content");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("content", content.trim());
      formData.append("type", postType);

      // Skills need to be stringified for FormData if it's an array of objects
      formData.append("skills", JSON.stringify(selectedSkills));

      // Send hashtags from the dedicated field
      formData.append("hashtags", JSON.stringify(hashtags));

      // Append files
      attachments.forEach((file) => {
        formData.append("attachments", file);
      });

      await onSubmit(formData);

      setContent("");
      setSelectedSkills([]);
      setAttachments([]);
      setHashtags([]);
      setPostType("Learning Progress");
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // All tags combined (for preview)
  const contentTags = content.match(/#[\w]+/g);
  const inlineTags = contentTags ? [...new Set(contentTags.map(t => t.slice(1).toLowerCase()))] : [];
  const allTagsPreview = [...new Set([...hashtags, ...inlineTags])];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-gray-900/80 backdrop-blur-md p-4 transition-all duration-300" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-fadeIn flex flex-col max-h-[90vh] border border-dark-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-6 py-5 border-b border-dark-border bg-slate-50 flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Create Post</h2>
          <button
            className="text-slate-600 hover:text-cyan-700 transition-colors bg-transparent border-none cursor-pointer p-2 hover:bg-white rounded-full"
            onClick={onClose}
          >
            <FaTimes size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            {/* Post Type Selector */}
            <div className="mb-6">
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">Category</label>
              <div className="flex flex-wrap gap-2.5">
                {postTypes.slice(0, 4).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPostType(type)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all border ${postType === type
                      ? "bg-cyan-500 text-dark-bg border-cyan-500 shadow-md shadow-cyan-500/20"
                      : "bg-white text-slate-600 border-dark-border hover:border-cyan-500/30 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Textarea */}
            <div className="mb-5 relative min-h-[120px]">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share what's on your mind..."
                rows="4"
                maxLength={1000}
                className="w-full text-base placeholder-slate-500 text-slate-900 bg-white border border-dark-border rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 p-4 resize-none outline-none leading-relaxed transition-all"
              />
              {attachments.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="relative group aspect-video">
                      <div className="h-full w-full bg-dark-bg rounded-xl border border-dark-border flex items-center justify-center overflow-hidden shadow-sm">
                        {file.type.startsWith('image/') ? (
                          <img src={URL.createObjectURL(file)} alt="preview" className="h-full w-full object-cover" />
                        ) : (
                          <div className="p-2 text-center">
                            <FaPaperclip className="mx-auto mb-1 text-slate-600" />
                            <span className="text-xs text-slate-600 font-medium break-all line-clamp-1">{file.name}</span>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="absolute top-2 right-2 bg-white/90 text-slate-700 rounded-full p-1.5 shadow-md hover:bg-red-500 hover:text-white transition-all border border-dark-border hover:border-red-500 transform scale-90 group-hover:scale-100"
                      >
                        <FaTimes size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Hashtag Field ────────────────────────── */}
            <div className="mb-5">
              <label className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">
                <FaHashtag size={10} className="text-cyan-500" />
                Hashtags <span className="text-red-400">*</span>
              </label>

              {/* Selected hashtags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {hashtags.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 bg-cyan-50 text-cyan-700 pl-3 pr-1.5 py-1.5 rounded-lg text-xs font-bold border border-cyan-200 group hover:bg-cyan-100 transition-all"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeHashtag(i)}
                      className="p-0.5 rounded-full hover:bg-cyan-200 text-cyan-400 hover:text-red-500 transition-colors"
                    >
                      <FaTimes size={8} />
                    </button>
                  </span>
                ))}
              </div>

              {/* Input */}
              <div className="relative">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">#</span>
                    <input
                      type="text"
                      value={hashtagInput}
                      onChange={(e) => {
                        setHashtagInput(e.target.value.replace(/\s/g, ''));
                        setShowSuggestions(true);
                      }}
                      onKeyDown={handleHashtagInputKeyDown}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      placeholder="Type a tag and press Enter"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddHashtag(hashtagInput)}
                    disabled={!hashtagInput.trim()}
                    className="px-3.5 py-2.5 bg-cyan-500 text-white rounded-xl hover:bg-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-1.5 text-xs font-bold"
                  >
                    <FaPlus size={10} /> Add
                  </button>
                </div>

                {/* Suggestions dropdown */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-[150px] overflow-y-auto">
                    <div className="p-2">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2 py-1 mb-1">Your previous tags</p>
                      {filteredSuggestions.map((t, i) => (
                        <button
                          key={i}
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); handleAddHashtag(t.tag); }}
                          className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-cyan-50 hover:text-cyan-700 rounded-lg transition-colors flex items-center justify-between group"
                        >
                          <span>#{t.tag}</span>
                          <span className="text-[10px] text-slate-400 group-hover:text-cyan-500">{t.count}×</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Previous hashtags quick-add (always visible if no input focus) */}
              {previousHashtags.length > 0 && hashtags.length === 0 && !hashtagInput && (
                <div className="mt-3">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Quick add from previous posts</p>
                  <div className="flex flex-wrap gap-1.5">
                    {previousHashtags.slice(0, 8).map((t, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleAddHashtag(t.tag)}
                        className="px-2.5 py-1 bg-slate-50 text-slate-600 text-[11px] font-bold rounded-lg border border-slate-200 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-200 transition-all"
                      >
                        #{t.tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tag count / status indicator */}
              <div className={`mt-2 text-[10px] font-bold flex items-center gap-1.5 ${
                allTagsPreview.length > 0 ? 'text-cyan-600' : 'text-amber-500'
              }`}>
                <FaHashtag size={8} />
                {allTagsPreview.length > 0
                  ? `${allTagsPreview.length} tag${allTagsPreview.length > 1 ? 's' : ''}: ${allTagsPreview.map(t => '#' + t).join(', ')}`
                  : 'At least one hashtag is required'
                }
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 py-4 px-6 border-t border-dark-border flex-shrink-0 bg-slate-50/50">
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-cyan-700 hover:bg-cyan-500/10 rounded-lg transition-all"
            >
              <FaImage size={18} className="text-cyan-500" />
              <span className="text-sm font-semibold">Photo / Video</span>
            </button>
            <button
              type="button"
              className="items-center gap-2 px-4 py-2 text-slate-600 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all hidden"
            >
              <FaPaperclip size={18} className="text-cyan-600" />
              <span className="text-sm font-semibold">File</span>
            </button>

            <input
              type="file"
              hidden
              ref={fileInputRef}
              accept="image/*,video/*"
              multiple
              onChange={handleFileSelect}
            />
          </div>

          <div className="flex justify-end gap-3 flex-shrink-0 p-6 pt-2 border-t border-dark-border bg-white mt-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-slate-600 font-semibold hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all text-sm"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-2.5 bg-cyan-500 text-dark-bg font-bold rounded-lg hover:bg-cyan-400 shadow-md hover:shadow-cyan-500/20 transition-all disabled:opacity-50 text-sm"
              disabled={loading}
            >
              {loading ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;
