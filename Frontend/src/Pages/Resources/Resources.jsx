import React, { useState, useEffect, useRef } from "react";
import { FaMapSigns, FaSpinner, FaHistory, FaCalendar, FaTimes, FaDownload, FaCheckCircle, FaArrowLeft, FaArrowRight, FaTrophy, FaLock, FaPlay, FaExclamationTriangle } from "react-icons/fa";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import html2pdf from "html2pdf.js";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../../util/UserContext";

const Resources = () => {
  const { user, setUser } = useUser();
  const [activeTab, setActiveTab] = useState("roadmap"); // roadmap, history

  // Form State
  const [selectedSkill, setSelectedSkill] = useState("");
  const [timeframe, setTimeframe] = useState("");

  // Result State
  const [loading, setLoading] = useState(false);
  const [activeResource, setActiveResource] = useState(null); // Holds the full DB document: {_id, skill, timeframe, roadmapData, testData}
  const [error, setError] = useState("");

  // History State
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState([]);

  // Modal / Note Viewer State
  const [modalOpen, setModalOpen] = useState(false);
  const [noteLoading, setNoteLoading] = useState(false);
  const [activeTopicIndex, setActiveTopicIndex] = useState(null);
  const [activeSubtopicIndex, setActiveSubtopicIndex] = useState(null);
  const printRef = useRef();

  // Test / Quiz State
  const [testInstructionsOpen, setTestInstructionsOpen] = useState(false);
  const [testActiveOpen, setTestActiveOpen] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testTimeLeft, setTestTimeLeft] = useState(null);
  const [testAnswers, setTestAnswers] = useState({ mcqs: {}, coding: {} });
  const [testResultsOpen, setTestResultsOpen] = useState(false);
  const testTimerRef = useRef(null);

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    } else {
      // Only clear active resource if we are switching back to the builder but haven't built anything yet
      // Actually, let's keep it so they don't lose their roadmap if they just peek at history
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    setError("");
    try {
      const response = await axios.get("/resources/saved", { withCredentials: true });
      setHistoryData(response.data.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    setError("");
    setActiveResource(null);

    if (!selectedSkill.trim()) {
      setError("Please enter a skill to learn.");
      return;
    }
    if (!timeframe) {
      setError("Please select a timeframe.");
      return;
    }

    setLoading(true);

    try {
      const payload = { skill: selectedSkill.trim(), timeframe };
      const response = await axios.post("/resources/generate-roadmap", payload, { withCredentials: true });
      setActiveResource(response.data.data);

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to generate roadmap. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryItem = (item) => {
    setActiveResource(item);
    setActiveTab("roadmap");
  };

  // -------------------------
  // Modal & Note Logic
  // -------------------------

  const openSubtopicModal = async (tIndex, sIndex) => {
    setActiveTopicIndex(tIndex);
    setActiveSubtopicIndex(sIndex);
    setModalOpen(true);

    const subtopic = activeResource.roadmapData[tIndex].subtopics[sIndex];

    // If note already exists, don't refetch
    if (subtopic.note && subtopic.note.trim() !== "") {
      return;
    }

    setNoteLoading(true);
    try {
      const payload = {
        resourceId: activeResource._id,
        topicIndex: tIndex,
        subtopicIndex: sIndex,
        mainSkill: activeResource.skill,
        subtopicTitle: subtopic.title
      };
      const response = await axios.post("/resources/generate-subtopic-note", payload, { withCredentials: true });

      // Update local state with new roadmapData
      setActiveResource(prev => ({
        ...prev,
        roadmapData: response.data.roadmapData
      }));
    } catch (err) {
      console.error("Failed to fetch note:", err);
      setError("Failed to load detailed note. Please try again.");
    } finally {
      setNoteLoading(false);
    }
  };

  const handleNextNote = () => {
    const currentTopic = activeResource.roadmapData[activeTopicIndex];
    if (activeSubtopicIndex < currentTopic.subtopics.length - 1) {
      openSubtopicModal(activeTopicIndex, activeSubtopicIndex + 1);
    } else if (activeTopicIndex < activeResource.roadmapData.length - 1) {
      openSubtopicModal(activeTopicIndex + 1, 0);
    }
  };

  const handlePrevNote = () => {
    if (activeSubtopicIndex > 0) {
      openSubtopicModal(activeTopicIndex, activeSubtopicIndex - 1);
    } else if (activeTopicIndex > 0) {
      const prevTopic = activeResource.roadmapData[activeTopicIndex - 1];
      openSubtopicModal(activeTopicIndex - 1, prevTopic.subtopics.length - 1);
    }
  };

  const toggleSubtopicCompletion = async (tIndex, sIndex, e) => {
    // Prevent modal opening if clicking directly on the checkbox from outside
    if (e) e.stopPropagation();

    const currentStatus = activeResource.roadmapData[tIndex].subtopics[sIndex].completed;
    const newStatus = !currentStatus;

    // Optimistic UI update
    const updatedData = [...activeResource.roadmapData];
    updatedData[tIndex].subtopics[sIndex].completed = newStatus;
    setActiveResource(prev => ({ ...prev, roadmapData: updatedData }));

    try {
      await axios.put("/resources/update-progress", {
        resourceId: activeResource._id,
        topicIndex: tIndex,
        subtopicIndex: sIndex,
        completed: newStatus
      }, { withCredentials: true });
    } catch (err) {
      console.error("Failed to update progress:", err);
      // Revert on failure
      updatedData[tIndex].subtopics[sIndex].completed = currentStatus;
      setActiveResource(prev => ({ ...prev, roadmapData: updatedData }));
    }
  };

  const handleDownloadPdf = () => {
    const element = printRef.current;
    const subtopicTitle = activeResource.roadmapData[activeTopicIndex].subtopics[activeSubtopicIndex].title;
    const opt = {
      margin: 0.5,
      filename: `${activeResource.skill} - ${subtopicTitle}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  // Helpers to determine if prev/next exist
  const hasNext = activeResource && activeTopicIndex !== null &&
    (activeSubtopicIndex < activeResource.roadmapData[activeTopicIndex].subtopics.length - 1 ||
      activeTopicIndex < activeResource.roadmapData.length - 1);
  const hasPrev = activeResource && activeTopicIndex !== null &&
    (activeSubtopicIndex > 0 || activeTopicIndex > 0);


  // -------------------------
  // Test / Quiz Logic
  // -------------------------

  const calculateProgress = () => {
    if (!activeResource || !activeResource.roadmapData) return 0;
    let total = 0;
    let completed = 0;
    activeResource.roadmapData.forEach(t => {
      t.subtopics.forEach(st => {
        total++;
        if (st.completed) completed++;
      });
    });
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  };

  const currentProgress = calculateProgress();
  const isTestUnlocked = currentProgress === 100;

  const handleStartTest = async () => {
    setTestInstructionsOpen(false);
    setTestLoading(true);
    setError("");

    try {
      // 1. Generate Test on Backend (this locks the record and returns questions)
      const response = await axios.post("/resources/generate-final-test", { resourceId: activeResource._id }, { withCredentials: true });

      // Update local activeResource testData to reflect generation
      setActiveResource(prev => ({
        ...prev,
        testData: { ...prev.testData, status: "in_progress", questions: response.data.test }
      }));

      // 2. Setup initial state for taking test
      setTestAnswers({ mcqs: {}, coding: {} });
      setTestTimeLeft(30 * 60); // 30 minutes in seconds

      // 3. Start Timer
      if (testTimerRef.current) clearInterval(testTimerRef.current);
      testTimerRef.current = setInterval(() => {
        setTestTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(testTimerRef.current);
            handleSubmitTest(true); // auto submit if time runs out
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setTestActiveOpen(true);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to start test. Please try again.");
    } finally {
      setTestLoading(false);
    }
  };

  const handleMcqSelect = (qId, optionIndex) => {
    setTestAnswers(prev => ({ ...prev, mcqs: { ...prev.mcqs, [qId]: optionIndex } }));
  };

  const handleCodingType = (qId, code) => {
    setTestAnswers(prev => ({ ...prev, coding: { ...prev.coding, [qId]: code } }));
  };

  const handleSubmitTest = async (autoSubmitted = false) => {
    if (!autoSubmitted) {
      const confirmSubmit = window.confirm("Are you sure you want to submit? You cannot return to the test.");
      if (!confirmSubmit) return;
    }

    if (testTimerRef.current) clearInterval(testTimerRef.current);
    setTestLoading(true);
    setTestActiveOpen(false);

    try {
      const response = await axios.post("/resources/submit-final-test", {
        resourceId: activeResource._id,
        answers: testAnswers
      }, { withCredentials: true });

      // Update local state with score and analytics
      setActiveResource(prev => ({
        ...prev,
        testData: {
          ...prev.testData,
          status: "completed",
          score: response.data.score,
          analytics: response.data.analytics
        }
      }));

      // Update local user credits with earned refund
      if (user && response.data.refundedCredits) {
        setUser({ ...user, credits: user.credits + response.data.refundedCredits });
      }

      setTestResultsOpen(true);
    } catch (err) {
      console.error("Failed to submit:", err);
      setError("Failed to submit test. Your results might not be saved.");
    } finally {
      setTestLoading(false);
    }
  };

  // Convert seconds to MM:SS
  const formatTime = (seconds) => {
    if (seconds === null) return "--:--";
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };


  return (
    <div className="min-h-screen bg-[#fafafa] pt-10 pb-24 font-['Montserrat']">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-8">
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-block bg-[#3bb4a1]/10 text-[#3bb4a1] px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.25em] mb-4"
          >
            Custom Learning Paths
          </motion.div>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 leading-[1.1] tracking-tight">
            Generate Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3bb4a1] to-[#013e38]">Roadmap</span>
          </h1>
          <p className="mt-4 text-gray-400 max-w-2xl mx-auto text-sm font-medium leading-relaxed">
            Generate an interactive visual roadmap. Click any node to dive deep into detailed notes.
          </p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 z-10 relative">

          {/* Tabs */}
          <div className="flex justify-center mb-8 border-b border-gray-200">
            <button
              className={`flex items-center gap-2 px-6 py-3 font-semibold text-lg transition-colors border-b-2 ${activeTab === "roadmap" ? "border-[#3bb4a1] text-[#3bb4a1]" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              onClick={() => setActiveTab("roadmap")}
            >
              <FaMapSigns /> Roadmap Builder
            </button>
            <button
              className={`flex items-center gap-2 px-6 py-3 font-semibold text-lg transition-colors border-b-2 ${activeTab === "history" ? "border-purple-500 text-purple-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              onClick={() => setActiveTab("history")}
            >
              <FaHistory /> Saved History
            </button>
          </div>

          {/* Roadmap Builder Form */}
          {activeTab === "roadmap" && !activeResource && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-[#fafafa] p-8 rounded-[2rem] border border-gray-100 mb-8 flex flex-col md:flex-row gap-6 items-end shadow-inner">
                <div className="flex-1 w-full relative">
                  <label className="block text-[10px] font-black tracking-widest text-gray-400 uppercase mb-2 pl-4">Skill or Path</label>
                  <input
                    type="text"
                    placeholder="e.g. Python, AI..."
                    value={selectedSkill}
                    onChange={(e) => setSelectedSkill(e.target.value)}
                    className="block w-full px-5 py-4 border-none rounded-[1.5rem] bg-white text-gray-900 focus:ring-4 focus:ring-[#3bb4a1]/10 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.03)] placeholder:text-gray-300 text-sm font-semibold"
                    disabled={loading}
                  />
                </div>

                <div className="flex-1 w-full relative">
                  <label className="block text-[10px] font-black tracking-widest text-gray-400 uppercase mb-2 pl-4">Timeframe</label>
                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    className="block w-full px-5 py-4 border-none rounded-[1.5rem] bg-white text-gray-900 focus:ring-4 focus:ring-[#3bb4a1]/10 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.03)] text-sm font-semibold appearance-none"
                    disabled={loading}
                  >
                    <option value="">Select timeframe...</option>
                    <option value="1 week">1 Week</option>
                    <option value="1 month">1 Month</option>
                    <option value="3 months">3 Months</option>
                    <option value="6 months">6 Months</option>
                    <option value="1 year">1 Year</option>
                  </select>
                </div>

                <button
                  onClick={handleGenerateRoadmap}
                  disabled={loading}
                  className="w-full md:w-auto px-8 py-4 bg-[#013e38] text-white text-[10px] font-black uppercase tracking-[0.25em] rounded-[1.5rem] hover:bg-[#3bb4a1] hover:shadow-[#3bb4a1]/30 transition-all shadow-xl shadow-[#013e38]/20 disabled:opacity-50 flex flex-col items-center justify-center gap-1 min-w-[200px]"
                >
                  <div className="flex items-center gap-2">
                    {loading && <FaSpinner className="animate-spin" />}
                    <span>{loading ? "Building..." : "Build Roadmap"}</span>
                  </div>
                </button>
              </div>

              {/* Errors */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                  {error}
                </div>
              )}

              {/* Empty State */}
              {!loading && !error && (
                <div className="text-center py-20 px-4 border-2 border-dashed border-gray-200 rounded-[2.5rem] bg-[#fafafa]">
                  <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-6 bg-[#3bb4a1]/10 text-[#3bb4a1]">
                    <FaMapSigns className="text-4xl" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Ready to chart your path?</h3>
                  <p className="max-w-md mx-auto text-gray-500 font-medium">Enter a topic above and let us architect a step-by-step visual learning journey complete with comprehensive notes.</p>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="text-center py-20">
                  <FaSpinner className="animate-spin text-5xl text-[#3bb4a1] mx-auto mb-6" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Architecting your roadmap...</h3>
                  <p className="text-gray-500">Analyzing the best learning path for {selectedSkill || "your topic"}.</p>
                </div>
              )}
            </div>
          )}

          {/* Visual Roadmap Display */}
          {activeTab === "roadmap" && activeResource && (
            <div className="max-w-5xl mx-auto">
              {/* Header and Pie Chart area */}
              <div className="flex flex-col md:flex-row justify-between items-center mb-10 pb-6 border-b border-gray-100">
                <div className="flex-1">
                  <button onClick={() => setActiveResource(null)} className="text-sm text-gray-500 hover:text-gray-800 font-medium mb-3 flex items-center gap-2 uppercase tracking-wide">
                    &larr; Build New Roadmap
                  </button>
                  <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{activeResource.skill}</h2>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#3bb4a1]/10 text-[#2c9886]">
                    Target: {activeResource.timeframe}
                  </span>
                </div>

                {/* Recharts Pie Chart for Progress */}
                <div className="w-32 h-32 md:w-40 md:h-40 mt-6 md:mt-0 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Completed', value: currentProgress },
                          { name: 'Remaining', value: 100 - currentProgress }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={45}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        stroke="none"
                      >
                        <Cell key="cell-0" fill="#3bb4a1" />
                        <Cell key="cell-1" fill="#f3f4f6" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-xl font-bold text-gray-800">{currentProgress}%</span>
                  </div>
                </div>
              </div>

              {/* The Flowchart */}
              <div className="relative pl-4 md:pl-8">
                {/* Vertical track line */}
                <div className="absolute left-[39px] md:left-[55px] top-6 bottom-6 w-1 bg-gray-200 rounded-full z-0"></div>

                {activeResource.roadmapData && activeResource.roadmapData.map((topic, tIndex) => (
                  <div key={tIndex} className="relative z-10 mb-12">
                    {/* Main Topic Node */}
                    <div className="flex items-center gap-6 mb-6">
                      <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-[#013e38] to-[#3bb4a1] rounded-[1.2rem] flex items-center justify-center text-white font-black text-xl shadow-[0_10px_20px_rgba(59,180,161,0.3)] border-2 border-white z-10">
                        {tIndex + 1}
                      </div>
                      <h3 className="text-2xl font-black text-gray-900 border-b-2 border-gray-100 pb-2 flex-grow tracking-tight">{topic.title}</h3>
                    </div>

                    {/* Subtopics */}
                    <div className="pl-14 md:pl-[4.5rem] flex flex-col gap-4">
                      {topic.subtopics.map((subtopic, sIndex) => (
                        <div
                          key={sIndex}
                          onClick={() => openSubtopicModal(tIndex, sIndex)}
                          className={`group relative flex items-center p-5 rounded-[1.5rem] border-2 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(59,180,161,0.08)]
                                            ${subtopic.completed ? 'bg-green-50/50 border-green-200' : 'bg-white border-gray-50 hover:border-[#3bb4a1]/50 shadow-[0_8px_20px_rgb(0,0,0,0.03)]'}`}
                        >
                          {/* Checkbox */}
                          <div
                            className="mr-5 flex-shrink-0"
                            onClick={(e) => toggleSubtopicCompletion(tIndex, sIndex, e)}
                          >
                            {subtopic.completed ? (
                              <FaCheckCircle className="text-3xl text-green-500 hover:text-green-600 transition-colors" />
                            ) : (
                              <div className="w-7 h-7 rounded-full border-2 border-gray-300 group-hover:border-[#3bb4a1] transition-colors flex items-center justify-center bg-white cursor-pointer"></div>
                            )}
                          </div>

                          <div className="flex-grow">
                            <h4 className={`text-lg font-semibold transition-colors ${subtopic.completed ? 'text-gray-500 line-through' : 'text-gray-800 group-hover:text-[#3bb4a1]'}`}>
                              {subtopic.title}
                            </h4>
                          </div>

                          {/* Indicator if note is cached */}
                          <div className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-500 hidden sm:block">
                            {subtopic.note ? "Read Notes" : "Generate Note"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Final Mock Test Node */}
                <div className="relative z-10 mt-16 pt-8 border-t-2 border-dashed border-gray-300">
                  <div className="flex items-center justify-center mb-6">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-4 border-white z-10 text-2xl text-white ${isTestUnlocked ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gray-300'}`}>
                      {isTestUnlocked ? <FaTrophy /> : <FaLock />}
                    </div>
                  </div>

                  <div className="text-center">
                    <h3 className={`text-2xl font-bold mb-2 ${isTestUnlocked ? 'text-gray-900' : 'text-gray-400'}`}>Final AI Assessment</h3>
                    <p className={`mb-6 max-w-lg mx-auto ${isTestUnlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                      Test your knowledge on {activeResource.skill} with a personalized AI-generated quiz.
                      {activeResource?.testData?.status === "completed" ? " You have already completed this test." : " This test is locked until you complete 100% of the roadmap."}
                    </p>

                    {activeResource?.testData?.status === "completed" ? (
                      <button
                        onClick={() => setTestResultsOpen(true)}
                        className="px-8 py-3 bg-purple-600 text-white font-bold rounded-lg shadow-md hover:bg-purple-700 transition flex items-center justify-center gap-2 mx-auto"
                      >
                        <FaCheckCircle /> View Results ({activeResource.testData.score}%)
                      </button>
                    ) : (
                      <button
                        onClick={() => setTestInstructionsOpen(true)}
                        disabled={!isTestUnlocked}
                        className={`px-8 py-4 text-[10px] uppercase font-black tracking-[0.25em] rounded-[1.2rem] transition-all flex items-center justify-center gap-2 mx-auto
                              ${isTestUnlocked ? 'bg-[#013e38] text-white hover:bg-[#3bb4a1] shadow-xl shadow-[#013e38]/20 hover:shadow-[#3bb4a1]/30' : 'bg-white border border-gray-100 text-gray-400 cursor-not-allowed shadow-none'}`}
                      >
                        <FaPlay /> Start Mock Test
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}


          {/* History Area */}
          {activeTab === "history" && (
            <div className="max-w-6xl mx-auto">
              {historyLoading ? (
                <div className="flex justify-center items-center py-20">
                  <FaSpinner className="animate-spin text-4xl text-purple-500" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {historyData.length === 0 ? (
                    <div className="col-span-full text-center py-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                      <FaHistory className="text-4xl text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900">No roadmaps found</h3>
                      <p className="mt-1 text-gray-500">Your generated paths will appear here.</p>
                    </div>
                  ) : (
                    historyData.map((item) => {
                      // Quick calc for progress
                      let total = 0;
                      let completed = 0;
                      if (item.roadmapData && Array.isArray(item.roadmapData)) {
                        item.roadmapData.forEach(t => {
                          t.subtopics.forEach(st => {
                            total++;
                            if (st.completed) completed++;
                          });
                        });
                      }
                      const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

                      return (
                        <div
                          key={item._id}
                          onClick={() => loadHistoryItem(item)}
                          className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(59,180,161,0.12)] transition-all duration-500 cursor-pointer flex flex-col h-full relative overflow-hidden group"
                        >
                          <div className="absolute top-0 right-0 w-32 h-32 bg-[#3bb4a1]/5 rounded-bl-[6rem] -mr-6 -mt-6 transition-all duration-700 group-hover:bg-[#3bb4a1]/10 group-hover:scale-110" />
                          <div className="flex justify-between items-start mb-6 z-10 relative">
                            <span className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-gray-100 text-gray-600`}>
                              {item.skill}
                            </span>
                            {item.testData?.status === "completed" && (
                              <span className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-yellow-100 text-yellow-700">
                                <FaTrophy /> {item.testData.score}% Score
                              </span>
                            )}
                          </div>
                          <h3 className="text-2xl font-black text-gray-800 mb-2 z-10 relative group-hover:text-[#3bb4a1] transition-colors line-clamp-2">{item.skill} Roadmap</h3>
                          <p className="text-sm font-medium text-gray-500 mb-6 z-10 relative flex items-center gap-2">
                            <FaCalendar className="text-gray-400" /> Target: {item.timeframe}
                          </p>

                          {/* Progress Bar */}
                          <div className="mt-auto z-10 relative pt-4 border-t border-gray-100">
                            <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                              <span>PROGRESS</span>
                              <span className={percent === 100 ? "text-green-500" : "text-[#3bb4a1]"}>{percent}%</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full transition-all duration-500 ${percent === 100 ? 'bg-green-500' : 'bg-[#3bb4a1]'}`} style={{ width: `${percent}%` }}></div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* MODAL / PDF VIEWER */}
      {modalOpen && activeResource && activeTopicIndex !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 font-['Montserrat']">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setModalOpen(false)}></div>

          {/* Modal Built */}
          <div className="relative bg-white w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.2)] border border-gray-50 flex flex-col overflow-hidden animate-fade-in">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 sm:p-8 border-b border-gray-100 bg-[#fafafa]">
              <div className="flex-1 pr-6">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{activeResource.roadmapData[activeTopicIndex].title}</p>
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-tight">
                  {activeResource.roadmapData[activeTopicIndex].subtopics[activeSubtopicIndex].title}
                </h2>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadPdf}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <FaDownload /> Download Note
                </button>
                <button
                  onClick={(e) => toggleSubtopicCompletion(activeTopicIndex, activeSubtopicIndex, e)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-colors border-2
                                ${activeResource.roadmapData[activeTopicIndex].subtopics[activeSubtopicIndex].completed
                      ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}
                >
                  <FaCheckCircle className={activeResource.roadmapData[activeTopicIndex].subtopics[activeSubtopicIndex].completed ? "text-green-500" : "text-gray-400"} />
                  {activeResource.roadmapData[activeTopicIndex].subtopics[activeSubtopicIndex].completed ? "Completed" : "Mark Default"}
                </button>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors ml-2"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
            </div>

            {/* Modal Content / Note Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 scroll-smooth">
              {noteLoading ? (
                <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                  <FaSpinner className="animate-spin text-5xl text-[#3bb4a1] mb-6" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Generating Comprehensive Note...</h3>
                  <p className="text-gray-500 max-w-md">Our AI tutor is writing a detailed, custom note for {activeResource.roadmapData[activeTopicIndex].subtopics[activeSubtopicIndex].title}. This will be permanently saved to your roadmap.</p>
                </div>
              ) : (
                <div ref={printRef} className="prose prose-lg prose-blue max-w-none">
                  {/* Hidden Header for PDF Print Only */}
                  <div className="hidden print:block mb-8 border-b pb-4">
                    <h1 className="text-3xl font-black">{activeResource.skill} Roadmap</h1>
                    <h2 className="text-2xl text-gray-600">{activeResource.roadmapData[activeTopicIndex].title}: {activeResource.roadmapData[activeTopicIndex].subtopics[activeSubtopicIndex].title}</h2>
                  </div>

                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {activeResource.roadmapData[activeTopicIndex].subtopics[activeSubtopicIndex].note}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            {/* Modal Footer (Navigation) */}
            <div className="border-t border-gray-100 p-6 sm:p-8 bg-[#fafafa] flex items-center justify-between">
              <button
                onClick={handlePrevNote}
                disabled={!hasPrev || noteLoading}
                className="flex items-center gap-2 px-6 py-4 rounded-[1.2rem] text-[10px] uppercase font-black tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed text-gray-500 bg-white border border-gray-100 hover:bg-gray-50 hover:text-gray-900"
              >
                <FaArrowLeft /> Previous
              </button>

              <button
                onClick={handleNextNote}
                disabled={!hasNext || noteLoading}
                className="flex items-center gap-2 px-8 py-4 bg-[#013e38] text-white text-[10px] uppercase font-black tracking-[0.25em] rounded-[1.2rem] hover:bg-[#3bb4a1] hover:shadow-[#3bb4a1]/30 transition-all shadow-xl shadow-[#013e38]/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Step <FaArrowRight />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: Test Instructions */}
      {testInstructionsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 font-['Montserrat']">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setTestInstructionsOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.2)] border border-gray-50 p-8 sm:p-12 scroll-smooth animate-fade-in text-center">
            <div className="w-20 h-20 rounded-full bg-yellow-100/50 text-yellow-500 flex items-center justify-center mx-auto mb-6 shadow-inner">
              <FaExclamationTriangle className="text-3xl" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-6 tracking-tight">Are you ready?</h2>
            <div className="text-left bg-[#fafafa] p-8 rounded-[1.5rem] border border-gray-100 mb-10 space-y-4 text-gray-600 font-medium tracking-wide leading-relaxed">
              <p><strong className="text-gray-900 font-black">1. One Attempt Only:</strong> Once you click start, you cannot retake this test. Leaving the page will submit your current progress.</p>
              <p><strong className="text-gray-900 font-black">2. Timed Environment:</strong> You will have exactly 30 minutes to complete the test. It will auto-submit when the timer reaches 00:00.</p>
              <p><strong className="text-gray-900 font-black">3. Comprehensive:</strong> Expect 10 Multiple Choice Questions (and 2 Coding Questions if the topic is technical).</p>
              <p className="text-[10px] uppercase font-black tracking-widest text-red-500 pt-2">* Please ensure you have a stable internet connection before beginning.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setTestInstructionsOpen(false)}
                className="px-8 py-4 rounded-[1.2rem] text-[10px] uppercase font-black tracking-widest text-gray-500 hover:text-[#013e38] transition-all bg-[#fafafa] hover:bg-white border border-transparent hover:border-gray-200 shadow-sm hover:shadow-md"
              >
                Cancel
              </button>
              <button
                onClick={handleStartTest}
                disabled={testLoading}
                className="px-10 py-4 bg-[#013e38] text-white text-[10px] uppercase font-black tracking-[0.25em] rounded-[1.2rem] hover:bg-[#3bb4a1] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {testLoading ? <FaSpinner className="animate-spin" /> : <FaPlay />} I understand, Start Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Active Test Taking */}
      {testActiveOpen && activeResource?.testData?.questions && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#fafafa] font-['Montserrat'] animate-fade-in">
          {/* Header */}
          <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-100 p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center z-10 shadow-sm gap-4">
            <div>
              <h2 className="text-2xl font-black text-[#013e38] tracking-tight">{activeResource.skill} Final Assessment</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mt-1">Do not refresh or leave this page.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className={`text-xl font-mono font-black px-6 py-3 rounded-[1.2rem] shadow-inner ${testTimeLeft < 300 ? 'bg-red-50 text-red-600 animate-pulse border border-red-100' : 'bg-[#fafafa] border border-gray-100 text-gray-600'}`}>
                {formatTime(testTimeLeft)}
              </div>
              <button
                onClick={() => handleSubmitTest(false)}
                disabled={testLoading}
                className="w-full sm:w-auto px-8 py-4 bg-[#3bb4a1] text-white text-[10px] uppercase font-black tracking-widest rounded-[1.2rem] hover:bg-[#013e38] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {testLoading ? <FaSpinner className="animate-spin" /> : "Submit Test"}
              </button>
            </div>
          </div>

          {/* Quiz Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-10 scroll-smooth">
            <div className="max-w-4xl mx-auto space-y-12 pb-20">

              {/* MCQs */}
              {activeResource.testData.questions.mcqs && activeResource.testData.questions.mcqs.length > 0 && (
                <div className="space-y-8">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-100 pb-3">Multiple Choice Questions</h3>
                  {activeResource.testData.questions.mcqs.map((q, idx) => (
                    <div key={q.id} className="bg-white p-8 rounded-[2rem] border border-gray-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                      <h4 className="text-lg font-black text-gray-900 mb-6 leading-relaxed">{idx + 1}. {q.question}</h4>
                      <div className="space-y-4">
                        {q.options.map((opt, optIdx) => (
                          <label
                            key={optIdx}
                            className={`flex items-center gap-4 p-5 rounded-[1.5rem] cursor-pointer transition-all duration-200 border-2
                                         ${testAnswers.mcqs[q.id] === optIdx ? 'bg-[#3bb4a1]/5 border-[#3bb4a1] shadow-md' : 'bg-[#fafafa] border-transparent hover:border-gray-200 hover:bg-white'}`}
                          >
                            <input
                              type="radio"
                              name={`mcq-${q.id}`}
                              value={optIdx}
                              onChange={() => handleMcqSelect(q.id, optIdx)}
                              checked={testAnswers.mcqs[q.id] === optIdx}
                              className="w-5 h-5 text-[#3bb4a1] focus:ring-[#3bb4a1] border-gray-300"
                            />
                            <span className={`font-semibold ${testAnswers.mcqs[q.id] === optIdx ? 'text-[#013e38]' : 'text-gray-600'}`}>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Coding Questions */}
              {activeResource.testData.questions.coding && activeResource.testData.questions.coding.length > 0 && (
                <div className="space-y-8 pt-8">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-100 pb-3">Practical / Coding</h3>
                  {activeResource.testData.questions.coding.map((q, idx) => (
                    <div key={q.id} className="bg-white p-8 rounded-[2rem] border border-gray-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                      <h4 className="text-lg font-black text-gray-900 mb-6 leading-relaxed">C{idx + 1}. {q.question}</h4>
                      <textarea
                        className="w-full h-56 p-6 font-mono text-sm bg-gray-900 text-[#3bb4a1] rounded-[1.5rem] focus:ring-4 focus:ring-[#3bb4a1]/20 focus:border-[#3bb4a1] outline-none shadow-inner resize-y transition-all"
                        placeholder="// Write your ultimate solution here..."
                        value={testAnswers.coding[q.id] || ""}
                        onChange={(e) => handleCodingType(q.id, e.target.value)}
                        spellCheck="false"
                      ></textarea>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* MODAL: Test Results */}
      {testResultsOpen && activeResource?.testData?.status === "completed" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 font-['Montserrat']">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setTestResultsOpen(false)}></div>
          <div className="relative bg-white w-full max-w-3xl rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.2)] overflow-hidden animate-fade-in flex flex-col max-h-[90vh] border border-gray-50">
            {/* Header / Score Section */}
            <div className="p-6 md:p-8 text-center bg-gradient-to-br from-[#013e38] to-[#3bb4a1] text-white relative shrink-0">
              <button
                onClick={() => setTestResultsOpen(false)}
                className="absolute top-4 right-4 md:top-6 md:right-6 w-8 h-8 md:w-10 md:h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors text-white"
              >
                <FaTimes className="text-lg md:text-xl" />
              </button>

              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 rounded-full flex items-center justify-center shadow-inner shrink-0">
                  <FaTrophy className="text-3xl md:text-4xl text-yellow-300" />
                </div>

                <div className="text-center md:text-left flex-1">
                  <h2 className="text-2xl md:text-3xl font-black mb-1 tracking-tight">Test Completed</h2>
                  <p className="text-teal-100 font-bold text-xs md:text-sm tracking-wide">Score based on MCQs and AI-evaluated logic.</p>
                </div>

                <div className="mt-2 md:mt-0 flex-shrink-0 bg-white/10 px-6 py-3 rounded-2xl shadow-inner border border-white/20">
                  <span className="text-5xl md:text-6xl font-black tracking-tighter drop-shadow-md">{activeResource.testData.score}%</span>
                </div>
              </div>
            </div>

            {/* Scrolling Feedback Section */}
            <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-[#fafafa]">
              <h3 className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-100 pb-2 mb-6">AI Feedback & Analytics</h3>
              <div className="prose prose-sm md:prose-base lg:prose-lg prose-[#013e38] max-w-none prose-headings:font-black prose-p:font-medium prose-strong:font-black text-gray-700">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {activeResource.testData.analytics}
                </ReactMarkdown>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-white shrink-0">
              <button
                onClick={() => setTestResultsOpen(false)}
                className="w-full md:w-auto md:px-12 py-4 bg-[#013e38] text-white text-[10px] uppercase font-black tracking-widest rounded-[1.2rem] hover:bg-[#3bb4a1] hover:shadow-xl transition-all shadow-md mx-auto block"
              >
                Close & Return to Roadmap
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Resources;
