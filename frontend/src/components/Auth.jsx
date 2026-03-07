import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      if (isLogin) {
        // Log In
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        // Session listener in App.jsx will catch the change immediately
      } else {
        // Sign Up
        const { error } = await supabase.auth.signUp({
          email,
          password
        });
        if (error) throw error;
        setMessage({ text: 'สมัครสมาชิกสำเร็จ! กรุณาล็อกอิน', type: 'success' });
        setIsLogin(true); // Switch to login after signup
      }
    } catch (error) {
      setMessage({ text: error.message || 'เกิดข้อผิดพลาด', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-white w-full max-w-md p-8 md:p-10 rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center text-center">
        
        {/* Logo Icon */}
        <div className="w-16 h-16 bg-[#117b6f] rounded-2xl text-white text-3xl flex items-center justify-center shadow-lg shadow-teal-500/30 mb-6">
          🩺
        </div>
        
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">AI Skin Assistant</h1>
        <p className="text-sm font-medium text-slate-500 mt-1 mb-8">Professional Dermatology Analysis Platform</p>

        <form onSubmit={handleAuth} className="w-full text-left space-y-4">
          
          {message.text && (
            <div className={`p-3 rounded-xl text-sm font-bold text-center ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-teal-50 text-teal-600'}`}>
              {message.text}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#117b6f] focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#117b6f] focus:border-transparent transition-all"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 mt-2 bg-[#117b6f] hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-70 flex justify-center items-center"
          >
            {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
          
        </form>

        <div className="mt-6 text-sm text-slate-500 font-medium">
          {isLogin ? "ยังไม่มีบัญชีใช่หรือไม่? " : "มีบัญชีอยู่แล้วใช่หรือไม่? "}
          <button 
            type="button" 
            onClick={() => { setIsLogin(!isLogin); setMessage({text:'', type:''}); }}
            className="font-bold text-[#117b6f] hover:underline"
          >
            {isLogin ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
          </button>
        </div>

        <p className="text-[10px] text-slate-400 mt-8 max-w-xs leading-relaxed">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>

      </div>
    </div>
  );
}
