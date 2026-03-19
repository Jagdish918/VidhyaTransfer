import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
    FaUserPlus, FaCheck, FaTimes, FaBell, FaTrophy, FaLightbulb,
    FaCog, FaCircle, FaInfoCircle, FaCalendarAlt
} from "react-icons/fa";

const Notifications = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("All");

    const fetchRequests = async () => {
        try {
            const { data } = await axios.get("http://localhost:8000/request/getRequests", {
                withCredentials: true
            });
            setRequests(data.data || []);
        } catch (error) {
            console.error("Error fetching requests:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAccept = async (senderId) => {
        try {
            await axios.post("http://localhost:8000/request/acceptRequest",
                { requestId: senderId },
                { withCredentials: true }
            );
            toast.success("Connection accepted!");
            fetchRequests();
        } catch (error) {
            console.error("Error accepting request:", error);
            toast.error(error.response?.data?.message || "Failed to accept request");
        }
    };

    const handleReject = async (senderId) => {
        try {
            await axios.post("http://localhost:8000/request/rejectRequest",
                { requestId: senderId },
                { withCredentials: true }
            );
            toast.info("Request rejected");
            fetchRequests();
        } catch (error) {
            console.error("Error rejecting request:", error);
            toast.error("Failed to reject request");
        }
    };

    // Mock Data for "Premium" feel
    const mockNotifications = [
        {
            id: 'm1',
            type: 'learning',
            title: 'Module Completed!',
            description: 'Congratulations! You\'ve completed "ML Fundamentals" module with 85% score.',
            time: '2 min ago',
            read: false,
            icon: FaTrophy,
            color: 'bg-blue-100 text-blue-600',
            tag: 'Learning'
        },
        {
            id: 'm2',
            type: 'learning',
            title: 'Quiz Passed',
            description: 'You\'ve successfully passed the "Web Development" assessment.',
            time: '1 hour ago',
            read: true,
            icon: FaCheck,
            color: 'bg-green-100 text-green-600',
            tag: 'Learning'
        },
        {
            id: 'm3',
            type: 'peer',
            title: 'Session Scheduled',
            description: 'Sarah Williams confirmed your peer learning session for tomorrow at 3 PM.',
            time: '3 hours ago',
            read: true,
            icon: FaCalendarAlt,
            color: 'bg-purple-100 text-purple-600',
            tag: 'Peer Swap'
        },
        {
            id: 'm4',
            type: 'resource',
            title: 'New Resource Available',
            description: 'A new learning resource has been added to your "Machine Learning" roadmap.',
            time: '5 hours ago',
            read: true,
            icon: FaLightbulb,
            color: 'bg-yellow-100 text-yellow-600',
            tag: 'Resources'
        },
        {
            id: 'm5',
            type: 'system',
            title: 'System Update',
            description: 'VidhyaTransfer has been updated with new features. Check out what\'s new!',
            time: 'Yesterday',
            read: true,
            icon: FaInfoCircle,
            color: 'bg-gray-100 text-gray-600',
            tag: 'System'
        }
    ];

    // Combine Real Requests with Mock Notifications
    const allNotifications = [
        ...requests.map(req => ({
            id: req._id,
            type: 'peer_request',
            title: 'New Peer Swap Request',
            description: `${req.name} wants to swap Python skills for your Web Development expertise.`, // Mock description based on logic
            time: 'Just now', // Real time calculation could be added
            read: false,
            icon: FaUserPlus,
            color: 'bg-indigo-100 text-indigo-600',
            tag: 'Peer Swap',
            data: req // Store full request data for actions
        })),
        ...mockNotifications
    ];

    const filteredNotifications = activeTab === "All"
        ? allNotifications
        : activeTab === "Unread"
            ? allNotifications.filter(n => !n.read)
            : allNotifications.filter(n => n.tag === activeTab);

    return (
        <div className="min-h-screen bg-dark-bg py-4 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">

                {/* Main Content - Notification List */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-br from-cyan-500 to-emerald-500 bg-clip-text text-transparent tracking-tight">Notifications</h1>
                            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-0.5">Stay updated with your activities</p>
                        </div>
                        <button className="text-[9px] uppercase tracking-widest text-cyan-500 font-black hover:text-cyan-700 transition-colors">Mark all as read</button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-4 mb-3 scrollbar-hide">
                        {["All", "Unread", "Peer Swap", "Learning", "System"].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-2 rounded-xl text-[10px] uppercase tracking-widest font-black whitespace-nowrap transition-all duration-300 ${activeTab === tab
                                    ? "bg-cyan-500 text-dark-bg shadow-lg shadow-cyan-500/20"
                                    : "bg-dark-card text-slate-400 hover:text-slate-900 hover:bg-slate-50 border border-dark-border"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-5">
                        {loading ? (
                            <div className="space-y-5">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="bg-dark-card p-8 rounded-[2rem] shadow-card border border-dark-border animate-pulse h-32"></div>
                                ))}
                            </div>
                        ) : filteredNotifications.length === 0 ? (
                            <div className="bg-dark-card p-10 rounded-2xl shadow-card border border-dashed border-dark-border text-center">
                                <div className="w-20 h-20 bg-dark-bg rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FaBell className="text-slate-300 text-3xl" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">No notifications found</h3>
                                <p className="text-slate-500 font-medium text-sm mt-3">You're all caught up!</p>
                            </div>
                        ) : (
                            filteredNotifications.map(notification => (
                                <div key={notification.id} className={`bg-dark-card p-4 rounded-xl shadow-card border border-dark-border transition-all duration-300 hover:shadow-[0_20px_50px_rgba(6,182,212,0.06)] ${!notification.read ? 'bg-cyan-50/30' : ''}`}>
                                    <div className="flex items-start gap-5">
                                        <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center flex-shrink-0 shadow-inner ${notification.color}`}>
                                            {notification.type === 'peer_request' && notification.data?.picture ? (
                                                <img src={notification.data.picture} alt="" className="w-full h-full rounded-[1rem] object-cover" />
                                            ) : (
                                                <notification.icon size={20} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-black text-slate-900 text-base tracking-tight">{notification.title}</h3>
                                                    <p className="text-slate-600 font-medium text-xs mt-1 leading-relaxed">{notification.description}</p>
                                                </div>
                                                <div className="flex flex-col items-end gap-3 ml-4">
                                                    <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 whitespace-nowrap">{notification.time}</span>
                                                    {!notification.read && <div className="w-3 h-3 bg-cyan-500 rounded-full shadow-sm shadow-cyan-500/50 animate-pulse"></div>}
                                                </div>
                                            </div>

                                            <div className="mt-4 flex items-center justify-between">
                                                <span className={`inline-flex items-center px-4 py-1.5 rounded-[1rem] text-[9px] uppercase tracking-widest font-black ${notification.tag === 'Learning' ? 'bg-blue-50 text-blue-700' :
                                                    notification.tag === 'Peer Swap' ? 'bg-purple-50 text-purple-700' :
                                                        notification.tag === 'Resources' ? 'bg-yellow-50 text-yellow-700' :
                                                            'bg-gray-50 text-gray-600'
                                                    }`}>
                                                    {notification.tag}
                                                </span>

                                                {notification.type === 'peer_request' && (
                                                    <div className="flex gap-3 mt-3 sm:mt-0">
                                                        <button
                                                            onClick={() => handleAccept(notification.data._id)}
                                                            className="px-6 py-2 bg-cyan-900 text-white text-[9px] uppercase tracking-widest font-black rounded-[1rem] hover:bg-cyan-950 hover:shadow-lg transition-all"
                                                        >
                                                            Accept
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(notification.data._id)}
                                                            className="px-6 py-2 bg-slate-50 border border-dark-border text-slate-500 hover:text-red-500 hover:border-red-100 hover:bg-red-50 text-[9px] uppercase tracking-widest font-black rounded-[1rem] transition-all"
                                                        >
                                                            Decline
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Sidebar - Stats & Settings */}
                <div className="w-full lg:w-96 space-y-8">
                    {/* Quick Stats */}
                    <div className="bg-dark-card p-4 rounded-2xl shadow-card border border-dark-border">
                        <h3 className="font-black text-lg text-slate-900 mb-4 tracking-tight">Quick Stats</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-[1rem] bg-cyan-50 text-cyan-500 flex items-center justify-center">
                                        <FaBell size={16} />
                                    </div>
                                    <div className="text-sm">
                                        <p className="font-black text-slate-900 tracking-tight">Unread</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Notifications</p>
                                    </div>
                                </div>
                                <span className="text-xl font-black text-cyan-500">12</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-[1rem] bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <FaTrophy size={16} />
                                    </div>
                                    <div className="text-sm">
                                        <p className="font-black text-gray-900 tracking-tight">Achievements</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">This week</p>
                                    </div>
                                </div>
                                <span className="text-xl font-black text-indigo-600">3</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-[1rem] bg-purple-50 text-purple-600 flex items-center justify-center">
                                        <FaUserPlus size={16} />
                                    </div>
                                    <div className="text-sm">
                                        <p className="font-black text-gray-900 tracking-tight">Requests</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pending</p>
                                    </div>
                                </div>
                                <span className="text-xl font-black text-purple-600">{requests.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notification Settings */}
                    <div className="bg-dark-card p-4 rounded-2xl shadow-card border border-dark-border">
                        <h3 className="font-black text-lg text-slate-900 mb-4 tracking-tight">Notification Settings</h3>
                        <div className="space-y-3">
                            {[
                                { label: "Email Notifications", active: true },
                                { label: "Push Notifications", active: true },
                                { label: "Peer Swap Alerts", active: false },
                                { label: "Learning Updates", active: true },
                            ].map((setting, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <span className="text-[11px] uppercase tracking-widest font-bold text-slate-500">{setting.label}</span>
                                    <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${setting.active ? 'bg-cyan-500' : 'bg-slate-200'}`}>
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${setting.active ? 'translate-x-6' : ''}`}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Upcoming */}
                    <div className="bg-dark-card p-5 rounded-[2rem] shadow-card border border-dark-border">
                        <h3 className="font-black text-lg text-slate-900 mb-6 tracking-tight">Upcoming Sessions</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 bg-dark-bg p-4 rounded-[1.5rem] border border-dark-border hover:border-cyan-500/30 transition-colors">
                                <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="" className="w-12 h-12 rounded-[1rem] object-cover" />
                                <div>
                                    <p className="text-sm font-black text-slate-900 tracking-tight">Sarah Williams</p>
                                    <p className="text-[9px] uppercase tracking-widest font-black text-cyan-500 mt-1">Tomorrow, 3:00 PM</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 bg-dark-bg p-4 rounded-[1.5rem] border border-dark-border hover:border-cyan-500/30 transition-colors">
                                <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="" className="w-12 h-12 rounded-[1rem] object-cover" />
                                <div>
                                    <p className="text-sm font-black text-slate-900 tracking-tight">Alex Johnson</p>
                                    <p className="text-[9px] uppercase tracking-widest font-black text-cyan-500 mt-1">Friday, 10:00 AM</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Notifications;
