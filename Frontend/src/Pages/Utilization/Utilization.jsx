import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaBolt, FaBriefcase, FaCalendarAlt, FaStar, FaSearch, FaUserTie } from "react-icons/fa";
import { Link } from "react-router-dom";

const Utilization = () => {
    const [activeTab, setActiveTab] = useState("Instant Help");
    const [providers, setProviders] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    const tabs = ["Instant Help", "Hire Expert", "Events"];

    const fetchProviders = async () => {
        setLoading(true);
        try {
            if (activeTab === "Events") {
                const { data } = await axios.get("/events"); // Uses global axios instance (likely set up with baseURL)
                // If it fails with 404, it means routes not set or axios issue.
                // Assuming standard response structure
                if (data.success) {
                    setEvents(data.data);
                }
            } else {
                const { data } = await axios.get("/user/providers", {
                    params: {
                        type: activeTab,
                        search
                    }
                });
                if (data.success) {
                    setProviders(data.data.users);
                }
            }
        } catch (error) {
            console.error("Error fetching data", error);
            if (activeTab === "Events") setEvents([]);
            else setProviders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProviders();
        }, 500);
        return () => clearTimeout(timer);
    }, [activeTab, search]);

    const renderCard = (user) => {
        const rate = activeTab === "Instant Help"
            ? user.preferences?.rates?.instantHelp
            : user.preferences?.rates?.freelance;

        const label = activeTab === "Instant Help" ? "Per Session" : "Hourly/Project";

        return (
            <div key={user._id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-gray-100 flex flex-col group">
                <div className="p-6 flex-1 flex flex-col items-center text-center">
                    <div className="relative">
                        <img
                            src={user.picture || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                            alt={user.name}
                            className="w-24 h-24 rounded-full object-cover border-4 border-gray-50 group-hover:border-[#3bb4a1]/20 transition-all mb-4"
                        />
                        {activeTab === "Instant Help" && (
                            <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-white p-1.5 rounded-full border-2 border-white" title="Instant Help Available">
                                <FaBolt className="text-xs" />
                            </div>
                        )}
                    </div>

                    <h3 className="text-lg font-bold text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-500 mb-1">@{user.username}</p>

                    {/* Rating */}
                    <div className="flex items-center gap-1 text-amber-400 text-sm mb-4">
                        <FaStar />
                        <span className="font-semibold text-gray-700">{user.rating || "New"}</span>
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap justify-center gap-2 mb-4 w-full">
                        {user.skillsProficientAt?.slice(0, 3).map((skill, idx) => (
                            <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-md font-medium">
                                {skill.name || skill}
                            </span>
                        ))}
                        {user.skillsProficientAt?.length > 3 && (
                            <span className="text-xs text-gray-400">+{user.skillsProficientAt.length - 3}</span>
                        )}
                    </div>
                </div>

                {/* Footer: Rate */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-between items-center group-hover:bg-[#3bb4a1]/5 transition-colors">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">{label}</p>
                        <p className="text-[#3bb4a1] font-bold">{rate || 0} Credits</p>
                    </div>
                    <Link
                        to={`/profile/${user.username}`}
                        className="border border-[#013e38] text-[#013e38] text-xs px-4 py-2 rounded-lg hover:bg-[#013e38] hover:text-white transition-all font-bold"
                    >
                        Connect
                    </Link>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-6 pb-12 font-['Montserrat']">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header Content */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-extrabold text-gray-900 font-['Oswald'] tracking-wide uppercase">
                        Explore <span className="text-[#3bb4a1]">Opportunities</span>
                    </h1>
                    <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
                        Connect with peers for instant help, hire experts for your projects, or join exciting community events.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex justify-center mb-8">
                    <div className="bg-white p-1.5 rounded-full shadow-sm border border-gray-200 inline-flex">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => { setActiveTab(tab); setSearch(""); }}
                                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${activeTab === tab
                                    ? "bg-[#013e38] text-white shadow-md"
                                    : "text-gray-500 hover:text-[#013e38] hover:bg-gray-50"
                                    }`}
                            >
                                {tab === "Instant Help" && <FaBolt />}
                                {tab === "Hire Expert" && <FaBriefcase />}
                                {tab === "Events" && <FaCalendarAlt />}
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search Bar (Hidden for Events for now) */}
                {activeTab !== "Events" && (
                    <div className="max-w-md mx-auto mb-10 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaSearch className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder={`Search ${activeTab} providers...`}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-[#3bb4a1] focus:border-transparent transition-all shadow-sm"
                        />
                    </div>
                )}

                {/* Content Area */}
                {activeTab === "Events" ? (
                    loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => <div key={i} className="bg-white h-64 rounded-xl shadow-sm animate-pulse"></div>)}
                        </div>
                    ) : events.length === 0 ? (
                        <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-gray-300 max-w-4xl mx-auto">
                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FaCalendarAlt className="text-3xl text-blue-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Upcoming Events</h3>
                            <p className="text-gray-500 mb-8">Stay tuned! Community events and workshops are coming soon.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {events.map(event => (
                                <div key={event._id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-gray-100 flex flex-col h-full">
                                    <div className="h-48 bg-gray-100 relative overflow-hidden">
                                        {event.image ? (
                                            <img src={event.image} alt={event.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400">
                                                <FaCalendarAlt className="text-4xl opacity-50" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 bg-white rounded-lg text-xs font-bold text-gray-700 shadow-sm">
                                            {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{event.title}</h3>
                                        <p className="text-gray-500 text-sm mb-4 line-clamp-3 flex-1">{event.description}</p>

                                        <div className="pt-4 border-t border-gray-100 mt-auto">
                                            {event.link ? (
                                                <a
                                                    href={event.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block w-full text-center bg-[#3bb4a1] hover:bg-[#2fa08e] text-white py-2.5 rounded-xl font-bold transition-colors"
                                                >
                                                    Register / Join
                                                </a>
                                            ) : (
                                                <button disabled className="block w-full text-center bg-gray-100 text-gray-400 py-2.5 rounded-xl font-bold cursor-not-allowed">
                                                    Info Only
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    <>
                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="bg-white rounded-2xl p-6 shadow-sm animate-pulse h-80"></div>
                                ))}
                            </div>
                        ) : providers.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 grayscale opacity-50">
                                    {activeTab === "Instant Help" ? <FaBolt className="text-3xl" /> : <FaBriefcase className="text-3xl" />}
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">No providers found</h3>
                                <p className="text-gray-500">Be the first to offer {activeTab}!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {providers.map(renderCard)}
                            </div>
                        )}
                    </>
                )}

            </div>
        </div>
    );
};

export default Utilization;
