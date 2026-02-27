import React, { useState, useEffect } from "react";
import { useUserStore } from "../../store/useUserStore";
import { FaBookOpen, FaMapSigns, FaSpinner, FaHistory, FaCalendar } from "react-icons/fa";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const Resources = () => {
  const { onboardingData } = useUserStore();
  const [activeTab, setActiveTab] = useState("notes"); // notes, roadmaps, history

  // Form State
  const [selectedSkill, setSelectedSkill] = useState("");
  const [proficiency, setProficiency] = useState("");
  const [timeframe, setTimeframe] = useState("");

  // Result State
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [error, setError] = useState("");

  // History State
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [viewingHistoryItem, setViewingHistoryItem] = useState(null);


  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    } else {
      setViewingHistoryItem(null);
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    setError("");
    try {
      const response = await axios.get("/resources/saved");
      setHistoryData(response.data.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleGenerate = async () => {
    setError("");
    setGeneratedContent("");
    setViewingHistoryItem(null);

    if (!selectedSkill.trim()) {
      setError("Please enter a skill to learn.");
      return;
    }

    if (activeTab === "notes" && !proficiency) {
      setError("Please select a proficiency level.");
      return;
    }

    if (activeTab === "roadmaps" && !timeframe) {
      setError("Please select a timeframe.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = activeTab === "notes" ? "/resources/generate-note" : "/resources/generate-roadmap";

      const payload = activeTab === "notes"
        ? { skill: selectedSkill.trim(), proficiency }
        : { skill: selectedSkill.trim(), timeframe };

      const response = await axios.post(endpoint, payload);

      if (activeTab === "notes") {
        setGeneratedContent(response.data.note);
      } else {
        setGeneratedContent(response.data.roadmap);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to generate content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-6 pb-12 font-['Montserrat']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 font-['Oswald'] tracking-wide uppercase">
            AI <span className="text-[#3bb4a1]">Resources</span>
          </h1>
          <p className="mt-2 text-gray-600 max-w-2xl mx-auto text-lg">
            Generate custom learning materials and track your progress through saved history.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200">

          {/* Tabs */}
          <div className="flex justify-center mb-8 border-b border-gray-200">
            <button
              className={`flex items-center gap-2 px-6 py-3 font-semibold text-lg transition-colors border-b-2 ${activeTab === "notes" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              onClick={() => { setActiveTab("notes"); setGeneratedContent(""); setError(""); }}
            >
              <FaBookOpen /> Notes Builder
            </button>
            <button
              className={`flex items-center gap-2 px-6 py-3 font-semibold text-lg transition-colors border-b-2 ${activeTab === "roadmaps" ? "border-green-500 text-green-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              onClick={() => { setActiveTab("roadmaps"); setGeneratedContent(""); setError(""); }}
            >
              <FaMapSigns /> Roadmap Builder
            </button>
            <button
              className={`flex items-center gap-2 px-6 py-3 font-semibold text-lg transition-colors border-b-2 ${activeTab === "history" ? "border-purple-500 text-purple-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              onClick={() => { setActiveTab("history"); setGeneratedContent(""); setError(""); }}
            >
              <FaHistory /> Saved History
            </button>
          </div>

          {/* Builder Controls */}
          {activeTab !== "history" && (
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8 max-w-4xl mx-auto flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Enter a Skill or Topic</label>
                <input
                  type="text"
                  placeholder="e.g. Master React, Python Basics, Physics..."
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                />
              </div>

              {activeTab === "notes" ? (
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proficiency Level</label>
                  <select
                    value={proficiency}
                    onChange={(e) => setProficiency(e.target.value)}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                  >
                    <option value="">Select level...</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
              ) : (
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timeframe</label>
                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                  >
                    <option value="">Select timeframe...</option>
                    <option value="1 week">1 Week</option>
                    <option value="1 month">1 Month</option>
                    <option value="3 months">3 Months</option>
                    <option value="6 months">6 Months</option>
                    <option value="1 year">1 Year</option>
                  </select>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={loading}
                className={`w-full md:w-auto px-6 py-2.5 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 ${activeTab === "notes" ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"
                  } disabled:opacity-70 disabled:cursor-not-allowed`}
              >
                {loading && <FaSpinner className="animate-spin" />}
                {loading ? "Generating..." : "Generate AI Content"}
              </button>
            </div>
          )}

          {/* Feedback & Errors */}
          {error && (
            <div className="max-w-4xl mx-auto mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {/* Builder Results Area */}
          {activeTab !== "history" && (
            <div className="max-w-4xl mx-auto">
              {!generatedContent && !loading && !error && (
                <div className="text-center py-12 px-4 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${activeTab === "notes" ? "bg-blue-100 text-blue-500" : "bg-green-100 text-green-500"
                    }`}>
                    {activeTab === "notes" ? <FaBookOpen className="text-2xl" /> : <FaMapSigns className="text-2xl" />}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Ready to learn?</h3>
                  <p className="mt-1 text-gray-500">Enter a topic above and let AI generate the perfect {activeTab === "notes" ? "notes" : "roadmap"} for you.</p>
                </div>
              )}

              {generatedContent && (
                <div className="prose prose-blue max-w-none p-8 bg-gray-50 border border-gray-200 rounded-xl shadow-inner scroll-smooth overflow-x-hidden">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {generatedContent}
                  </ReactMarkdown>
                </div>
              )}

              {loading && !generatedContent && (
                <div className="text-center py-16">
                  <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
                  <p className="text-gray-600">Generating comprehensive {activeTab === "notes" ? "notes" : "roadmap"} directly into your history... This might take a few seconds.</p>
                </div>
              )}
            </div>
          )}

          {/* History Area */}
          {activeTab === "history" && (
            <div className="max-w-6xl mx-auto">
              {historyLoading ? (
                <div className="flex justify-center items-center py-20">
                  <FaSpinner className="animate-spin text-4xl text-purple-500" />
                </div>
              ) : viewingHistoryItem ? (
                <div>
                  <button
                    onClick={() => setViewingHistoryItem(null)}
                    className="mb-6 text-purple-600 hover:text-purple-800 font-medium flex items-center gap-2"
                  >
                    &larr; Back to History
                  </button>
                  <div className="flex items-center gap-3 mb-6">
                    <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${viewingHistoryItem.type === 'note' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                      {viewingHistoryItem.type}
                    </span>
                    <h2 className="text-2xl font-bold text-gray-900">{viewingHistoryItem.skill}</h2>
                    <span className="text-gray-500">({viewingHistoryItem.levelOrTimeframe})</span>
                  </div>
                  <div className="prose prose-purple max-w-none p-8 bg-gray-50 border border-gray-200 rounded-xl shadow-inner scroll-smooth overflow-x-hidden">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {viewingHistoryItem.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {historyData.length === 0 ? (
                    <div className="col-span-full text-center py-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                      <FaHistory className="text-4xl text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900">No history found</h3>
                      <p className="mt-1 text-gray-500">Your generated notes and roadmaps will appear here.</p>
                    </div>
                  ) : (
                    historyData.map((item) => (
                      <div
                        key={item._id}
                        onClick={() => setViewingHistoryItem(item)}
                        className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:border-purple-300 flex flex-col h-full"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-md ${item.type === 'note' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                            }`}>
                            {item.type}
                          </span>
                          <div className="flex items-center text-xs text-gray-400">
                            <FaCalendar className="mr-1" />
                            {new Date(item.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{item.skill}</h3>
                        <p className="text-sm text-gray-500 mb-4">{item.type === 'note' ? 'Level:' : 'Timeframe:'} {item.levelOrTimeframe}</p>
                        <div className="mt-auto pt-4 border-t border-gray-100">
                          <p className="text-sm text-purple-600 font-medium group-hover:text-purple-700 flex items-center gap-1">
                            View details &rarr;
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Resources;
