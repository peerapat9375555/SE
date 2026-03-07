import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Assessment from './components/Assessment';

export default function App() {
  const [session, setSession] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for changes on auth state (log in, log out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) setCurrentView('dashboard'); // Reset view on logout
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-50">
        <span className="w-10 h-10 border-4 border-slate-200 border-t-[#117b6f] rounded-full animate-spin"></span>
      </div>
    );
  }

  // If there's no session, show the Auth screen
  if (!session) {
    return (
      <Auth 
        onAdminLogin={(fakeSession) => {
          setSession(fakeSession);
          setLoading(false);
        }} 
      />
    );
  }

  // Routing Logic
  return (
    <>
      {currentView === 'dashboard' && (
        <Dashboard 
          session={session} 
          onStartAssessment={() => setCurrentView('assessment')}
        />
      )}
      
      {currentView === 'assessment' && (
        <Assessment 
          session={session} 
          onBack={() => setCurrentView('dashboard')}
        />
      )}
    </>
  );
}