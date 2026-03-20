//----------------------------------------------------------------------------------
// 1 march - FULLY SYNCHED WITH SUPREME BACKEND
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const ChatAssistant = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // --- SAFE DATA EXTRACTION FOR BOB ---
  // We need to extract this safely so Bob gets the exact topic and score
  const rootPayload = location.state?.full_data || location.state || {};
  const aiPayload = rootPayload.feedback || rootPayload.report || rootPayload || {};
  
  const score = location.state?.total_score || aiPayload.score || rootPayload.score || "N/A";
  const topic = location.state?.topic || rootPayload.selectedDomain || rootPayload.domain || aiPayload.topic || "General Interview";

  // 1. Initialize Hooks
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isOpen]);

  // Initial Context Message
  useEffect(() => {
    // Now it works for BOTH report pages
    if ((location.pathname === '/report' || location.pathname === '/resume-report') && messages.length === 0) {
        setMessages([{ 
            role: 'ai', 
            text: `Assessment Complete! Your global score is ${score}/100. I'm Bob, your forensic coach. I'm here to explain your results.` 
        }]);
    }
  }, [location.pathname, score, messages.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInput("");
    setIsTyping(true);

    // try {
    //     // ⚠️ CRITICAL CHANGE: Use LOCALHOST to see the terminal logs in VS Code!
    //     // Once everything works perfectly, you can change this back to your onrender URL.
    //     const res = await axios.post('http://localhost:8000/chat', { 
    //         message: userText,
    //         context: { 
    //             page: location.pathname === '/resume-report' ? "Resume Report" : "Interview Report", 
    //             topic: topic,  // Extracted securely above
    //             score: score   // Extracted securely above
    //         } 
    //     });
    try {
        // FIXED: Now using the dynamic Vercel/Render URL for the AI Engine
        const AI_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000';
        
        const res = await axios.post(`${AI_URL}/chat`, { 
            message: userText,
            context: { 
                page: location.pathname === '/resume-report' ? "Resume Report" : "Interview Report", 
                topic: topic,  
                score: score   
            } 
        });
        setMessages(prev => [...prev, { role: 'ai', text: res.data.reply }]);
    } catch (error) {
        console.error("Chat Error:", error);
        setMessages(prev => [...prev, { role: 'ai', text: "Connection unstable. I can't reach the main server right now." }]);
    } finally {
        setIsTyping(false);
    }
  };

  // 2. Logic Check: Render on BOTH Report Pages
  if (location.pathname !== '/report' && location.pathname !== '/resume-report') {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      
      {/* CHAT WINDOW */}
      {isOpen && (
        <div className="bg-white w-80 md:w-96 h-96 shadow-2xl rounded-2xl border border-gray-200 overflow-hidden flex flex-col pointer-events-auto animate-slide-up mb-4">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="font-bold text-sm">MockShield Mentor (Bob)</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                    <i className="fa-solid fa-times text-lg"></i>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-xl text-sm leading-relaxed ${
                            msg.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-br-none shadow-md' 
                            : 'bg-white border border-gray-200 text-slate-700 rounded-bl-none shadow-sm font-medium'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-200 p-3 rounded-xl rounded-bl-none shadow-sm flex gap-1">
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2">
                <input
                    className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                    placeholder="Ask Bob about your feedback..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isTyping}
                />
                <button 
                    type="submit" 
                    disabled={isTyping || !input.trim()}
                    className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                    <i className="fa-solid fa-paper-plane text-sm"></i>
                </button>
            </form>
        </div>
      )}

      {/* FLOATING BUTTON */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto w-14 h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 group border-2 border-slate-700"
      >
        {isOpen ? (
            <i className="fa-solid fa-chevron-down text-xl"></i>
        ) : (
            <i className="fa-solid fa-robot text-2xl group-hover:animate-bounce"></i>
        )}
      </button>

    </div>
  );
};

export default ChatAssistant;