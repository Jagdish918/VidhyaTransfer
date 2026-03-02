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
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">

                {/* Main Content - Notification List */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                            <p className="text-gray-500 text-sm mt-1">Stay updated with your learning activities</p>
                        </div>
                        <button className="text-sm text-blue-600 font-medium hover:text-blue-700">Mark all as read</button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
                        {["All", "Unread", "Peer Swap", "Learning", "System"].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                                    : "bg-white text-gray-600 hover:bg-gray-100 border border-transparent"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-pulse h-32"></div>
                                ))}
                            </div>
                        ) : filteredNotifications.length === 0 ? (
                            <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FaBell className="text-gray-300 text-2xl" />
                                </div>
                                <h3 className="text-gray-900 font-medium">No notifications found</h3>
                                <p className="text-gray-500 text-sm mt-1">You're all caught up!</p>
                            </div>
                        ) : (
                            filteredNotifications.map(notification => (
                                <div key={notification.id} className={`bg-white p-5 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md ${!notification.read ? 'bg-blue-50/30 border-blue-100' : ''}`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${notification.color}`}>
                                            {notification.type === 'peer_request' && notification.data?.picture ? (
                                                <img src={notification.data.picture} alt="" className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                <notification.icon size={20} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-gray-900 text-base">{notification.title}</h3>
                                                    <p className="text-gray-600 text-sm mt-1 leading-relaxed">{notification.description}</p>
                                                </div>
                                                <div className="flex flex-col items-end gap-2 ml-4">
                                                    <span className="text-xs text-gray-400 whitespace-nowrap">{notification.time}</span>
                                                    {!notification.read && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>}
                                                </div>
                                            </div>

                                            <div className="mt-3 flex items-center justify-between">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${notification.tag === 'Learning' ? 'bg-blue-50 text-blue-700' :
                                                    notification.tag === 'Peer Swap' ? 'bg-purple-50 text-purple-700' :
                                                        notification.tag === 'Resources' ? 'bg-yellow-50 text-yellow-700' :
                                                            'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {notification.tag}
                                                </span>

                                                {notification.type === 'peer_request' && (
                                                    <div className="flex gap-3 mt-2 sm:mt-0">
                                                        <button
                                                            onClick={() => handleAccept(notification.data._id)}
                                                            className="px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
                                                        >
                                                            Accept
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(notification.data._id)}
                                                            className="px-4 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
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
                <div className="w-full lg:w-80 space-y-6">
                    {/* Quick Stats */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-4">Quick Stats</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <FaBell size={14} />
                                    </div>
                                    <div className="text-sm">
                                        <p className="font-semibold text-gray-900">Unread</p>
                                        <p className="text-xs text-gray-500">Notifications</p>
                                    </div>
                                </div>
                                <span className="font-bold text-blue-600">12</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                                        <FaTrophy size={14} />
                                    </div>
                                    <div className="text-sm">
                                        <p className="font-semibold text-gray-900">Achievements</p>
                                        <p className="text-xs text-gray-500">This week</p>
                                    </div>
                                </div>
                                <span className="font-bold text-green-600">3</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                        <FaUserPlus size={14} />
                                    </div>
                                    <div className="text-sm">
                                        <p className="font-semibold text-gray-900">Requests</p>
                                        <p className="text-xs text-gray-500">Pending</p>
                                    </div>
                                </div>
                                <span className="font-bold text-purple-600">{requests.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notification Settings */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-4">Notification Settings</h3>
                        <div className="space-y-4">
                            {[
                                { label: "Email Notifications", active: true },
                                { label: "Push Notifications", active: true },
                                { label: "Peer Swap Alerts", active: false },
                                { label: "Learning Updates", active: true },
                            ].map((setting, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 font-medium">{setting.label}</span>
                                    <div className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${setting.active ? 'bg-blue-600' : 'bg-gray-200'}`}>
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${setting.active ? 'translate-x-4' : ''}`}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Upcoming */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-4">Upcoming Sessions</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="" className="w-10 h-10 rounded-full object-cover" />
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">Sarah Williams</p>
                                    <p className="text-xs text-gray-500">Tomorrow, 3:00 PM</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="" className="w-10 h-10 rounded-full object-cover" />
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">Alex Johnson</p>
                                    <p className="text-xs text-gray-500">Friday, 10:00 AM</p>
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
