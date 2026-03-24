import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AuthProvider } from './context/AuthContext'

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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
