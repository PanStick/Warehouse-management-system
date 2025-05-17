import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TopBar from './components/TopBar';
import { AuthProvider, useAuth } from './context/AuthContext';
import HomeCustomer from './pages/HomeCustomer';
import HomeWorker from './pages/HomeWorker';
import HomeAdmin from './pages/HomeAdmin';
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";

function AppContent() {
  const { role } = useAuth();

  return (
    <>
      <TopBar />

      <Routes>
        <Route path="/" element={<h2>Welcome to the homepage</h2>} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />

        {/* Protected routes based on role */}
        <Route path="/customer-home" element={
          role === 'customer' || role === 'demo' ? <HomeCustomer /> : <Navigate to="/" />
        } />
        <Route path="/worker-home" element={
          role === 'worker' || role === 'demo' ? <HomeWorker /> : <Navigate to="/" />
        } />
        <Route path="/admin-home" element={
          role === 'admin' || role === 'demo' ? <HomeAdmin /> : <Navigate to="/" />
        } />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
      <AppContent />
      </AuthProvider>
    </Router>
  );
}
