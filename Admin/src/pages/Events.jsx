import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaPlus, FaCalendarAlt, FaTrash } from 'react-icons/fa';

const Events = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        link: '',
        image: ''
    });

    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('http://localhost:8000/events/all', { withCredentials: true });
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

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            const { data } = await axios.post('http://localhost:8000/events', formData, { withCredentials: true });
            if (data.success) {
                toast.success("Event created successfully");
                setShowModal(false);
                setFormData({ title: '', description: '', date: '', link: '', image: '' });
                fetchEvents();
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to create event");
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this event?")) return;
        try {
            await axios.delete(`http://localhost:8000/events/${id}`, { withCredentials: true });
            toast.success("Event deleted");
            setEvents(events.filter(e => e._id !== id));
        } catch (error) {
            toast.error("Failed to delete event");
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Events Management</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <FaPlus /> Create Event
                </button>
            </div>

            {loading ? (
                <div className="text-center text-gray-500">Loading events...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map(event => (
                        <div key={event._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="h-48 bg-gray-100 relative">
                                {event.image ? (
                                    <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400">
                                        <FaCalendarAlt className="text-4xl" />
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-lg mb-1">{event.title}</h3>
                                <p className="text-sm text-gray-500 mb-2">{new Date(event.date).toDateString()}</p>
                                <p className="text-gray-600 text-sm line-clamp-2 mb-4">{event.description}</p>
                                <div className="flex justify-between items-center mt-auto">
                                    <span className={`px-2 py-1 text-xs rounded-full ${new Date(event.date) > new Date() ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {new Date(event.date) > new Date() ? 'Upcoming' : 'Past'}
                                    </span>
                                    <button
                                        onClick={() => handleDelete(event._id)}
                                        className="text-red-500 hover:bg-red-50 p-2 rounded-full transition"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {events.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-400">
                            No events found. Create one!
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Create New Event</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Title</label>
                                <input
                                    type="text" required
                                    className="w-full border rounded-lg p-2"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Date</label>
                                <input
                                    type="date" required
                                    className="w-full border rounded-lg p-2"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    required rows={3}
                                    className="w-full border rounded-lg p-2"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Image URL (Optional)</label>
                                <input
                                    type="text" placeholder="https://..."
                                    className="w-full border rounded-lg p-2"
                                    value={formData.image}
                                    onChange={e => setFormData({ ...formData, image: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Link (Optional)</label>
                                <input
                                    type="text" placeholder="Registration Link"
                                    className="w-full border rounded-lg p-2"
                                    value={formData.link}
                                    onChange={e => setFormData({ ...formData, link: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit" disabled={creating}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {creating ? "Creating..." : "Create Event"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Events;
