import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useUser } from "../../util/UserContext";
import { FaTimes, FaClock, FaCoins, FaCalendarAlt, FaGraduationCap } from "react-icons/fa";

const BookSessionModal = ({ mentor, onClose, onBooked }) => {
  const { user, setUser } = useUser();
  const [loading, setLoading] = useState(false);

  const [skill, setSkill] = useState(
    mentor?.skillsProficientAt?.[0]?.name || ""
  );
  const [duration, setDuration] = useState(60);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [message, setMessage] = useState("");

  const ratePerHour = mentor?.preferences?.rates?.mentorship || 0;
  const creditsRequired = Math.ceil((ratePerHour / 60) * duration);

  const handleBook = async (e) => {
    e.preventDefault();

    if (!skill) {
      toast.error("Please select a skill");
      return;
    }
    if (!scheduledDate || !scheduledTime) {
      toast.error("Please select a date and time");
      return;
    }

    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
    if (scheduledAt <= new Date()) {
      toast.error("Scheduled time must be in the future");
      return;
    }

    if ((user?.credits || 0) < creditsRequired) {
      toast.error(`Insufficient credits. You need ${creditsRequired} but have ${user?.credits || 0}.`);
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post("/sessions/book", {
        mentorId: mentor._id,
        skill,
        duration,
        scheduledAt: scheduledAt.toISOString(),
        message,
      });

      if (data.success) {
        toast.success("Session booked! Credits are held in escrow.");
        // Update user credits in context
        if (data.data.learnerCredits !== undefined) {
          setUser((prev) => ({ ...prev, credits: data.data.learnerCredits }));
        }
        onBooked?.(data.data.session);
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to book session");
    } finally {
      setLoading(false);
    }
  };

  // Get the minimum date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const durations = [30, 45, 60, 90, 120];

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 animate-fade-in overflow-hidden max-h-[90vh] flex flex-col my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors border-0 text-white cursor-pointer"
          >
            <FaTimes size={14} />
          </button>
          <div className="flex items-center gap-3">
            <img
              src={mentor?.picture || "https://ui-avatars.com/api/?name=" + (mentor?.name || "U") + "&background=random&size=100"}
              alt={mentor?.name}
              className="w-12 h-12 rounded-xl object-cover border-2 border-white/30"
            />
            <div>
              <h2 className="text-lg font-bold">Book a Session</h2>
              <p className="text-indigo-200 text-sm">with {mentor?.name}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleBook} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Skill Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              <FaGraduationCap className="inline mr-1.5 text-indigo-500" size={12} />
              Skill to learn
            </label>
            <select
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none transition-all"
              required
            >
              <option value="">Select a skill</option>
              {mentor?.skillsProficientAt?.map((s, i) => (
                <option key={i} value={s.name || s}>
                  {s.name || s} {s.proficiency ? `(${s.proficiency})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              <FaClock className="inline mr-1.5 text-indigo-500" size={12} />
              Duration
            </label>
            <div className="flex gap-2 flex-wrap">
              {durations.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${
                    duration === d
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300"
                  }`}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                <FaCalendarAlt className="inline mr-1.5 text-indigo-500" size={12} />
                Date
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={minDate}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                <FaClock className="inline mr-1.5 text-indigo-500" size={12} />
                Time
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Message (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="What would you like to learn in this session?"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none resize-none transition-all"
            />
          </div>

          {/* Cost Summary */}
          <div className="bg-gradient-to-r from-indigo-50 to-slate-50 rounded-xl p-4 border border-indigo-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600">Rate</span>
              <span className="text-sm font-bold text-slate-900">{ratePerHour} credits/hr</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600">Duration</span>
              <span className="text-sm font-bold text-slate-900">{duration} min</span>
            </div>
            <div className="border-t border-indigo-100 pt-2 mt-2 flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Total (Escrow)</span>
              <span className="text-lg font-bold text-indigo-700 flex items-center gap-1.5">
                <FaCoins size={14} /> {creditsRequired} credits
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
              Credits will be held in escrow and released to the mentor only after you confirm the session is completed.
            </p>
          </div>

          {/* Your balance */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Your balance:</span>
            <span className={`font-bold ${(user?.credits || 0) >= creditsRequired ? "text-emerald-600" : "text-red-600"}`}>
              {user?.credits || 0} credits
              {(user?.credits || 0) < creditsRequired && (
                <span className="text-xs text-red-500 ml-2">(Need {creditsRequired - (user?.credits || 0)} more)</span>
              )}
            </span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || (user?.credits || 0) < creditsRequired}
            className="w-full py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            {loading ? "Booking..." : `Book Session for ${creditsRequired} Credits`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookSessionModal;
