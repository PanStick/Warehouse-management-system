import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TopBar from './components/TopBar';
import { AuthProvider, useAuth } from './context/AuthContext';
import HomeCustomer from './pages/HomeCustomer';
import HomeWorker from './pages/HomeWorker';
import HomeAdmin from './pages/HomeAdmin';
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import Cart from './pages/Cart';

function AppContent() {
  const { role } = useAuth();

  const hasAccess = (userRole, allowedRoles) => {
    if (userRole === "demo") return true;
    return allowedRoles.includes(userRole);
  };

  return (
    <>
      <TopBar />

      <Routes>
        <Route path="/" element={<h2>Welcome to the homepage</h2>} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />

        {/* Protected routes based on role */}
        <Route path="/customer-home" element={
          hasAccess(role, ['customer']) ? <HomeCustomer /> : <Navigate to="/" />
        } />
        <Route path="/worker-home" element={
          hasAccess(role, ['worker']) ? <HomeWorker /> : <Navigate to="/" />
        } />
        <Route path="/admin-home" element={
          hasAccess(role, ['admin']) ? <HomeAdmin /> : <Navigate to="/" />
        } />
        <Route path="/cart" element = {
          hasAccess(role, ['customer']) ? <Cart /> : <Navigate to="/" />
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
