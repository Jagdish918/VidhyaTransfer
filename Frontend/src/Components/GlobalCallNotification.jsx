import React from 'react';
import { useUser } from '../util/UserContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaVideo, FaTimes, FaPhone } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const GlobalCallNotification = () => {
    const { incomingCall, setIncomingCall, socket } = useUser();
    const navigate = useNavigate();
    const location = useLocation();

    // Don't show the notification if we're already on /chat — 
    // the VideoCall component handles it there with its own overlay
    const showNotification = incomingCall && location.pathname !== '/chat';

    const handleAnswer = () => {
        // Navigate to chat — DO NOT clear incomingCall!
        // VideoCall needs the signal data from incomingCall to establish the peer connection
        navigate('/chat');
    };

    const handleDecline = () => {
        // Notify the caller that the call was declined
        if (socket && incomingCall?.from) {
            socket.emit("endCall", { to: incomingCall.from });
        }
        setIncomingCall(null);
    };

    return (
        <AnimatePresence>
            {showNotification && (
                <motion.div
                    initial={{ x: 400, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 400, opacity: 0 }}
                    className="fixed top-6 right-6 z-[9999] w-80 bg-white border border-gray-100 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden"
                >
                    <div className="p-5 flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 rounded-full animate-ping bg-blue-500/20"></div>
                            <img 
                                src={incomingCall.avatar || "https://ui-avatars.com/api/?background=random"} 
                                className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md relative z-10" 
                                alt="" 
                            />
                            <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white z-20"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-gray-900 font-bold text-base truncate mb-0">{incomingCall.name}</h4>
                            <p className="text-blue-600 text-xs font-semibold flex items-center gap-1.5 mt-1">
                                <FaVideo className="animate-pulse" />
                                Incoming video call
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex border-t border-gray-50 p-2 gap-2 bg-gray-50/50">
                        <button 
                            onClick={handleDecline}
                            className="flex-1 py-2.5 bg-white hover:bg-red-50 text-red-500 text-xs font-bold rounded-xl border border-gray-100 transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                            <FaTimes /> Decline
                        </button>
                        <button 
                            onClick={handleAnswer}
                            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                            <FaPhone className="animate-bounce" /> Answer
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default GlobalCallNotification;
