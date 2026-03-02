import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaPlus, FaCalendarAlt, FaTrash, FaEdit, FaSearch, FaMapMarkerAlt, FaClock, FaTicketAlt, FaUsers, FaImage, FaLink, FaListUl, FaLayerGroup } from 'react-icons/fa';

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
        tags: '',
        learningOutcomes: '',
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
            const payload = {
                ...formData,
                tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
                learningOutcomes: formData.learningOutcomes.split('\n').map(l => l.trim()).filter(l => l)
            };

            let response;
            if (editingId) {
                response = await axios.put(`/events/${editingId}`, payload);
            } else {
                response = await axios.post('/events', payload);
            }

            if (response.data.success) {
                toast.success(`Event ${editingId ? 'updated' : 'published'} successfully`);
                setShowModal(false);
                resetForm();
                fetchEvents();
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || `Failed to ${editingId ? 'update' : 'publish'} event`);
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Permanent action: Delete this event and all associated registrations?")) return;
        try {
            await axios.delete(`/events/${id}`);
            toast.success("Event permanently removed");
            setEvents(events.filter(e => e._id !== id));
        } catch (error) {
            toast.error("Deletion failed");
        }
    };

    const filteredEvents = events.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
            <ToastContainer position="bottom-right" theme="colored" />

            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Events Hub</h1>
                    <p className="text-gray-500 font-medium">Architecting community experiences & workshops.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                    <div className="relative flex-1 sm:w-80 group">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Find event by title or location..."
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl transition-all shadow-lg shadow-blue-200 active:scale-95 font-bold"
                    >
                        <FaPlus size={14} /> New Event
                    </button>
                </div>
            </div>

            {/* Statistics Row (Optional) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Active Events', value: events.length, color: 'blue' },
                    { label: 'Upcoming', value: events.filter(e => new Date(e.date) > new Date()).length, color: 'green' },
                    { label: 'Total Credits', value: events.reduce((acc, curr) => acc + (curr.credits || 0), 0), color: 'amber' },
                    { label: 'Registrations', value: events.reduce((acc, curr) => acc + (curr.participants?.length || 0), 0), color: 'purple' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">{stat.label}</p>
                        <p className={`text-2xl font-black text-${stat.color}-600`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white h-[450px] rounded-[2.5rem] animate-pulse border border-gray-100 shadow-sm" />
                    ))}
                </div>
            ) : filteredEvents.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 shadow-inner max-w-2xl mx-auto">
                    <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaCalendarAlt size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">The stage is empty</h3>
                    <p className="text-gray-500 font-medium max-w-xs mx-auto mb-8">Ready to host something amazing? Click "New Event" to begin.</p>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="text-blue-600 font-bold hover:underline"
                    >
                        Create your first event →
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredEvents.map(event => {
                        const isUpcoming = new Date(event.date) > new Date();
                        return (
                            <div key={event._id} className="group bg-white rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500 border border-gray-100 overflow-hidden flex flex-col h-full transform hover:-translate-y-1">
                                <div className="h-56 relative overflow-hidden">
                                    {event.image ? (
                                        <img src={event.image} alt={event.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    ) : (
                                        <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center text-gray-200">
                                            <FaImage size={40} className="mb-2" />
                                            <span className="text-[10px] uppercase font-bold tracking-widest">No Poster</span>
                                        </div>
                                    )}
                                    <div className={`absolute top-6 right-6 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl backdrop-blur-md ${isUpcoming ? 'bg-blue-600 text-white' : 'bg-gray-900 text-white'}`}>
                                        {isUpcoming ? 'upcoming' : 'concluded'}
                                    </div>
                                    <div className="absolute top-6 left-6 flex gap-2">
                                        <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl text-[10px] font-black text-gray-900 shadow-lg flex items-center gap-2">
                                            <FaTicketAlt className="text-blue-600" /> {event.credits} Cr
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 flex-1 flex flex-col">
                                    <h3 className="text-xl font-black text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">{event.title}</h3>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6 text-xs text-gray-500 font-bold">
                                        <span className="flex items-center gap-1.5"><FaMapMarkerAlt className="text-blue-500" /> {event.location}</span>
                                        <span className="flex items-center gap-1.5"><FaClock className="text-blue-500" /> {event.startTime}</span>
                                    </div>
                                    <p className="text-gray-500 text-sm mb-8 line-clamp-3 leading-relaxed font-medium flex-1">
                                        {event.shortDescription || event.description}
                                    </p>

                                    <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                                        <div className="flex items-center -space-x-3">
                                            {[...Array(Math.min(3, event.participants?.length || 0))].map((_, i) => (
                                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 shadow-sm">
                                                    P{i + 1}
                                                </div>
                                            ))}
                                            <span className="text-[10px] font-black text-gray-400 pl-4">{event.participants?.length || 0} Joined</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(event)}
                                                className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center group/btn"
                                                title="Edit Blueprint"
                                            >
                                                <FaEdit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(event._id)}
                                                className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center group/btn"
                                                title="Destruct Event"
                                            >
                                                <FaTrash size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Creation/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20 animate-in slide-in-from-bottom-8 duration-500">
                        {/* Modal Header */}
                        <div className="px-10 py-8 bg-gray-50 border-b border-gray-100 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{editingId ? 'Refine Event' : 'Architect New Event'}</h2>
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Status: Drafting Phase</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-500 transition-all shadow-sm">✕</button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-10 overflow-y-auto custom-scrollbar flex-1">
                            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                                {/* Left Column: Core Data */}
                                <div className="lg:col-span-12 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="group">
                                                <label className="text-[10px] uppercase font-bold text-gray-400 ml-2 mb-1.5 block">Project Title *</label>
                                                <div className="relative">
                                                    <FaLayerGroup className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500" size={14} />
                                                    <input type="text" required className="w-full pl-11 pr-4 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-bold text-gray-800" placeholder="e.g. Masterclass: Advanced Web Apps"
                                                        value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="group">
                                                <label className="text-[10px] uppercase font-bold text-gray-400 ml-2 mb-1.5 block">Short Brief *</label>
                                                <div className="relative">
                                                    <FaListUl className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500" size={14} />
                                                    <input type="text" required className="w-full pl-11 pr-4 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-bold text-gray-800" placeholder="One liner for cards..."
                                                        value={formData.shortDescription} onChange={e => setFormData({ ...formData, shortDescription: e.target.value })} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="group">
                                                    <label className="text-[10px] uppercase font-bold text-gray-400 ml-2 mb-1.5 block">Access Level *</label>
                                                    <div className="relative">
                                                        <FaTicketAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500" size={14} />
                                                        <input type="number" min="0" required className="w-full pl-11 pr-4 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-black text-gray-800"
                                                            value={formData.credits} onChange={e => setFormData({ ...formData, credits: e.target.value })} />
                                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">CR</span>
                                                    </div>
                                                </div>
                                                <div className="group">
                                                    <label className="text-[10px] uppercase font-bold text-gray-400 ml-2 mb-1.5 block">Quota *</label>
                                                    <div className="relative">
                                                        <FaUsers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500" size={14} />
                                                        <input type="number" min="1" required className="w-full pl-11 pr-4 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-black text-gray-800"
                                                            value={formData.maxParticipants} onChange={e => setFormData({ ...formData, maxParticipants: e.target.value })} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="group">
                                                <label className="text-[10px] uppercase font-bold text-gray-400 ml-2 mb-1.5 block">Location / Platform *</label>
                                                <div className="relative">
                                                    <FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500" size={14} />
                                                    <input type="text" required className="w-full pl-11 pr-4 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-bold text-gray-800" placeholder="Zoom / Studio B"
                                                        value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* DateTime Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-3xl border border-gray-100 shadow-inner">
                                        <div className="group">
                                            <label className="text-[10px] uppercase font-bold text-gray-400 mb-1.5 block">Date</label>
                                            <input type="date" required className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                                value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                        </div>
                                        <div className="group">
                                            <label className="text-[10px] uppercase font-bold text-gray-400 mb-1.5 block">Start Time</label>
                                            <input type="time" required className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                                value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
                                        </div>
                                        <div className="group">
                                            <label className="text-[10px] uppercase font-bold text-gray-400 mb-1.5 block">End Time</label>
                                            <input type="time" required className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                                value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} />
                                        </div>
                                    </div>

                                    {/* Advanced Metadata */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-4">
                                        <div className="space-y-6">
                                            <div className="group">
                                                <label className="text-[10px] uppercase font-bold text-gray-400 ml-2 mb-1.5 block">Deep Analysis (Full Description) *</label>
                                                <textarea required rows={6} className="w-full px-6 py-4 bg-gray-50/50 border border-gray-200 rounded-[2rem] focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium text-gray-800 resize-none leading-relaxed" placeholder="Chronicle the event details..."
                                                    value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                            </div>
                                            <div className="group">
                                                <label className="text-[10px] uppercase font-bold text-gray-400 ml-2 mb-1.5 block">Strategic Metrics (Outcomes, one per line)</label>
                                                <textarea rows={4} className="w-full px-6 py-4 bg-gray-50/50 border border-gray-200 rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium text-gray-800 resize-none" placeholder="- Mastering the React ecosystem..."
                                                    value={formData.learningOutcomes} onChange={e => setFormData({ ...formData, learningOutcomes: e.target.value })} />
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="group">
                                                <label className="text-[10px] uppercase font-bold text-gray-400 ml-2 mb-1.5 block">Visual Identifier (Poster URL)</label>
                                                <div className="relative mb-4">
                                                    <FaImage className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500" size={14} />
                                                    <input type="text" className="w-full pl-11 pr-4 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-bold text-gray-800" placeholder="https://source.unsplash.com/..."
                                                        value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} />
                                                </div>
                                                {/* Preview Area */}
                                                <div className="h-48 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center">
                                                    {formData.image ? (
                                                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="text-center">
                                                            <FaImage className="mx-auto text-gray-200 mb-2" size={30} />
                                                            <p className="text-[10px] font-bold text-gray-400">Media Preview</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="group">
                                                <label className="text-[10px] uppercase font-bold text-gray-400 ml-2 mb-1.5 block">External Connect (Link)</label>
                                                <div className="relative">
                                                    <FaLink className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500" size={14} />
                                                    <input type="text" className="w-full pl-11 pr-4 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-bold text-gray-800" placeholder="https://vidhya.io/..."
                                                        value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="group">
                                                <label className="text-[10px] uppercase font-bold text-gray-400 ml-2 mb-1.5 block">Tags (Command Separated)</label>
                                                <input type="text" className="w-full px-6 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-bold text-gray-800" placeholder="React, Figma, Design Thinking"
                                                    value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-10 py-8 bg-gray-900 flex justify-end gap-4 shrink-0">
                            <button type="button" onClick={() => setShowModal(false)} className="px-8 py-3 rounded-2xl text-gray-400 hover:text-white font-bold transition-all uppercase tracking-widest text-xs">
                                Discard
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={creating}
                                className="px-10 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition-all shadow-xl shadow-blue-900/40 active:scale-95 disabled:grayscale uppercase tracking-widest text-xs"
                            >
                                {creating ? "Syncing..." : (editingId ? "Update Blueprint" : "Publish to Nexus")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
            `}</style>
        </div>
    );
};

export default Events;
