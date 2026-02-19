import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaPlus, FaCalendarAlt, FaTrash } from 'react-icons/fa';

const Events = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [creating, setCreating] = useState(false);

    const [editingId, setEditingId] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        shortDescription: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        location: '',
        credits: 0,
        maxParticipants: 50,
        tags: '',     // Comma separated in UI
        learningOutcomes: '', // New line separated in UI
        link: '',
        image: ''
    });

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/events/all');
            if (data.success) {
                setEvents(data.data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch events");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '', shortDescription: '', description: '', date: '', startTime: '', endTime: '',
            location: '', credits: 0, maxParticipants: 50, tags: '', learningOutcomes: '', link: '', image: ''
        });
        setEditingId(null);
    };

    const handleEdit = (event) => {
        setFormData({
            title: event.title,
            shortDescription: event.shortDescription || '',
            description: event.description,
            date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
            startTime: event.startTime,
            endTime: event.endTime,
            location: event.location,
            credits: event.credits,
            maxParticipants: event.maxParticipants,
            tags: event.tags ? event.tags.join(', ') : '',
            learningOutcomes: event.learningOutcomes ? event.learningOutcomes.join('\n') : '',
            link: event.link || '',
            image: event.image || ''
        });
        setEditingId(event._id);
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            // Process tags and learning outcomes
            const payload = {
                ...formData,
                tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
                learningOutcomes: formData.learningOutcomes.split('\n').map(l => l.trim()).filter(l => l)
            };

            let response;
            if (editingId) {
                // Update
                response = await axios.put(`/events/${editingId}`, payload);
            } else {
                // Create
                response = await axios.post('/events', payload);
            }

            if (response.data.success) {
                toast.success(`Event ${editingId ? 'updated' : 'created'} successfully`);
                setShowModal(false);
                resetForm();
                fetchEvents();
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || `Failed to ${editingId ? 'update' : 'create'} event`);
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this event?")) return;
        try {
            await axios.delete(`/events/${id}`);
            toast.success("Event deleted");
            setEvents(events.filter(e => e._id !== id));
        } catch (error) {
            toast.error("Failed to delete event");
        }
    };

    const filteredEvents = events.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Events Management</h1>
                    <p className="text-gray-500 text-sm mt-1">Create and manage community events</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <input
                            type="text"
                            placeholder="Search events..."
                            className="w-full pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <FaCalendarAlt className="absolute left-3 top-3 text-gray-400" />
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 font-medium"
                    >
                        <FaPlus /> Create Event
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white h-72 rounded-2xl shadow-sm animate-pulse border border-gray-100"></div>
                    ))}
                </div>
            ) : filteredEvents.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <FaCalendarAlt size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">No events found</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mt-2">Get started by creating your first community event.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.map(event => (
                        <div key={event._id} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full">
                            <div className="h-48 bg-gray-50 relative overflow-hidden">
                                {event.image ? (
                                    <img
                                        src={event.image}
                                        alt={event.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-300">
                                        <FaCalendarAlt className="text-4xl mb-2" />
                                        <span className="text-xs font-medium">No Image</span>
                                    </div>
                                )}
                                <div className="absolute top-3 right-3">
                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full backdrop-blur-sm shadow-sm ${new Date(event.date) > new Date()
                                        ? 'bg-white/90 text-green-700'
                                        : 'bg-gray-800/80 text-white'
                                        }`}>
                                        {new Date(event.date) > new Date() ? 'Upcoming' : 'Past'}
                                    </span>
                                </div>
                            </div>

                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="font-bold text-lg text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors mb-1">{event.title}</h3>
                                <p className="text-xs text-blue-600 font-medium mb-3">{event.location} • {event.startTime}</p>
                                <p className="text-gray-600 text-sm line-clamp-3 mb-5 flex-1">{event.shortDescription || event.description}</p>

                                <div className="pt-4 border-t border-gray-50 flex items-center justify-between mt-auto">
                                    <div className="flex items-center text-xs text-gray-500 gap-3">
                                        <span title="Participants">👥 {event.participants?.length || 0}/{event.maxParticipants}</span>
                                        <span title="Cost">💰 {event.credits} Cr</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(event)}
                                            className="text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors"
                                            title="Edit Event"
                                        >
                                            <FaPlus className="transform rotate-45" size={14} />
                                            {/* Using rotated plus as makeshift edit icon since I want to avoid adding imports if possible, but actually FaEdit is better. */}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(event._id)}
                                            className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                                            title="Delete Event"
                                        >
                                            <FaTrash size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                            <h2 className="text-lg font-bold text-gray-800">{editingId ? 'Edit Event' : 'Create New Event'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">✕</button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <form onSubmit={handleSave} className="space-y-4">

                                {/* Basic Info */}
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="label">Event Title *</label>
                                        <input type="text" required className="input-field" placeholder="e.g. React Workshop 2024"
                                            value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="label">Short Description *</label>
                                        <input type="text" required className="input-field" placeholder="Brief summary for cards (max 100 chars)"
                                            value={formData.shortDescription} onChange={e => setFormData({ ...formData, shortDescription: e.target.value })} />
                                    </div>
                                </div>

                                {/* Date & Time */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="label">Date *</label>
                                        <input type="date" required className="input-field"
                                            value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="label">Start Time *</label>
                                        <input type="time" required className="input-field"
                                            value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="label">End Time *</label>
                                        <input type="time" required className="input-field"
                                            value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} />
                                    </div>
                                </div>

                                {/* Location & Link */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Location *</label>
                                        <input type="text" required className="input-field" placeholder="e.g. Room 204 or Google Meet"
                                            value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="label">External Link (Optional)</label>
                                        <input type="text" className="input-field" placeholder="https://..."
                                            value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })} />
                                    </div>
                                </div>

                                {/* Logistics */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="label">Credits Cost *</label>
                                        <input type="number" min="0" required className="input-field"
                                            value={formData.credits} onChange={e => setFormData({ ...formData, credits: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="label">Max Participants *</label>
                                        <input type="number" min="1" required className="input-field"
                                            value={formData.maxParticipants} onChange={e => setFormData({ ...formData, maxParticipants: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="label">Tags (comma sep)</label>
                                        <input type="text" className="input-field" placeholder="e.g. tech, design"
                                            value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} />
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="label">Full Description *</label>
                                    <textarea required rows={4} className="input-field resize-none" placeholder="Detailed event information..."
                                        value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                </div>

                                {/* Outcomes */}
                                <div>
                                    <label className="label">Learning Outcomes (one per line)</label>
                                    <textarea rows={3} className="input-field resize-none" placeholder="- Learn usage of hooks..."
                                        value={formData.learningOutcomes} onChange={e => setFormData({ ...formData, learningOutcomes: e.target.value })} />
                                </div>

                                {/* Image */}
                                <div>
                                    <label className="label">Image URL (Optional)</label>
                                    <input type="text" className="input-field" placeholder="https://..."
                                        value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} />
                                </div>

                                <div className="pt-4 flex gap-3 shrink-0">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={creating} className="btn-primary flex-1">
                                        {creating ? (editingId ? "Updating..." : "Creating...") : (editingId ? "Update Event" : "Publish Event")}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .label { display: block; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 0.25rem; margin-left: 0.25rem; }
                .input-field { width: 100%; border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 0.625rem 1rem; font-size: 0.875rem; transition: all 0.2s; outline: none; }
                .input-field:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.1); }
                .btn-secondary { padding: 0.625rem 1rem; border-radius: 0.75rem; font-weight: 500; font-size: 0.875rem; color: #374151; background-color: #f9fafb; transition: all 0.2s; }
                .btn-secondary:hover { background-color: #f3f4f6; }
                .btn-primary { padding: 0.625rem 1rem; border-radius: 0.75rem; font-weight: 500; font-size: 0.875rem; color: white; background-color: #2563eb; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(37,99,235,0.2); }
                .btn-primary:hover { background-color: #1d4ed8; }
                .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
            `}</style>
        </div>
    );
};

export default Events;
