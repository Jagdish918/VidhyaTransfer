import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {
    FaCalendarAlt,
    FaClock,
    FaMapMarkerAlt,
    FaUsers,
    FaCheck,
    FaShareAlt,
    FaRegCalendarPlus,
    FaBolt,
    FaArrowLeft
} from "react-icons/fa";
import { useUser } from "../../util/UserContext";

const EventDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, setUser } = useUser();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);

    useEffect(() => {
        fetchEvent();
    }, [id]);

    const fetchEvent = async () => {
        try {
            const { data } = await axios.get(`/events/${id}`);
            if (data.success) {
                setEvent(data.data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load event details");
            navigate("/utilisation"); // Redirect back if not found
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!event) return;

        // Confirmation
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
                // Update user credits in context if returned
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

    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!event) return null;

    const isRegistered = event.participants?.includes(user?._id);
    const isFull = event.participants?.length >= event.maxParticipants;
    const eventDate = new Date(event.date);

    return (
        <div className="min-h-screen bg-gray-50 py-10 font-['Montserrat']">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Back Button */}
                <button
                    onClick={() => navigate("/utilisation")}
                    className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors font-medium"
                >
                    <FaArrowLeft className="mr-2" /> Back to Events
                </button>

                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-10">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">{event.title}</h1>
                    <p className="text-lg text-gray-600">{event.shortDescription || event.description.substring(0, 100) + "..."}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column - Content */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Main Image */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-64 md:h-96 relative">
                            {event.image ? (
                                <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                                    <FaCalendarAlt size={64} opacity={0.3} />
                                </div>
                            )}
                        </div>

                        {/* About This Event */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">About This Event</h2>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{event.description}</p>
                        </div>

                        {/* What You'll Learn */}
                        {event.learningOutcomes && event.learningOutcomes.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">What You'll Learn</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {event.learningOutcomes.map((outcome, index) => (
                                        <div key={index} className="flex items-start">
                                            <FaCheck className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                                            <span className="text-gray-700">{outcome}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Instructor */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Your Instructor</h2>
                            <div className="flex items-center gap-6">
                                <img
                                    src={event.createdBy?.picture || "https://ui-avatars.com/api/?background=random"}
                                    alt={event.createdBy?.name}
                                    className="w-20 h-20 rounded-full object-cover border-4 border-gray-50"
                                />
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{event.createdBy?.name || "Unknown Instructor"}</h3>
                                    <p className="text-sm text-gray-500 mb-2">{event.createdBy?.role === 'admin' ? 'Community Manager' : 'Instructor'}</p>
                                    <p className="text-gray-600 text-sm line-clamp-2 max-w-md">{event.createdBy?.bio || "Experienced mentor and community contributor."}</p>
                                </div>
                                <button className="ml-auto text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors hidden sm:block">
                                    View Profile
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="lg:col-span-1 space-y-6">

                        {/* Registration Card */}
                        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 sticky top-24">
                            <div className="text-center mb-6">
                                <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-1">Price</p>
                                <h2 className="text-3xl font-extrabold text-gray-900">
                                    {event.credits > 0 ? `${event.credits} Credits` : "Free"}
                                </h2>
                            </div>

                            <button
                                onClick={handleRegister}
                                disabled={isRegistered || isFull || registering}
                                className={`w-full py-3.5 rounded-xl font-bold text-lg mb-6 shadow-lg transition-all transform active:scale-95 ${isRegistered
                                    ? "bg-green-100 text-green-700 cursor-default shadow-none"
                                    : isFull
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200"
                                    }`}
                            >
                                {registering ? "Processing..." : isRegistered ? "You're Registered!" : isFull ? "Event Full" : "Register Now"}
                            </button>

                            <div className="space-y-4 text-sm text-gray-600 border-t border-gray-100 pt-6">
                                <div className="flex items-center">
                                    <FaCalendarAlt className="w-5 text-gray-400 mr-3" />
                                    <span>{eventDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                                <div className="flex items-center">
                                    <FaClock className="w-5 text-gray-400 mr-3" />
                                    <span>{event.startTime} - {event.endTime}</span>
                                </div>
                                <div className="flex items-center">
                                    <FaMapMarkerAlt className="w-5 text-gray-400 mr-3" />
                                    <span>{event.location}</span>
                                </div>
                                <div className="flex items-center">
                                    <FaUsers className="w-5 text-gray-400 mr-3" />
                                    <span>Max {event.maxParticipants} participants ({event.participants?.length || 0} joined)</span>
                                </div>
                            </div>

                            {/* Tags */}
                            {event.tags && event.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-gray-100">
                                    {event.tags.map((tag, idx) => (
                                        <span key={idx} className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-semibold">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-3 mt-6">
                                <button className="flex items-center justify-center px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                                    <FaRegCalendarPlus className="mr-2" /> Calendar
                                </button>
                                <button className="flex items-center justify-center px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                                    <FaShareAlt className="mr-2" /> Share
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetails;
