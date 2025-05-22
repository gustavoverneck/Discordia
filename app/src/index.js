import { BrowserRouter, Routes, Route } from 'react-router-dom';
import React from 'react';
import ReactDOM from 'react-dom/client';
import LoginScreen from './pages/login/Login';
import Dashboard from './pages/dashboard/DashboardLayout';
import reportWebVitals from './reportWebVitals';
import RegisterScreen from './pages/login/Register';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <LoginScreen />
  </React.StrictMode>
);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/settings" element={<Dashboard section="settings" />} />
        <Route path="/dashboard/profile" element={<Dashboard section="profile" />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
reportWebVitals();
