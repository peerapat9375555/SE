import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import NearbyClinics from './NearbyClinics';

// --- API URLs ---
const CLASSIFICATION_URL = import.meta.env.VITE_MODEL_URL || '';
const CHATBOT_URL = import.meta.env.VITE_CHATBOT_URL || '';

export default function Assessment({ session, onBack }) {
  // สถานะสำหรับระบบตรวจโรค
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState({ label: "", confidence: 0, insight: "" });

  // สถานะสำหรับระบบแชตบอท
  const [showChat, setShowChat] = useState(false); // ควบคุมการเปิด/ปิดแชตในมือถือ
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    { role: 'bot', text: "สวัสดีครับ ผมคือ Dr. AI Assistant ยินดีที่ได้ช่วยเหลือครับ คุณสามารถสอบถามข้อมูลเกี่ยวกับสุขภาพผิวหนังได้ที่นี่เลย" }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);
  
  // สถานะสำหรับหน้าต่างค้นหาคลินิก
  const [showClinics, setShowClinics] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImagePreview(URL.createObjectURL(selectedFile));
      setShowResult(false);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return alert("กรุณาอัปโหลดรูปภาพก่อนทำการวิเคราะห์ครับ");
    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${CLASSIFICATION_URL}/api/predict`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      
      if (data.label) {
        let imageUrl = null;
        
        // อัปโหลดรูปลง Supabase Storage
        try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('skin_images')
            .upload(fileName, file);
            
          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from('skin_images')
              .getPublicUrl(fileName);
            imageUrl = publicUrlData.publicUrl;
          }
        } catch (storageErr) {
          console.error("Failed to upload image:", storageErr);
        }

        const insightText = `จากการวิเคราะห์เบื้องต้นพบความเป็นไปได้ว่าเป็น ${data.label} คุณสามารถพิมพ์ถามวิธีการดูแลตัวเองได้จากช่องทางแชตครับ`;

        // บันทึกลง Supabase Database
        try {
          await supabase.from('assessment_history').insert({
            user_id: session.user.id,
            label: data.label,
            confidence: data.confidence,
            insight: insightText,
            image_url: imageUrl
          });
        } catch (dbErr) {
          console.error("Failed to save history:", dbErr);
        }

        setResult({
          label: data.label,
          confidence: data.confidence,
          insight: insightText
        });
        
        setShowResult(true);
        setMessages(prev => [...prev, { role: 'bot', text: `ผลวิเคราะห์ออกมาแล้วครับ: ${data.label} (ความแม่นยำ ${Number(data.confidence).toFixed(2)}%) มีคำถามเพิ่มเติมไหมครับ?` }]);
      }
    } catch (error) {
      alert("ไม่สามารถติดต่อบริการวิเคราะห์โรคได้ กรุณาลองอีกครั้ง");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = { role: 'user', text: chatInput };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = chatInput;
    setChatInput("");
    setIsChatLoading(true);

    try {
      const response = await fetch(`${CHATBOT_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.reply || data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: "ขออภัยครับ บริการแชตบอทขัดข้องชั่วคราว" }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="h-screen bg-[#fbfaf6] flex flex-col font-sans text-slate-900 relative overflow-hidden">
      
      <header className="h-[80px] flex-none pl-4 md:pl-8 pr-4 md:pr-0 bg-[#0c4a41] flex items-center justify-between z-20 shadow-md border-b-0 w-full relative">
        {/* Left Side: Logo */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.history.back()}
            className="w-10 h-10 rounded-xl border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-all shadow-sm"
            title="Back to Dashboard"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-200 flex items-center justify-center text-lg shadow-sm">🔬</div>
            <h1 className="text-lg md:text-xl font-bold text-white tracking-tight hidden sm:block">AI Skin Assistant</h1>
            <span className="bg-white/10 text-white/90 text-[10px] px-2 py-0.5 rounded-full border border-white/20 hidden sm:block">AI</span>
          </div>
        </div>

        {/* Right Side: Chatbot Profile & Clinic Button */}
        <div className="flex items-center h-full">

          {/* Clinic Button (Moved to the left of Chatbot Profile separator) */}
          <button 
            onClick={() => setShowClinics(true)}
            className="hidden md:flex items-center gap-2 px-4 py-2 mr-6 bg-[#e6ab5b] text-[#0c4a41] rounded-full font-bold text-sm hover:bg-[#d6994a] transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            <span className="hidden sm:inline">คลินิกใกล้ฉัน</span>
          </button>

          {/* Chatbot Profile (Matching exactly with Chat Window width) */}
          <div className="hidden md:flex items-center gap-3 w-[450px] pl-6 h-full py-2">
            <div className="w-10 h-10 bg-transparent border-2 border-[#16c6a4] rounded-full flex items-center justify-center text-xl shadow-[0_0_10px_rgba(22,198,164,0.3)] overflow-hidden">
               <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
               </svg>
            </div>
            <div className="flex flex-col justify-center">
              <h3 className="font-bold text-white text-sm">Dr. AI Assistant</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 bg-[#16c6a4] rounded-full shadow-[0_0_4px_#16c6a4]"></span>
                <p className="text-[10px] text-white/70">ออนไลน์ - พร้อมวิเคราะห์ผิวหนัง</p>
              </div>
            </div>
          </div>
          
          {/* Mobile Buttons */}
          <div className="flex md:hidden items-center gap-2 h-full">
            <button 
              onClick={() => setShowClinics(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#e6ab5b] text-[#0c4a41] rounded-full font-bold text-xs shadow-sm"
            >
              <span className="text-sm">🏥</span> คลินิก
            </button>
            <button onClick={() => setShowChat(!showChat)} className="text-white p-2 text-xl">
              {showChat ? '✕' : '💬'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
        
        {/* --- ส่วนซ้าย: ระบบวิเคราะห์รูปภาพ (ซ่อนเมื่อเปิดแชตในมือถือ) --- */}
        <section className={`flex-1 p-4 md:p-8 overflow-y-auto bg-[#fbfaf6] w-full h-full ${showChat ? 'hidden md:block' : 'block'}`}>
          <div className="max-w-3xl mx-auto py-4 md:py-8">
            {!showResult ? (
              <div className="space-y-8 animate-in fade-in duration-700">
                <div className="text-center md:text-left space-y-4">
                  <span className="inline-block bg-[#e0f2f1] text-[#0c4a41] text-xs font-bold px-3 py-1 rounded-full border border-[#b2dfdb]">
                    <span className="mr-1">●</span> วิเคราะห์โรคผิวหนังด้วย AI
                  </span>
                  <h2 className="text-3xl md:text-5xl font-black text-[#117b6f] leading-tight">
                    จำแนกโรคผิวหนัง<br/>ให้คำแนะนำเบื้องต้น
                  </h2>
                  <p className="text-slate-500 text-sm md:text-base max-w-xl">
                    อัปโหลดภาพบริเวณผิวหนังที่ต้องการตรวจ AI จะวิเคราะห์ลักษณะ จำแนกโรค และให้คำแนะนำเบื้องต้นทันที
                  </p>
                </div>

                <div className="bg-[#fbfaf6] border-2 border-dashed border-[#b2dfdb] rounded-[32px] p-8 md:p-12 flex flex-col items-center justify-center transition-all hover:bg-white group relative overflow-hidden">
                  {imagePreview ? (
                    <img src={imagePreview} className="max-h-60 md:max-h-80 rounded-2xl shadow-xl z-10 border-4 border-white" alt="ตัวอย่าง" />
                  ) : (
                    <div className="relative z-10 text-[#117b6f] mb-4 bg-[#e0f2f1] w-20 h-20 flex flex-col items-center justify-center rounded-[24px] group-hover:-translate-y-2 transition-transform shadow-sm">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                    </div>
                  )}
                  <input type="file" className="hidden" id="file-upload" onChange={handleFileUpload} />
                  {!imagePreview && (
                     <label htmlFor="file-upload" className="absolute inset-0 w-full h-full cursor-pointer z-20 opacity-0"></label>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs font-bold text-[#0c4a41]">
                  <span className="px-3 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm"><span className="text-[#117b6f] mr-1">●</span> วิเคราะห์ภาพจริง</span>
                  <span className="px-3 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm"><span className="text-[#117b6f] mr-1">●</span> ผลใน 10 วินาที</span>
                  <span className="px-3 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm"><span className="text-[#117b6f] mr-1">●</span> ข้อมูลปลอดภัย</span>
                  <span className="px-3 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm"><span className="text-[#117b6f] mr-1">●</span> ฟรี 100%</span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-3xl text-center shadow-sm border border-slate-100 flex flex-col justify-center">
                    <h4 className="text-2xl font-black text-[#0c4a41]">50K+</h4>
                    <p className="text-xs text-slate-500 font-medium">การวินิจฉัย</p>
                  </div>
                  <div className="bg-white p-4 rounded-3xl text-center shadow-sm border border-slate-100 flex flex-col justify-center">
                    <h4 className="text-2xl font-black text-[#0c4a41]">98%</h4>
                    <p className="text-xs text-slate-500 font-medium">ความพึงพอใจ</p>
                  </div>
                  <div className="bg-white p-4 rounded-3xl text-center shadow-sm border border-slate-100 flex flex-col justify-center">
                    <h4 className="text-2xl font-black text-[#0c4a41]">24/7</h4>
                    <p className="text-xs text-slate-500 font-medium">พร้อมบริการ</p>
                  </div>
                </div>

                <button 
                  onClick={handleAnalyze} 
                  disabled={isAnalyzing || !file}
                  className={`w-full py-4 rounded-2xl font-bold text-lg md:text-xl shadow-md transition-all flex items-center justify-center gap-2 ${isAnalyzing || !file ? 'bg-[#cbd5e1] text-white cursor-not-allowed' : 'bg-[#e0f2f1] text-[#0c4a41] hover:bg-[#b2dfdb]'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
                  {isAnalyzing ? "กำลังวิเคราะห์..." : (file ? "เริ่มการวินิจฉัย" : "เริ่มการวินิจฉัย (กรุณาอัปโหลดรูป)")}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-4">
                  <div className="bg-white p-2 md:p-3 rounded-3xl shadow-xl border border-slate-100">
                    <img src={imagePreview} className="w-full h-[300px] md:h-[450px] object-cover rounded-2xl shadow-inner" alt="ผลการตรวจ" />
                  </div>
                </div>
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border-t-8 border-[#16c6a4] flex flex-col">
                  <div className="flex-1">
                    <span className="bg-[#f0fdfa] text-[#117b6f] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">ผลการตรวจโดย AI</span>
                    <h3 className="text-2xl md:text-4xl font-black text-[#0a2540] mt-4 mb-2">{result.label}</h3>
                    <div className="my-6 md:my-8">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-slate-400 text-xs font-bold uppercase">ความมั่นใจ</span>
                        <span className="text-xl md:text-2xl font-black text-[#16c6a4]">{result.confidence}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 md:h-4 rounded-full overflow-hidden border border-slate-50">
                        <div className="bg-[#16c6a4] h-full transition-all duration-1000" style={{ width: `${result.confidence}%` }}></div>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 md:p-6 border border-slate-100 italic text-slate-600 text-sm leading-relaxed">
                      " {result.insight} "
                    </div>
                  </div>
                  <button onClick={() => setShowResult(false)} className="mt-6 md:mt-8 w-full py-3 md:py-4 border-2 border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition-all text-sm">
                    ทำการประเมินใหม่
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* --- ส่วนขวา: ระบบแชตบอท (Overlay ในมือถือ) --- */}
        <aside className={`
          fixed inset-0 z-40 bg-white flex flex-col transition-transform duration-300 transform
          md:relative md:translate-x-0 md:w-[450px] md:h-full md:z-10 md:border-l-2 md:border-black md:shadow-[-5px_0_15px_-3px_rgba(0,0,0,0.05)]
          ${showChat ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}>
          {/* Header แชตบอทในมือถือ (ใน Desktop จะไปรวมกับ Navbar หลักด้านบน) */}
          <div className="flex-none p-4 bg-[#0c4a41] flex items-center justify-between z-10 shadow-md md:hidden">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-transparent border-2 border-[#16c6a4] rounded-full flex items-center justify-center text-base shadow-[0_0_10px_rgba(22,198,164,0.3)] overflow-hidden">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Dr. AI Assistant</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-[#16c6a4] rounded-full shadow-[0_0_4px_#16c6a4]"></span>
                  <p className="text-[10px] text-white/70">ออนไลน์</p>
                </div>
              </div>
            </div>
            <button onClick={() => setShowChat(false)} className="text-white hover:text-teal-200 p-2 font-bold text-sm transition-colors">
              ✕
            </button>
          </div>


          <div className="flex-1 overflow-y-auto p-4 md:pr-2 md:pl-6 md:py-6 space-y-4 md:space-y-6 bg-white">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'bot' && (
                  <div className="w-8 h-8 rounded-full bg-[#e0f2f1] flex items-center justify-center flex-shrink-0 mt-1">
                     <svg className="w-4 h-4 text-[#117b6f]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                  </div>
                )}
                <div className={`max-w-[85%] p-3 md:p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-[#117b6f] text-white rounded-tr-none font-medium shadow-sm' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none font-medium whitespace-pre-wrap shadow-sm'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {/* โหลดดิ้งสถานะกำลังพิมพ์... */}
            {isChatLoading && (
              <div className="flex justify-start gap-3">
                 <div className="w-8 h-8 rounded-full bg-[#e0f2f1] flex items-center justify-center flex-shrink-0 mt-1">
                     <svg className="w-4 h-4 text-[#117b6f]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                  </div>
                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-4 shadow-sm flex gap-1.5 items-center">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          <div className="flex-none bg-white z-10 px-4 md:px-6 pb-4 border-t border-slate-100">
             {/* FAQ Chips */}
             <div className="py-4 space-y-2">
                <p className="text-xs font-bold text-slate-500 mb-2">คำถามที่พบบ่อย</p>
                <button onClick={() => setChatInput("สิวอักเสบกับสิวหัวดำต่างกันอย่างไร?")} className="w-full text-left bg-[#e0f2f1] hover:bg-[#b2dfdb] text-[#0c4a41] text-sm px-4 py-2.5 rounded-xl transition-colors truncate">
                  <span className="mr-2">🔍</span> สิวอักเสบกับสิวหัวดำต่างกันอย่างไร?
                </button>
                <button onClick={() => setChatInput("ผื่นแพ้สัมผัส ดูแลเบื้องต้นได้อย่างไร?")} className="w-full text-left bg-[#e0f2f1] hover:bg-[#b2dfdb] text-[#0c4a41] text-sm px-4 py-2.5 rounded-xl transition-colors truncate">
                  <span className="mr-2">🌿</span> ผื่นแพ้สัมผัส ดูแลเบื้องต้นได้อย่างไร?
                </button>
                <button onClick={() => setChatInput("แผลที่ผิวแบบไหนควรพบแพทย์ด่วน?")} className="w-full text-left bg-[#e0f2f1] hover:bg-[#b2dfdb] text-[#0c4a41] text-sm px-4 py-2.5 rounded-xl transition-colors truncate">
                  <span className="mr-2">⚠️</span> แผลที่ผิวแบบไหนควรพบแพทย์ด่วน?
                </button>
             </div>
          
            <form onSubmit={handleSendMessage} className="relative flex items-center mt-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="ถามเกี่ยวกับโรคผิวหนัง..." 
                className="w-full bg-[#f8fafc] border border-teal-100 rounded-full py-3.5 px-5 pr-14 text-sm focus:ring-2 focus:ring-[#117b6f] focus:bg-white transition-all outline-none" 
              />
              <button type="submit" className="absolute right-1 text-white bg-[#117b6f] p-2.5 rounded-full hover:bg-[#0c4a41] transition-transform active:scale-95 shadow-md">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
              </button>
            </form>
          </div>
        </aside>

        {/* --- 🔘 ปุ่มลอยสำหรับเปิดแชต (แสดงเฉพาะในมือถือ) --- */}
        {!showChat && (
          <button 
            onClick={() => setShowChat(true)}
            className="md:hidden fixed bottom-6 right-6 w-16 h-16 bg-[#117b6f] text-white rounded-full shadow-2xl flex items-center justify-center z-30 animate-bounce text-2xl border-4 border-white"
          >
            💬
          </button>
        )}

      </main>

      {/* หน้าต่างค้นหาสถานพยาบาล */}
      <NearbyClinics isOpen={showClinics} onClose={() => setShowClinics(false)} />
    </div>
  );
}