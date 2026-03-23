import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AiOutlineDelete, AiOutlineSearch, AiOutlineStop, AiOutlineUndo } from 'react-icons/ai';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data } = await axios.get('/admin/users');
                if (data.success) {
                    setUsers(data.data.users || data.data); // support both formats
                }
            } catch (error) {
                toast.error("Failed to fetch users");
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            const { data } = await axios.delete(`/admin/users/${id}`);
            if (data.success) {
                toast.success("User deleted");
                setUsers(users.filter(u => u._id !== id));
            }
        } catch (error) {
            toast.error("Failed to delete user");
        }
    };

    const handleBan = async (id) => {
        if (!window.confirm("Ban this user?")) return;
        try {
            const { data } = await axios.patch(`/admin/users/${id}/ban`);
            if (data.success) {
                toast.success("User banned");
                setUsers(users.map(u => u._id === id ? { ...u, status: 'banned' } : u));
            }
        } catch (error) {
            toast.error("Failed to ban user");
        }
    };

    const handleUnban = async (id) => {
        if (!window.confirm("Unban this user?")) return;
        try {
            const { data } = await axios.patch(`/admin/users/${id}/unban`);
            if (data.success) {
                toast.success("User unbanned");
                setUsers(users.map(u => u._id === id ? { ...u, status: 'active' } : u));
            }
        } catch (error) {
            toast.error("Failed to unban user");
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
    });

    if (loading) return <div className="text-center mt-20 text-gray-500">Loading Users...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
                <div className="flex gap-4">
                    <div className="relative">
                        <AiOutlineSearch className="absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="banned">Banned</option>
                    </select>
                    <select
                        className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="all">All Roles</option>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-sm">User</th>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Role</th>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Joined</th>
                            <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredUsers.length === 0 ? (
                            <tr><td colSpan="4" className="text-center py-8 text-gray-500">No users found.</td></tr>
                        ) : filteredUsers.map((user) => (
                            <tr key={user._id} className={`hover:bg-gray-50/50 transition-colors ${user.status === 'banned' ? 'bg-red-50' : ''}`}>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img src={user.picture || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} alt="" className="w-10 h-10 rounded-full object-cover bg-gray-200" />
                                            {user.status === 'banned' && (
                                                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1 rounded-full border border-white">BANNED</div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{user.name}</div>
                                            <div className="text-sm text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        {user.status === 'banned' ? (
                                            <button
                                                onClick={() => handleUnban(user._id)}
                                                className="text-gray-400 hover:text-green-600 transition-colors"
                                                title="Unban User"
                                            >
                                                <AiOutlineUndo size={20} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleBan(user._id)}
                                                disabled={user.role === 'admin'}
                                                className="text-gray-400 hover:text-orange-600 transition-colors disabled:opacity-30 disabled:hover:text-gray-400"
                                                title="Ban User"
                                            >
                                                <AiOutlineStop size={20} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(user._id)}
                                            disabled={user.role === 'admin'}
                                            className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-30 disabled:hover:text-gray-400"
                                            title="Delete User"
                                        >
                                            <AiOutlineDelete size={20} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default Users;
