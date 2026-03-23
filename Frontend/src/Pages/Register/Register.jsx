import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { skills } from "./Skills";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { FaTimes, FaPlus, FaCheck } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const Spinner = () => (
    <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
);

const Register = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saveLoading, setSaveLoading] = useState(false);

    const [form, setForm] = useState({
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
        projects: [],
    });
    const [skillsProficientAt, setSkillsProficientAt] = useState("Select some skill");
    const [skillsToLearn, setSkillsToLearn] = useState("Select some skill");
    const [techStack, setTechStack] = useState([]);

    const [activeKey, setActiveKey] = useState("registration");

    useEffect(() => {
        setLoading(true);
        const getUser = async () => {
            try {
                const { data } = await axios.get("/user/unregistered/getDetails");
                const edu = data?.data?.education || [];
                edu.forEach((ele) => { ele.id = uuidv4(); });
                if (edu.length === 0) {
                    edu.push({
                        id: uuidv4(), institution: "", degree: "",
                        startDate: "", endDate: "", score: "", description: "",
                    });
                }
                const proj = data?.data?.projects || [];
                proj.forEach((ele) => { ele.id = uuidv4(); });
                if (proj && proj.length > 0) {
                    setTechStack(proj.map(() => "Select some Tech Stack"));
                }
                setForm((prevState) => ({
                    ...prevState,
                    name: data?.data?.name || "",
                    email: data?.data?.email || "",
                    username: data?.data?.username || "",
                    skillsProficientAt: data?.data?.skillsProficientAt || [],
                    skillsToLearn: data?.data?.skillsToLearn || [],
                    linkedinLink: data?.data?.linkedinLink || "",
                    githubLink: data?.data?.githubLink || "",
                    portfolioLink: data?.data?.portfolioLink || "",
                    education: edu,
                    bio: data?.data?.bio || "",
                    projects: proj,
                }));
            } catch (error) {
                console.log(error);
                if (error?.response?.data?.message) {
                    toast.error(error.response.data.message);
                    navigate("/login");
                } else {
                    toast.error("Some error occurred");
                }
            } finally {
                setLoading(false);
            }
        };
        getUser();
    }, [navigate]);

    const handleNext = () => {
        const tabs = ["registration", "education", "longer-tab", "Preview"];
        const currentIndex = tabs.indexOf(activeKey);
        if (currentIndex < tabs.length - 1) {
            setActiveKey(tabs[currentIndex + 1]);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === "checkbox") {
            setForm((prevState) => ({
                ...prevState,
                [name]: checked ? [...prevState[name], value] : prevState[name].filter((item) => item !== value),
            }));
        } else {
            if (name === "bio" && value.length > 500) {
                toast.error("Bio should be less than 500 characters");
                return;
            }
            setForm((prevState) => ({
                ...prevState,
                [name]: value,
            }));
        }
    };

    const handleAddSkill = (e) => {
        e.preventDefault();
        const { name } = e.target;
        if (name === "skill_to_learn") {
            if (skillsToLearn === "Select some skill" || !skillsToLearn) {
                toast.error("Select a skill to add"); return;
            }
            if (form.skillsToLearn.includes(skillsToLearn)) {
                toast.error("Skill already added"); return;
            }
            if (form.skillsProficientAt.includes(skillsToLearn)) {
                toast.error("Skill already added in skills proficient at"); return;
            }
            setForm((prevState) => ({
                ...prevState,
                skillsToLearn: [...prevState.skillsToLearn, skillsToLearn],
            }));
        } else {
            if (skillsProficientAt === "Select some skill" || !skillsProficientAt) {
                toast.error("Select a skill to add"); return;
            }
            if (form.skillsProficientAt.includes(skillsProficientAt)) {
                toast.error("Skill already added"); return;
            }
            if (form.skillsToLearn.includes(skillsProficientAt)) {
                toast.error("Skill already added in skills to learn"); return;
            }
            setForm((prevState) => ({
                ...prevState,
                skillsProficientAt: [...prevState.skillsProficientAt, skillsProficientAt],
            }));
        }
    };

    const handleRemoveSkill = (skillToRemove, temp) => {
        if (temp === "skills_proficient_at") {
            setForm((prevState) => ({
                ...prevState,
                skillsProficientAt: prevState.skillsProficientAt.filter((item) => item !== skillToRemove),
            }));
        } else {
            setForm((prevState) => ({
                ...prevState,
                skillsToLearn: prevState.skillsToLearn.filter((item) => item !== skillToRemove),
            }));
        }
    };

    const handleRemoveEducation = (e, tid) => {
        e.preventDefault();
        setForm((prevState) => ({
            ...prevState,
            education: prevState.education.filter((item) => item.id !== tid),
        }));
    };

    const handleEducationChange = (e, index) => {
        const { name, value } = e.target;
        setForm((prevState) => ({
            ...prevState,
            education: prevState.education.map((item, i) => (i === index ? { ...item, [name]: value } : item)),
        }));
    };

    const handleAdditionalChange = (e, index) => {
        const { name, value } = e.target;
        setForm((prevState) => ({
            ...prevState,
            projects: prevState.projects.map((item, i) => (i === index ? { ...item, [name]: value } : item)),
        }));
    };

    const validateRegForm = () => {
        if (!form.username) { toast.error("Username is empty"); return false; }
        if (!form.skillsProficientAt.length) { toast.error("Enter atleast one Skill you are proficient at"); return false; }
        if (!form.skillsToLearn.length) { toast.error("Enter atleast one Skill you want to learn"); return false; }
        if (!form.portfolioLink && !form.githubLink && !form.linkedinLink) {
            toast.error("Enter atleast one link among portfolio, github and linkedin"); return false;
        }
        const githubRegex = /^(?:http(?:s)?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+(?:\/)?$/;
        if (form.githubLink && githubRegex.test(form.githubLink) === false) { toast.error("Enter a valid github link"); return false; }
        const linkedinRegex = /^(?:http(?:s)?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+(?:\/)?$/;
        if (form.linkedinLink && linkedinRegex.test(form.linkedinLink) === false) { toast.error("Enter a valid linkedin link"); return false; }
        if (form.portfolioLink && form.portfolioLink.includes("http") === false) { toast.error("Enter a valid portfolio link"); return false; }
        return true;
    };

    const validateEduForm = () => {
        let flag = true;
        form.education.forEach((edu, index) => {
            if (!edu.institution) { toast.error(`Institution name is empty in education field ${index + 1}`); flag = false; }
            if (!edu.degree) { toast.error(`Degree is empty in education field ${index + 1}`); flag = false; }
            if (!edu.startDate) { toast.error(`Start date is empty in education field ${index + 1}`); flag = false; }
            if (!edu.endDate) { toast.error(`End date is empty in education field ${index + 1}`); flag = false; }
            if (!edu.score) { toast.error(`Score is empty in education field ${index + 1}`); flag = false; }
        });
        return flag;
    };

    const validateAddForm = () => {
        if (!form.bio) { toast.error("Bio is empty"); return false; }
        if (form.bio.length > 500) { toast.error("Bio should be less than 500 characters"); return false; }
        let flag = true;
        form.projects.forEach((project, index) => {
            if (!project.title) { toast.error(`Title is empty in project ${index + 1}`); flag = false; }
            if (!project.techStack.length) { toast.error(`Tech Stack is empty in project ${index + 1}`); flag = false; }
            if (!project.startDate) { toast.error(`Start Date is empty in project ${index + 1}`); flag = false; }
            if (!project.endDate) { toast.error(`End Date is empty in project ${index + 1}`); flag = false; }
            if (!project.projectLink) { toast.error(`Project Link is empty in project ${index + 1}`); flag = false; }
            if (!project.description) { toast.error(`Description is empty in project ${index + 1}`); flag = false; }
            if (project.startDate > project.endDate) { toast.error(`Start Date should be less than End Date in project ${index + 1}`); flag = false; }
            if (!project.projectLink.match(/^(http|https):\/\/[^ "]+$/)) {
                toast.error(`Please provide valid project link in project ${index + 1}`); flag = false;
            }
        });
        return flag;
    };

    const handleSaveRegistration = async (e) => {
        e.preventDefault();
        const check = validateRegForm();
        if (check) {
            setSaveLoading(true);
            try {
                await axios.post("/user/unregistered/saveRegDetails", form);
                toast.success("Details saved successfully");
            } catch (error) {
                toast.error(error?.response?.data?.message || "Some error occurred");
            } finally {
                setSaveLoading(false);
            }
        }
    };

    const handleSaveEducation = async (e) => {
        e.preventDefault();
        if (validateRegForm() && validateEduForm()) {
            setSaveLoading(true);
            try {
                await axios.post("/user/unregistered/saveEduDetail", form);
                toast.success("Details saved successfully");
            } catch (error) {
                toast.error(error?.response?.data?.message || "Some error occurred");
            } finally {
                setSaveLoading(false);
            }
        }
    };

    const handleSaveAdditional = async (e) => {
        e.preventDefault();
        if (validateRegForm() && validateEduForm() && validateAddForm()) {
            setSaveLoading(true);
            try {
                await axios.post("/user/unregistered/saveAddDetail", form);
                toast.success("Details saved successfully");
            } catch (error) {
                toast.error(error?.response?.data?.message || "Some error occurred");
            } finally {
                setSaveLoading(false);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validateRegForm() && validateEduForm() && validateAddForm()) {
            setSaveLoading(true);
            try {
                await axios.post("/user/registerUser", form);
                toast.success("Registration Successful");
                navigate("/onboarding/personal-info");
            } catch (error) {
                toast.error(error?.response?.data?.message || "Some error occurred");
            } finally {
                setSaveLoading(false);
            }
        }
    };

    const inputClasses = "block w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-slate-800 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all text-sm";
    const labelClasses = "block text-xs font-bold uppercase tracking-widest text-slate-600 mb-2";
    const btnSecondary = "px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest border border-dark-border text-slate-700 hover:text-slate-900 hover:bg-dark-hover transition-colors";
    const btnPrimary = "px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest bg-cyan-500 text-dark-bg transition-all hover:bg-cyan-400 shadow-lg shadow-cyan-500/20";
    const btnWarning = "px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border border-amber-500/30 transition-all flex justify-center items-center min-w-[120px]";

    const tabsList = [
        { key: "registration", label: "Registration" },
        { key: "education", label: "Education" },
        { key: "longer-tab", label: "Additional Info" },
        { key: "Preview", label: "Review" },
    ];

    if (loading) {
        return (
            <div className="min-h-[85vh] bg-dark-bg flex flex-col justify-center items-center font-sans">
                <Spinner />
                <p className="mt-4 text-cyan-600 font-black tracking-widest uppercase text-xs animate-pulse">Loading Profile...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-bg font-sans py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center selection:bg-cyan-500/30">
            <div className="w-full max-w-4xl animate-fade-in">
                <div className="text-center mb-10">
                    <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
                        Complete Profile
                    </h1>
                    <p className="mt-4 text-sm font-medium text-slate-600 max-w-xl mx-auto">
                        Please provide your detailed information to finalize your registration and access the ecosystem.
                    </p>
                </div>

                {/* Custom Tabs Navigation */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8 bg-dark-card p-2 rounded-2xl border border-dark-border shadow-sm">
                    {tabsList.map((tab) => {
                        const isActive = activeKey === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveKey(tab.key)}
                                className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isActive
                                    ? "bg-cyan-500 text-dark-bg shadow-lg shadow-cyan-500/20"
                                    : "text-slate-600 hover:text-cyan-600 hover:bg-dark-hover"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Form Container */}
                <div className="bg-dark-card border border-dark-border shadow-card rounded-[2rem] p-6 lg:p-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full" />

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeKey}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="relative z-10"
                        >
                            {/* TAB: Registration */}
                            {activeKey === "registration" && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className={labelClasses}>Name</label>
                                            <input type="text" className={`${inputClasses} opacity-50 cursor-not-allowed`} value={form.name} disabled />
                                        </div>
                                        <div>
                                            <label className={labelClasses}>Email</label>
                                            <input type="email" className={`${inputClasses} opacity-50 cursor-not-allowed`} value={form.email} disabled />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClasses}>Username</label>
                                        <input type="text" name="username" value={form.username} onChange={handleInputChange} className={inputClasses} placeholder="Enter your username" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className={labelClasses}>LinkedIn Link</label>
                                            <input type="text" name="linkedinLink" value={form.linkedinLink} onChange={handleInputChange} className={inputClasses} placeholder="https://linkedin.com/..." />
                                        </div>
                                        <div>
                                            <label className={labelClasses}>GitHub Link</label>
                                            <input type="text" name="githubLink" value={form.githubLink} onChange={handleInputChange} className={inputClasses} placeholder="https://github.com/..." />
                                        </div>
                                        <div>
                                            <label className={labelClasses}>Portfolio Link</label>
                                            <input type="text" name="portfolioLink" value={form.portfolioLink} onChange={handleInputChange} className={inputClasses} placeholder="https://yourwebsite.com" />
                                        </div>
                                    </div>

                                    <hr className="border-dark-border my-6" />

                                    {/* Skills Selection */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <label className={labelClasses}>Skills Proficient At</label>
                                            <div className="flex gap-2">
                                                <select value={skillsProficientAt} onChange={(e) => setSkillsProficientAt(e.target.value)} className={`${inputClasses} !py-3`}>
                                                    <option>Select some skill</option>
                                                    {skills.map((skill, index) => <option key={index} value={skill}>{skill}</option>)}
                                                </select>
                                                <button name="skill_proficient_at" onClick={handleAddSkill} className="bg-dark-bg border border-dark-border text-cyan-600 px-4 rounded-xl hover:bg-cyan-500/10 transition-colors flex items-center justify-center min-w-[48px]">
                                                    <FaPlus />
                                                </button>
                                            </div>
                                            {form.skillsProficientAt.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-4">
                                                    {form.skillsProficientAt.map((skill, index) => (
                                                        <span key={index} onClick={() => handleRemoveSkill(skill, "skills_proficient_at")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:bg-red-500/10 hover:text-red-600 transition-colors border border-cyan-500/20 hover:border-red-500/30">
                                                            {skill} <FaTimes size={10} />
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className={labelClasses}>Skills To Learn</label>
                                            <div className="flex gap-2">
                                                <select value={skillsToLearn} onChange={(e) => setSkillsToLearn(e.target.value)} className={`${inputClasses} !py-3`}>
                                                    <option>Select some skill</option>
                                                    {skills.map((skill, index) => <option key={index} value={skill}>{skill}</option>)}
                                                </select>
                                                <button name="skill_to_learn" onClick={handleAddSkill} className="bg-dark-bg border border-dark-border text-cyan-600 px-4 rounded-xl hover:bg-cyan-500/10 transition-colors flex items-center justify-center min-w-[48px]">
                                                    <FaPlus />
                                                </button>
                                            </div>
                                            {form.skillsToLearn.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-4">
                                                    {form.skillsToLearn.map((skill, index) => (
                                                        <span key={index} onClick={() => handleRemoveSkill(skill, "skills_to_learn")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:bg-red-500/10 hover:text-red-600 transition-colors border border-amber-500/20 hover:border-red-500/30">
                                                            {skill} <FaTimes size={10} />
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-6 border-t border-dark-border">
                                        <button onClick={handleSaveRegistration} disabled={saveLoading} className={btnWarning}>
                                            {saveLoading ? <Spinner /> : "Save Draft"}
                                        </button>
                                        <button onClick={handleNext} className={btnPrimary}>
                                            Continue
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* TAB: Education */}
                            {activeKey === "education" && (
                                <div className="space-y-6">
                                    {form.education.map((edu, index) => (
                                        <div key={edu.id} className="bg-dark-bg border border-dark-border rounded-2xl p-6 relative">
                                            {index > 0 && (
                                                <button onClick={(e) => handleRemoveEducation(e, edu.id)} className="absolute top-4 right-4 text-slate-600 hover:text-red-600 transition-colors p-2">
                                                    <FaTimes />
                                                </button>
                                            )}

                                            <h4 className="text-sm font-black text-cyan-600 uppercase tracking-widest mb-6 border-b border-dark-border pb-4">Education #{index + 1}</h4>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                                <div className="md:col-span-2">
                                                    <label className={labelClasses}>Institution Name</label>
                                                    <input type="text" name="institution" value={edu.institution} onChange={(e) => handleEducationChange(e, index)} className={inputClasses} placeholder="University / College" />
                                                </div>
                                                <div>
                                                    <label className={labelClasses}>Degree</label>
                                                    <input type="text" name="degree" value={edu.degree} onChange={(e) => handleEducationChange(e, index)} className={inputClasses} placeholder="B.S. Computer Science" />
                                                </div>
                                                <div>
                                                    <label className={labelClasses}>Grade / Percentage</label>
                                                    <input type="number" name="score" value={edu.score} onChange={(e) => handleEducationChange(e, index)} className={inputClasses} placeholder="CGPA or %" />
                                                </div>
                                                <div>
                                                    <label className={labelClasses}>Start Date</label>
                                                    <input type="date" name="startDate" value={edu.startDate ? new Date(edu.startDate).toISOString().split("T")[0] : ""} onChange={(e) => handleEducationChange(e, index)} className={inputClasses} />
                                                </div>
                                                <div>
                                                    <label className={labelClasses}>End Date</label>
                                                    <input type="date" name="endDate" value={edu.endDate ? new Date(edu.endDate).toISOString().split("T")[0] : ""} onChange={(e) => handleEducationChange(e, index)} className={inputClasses} />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className={labelClasses}>Description / Achievements</label>
                                                    <textarea name="description" value={edu.description} onChange={(e) => handleEducationChange(e, index)} className={inputClasses} rows={2} placeholder="Relevant coursework, clubs, etc." />
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="flex justify-center py-4">
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setForm(prev => ({ ...prev, education: [...prev.education, { id: uuidv4(), institution: "", degree: "", startDate: "", endDate: "", score: "", description: "" }] }));
                                            }}
                                            className="flex items-center gap-2 text-cyan-600 hover:text-cyan-500 text-xs font-black uppercase tracking-widest transition-colors py-2 px-4 rounded-xl border border-dashed border-cyan-500/30 hover:bg-cyan-500/10"
                                        >
                                            <FaPlus /> Add Another Education
                                        </button>
                                    </div>

                                    <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-6 border-t border-dark-border">
                                        <button onClick={handleSaveEducation} disabled={saveLoading} className={btnWarning}>
                                            {saveLoading ? <Spinner /> : "Save Draft"}
                                        </button>
                                        <button onClick={handleNext} className={btnPrimary}>
                                            Continue
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* TAB: Additional (Bio & Projects) */}
                            {activeKey === "longer-tab" && (
                                <div className="space-y-6">
                                    <div>
                                        <label className={labelClasses}>Professional Bio (Max 500 chars)</label>
                                        <textarea
                                            name="bio"
                                            value={form.bio}
                                            onChange={handleInputChange}
                                            className={inputClasses}
                                            rows={4}
                                            placeholder="Tell us about yourself, your goals, and what you bring to the community..."
                                        />
                                        <p className="text-right text-[10px] text-slate-600 mt-1">{form.bio.length}/500</p>
                                    </div>

                                    <div className="pt-4 border-t border-dark-border">
                                        <h3 className="text-lg font-black text-slate-900 mb-6">Projects Showcase</h3>

                                        {form.projects.map((project, index) => (
                                            <div key={project.id} className="bg-dark-bg border border-dark-border rounded-2xl p-6 relative mb-6">
                                                <button onClick={() => setForm(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== project.id) }))} className="absolute top-4 right-4 text-slate-600 hover:text-red-600 transition-colors p-2">
                                                    <FaTimes />
                                                </button>

                                                <h4 className="text-sm font-black text-purple-600 uppercase tracking-widest mb-6 border-b border-dark-border pb-4">Project #{index + 1}</h4>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="md:col-span-2">
                                                        <label className={labelClasses}>Project Title</label>
                                                        <input type="text" name="title" value={project.title} onChange={(e) => handleAdditionalChange(e, index)} className={inputClasses} placeholder="E-commerce Dashboard" />
                                                    </div>

                                                    <div className="md:col-span-2">
                                                        <label className={labelClasses}>Tech Stack Used</label>
                                                        <div className="flex gap-2">
                                                            <select
                                                                value={techStack[index] || "Select some Tech Stack"}
                                                                onChange={(e) => setTechStack(prev => prev.map((item, i) => i === index ? e.target.value : item))}
                                                                className={`${inputClasses} !py-3`}
                                                            >
                                                                <option>Select some Tech Stack</option>
                                                                {skills.map((skill, i) => <option key={i} value={skill}>{skill}</option>)}
                                                            </select>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    if (techStack[index] === "Select some Tech Stack" || !techStack[index]) { toast.error("Select tech stack"); return; }
                                                                    if (project.techStack.includes(techStack[index])) { toast.error("Already added"); return; }
                                                                    setForm(prev => ({ ...prev, projects: prev.projects.map((p, i) => i === index ? { ...p, techStack: [...p.techStack, techStack[index]] } : p) }));
                                                                }}
                                                                className="bg-dark-card border border-dark-border text-purple-600 px-4 rounded-xl hover:bg-purple-500/10 transition-colors flex items-center justify-center min-w-[48px]"
                                                            >
                                                                <FaPlus />
                                                            </button>
                                                        </div>
                                                        {project.techStack.length > 0 && (
                                                            <div className="flex flex-wrap gap-2 mt-4">
                                                                {project.techStack.map((skill, i) => (
                                                                    <span key={i} onClick={() => setForm(prev => ({ ...prev, projects: prev.projects.map((p, idx) => idx === index ? { ...p, techStack: p.techStack.filter(s => s !== skill) } : p) }))} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-600 text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:bg-red-500/10 hover:text-red-600 transition-colors border border-purple-500/20">
                                                                        {skill} <FaTimes size={10} />
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <label className={labelClasses}>Start Date</label>
                                                        <input type="date" name="startDate" value={project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : ""} onChange={(e) => handleAdditionalChange(e, index)} className={inputClasses} />
                                                    </div>
                                                    <div>
                                                        <label className={labelClasses}>End Date</label>
                                                        <input type="date" name="endDate" value={project.endDate ? new Date(project.endDate).toISOString().split("T")[0] : ""} onChange={(e) => handleAdditionalChange(e, index)} className={inputClasses} />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label className={labelClasses}>Project Link (Live or GitHub)</label>
                                                        <input type="url" name="projectLink" value={project.projectLink} onChange={(e) => handleAdditionalChange(e, index)} className={inputClasses} placeholder="https://..." />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label className={labelClasses}>Description</label>
                                                        <textarea name="description" value={project.description} onChange={(e) => handleAdditionalChange(e, index)} className={inputClasses} rows={3} placeholder="What did you build and why?" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="flex justify-center py-4">
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setTechStack(prev => [...prev, "Select some Tech Stack"]);
                                                    setForm(prev => ({
                                                        ...prev, projects: [...prev.projects, { id: uuidv4(), title: "", techStack: [], startDate: "", endDate: "", projectLink: "", description: "" }]
                                                    }));
                                                }}
                                                className="flex items-center gap-2 text-purple-600 hover:text-purple-500 text-xs font-black uppercase tracking-widest transition-colors py-2 px-4 rounded-xl border border-dashed border-purple-500/30 hover:bg-purple-500/10"
                                            >
                                                <FaPlus /> Add Project
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-6 border-t border-dark-border">
                                        <button onClick={handleSaveAdditional} disabled={saveLoading} className={btnWarning}>
                                            {saveLoading ? <Spinner /> : "Save Draft"}
                                        </button>
                                        <button onClick={handleNext} className={btnPrimary}>
                                            Review Details
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* TAB: Review */}
                            {activeKey === "Preview" && (
                                <div className="space-y-8">
                                    <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-6 text-center">
                                        <div className="w-12 h-12 bg-cyan-500 text-dark-bg rounded-full flex items-center justify-center mx-auto mb-4 text-xl shadow-lg shadow-cyan-500/20">
                                            <FaCheck />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 mb-2">Final Review</h3>
                                        <p className="text-slate-600 text-sm">Please verify your information before finalizing registration.</p>
                                    </div>

                                    <div className="space-y-4">
                                        {[
                                            { label: "Full Name", value: form.name },
                                            { label: "Email Address", value: form.email },
                                            { label: "Username", value: form.username },
                                            { label: "Portfolio", value: form.portfolioLink },
                                            { label: "GitHub", value: form.githubLink },
                                            { label: "LinkedIn", value: form.linkedinLink },
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-dark-border/50">
                                                <span className="text-xs font-bold uppercase tracking-widest text-slate-600 sm:w-1/3 mb-1 sm:mb-0">{item.label}</span>
                                                <span className="text-sm font-medium text-slate-800 sm:w-2/3 break-all">{item.value || <span className="text-slate-600 italic">Not provided</span>}</span>
                                            </div>
                                        ))}
                                        <div className="flex flex-col sm:flex-row py-3 border-b border-dark-border/50">
                                            <span className="text-xs font-bold uppercase tracking-widest text-slate-600 sm:w-1/3 mb-1 sm:mb-0">Proficient At</span>
                                            <div className="sm:w-2/3 flex flex-wrap gap-2">
                                                {form.skillsProficientAt.length > 0 ? form.skillsProficientAt.map(s => <span key={s} className="px-2 py-1 bg-dark-bg border border-dark-border rounded text-[10px] text-cyan-600 uppercase font-bold">{s}</span>) : <span className="text-slate-600 italic text-sm">None selected</span>}
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row py-3 border-b border-dark-border/50">
                                            <span className="text-xs font-bold uppercase tracking-widest text-slate-600 sm:w-1/3 mb-1 sm:mb-0">Learning Goals</span>
                                            <div className="sm:w-2/3 flex flex-wrap gap-2">
                                                {form.skillsToLearn.length > 0 ? form.skillsToLearn.map(s => <span key={s} className="px-2 py-1 bg-dark-bg border border-dark-border rounded text-[10px] text-amber-600 uppercase font-bold">{s}</span>) : <span className="text-slate-600 italic text-sm">None selected</span>}
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row py-3 border-b border-dark-border/50">
                                            <span className="text-xs font-bold uppercase tracking-widest text-slate-600 sm:w-1/3 mb-1 sm:mb-0">Bio Overview</span>
                                            <span className="text-sm font-medium text-slate-800 sm:w-2/3 leading-relaxed">{form.bio || <span className="text-slate-600 italic">Not provided</span>}</span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row py-3">
                                            <span className="text-xs font-bold uppercase tracking-widest text-slate-600 sm:w-1/3 mb-1 sm:mb-0">Records</span>
                                            <span className="text-sm font-medium text-slate-800 sm:w-2/3">
                                                {form.education.filter(e => e.institution).length} Education, {form.projects.filter(p => p.title).length} Projects added.
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex justify-center pt-8 border-t border-dark-border">
                                        <button
                                            onClick={handleSubmit}
                                            disabled={saveLoading}
                                            className="w-full sm:w-auto px-12 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] bg-cyan-500 text-dark-bg transition-all hover:bg-cyan-400 hover:-translate-y-1 shadow-xl shadow-cyan-500/20 disabled:opacity-70 flex justify-center items-center"
                                        >
                                            {saveLoading ? <Spinner /> : "Finalize Registration"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default Register;
