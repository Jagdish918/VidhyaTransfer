import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaStar, FaTimes } from "react-icons/fa";

const RatingModal = ({ isOpen, onClose, targetUsername, onRatingSuccess }) => {
    const [rating, setRating] = useState(0);
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error("Please select a rating");
            return;
        }
        if (description.trim() === "") {
            toast.error("Please enter a review description");
            return;
        }

        try {
            setLoading(true);
            const { data } = await axios.post(`/rating/rateUser`, {
                rating,
                description,
                username: targetUsername,
            });
            toast.success("Review submitted successfully!");
            if (onRatingSuccess) onRatingSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Error submitting review");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900">Review {targetUsername}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <FaTimes size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="text-center">
                        <p className="text-sm text-gray-500 mb-3 font-medium">How was your experience?</p>
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className={`text-4xl transition-all hover:scale-110 ${star <= rating ? "text-yellow-400" : "text-gray-200"
                                        }`}
                                >
                                    <FaStar />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Write your review</label>
                        <textarea
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none h-32"
                            placeholder="Tell others about your learning experience..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                    >
                        {loading ? "Submitting..." : "Submit Review"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RatingModal;
