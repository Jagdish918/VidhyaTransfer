import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../util/UserContext';
import { FaPaperPlane, FaTimes, FaMinus, FaVideo, FaStop, FaBolt, FaVideoSlash, FaChevronDown } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const InstantHelpChatWidget = () => {
    const { 
        user,
        socket,
        activeInstantHelpSession, 
        setActiveInstantHelpSession,
        instantHelpChatOpen, 
        setInstantHelpChatOpen,
        instantHelpMessages,
        setInstantHelpMessages,
        activeCall
    } = useUser();
    
    const [minimized, setMinimized] = useState(false);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [endingSession, setEndingSession] = useState(false);
    const [startingMeeting, setStartingMeeting] = useState(false);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    // Fetch previous messages when chat opens
    useEffect(() => {
        if (!activeInstantHelpSession || !instantHelpChatOpen) return;

        const fetchMessages = async () => {
            setLoading(true);
            try {
                const { data } = await axios.get(
                    `/instant-help/${activeInstantHelpSession.sessionId}/messages?page=1`,
                    { withCredentials: true }
                );
                if (data.success) {
                    setInstantHelpMessages(data.data.messages || []);
                }
            } catch (error) {
                console.error("Error fetching instant help messages", error);
            } finally {
                setLoading(false);
            }
        };

        // Only fetch if we don't already have messages for this session
        if (instantHelpMessages.length === 0) {
            fetchMessages();
        }
    }, [activeInstantHelpSession, instantHelpChatOpen, setInstantHelpMessages]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (!minimized && instantHelpChatOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [instantHelpMessages, minimized, instantHelpChatOpen]);

    if (!activeInstantHelpSession || !instantHelpChatOpen) return null;

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || !activeInstantHelpSession) return;

        const content = input.trim();
        setInput('');

        // Optimistic update
        const optimisticMsg = {
            _id: Date.now().toString(),
            sender: { _id: user._id, name: user.name, picture: user.picture },
            content,
            createdAt: new Date().toISOString()
        };
        setInstantHelpMessages(prev => [...prev, optimisticMsg]);

        try {
            const { data } = await axios.post(
                `/instant-help/${activeInstantHelpSession.sessionId}/messages`,
                { content },
                { withCredentials: true }
            );
            
            // Replace optimistic message with real one
            setInstantHelpMessages(prev => prev.map(msg => 
                msg._id === optimisticMsg._id ? data.data : msg
            ));
        } catch (error) {
            console.error("Error sending message", error);
            // Remove optimistic message on error
            setInstantHelpMessages(prev => prev.filter(msg => msg._id !== optimisticMsg._id));
            toast.error("Failed to send message");
        }
    };

    const handleEndSession = async () => {
        if (activeInstantHelpSession.role !== "learner") return;
        
        if (!window.confirm("Are you sure you want to end this instant help session? Credits will be transferred to the provider.")) return;

        setEndingSession(true);
        try {
            const { data } = await axios.patch(
                `/instant-help/${activeInstantHelpSession.sessionId}/end`,
                {},
                { withCredentials: true }
            );
            if (data.success) {
                toast.success(`Session completed! ${data.data?.providerCredits !== undefined ? `Your balance: ${data.data.providerCredits} credits` : 'Credits transferred to you.'}`);
                setInstantHelpChatOpen(false);
                setActiveInstantHelpSession(null);
                setInstantHelpMessages([]);
            }
        } catch (error) {
            console.error("Error ending session", error);
            toast.error(error.response?.data?.message || "Failed to end session");
        } finally {
            setEndingSession(false);
        }
    };

    const startMeeting = async () => {
        setStartingMeeting(true);
        try {
            await axios.post(
                `/instant-help/${activeInstantHelpSession.sessionId}/meeting/start`,
                {},
                { withCredentials: true }
            );
            // The socket event `startInstantHelpMeeting` will handle the actual navigation and opening
            setMinimized(true);
        } catch (error) {
            console.error("Error starting meeting", error);
            toast.error(error.response?.data?.message || "Failed to start meeting");
        } finally {
            setStartingMeeting(false);
        }
    };

    // If minimized, show a small Floating Action Button (FAB)
    if (minimized) {
        return (
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMinimized(false)}
                className="fixed bottom-6 right-6 z-[9999] bg-cyan-600 text-white rounded-full p-0 shadow-2xl flex items-center gap-3 pr-5 overflow-hidden group border-2 border-white cursor-pointer"
            >
                <div className="relative h-14 w-14">
                    <img 
                        src={activeInstantHelpSession.partnerPicture || "https://ui-avatars.com/api/?name=" + (activeInstantHelpSession.partnerName || "U") + "&background=random&size=100"} 
                        alt="Partner" 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                    <div className="absolute -top-1 -right-1 bg-cyan-500 text-white p-1 rounded-full shadow-lg border border-white">
                        <FaBolt size={10} />
                    </div>
                </div>
                <div className="text-left py-2">
                    <p className="font-bold text-sm leading-tight tracking-wide">{activeInstantHelpSession.partnerName}</p>
                    <p className="text-[10px] text-cyan-200 uppercase tracking-widest font-bold">Instant Help</p>
                </div>
                <div className="bg-white/20 p-2 rounded-full ml-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                </div>
            </motion.button>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 500, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 500, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed bottom-6 right-6 z-[9999] w-[360px] h-[500px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-gray-100 flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-cyan-600 to-cyan-500 px-4 py-3 text-white flex justify-between items-center shadow-md relative z-10">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="relative flex-shrink-0">
                            <img 
                                src={activeInstantHelpSession.partnerPicture || "https://ui-avatars.com/api/?name=" + (activeInstantHelpSession.partnerName || "U") + "&background=random&size=100"} 
                                className="w-10 h-10 rounded-full object-cover border-2 border-white/50" 
                                alt="" 
                            />
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-cyan-500 rounded-full"></div>
                        </div>
                        <div className="min-w-0">
                            <h4 className="font-bold text-sm leading-tight truncate">{activeInstantHelpSession.partnerName}</h4>
                            <p className="text-[10px] text-cyan-100 uppercase tracking-widest font-bold flex items-center gap-1">
                                <FaBolt size={8} /> {activeInstantHelpSession.role === "provider" ? "Learner" : "Provider"}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setInstantHelpChatOpen(false);
                            }}
                            className="p-1.5 hover:bg-white/20 rounded-md transition-colors text-white cursor-pointer"
                            title="Close Chat"
                        >
                            <FaTimes size={12} />
                        </button>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setMinimized(true);
                            }}
                            className="p-1.5 hover:bg-white/20 rounded-md transition-colors text-white cursor-pointer"
                            title="Minimize"
                        >
                            <FaChevronDown size={12} />
                        </button>
                    </div>
                </div>

                {/* Session Info Banner */}
                <div className="bg-cyan-50 px-4 py-2 flex items-center justify-between border-b border-cyan-100 text-xs">
                    <div className="flex flex-col">
                        <span className="text-gray-500 text-[9px] uppercase tracking-wider font-bold">Session Skill</span>
                        <span className="font-semibold text-cyan-800">{activeInstantHelpSession.skill}</span>
                    </div>
                    {/* Only show end session button to learner */}
                    {activeInstantHelpSession.role === "learner" && (
                        <button 
                            onClick={handleEndSession}
                            disabled={endingSession}
                            className="text-[10px] bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-colors disabled:opacity-50 border-0 cursor-pointer"
                        >
                            {endingSession ? "Ending..." : "End Session"}
                        </button>
                    )}
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-[#f8fbff] flex flex-col gap-3">
                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                        </div>
                    ) : instantHelpMessages.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                            <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mb-4 text-cyan-500">
                                <FaBolt size={24} />
                            </div>
                            <h3 className="font-bold text-gray-800 text-sm mb-1">Instant Help Connected!</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                {activeInstantHelpSession.role === "provider" 
                                    ? `You are now helping ${activeInstantHelpSession.partnerName}. Start chatting or initiate a video call.`
                                    : `You are connected with ${activeInstantHelpSession.partnerName}. Describe what you need help with.`}
                            </p>
                        </div>
                    ) : (
                        instantHelpMessages.map((msg) => {
                            const isMe = msg.sender?._id === user._id;
                            return (
                                <div key={msg._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div 
                                        className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-sm shadow-sm ${
                                            isMe 
                                                ? 'bg-cyan-600 text-white rounded-tr-none' 
                                                : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                                        }`}
                                    >
                                        <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                                    </div>
                                    <span className="text-[9px] text-gray-400 mt-1 px-1 font-medium">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Video Call Banner / Button — only learner can initiate */}
                {!activeCall && activeInstantHelpSession?.role === "learner" && (
                    <div className="p-3 bg-white border-t border-gray-100">
                        <button 
                            onClick={startMeeting}
                            disabled={startingMeeting}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer border-0 disabled:opacity-50"
                        >
                            <FaVideo /> {startingMeeting ? "Starting..." : "Start Video Meeting"}
                        </button>
                    </div>
                )}
                {activeCall && window.location.pathname !== '/chat' && (
                    <div className="p-3 bg-white border-t border-gray-100">
                         <button 
                            onClick={() => navigate('/chat')}
                            className="w-full bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm shadow-green-200 cursor-pointer border-0 animate-pulse"
                        >
                            <FaVideo /> Go to Active Call
                        </button>
                    </div>
                )}


                {/* Input Area */}
                <div className="p-3 bg-gray-50 border-t border-gray-200">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all shadow-sm"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim()}
                            className="bg-cyan-600 text-white w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-500 transition-colors shadow-sm cursor-pointer border-0"
                        >
                            <FaPaperPlane size={12} className="-ml-0.5" />
                        </button>
                    </form>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default InstantHelpChatWidget;
