'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Plus, Sun, Moon } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}`;

export default function Twin() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const [sessionId, setSessionId] = useState<string>('');
  const [isDark, setIsDark] = useState<boolean>(true);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check if avatar image exists (supports both avatar.jpg and avatar.png)
  useEffect(() => {
    fetch('/avatar.jpg', { method: 'HEAD' })
      .then((res) => {
        if (res.ok) {
          setAvatarSrc('/avatar.jpg');
        } else {
          fetch('/avatar.png', { method: 'HEAD' })
            .then((res2) => {
              if (res2.ok) setAvatarSrc('/avatar.png');
            })
            .catch(() => setAvatarSrc(null));
        }
      })
      .catch(() => {
        fetch('/avatar.png', { method: 'HEAD' })
          .then((res2) => {
            if (res2.ok) setAvatarSrc('/avatar.png');
          })
          .catch(() => setAvatarSrc(null));
      });
  }, []);

  // Load and apply theme preference on mount (default to dark)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedTheme = localStorage.getItem('twin_theme');
    const activeDark = savedTheme ? savedTheme === 'dark' : true;
    setIsDark(activeDark);
    document.documentElement.classList.toggle('dark', activeDark);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (typeof window !== 'undefined') {
      localStorage.setItem('twin_theme', nextDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', nextDark);
    }
  };

  // Restore previous session from localStorage and backend
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Immediately restore messages from local cache for zero-latency display
    const cachedMessages = localStorage.getItem('twin_messages');
    if (cachedMessages) {
      try {
        const parsed = JSON.parse(cachedMessages);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(
            parsed.map((m: { id: string; role: string; content: string; timestamp?: string }) => ({
              id: m.id || String(Date.now()),
              role: m.role as 'user' | 'assistant',
              content: m.content,
              timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
            }))
          );
        }
      } catch (err) {
        console.error('Failed to parse cached messages:', err);
      }
    }

    // 2. Sync with backend if session ID exists
    const savedSessionId = localStorage.getItem('twin_session_id');
    if (savedSessionId) {
      setSessionId(savedSessionId);
      setIsRestoring(true);

      fetch(`${API_BASE_URL}/conversation/${savedSessionId}`)
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to fetch conversation (${res.status})`);
          return res.json();
        })
        .then((data) => {
          if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
            const formatted: Message[] = data.messages.map(
              (m: { role: string; content: string; timestamp?: string }, idx: number) => ({
                id: `${savedSessionId}-${idx}`,
                role: m.role as 'user' | 'assistant',
                content: m.content,
                timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
              })
            );
            setMessages(formatted);
            localStorage.setItem('twin_messages', JSON.stringify(formatted));
          }
        })
        .catch((err) => {
          console.warn('Session sync warning (using cached conversation if available):', err);
        })
        .finally(() => {
          setIsRestoring(false);
          setTimeout(() => {
            inputRef.current?.focus();
          }, 100);
        });
    } else {
      setIsRestoring(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => {
      const next = [...prev, userMessage];
      if (typeof window !== 'undefined') {
        localStorage.setItem('twin_messages', JSON.stringify(next));
      }
      return next;
    });
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          session_id: sessionId || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();

      // Persist session ID to state and localStorage
      if (data.session_id) {
        setSessionId(data.session_id);
        if (typeof window !== 'undefined') {
          localStorage.setItem('twin_session_id', data.session_id);
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => {
        const next = [...prev, assistantMessage];
        if (typeof window !== 'undefined') {
          localStorage.setItem('twin_messages', JSON.stringify(next));
        }
        return next;
      });
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => {
        const next = [...prev, errorMessage];
        if (typeof window !== 'undefined') {
          localStorage.setItem('twin_messages', JSON.stringify(next));
        }
        return next;
      });
    } finally {
      setIsLoading(false);
      // Automatically refocus the input after response is received
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleNewChat = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('twin_session_id');
      localStorage.removeItem('twin_messages');
    }
    setSessionId('');
    setMessages([]);
    setInput('');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#0b1120] border border-gray-200/80 dark:border-[#1e293b] rounded-lg shadow-lg dark:shadow-2xl transition-colors duration-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 dark:from-slate-800 dark:to-slate-950 text-white p-4 rounded-t-lg flex items-center justify-between border-b border-transparent dark:border-[#1e293b] transition-colors duration-200">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bot className="w-6 h-6 text-cyan-400" />
            AI Digital Twin
          </h2>
          <p className="text-sm text-slate-300 mt-1">Your AI course companion</p>
        </div>

        {/* Action Controls: Theme Switcher & New Chat */}
        <div className="flex items-center gap-2">
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-200 hover:text-white bg-slate-600/70 hover:bg-slate-600 dark:bg-slate-800/80 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-500/40 dark:border-slate-700"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-slate-200" />
            )}
          </button>

          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-600/80 hover:bg-slate-600 dark:bg-slate-800/90 dark:hover:bg-slate-700 border border-slate-500/40 dark:border-slate-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            title="Start a new chat session"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 dark:bg-[#020617] transition-colors duration-200">
        {isRestoring ? (
          <div className="text-center text-gray-500 dark:text-slate-400 mt-8">
            <Bot className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-cyan-400/70 animate-pulse" />
            <p className="text-sm">Restoring previous session...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-slate-400 mt-8">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="Digital Twin Avatar"
                className="w-20 h-20 rounded-full mx-auto mb-3 border-2 border-gray-300 dark:border-cyan-500/40 object-cover shadow-sm"
              />
            ) : (
              <Bot className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-cyan-400/80" />
            )}
            <p className="font-medium text-gray-700 dark:text-slate-200">Hello! I&apos;m your Digital Twin.</p>
            <p className="text-sm mt-1">Ask me anything about AI deployment!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt="Digital Twin Avatar"
                      className="w-8 h-8 rounded-full border border-slate-300 dark:border-cyan-500/40 object-cover shadow-xs"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-slate-700 dark:bg-cyan-950/80 border border-transparent dark:border-cyan-500/30 rounded-full flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white dark:text-cyan-400" />
                    </div>
                  )}
                </div>
              )}

              <div
                className={`max-w-[70%] rounded-lg p-3 shadow-sm transition-colors ${message.role === 'user'
                  ? 'bg-slate-700 dark:bg-slate-800 text-white border border-transparent dark:border-slate-700/60'
                  : 'bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-[#1e293b] text-gray-800 dark:text-slate-100'
                  }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${message.role === 'user'
                    ? 'text-slate-300 dark:text-slate-400'
                    : 'text-gray-500 dark:text-slate-400'
                    }`}
                >
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-600 dark:bg-slate-700 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt="Digital Twin Avatar"
                  className="w-8 h-8 rounded-full border border-slate-300 dark:border-cyan-500/40 object-cover shadow-xs"
                />
              ) : (
                <div className="w-8 h-8 bg-slate-700 dark:bg-cyan-950/80 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white dark:text-cyan-400" />
                </div>
              )}
            </div>
            <div className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-[#1e293b] rounded-lg p-3 shadow-sm">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 dark:bg-cyan-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 dark:bg-cyan-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 dark:bg-cyan-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-[#1e293b] p-4 bg-white dark:bg-[#0f172a] rounded-b-lg transition-colors duration-200">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-[#1e293b] rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 dark:focus:ring-cyan-500/60 focus:border-transparent text-gray-800 dark:text-slate-100 bg-white dark:bg-[#020617] placeholder-gray-400 dark:placeholder-slate-500 transition-colors"
            disabled={isLoading || isRestoring}
            autoFocus
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading || isRestoring}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-800 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 dark:focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}