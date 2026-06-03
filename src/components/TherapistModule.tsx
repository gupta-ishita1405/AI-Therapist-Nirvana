import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Heart, ShieldAlert, Sparkles, Send, Search, RefreshCw, Smile, Compass, ChevronRight } from "lucide-react";
import { ChatSession, ChatMessage } from "../types";

interface TherapistModuleProps {
  token: string;
  onCrisisAlert: (active: boolean) => void;
}

export default function TherapistModule({ token, onCrisisAlert }: TherapistModuleProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<
  "General" |
  "Stress" |
  "Anxiety" |
  "Depression" |
  "Loneliness" |
  "Motivation" |
  "Self Confidence" |
  "Relationships" |
  "Career"
>("General");
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const categories = [
  "General",
  "Stress",
  "Anxiety",
  "Depression",
  "Loneliness",
  "Motivation",
  "Self Confidence",
  "Relationships",
  "Career"
];
  useEffect(() => {
    fetchSessions();
  }, [token]);

  useEffect(() => {
    if (activeSession) {
      fetchMessages(activeSession.id);
    }
  }, [activeSession]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/chat/sessions", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setSessions(data);
        if (data.length > 0 && !activeSession) {
          setActiveSession(data[0]);
        }
      }
    } catch (err) {
      console.warn("Failed to retrieve chat session history headers:", err);
    }
  };

  const fetchMessages = async (sid: string) => {
    try {
      const res = await fetch(`/api/chat/messages/${sid}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setMessages(data);
        // Sync parent crisis banner state
        const anyCrisis = data.some(m => m.sender === "ai" && m.copingStrategies && m.stressLevel && m.stressLevel > 90);
        onCrisisAlert(anyCrisis);
      }
    } catch {
      console.warn("Failed to load dialogue detail logs.");
    }
  };

  const startNewSession = async (catName?: string) => {
    setLoading(true);
    const selectedCat = catName || category;
    try {
      const res = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          category: selectedCat,
          title: `Dialogue: ${selectedCat} Composure`
        })
      });
      const data = await res.json();
      if (data && data.id) {
        setSessions([data, ...sessions]);
        setActiveSession(data);
        setMessages([]);
      }
    } catch (err) {
      console.warn("Failed to generate custom AI session:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeSession || typing) return;

    const userText = input;
    setInput("");
    setTyping(true);

    // Optimistically push client dialogue
    const tempUserMsg: ChatMessage = {
      id: "temp_user_" + Date.now(),
      sessionId: activeSession.id,
      sender: "user",
      content: userText,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await fetch("/api/chat/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: activeSession.id,
          content: userText
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Establish connection failure");
      }

      // Append official server validated user + AI response object logs
      setMessages(prev => {
        const cleared = prev.filter(m => m.id !== tempUserMsg.id);
        return [...cleared, data.userMessage, data.aiMessage];
      });

      if (data.analysis?.crisisDetected) {
        onCrisisAlert(true);
      }
    } catch (err) {
      console.error("AI interaction pipeline failed:", err);
      // Failover safely
      const mockReply: ChatMessage = {
        id: "fail_" + Date.now(),
        sessionId: activeSession.id,
        sender: "ai",
        content: "I want to hold space for you. However, our connection sanctuary had a momentary ripple. Close your eyes, inhale for 4 seconds, and let's retry.",
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, mockReply]);
    } finally {
      setTyping(false);
    }
  };

  // Chat message query filtering
  const filteredMessages = messages.filter(m => 
    m.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div id="therapy_manager" className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-200px)]">
      
      {/* Session Navigation Column */}
      <div className="lg:col-span-4 bg-white dark:bg-[#171A18] rounded-3xl border border-black/5 dark:border-white/5 p-6 flex flex-col justify-between h-full overflow-hidden shadow-sm">
        <div className="space-y-6 h-[80%] flex flex-col">
          <div className="space-y-1">
            <h3 className="font-display font-medium text-lg text-gray-800 dark:text-neutral-100">Counseling Modules</h3>
          </div>

          {/* Quick theme trigger buttons */}
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat, i) => (
              <button
                key={i}
                id={`cat_select_btn_${cat}`}
                onClick={() => {
                  setCategory(cat as any);
                  startNewSession(cat);
                }}
                className={`text-left text-xs px-3 py-2 rounded-xl border transition-all truncate ${
                  activeSession?.category === cat 
                    ? "bg-[#93C572] text-[#1E3013] font-medium border-[#93C572]"
                    : "bg-black/5 dark:bg-white/5 text-gray-500 dark:text-neutral-400 hover:bg-black/10 dark:hover:bg-white/10 border-transparent"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Existing conversational headers list */}
          <div className="space-y-2 pt-2 border-t border-black/5 dark:border-white/5 flex-1 overflow-y-auto pr-1">
            <span className="text-[10px] font-mono text-gray-400 dark:text-neutral-500 uppercase tracking-widest block mb-2">History Dialogues</span>
            {sessions.length === 0 ? (
              <p className="text-xxs text-gray-400 dark:text-neutral-500 font-light italic">No historical dialogues. Choose a wellness category above to start.</p>
            ) : (
              sessions.map((sess, idx) => (
                <div
                  key={idx}
                  id={`sess_card_${sess.id}`}
                  onClick={() => setActiveSession(sess)}
                  className={`p-3.5 rounded-xl cursor-pointer transition-colors border text-left flex items-center justify-between ${
                    activeSession?.id === sess.id
                      ? "bg-[#93C572]/5 dark:bg-[#93C572]/10 border-[#93C572]"
                      : "bg-transparent border-transparent hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <div className="space-y-1 truncate max-w-[85%]">
                    <span className="text-xs font-semibold text-gray-700 dark:text-neutral-200 block truncate">{sess.title}</span>
                    <span className="text-[9px] text-[#93C572] font-mono uppercase bg-[#93C572]/10 px-1.5 py-0.5 rounded-full inline-block">
                      {sess.category}
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-500" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick bottom relaunch support */}
        <button
          id="relaunch_general_counsel"
          onClick={() => startNewSession("General")}
          className="w-full mt-4 py-3 bg-[#93C572]/10 hover:bg-[#93C572]/20 text-[#7FB060] dark:text-[#A8D48D] text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-1.5"
        >
          <Compass className="w-4 h-4 animate-spin-slow" />
          <span>History Chat</span>
        </button>
      </div>

      {/* Main Dialetical Chat Dialogue Container */}
      <div className="lg:col-span-8 bg-white dark:bg-[#171A18] rounded-3xl border border-black/5 dark:border-white/5 flex flex-col justify-between h-full overflow-hidden shadow-sm">
        
        {/* Upper Search Bar & Branding Header */}
        <div className="p-4 sm:p-5 border-b border-black/5 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-black/[0.01] dark:bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#93C572]/10 flex items-center justify-center text-[#93C572]">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white">{activeSession?.title || "Sanctuary Dialogue"}</h3>
              <span className="text-[10px] text-gray-400 dark:text-neutral-400 font-light">Equipped with  Gemini therapy care</span>
            </div>
          </div>

          {/* Quick Query Search filter */}
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400 dark:text-neutral-500" />
            <input
              id="chat_search_input"
              type="text"
              placeholder="Search dialogues..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#F5F7F4] dark:bg-[#111311] border border-black/5 dark:border-white/5 pl-8 pr-2.5 py-1.5 text-xxs font-light rounded-xl focus:outline-none focus:ring-1 focus:ring-[#93C572] dark:text-white"
            />
          </div>
        </div>

        {/* Scrolling Dialogue Logs */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#F5F7F4]/40 dark:bg-[#111311]/40">
          
          {/* Welcome disclaimer bubble */}
          

          {filteredMessages.map((msg, i) => {
            const isUser = msg.sender === "user";
            return (
              <div 
                key={i} 
                id={`chat_bubble_${msg.id}`}
                className={`flex gap-3 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                {/* Visual Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-serif shrink-0 ${
                  isUser ? "bg-[#A5D08F] text-[#1E3013]" : "bg-[#93C572] text-white"
                }`}>
                  {isUser ? "U" : "N"}
                </div>

                {/* Message Core Bubble */}
                <div className="space-y-2">
                  <div className={`p-4 rounded-3xl ${
                    isUser 
                      ? "bg-[#93C572] text-[#1E3013] rounded-tr-none shadow-sm" 
                      : "bg-white dark:bg-[#1C201D] text-gray-800 dark:text-neutral-200 rounded-tl-none border border-black/5 dark:border-white/5 shadow-sm"
                  }`}>
                    <p className="text-xs font-light leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>

                  {/* AI Metadata Sentiment Analyser metrics block */}
                  {!isUser && msg.emotion && (
                    <div className="bg-white/50 dark:bg-[#1B1E1C]/60 p-3 rounded-2xl border border-black/5 dark:border-white/5 text-[10px] font-light text-gray-500 dark:text-neutral-400 space-y-2 max-w-sm">
                      <div className="flex justify-between font-mono uppercase text-xxs tracking-wider border-b border-black/5 dark:border-white/5 pb-1 text-gray-400 dark:text-neutral-500">
                        <span>Sentiment Diagnostic</span>
                        <span className="text-[#93C572] font-semibold">{msg.sentiment}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>Stress Rating: <strong className="font-semibold">{msg.stressLevel}%</strong></div>
                        <div>Anxiety Index: <strong className="font-semibold">{msg.anxietyLevel}%</strong></div>
                      </div>
                      <div className="text-[9px] bg-black/5 dark:bg-white/5 p-1.5 rounded-lg text-gray-600 dark:text-neutral-300">
                        <strong className="text-gray-700 dark:text-white">Suggested exercise:</strong> {msg.breathingExercise || "Deep sighing breaths"}
                      </div>
                      {msg.copingStrategies && msg.copingStrategies.length > 0 && (
                        <div className="space-y-1">
                          <span className="font-semibold text-gray-700 dark:text-neutral-300">Empathetic recommendations:</span>
                          <ul className="list-disc list-inside text-[9px] pl-1">
                            {msg.copingStrategies.slice(0, 2).map((st, idx) => <li key={idx}>{st}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Active Typing Animation */}
          {typing && (
            <div className="flex gap-3 mr-auto">
              <div className="w-8 h-8 rounded-full bg-[#93C572] text-white flex items-center justify-center text-xs font-serif shrink-0 animate-pulse">
                N
              </div>
              <div className="bg-white dark:bg-[#1C201D] p-3.5 rounded-3xl rounded-tl-none border border-black/5 dark:border-white/5 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#93C572]/70 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[#93C572]/70 animate-bounce delay-100" />
                <span className="w-2 h-2 rounded-full bg-[#93C572]/70 animate-bounce delay-200" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Absolute Bottom Input Bar */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-black/5 dark:border-white/5 flex items-center gap-3">
          <input
            id="chat_message_input"
            type="text"
            placeholder="Type your quiet thoughts... Our therapist is listening"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!activeSession || typing}
            className="flex-1 bg-[#F5F7F4] dark:bg-[#111311] border border-black/5 dark:border-white/5 px-5 py-3.5 rounded-2xl text-xs font-light focus:outline-none focus:ring-1 focus:ring-[#93C572] placeholder-gray-400 dark:text-white"
          />
          <button
            id="chat_send_btn"
            type="submit"
            disabled={!input.trim() || typing}
            className="w-[52px] h-[52px] bg-[#93C572] hover:bg-[#7FB060] disabled:bg-gray-200 dark:disabled:bg-[#2A2E2C] text-white flex items-center justify-center rounded-2xl transition-all shadow-md cursor-pointer disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5 text-[#1E3013]" />
          </button>
        </form>

      </div>

    </div>
  );
}
