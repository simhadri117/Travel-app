import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { Send, Sparkles, User, Loader2 } from 'lucide-react';

const SUGGESTIONS = [
  { emoji: '✈️', text: 'Suggest a 3-day budget trip to Goa' },
  { emoji: '🌏', text: 'Visa requirements for Thailand from India' },
  { emoji: '🎒', text: 'Smart packing tips for a 7-day trip' },
  { emoji: '🏖️', text: 'Best places to visit in Jaipur in 2 days' },
  { emoji: '💰', text: 'Budget breakdown for a Manali trip' },
  { emoji: '🍜', text: 'Best food spots in Mumbai for foodies' },
];

export default function Assistant() {
  const [messages, setMessages] = useState<any[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Hi there! I'm your **TravelSphere AI** assistant. 🌍\n\nI can help you with travel itineraries, visa info, packing checklists, local recommendations and much more. What would you like to explore?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const history = messages.filter(m => m.id !== 'welcome').map(m => ({ role: m.role, text: m.text }));
      const res = await api.post('/assistant/chat', { message: text, chatHistory: history });
      if (res.data.success) {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', text: res.data.message }]);
      }
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', text: '⚠️ Unable to reach the AI. Check your connection and try again.' }]);
    } finally { setLoading(false); }
  };

  const formatText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />');
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="card p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-600 rounded-2xl flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-sm">TravelSphere AI</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-[11px] text-emerald-600 font-semibold">Online · Travel Expert</span>
            </div>
          </div>
        </div>
        <span className="badge badge-blue">Powered by Gemini</span>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-4 px-1 py-2">
        {messages.map(m => {
          const isUser = m.role === 'user';
          return (
            <div key={m.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} max-w-[85%] ${isUser ? 'ml-auto' : ''}`}>
              <div className={`w-8 h-8 rounded-2xl flex-shrink-0 flex items-center justify-center ${isUser ? 'bg-brand-600' : 'bg-slate-100'}`}>
                {isUser ? <User size={14} className="text-white" /> : <Sparkles size={14} className="text-brand-600" />}
              </div>
              <div
                className={`px-4 py-3 rounded-3xl text-sm leading-relaxed ${
                  isUser
                    ? 'bg-brand-600 text-white rounded-tr-lg'
                    : 'bg-white border border-slate-100 shadow-sm text-slate-700 rounded-tl-lg'
                }`}
                dangerouslySetInnerHTML={{ __html: formatText(m.text) }}
              />
            </div>
          );
        })}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="w-8 h-8 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Loader2 size={14} className="text-brand-600 animate-spin" />
            </div>
            <div className="px-4 py-3 rounded-3xl rounded-tl-lg bg-white border border-slate-100 shadow-sm">
              <div className="flex gap-1 items-center h-5">
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && !loading && (
        <div className="py-3">
          <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Quick questions</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map(s => (
              <button key={s.text} onClick={() => sendMessage(s.text)} className="chip text-xs">
                {s.emoji} {s.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <form
        onSubmit={e => { e.preventDefault(); sendMessage(input); }}
        className="card p-3 mt-3 flex gap-3 items-center"
      >
        <input
          type="text"
          placeholder="Ask about visas, trips, packing, restaurants..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
          className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn btn-sm btn-primary rounded-xl disabled:opacity-50 flex-shrink-0"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
