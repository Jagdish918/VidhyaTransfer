import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Posts from './pages/Posts';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Events from './pages/Events';
import Activity from './pages/Activity';

const App = () => {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/activity" element={<Activity />} />
                <Route path="/users" element={<Users />} />
                <Route path="/posts" element={<Posts />} />
                <Route path="/events" element={<Events />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default App;
