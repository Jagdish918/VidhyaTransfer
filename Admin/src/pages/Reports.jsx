import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AiOutlineDelete, AiOutlineCheck, AiOutlineWarning, AiOutlineStop } from 'react-icons/ai';

const Reports = () => {
    const [activeTab, setActiveTab] = useState('users'); // 'users' or 'posts'
    const [userReports, setUserReports] = useState([]);
    const [reportedPosts, setReportedPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'users') {
                const { data } = await axios.get('/admin/reports');
                setUserReports(data.data);
            } else {
                const { data } = await axios.get('/admin/posts/reported');
                setReportedPosts(data.data);
            }
        } catch (error) {
            toast.error("Failed to fetch reports");
        } finally {
            setLoading(false);
        }
    };

    const handleDismissReport = async (id) => {
        try {
            await axios.delete(`/admin/reports/${id}`);
            toast.success("Report dismissed");
            setUserReports(prev => prev.filter(r => r._id !== id));
        } catch (error) {
            toast.error("Failed to dismiss report");
        }
    };

    const handleBanUser = async (reportId, userId) => {
        if (!userId) {
            toast.error("User not found or already deleted");
            return;
        }
        if (!window.confirm("Are you sure you want to BAN this user? This will deactivate their account but not delete it.")) return;
        try {
            // Ban the user
            await axios.patch(`/admin/users/${userId}/ban`);
            toast.success("User banned successfully");

            // Update the local state to reflect the status change without removing the report
            setUserReports(prev => prev.map(r =>
                r.reported?._id === userId ? { ...r, reported: { ...r.reported, status: 'banned' } } : r
            ));
        } catch (error) {
            console.error(error);
            toast.error("Failed to ban user");
        }
    };

    const handleUnbanUser = async (reportId, userId) => {
        if (!userId) {
            toast.error("User not found");
            return;
        }
        if (!window.confirm("Are you sure you want to Unban this user?")) return;
        try {
            await axios.patch(`/admin/users/${userId}/unban`);
            toast.success("User unbanned successfully");

            // Update the local state to reflect the status change
            setUserReports(prev => prev.map(r =>
                r.reported?._id === userId ? { ...r, reported: { ...r.reported, status: 'active' } } : r
            ));
        } catch (error) {
            console.error(error);
            toast.error("Failed to unban user");
        }
    };

    const handleDeletePost = async (id) => {
        if (!window.confirm("Delete this reported post?")) return;
        try {
            await axios.delete(`/admin/posts/${id}`);
            toast.success("Post deleted");
            setReportedPosts(prev => prev.filter(p => p._id !== id));
        } catch (error) {
            toast.error("Failed to delete post");
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Moderation Center</h1>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`pb-3 px-1 font-medium text-sm transition-colors relative ${activeTab === 'users' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    User Reports
                    {activeTab === 'users' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('posts')}
                    className={`pb-3 px-1 font-medium text-sm transition-colors relative ${activeTab === 'posts' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Reported Content
                    {activeTab === 'posts' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>}
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-500">Loading...</div>
            ) : (
                <>
                    {activeTab === 'users' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {userReports.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">No pending user reports.</div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Reason</th>
                                            <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Reporter</th>
                                            <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Reported User</th>
                                            <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {userReports.map(report => (
                                            <tr key={report._id}>
                                                <td className="px-6 py-4">
                                                    <span className="inline-block px-2 py-1 rounded bg-red-50 text-red-700 text-xs font-semibold mb-1">{report.nature}</span>
                                                    <p className="text-sm text-gray-600">{report.description}</p>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">{report.reporter?.name || "Unknown"}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900">{report.reported?.name || "Unknown"} <br /><span className="text-xs text-gray-500">{report.reported?.email}</span></td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleDismissReport(report._id)}
                                                            className="p-2 rounded-full text-gray-400 hover:bg-green-50 hover:text-green-600 transition-colors"
                                                            title="Dismiss Report"
                                                        >
                                                            <AiOutlineCheck size={20} />
                                                        </button>

                                                        {report.reported?.status === 'banned' ? (
                                                            <button
                                                                onClick={() => handleUnbanUser(report._id, report.reported?._id)}
                                                                className="p-2 rounded-full text-green-500 hover:bg-green-50 hover:text-green-700 transition-colors"
                                                                title="Unban User"
                                                            >
                                                                <span className="text-xs font-bold border border-green-500 rounded px-1">UNBAN</span>
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleBanUser(report._id, report.reported?._id)}
                                                                disabled={!report.reported}
                                                                className={`p-2 rounded-full transition-colors ${report.reported
                                                                    ? "text-gray-400 hover:bg-red-50 hover:text-red-600"
                                                                    : "text-gray-200 cursor-not-allowed"
                                                                    }`}
                                                                title={report.reported ? "Ban User" : "User already deleted"}
                                                            >
                                                                <AiOutlineStop size={20} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {activeTab === 'posts' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {reportedPosts.length === 0 ? (
                                <div className="col-span-3 text-center py-10 text-gray-500">No flagged content.</div>
                            ) : reportedPosts.map(post => (
                                <div key={post._id} className="bg-white p-6 rounded-xl shadow-sm border border-red-100 relative">
                                    <div className="absolute top-4 right-4 bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                                        <AiOutlineWarning className="text-sm" /> {post.reportedCount} Reports
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-1 pr-24">{post.author?.name || "Deleted User"}</h3>
                                    <div className="text-xs text-gray-400 mb-4">{new Date(post.createdAt).toLocaleDateString()}</div>
                                    <p className="text-gray-600 text-sm mb-6 line-clamp-3">{post.content}</p>
                                    <div className="flex justify-end pt-4 border-t border-gray-50">
                                        <button
                                            onClick={() => handleDeletePost(post._id)}
                                            className="px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
                                        >
                                            <AiOutlineDelete /> Delete Post
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
export default Reports;
