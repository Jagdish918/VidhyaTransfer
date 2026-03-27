import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaBolt, FaBriefcase, FaCalendarAlt, FaStar, FaSearch, FaArrowRight, FaClock, FaMapMarkerAlt, FaTimes } from "react-icons/fa";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../../util/UserContext";
import { toast } from "react-toastify";

const Utilization = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { user, setUser } = useUser();
    const tabs = ["Instant Help", "Hire Expert", "Events"];
    const rawTab = searchParams.get("tab");
    const activeTab = tabs.includes(rawTab) ? rawTab : "Instant Help";

    const [providers, setProviders] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Instant help request modal state
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [selectedSkill, setSelectedSkill] = useState("");
    const [requestLoading, setRequestLoading] = useState(false);

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

    const handleInquire = (provider) => {
        setSelectedProvider(provider);
        setSelectedSkill(provider.skillsProficientAt?.[0]?.name || provider.skillsProficientAt?.[0] || "");
    };

    const handleSendRequest = async () => {
        if (!selectedSkill) {
            toast.error("Please select a skill");
            return;
        }

        const rate = selectedProvider?.preferences?.rates?.instantHelp || 0;
        if ((user?.credits || 0) < rate) {
            toast.error(`Insufficient credits. You need ${rate} but have ${user?.credits || 0}.`);
            return;
        }

        setRequestLoading(true);
        try {
            const { data } = await axios.post("/instant-help/request", {
                providerId: selectedProvider._id,
                skill: selectedSkill,
            });
            if (data.success) {
                toast.success("Request sent! Waiting for provider to accept...");
                setUser(prev => ({ ...prev, credits: data.data.learnerCredits }));
                setSelectedProvider(null);
                setSelectedSkill("");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send request");
        } finally {
            setRequestLoading(false);
        }
    };

    const renderCard = (providerUser) => {
        const rate = activeTab === "Instant Help"
            ? providerUser.preferences?.rates?.instantHelp
            : providerUser.preferences?.rates?.freelance;

        const label = activeTab === "Instant Help" ? "Session Rate" : "Project Rate";

        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={providerUser._id}
                className="bg-dark-card rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-dark-border flex flex-col h-full group relative overflow-hidden hover:-translate-y-1"
            >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-bl-[4rem] -mr-4 -mt-4 transition-all duration-500 group-hover:bg-cyan-500/10 group-hover:scale-110" />

                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="relative mb-4">
                        <img
                            src={providerUser.picture || `https://ui-avatars.com/api/?name=${providerUser.name}&background=random`}
                            alt={providerUser.name}
                            className="w-14 h-14 rounded-xl object-cover ring-4 ring-white group-hover:ring-cyan-500/20 transition-all duration-300 shadow-sm"
                        />
                        {activeTab === "Instant Help" && (
                            <div className="absolute -bottom-1 -right-1 bg-cyan-500 text-dark-bg p-1.5 rounded-lg shadow-lg border-2 border-dark-card animate-pulse">
                                <FaBolt className="text-[10px]" />
                            </div>
                        )}
                    </div>

                    <h3 className="text-base font-semibold text-slate-900 group-hover:text-cyan-700 transition-colors line-clamp-1">{providerUser.name}</h3>
                    <p className="text-[11px] text-slate-600 font-medium mb-2">@{providerUser.username}</p>

                    <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-[9px] font-bold mb-4">
                        <FaStar size={8} />
                        <span>{providerUser.rating || "New Talent"}</span>
                    </div>

                    <div className="flex flex-wrap justify-center gap-2 mb-5 w-full">
                        {providerUser.skillsProficientAt?.slice(0, 3).map((skill, idx) => (
                            <span key={idx} className="bg-white text-slate-700 text-[11px] px-2.5 py-1 rounded-lg font-medium border border-dark-border group-hover:border-cyan-500/30 group-hover:text-cyan-700 transition-colors">
                                {skill.name || skill}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="mt-auto pt-4 border-t border-dark-border flex justify-between items-center relative z-10">
                    <div>
                        <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest leading-none mb-1">{label}</p>
                        <p className="text-cyan-700 font-black text-base">{rate || 0}<span className="text-[10px] ml-1 font-bold text-slate-600">Credits</span></p>
                    </div>
                    {activeTab === "Instant Help" ? (
                        <button
                            onClick={() => handleInquire(providerUser)}
                            className="bg-cyan-500 text-dark-bg text-[9px] uppercase font-black tracking-widest px-5 py-2.5 rounded-xl hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/20 transition-all hover:-translate-y-0.5 border-0 cursor-pointer"
                        >
                            Inquire
                        </button>
                    ) : (
                        <Link
                            to={`/profile/${providerUser.username}`}
                            className="bg-cyan-500 text-dark-bg text-[9px] uppercase font-black tracking-widest px-5 py-2.5 rounded-xl hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/20 transition-all no-underline hover:-translate-y-0.5"
                        >
                            Inquire
                        </Link>
                    )}
                </div>
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen bg-dark-bg pt-6 pb-16 font-sans">
            <div className="max-w-[1280px] mx-auto px-6">

                {/* Header Content */}
                <div className="text-center mb-6 animate-fade-in">
                    <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-3 leading-tight tracking-tight">
                        Power your <span className="text-cyan-700">growth</span>
                    </h1>
                    <p className="text-slate-600 max-w-2xl mx-auto text-base">
                        Access specialized support, collaborate with masters, and attend high-impact community events.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex justify-center mb-8 animate-fade-in">
                    <div className="bg-dark-card p-1.5 rounded-[2rem] shadow-card border border-dark-border flex flex-wrap justify-center gap-1">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => { setSearchParams({ tab }); setSearch(""); }}
                                className={`px-6 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2.5 ${activeTab === tab
                                    ? "bg-cyan-500 text-dark-bg shadow-lg shadow-cyan-500/20"
                                    : "text-slate-600 hover:text-cyan-700 hover:bg-dark-hover"
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
                    <div className="max-w-xl mx-auto mb-10 relative group animate-fade-in">
                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none transition-colors">
                            <FaSearch className="text-slate-600 group-focus-within:text-cyan-700 scale-90" />
                        </div>
                        <input
                            type="text"
                            placeholder={`Filter ${activeTab.toLowerCase()} by skills or name...`}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="block w-full pl-12 pr-6 py-3.5 border border-dark-border rounded-[2rem] bg-dark-card text-slate-900 focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all shadow-sm placeholder:text-slate-600 text-sm"
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {[1, 2, 3, 4].map(i => <div key={i} className="bg-dark-card h-96 rounded-2xl shadow-card animate-pulse border border-dark-border"></div>)}
                                </div>
                            ) : events.length === 0 ? (
                                <div className="bg-dark-card rounded-[3rem] p-20 text-center border-2 border-dashed border-dark-border max-w-2xl mx-auto flex flex-col items-center">
                                    <div className="w-24 h-24 bg-dark-bg rounded-full flex items-center justify-center mb-8 text-slate-600 border border-dark-border">
                                        <FaCalendarAlt size={32} />
                                    </div>
                                    <h3 className="text-2xl font-semibold text-slate-900 mb-4 tracking-tight">No events yet</h3>
                                    <p className="text-slate-600 mb-0 leading-relaxed">We're currently curating new sessions. Check back shortly for fresh announcements.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {events.map((event, idx) => (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            key={event._id}
                                            className="group bg-dark-card rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden border border-dark-border flex flex-col h-full relative hover:-translate-y-1"
                                        >
                                            <div className="h-48 relative overflow-hidden">
                                                {event.image ? (
                                                    <img src={event.image} alt={event.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full text-slate-800 bg-dark-bg border-b border-dark-border">
                                                        <FaCalendarAlt className="text-4xl mb-4 opacity-30" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/90 via-dark-bg/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                <div className="absolute top-4 right-4 bg-dark-card border border-dark-border p-2.5 rounded-2xl shadow-xl flex flex-col items-center min-w-[55px]">
                                                    <span className="text-cyan-400 text-[9px] font-black uppercase tracking-widest">{new Date(event.date).toLocaleDateString(undefined, { month: 'short' })}</span>
                                                    <span className="text-xl font-black text-slate-900 leading-none mt-1">{new Date(event.date).getDate()}</span>
                                                </div>
                                                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between translate-y-12 group-hover:translate-y-0 transition-transform duration-500">
                                                    <span className="bg-cyan-500 text-dark-bg px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm">
                                                        {event.credits > 0 ? `${event.credits} Credits` : "Free Access"}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-6 flex-1 flex flex-col bg-dark-card">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="flex items-center text-[9px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                                                        <FaClock size={8} className="mr-1.5" />{event.startTime}
                                                    </div>
                                                    <div className="flex items-center text-[9px] font-black uppercase tracking-widest text-slate-600 bg-dark-bg px-2.5 py-1 rounded-lg border border-dark-border">
                                                        <FaMapMarkerAlt size={8} className="mr-1.5" />{event.location}
                                                    </div>
                                                </div>
                                                <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight truncate-2 group-hover:text-cyan-700 transition-colors">{event.title}</h3>
                                                <p className="text-slate-600 text-sm mb-6 line-clamp-2 leading-relaxed">{event.shortDescription || event.description}</p>
                                                <div className="mt-auto">
                                                    <Link
                                                        to={`/events/${event._id}`}
                                                        className="flex items-center justify-center gap-3 w-full bg-cyan-500 hover:bg-cyan-400 text-dark-bg py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all no-underline shadow-lg shadow-cyan-500/20 hover:-translate-y-0.5 group/btn"
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="bg-dark-card rounded-2xl p-8 shadow-card animate-pulse h-96 border border-dark-border"></div>
                                    ))}
                                </div>
                            ) : providers.length === 0 ? (
                                <div className="text-center py-24 bg-dark-card rounded-[3rem] border border-dark-border shadow-card max-w-xl mx-auto">
                                    <div className="bg-dark-bg border border-dark-border rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 text-slate-600 shadow-inner">
                                        {activeTab === "Instant Help" ? <FaBolt size={32} /> : <FaBriefcase size={32} />}
                                    </div>
                                    <h3 className="text-2xl font-semibold text-slate-900 mb-2 tracking-tight">No providers yet</h3>
                                    <p className="text-slate-600 text-base">Be the pioneer to offer {activeTab.toLowerCase()} in this category.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {providers.map(renderCard)}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Instant Help Request Modal */}
                <AnimatePresence>
                    {selectedProvider && activeTab === "Instant Help" && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => { setSelectedProvider(null); setSelectedSkill(""); }}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
                            >
                                {/* Modal Header */}
                                <div className="bg-gradient-to-r from-cyan-600 to-cyan-500 px-6 py-5 text-white relative">
                                    <button
                                        onClick={() => { setSelectedProvider(null); setSelectedSkill(""); }}
                                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors border-0 text-white cursor-pointer"
                                    >
                                        <FaTimes size={14} />
                                    </button>
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={selectedProvider.picture || `https://ui-avatars.com/api/?name=${selectedProvider.name}&background=random`}
                                            alt={selectedProvider.name}
                                            className="w-12 h-12 rounded-xl object-cover border-2 border-white/30"
                                        />
                                        <div>
                                            <h2 className="text-lg font-bold flex items-center gap-2">
                                                <FaBolt size={14} /> Instant Help
                                            </h2>
                                            <p className="text-cyan-200 text-sm">with {selectedProvider.name}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Modal Body */}
                                <div className="p-6 space-y-5">
                                    {/* Skill Selection */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                                            Select a skill you need help with
                                        </label>
                                        <select
                                            value={selectedSkill}
                                            onChange={(e) => setSelectedSkill(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-cyan-200 focus:border-cyan-300 outline-none transition-all"
                                        >
                                            <option value="">Select a skill</option>
                                            {selectedProvider.skillsProficientAt?.map((s, i) => (
                                                <option key={i} value={s.name || s}>
                                                    {s.name || s} {s.proficiency ? `(${s.proficiency})` : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Cost Summary */}
                                    <div className="bg-gradient-to-r from-cyan-50 to-slate-50 rounded-xl p-4 border border-cyan-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-slate-600">Session Rate</span>
                                            <span className="text-sm font-bold text-slate-900">
                                                {selectedProvider.preferences?.rates?.instantHelp || 0} credits
                                            </span>
                                        </div>
                                        <div className="border-t border-cyan-100 pt-2 mt-2 flex items-center justify-between">
                                            <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider">Your Balance</span>
                                            <span className={`text-sm font-bold ${
                                                (user?.credits || 0) >= (selectedProvider.preferences?.rates?.instantHelp || 0)
                                                    ? "text-emerald-600"
                                                    : "text-red-600"
                                            }`}>
                                                {user?.credits || 0} credits
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                                            Credits will be held in escrow. They transfer to the provider only when the session ends.
                                        </p>
                                    </div>

                                    {/* Send Request Button */}
                                    <button
                                        onClick={handleSendRequest}
                                        disabled={
                                            requestLoading ||
                                            !selectedSkill ||
                                            (user?.credits || 0) < (selectedProvider.preferences?.rates?.instantHelp || 0)
                                        }
                                        className="w-full py-3 bg-cyan-600 text-white text-sm font-bold rounded-xl hover:bg-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md border-0 cursor-pointer"
                                    >
                                        {requestLoading ? "Sending Request..." : "Send Instant Help Request"}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
};

export default Utilization;
