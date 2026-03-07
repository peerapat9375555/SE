import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function AdminDashboard({ session, onLogout }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    fetchDocuments(currentPage);
  }, [currentPage]);

  const fetchDocuments = async (page) => {
    try {
      setLoading(true);
      
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error, count } = await supabase
        .from('skin_documents')
        .select('id, content, metadata, source', { count: 'exact' })
        .order('id', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setDocuments(data || []);
      if (count !== null) setTotalItems(count);
    } catch (error) {
      console.error('Error fetching documents:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อความนี้? (ข้อมูลนี้จะถูกลบออกจากฐานข้อมูล)')) return;
    
    try {
      const { error } = await supabase
        .from('skin_documents')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      // Refresh the current page to properly re-paginate
      fetchDocuments(currentPage);
    } catch (error) {
      console.error('Error deleting document:', error.message);
      alert('Failed to delete document. Please try again.');
    }
  };

  const goToEmbedPage = () => {
    window.location.href = 'https://dermaai-chatbot.onrender.com/embed';
  };

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex justify-center pb-20 animate-in fade-in duration-300">
      <div className="w-full max-w-5xl px-4 md:px-8 mt-6">
        
        {/* Header */}
        <header className="flex justify-between items-center py-4 mb-8 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-800 tracking-tight">AI Skin Assistant <span className="text-[#117b6f] ml-2 px-2 py-0.5 bg-teal-50 rounded-md text-sm border border-teal-100">Admin</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={goToEmbedPage}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#117b6f] text-white font-bold rounded-lg hover:bg-teal-700 transition-colors text-sm shadow-sm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              Go to Embedding Page
            </button>
            <span className="text-sm font-medium text-slate-500 hidden sm:inline-block">
              Welcome, admin
            </span>
            <button 
              onClick={onLogout}
              className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Logout
            </button>
          </div>
        </header>

        {/* Mobile Embed Button */}
        <button 
          onClick={goToEmbedPage}
          className="md:hidden w-full mb-6 flex justify-center items-center gap-2 px-4 py-3 bg-[#117b6f] text-white font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-sm"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          Go to Embedding Page
        </button>

        {/* Dashboard Content */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="p-5 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#117b6f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Knowledge Base Documents
            </h2>
            <span className="text-xs font-bold bg-[#117b6f]/10 text-[#117b6f] px-3 py-1 rounded-full">
              {totalItems} Items Total
            </span>
          </div>
          
          <div className="p-0">
            {loading ? (
              <div className="py-20 flex flex-col justify-center items-center gap-4">
                <span className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-[#117b6f] animate-spin"></span>
                <p className="text-slate-500 font-medium text-sm">Loading documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="py-20 text-center px-4">
                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                  📁
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-1">No Documents Found</h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto">
                  The knowledge base is currently empty. Go to the embedding page to upload or paste new medical texts.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-5 md:p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row gap-4 md:items-start group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                        {doc.content}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3 text-xs text-slate-500 font-medium font-mono">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">ID: {doc.id}</span>
                        {doc.source && (
                          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                            Source: {doc.source}
                          </span>
                        )}
                        {doc.metadata?.chunk_index !== undefined && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            Chunk: {doc.metadata.chunk_index + 1}/{doc.metadata.chunk_count}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleDelete(doc.id)}
                      className="shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 rounded-lg text-xs font-bold transition-all shadow-sm md:opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mb-10">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-slate-200 bg-white text-slate-600 font-medium text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              Previous
            </button>
            
            <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-4 py-2 font-medium text-sm border-r border-slate-200 last:border-r-0 transition-colors ${
                    currentPage === i + 1 
                      ? 'bg-[#117b6f] text-white' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-slate-200 bg-white text-slate-600 font-medium text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              Next
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
