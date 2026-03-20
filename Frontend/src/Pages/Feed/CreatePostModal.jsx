import { useState, useRef } from "react";
import { toast } from "react-toastify";
import { skills } from "../Register/Skills";
import { FaImage, FaVideo, FaLink, FaPaperclip, FaTimes, FaCamera } from "react-icons/fa";

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

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("content", content.trim());
      formData.append("type", postType);

      // Skills need to be stringified for FormData if it's an array of objects
      formData.append("skills", JSON.stringify(selectedSkills));

      // Append files
      attachments.forEach((file) => {
        formData.append("attachments", file);
      });

      await onSubmit(formData); // onSubmit (in Feed.jsx) will need to handle this being a FormData object

      setContent("");
      setSelectedSkills([]);
      setAttachments([]);
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

          <div className="mb-6 relative flex-1 min-h-[140px]">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share what's on your mind..."
              rows="5"
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
