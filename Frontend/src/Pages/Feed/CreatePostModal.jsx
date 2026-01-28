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

    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-[#013e38]/80 backdrop-blur-sm p-4 transition-all duration-300" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fadeIn flex flex-col max-h-[90vh] border border-[#3bb4a1]/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-8 py-5 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800 font-['Oswald'] tracking-wide uppercase">Create Post</h2>
          <button
            className="text-gray-400 hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer p-2 hover:bg-red-50 rounded-full"
            onClick={onClose}
          >
            <FaTimes size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto flex-1 flex flex-col custom-scrollbar">
          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 font-['Oswald']">Post Type</label>
            <div className="relative">
              <select
                value={postType}
                onChange={(e) => setPostType(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-[#3bb4a1] focus:border-[#3bb4a1] outline-none transition-all appearance-none cursor-pointer hover:bg-white"
              >
                {postTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <div className="mb-6 relative flex-1 min-h-[150px]">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What do you want to share or ask?"
              rows="5"
              maxLength={1000}
              className="w-full text-base text-gray-700 placeholder-gray-400 bg-transparent border-none focus:ring-0 p-0 resize-none outline-none font-['Montserrat'] leading-relaxed"
            />
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {attachments.map((file, idx) => (
                  <div key={idx} className="relative group">
                    <div className="h-20 w-20 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
                      {file.type.startsWith('image/') ? (
                        <img src={URL.createObjectURL(file)} alt="preview" className="h-full w-full object-cover" />
                      ) : file.type.startsWith('video/') ? (
                        <video src={URL.createObjectURL(file)} className="h-full w-full object-cover" />
                      ) : (
                        <div className="p-2 text-center">
                          <FaPaperclip className="mx-auto mb-1 text-gray-400" />
                          <span className="text-[10px] text-gray-500 font-medium break-all line-clamp-2 leading-tight">{file.name}</span>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 hover:bg-red-600"
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-5 border-t border-b border-gray-100 mb-6 bg-gray-50/50 -mx-8 px-8 flex-shrink-0">
            <span className="text-sm font-bold text-gray-600 font-['Oswald'] uppercase tracking-wide">Add to your post:</span>
            <div className="flex gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => cameraInputRef.current.click()}
                className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all border border-transparent hover:border-red-200 group"
              >
                <FaCamera size={16} className="group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold">Camera</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="flex items-center gap-2 px-4 py-2 text-[#3bb4a1] bg-[#3bb4a1]/10 hover:bg-[#3bb4a1]/20 rounded-xl transition-all border border-transparent hover:border-[#3bb4a1]/30 group"
              >
                <FaImage size={16} className="group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold">Media</span>
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

          <div className="mb-8 flex-shrink-0">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 font-['Oswald']">Tags / Skills</label>
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <select
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-[#3bb4a1] outline-none appearance-none hover:bg-white transition-colors"
                >
                  <option>Select a skill</option>
                  {skills.map((skill) => (
                    <option key={skill} value={skill}>
                      {skill}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-6 py-3 bg-[#013e38] text-white font-bold rounded-xl hover:bg-[#012b27] transition-all text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
                disabled={!selectedSkill || selectedSkill === "Select a skill"}
              >
                Add Tag
              </button>
            </div>

            {selectedSkills.length > 0 && (
              <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                {selectedSkills.map((skill, index) => (
                  <span key={index} className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-[#3bb4a1]/10 text-[#013e38] border border-[#3bb4a1]/20">
                    #{skill.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(index)}
                      className="ml-2 text-[#3bb4a1] hover:text-red-500 transition-colors bg-white rounded-full p-0.5 hover:bg-red-50"
                    >
                      <FaTimes size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4 flex-shrink-0 mt-auto pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-all text-sm uppercase tracking-wide hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-[#3bb4a1] text-white font-bold rounded-xl hover:bg-[#2fa08e] shadow-lg shadow-[#3bb4a1]/30 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm uppercase tracking-wide"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Posting...</span>
                </div>
              ) : "Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;

