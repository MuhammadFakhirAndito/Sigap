'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, ThumbsUp, ThumbsDown, Sparkles, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  source?: 'LLM' | 'FALLBACK' | 'CACHE';
  model?: string;
  responseTimeMs?: number;
  logId?: string;
  feedbackGiven?: 'up' | 'down' | null;
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Halo! Saya asisten virtual SIGAP. Anda dapat menanyakan informasi gempa terbaru, penjelasan potensi tsunami, protokol evakuasi, atau panduan tas siaga bencana.',
      source: 'LLM',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsgId = Date.now().toString();
    const newMessages: ChatMessage[] = [
      ...messages,
      { id: userMsgId, sender: 'user', text: text.trim() },
    ];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pertanyaan: text.trim() }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: data.jawaban || 'Tidak ada respon yang dapat diberikan.',
          source: data.source,
          model: data.model,
          responseTimeMs: data.responseTimeMs,
          logId: data.logId,
          feedbackGiven: null,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: 'Gagal menghubungi server chat. Harap periksa koneksi internet Anda atau coba lagi nanti.',
          source: 'FALLBACK',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (msgId: string, logId: string, isHelpful: boolean) => {
    try {
      await fetch('/api/chat/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId, isHelpful }),
      });

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === msgId ? { ...msg, feedbackGiven: isHelpful ? 'up' : 'down' } : msg
        )
      );
    } catch (err) {
      console.warn('Gagal mencatat feedback evaluasi:', err);
    }
  };

  const quickQuestions = [
    'Gempa terbaru hari ini di mana?',
    'Apa protokol Drop, Cover, and Hold On?',
    'Kapan gempa berpotensi memicu tsunami?',
    'Apa saja isi Tas Siaga Bencana (TSB)?',
  ];

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-xl shadow-rose-600/30 hover:scale-105 active:scale-95 transition-all focus:outline-hidden"
        title="Buka Chatbot AI SIGAP"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>

      {/* Chat Window Drawer */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 flex h-[580px] w-[calc(100vw-2rem)] sm:w-[420px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-rose-600 to-amber-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-xs">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">SIGAP Chatbot AI</h3>
                <span className="flex items-center gap-1 text-[11px] text-rose-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  RAG Gempa & Fallback Bertingkat
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Quick Prompts */}
          <div className="flex gap-1.5 overflow-x-auto border-b border-slate-100 bg-slate-50 p-2 text-xs dark:border-slate-800 dark:bg-slate-950/60 scrollbar-none">
            {quickQuestions.map((q, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={() => handleSend(q)}
                disabled={loading}
                className="shrink-0 rounded-full border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-rose-900 dark:hover:bg-rose-950/40 h-7"
              >
                {q}
              </Button>
            ))}
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn('flex gap-2.5', msg.sender === 'user' ? 'justify-end' : 'justify-start')}
              >
                {msg.sender === 'bot' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm',
                    msg.sender === 'user'
                      ? 'bg-rose-600 text-white rounded-tr-xs'
                      : 'bg-slate-100 text-slate-900 rounded-tl-xs dark:bg-slate-800 dark:text-slate-100'
                  )}
                >
                  <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

                  {/* Metadata & Feedback bar for Bot answers */}
                  {msg.sender === 'bot' && msg.id !== 'welcome' && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {msg.source === 'LLM' && (
                          <Badge variant="secondary" className="gap-0.5 font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded text-[10px]">
                            <Sparkles className="h-3 w-3" /> {msg.model || 'Gemini AI'}
                          </Badge>
                        )}
                        {msg.source === 'FALLBACK' && (
                          <Badge variant="secondary" className="gap-0.5 font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded text-[10px]">
                            <AlertCircle className="h-3 w-3" /> FAQ Rule-Based
                          </Badge>
                        )}
                        {msg.source === 'CACHE' && (
                          <Badge variant="secondary" className="gap-0.5 font-medium text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/50 px-1.5 py-0.5 rounded text-[10px]">
                            Cache 1 Jam
                          </Badge>
                        )}
                        {msg.responseTimeMs !== undefined && (
                          <span className="flex items-center gap-0.5 text-slate-400 text-[10px]">
                            <Clock className="h-3 w-3" /> {msg.responseTimeMs}ms
                          </span>
                        )}
                      </div>

                      {/* Evaluasi Kepuasan (FR-DB-21) */}
                      {msg.logId && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleFeedback(msg.id, msg.logId!, true)}
                            disabled={msg.feedbackGiven !== null}
                            className={cn(
                              'h-6 w-6 p-0 rounded',
                              msg.feedbackGiven === 'up'
                                ? 'text-emerald-600 font-bold'
                                : 'text-slate-400 hover:text-emerald-600'
                            )}
                            title="Jawaban ini membantu"
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleFeedback(msg.id, msg.logId!, false)}
                            disabled={msg.feedbackGiven !== null}
                            className={cn(
                              'h-6 w-6 p-0 rounded',
                              msg.feedbackGiven === 'down'
                                ? 'text-rose-600 font-bold'
                                : 'text-slate-400 hover:text-rose-600'
                            )}
                            title="Jawaban ini kurang tepat"
                          >
                            <ThumbsDown className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-center text-slate-400 text-xs py-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950">
                  <Bot className="h-4 w-4 animate-spin" />
                </div>
                <span>Menganalisis data gempa & merumuskan jawaban...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="border-t border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tanyakan mitigasi gempa atau data terkini..."
                disabled={loading}
                className="flex-1 rounded-xl text-xs h-9 bg-white dark:bg-slate-900"
              />
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                className="h-9 w-9 rounded-xl bg-rose-600 text-white shadow-xs hover:bg-rose-700 disabled:opacity-50 transition-colors p-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-1 text-[10px] text-center text-slate-400">
              Evaluasi laporan kuliah: Waktu respons & feedback dicatat otomatis
            </div>
          </form>
        </div>
      )}
    </>
  );
}
