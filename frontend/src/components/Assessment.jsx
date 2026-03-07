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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 relative overflow-hidden">
      
      <header className="h-[73px] flex-none px-4 md:px-8 bg-[#117b6f] flex items-center justify-between z-20 shadow-md">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.history.back()}
            className="w-10 h-10 rounded-xl border-2 border-[#16c6a4] flex items-center justify-center text-white hover:bg-[#16c6a4] transition-all shadow-sm"
            title="Back to Dashboard"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-lg md:text-xl font-black text-white tracking-tight uppercase hidden sm:block">AI Skin Assistant</h1>
          </div>
        </div>
        <button 
          onClick={() => setShowClinics(true)}
          className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-white text-[#117b6f] rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors shadow-sm"
        >
          <span className="text-lg">🏥</span>
          <span className="hidden sm:inline">คลินิกใกล้ฉัน</span>
        </button>
      </header>

      <main className="flex-1 flex flex-col md:flex-row relative h-[calc(100vh-73px)] overflow-hidden">
        
        {/* --- ส่วนซ้าย: ระบบวิเคราะห์รูปภาพ (ซ่อนเมื่อเปิดแชตในมือถือ) --- */}
        <section className={`flex-1 p-4 md:p-8 overflow-y-auto bg-[#f8fafc] w-full h-full ${showChat ? 'hidden md:block' : 'block'}`}>
          <div className="max-w-4xl mx-auto">
            {!showResult ? (
              <div className="space-y-6 animate-in fade-in duration-700">
                <div className="bg-white border-2 border-dashed border-slate-300 rounded-3xl p-8 md:p-16 flex flex-col items-center justify-center transition-all hover:border-[#117b6f] hover:bg-teal-50/20 group">
                  {imagePreview ? (
                    <img src={imagePreview} className="max-h-60 md:max-h-80 rounded-2xl shadow-xl mb-6 border-4 border-white" alt="ตัวอย่าง" />
                  ) : (
                    <div className="text-teal-600 mb-6 bg-teal-50 p-6 rounded-full group-hover:scale-110 transition-transform">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                    </div>
                  )}
                  <h3 className="text-lg md:text-xl font-bold text-slate-700 mb-1 text-center">อัปโหลดรูปภาพบริเวณผิวหนัง</h3>
                  <p className="text-slate-400 text-xs mb-6 text-center">รองรับไฟล์รูปแบบ JPG, PNG</p>
                  <input type="file" className="hidden" id="file-upload" onChange={handleFileUpload} />
                  <label htmlFor="file-upload" className="px-6 md:px-8 py-3 bg-white border border-slate-200 rounded-full cursor-pointer hover:shadow-md transition-all font-bold text-slate-600 text-sm">
                    {file ? "เปลี่ยนรูปภาพ" : "เลือกรูปภาพจากเครื่อง"}
                  </label>
                </div>
                <button 
                  onClick={handleAnalyze} 
                  disabled={isAnalyzing || !file}
                  className={`w-full py-4 md:py-5 rounded-2xl font-black text-white text-lg md:text-xl shadow-lg transition-all ${isAnalyzing || !file ? 'bg-slate-300' : 'bg-[#117b6f] hover:bg-[#0c5c53] shadow-teal-200 hover:-translate-y-1'}`}
                >
                  {isAnalyzing ? "🔬 กำลังวิเคราะห์..." : "เริ่มการวินิจฉัย"}
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
          fixed inset-0 z-40 bg-white flex flex-col shadow-2xl transition-transform duration-300 transform
          md:relative md:translate-x-0 md:w-[400px] md:h-full md:z-10 md:border-l md:border-slate-200
          ${showChat ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}>
          <div className="flex-none p-4 md:p-6 bg-[#117b6f] flex items-center justify-between z-10 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white border-2 border-[#16c6a4] rounded-xl flex items-center justify-center text-xl shadow-sm">🤖</div>
              <div>
                <h3 className="font-black text-white text-sm md:text-base">Dr. AI Assistant</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 bg-[#6ee7b7] rounded-full animate-pulse shadow-[0_0_5px_#6ee7b7]"></span>
                  <p className="text-[10px] md:text-xs font-bold text-[#6ee7b7] uppercase tracking-widest drop-shadow-sm">Online</p>
                </div>
              </div>
            </div>
            <button onClick={() => setShowChat(false)} className="md:hidden text-teal-100 hover:text-white p-2 font-bold text-sm transition-colors">
              ปิดแชต ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:pr-2 md:pl-6 md:py-6 space-y-4 md:space-y-6 bg-slate-50/30">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 md:p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-[#117b6f] text-white rounded-tr-none font-medium' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none font-medium whitespace-pre-wrap'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {/* โหลดดิ้งสถานะกำลังพิมพ์... */}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-4 shadow-sm flex gap-1.5 items-center">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="flex-none p-4 md:p-6 border-t bg-white z-10">
            <div className="relative flex items-center">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="สอบถามข้อมูลสุขภาพผิว..." 
                className="w-full bg-slate-100 border-none rounded-2xl py-3.5 px-5 pr-12 text-sm focus:ring-2 focus:ring-[#117b6f] transition-all" 
              />
              <button type="submit" className="absolute right-2 bg-[#117b6f] text-white p-2 rounded-xl hover:bg-[#0c5c53] shadow-lg transition-transform active:scale-90">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
              </button>
            </div>
          </form>
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