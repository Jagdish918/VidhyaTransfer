import React, { useState, useEffect } from "react";
import axios from "axios";
import Spinner from "react-bootstrap/Spinner";
import { toast } from "react-toastify";
import { FaTimes } from "react-icons/fa";

const ReportModal = ({ isOpen, onClose, reportedUsername, reporterUsername }) => {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: reporterUsername || "",
    reportedUsername: reportedUsername || "",
    issue: "",
    issueDescription: "",
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        username: reporterUsername || "",
        reportedUsername: reportedUsername || "",
        issue: "",
        issueDescription: "",
      });
    }
  }, [isOpen, reportedUsername, reporterUsername]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.issue === "" || formData.issueDescription === "") {
      toast.error("Please fill all the details");
      return;
    }
    try {
      setLoading(true);
      const { data } = await axios.post(`/report/create`, formData);
      toast.success(data.message);
      onClose(); // Close modal on success
    } catch (error) {
      console.log(error);
      if (error?.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="bg-[#f56664] px-6 py-4 flex justify-between items-center">
          <h2 className="text-white font-bold text-xl font-['Montserrat']">REPORT PROFILE</h2>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors">
            <FaTimes />
          </button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="text-xs text-gray-500 uppercase font-semibold">Reporting User</span>
              <span className="text-gray-900 font-medium">@{formData.reportedUsername}</span>
            </div>

            <div className="flex flex-col mb-4">
              <label className="text-[#087464] font-semibold mb-2 text-sm">Nature of the issue</label>
              <div className="space-y-2">
                {["Personal conduct", "Professional expertise", "Others"].map((option) => (
                  <label key={option} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="issue"
                      value={option}
                      checked={formData.issue === option}
                      onChange={handleChange}
                      className="w-4 h-4 text-[#3bb4a1] focus:ring-[#3bb4a1]"
                    />
                    <span className="ml-3 text-gray-700 text-sm font-medium">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col mb-6">
              <label className="text-[#087464] font-semibold mb-2 text-sm" htmlFor="issueDescription">
                Description
              </label>
              <textarea
                id="issueDescription"
                name="issueDescription"
                className="bg-gray-50 border border-gray-300 rounded-lg p-3 w-full h-32 text-sm focus:ring-2 focus:ring-[#3bb4a1] focus:border-transparent outline-none transition-all placeholder-gray-400"
                placeholder="Please describe the issue in detail..."
                value={formData.issueDescription}
                onChange={handleChange}
              ></textarea>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 font-semibold text-sm hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-[#3bb4a1] text-white px-6 py-2 rounded-lg font-semibold text-sm hover:bg-[#013e38] transition-colors shadow-md disabled:opacity-70 flex items-center"
              >
                {loading ? (
                  <>
                    <Spinner animation="border" variant="light" size="sm" className="mr-2" />
                    Submitting...
                  </>
                ) : (
                  "Submit Report"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
