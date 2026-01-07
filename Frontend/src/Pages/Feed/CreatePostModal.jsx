import { useState } from "react";
import { toast } from "react-toastify";
import { skills } from "../Register/Skills";
import "./Feed.css";

const CreatePostModal = ({ onClose, onSubmit }) => {
  const [content, setContent] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Programming");
  const [loading, setLoading] = useState(false);

  const categories = ["Programming", "Design", "Business", "Marketing", "Writing"];

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error("Post content is required");
      return;
    }

    if (content.length > 1000) {
      toast.error("Post content should be less than 1000 characters");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        content: content.trim(),
        skills: selectedSkills,
      });
      setContent("");
      setSelectedSkills([]);
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create New Post</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-post-form">
          <div className="form-group">
            <label htmlFor="content">What's on your mind?</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, ask for help, or offer your skills..."
              rows="6"
              maxLength={1000}
              required
            />
            <span className="char-count">{content.length}/1000</span>
          </div>

          <div className="form-group">
            <label htmlFor="skills">Add Skills (Optional)</label>
            <div className="skill-selector">
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="skill-select-input"
              >
                <option>Select a skill</option>
                {skills.map((skill) => (
                  <option key={skill} value={skill}>
                    {skill}
                  </option>
                ))}
              </select>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="category-select-input"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddSkill}
                className="btn-add-skill-modal"
              >
                Add
              </button>
            </div>

            {selectedSkills.length > 0 && (
              <div className="selected-skills">
                {selectedSkills.map((skill, index) => (
                  <span key={index} className="skill-tag-modal">
                    {skill.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(index)}
                      className="remove-skill-tag"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;

