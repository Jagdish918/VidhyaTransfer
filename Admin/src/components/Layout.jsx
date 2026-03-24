import React from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
    const { admin, loading } = useAuth();
    const location = useLocation();

    if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

    if (!admin) {
        return <Navigate to="/" replace />;
    }

    const navItems = [
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'Live Activity', path: '/activity' },
        { name: 'Users', path: '/users' },
        { name: 'Posts', path: '/posts' },
        { name: 'Events', path: '/events' },
        { name: 'Reports', path: '/reports' },
        { name: 'Settings', path: '/settings' },
    ];

    return (
        <div className="flex min-h-screen bg-gray-50 font-sans">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 p-6 fixed h-full z-10 hidden md:block px-4">
                <div className="text-2xl font-bold text-blue-600 mb-10 px-2 tracking-tight">SkillSwap Admin</div>
                <nav className="flex flex-col gap-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm flex items-center gap-3 ${location.pathname === item.path
                                ? 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            {item.name}
                        </Link>
                    ))}
                    <div className="mt-auto pt-6 border-t border-gray-100">
                        <button onClick={() => window.location.href = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173'} className="w-full text-left px-4 py-3 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium text-sm">
                            Return to App
                        </button>
                    </div>
                </nav>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden w-full bg-white border-b border-gray-200 p-4 fixed top-0 z-20 flex justify-between items-center shadow-sm">
                <span className="text-lg font-bold text-blue-600">Admin</span>
                <button onClick={() => window.location.href = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173'} className="text-sm font-medium text-gray-500">Exit</button>
            </div>

            {/* Main Content */}
            <div className="md:ml-64 flex-1 p-8 pt-20 md:pt-8 w-full max-w-7xl mx-auto">
                <Outlet />
            </div>
        </div>
    );
};

export default Layout;
