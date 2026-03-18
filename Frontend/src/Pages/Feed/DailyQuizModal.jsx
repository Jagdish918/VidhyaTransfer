import React, { useState, useEffect } from "react";
import { FaFire, FaTimes, FaQuestionCircle, FaStar, FaSpinner, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";
import { useUser } from "../../util/UserContext";

const DailyQuizModal = ({ isOpen, onClose }) => {
    const { user, setUser } = useUser();
    const [loading, setLoading] = useState(true);
    const [quizData, setQuizData] = useState(null);
    const [status, setStatus] = useState("loading"); // loading, active, completed, error
    const [streak, setStreak] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [resultData, setResultData] = useState(null); // { isCorrect: boolean, correctAnswer: number, explanation: string }

    useEffect(() => {
        if (isOpen) {
            fetchDailyQuiz();
        } else {
            // Reset state when closed
            setSubmitting(false);
            setResultData(null);
            setSelectedOption(null);
        }
    }, [isOpen]);

    const fetchDailyQuiz = async () => {
        setLoading(true);
        setStatus("loading");
        try {
            const response = await axios.get("http://localhost:8000/quiz/daily", { withCredentials: true });
            setStatus(response.data.status); // 'active' or 'completed'
            setStreak(response.data.streak);
            if (response.data.status === "active") {
                setQuizData(response.data.question);
            }
        } catch (error) {
            console.error("Error fetching daily quiz:", error);
            setStatus("error");
            toast.error("Failed to load daily quiz.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (selectedOption === null) return;
        setSubmitting(true);
        try {
            const response = await axios.post("http://localhost:8000/quiz/daily", { answerIndex: selectedOption }, { withCredentials: true });
            setResultData(response.data);
            setStreak(response.data.streak);
            
            // Update user context streak visually if we want
            if (user) {
                setUser({
                    ...user,
                    dailyQuiz: {
                        ...user.dailyQuiz,
                        streak: response.data.streak
                    }
                });
            }

            if (response.data.isCorrect) {
                toast.success("Correct! Your streak is alive! 🔥");
            } else {
                toast.error(`Incorrect. Streak lost! 🧊`);
            }
        } catch (error) {
            console.error("Error submitting daily quiz:", error);
            toast.error(error.response?.data?.message || "Failed to submit answer.");
            setSubmitting(false); // Let them try again if it was a network error
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-['Montserrat']">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="relative bg-white w-full max-w-lg max-h-[90vh] rounded-[2.5rem] shadow-[0_20px_50px_rgba(59,180,161,0.12)] animate-fade-in flex flex-col overflow-hidden border border-gray-50">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-orange-400 to-red-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-tr from-[#3bb4a1] to-[#2c9886] rounded-full blur-3xl opacity-20 pointer-events-none"></div>

                <div className="flex-shrink-0 flex justify-between items-start p-6 sm:p-8 pb-4 relative z-10 border-b border-gray-100">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 leading-[1.1] tracking-tight flex items-center gap-2">
                            Daily Quiz <FaQuestionCircle className="text-[#3bb4a1] text-2xl" />
                        </h2>
                        <p className="text-sm font-semibold text-gray-500 mt-1">
                            Answer daily to maintain your streak!
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-red-100 hover:text-red-500 text-gray-500 rounded-full transition-colors relative z-20">
                            <FaTimes />
                        </button>
                        {!loading && status !== "error" && (
                            <div className="flex items-center gap-1.5 px-4 py-1.5 bg-[#3bb4a1]/10 text-[#3bb4a1] rounded-full text-[10px] uppercase font-black tracking-[0.2em] shadow-sm">
                                <FaFire className={streak > 0 ? "animate-pulse" : ""} /> {streak} Day Streak
                            </div>
                        )}
                    </div>
                </div>

                {/* Content (Scrollable) */}
                <div className="relative z-10 flex-1 overflow-y-auto p-6 sm:p-8 pt-4 scroll-smooth">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <FaSpinner className="animate-spin text-4xl text-[#3bb4a1] mb-4" />
                            <p className="text-gray-500 font-medium">Summoning today's challenge...</p>
                        </div>
                    ) : status === "error" ? (
                        <div className="text-center py-8">
                            <p className="text-red-500 font-medium mb-4">Something went wrong fetching your quiz.</p>
                            <button onClick={fetchDailyQuiz} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors">
                                Try Again
                            </button>
                        </div>
                    ) : status === "completed" || resultData ? (
                        /* Completed State */
                        <div className="text-center py-6 px-4">
                            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 bg-gradient-to-br from-orange-400 to-red-500 shadow-xl border-4 border-white transform hover:scale-105 transition-transform">
                                <FaFire className="text-5xl text-white" />
                            </div>
                            
                            {resultData ? (
                                // Show immediate result feedback
                                <div className="mb-6 text-left w-full">
                                    <div className="flex items-center justify-center gap-3 mb-6">
                                        <h3 className={`text-3xl font-black ${resultData.isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                                            {resultData.isCorrect ? "Brilliant!" : "Ouch!"}
                                        </h3>
                                    </div>
                                    
                                    <div className="bg-[#fafafa] p-5 rounded-[1.5rem] border border-gray-100 mb-6">
                                        <p className="text-gray-900 font-bold mb-4">{quizData?.question}</p>
                                        
                                        <div className="space-y-2">
                                            {quizData?.options.map((opt, idx) => {
                                                const isUserChoice = selectedOption === idx;
                                                const isCorrectChoice = resultData.correctAnswer === idx;
                                                
                                                let stateClass = "bg-white border-gray-200 text-gray-500";
                                                let icon = null;
                                                
                                                if (isCorrectChoice) {
                                                    stateClass = "bg-green-50 border-green-400 text-green-800 font-semibold";
                                                    icon = <FaCheckCircle className="text-green-500 text-lg" />;
                                                } else if (isUserChoice && !isCorrectChoice) {
                                                    stateClass = "bg-red-50 border-red-300 text-red-700";
                                                    icon = <FaTimesCircle className="text-red-500 text-lg" />;
                                                }

                                                return (
                                                    <div key={idx} className={`flex justify-between items-center px-5 py-4 rounded-[1.5rem] border-2 font-semibold transition-all duration-200 ${stateClass}`}>
                                                        <span className="text-sm">{opt}</span>
                                                        {icon}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {resultData.explanation && (
                                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6">
                                            <h4 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-1">Explanation</h4>
                                            <p className="text-blue-900 text-sm">{resultData.explanation}</p>
                                        </div>
                                    )}

                                    <div className="text-center">
                                        <p className="text-gray-600 font-medium">
                                            {resultData.isCorrect 
                                                ? `Your streak is now alive at ${streak} 🔥` 
                                                : `Your streak broke and returned to 0 🧊`}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                // Show "come back tomorrow"
                                <div className="mb-6">
                                    <h3 className="text-2xl font-black text-gray-900 mb-2">You're Done For Today!</h3>
                                    <p className="text-gray-600 text-lg">Current Streak: <strong className="text-orange-500">{streak} 🔥</strong></p>
                                    <p className="text-sm text-gray-400 mt-2">Check back tomorrow for a new challenge based on your learning goals.</p>
                                </div>
                            )}

                            <button onClick={onClose} className="w-full py-4 bg-[#013e38] text-white text-[10px] uppercase font-black tracking-[0.25em] rounded-2xl hover:bg-[#3bb4a1] hover:shadow-[#3bb4a1]/30 transition-all shadow-xl shadow-[#013e38]/20">
                                Awesome, Thanks!
                            </button>
                        </div>
                    ) : (
                        /* Active Question State */
                        <div className="animate-fade-in-up">
                            <div className="bg-[#fafafa] p-5 rounded-[1.5rem] border border-gray-100 mb-6">
                                <h3 className="text-lg font-bold text-gray-900 leading-relaxed">
                                    {quizData?.question}
                                </h3>
                            </div>

                            <div className="space-y-3 mb-8">
                                {quizData?.options.map((option, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedOption(index)}
                                        disabled={submitting}
                                        className={`w-full text-left px-5 py-4 rounded-xl border-2 font-semibold transition-all duration-200 flex justify-between items-center group
                                            ${selectedOption === index 
                                                ? 'border-[#3bb4a1] bg-[#3bb4a1]/5 text-[#013e38] shadow-sm' 
                                                : 'border-gray-100 bg-white text-gray-600 hover:border-[#3bb4a1]/50 hover:bg-gray-50'}`}
                                    >
                                        <span className="flex-1 pr-4">{option}</span>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
                                            ${selectedOption === index ? 'border-[#3bb4a1] bg-[#3bb4a1]' : 'border-gray-300 group-hover:border-[#3bb4a1]/50 bg-white'}`}>
                                            {selectedOption === index && <div className="w-2 h-2 rounded-full bg-white"></div>}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={selectedOption === null || submitting}
                                className={`w-full py-4 uppercase font-black tracking-[0.25em] text-[10px] rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2
                                    ${selectedOption !== null && !submitting
                                        ? 'bg-[#013e38] text-white hover:bg-[#3bb4a1] shadow-[#013e38]/20 hover:shadow-[#3bb4a1]/30' 
                                        : 'bg-white border border-gray-100 text-gray-400 cursor-not-allowed shadow-none'}`}
                            >
                                {submitting ? <FaSpinner className="animate-spin text-xl" /> : "Submit Answer"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DailyQuizModal;
