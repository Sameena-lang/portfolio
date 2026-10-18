import React, { useEffect, useRef, useState } from 'react';
import { Bot, Loader2, MessageSquare, Send, Sparkles, X } from 'lucide-react';

type GeminiModelOption =
  | 'gemini-3.1-flash-lite'
  | 'gemini-3.5-flash'
  | 'gemini-3.1-pro-preview';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  modelUsed?: string;
}

const MODEL_OPTIONS: Array<{
  id: GeminiModelOption;
  label: string;
  badge: string;
}> = [
  {
    id: 'gemini-3.1-flash-lite',
    label: 'Flash Lite',
    badge: 'Fast · Low-Latency',
  },
  {
    id: 'gemini-3.5-flash',
    label: 'Gemini 3.5 Flash',
    badge: 'General Tasks',
  },
  {
    id: 'gemini-3.1-pro-preview',
    label: 'Gemini 3.1 Pro',
    badge: 'Complex Reasoning',
  },
];

export const GeminiChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<GeminiModelOption>('gemini-3.5-flash');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! I am Sameena P's AI Portfolio Assistant. Ask me about her AI & Data Science projects (Diabetes Prediction, Brain Tumor MRI CNN, SEO Brilliance, InstaGuard AI, Annapathiram Catering), her internships, or deep technical questions.",
      modelUsed: 'gemini-3.5-flash',
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt ?? input).trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: textToSend,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages: nextHistory.map((m) => ({ role: m.role, text: m.text })),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            role: 'model',
            text: data.error || 'Could not generate a response.',
            modelUsed: selectedModel,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `m_${Date.now()}`,
            role: 'model',
            text: data.text,
            modelUsed: data.modelUsed || selectedModel,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'model',
          text: 'Network error while reaching the Gemini server endpoint.',
          modelUsed: selectedModel,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-[#A855F7] hover:bg-[#9333EA] text-[#FAF8FF] font-semibold text-xs shadow-2xl shadow-[#A855F7]/30 transition-transform hover:scale-105 cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Ask Sameena’s AI Assistant</span>
        </button>
      ) : (
        <div className="w-[350px] sm:w-[410px] h-[540px] rounded-2xl bg-[#09070E]/95 backdrop-blur-2xl border border-[#A855F7]/40 shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-white/10 bg-[#050505] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#A855F7]/20 border border-[#A855F7]/50 flex items-center justify-center">
                <Bot className="w-4 h-4 text-[#C084FC]" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#FAF8FF]">
                  Sameena P · AI Portfolio Chat
                </div>
                <div className="text-[11px] text-[#C084FC] font-mono-tabular">
                  Multi-Turn Gemini Studio
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close AI Chatbot"
              className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-[#FAF8FF] hover:bg-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Model Tier Selector (Flash Lite / 3.5 Flash / 3.1 Pro) */}
          <div className="px-3 py-2 bg-[#050505]/70 border-b border-white/10 flex items-center gap-1">
            {MODEL_OPTIONS.map((opt) => {
              const active = selectedModel === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedModel(opt.id)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-medium transition-colors cursor-pointer text-center ${
                    active
                      ? 'bg-[#A855F7] text-[#FAF8FF] font-semibold'
                      : 'text-[#A1A1AA] hover:text-[#FAF8FF] bg-white/5'
                  }`}
                  title={opt.badge}
                >
                  <div>{opt.label}</div>
                </button>
              );
            })}
          </div>

          {/* Scrollable Message Thread */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#A855F7] text-[#FAF8FF] font-medium'
                      : 'bg-white/5 border border-white/10 text-[#FAF8FF]'
                  }`}
                >
                  {msg.text}
                </div>
                {msg.modelUsed && msg.role === 'model' && (
                  <span className="text-[10px] font-mono-tabular text-[#A1A1AA] mt-1 px-1">
                    {msg.modelUsed}
                  </span>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-[#C084FC] px-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Thinking with {selectedModel}...</span>
              </div>
            )}
            <div ref={threadEndRef} />
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="px-3 py-1.5 border-t border-white/5 flex items-center gap-1.5 overflow-x-auto">
            {[
              'Summarize Sameena’s AI projects',
              'Explain her MRI CNN pipeline',
              'Why hire Sameena for AI/Full-Stack?',
            ].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleSend(q)}
                className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-[#A1A1AA] hover:text-[#FAF8FF] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Sparkles className="w-2.5 h-2.5 inline mr-1 text-[#C084FC]" />
                {q}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-white/10 bg-[#050505] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about Sameena’s work..."
              className="flex-1 px-3 py-2 rounded-xl bg-[#09070E] border border-white/15 text-xs text-[#FAF8FF] focus:outline-none focus:border-[#A855F7]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-[#A855F7] hover:bg-[#9333EA] disabled:opacity-40 text-[#FAF8FF] transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
