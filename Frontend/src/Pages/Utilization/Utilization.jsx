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
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const tabs = ["Instant Help", "Hire Expert", "Events"];

    // 1. Debounce the search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchProviders = async () => {
        setLoading(true);
        try {
            if (activeTab === "Events") {
                const { data } = await axios.get("/events");
                if (data.success) {
                    setEvents(data.data);
                }
            } else {
                const { data } = await axios.get("/user/providers", {
                    params: {
                        type: activeTab,
                        search: debouncedSearch // Use debounced value
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

    // 2. Fetch data immediately when tab or debounced search changes
    useEffect(() => {
        fetchProviders();
    }, [activeTab, debouncedSearch]);

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
                        className="border border-[#013e38] text-[#013e38] text-xs px-4 py-2 rounded-lg hover:bg-[#013e38] hover:text-white transition-all font-bold no-underline"
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
                            {[1, 2, 3].map(i => <div key={i} className="bg-white h-72 rounded-2xl shadow-sm animate-pulse border border-gray-100"></div>)}
                        </div>
                    ) : events.length === 0 ? (
                        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-300 max-w-2xl mx-auto">
                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500">
                                <FaCalendarAlt size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Upcoming Events</h3>
                            <p className="text-gray-500 mb-8">Stay tuned! Our community managers are planning exciting workshops available soon.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {events.map(event => (
                                <div key={event._id} className="group bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full transform hover:-translate-y-1">
                                    <div className="h-56 bg-gray-100 relative overflow-hidden">
                                        {event.image ? (
                                            <img
                                                src={event.image}
                                                alt={event.title}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-gray-300 bg-gray-50">
                                                <FaCalendarAlt className="text-5xl mb-3 opacity-50" />
                                                <span className="text-xs font-semibold uppercase tracking-widest opacity-70">Event</span>
                                            </div>
                                        )}
                                        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl text-xs font-bold text-gray-800 shadow-sm flex flex-col items-center min-w-[60px]">
                                            <span className="text-red-500 text-xs uppercase tracking-wider">{new Date(event.date).toLocaleDateString(undefined, { month: 'short' })}</span>
                                            <span className="text-xl font-black">{new Date(event.date).getDate()}</span>
                                        </div>
                                    </div>

                                    <div className="p-7 flex-1 flex flex-col">
                                        <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight group-hover:text-[#3bb4a1] transition-colors line-clamp-2">{event.title}</h3>

                                        <div className="flex items-center text-sm text-gray-500 mb-4 bg-gray-50 p-2 rounded-lg w-fit">
                                            <FaCalendarAlt className="mr-2 text-[#3bb4a1]" />
                                            <span className="font-medium">{new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                        </div>

                                        <p className="text-gray-600 text-sm mb-6 line-clamp-3 leading-relaxed flex-1">{event.description}</p>

                                        <div className="mt-auto pt-2">
                                            <Link
                                                to={`/events/${event._id}`}
                                                className="block w-full text-center bg-[#3bb4a1] hover:bg-[#2fa08e] text-white py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-[#3bb4a1]/20 hover:shadow-[#3bb4a1]/40 transform active:scale-95 no-underline"
                                            >
                                                View Details & Register
                                            </Link>
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
