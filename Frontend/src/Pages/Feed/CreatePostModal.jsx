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

    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 transition-all duration-300" onClick={onClose}>
      <div
        className="bg-[#fafafa] rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.1)] w-full max-w-xl overflow-hidden animate-fadeIn flex flex-col max-h-[90vh] border border-gray-50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 bg-white flex-shrink-0">
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Create Post</h2>
          <button
            className="text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-none cursor-pointer p-2 hover:bg-gray-50 rounded-full"
            onClick={onClose}
          >
            <FaTimes size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 flex flex-col custom-scrollbar">
          {/* Post Type Selector */}
          <div className="mb-6">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Category</label>
            <div className="flex flex-wrap gap-2.5">
              {postTypes.slice(0, 4).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPostType(type)}
                  className={`px-5 py-2.5 rounded-[1.2rem] text-[9px] uppercase font-black tracking-widest transition-all border-2 ${postType === type
                    ? "bg-[#013e38] text-white border-[#013e38] shadow-lg shadow-[#013e38]/20"
                    : "bg-white text-gray-400 border-transparent hover:border-gray-100 hover:text-gray-900"
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6 relative flex-1 min-h-[120px]">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share what's on your mind..."
              rows="4"
              maxLength={1000}
              className="w-full text-lg font-medium text-gray-900 placeholder-gray-300 bg-transparent border-none focus:ring-0 p-2 resize-none outline-none leading-relaxed"
            />
            {attachments.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                {attachments.map((file, idx) => (
                  <div key={idx} className="relative group aspect-video">
                    <div className="h-full w-full bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
                      {file.type.startsWith('image/') ? (
                        <img src={URL.createObjectURL(file)} alt="preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="p-2 text-center">
                          <FaPaperclip className="mx-auto mb-1 text-gray-400" />
                          <span className="text-[10px] text-gray-500 font-medium break-all line-clamp-1">{file.name}</span>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="absolute top-2 right-2 bg-gray-900/80 text-white rounded-full p-1.5 shadow-md hover:bg-red-500 transition-all transform scale-90 group-hover:scale-100"
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 py-5 border-t border-gray-100 mb-6 flex-shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="flex items-center gap-3 px-5 py-3 text-gray-500 hover:text-gray-900 bg-white hover:bg-white rounded-[1.2rem] transition-all border-2 border-transparent hover:border-gray-50 shadow-sm group"
            >
              <FaImage size={18} className="text-[#3bb4a1]" />
              <span className="text-[10px] uppercase font-black tracking-widest">Photo / Video</span>
            </button>
            <button
              type="button"
              className="flex items-center gap-3 px-5 py-3 text-gray-500 hover:text-gray-900 bg-white hover:bg-white rounded-[1.2rem] transition-all border-2 border-transparent hover:border-gray-50 shadow-sm group hidden"
            >
              <FaPaperclip size={18} className="text-[#013e38]" />
              <span className="text-[10px] uppercase font-black tracking-widest">File</span>
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

          <div className="flex justify-end gap-4 flex-shrink-0 mt-auto pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3.5 text-gray-400 font-black hover:text-gray-900 bg-transparent hover:bg-gray-100/50 rounded-[1.2rem] transition-all text-[10px] uppercase tracking-[0.2em]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-10 py-3.5 bg-[#013e38] text-white font-black rounded-[1.2rem] hover:bg-[#3bb4a1] shadow-xl shadow-[#013e38]/20 hover:shadow-[#3bb4a1]/30 transition-all disabled:opacity-50 text-[10px] uppercase tracking-[0.2em]"
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

