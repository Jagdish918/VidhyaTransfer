import React, { useState } from 'react';
import { useUser } from '../util/UserContext';
import { useNavigate } from 'react-router-dom';
import { FaBolt, FaTimes, FaCheck, FaCoins } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import axios from 'axios';

const GlobalInstantHelpNotification = () => {
    const { incomingInstantHelp, setIncomingInstantHelp, setActiveInstantHelpSession } = useUser();
    const navigate = useNavigate();
    const [actionLoading, setActionLoading] = useState(null);

    const handleAccept = async () => {
        if (!incomingInstantHelp?.sessionId) return;
        setActionLoading('accept');
        try {
            const { data } = await axios.patch(
                `/instant-help/${incomingInstantHelp.sessionId}/accept`
            );
            if (data.success) {
                toast.success('Instant help accepted! Starting meeting...');
                // Store session info so Chat.jsx auto-selects partner and starts call
                setActiveInstantHelpSession({
                    sessionId: incomingInstantHelp.sessionId,
                    partnerId: incomingInstantHelp.learner?._id,
                    partnerName: incomingInstantHelp.learner?.name,
                    partnerPicture: incomingInstantHelp.learner?.picture,
                    skill: incomingInstantHelp.skill,
                    role: "provider",
                });
                setIncomingInstantHelp(null);
                navigate('/chat');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to accept request');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDecline = async () => {
        if (!incomingInstantHelp?.sessionId) return;
        setActionLoading('decline');
        try {
            const { data } = await axios.patch(
                `/instant-help/${incomingInstantHelp.sessionId}/decline`
            );
            if (data.success) {
                toast.info('Request declined. Credits refunded to learner.');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to decline request');
        } finally {
            setIncomingInstantHelp(null);
            setActionLoading(null);
        }
    };

    return (
        <AnimatePresence>
            {incomingInstantHelp && (
                <motion.div
                    initial={{ x: 400, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 400, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed top-6 right-6 z-[9999] w-96 bg-white border border-gray-100 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden"
                >
                    {/* Header with cyan gradient */}
                    <div className="bg-gradient-to-r from-cyan-600 to-cyan-500 px-5 py-3 flex items-center gap-2 text-white">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                            <FaBolt size={14} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold mb-0">Instant Help Request</h4>
                            <p className="text-cyan-100 text-[10px]">Someone needs your expertise!</p>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="relative">
                                <div className="absolute inset-0 rounded-full animate-ping bg-cyan-500/20"></div>
                                <img
                                    src={incomingInstantHelp.learner?.picture || 'https://ui-avatars.com/api/?background=random'}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md relative z-10"
                                    alt=""
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-gray-900 font-bold text-sm truncate mb-0">
                                    {incomingInstantHelp.learner?.name || 'Unknown User'}
                                </h4>
                                <p className="text-gray-500 text-xs truncate">
                                    @{incomingInstantHelp.learner?.username}
                                </p>
                            </div>
                        </div>

                        {/* Skill & Credits info */}
                        <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-100">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Skill</span>
                                <span className="text-xs font-bold text-slate-900">{incomingInstantHelp.skill}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Credits</span>
                                <span className="text-xs font-bold text-cyan-700 flex items-center gap-1">
                                    <FaCoins size={10} /> {incomingInstantHelp.credits} credits
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={handleDecline}
                                disabled={actionLoading === 'decline'}
                                className="flex-1 py-2.5 bg-white hover:bg-red-50 text-red-500 text-xs font-bold rounded-xl border border-gray-200 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                <FaTimes size={12} />
                                {actionLoading === 'decline' ? '...' : 'Decline'}
                            </button>
                            <button
                                onClick={handleAccept}
                                disabled={actionLoading === 'accept'}
                                className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-200 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                <FaCheck size={12} />
                                {actionLoading === 'accept' ? '...' : 'Accept & Start'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default GlobalInstantHelpNotification;