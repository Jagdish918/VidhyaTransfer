import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AuthProvider } from './context/AuthContext'

// ✅ Set axios baseURL and credentials
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'https://vidhyatransfer-q02k.onrender.com';
axios.defaults.baseURL = SERVER_URL;
axios.defaults.withCredentials = true;

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AuthProvider>
            <BrowserRouter>
                <App />
                <ToastContainer position="top-right" />
            </BrowserRouter>
        </AuthProvider>
    </React.StrictMode>,
)
