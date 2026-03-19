import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaCalendarAlt,
    FaClock,
    FaMapMarkerAlt,
    FaUsers,
    FaCheck,
    FaShareAlt,
    FaRegCalendarPlus,
    FaBolt,
    FaArrowLeft,
    FaEnvelope,
    FaChevronRight,
    FaGlobe
} from "react-icons/fa";
import { useUser } from "../../util/UserContext";

const EventDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, setUser } = useUser();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        fetchEvent();
    }, [id]);

    useEffect(() => {
        if (!event) return;
        const timer = setInterval(() => {
            const now = new Date();
            const distance = new Date(event.date).getTime() - now.getTime();
            if (distance < 0) {
                clearInterval(timer);
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            } else {
                setTimeLeft({
                    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((distance % (1000 * 60)) / 1000)
                });
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [event]);

    const fetchEvent = async () => {
        try {
            const { data } = await axios.get(`/events/${id}`);
            if (data.success) {
                setEvent(data.data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load event details");
            navigate("/utilisation");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!event) return;

        if (event.credits > 0) {
            if (!window.confirm(`This event costs ${event.credits} credits. Do you want to proceed?`)) return;
        }

        setRegistering(true);
        try {
            const { data } = await axios.post(`/events/${id}/register`);
            if (data.success) {
                toast.success("Successfully registered for the event!");
                setEvent(prev => ({
                    ...prev,
                    participants: [...prev.participants, user._id]
                }));
                if (data.data.remainingCredits !== undefined) {
                    setUser(prev => ({ ...prev, credits: data.data.remainingCredits }));
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Registration failed");
        } finally {
            setRegistering(false);
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.info("Link copied to clipboard!");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center bg-dark-bg">
                <div className="relative w-24 h-24 mb-4">
                    <div className="absolute inset-0 rounded-full border-4 border-cyan-500/10"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin"></div>
                </div>
                <p className="text-cyan-400 font-black tracking-[0.2em] uppercase text-xs">Preparing Experience</p>
            </div>
        );
    }

    if (!event) return null;

    const isRegistered = event.participants?.includes(user?._id);
    const isFull = event.participants?.length >= event.maxParticipants;
    const eventDate = new Date(event.date);

    return (
        <div className="min-h-screen bg-dark-bg text-slate-900 selection:bg-cyan-500/20 font-sans">
            {/* Hero Section */}
            <div className="relative h-[70vh] w-full overflow-hidden">
                {/* Background Image with Parallax-like effect */}
                <motion.div
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1.5 }}
                    className="absolute inset-0"
                >
                    {event.image ? (
                        <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-dark-card to-dark-bg" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/80 to-transparent" />
                </motion.div>

                {/* Hero Content */}
                <div className="absolute inset-0 flex flex-col justify-end pb-12 px-6 sm:px-8">
                    <div className="max-w-7xl mx-auto w-full">
                        <motion.button
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            onClick={() => navigate("/utilisation")}
                            className="flex items-center text-slate-600 hover:text-cyan-400 mb-8 transition-colors group bg-dark-card/50 backdrop-blur-md px-6 py-2.5 rounded-full border border-dark-border shadow-sm"
                        >
                            <FaArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[10px] font-black tracking-widest uppercase">Discover More Events</span>
                        </motion.button>

                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                            <div className="max-w-3xl">
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="flex flex-wrap gap-2 mb-4"
                                >
                                    {event.tags?.map((tag, idx) => (
                                        <span key={idx} className="bg-dark-card/60 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black text-cyan-400 border border-dark-border uppercase tracking-widest shadow-sm">
                                            {tag}
                                        </span>
                                    ))}
                                    <span className="bg-cyan-500 px-4 py-1.5 rounded-full text-[10px] font-black text-dark-bg uppercase tracking-widest shadow-lg shadow-cyan-500/20">
                                        {event.credits > 0 ? `${event.credits} Credits` : "Free"}
                                    </span>
                                </motion.div>

                                <motion.h1
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-[1.1] tracking-tight text-slate-900 drop-shadow-sm"
                                >
                                    {event.title}
                                </motion.h1>

                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="flex flex-wrap gap-8 text-[10px] font-black uppercase tracking-[0.15em] text-slate-600"
                                >
                                    <div className="flex items-center group">
                                        <div className="w-8 h-8 rounded-lg bg-dark-bg border border-dark-border shadow-sm flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                                            <FaCalendarAlt className="text-cyan-400" />
                                        </div>
                                        <span>{eventDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                    </div>
                                    <div className="flex items-center group">
                                        <div className="w-8 h-8 rounded-lg bg-dark-bg border border-dark-border shadow-sm flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                                            <FaClock className="text-cyan-400" />
                                        </div>
                                        <span>{event.startTime} - {event.endTime}</span>
                                    </div>
                                    <div className="flex items-center group">
                                        <div className="w-8 h-8 rounded-lg bg-dark-bg border border-dark-border shadow-sm flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                                            <FaMapMarkerAlt className="text-cyan-400" />
                                        </div>
                                        <span>{event.location}</span>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Countdown Tile */}
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.5, type: "spring" }}
                                className="hidden lg:flex gap-6 p-8 bg-dark-card/80 backdrop-blur-xl rounded-[2.5rem] border border-dark-border shadow-card"
                            >
                                <div className="text-center min-w-[70px]">
                                    <p className="text-3xl font-black text-cyan-400 leading-none mb-2">{timeLeft.days}</p>
                                    <p className="text-[10px] uppercase tracking-widest text-slate-600 font-black">Days</p>
                                </div>
                                <div className="text-center min-w-[70px] border-l border-dark-border pl-6">
                                    <p className="text-3xl font-black text-slate-900 leading-none mb-2">{timeLeft.hours}</p>
                                    <p className="text-[10px] uppercase tracking-widest text-slate-600 font-black">Hours</p>
                                </div>
                                <div className="text-center min-w-[70px] border-l border-dark-border pl-6">
                                    <p className="text-3xl font-black text-slate-900 leading-none mb-2">{timeLeft.minutes}</p>
                                    <p className="text-[10px] uppercase tracking-widest text-slate-600 font-black">Mins</p>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-7xl mx-auto px-6 sm:px-8 py-16 -mt-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Main Content */}
                    <div className="lg:col-span-8 space-y-12">

                        {/* Description */}
                        <section className="bg-dark-card p-10 rounded-[2.5rem] border border-dark-border shadow-card relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
                            <h2 className="text-2xl font-black mb-8 flex items-center text-slate-900">
                                <span className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center mr-4 border border-cyan-500/20">
                                    <FaBolt className="text-cyan-400 text-sm" />
                                </span>
                                Event Overview
                            </h2>
                            <div className="max-w-none text-slate-700 leading-relaxed text-lg font-medium space-y-4">
                                {event.description.split('\n').map((para, i) => (
                                    <p key={i}>{para}</p>
                                ))}
                            </div>
                        </section>

                        {/* Outcomes */}
                        {event.learningOutcomes?.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-black mb-8 text-slate-900">What You'll Achieve</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {event.learningOutcomes.map((outcome, index) => (
                                        <motion.div
                                            key={index}
                                            whileHover={{ y: -5 }}
                                            className="flex items-start bg-dark-card p-6 rounded-[2rem] border border-dark-border shadow-sm transition-all hover:shadow-cyan-500/10 group"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-dark-bg border border-dark-border flex items-center justify-center mr-4 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30 transition-colors shrink-0">
                                                <FaCheck className="text-cyan-400 transition-colors" />
                                            </div>
                                            <span className="text-slate-800 font-bold pt-1 leading-snug">{outcome}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Host Profile */}
                        <section className="bg-dark-card p-10 rounded-[2.5rem] border border-cyan-500/20 shadow-card overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-bl-[10rem] -mr-20 -mt-20" />
                            <p className="text-cyan-400 font-black text-[10px] uppercase tracking-[0.25em] mb-10 relative z-10">Hosted By</p>
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-10 relative z-10">
                                <div className="relative">
                                    <img
                                        src={event.createdBy?.picture || `https://ui-avatars.com/api/?name=${event.createdBy?.name}&background=3bb4a1&color=fff`}
                                        alt={event.createdBy?.name}
                                        className="w-24 h-24 md:w-36 md:h-36 rounded-[2.5rem] object-cover ring-8 ring-dark-bg shadow-2xl"
                                    />
                                    <div className="absolute -bottom-2 -right-2 bg-cyan-500 text-dark-bg p-2.5 rounded-2xl shadow-xl border-4 border-dark-card">
                                        <FaCheck size={14} />
                                    </div>
                                </div>
                                <div className="text-center md:text-left flex-1">
                                    <h3 className="text-3xl font-black mb-2 text-slate-900">{event.createdBy?.name || "Community Leader"}</h3>
                                    <p className="text-cyan-400 font-black text-xs uppercase tracking-widest mb-6">Master Mentor @ Vidhya</p>
                                    <p className="text-slate-600 mb-8 max-w-xl text-lg font-medium leading-relaxed italic">
                                        "{event.createdBy?.bio || "Expert instructor dedicated to community growth and skill development. Join this session to gain industry-leading insights."}"
                                    </p>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                        <button className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-cyan-400 transition-colors group">
                                            <div className="w-10 h-10 rounded-xl bg-dark-bg border border-dark-border flex items-center justify-center group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30 transition-colors">
                                                <FaEnvelope />
                                            </div>
                                            Contact
                                        </button>
                                        <button className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-cyan-400 transition-colors group">
                                            <div className="w-10 h-10 rounded-xl bg-dark-bg border border-dark-border flex items-center justify-center group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30 transition-colors">
                                                <FaGlobe />
                                            </div>
                                            Website
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit space-y-6">
                        {/* Registration Card */}
                        <div className="bg-dark-card/80 backdrop-blur-2xl border border-dark-border rounded-[3rem] p-10 shadow-card overflow-hidden relative group">
                            {/* Decorative element */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-cyan-500/10 transition-all duration-700" />

                            <div className="relative z-10">
                                <div className="flex justify-between items-center mb-10">
                                    <div>
                                        <p className="text-slate-600 text-[10px] uppercase font-black tracking-[0.2em] mb-2">Standard Entry</p>
                                        <h3 className="text-5xl font-black text-slate-900">{event.credits > 0 ? `${event.credits}` : "Free"}<span className="text-sm font-bold text-slate-600 ml-2 uppercase tracking-widest">{event.credits > 0 ? "Credits" : ""}</span></h3>
                                    </div>
                                    {isRegistered && <div className="bg-cyan-500/10 text-cyan-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-cyan-500/30">Verified</div>}
                                </div>

                                <motion.button
                                    whileHover={!isRegistered && !isFull && !registering ? { scale: 1.02, y: -2 } : {}}
                                    whileTap={!isRegistered && !isFull && !registering ? { scale: 0.98 } : {}}
                                    onClick={handleRegister}
                                    disabled={isRegistered || isFull || registering}
                                    className={`w-full py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all mb-8 relative overflow-hidden group/btn ${isRegistered
                                        ? "bg-dark-bg text-cyan-400 border border-cyan-500/30 cursor-default shadow-sm"
                                        : isFull
                                            ? "bg-dark-bg text-slate-600 cursor-not-allowed border border-dark-border shadow-sm"
                                            : "bg-cyan-500 text-dark-bg shadow-xl shadow-cyan-500/20 hover:bg-cyan-400 hover:shadow-cyan-500/40"
                                        }`}
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-3">
                                        {registering ? "Updating Registry..." : isRegistered ? "In Your Schedule" : isFull ? "Capacity Reached" : "Join the session"}
                                        {!isRegistered && !isFull && !registering && <FaArrowRight />}
                                    </span>
                                </motion.button>

                                <div className="space-y-6 mb-10">
                                    <div className="flex items-center group/item cursor-default">
                                        <div className="w-12 h-12 rounded-2xl bg-dark-bg border border-dark-border flex items-center justify-center mr-5 group-hover/item:border-cyan-500/30 transition-colors">
                                            <FaUsers className="text-cyan-400" size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-black text-slate-600 tracking-widest">Current Occupancy</p>
                                            <p className="text-base font-black text-slate-900">{event.participants?.length || 0} / {event.maxParticipants} <span className="text-slate-600 text-[10px] ml-1 uppercase font-bold">Attendees</span></p>
                                        </div>
                                    </div>
                                    <div className="flex items-center group/item cursor-default">
                                        <div className="w-12 h-12 rounded-2xl bg-dark-bg border border-dark-border flex items-center justify-center mr-5 group-hover/item:border-cyan-500/30 transition-colors">
                                            <FaMapMarkerAlt className="text-cyan-400" size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-black text-slate-600 tracking-widest">Location</p>
                                            <p className="text-base font-black text-slate-900 truncate max-w-[200px]">{event.location}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleShare}
                                        className="flex-1 bg-dark-bg hover:bg-cyan-500/10 text-slate-600 hover:text-cyan-400 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border border-dark-border hover:border-cyan-500/30 transition-all flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        <FaShareAlt size={12} />
                                        <span>Share</span>
                                    </button>
                                    <button className="flex-1 bg-dark-bg hover:bg-cyan-500/10 text-slate-600 hover:text-cyan-400 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border border-dark-border hover:border-cyan-500/30 transition-all flex items-center justify-center gap-2 shadow-sm">
                                        <FaRegCalendarPlus size={12} />
                                        <span>Save</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Additional Info Cards */}
                        <div className="bg-dark-card border border-dark-border rounded-[2.5rem] p-8 shadow-card">
                            <h4 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-3 text-slate-900">
                                <span className="w-2 h-2 bg-cyan-500 rounded-full inline-block animate-pulse" />
                                Community Rules
                            </h4>
                            <ul className="space-y-4">
                                {[
                                    "Arrive 5 mins prior to start",
                                    "Keep environment professional",
                                    "Zero tolerance for toxicity",
                                    "Refund policy: Non-refundable"
                                ].map((rule, idx) => (
                                    <li key={idx} className="text-[10px] font-bold text-slate-600 flex items-center gap-4 uppercase tracking-widest">
                                        <FaChevronRight className="text-cyan-400 text-[8px]" />
                                        {rule}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Mobile Bar */}
            <AnimatePresence>
                {!isRegistered && !isFull && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="lg:hidden fixed bottom-0 inset-x-0 p-6 bg-dark-card/90 backdrop-blur-2xl border-t border-dark-border z-[100] flex items-center justify-between shadow-card"
                    >
                        <div>
                            <p className="text-[10px] uppercase font-black text-slate-600 tracking-[0.2em] mb-1">Standard Entry</p>
                            <p className="text-2xl font-black text-slate-900">{event.credits > 0 ? `${event.credits} Cr` : "Free Access"}</p>
                        </div>
                        <button
                            onClick={handleRegister}
                            disabled={registering}
                            className="bg-cyan-500 text-dark-bg px-8 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
                        >
                            {registering ? "..." : "Secure Seat"}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EventDetails;
