import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Onboard from './pages/Onboard';
import Home from './pages/Home';
import Planner from './pages/Planner';
import Flights from './pages/Flights';
import Trains from './pages/Trains';
import Buses from './pages/Buses';
import Social from './pages/Social';
import Trips from './pages/Trips';
import Destination from './pages/Destination';
import Settings from './pages/Settings';
import Hotels from './pages/Hotels';
import Homestays from './pages/Homestays';
import Assistant from './pages/Assistant';
import Reels from './pages/Reels';
import Camera from './pages/Camera';
import Maps from './pages/Maps';
import Gamification from './pages/Gamification';

// Authentication Guard Middleware
interface GuardProps {
  children: React.ReactNode;
}

function AuthGuard({ children }: GuardProps) {
  const { isAuthenticated, user } = useAuthStore();

  // Redirect to onboarding if profile is not completed
  if (isAuthenticated && user && !user.name) {
    return <Navigate to="/onboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/onboard" element={<Onboard />} />

        {/* Protected Dashboard Routes wrapped in Layout */}
        <Route 
          path="/" 
          element={
            <AuthGuard>
              <Layout><Home /></Layout>
            </AuthGuard>
          } 
        />
        <Route 
          path="/planner" 
          element={
            <AuthGuard>
              <Layout><Planner /></Layout>
            </AuthGuard>
          } 
        />
        <Route 
          path="/flights" 
          element={
            <AuthGuard>
              <Layout><Flights /></Layout>
            </AuthGuard>
          } 
        />
        <Route 
          path="/trains" 
          element={
            <AuthGuard>
              <Layout><Trains /></Layout>
            </AuthGuard>
          } 
        />
        <Route 
          path="/buses" 
          element={
            <AuthGuard>
              <Layout><Buses /></Layout>
            </AuthGuard>
          } 
        />
        <Route 
          path="/social" 
          element={
            <AuthGuard>
              <Layout><Social /></Layout>
            </AuthGuard>
          } 
        />
        <Route 
          path="/trips" 
          element={
            <AuthGuard>
              <Layout><Trips /></Layout>
            </AuthGuard>
          } 
        />
        <Route 
          path="/destination/:name" 
          element={
            <AuthGuard>
              <Layout><Destination /></Layout>
            </AuthGuard>
          } 
        />
        <Route 
          path="/hotels" 
          element={
            <AuthGuard>
              <Layout><Hotels /></Layout>
            </AuthGuard>
          } 
        />
        <Route 
          path="/homestays" 
          element={
            <AuthGuard>
              <Layout><Homestays /></Layout>
            </AuthGuard>
          } 
        />
        <Route 
          path="/assistant" 
          element={
            <AuthGuard>
              <Layout><Assistant /></Layout>
            </AuthGuard>
          } 
        />
        <Route 
          path="/reels" 
          element={
            <AuthGuard>
              <Layout><Reels /></Layout>
            </AuthGuard>
          } 
        />
        <Route 
          path="/camera" 
          element={
            <AuthGuard>
              <Layout><Camera /></Layout>
            </AuthGuard>
          } 
        />
        <Route 
          path="/maps" 
          element={
            <AuthGuard>
              <Layout><Maps /></Layout>
            </AuthGuard>
          } 
        />
        <Route 
          path="/rewards" 
          element={
            <AuthGuard>
              <Layout><Gamification /></Layout>
            </AuthGuard>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <AuthGuard>
              <Layout><Settings /></Layout>
            </AuthGuard>
          } 
        />

        {/* Wildcard Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
