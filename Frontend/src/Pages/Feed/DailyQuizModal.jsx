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
            const response = await axios.get("/quiz/daily", { withCredentials: true });
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
            const response = await axios.post("/quiz/daily", { answerIndex: selectedOption }, { withCredentials: true });
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
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 font-sans">
            <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-md" onClick={onClose}></div>

            <div className="relative bg-white w-full max-w-lg max-h-[90vh] rounded-3xl shadow-2xl animate-fade-in flex flex-col overflow-hidden border border-dark-border">
                {/* Decorative glow gradients */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-teal-500 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>

                <div className="flex-shrink-0 flex justify-between items-start p-6 pb-4 relative z-10 border-b border-dark-border bg-slate-50">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            Daily Quiz <FaQuestionCircle className="text-cyan-500 text-xl" />
                        </h2>
                        <p className="text-sm text-slate-600 mt-1 font-medium">
                            Answer daily to maintain your streak!
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <button onClick={onClose} className="p-2 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-full transition-colors border border-dark-border relative z-20">
                            <FaTimes />
                        </button>
                        {!loading && status !== "error" && (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 rounded-lg text-[10px] uppercase font-bold tracking-widest shadow-sm">
                                <FaFire className={streak > 0 ? "animate-pulse text-orange-500" : ""} /> {streak} Day Streak
                            </div>
                        )}
                    </div>
                </div>

                {/* Content (Scrollable) */}
                <div className="relative z-10 flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <FaSpinner className="animate-spin text-4xl text-cyan-500 mb-4" />
                            <p className="text-slate-600 font-medium">Summoning today's challenge...</p>
                        </div>
                    ) : status === "error" ? (
                        <div className="text-center py-10">
                            <p className="text-red-600 font-medium mb-4">Something went wrong fetching your quiz.</p>
                            <button onClick={fetchDailyQuiz} className="px-6 py-2.5 bg-white border border-dark-border hover:bg-slate-50 text-slate-800 font-bold rounded-lg transition-colors">
                                Try Again
                            </button>
                        </div>
                    ) : status === "completed" || resultData ? (
                        /* Completed State */
                        <div className="text-center py-4">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 bg-cyan-500/10 border-2 border-cyan-500/30 shadow-[0_0_30px_rgba(94,234,212,0.15)] transform hover:scale-105 transition-transform">
                                <FaFire className="text-4xl text-orange-500" />
                            </div>

                            {resultData ? (
                                // Show immediate result feedback
                                <div className="mb-6 text-left w-full">
                                    <div className="flex flex-col items-center justify-center mb-6">
                                        <h3 className={`text-2xl font-bold mb-1 ${resultData.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                                            {resultData.isCorrect ? "Brilliant!" : "Ouch!"}
                                        </h3>
                                        <p className="text-slate-600 text-sm font-medium">
                                            {resultData.isCorrect
                                                ? `Your streak is now alive at ${streak} 🔥`
                                                : `Your streak broke and returned to 0 🧊`}
                                        </p>
                                    </div>

                                    <div className="bg-slate-50 p-5 rounded-2xl border border-dark-border mb-6">
                                        <p className="text-slate-900 font-semibold mb-4 text-base">{quizData?.question}</p>

                                        <div className="space-y-3">
                                            {quizData?.options.map((opt, idx) => {
                                                const isUserChoice = selectedOption === idx;
                                                const isCorrectChoice = resultData.correctAnswer === idx;

                                                let stateClass = "bg-white border-dark-border text-slate-700";
                                                let icon = null;

                                                if (isCorrectChoice) {
                                                    stateClass = "bg-green-500/10 border-green-500/30 text-green-400 font-semibold";
                                                    icon = <FaCheckCircle className="text-green-500 text-lg" />;
                                                } else if (isUserChoice && !isCorrectChoice) {
                                                    stateClass = "bg-red-500/10 border-red-500/30 text-red-400 font-semibold";
                                                    icon = <FaTimesCircle className="text-red-500 text-lg" />;
                                                }

                                                return (
                                                    <div key={idx} className={`flex justify-between items-center px-5 py-3.5 rounded-[1.2rem] border transition-all duration-200 ${stateClass}`}>
                                                        <span className="text-sm">{opt}</span>
                                                        {icon}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {resultData.explanation && (
                                        <div className="bg-cyan-500/5 p-4 rounded-xl border border-cyan-500/20 mb-6">
                                            <h4 className="text-xs font-bold text-cyan-500 uppercase tracking-widest mb-1.5">Explanation</h4>
                                            <p className="text-slate-700 text-sm leading-relaxed">{resultData.explanation}</p>
                                        </div>
                                    )}

                                </div>
                            ) : (
                                // Show "come back tomorrow"
                                <div className="mb-8 mt-4">
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">You're done for today</h3>
                                    <p className="text-slate-700 text-base font-medium">Current Streak: <strong className="text-orange-500">{streak} 🔥</strong></p>
                                    <p className="text-sm text-slate-600 mt-4 max-w-sm mx-auto">Check back tomorrow for a new challenge based on your learning goals.</p>
                                </div>
                            )}

                            <button onClick={onClose} className="w-full py-3.5 bg-cyan-500 text-dark-bg text-sm font-bold rounded-xl hover:bg-cyan-400 shadow-lg shadow-cyan-500/20 transition-all">
                                Awesome, Thanks!
                            </button>
                        </div>
                    ) : (
                        /* Active Question State */
                        <div className="animate-fade-in-up">
                            <div className="bg-slate-50 p-5 rounded-2xl border border-dark-border mb-6">
                                <h3 className="text-base font-semibold text-slate-900 leading-relaxed">
                                    {quizData?.question}
                                </h3>
                            </div>

                            <div className="space-y-3 mb-8">
                                {quizData?.options.map((option, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedOption(index)}
                                        disabled={submitting}
                                        className={`w-full text-left px-5 py-3.5 rounded-xl border transition-all duration-200 flex justify-between items-center group
                                            ${selectedOption === index
                                                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400 font-semibold shadow-sm'
                                                : 'border-dark-border bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50 font-medium'}`}
                                    >
                                        <span className="flex-1 pr-4 text-sm">{option}</span>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
                                            ${selectedOption === index ? 'border-cyan-500 bg-cyan-500' : 'border-slate-500 group-hover:border-slate-400 bg-transparent'}`}>
                                            {selectedOption === index && <div className="w-2 h-2 rounded-full bg-white"></div>}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={selectedOption === null || submitting}
                                className={`w-full py-3.5 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2
                                    ${selectedOption !== null && !submitting
                                        ? 'bg-cyan-500 text-dark-bg hover:bg-cyan-400 shadow-md shadow-cyan-500/20'
                                        : 'bg-slate-50 border border-dark-border text-slate-600 cursor-not-allowed shadow-none'}`}
                            >
                                {submitting ? <FaSpinner className="animate-spin text-lg" /> : "Submit Answer"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DailyQuizModal;
