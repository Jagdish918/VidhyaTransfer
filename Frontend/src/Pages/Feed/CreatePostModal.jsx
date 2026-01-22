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
    "SkillSwap Request",
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
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800">Create Post</h2>
          <button
            className="text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-none cursor-pointer"
            onClick={onClose}
          >
            <FaTimes size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 flex flex-col">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Post Type</label>
            <select
              value={postType}
              onChange={(e) => setPostType(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              {postTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="mb-4 relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What do you want to share or ask?"
              rows="5"
              maxLength={1000}
              className="w-full text-base text-gray-700 placeholder-gray-400 bg-transparent border-none focus:ring-0 p-0 resize-none outline-none"
            />
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {attachments.map((file, idx) => (
                  <div key={idx} className="relative group">
                    <div className="h-16 w-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                      {file.type.startsWith('image/') ? (
                        <img src={URL.createObjectURL(file)} alt="preview" className="h-full w-full object-cover" />
                      ) : file.type.startsWith('video/') ? (
                        <video src={URL.createObjectURL(file)} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs text-center p-1 break-words">{file.name.slice(0, 10)}...</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 py-4 border-t border-b border-gray-200 mb-4 bg-gray-50 px-4 rounded-lg flex-shrink-0">
            <span className="text-sm font-semibold text-gray-700">Add to your post:</span>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => cameraInputRef.current.click()}
                className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 hover:border-red-300"
              >
                <FaCamera size={18} />
                <span className="text-sm font-medium">Camera</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 hover:border-blue-300"
              >
                <FaPaperclip size={16} />
                <span className="text-sm font-medium">Files (Photos, Videos, Documents)</span>
              </button>

              <input
                type="file"
                hidden
                ref={fileInputRef}
                accept="image/*,video/*,.pdf,.doc,.docx"
                multiple
                onChange={handleFileSelect}
              />
              <input
                type="file"
                hidden
                ref={cameraInputRef}
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
              />
            </div>
          </div>

          <div className="mb-6 flex-shrink-0">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tags / Skills</label>
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="flex-1 p-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option>Select a skill</option>
                {skills.map((skill) => (
                  <option key={skill} value={skill}>
                    {skill}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-black transition-colors text-sm"
              >
                Add Tag
              </button>
            </div>

            {selectedSkills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedSkills.map((skill, index) => (
                  <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    #{skill.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(index)}
                      className="ml-2 text-blue-400 hover:text-red-500 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 flex-shrink-0 mt-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
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

