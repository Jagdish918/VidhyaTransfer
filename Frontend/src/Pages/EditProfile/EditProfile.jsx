import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { useUser } from "../../util/UserContext";
import { skills as availableSkills } from "./Skills";
import { FaPlus, FaTrash, FaSave, FaArrowRight, FaCamera } from "react-icons/fa";

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("registration");

  // Form State
  const [form, setForm] = useState({
    profilePhoto: null,
    name: "",
    email: "",
    username: "",
    portfolioLink: "",
    githubLink: "",
    linkedinLink: "",
    skillsProficientAt: [],
    skillsToLearn: [],
    education: [
      {
        id: uuidv4(),
        institution: "",
        degree: "",
        startDate: "",
        endDate: "",
        score: "",
        description: "",
      },
    ],
    bio: "",
    projects: [
      {
        id: uuidv4(),
        title: "",
        description: "",
        projectLink: "",
        techStack: [],
        startDate: "",
        endDate: ""
      }
    ],
  });

  // Helper states for selects
  const [skillProficientInput, setSkillProficientInput] = useState("");
  const [skillLearnInput, setSkillLearnInput] = useState("");
  const [projectTechInput, setProjectTechInput] = useState({}); // Map by project index

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        ...user,
        // Ensure arrays are initialized
        skillsProficientAt: user.skillsProficientAt || [],
        skillsToLearn: user.skillsToLearn || [],
        education: user.education?.length ? user.education : prev.education,
        projects: user.projects?.length ? user.projects : prev.projects,
      }));
    }
  }, [user]);

  // --- Handlers ---

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append("picture", file);

    try {
      toast.info("Uploading picture...");
      const response = await axios.post("/user/uploadPicture", data);
      toast.success("Picture uploaded successfully");
      setForm(prev => ({ ...prev, picture: response.data.data.url }));
      // Update global user context immediately if needed, or wait for save
      setUser(prev => ({ ...prev, picture: response.data.data.url }));
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Error uploading picture");
    }
  };

  // Skill Handlers
  const addSkill = (type, skill) => {
    if (!skill || skill === "Select skill") return;

    // Check duplicates
    if (form.skillsProficientAt.includes(skill) || form.skillsToLearn.includes(skill)) {
      toast.warning("Skill already selected in one of the lists");
      return;
    }

    if (type === "proficient") {
      setForm(prev => ({ ...prev, skillsProficientAt: [...prev.skillsProficientAt, skill] }));
      setSkillProficientInput("");
    } else {
      setForm(prev => ({ ...prev, skillsToLearn: [...prev.skillsToLearn, skill] }));
      setSkillLearnInput("");
    }
  };

  const removeSkill = (type, skill) => {
    if (type === "proficient") {
      setForm(prev => ({ ...prev, skillsProficientAt: prev.skillsProficientAt.filter(s => s !== skill && s.name !== skill) }));
    } else {
      setForm(prev => ({ ...prev, skillsToLearn: prev.skillsToLearn.filter(s => s !== skill && s.name !== skill) }));
    }
  };

  // Education Handlers
  const handleEducationChange = (index, field, value) => {
    const newEdu = [...form.education];
    newEdu[index][field] = value;
    setForm(prev => ({ ...prev, education: newEdu }));
  };

  const addEducation = () => {
    setForm(prev => ({
      ...prev,
      education: [...prev.education, { id: uuidv4(), institution: "", degree: "", startDate: "", endDate: "", score: "", description: "" }]
    }));
  };

  const removeEducation = (index) => {
    setForm(prev => ({ ...prev, education: prev.education.filter((_, i) => i !== index) }));
  };

  // Project Handlers
  const handleProjectChange = (index, field, value) => {
    const newProj = [...form.projects];
    newProj[index][field] = value;
    setForm(prev => ({ ...prev, projects: newProj }));
  };

  const addProject = () => {
    setForm(prev => ({
      ...prev,
      projects: [...prev.projects, { id: uuidv4(), title: "", description: "", projectLink: "", techStack: [], startDate: "", endDate: "" }]
    }));
  };

  const removeProject = (index) => {
    setForm(prev => ({ ...prev, projects: prev.projects.filter((_, i) => i !== index) }));
  };

  const addTechStack = (index, skill) => {
    if (!skill) return;
    const newProj = [...form.projects];
    if (!newProj[index].techStack.includes(skill)) {
      newProj[index].techStack.push(skill);
      setForm(prev => ({ ...prev, projects: newProj }));
    }
  };

  const removeTechStack = (pIndex, skill) => {
    const newProj = [...form.projects];
    newProj[pIndex].techStack = newProj[pIndex].techStack.filter(s => s !== skill);
    setForm(prev => ({ ...prev, projects: newProj }));
  };


  // Validation & Save
  const validateReg = () => {
    if (!form.username) return toast.error("Username is required");
    if (!form.skillsProficientAt.length) return toast.error("Add at least one proficient skill");
    // Relaxing link requirements slightly or keeping strict? Keeping strict as per original
    if (!form.portfolioLink && !form.githubLink && !form.linkedinLink) return toast.error("Add at least one social link");
    return true;
  };

  const saveDetails = async (endpoint, successMsg) => {
    setLoading(true);
    try {
      await axios.post(endpoint, form);
      toast.success(successMsg);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 font-sans">Edit Profile</h1>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-xl shadow-sm overflow-hidden">
          {["registration", "education", "additional"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-sm font-medium transition-colors capitalize ${activeTab === tab
                ? "bg-blue-600 text-white"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">

          {/* REGISTRATION TAB */}
          {activeTab === "registration" && (
            <div className="space-y-6">
              {/* Photo & Basic Info */}
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
                    <img src={form.picture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                    <FaCamera />
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
                <div className="flex-1 w-full space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input type="text" value={form.name} disabled className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                      <input type="text" name="username" value={form.username} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Username" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="text" value={form.email} disabled className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed" />
                  </div>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Social Links */}
              <div className="grid grid-cols-1 gap-4">
                {["linkedinLink", "githubLink", "portfolioLink"].map((linkField) => (
                  <div key={linkField}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{linkField.replace('Link', '')} URL</label>
                    <input
                      type="text"
                      name={linkField}
                      value={form[linkField]}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder={`https://${linkField.replace('Link', '').toLowerCase()}.com/...`}
                    />
                  </div>
                ))}
              </div>

              <hr className="border-gray-100" />

              {/* Skills */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Proficient */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">My Skills (Proficient)</label>
                  <div className="flex gap-2 mb-2">
                    <select
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none"
                      value={skillProficientInput}
                      onChange={(e) => setSkillProficientInput(e.target.value)}
                    >
                      <option>Select skill</option>
                      {availableSkills.map((s, i) => <option key={i} value={s}>{s}</option>)}
                    </select>
                    <button
                      onClick={() => addSkill('proficient', skillProficientInput)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <FaPlus />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.skillsProficientAt.map((skill, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 rounded text-sm border border-green-200">
                        {typeof skill === 'string' ? skill : skill.name}
                        <FaTrash className="ml-2 text-xs cursor-pointer hover:text-green-900" onClick={() => removeSkill('proficient', skill)} />
                      </span>
                    ))}
                  </div>
                </div>

                {/* To Learn */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Want to Learn</label>
                  <div className="flex gap-2 mb-2">
                    <select
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none"
                      value={skillLearnInput}
                      onChange={(e) => setSkillLearnInput(e.target.value)}
                    >
                      <option>Select skill</option>
                      {availableSkills.map((s, i) => <option key={i} value={s}>{s}</option>)}
                    </select>
                    <button
                      onClick={() => addSkill('learn', skillLearnInput)}
                      className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      <FaPlus />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.skillsToLearn.map((skill, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-1 bg-purple-50 text-purple-700 rounded text-sm border border-purple-200">
                        {typeof skill === 'string' ? skill : skill.name}
                        <FaTrash className="ml-2 text-xs cursor-pointer hover:text-purple-900" onClick={() => removeSkill('learn', skill)} />
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4">
                <button
                  onClick={() => { if (validateReg()) saveDetails("/user/registered/saveRegDetails", "Basic info saved!"); }}
                  className="px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 flex items-center gap-2"
                  disabled={loading}
                >
                  {loading ? "Saving..." : <><FaSave /> Save Changes</>}
                </button>
                <button
                  onClick={() => setActiveTab('education')}
                  className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  Next: Education <FaArrowRight />
                </button>
              </div>
            </div>
          )}

          {/* EDUCATION TAB */}
          {activeTab === "education" && (
            <div className="space-y-6">
              {form.education.map((edu, index) => (
                <div key={edu.id || index} className="p-4 border border-gray-200 rounded-xl bg-gray-50 relative group">
                  <button
                    onClick={() => removeEducation(index)}
                    className="absolute top-4 right-4 text-red-400 hover:text-red-600 p-1"
                    title="Remove"
                  >
                    <FaTrash />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Institution</label>
                      <input type="text" value={edu.institution} onChange={(e) => handleEducationChange(index, "institution", e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500" placeholder="University/School" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Degree</label>
                      <input type="text" value={edu.degree} onChange={(e) => handleEducationChange(index, "degree", e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500" placeholder="B.Tech, MBA..." />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Start Date</label>
                      <input type="date" value={edu.startDate ? new Date(edu.startDate).toISOString().split('T')[0] : ''} onChange={(e) => handleEducationChange(index, "startDate", e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">End Date</label>
                      <input type="date" value={edu.endDate ? new Date(edu.endDate).toISOString().split('T')[0] : ''} onChange={(e) => handleEducationChange(index, "endDate", e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Score / GPA</label>
                      <input type="number" value={edu.score} onChange={(e) => handleEducationChange(index, "score", e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="8.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Description</label>
                    <textarea value={edu.description} onChange={(e) => handleEducationChange(index, "description", e.target.value)} className="w-full px-3 py-2 border rounded-lg" rows="2" placeholder="Major projects, achievements..." />
                  </div>
                </div>
              ))}

              <button onClick={addEducation} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2">
                <FaPlus /> Add Education
              </button>

              <div className="flex justify-between items-center pt-4">
                <button onClick={() => setActiveTab('registration')} className="text-gray-500 font-medium hover:text-gray-900">Back</button>
                <div className="flex gap-3">
                  <button
                    onClick={() => saveDetails("/user/registered/saveEduDetail", "Education saved!")}
                    className="px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 flex items-center gap-2"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : <><FaSave /> Save Changes</>}
                  </button>
                  <button
                    onClick={() => setActiveTab('additional')}
                    className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    Next: Portfolio <FaArrowRight />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ADDITIONAL TAB */}
          {activeTab === "additional" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={handleInputChange}
                  name="bio"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows="4"
                  placeholder="Tell us about yourself..."
                />
                <p className="text-xs text-right text-gray-400 mt-1">{form.bio.length}/500</p>
              </div>

              <hr className="border-gray-100" />

              <h3 className="text-lg font-bold text-gray-900">Projects</h3>
              {form.projects.map((proj, index) => (
                <div key={proj.id || index} className="p-4 border border-gray-200 rounded-xl bg-gray-50 relative group">
                  <button
                    onClick={() => removeProject(index)}
                    className="absolute top-4 right-4 text-red-400 hover:text-red-600 p-1"
                    title="Remove"
                  >
                    <FaTrash />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Project Title</label>
                      <input type="text" value={proj.title} onChange={(e) => handleProjectChange(index, "title", e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Link</label>
                      <input type="text" value={proj.projectLink} onChange={(e) => handleProjectChange(index, "projectLink", e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500" placeholder="https://..." />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Description</label>
                    <textarea value={proj.description} onChange={(e) => handleProjectChange(index, "description", e.target.value)} className="w-full px-3 py-2 border rounded-lg" rows="2" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Start Date</label>
                      <input type="date" value={proj.startDate ? new Date(proj.startDate).toISOString().split('T')[0] : ''} onChange={(e) => handleProjectChange(index, "startDate", e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">End Date</label>
                      <input type="date" value={proj.endDate ? new Date(proj.endDate).toISOString().split('T')[0] : ''} onChange={(e) => handleProjectChange(index, "endDate", e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                  </div>

                  {/* Tech Stack */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tech Stack</label>
                    <div className="flex gap-2 mb-2">
                      <select
                        className="w-full md:w-1/2 px-3 py-2 border rounded-lg"
                        onChange={(e) => addTechStack(index, e.target.value)}
                        value=""
                      >
                        <option value="">Add Tech</option>
                        {availableSkills.map((s, i) => <option key={i} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {proj.techStack?.map((t, ti) => (
                        <span key={ti} className="inline-flex items-center px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                          {t} <FaTrash className="ml-1 cursor-pointer hover:text-red-600" onClick={() => removeTechStack(index, t)} />
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <button onClick={addProject} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2">
                <FaPlus /> Add Project
              </button>

              <div className="flex justify-between items-center pt-4">
                <button onClick={() => setActiveTab('education')} className="text-gray-500 font-medium hover:text-gray-900">Back</button>
                <button
                  onClick={() => saveDetails("/user/registered/saveAddDetail", "Bio & Projects saved!")}
                  className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  disabled={loading}
                >
                  {loading ? "Saving..." : <><FaSave /> Save All Changes</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default EditProfile;
