import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { useUser } from "../../util/UserContext";
import { skills as availableSkills } from "../Register/Skills";
import { FaPlus, FaTrash, FaSave, FaArrowLeft, FaArrowRight, FaCamera, FaLinkedin, FaGithub, FaLink } from "react-icons/fa";
import { storeSanitizedUserData } from "../../util/sanitizeUserData";

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Form State
  const [form, setForm] = useState({
    picture: "",
    name: "",
    email: "",
    username: "",
    bio: "",
    tutorialVideo: "",
    portfolioLink: "",
    githubLink: "",
    linkedinLink: "",
    skillsProficientAt: [],
    skillsToLearn: [],
    education: [],
    projects: [],
  });

  // Helper states for selects
  const [skillProficientInput, setSkillProficientInput] = useState("");
  const [skillLearnInput, setSkillLearnInput] = useState("");

  useEffect(() => {
    if (user) {
      setForm({
        picture: user.picture || "",
        name: user.name || "",
        email: user.email || "",
        username: user.username || "",
        bio: user.bio || "",
        tutorialVideo: user.tutorialVideo || "",
        portfolioLink: user.portfolioLink || "",
        githubLink: user.githubLink || "",
        linkedinLink: user.linkedinLink || "",
        skillsProficientAt: user.skillsProficientAt || [],
        skillsToLearn: user.skillsToLearn || [],
        education: user.education?.length ? user.education.map(e => ({ ...e, id: e.id || uuidv4() })) : [],
        projects: user.projects?.length ? user.projects.map(p => ({ ...p, id: p.id || uuidv4() })) : [],
      });
    }
  }, [user]);

  // --- Handlers ---

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleVideoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error("Video size should be less than 50MB");
      return;
    }

    const data = new FormData();
    data.append("video", file);

    try {
      setUploadingVideo(true);
      toast.info("Uploading video introduction...");
      const response = await axios.post("/user/uploadVideo", data);
      toast.success("Video uploaded successfully");
      setForm(prev => ({ ...prev, tutorialVideo: response.data.data.url }));
      setUser(prev => ({ ...prev, tutorialVideo: response.data.data.url }));
      storeSanitizedUserData({ ...user, tutorialVideo: response.data.data.url });
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Error uploading video");
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    const data = new FormData();
    data.append("picture", file);

    try {
      setUploadingPhoto(true);
      toast.info("Uploading picture...");
      const response = await axios.post("/user/uploadPicture", data);
      toast.success("Picture uploaded successfully");
      setForm(prev => ({ ...prev, picture: response.data.data.url }));
      setUser(prev => ({ ...prev, picture: response.data.data.url }));
      storeSanitizedUserData({ ...user, picture: response.data.data.url });
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Error uploading picture");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePicture = async () => {
    if (!form.picture) {
      toast.warning("No profile picture to remove");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to remove your profile picture?");
    if (!confirmed) return;

    try {
      setUploadingPhoto(true);
      toast.info("Removing picture...");
      await axios.delete("/user/removePicture");
      toast.success("Picture removed successfully");
      setForm(prev => ({ ...prev, picture: "" }));
      setUser(prev => ({ ...prev, picture: "" }));
      storeSanitizedUserData({ ...user, picture: "" });
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Error removing picture");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Skill Handlers
  const addSkill = (type, skill) => {
    if (!skill || skill === "Select skill") return;

    const skillName = typeof skill === 'string' ? skill : skill.name;

    // Check duplicates
    const existsInProficient = form.skillsProficientAt.some(s =>
      (typeof s === 'string' ? s : s.name) === skillName
    );
    const existsInLearn = form.skillsToLearn.some(s =>
      (typeof s === 'string' ? s : s.name) === skillName
    );

    if (existsInProficient || existsInLearn) {
      toast.warning("Skill already selected");
      return;
    }

    if (type === "proficient") {
      setForm(prev => ({ ...prev, skillsProficientAt: [...prev.skillsProficientAt, { name: skillName }] }));
      setSkillProficientInput("");
    } else {
      setForm(prev => ({ ...prev, skillsToLearn: [...prev.skillsToLearn, { name: skillName }] }));
      setSkillLearnInput("");
    }
  };

  const removeSkill = (type, skill) => {
    const skillName = typeof skill === 'string' ? skill : skill.name;
    if (type === "proficient") {
      setForm(prev => ({
        ...prev,
        skillsProficientAt: prev.skillsProficientAt.filter(s =>
          (typeof s === 'string' ? s : s.name) !== skillName
        )
      }));
    } else {
      setForm(prev => ({
        ...prev,
        skillsToLearn: prev.skillsToLearn.filter(s =>
          (typeof s === 'string' ? s : s.name) !== skillName
        )
      }));
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
      education: [...prev.education, {
        id: uuidv4(),
        institution: "",
        degree: "",
        startDate: "",
        endDate: "",
        score: "",
        description: ""
      }]
    }));
  };

  const removeEducation = (index) => {
    if (form.education.length === 1) {
      toast.warning("At least one education entry is recommended");
      return;
    }
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
      projects: [...prev.projects, {
        id: uuidv4(),
        title: "",
        description: "",
        projectLink: "",
        techStack: [],
        startDate: "",
        endDate: ""
      }]
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
  const validateBasic = () => {
    if (!form.username || form.username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return false;
    }
    if (!form.skillsProficientAt.length) {
      toast.error("Add at least one skill you're proficient at");
      return false;
    }
    if (!form.portfolioLink && !form.githubLink && !form.linkedinLink) {
      toast.error("Add at least one social link");
      return false;
    }
    return true;
  };

  const validateEducation = () => {
    if (!form.education.length) {
      toast.warning("Add at least one education entry");
      return false;
    }
    for (let edu of form.education) {
      if (!edu.institution || !edu.degree) {
        toast.error("Please fill in all required education fields");
        return false;
      }
    }
    return true;
  };

  const saveBasicInfo = async () => {
    if (!validateBasic()) return false;

    setLoading(true);
    try {
      const normalizedProficient = form.skillsProficientAt.map(s =>
        typeof s === 'string' ? { name: s } : { name: s.name }
      );
      const normalizedToLearn = form.skillsToLearn.map(s =>
        typeof s === 'string' ? { name: s } : { name: s.name }
      );

      const payload = {
        name: form.name,
        username: form.username,
        linkedinLink: form.linkedinLink,
        githubLink: form.githubLink,
        portfolioLink: form.portfolioLink,
        skillsProficientAt: normalizedProficient,
        skillsToLearn: normalizedToLearn,
        picture: form.picture,
      };

      await axios.post("/user/registered/saveRegDetails", payload);
      toast.success("Basic info saved successfully!");

      const { data: freshData } = await axios.get("/user/registered/getDetails");
      if (freshData.success) {
        setUser(freshData.data);
        storeSanitizedUserData(freshData.data);
        setForm(prev => ({ ...prev, ...freshData.data }));
      }
      setLoading(false);
      return true;
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to save basic info");
      setLoading(false);
      return false;
    }
  };

  const saveEducation = async () => {
    if (!validateEducation()) return false;

    setLoading(true);
    try {
      await axios.post("/user/registered/saveEduDetail", {
        education: form.education.map(({ id, ...rest }) => rest)
      });
      toast.success("Education saved successfully!");

      const { data: freshData } = await axios.get("/user/registered/getDetails");
      if (freshData.success) {
        setUser(freshData.data);
        storeSanitizedUserData(freshData.data);
        setForm(prev => ({ ...prev, education: freshData.data.education }));
      }
      setLoading(false);
      return true;
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to save education");
      setLoading(false);
      return false;
    }
  };

  const saveAdditional = async () => {
    if (form.bio.length > 500) {
      toast.error("Bio must be less than 500 characters");
      return false;
    }

    setLoading(true);
    try {
      await axios.post("/user/registered/saveAddDetail", {
        bio: form.bio,
        projects: form.projects.map(({ id, ...rest }) => rest),
        tutorialVideo: form.tutorialVideo
      });
      toast.success("Bio & Projects saved successfully!");

      const { data: freshData } = await axios.get("/user/registered/getDetails");
      if (freshData.success) {
        setUser(freshData.data);
        storeSanitizedUserData(freshData.data);
      }
      setLoading(false);
      return true;
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to save additional info");
      setLoading(false);
      return false;
    }
  };

  const saveAllChanges = async () => {
    if (!validateBasic()) {
      setActiveTab('basic');
      return;
    }
    if (!validateEducation()) {
      setActiveTab('education');
      return;
    }
    if (form.bio.length > 500) {
      setActiveTab('portfolio');
      toast.error("Bio must be less than 500 characters");
      return;
    }

    setLoading(true);
    try {
      const normalizedProficient = form.skillsProficientAt.map(s =>
        typeof s === 'string' ? { name: s } : { name: s.name }
      );
      const normalizedToLearn = form.skillsToLearn.map(s =>
        typeof s === 'string' ? { name: s } : { name: s.name }
      );

      await axios.post("/user/registered/saveRegDetails", {
        name: form.name,
        username: form.username,
        linkedinLink: form.linkedinLink,
        githubLink: form.githubLink,
        portfolioLink: form.portfolioLink,
        skillsProficientAt: normalizedProficient,
        skillsToLearn: normalizedToLearn,
        picture: form.picture,
      });

      await axios.post("/user/registered/saveEduDetail", {
        education: form.education.map(({ id, ...rest }) => rest)
      });

      await axios.post("/user/registered/saveAddDetail", {
        bio: form.bio,
        projects: form.projects.map(({ id, ...rest }) => rest),
        tutorialVideo: form.tutorialVideo
      });

      toast.success("Profile updated successfully!");

      const { data: freshData } = await axios.get("/user/registered/getDetails");
      if (freshData.success) {
        setUser(freshData.data);
        storeSanitizedUserData(freshData.data);
      }

      setTimeout(() => navigate("/profile"), 1000);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to save some changes. Please check each tab.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toISOString().split('T')[0];
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] py-10 font-['Montserrat'] px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between bg-white p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Edit Profile</h1>
            <p className="text-[10px] uppercase font-black tracking-widest text-gray-400">Update your information and showcase your skills</p>
          </div>
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#fafafa] text-gray-600 hover:text-[#013e38] hover:bg-white border border-transparent hover:border-gray-100 rounded-[1.2rem] shadow-sm hover:shadow-md transition-all text-[10px] uppercase tracking-widest font-black"
          >
            <FaArrowLeft /> Back to Profile
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 p-2 overflow-x-auto relative z-10">
          {[
            { id: "basic", label: "Basic Info", icon: "👤" },
            { id: "education", label: "Education", icon: "🎓" },
            { id: "portfolio", label: "Portfolio", icon: "💼" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[120px] py-4 px-6 text-[10px] uppercase tracking-widest font-black transition-all flex items-center justify-center gap-2 rounded-[1.5rem] ${activeTab === tab.id
                ? "bg-[#013e38] text-white shadow-lg shadow-[#013e38]/20"
                : "text-gray-500 hover:text-gray-900 hover:bg-[#fafafa]"
                }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 p-8 sm:p-10 mb-10">

          {/* BASIC INFO TAB */}
          {activeTab === "basic" && (
            <div className="space-y-8">
              {/* Profile Photo */}
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-100 shadow-lg">
                    <img
                      src={form.picture || "https://ui-avatars.com/api/?name=" + (form.name || "User") + "&background=random&size=200"}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Upload overlay */}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                    {uploadingPhoto ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    ) : (
                      <FaCamera size={24} />
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploadingPhoto} />
                  </label>
                  {/* Remove button - always visible */}
                  {form.picture && (
                    <button
                      onClick={handleRemovePicture}
                      disabled={uploadingPhoto}
                      className="absolute -bottom-2 -right-2 p-2.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 hover:scale-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed z-10"
                      title="Remove profile picture"
                    >
                      <FaTrash size={16} />
                    </button>
                  )}
                </div>
                <div className="mt-3 text-center">
                  <p className="text-sm text-gray-500">Click photo to upload new (Max 5MB)</p>
                  {form.picture && (
                    <button
                      onClick={handleRemovePicture}
                      disabled={uploadingPhoto}
                      className="mt-2 text-xs text-red-600 hover:text-red-700 underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* Basic Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Full Name</label>
                  <input
                    type="text"
                    value={form.name}
                    disabled
                    className="w-full px-5 py-4 bg-[#fafafa] border border-gray-100 rounded-[1.2rem] text-gray-400 font-bold cursor-not-allowed"
                  />
                  <p className="text-[9px] uppercase tracking-widest font-bold text-gray-400 mt-2">Name cannot be changed</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Email</label>
                  <input
                    type="text"
                    value={form.email}
                    disabled
                    className="w-full px-5 py-4 bg-[#fafafa] border border-gray-100 rounded-[1.2rem] text-gray-400 font-bold cursor-not-allowed"
                  />
                  <p className="text-[9px] uppercase tracking-widest font-bold text-gray-400 mt-2">Email cannot be changed</p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Username *</label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 bg-[#fafafa] border border-gray-100 rounded-[1.2rem] focus:bg-white focus:ring-2 focus:ring-[#3bb4a1] focus:border-transparent outline-none transition-all font-bold text-gray-900 shadow-sm"
                  placeholder="your-username"
                />
              </div>

              <hr className="border-gray-200" />

              {/* Social Links */}
              <div className="bg-[#fafafa] p-8 rounded-[2.5rem] border border-gray-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight">Social Links *</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Add at least one social link</p>
                <div className="space-y-5">
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">
                      <FaLinkedin className="text-[#0077b5] text-sm" /> LinkedIn
                    </label>
                    <input
                      type="url"
                      name="linkedinLink"
                      value={form.linkedinLink}
                      onChange={handleInputChange}
                      className="w-full px-5 py-4 bg-white border border-gray-100 rounded-[1.2rem] focus:ring-2 focus:ring-[#0077b5] focus:border-transparent outline-none transition-all shadow-sm font-medium text-gray-900"
                      placeholder="https://linkedin.com/in/your-profile"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">
                      <FaGithub className="text-gray-900 text-sm" /> GitHub
                    </label>
                    <input
                      type="url"
                      name="githubLink"
                      value={form.githubLink}
                      onChange={handleInputChange}
                      className="w-full px-5 py-4 bg-white border border-gray-100 rounded-[1.2rem] focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all shadow-sm font-medium text-gray-900"
                      placeholder="https://github.com/your-username"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">
                      <FaLink className="text-[#3bb4a1] text-sm" /> Portfolio
                    </label>
                    <input
                      type="url"
                      name="portfolioLink"
                      value={form.portfolioLink}
                      onChange={handleInputChange}
                      className="w-full px-5 py-4 bg-white border border-gray-100 rounded-[1.2rem] focus:ring-2 focus:ring-[#3bb4a1] focus:border-transparent outline-none transition-all shadow-sm font-medium text-gray-900"
                      placeholder="https://your-portfolio.com"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Skills */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Proficient Skills */}
                <div className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Skills I Can Teach *</label>
                  <div className="flex gap-3 mb-4">
                    <select
                      className="flex-1 px-5 py-3 bg-[#fafafa] border border-gray-100 rounded-[1.2rem] focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-gray-900 shadow-sm"
                      value={skillProficientInput}
                      onChange={(e) => setSkillProficientInput(e.target.value)}
                    >
                      <option>Select skill</option>
                      {availableSkills.map((s, i) => <option key={i} value={s}>{s}</option>)}
                    </select>
                    <button
                      onClick={() => addSkill('proficient', skillProficientInput)}
                      className="px-6 py-3 bg-blue-50 text-blue-700 rounded-[1.2rem] hover:bg-blue-100 transition-colors shadow-sm flex items-center justify-center font-black"
                    >
                      <FaPlus />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2.5 min-h-[60px] p-5 border border-gray-100 rounded-[1.5rem] bg-[#fafafa]">
                    {form.skillsProficientAt.length === 0 ? (
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">No skills added yet</p>
                    ) : (
                      form.skillsProficientAt.map((skill, idx) => (
                        <span key={idx} className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-[1rem] text-[10px] uppercase tracking-widest font-black shadow-sm transition-all hover:bg-blue-200 cursor-default">
                          {typeof skill === 'string' ? skill : skill.name}
                          <FaTrash className="ml-3 text-[10px] cursor-pointer text-blue-400 hover:text-red-500 transition-colors" onClick={() => removeSkill('proficient', skill)} />
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Skills to Learn */}
                <div className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Skills I Want to Learn</label>
                  <div className="flex gap-3 mb-4">
                    <select
                      className="flex-1 px-5 py-3 bg-[#fafafa] border border-gray-100 rounded-[1.2rem] focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none transition-all font-bold text-gray-900 shadow-sm"
                      value={skillLearnInput}
                      onChange={(e) => setSkillLearnInput(e.target.value)}
                    >
                      <option>Select skill</option>
                      {availableSkills.map((s, i) => <option key={i} value={s}>{s}</option>)}
                    </select>
                    <button
                      onClick={() => addSkill('learn', skillLearnInput)}
                      className="px-6 py-3 bg-purple-50 text-purple-700 rounded-[1.2rem] hover:bg-purple-100 transition-colors shadow-sm flex items-center justify-center font-black"
                    >
                      <FaPlus />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2.5 min-h-[60px] p-5 border border-gray-100 rounded-[1.5rem] bg-[#fafafa]">
                    {form.skillsToLearn.length === 0 ? (
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">No skills added yet</p>
                    ) : (
                      form.skillsToLearn.map((skill, idx) => (
                        <span key={idx} className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-[1rem] text-[10px] uppercase tracking-widest font-black shadow-sm transition-all hover:bg-purple-200 cursor-default">
                          {typeof skill === 'string' ? skill : skill.name}
                          <FaTrash className="ml-3 text-[10px] cursor-pointer text-purple-400 hover:text-red-500 transition-colors" onClick={() => removeSkill('learn', skill)} />
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end items-center pt-8 mt-4 border-t border-gray-100">
                <button
                  onClick={async () => {
                    const ok = await saveBasicInfo();
                    if (ok) setActiveTab('education');
                  }}
                  className="px-8 py-4 bg-[#013e38] text-white font-black text-[10px] uppercase tracking-widest rounded-[1.2rem] hover:bg-[#3bb4a1] transition-all shadow-lg hover:shadow-xl flex items-center gap-3"
                >
                  Next: Education <FaArrowRight className="text-sm" />
                </button>
              </div>
            </div>
          )}

          {/* EDUCATION TAB */}
          {activeTab === "education" && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Education History</h3>
                <button
                  onClick={addEducation}
                  className="px-6 py-3 bg-[#013e38] text-white rounded-[1.2rem] hover:bg-[#3bb4a1] transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl text-[10px] uppercase tracking-widest font-black"
                >
                  <FaPlus className="text-sm" /> Add Education
                </button>
              </div>

              {form.education.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-[2.5rem] bg-[#fafafa]">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic mb-6">No education entries yet</p>
                  <button
                    onClick={addEducation}
                    className="px-8 py-4 bg-[#013e38] text-white text-[10px] uppercase tracking-widest font-black rounded-[1.2rem] hover:bg-[#3bb4a1] transition-all shadow-lg mx-auto block"
                  >
                    Add Your First Education
                  </button>
                </div>
              ) : (
                form.education.map((edu, index) => (
                  <div key={edu.id || index} className="p-8 border border-gray-50 rounded-[2.5rem] bg-white relative shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg transition-all mb-6">
                    <button
                      onClick={() => removeEducation(index)}
                      className="absolute top-6 right-6 text-red-300 hover:text-white p-3 rounded-[1rem] bg-transparent hover:bg-red-500 transition-all shadow-sm"
                      title="Remove"
                    >
                      <FaTrash className="text-sm" />
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5 mt-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Institution *</label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => handleEducationChange(index, "institution", e.target.value)}
                          className="w-full px-5 py-4 bg-[#fafafa] border border-gray-100 rounded-[1.2rem] focus:bg-white focus:ring-2 focus:ring-[#3bb4a1] outline-none transition-all shadow-sm font-medium text-gray-900"
                          placeholder="University/School Name"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Degree *</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => handleEducationChange(index, "degree", e.target.value)}
                          className="w-full px-5 py-4 bg-[#fafafa] border border-gray-100 rounded-[1.2rem] focus:bg-white focus:ring-2 focus:ring-[#3bb4a1] outline-none transition-all shadow-sm font-medium text-gray-900"
                          placeholder="B.Tech, MBA, etc."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                      <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Start Date</label>
                        <input
                          type="date"
                          value={formatDate(edu.startDate)}
                          onChange={(e) => handleEducationChange(index, "startDate", e.target.value)}
                          className="w-full px-5 py-4 bg-[#fafafa] border border-gray-100 rounded-[1.2rem] focus:bg-white focus:ring-2 focus:ring-[#3bb4a1] outline-none transition-all shadow-sm font-medium text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">End Date</label>
                        <input
                          type="date"
                          value={formatDate(edu.endDate)}
                          onChange={(e) => handleEducationChange(index, "endDate", e.target.value)}
                          className="w-full px-5 py-4 bg-[#fafafa] border border-gray-100 rounded-[1.2rem] focus:bg-white focus:ring-2 focus:ring-[#3bb4a1] outline-none transition-all shadow-sm font-medium text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Score / GPA</label>
                        <input
                          type="number"
                          step="0.01"
                          value={edu.score}
                          onChange={(e) => handleEducationChange(index, "score", e.target.value)}
                          className="w-full px-5 py-4 bg-[#fafafa] border border-gray-100 rounded-[1.2rem] focus:bg-white focus:ring-2 focus:ring-[#3bb4a1] outline-none transition-all shadow-sm font-medium text-gray-900"
                          placeholder="8.5"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Description</label>
                      <textarea
                        value={edu.description}
                        onChange={(e) => handleEducationChange(index, "description", e.target.value)}
                        className="w-full px-5 py-4 bg-[#fafafa] border border-gray-100 rounded-[1.2rem] focus:bg-white focus:ring-2 focus:ring-[#3bb4a1] outline-none transition-all shadow-sm font-medium text-gray-900 resize-none"
                        rows="3"
                        placeholder="Major projects, achievements, coursework..."
                      />
                    </div>
                  </div>
                ))
              )}

              <div className="flex justify-between items-center pt-8 mt-4 border-t border-gray-100 gap-4">
                <button
                  onClick={() => setActiveTab('basic')}
                  className="px-6 py-4 bg-[#fafafa] text-gray-600 hover:text-[#013e38] hover:bg-white border border-transparent hover:border-gray-100 rounded-[1.2rem] shadow-sm hover:shadow-md transition-all text-[10px] uppercase tracking-widest font-black flex items-center gap-2"
                >
                  <FaArrowLeft className="text-sm" /> Back
                </button>

                <button
                  onClick={async () => {
                    const ok = await saveEducation();
                    if (ok) setActiveTab('portfolio');
                  }}
                  className="px-8 py-4 bg-[#013e38] text-white font-black text-[10px] uppercase tracking-widest rounded-[1.2rem] hover:bg-[#3bb4a1] transition-all shadow-lg hover:shadow-xl flex items-center gap-3"
                >
                  Next: Portfolio <FaArrowRight className="text-sm" />
                </button>
              </div>
            </div>
          )}

          {/* PORTFOLIO TAB */}
          {activeTab === "portfolio" && (
            <div className="space-y-10">
              {/* Bio */}
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={handleInputChange}
                  name="bio"
                  maxLength={500}
                  className="w-full px-5 py-4 bg-[#fafafa] border border-gray-100 rounded-[1.5rem] focus:bg-white focus:ring-2 focus:ring-[#3bb4a1] outline-none transition-all shadow-sm font-medium text-gray-900 resize-none"
                  rows="5"
                  placeholder="Tell us about yourself, your interests, and what you're passionate about..."
                />
                <div className="flex justify-between items-center mt-3 px-2">
                  <p className="text-[9px] uppercase tracking-widest font-black text-gray-400">Share your story</p>
                  <p className={`text-[9px] uppercase tracking-widest font-black ${form.bio.length > 450 ? 'text-red-500' : 'text-gray-400'}`}>
                    {form.bio.length}/500
                  </p>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Tutorial Video */}
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Video Introduction (Tutorial)</label>
                <div className="flex flex-col md:flex-row gap-8 items-start bg-white p-8 border border-gray-50 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <div className="flex-1 w-full">
                    <p className="text-sm font-medium text-gray-600 mb-6">Showcase your teaching style or introduce yourself with a short video.</p>
                    <div className="flex gap-4 items-center">
                      <label className={`px-6 py-4 rounded-[1.2rem] text-[10px] uppercase font-black tracking-widest cursor-pointer transition-all flex items-center gap-3 shadow-sm hover:shadow-md ${uploadingVideo ? 'bg-gray-100 text-gray-400' : 'bg-[#013e38] text-white hover:bg-[#3bb4a1]'}`}>
                        {uploadingVideo ? (
                          <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Uploading...</>
                        ) : (
                          <>📹 {form.tutorialVideo ? 'Change Video' : 'Upload Video'}</>
                        )}
                        <input type="file" accept="video/*" className="hidden" onChange={handleVideoChange} disabled={uploadingVideo} />
                      </label>
                      {form.tutorialVideo && (
                        <button
                          onClick={() => setForm(prev => ({ ...prev, tutorialVideo: "" }))}
                          className="text-[10px] uppercase font-black tracking-widest text-red-500 hover:text-red-700 transition-colors"
                        >
                          Remove Video
                        </button>
                      )}
                    </div>
                    <p className="text-[9px] uppercase font-black tracking-widest text-gray-400 mt-4">MP4, WebM recommended (Max 50MB)</p>
                  </div>

                  {form.tutorialVideo && (
                    <div className="w-full md:w-64 aspect-video bg-black rounded-[1.5rem] overflow-hidden shadow-lg border border-gray-100">
                      <video src={form.tutorialVideo} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Projects */}
              <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Projects</h3>
                  <button
                    onClick={addProject}
                    className="px-6 py-3 bg-[#013e38] text-white rounded-[1.2rem] hover:bg-[#3bb4a1] transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl text-[10px] uppercase tracking-widest font-black"
                  >
                    <FaPlus className="text-sm" /> Add Project
                  </button>
                </div>

                {form.projects.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-[2.5rem] bg-[#fafafa]">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic mb-6">No projects yet</p>
                    <button
                      onClick={addProject}
                      className="px-8 py-4 bg-[#013e38] text-white text-[10px] uppercase tracking-widest font-black rounded-[1.2rem] hover:bg-[#3bb4a1] transition-all shadow-lg mx-auto block"
                    >
                      Add Your First Project
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {form.projects.map((proj, index) => (
                      <div key={proj.id || index} className="p-8 border border-gray-50 rounded-[2.5rem] bg-white relative shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg transition-all mb-6">
                        <button
                          onClick={() => removeProject(index)}
                          className="absolute top-6 right-6 text-red-300 hover:text-white p-3 rounded-[1rem] bg-transparent hover:bg-red-500 transition-all shadow-sm"
                          title="Remove"
                        >
                          <FaTrash className="text-sm" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5 mt-4">
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Project Title</label>
                            <input
                              type="text"
                              value={proj.title}
                              onChange={(e) => handleProjectChange(index, "title", e.target.value)}
                              className="w-full px-5 py-4 bg-[#fafafa] border border-gray-100 rounded-[1.2rem] focus:bg-white focus:ring-2 focus:ring-[#3bb4a1] outline-none transition-all shadow-sm font-medium text-gray-900"
                              placeholder="My Awesome Project"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Project Link</label>
                            <input
                              type="url"
                              value={proj.projectLink}
                              onChange={(e) => handleProjectChange(index, "projectLink", e.target.value)}
                              className="w-full px-5 py-4 bg-[#fafafa] border border-gray-100 rounded-[1.2rem] focus:bg-white focus:ring-2 focus:ring-[#3bb4a1] outline-none transition-all shadow-sm font-medium text-gray-900"
                              placeholder="https://github.com/..."
                            />
                          </div>
                        </div>

                        <div className="mb-5">
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Description</label>
                          <textarea
                            value={proj.description}
                            onChange={(e) => handleProjectChange(index, "description", e.target.value)}
                            className="w-full px-5 py-4 bg-[#fafafa] border border-gray-100 rounded-[1.2rem] focus:bg-white focus:ring-2 focus:ring-[#3bb4a1] outline-none transition-all shadow-sm font-medium text-gray-900 resize-none"
                            rows="3"
                            placeholder="Describe what you built and the impact it had..."
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Start Date</label>
                            <input
                              type="date"
                              value={formatDate(proj.startDate)}
                              onChange={(e) => handleProjectChange(index, "startDate", e.target.value)}
                              className="w-full px-5 py-4 bg-[#fafafa] border border-gray-100 rounded-[1.2rem] focus:bg-white focus:ring-2 focus:ring-[#3bb4a1] outline-none transition-all shadow-sm font-medium text-gray-900"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">End Date</label>
                            <input
                              type="date"
                              value={formatDate(proj.endDate)}
                              onChange={(e) => handleProjectChange(index, "endDate", e.target.value)}
                              className="w-full px-5 py-4 bg-[#fafafa] border border-gray-100 rounded-[1.2rem] focus:bg-white focus:ring-2 focus:ring-[#3bb4a1] outline-none transition-all shadow-sm font-medium text-gray-900"
                            />
                          </div>
                        </div>

                        {/* Tech Stack */}
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Tech Stack</label>
                          <div className="flex gap-3 mb-4">
                            <select
                              className="flex-1 px-5 py-3 bg-[#fafafa] border border-gray-100 rounded-[1.2rem] focus:bg-white focus:ring-2 focus:ring-[#3bb4a1] outline-none transition-all font-bold text-gray-900 shadow-sm"
                              onChange={(e) => {
                                addTechStack(index, e.target.value);
                                e.target.value = "";
                              }}
                              defaultValue=""
                            >
                              <option value="">Add Technology</option>
                              {availableSkills.map((s, i) => <option key={i} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div className="flex flex-wrap gap-2.5 min-h-[60px] p-5 border border-gray-100 rounded-[1.5rem] bg-[#fafafa]">
                            {proj.techStack?.length === 0 || !proj.techStack ? (
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">No technologies added</p>
                            ) : (
                              proj.techStack.map((t, ti) => (
                                <span key={ti} className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-[1rem] text-[10px] uppercase tracking-widest font-black shadow-sm transition-all hover:bg-blue-200 cursor-default">
                                  {t}
                                  <FaTrash className="ml-3 text-[10px] cursor-pointer text-blue-400 hover:text-red-500 transition-colors" onClick={() => removeTechStack(index, t)} />
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-8 mt-4 border-t border-gray-100 gap-4">
                <button
                  onClick={() => setActiveTab('education')}
                  className="px-6 py-4 bg-[#fafafa] text-gray-600 hover:text-[#013e38] hover:bg-white border border-transparent hover:border-gray-100 rounded-[1.2rem] shadow-sm hover:shadow-md transition-all text-[10px] uppercase tracking-widest font-black flex items-center gap-2"
                >
                  <FaArrowLeft className="text-sm" /> Back
                </button>
                <button
                  onClick={saveAllChanges}
                  className="px-10 py-4 bg-[#013e38] text-white font-black text-[10px] uppercase tracking-widest rounded-[1.2rem] hover:bg-[#3bb4a1] transition-all shadow-lg hover:shadow-xl flex items-center gap-3 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? "Saving..." : <><FaSave className="text-lg" /> Save All & Finish</>}
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
