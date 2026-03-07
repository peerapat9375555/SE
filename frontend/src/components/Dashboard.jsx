import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import NearbyClinics from './NearbyClinics';

export default function Dashboard({ session, onStartAssessment }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClinics, setShowClinics] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [session]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('assessment_history')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Format date correctly
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex justify-center pb-20 animate-in fade-in duration-300">
      <div className="w-full max-w-4xl px-4 md:px-8 mt-6">
        
        {/* Header */}
        <header className="flex justify-between items-center py-4 mb-8 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-800 tracking-tight">AI Skin Assistant</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-500 hidden sm:inline-block">
              Welcome, {session.user.email.split('@')[0]}
            </span>
            <button 
              onClick={handleLogout}
              className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Logout
            </button>
          </div>
        </header>

        {/* Action Banner */}
        <div className="bg-[#117b6f] rounded-3xl p-6 md:p-10 shadow-lg shadow-teal-500/20 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden mb-12">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 max-w-lg">
            <h2 className="text-2xl md:text-3xl font-black mb-2 tracking-tight">New Assessment?</h2>
            <p className="text-teal-50 font-medium leading-relaxed opacity-90 text-sm md:text-base">
              Upload a photo of your skin concern for an instant AI-powered analysis and preliminary advice.
            </p>
          </div>
          
          <button 
            onClick={onStartAssessment}
            className="relative z-10 shrink-0 bg-white text-[#117b6f] hover:bg-teal-50 px-6 py-3.5 rounded-xl font-black shadow-md hover:shadow-xl transition-all flex items-center gap-2 group"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">+</span> Start Analysis
          </button>
        </div>

        {/* Secondary Actions */}
        <div className="flex justify-between items-end mb-6">
          <div className="flex items-center gap-2 text-slate-600 font-bold">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Recent History
          </div>
          <button 
            onClick={() => setShowClinics(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-[#117b6f] rounded-lg font-bold text-xs hover:bg-teal-100 transition-colors border border-teal-200"
          >
            <span>🏥</span> คลินิกใกล้ฉัน
          </button>
        </div>

        {/* History List */}
        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <span className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-slate-400 animate-spin"></span>
          </div>
        ) : history.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center opacity-70 border-dashed">
            <span className="text-4xl mb-3 block">📄</span>
            <p className="text-slate-500 font-medium">No previous assessments found.<br/>Click "Start Analysis" to begin.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((record) => (
              <div key={record.id} className="bg-white border border-slate-100 shadow-sm hover:shadow-md rounded-2xl p-4 md:p-5 flex items-center gap-4 transition-all group cursor-pointer">
                {/* Thumbnail */}
                <div className="w-14 h-14 md:w-16 md:h-16 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                  {record.image_url ? (
                    <img src={record.image_url} alt="Skin concern" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl">📸</span>
                  )}
                </div>
                
                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 text-sm md:text-base truncate">
                    {record.label || "Unknown Condition"} 
                    {record.confidence && <span className="font-normal text-slate-500 ml-1 text-xs">({(record.confidence * 100).toFixed(0)}%)</span>}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mt-0.5 truncate">
                    {record.insight || "No insight available."}
                  </p>
                  <div className="flex gap-3 items-center mt-2 text-[10px] md:text-xs">
                    <span className={`px-2 py-0.5 rounded text-white font-bold tracking-wide uppercase ${
                      record.confidence > 0.8 ? 'bg-red-500' : 
                      record.confidence > 0.5 ? 'bg-orange-500' : 'bg-[#117b6f]'
                    }`}>
                      {record.confidence > 0.8 ? 'HIGH' : record.confidence > 0.5 ? 'MEDIUM' : 'LOW'}
                    </span>
                    <span className="text-slate-400 font-medium">{formatDate(record.created_at)}</span>
                  </div>
                </div>
                
                <div className="text-slate-300 group-hover:text-[#117b6f] group-hover:translate-x-1 transition-all">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <NearbyClinics isOpen={showClinics} onClose={() => setShowClinics(false)} />
    </div>
  );
}
