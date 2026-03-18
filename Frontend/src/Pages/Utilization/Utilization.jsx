import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaBolt, FaBriefcase, FaCalendarAlt, FaStar, FaSearch, FaArrowRight, FaClock, FaMapMarkerAlt } from "react-icons/fa";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const Utilization = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const tabs = ["Instant Help", "Hire Expert", "Events"];
    const rawTab = searchParams.get("tab");
    const activeTab = tabs.includes(rawTab) ? rawTab : "Instant Help";

    const [providers, setProviders] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

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
                    setEvents(data.data?.events || data.data || []);
                }
            } else {
                const { data } = await axios.get("/user/providers", {
                    params: {
                        type: activeTab,
                        search: debouncedSearch
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
        fetchProviders();
    }, [activeTab, debouncedSearch]);

    const renderCard = (user) => {
        const rate = activeTab === "Instant Help"
            ? user.preferences?.rates?.instantHelp
            : user.preferences?.rates?.freelance;

        const label = activeTab === "Instant Help" ? "Session Rate" : "Project Rate";

        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={user._id}
                className="bg-white rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(59,180,161,0.1)] transition-all duration-500 border border-gray-100 flex flex-col group relative overflow-hidden"
            >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#3bb4a1]/5 rounded-bl-[5rem] -mr-4 -mt-4 transition-all duration-500 group-hover:bg-[#3bb4a1]/10 group-hover:scale-110" />

                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="relative mb-4">
                        <img
                            src={user.picture || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                            alt={user.name}
                            className="w-20 h-20 rounded-[1.8rem] object-cover ring-4 ring-gray-50 group-hover:ring-[#3bb4a1]/20 transition-all duration-500 shadow-lg"
                        />
                        {activeTab === "Instant Help" && (
                            <div className="absolute -bottom-1 -right-1 bg-[#3bb4a1] text-white p-1.5 rounded-lg shadow-lg border-2 border-white animate-pulse">
                                <FaBolt className="text-[10px]" />
                            </div>
                        )}
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#3bb4a1] transition-colors">{user.name}</h3>
                    <p className="text-[11px] text-gray-400 font-medium mb-2">@{user.username}</p>

                    <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[9px] font-bold mb-4">
                        <FaStar size={8} />
                        <span>{user.rating || "New Talent"}</span>
                    </div>

                    <div className="flex flex-wrap justify-center gap-1.5 mb-5 w-full">
                        {user.skillsProficientAt?.slice(0, 3).map((skill, idx) => (
                            <span key={idx} className="bg-gray-50 text-gray-500 text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-lg font-bold border border-gray-100 group-hover:border-[#3bb4a1]/20 group-hover:bg-[#3bb4a1]/5 transition-all">
                                {skill.name || skill}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center relative z-10">
                    <div>
                        <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest leading-none mb-1">{label}</p>
                        <p className="text-[#3bb4a1] font-black text-base">{rate || 0}<span className="text-[10px] ml-1 font-bold">Credits</span></p>
                    </div>
                    <Link
                        to={`/profile/${user.username}`}
                        className="bg-[#013e38] text-white text-[9px] uppercase font-black tracking-widest px-5 py-2.5 rounded-xl hover:bg-[#3bb4a1] hover:shadow-[0_10px_20px_rgba(59,180,161,0.3)] transition-all no-underline"
                    >
                        Inquire
                    </Link>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen bg-[#fafafa] pt-8 pb-20 font-['Montserrat']">
            <div className="max-w-7xl mx-auto px-6">

                {/* Header Content */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-block bg-[#3bb4a1]/10 text-[#3bb4a1] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4"
                    >
                        Vidhya Ecosystem
                    </motion.div>
                    <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 leading-tight tracking-tight">
                        Power Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3bb4a1] to-[#013e38]">Growth</span>
                    </h1>
                    <p className="text-gray-500 max-w-xl mx-auto text-sm font-medium">
                        Access specialized support, collaborate with masters, and attend high-impact community events.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex justify-center mb-8">
                    <div className="bg-white p-1.5 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-wrap justify-center gap-1">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => { setSearchParams({ tab }); setSearch(""); }}
                                className={`px-6 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2.5 ${activeTab === tab
                                    ? "bg-[#013e38] text-white shadow-xl shadow-[#013e38]/20"
                                    : "text-gray-400 hover:text-[#013e38] hover:bg-gray-50"
                                    }`}
                            >
                                {tab === "Instant Help" && <FaBolt size={8} />}
                                {tab === "Hire Expert" && <FaBriefcase size={8} />}
                                {tab === "Events" && <FaCalendarAlt size={8} />}
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search Bar */}
                {activeTab !== "Events" && (
                    <div className="max-w-xl mx-auto mb-10 relative group">
                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none transition-colors">
                            <FaSearch className="text-gray-300 group-focus-within:text-[#3bb4a1] scale-90" />
                        </div>
                        <input
                            type="text"
                            placeholder={`Filter ${activeTab.toLowerCase()} by skills or name...`}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="block w-full pl-12 pr-6 py-3 border-none rounded-[2rem] bg-white text-gray-900 focus:ring-4 focus:ring-[#3bb4a1]/10 transition-all shadow-[0_10px_40px_rgba(0,0,0,0.03)] placeholder:text-gray-300 text-xs font-semibold"
                        />
                    </div>
                )}

                {/* Content Area */}
                <AnimatePresence mode="wait">
                    {activeTab === "Events" ? (
                        <motion.div
                            key="events-grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {loading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {[1, 2, 3].map(i => <div key={i} className="bg-white h-96 rounded-[2.5rem] shadow-sm animate-pulse border border-gray-100"></div>)}
                                </div>
                            ) : events.length === 0 ? (
                                <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-gray-100 max-w-2xl mx-auto flex flex-col items-center">
                                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-8 text-gray-200">
                                        <FaCalendarAlt size={32} />
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Quiet on the Radar</h3>
                                    <p className="text-gray-400 mb-0 font-medium leading-relaxed">We're currently curating new high-impact sessions. Check back shortly for fresh announcements.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                    {events.map((event, idx) => (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            key={event._id}
                                            className="group bg-white rounded-[2.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)] transition-all duration-500 overflow-hidden border border-gray-100 flex flex-col h-full relative"
                                        >
                                            <div className="h-48 relative overflow-hidden">
                                                {event.image ? (
                                                    <img
                                                        src={event.image}
                                                        alt={event.title}
                                                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                                    />
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full text-gray-100 bg-[#013e38]">
                                                        <FaCalendarAlt className="text-4xl mb-4 opacity-10" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                                <div className="absolute top-4 right-4 bg-white border border-gray-100 p-2.5 rounded-2xl shadow-xl flex flex-col items-center min-w-[55px]">
                                                    <span className="text-[#3bb4a1] text-[9px] font-black uppercase tracking-widest">{new Date(event.date).toLocaleDateString(undefined, { month: 'short' })}</span>
                                                    <span className="text-xl font-black text-gray-900 leading-none mt-1">{new Date(event.date).getDate()}</span>
                                                </div>

                                                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between translate-y-12 group-hover:translate-y-0 transition-transform duration-500">
                                                    <span className="bg-[#3bb4a1] text-[#013e38] px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest">
                                                        {event.credits > 0 ? `${event.credits} Credits` : "Free Access"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="p-6 flex-1 flex flex-col">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="flex items-center text-[9px] font-black uppercase tracking-widest text-[#3bb4a1] bg-[#3bb4a1]/5 px-2.5 py-1 rounded-lg border border-[#3bb4a1]/10">
                                                        <FaClock size={8} className="mr-1.5" />
                                                        {event.startTime}
                                                    </div>
                                                    <div className="flex items-center text-[9px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                                                        <FaMapMarkerAlt size={8} className="mr-1.5" />
                                                        {event.location}
                                                    </div>
                                                </div>

                                                <h3 className="text-xl font-black text-gray-900 mb-2 leading-tight truncate-2 group-hover:text-[#3bb4a1] transition-colors">{event.title}</h3>
                                                <p className="text-gray-400 text-xs mb-6 line-clamp-2 leading-relaxed font-medium">{event.shortDescription || event.description}</p>

                                                <div className="mt-auto">
                                                    <Link
                                                        to={`/events/${event._id}`}
                                                        className="flex items-center justify-center gap-3 w-full bg-[#013e38] hover:bg-[#3bb4a1] text-white py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all no-underline shadow-xl shadow-[#013e38]/10 hover:shadow-[#3bb4a1]/30 hover:-translate-y-1 group/btn"
                                                    >
                                                        Access Details <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="providers-grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {loading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="bg-white rounded-[2rem] p-8 shadow-sm animate-pulse h-96 border border-gray-50"></div>
                                    ))}
                                </div>
                            ) : providers.length === 0 ? (
                                <div className="text-center py-24 bg-white rounded-[3rem] border border-gray-50 shadow-sm max-w-xl mx-auto">
                                    <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 text-gray-200">
                                        {activeTab === "Instant Help" ? <FaBolt size={32} /> : <FaBriefcase size={32} />}
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900 mb-2">Expanding Networks</h3>
                                    <p className="text-gray-400 font-medium">Be the pioneer to offer {activeTab.toLowerCase()} in this category.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                    {providers.map(renderCard)}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
};

export default Utilization;
