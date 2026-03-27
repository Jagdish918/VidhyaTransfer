import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaUserPlus, FaUsers, FaStickyNote, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Dashboard = () => {
    const [stats, setStats] = useState({ totalUsers: 0, totalPosts: 0, reportedPosts: 0 });
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [statsRes, analyticsRes] = await Promise.all([
                    axios.get('/admin/dashboard'),
                    axios.get('/admin/analytics')
                ]);
                setStats(statsRes.data.data);
                setAnalytics(analyticsRes.data.data);
            } catch (error) {
                console.error("Dashboard error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="text-center py-20">Loading Dashboard...</div>;

    const cards = [
        { title: 'Total Users', count: stats.totalUsers, icon: <FaUsers />, color: 'bg-blue-500' },
        { title: 'Online Users', count: stats.onlineUsers, icon: <div className="w-3 h-3 bg-white rounded-full animate-pulse" />, color: 'bg-emerald-500' },
        { title: 'Total Posts', count: stats.totalPosts, icon: <FaStickyNote />, color: 'bg-green-500' },
        { title: 'Reported Content', count: stats.reportedPosts, icon: <FaExclamationTriangle />, color: 'bg-red-500' },
    ];

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Executive Overview</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {cards.map((card, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                        <div>
                            <p className="text-gray-500 text-sm font-medium mb-1">{card.title}</p>
                            <h2 className="text-3xl font-bold text-gray-800">{card.count}</h2>
                        </div>
                        <div className={`p-4 rounded-xl text-white ${card.color} shadow-lg shadow-opacity-20`}>
                            {card.icon}
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Popular Skills Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Trending Skills</h3>
                    <div className="h-64">
                        {analytics?.topSkills?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.topSkills}>
                                    <XAxis dataKey="_id" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: '#f3f4f6' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                                        {analytics.topSkills.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][index % 5]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-gray-400">Not enough data</div>
                        )}
                    </div>
                </div>

                {/* Connection Success Rate */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center">
                    <h3 className="text-lg font-bold text-gray-800 mb-2 self-start">Network Health</h3>
                    <div className="text-center mt-4">
                        <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-green-100 text-3xl font-bold text-green-600 mb-4">
                            {analytics?.totalRequests > 0 ? Math.round((analytics.successfulConnections / analytics.totalRequests) * 100) : 0}%
                        </div>
                        <p className="text-gray-500 text-sm">Of requests lead to a successful connection.</p>
                        <div className="mt-6 flex gap-4 text-sm">
                            <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg font-medium">
                                {analytics?.successfulConnections} Connected
                            </div>
                            <div className="bg-gray-50 text-gray-600 px-4 py-2 rounded-lg font-medium">
                                {analytics?.totalRequests} Total Requests
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
