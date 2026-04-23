"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Phone,
  PhoneOff,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  MessageSquare,
  Clock,
  Send,
  ArrowLeft,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Settings,
  X,
  Loader2,
  ChevronRight,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────

interface SmsMessage {
  sid: string;
  body: string;
  from: string;
  to: string;
  direction: string;
  dateCreated: string;
  status: string;
}

interface Conversation {
  phone: string;
  localPhone: string;
  messages: SmsMessage[];
  lastMessage: string;
  lastDate: string;
}

interface CallRecord {
  sid: string;
  from: string;
  to: string;
  status: string;
  direction: string;
  duration: string;
  startTime: string;
  endTime: string;
  dateCreated: string;
}

type Tab = "dialer" | "messages" | "history" | "settings";

const TWILIO_NUMBER = process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || "";

// ─── Utils ──────────────────────────────────────────────────────────────

function formatPhone(phone: string) {
  if (!phone) return "";
  // Simple format: +1 (347) 620-6116
  if (phone.startsWith("+1") && phone.length === 12) {
    return `+1 (${phone.slice(2, 5)}) ${phone.slice(5, 8)}-${phone.slice(8)}`;
  }
  return phone;
}

function timeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString("es-MX", { month: "short", day: "numeric" });
}

function formatDuration(seconds: string | number) {
  const s = typeof seconds === "string" ? parseInt(seconds, 10) : seconds;
  if (!s || s === 0) return "0s";
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Dialer Component ───────────────────────────────────────────────────

function Dialer({
  onCall,
  callState,
  onHangup,
  onMute,
  onSpeaker,
  isMuted,
  isSpeaker,
}: {
  onCall: (num: string) => void;
  callState: "idle" | "calling" | "connected" | "incoming";
  onHangup: () => void;
  onMute: () => void;
  onSpeaker: () => void;
  isMuted: boolean;
  isSpeaker: boolean;
}) {
  const [number, setNumber] = useState("");
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    if (callState === "connected") {
      setCallDuration(0);
      timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const isLongPressRef = useRef(false);

  const handlePointerDown = (num: string) => {
    isLongPressRef.current = false;
    if (num === "0") {
      longPressTimerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        setNumber((p) => p + "+");
      }, 500); // 500ms para considerar long press
    }
  };

  const handlePointerUp = (num: string) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    if (!isLongPressRef.current) {
      setNumber((p) => p + num);
    }
  };

  const handlePointerLeave = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  const dialPad = [
    { num: "1", sub: "" },
    { num: "2", sub: "ABC" },
    { num: "3", sub: "DEF" },
    { num: "4", sub: "GHI" },
    { num: "5", sub: "JKL" },
    { num: "6", sub: "MNO" },
    { num: "7", sub: "PQRS" },
    { num: "8", sub: "TUV" },
    { num: "9", sub: "WXYZ" },
    { num: "*", sub: "" },
    { num: "0", sub: "+" },
    { num: "#", sub: "" },
  ];

  if (callState === "calling" || callState === "connected") {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-4 gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-3xl font-bold shadow-lg shadow-blue-500/30">
            {number ? number[0] : "?"}
          </div>
          <p className="text-xl font-medium mt-4 text-white">{formatPhone(number)}</p>
          <p className="text-sm text-zinc-400">
            {callState === "calling" ? "Llamando..." : formatDuration(callDuration)}
          </p>
          {callState === "calling" && (
            <div className="flex gap-1 mt-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          )}
        </div>

        <div className="flex gap-8 mt-6">
          <button
            onClick={onMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isMuted ? "bg-white text-black" : "bg-zinc-800 text-white"
            }`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          <button
            onClick={onSpeaker}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isSpeaker ? "bg-white text-black" : "bg-zinc-800 text-white"
            }`}
          >
            {isSpeaker ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </button>
        </div>

        <button
          onClick={onHangup}
          className="mt-8 w-20 h-20 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/30 active:scale-95 transition-transform"
        >
          <PhoneOff className="w-8 h-8" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center flex-1 w-full justify-center px-4 py-6">
      {/* Number display */}
      <div className="h-16 flex items-center justify-center mb-4 w-full max-w-[320px]">
        <span className="text-3xl font-light text-white tracking-[0.15em] text-center truncate">
          {number || "\u00A0"}
        </span>
      </div>

      {/* Dial pad */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-[320px]">
        {dialPad.map(({ num, sub }) => (
          <button
            key={num}
            onPointerDown={() => handlePointerDown(num)}
            onPointerUp={() => handlePointerUp(num)}
            onPointerLeave={handlePointerLeave}
            className="w-full aspect-square max-w-[88px] mx-auto rounded-full bg-zinc-900/80 border border-zinc-800/50 flex flex-col items-center justify-center active:bg-zinc-700 active:scale-95 transition-all select-none touch-manipulation"
          >
            <span className="text-2xl font-light text-white pointer-events-none">{num}</span>
            {sub && <span className="text-[10px] tracking-widest text-zinc-500 mt-0.5 pointer-events-none">{sub}</span>}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex justify-center items-center mt-8 gap-10">
        <div className="w-16" />
        <button
          onClick={() => {
            if (number) onCall(number);
          }}
          className="w-[72px] h-[72px] rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-500/25 active:scale-95 transition-transform"
        >
          <Phone className="w-7 h-7 fill-current" />
        </button>
        <button
          onClick={() => setNumber((p) => p.slice(0, -1))}
          className="w-16 h-16 rounded-full text-zinc-500 flex items-center justify-center active:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" />
            <line x1="18" y1="9" x2="12" y2="15" />
            <line x1="12" y1="9" x2="18" y2="15" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Messages Component ─────────────────────────────────────────────────

function Messages({ activeLine }: { activeLine: string }) {
  const [conversations, setConversations] = useState<Record<string, Conversation>>({});
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [newConvoPhone, setNewConvoPhone] = useState("");
  const [showNew, setShowNew] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/sms");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat, conversations]);

  const sendMessage = async () => {
    const to = activeChat || newConvoPhone;
    if (!to || !newMsg.trim()) return;

    setSending(true);
    try {
      const res = await fetch("/api/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, body: newMsg.trim(), from: activeLine }),
      });
      if (res.ok) {
        setNewMsg("");
        if (showNew) {
          setShowNew(false);
          setActiveChat(newConvoPhone);
          setNewConvoPhone("");
        }
        await fetchMessages();
      }
    } catch {
      /* silently fail */
    } finally {
      setSending(false);
    }
  };

  // Chat detail view
  if (activeChat) {
    const convo = conversations[activeChat];
    const msgs = convo?.messages || [];
    // Sort by date
    const sorted = [...msgs].sort(
      (a, b) => new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime()
    );

    return (
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md">
          <button onClick={() => setActiveChat(null)} className="text-blue-500 active:text-blue-400">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <p className="text-base font-semibold text-white">{formatPhone(activeChat)}</p>
            <p className="text-xs text-zinc-500">{sorted.length} mensajes</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sorted.map((msg) => {
            const isMine = msg.direction !== "inbound";
            return (
              <div key={msg.sid} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMine
                      ? "bg-blue-600 text-white rounded-br-md"
                      : "bg-zinc-800 text-zinc-100 rounded-bl-md"
                  }`}
                >
                  <p>{msg.body}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? "text-blue-200/60" : "text-zinc-500"}`}>
                    {formatTime(msg.dateCreated)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md pb-safe">
          <input
            type="text"
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-zinc-800 text-white rounded-full px-4 py-2.5 text-sm outline-none placeholder-zinc-500 focus:ring-1 focus:ring-blue-500/50"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !newMsg.trim()}
            className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    );
  }

  // Conversations list
  const filteredConversations = Object.values(conversations).filter(c => c.localPhone === activeLine);
  const sortedConversations = filteredConversations.sort(
    (a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime()
  );

  return (
    <div className="flex flex-col flex-1 w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <h2 className="text-2xl font-bold">Mensajes</h2>
        <button
          onClick={() => setShowNew(!showNew)}
          className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl active:scale-95 transition-transform"
        >
          {showNew ? <X className="w-5 h-5" /> : <span className="leading-none">+</span>}
        </button>
      </div>

      {/* New conversation */}
      {showNew && (
        <div className="px-5 pb-3 flex gap-2">
          <input
            type="tel"
            value={newConvoPhone}
            onChange={(e) => setNewConvoPhone(e.target.value)}
            placeholder="+1 número destino..."
            className="flex-1 bg-zinc-900 text-white rounded-xl px-4 py-2.5 text-sm outline-none placeholder-zinc-500 border border-zinc-800 focus:border-blue-500/50"
          />
          <input
            type="text"
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            placeholder="Mensaje..."
            className="flex-1 bg-zinc-900 text-white rounded-xl px-4 py-2.5 text-sm outline-none placeholder-zinc-500 border border-zinc-800 focus:border-blue-500/50"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !newConvoPhone || !newMsg.trim()}
            className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-600" />
          </div>
        ) : sortedConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-3">
            <MessageSquare className="w-12 h-12" />
            <p>Sin mensajes</p>
          </div>
        ) : (
          sortedConversations.map((convo) => (
            <button
              key={convo.phone}
              onClick={() => setActiveChat(convo.phone)}
              className="w-full flex items-center gap-3 px-5 py-4 active:bg-zinc-900/50 transition-colors border-b border-zinc-900/50"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-semibold text-lg shrink-0">
                {convo.phone.slice(-2)}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white truncate">{formatPhone(convo.phone)}</p>
                  <p className="text-xs text-zinc-500 shrink-0 ml-2">{timeAgo(convo.lastDate)}</p>
                </div>
                <p className="text-sm text-zinc-400 truncate mt-0.5">{convo.lastMessage}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Call History Component ─────────────────────────────────────────────

function CallHistory({ onCallNumber, activeLine }: { onCallNumber: (num: string) => void; activeLine: string }) {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/calls");
        if (res.ok) {
          const data = await res.json();
          setCalls(data);
        }
      } catch {
        /* silently fail */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getCallIcon = (call: CallRecord) => {
    if (call.status === "no-answer" || call.status === "canceled") {
      return <PhoneMissed className="w-4 h-4 text-red-500" />;
    }
    if (call.direction === "inbound") {
      return <PhoneIncoming className="w-4 h-4 text-green-500" />;
    }
    return <PhoneOutgoing className="w-4 h-4 text-blue-500" />;
  };

  const getRemoteNumber = (call: CallRecord) => {
    return call.direction === "inbound" ? call.from : call.to;
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-hidden">
      <div className="px-5 pt-4 pb-3">
        <h2 className="text-2xl font-bold">Recientes</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-600" />
          </div>
        ) : calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-3">
            <Clock className="w-12 h-12" />
            <p>Sin llamadas recientes</p>
          </div>
        ) : (
          calls.filter(c => c.from === activeLine || c.to === activeLine).map((call) => {
            const remote = getRemoteNumber(call);
            const isMissed = call.status === "no-answer" || call.status === "canceled";
            return (
              <button
                key={call.sid}
                onClick={() => onCallNumber(remote)}
                className="w-full flex items-center gap-3 px-5 py-3.5 active:bg-zinc-900/50 transition-colors border-b border-zinc-900/50"
              >
                <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center shrink-0">
                  {getCallIcon(call)}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className={`text-sm font-medium ${isMissed ? "text-red-400" : "text-white"}`}>
                    {formatPhone(remote)}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-zinc-500 capitalize">
                      {call.direction === "inbound" ? "Entrante" : "Saliente"}
                    </span>
                    {call.duration && call.duration !== "0" && (
                      <span className="text-xs text-zinc-600">{formatDuration(call.duration)}</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-zinc-500">{timeAgo(call.dateCreated)}</p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Settings Component ─────────────────────────────────────────────────

function SettingsView({ activeLine, onLineChange }: { activeLine: string; onLineChange: (line: string) => void }) {
  const [numbers, setNumbers] = useState<{phone: string, friendlyName: string}[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [fallbackNumber, setFallbackNumber] = useState("");
  const [savingFallback, setSavingFallback] = useState(false);
  const [fallbackMsg, setFallbackMsg] = useState("");
  
  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg("");
    try {
      const res = await fetch("/api/sync-webhooks", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSyncMsg(data.message || "Sincronizado correctamente.");
      } else {
        setSyncMsg(data.error || "Error al sincronizar.");
      }
    } catch {
      setSyncMsg("Error de conexión.");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(""), 5000);
    }
  };

  const handleSaveFallback = async () => {
    setSavingFallback(true);
    setFallbackMsg("");
    try {
      const res = await fetch("/api/settings", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fallbackNumber: fallbackNumber.trim() })
      });
      if (res.ok) {
        setFallbackMsg("Guardado correctamente.");
      } else {
        setFallbackMsg("Error al guardar.");
      }
    } catch {
      setFallbackMsg("Error de conexión.");
    } finally {
      setSavingFallback(false);
      setTimeout(() => setFallbackMsg(""), 3000);
    }
  };
  
  useEffect(() => {
    fetch("/api/numbers")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setNumbers(data);
      })
      .catch(() => {});
      
    fetch("/api/settings")
      .then(r => r.json())
      .then(data => {
        if (data.fallbackNumber) setFallbackNumber(data.fallbackNumber);
      })
      .catch(() => {});
  }, []);
  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto">
      <div className="px-5 pt-4 pb-3">
        <h2 className="text-2xl font-bold">Configuración</h2>
      </div>

      <div className="px-5 space-y-4 pb-8">
        <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800/50">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Línea Activa</p>
          <select 
            value={activeLine} 
            onChange={(e) => onLineChange(e.target.value)}
            className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 text-sm outline-none border border-zinc-700 focus:border-blue-500/50 appearance-none"
          >
            <option value={TWILIO_NUMBER}>{formatPhone(TWILIO_NUMBER)} (Principal)</option>
            {numbers.filter(n => n.phone !== TWILIO_NUMBER).map(n => (
              <option key={n.phone} value={n.phone}>{formatPhone(n.phone)} ({n.friendlyName})</option>
            ))}
          </select>

          <div className="mt-4 pt-4 border-t border-zinc-800/50">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="w-full bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {syncing && <Loader2 className="w-4 h-4 animate-spin" />}
              {syncing ? "Sincronizando..." : "Sincronizar Líneas de Twilio"}
            </button>
            {syncMsg && <p className="text-[10px] text-zinc-400 text-center mt-2">{syncMsg}</p>}
          </div>
        </div>

        <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800/50">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Desvío de Llamadas</p>
          <p className="text-[11px] text-zinc-400 mb-3">Si la app está cerrada, las llamadas se desviarán a este número:</p>
          <div className="flex flex-col gap-2">
            <input 
              type="tel"
              placeholder="+52XXXXXXXXXX"
              value={fallbackNumber}
              onChange={(e) => setFallbackNumber(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 text-sm outline-none border border-zinc-700 focus:border-blue-500/50"
            />
            <button
              onClick={handleSaveFallback}
              disabled={savingFallback}
              className="w-full bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {savingFallback && <Loader2 className="w-4 h-4 animate-spin" />}
              {savingFallback ? "Guardando..." : "Guardar Número"}
            </button>
            {fallbackMsg && <p className="text-[10px] text-zinc-400 text-center">{fallbackMsg}</p>}
          </div>
        </div>

        <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800/50">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Estado del Sistema</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Twilio API</span>
              <span className="flex items-center gap-1.5 text-sm text-green-400">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Conectado
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Voice SDK</span>
              <span className="flex items-center gap-1.5 text-sm text-zinc-400">
                <span className="w-2 h-2 bg-zinc-500 rounded-full" />
                Disponible
              </span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800/50">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Información</p>
          <div className="space-y-2 text-sm text-zinc-400">
            <p>Twilio Personal Client v1.0</p>
            <p>PWA • Next.js 16</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────

export default function Home() {
  const [tab, setTab] = useState<Tab>("dialer");
  const [callState, setCallState] = useState<"idle" | "calling" | "connected" | "incoming">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deviceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeCallRef = useRef<any>(null);

  const [activeLine, setActiveLine] = useState<string>(TWILIO_NUMBER);

  useEffect(() => {
    const saved = localStorage.getItem("activeLine");
    if (saved) setActiveLine(saved);
  }, []);

  // Initialize Twilio Voice Device
  useEffect(() => {
    const initDevice = async () => {
      try {
        const res = await fetch("/api/voice/token");
        if (!res.ok) return;
        const { token } = await res.json();
        
        // Dynamic import of @twilio/voice-sdk
        const { Device } = await import("@twilio/voice-sdk");
        const device = new Device(token, {
          logLevel: 1,
        });

        device.on("incoming", (call: unknown) => {
          activeCallRef.current = call;
          setCallState("incoming");
        });

        device.on("error", (error: unknown) => {
          console.error("Twilio Device Error:", error);
        });

        await device.register();
        deviceRef.current = device;
      } catch (err) {
        console.error("Failed to init Twilio Voice:", err);
      }
    };

    initDevice();

    return () => {
      if (deviceRef.current) {
        deviceRef.current.destroy();
      }
    };
  }, []);

  const handleCall = async (number: string) => {
    if (!deviceRef.current) {
      alert("Voice SDK no está listo aún. Intenta en unos segundos.");
      return;
    }

    try {
      setCallState("calling");
      setTab("dialer");
      const call = await deviceRef.current.connect({
        params: { To: number, From: activeLine },
      });

      activeCallRef.current = call;

      call.on("accept", () => setCallState("connected"));
      call.on("disconnect", () => {
        setCallState("idle");
        activeCallRef.current = null;
      });
      call.on("cancel", () => {
        setCallState("idle");
        activeCallRef.current = null;
      });
      call.on("error", () => {
        setCallState("idle");
        activeCallRef.current = null;
      });
    } catch (err) {
      console.error("Call failed:", err);
      setCallState("idle");
    }
  };

  const handleHangup = () => {
    if (activeCallRef.current) {
      activeCallRef.current.disconnect();
    }
    setCallState("idle");
    activeCallRef.current = null;
  };

  const handleMute = () => {
    if (activeCallRef.current) {
      activeCallRef.current.mute(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const handleSpeaker = () => {
    setIsSpeaker(!isSpeaker);
  };

  const handleCallFromHistory = (number: string) => {
    setTab("dialer");
    setTimeout(() => handleCall(number), 100);
  };

  // Incoming call banner
  const incomingBanner = callState === "incoming" && (
    <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-green-900/95 to-green-950/95 backdrop-blur-lg px-5 py-6 flex flex-col items-center gap-4 animate-pulse">
      <p className="text-lg font-semibold text-white">Llamada entrante</p>
      <div className="flex gap-8">
        <button
          onClick={() => {
            if (activeCallRef.current) {
              activeCallRef.current.reject();
            }
            setCallState("idle");
            activeCallRef.current = null;
          }}
          className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/30"
        >
          <PhoneOff className="w-7 h-7" />
        </button>
        <button
          onClick={() => {
            if (activeCallRef.current) {
              activeCallRef.current.accept();
            }
            setCallState("connected");
            setTab("dialer");
          }}
          className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-500/30"
        >
          <Phone className="w-7 h-7 fill-current" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-black text-white w-full max-w-md mx-auto relative overflow-hidden">
      {incomingBanner}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col pb-[72px] overflow-hidden">
        {tab === "dialer" && (
          <Dialer
            onCall={handleCall}
            callState={callState}
            onHangup={handleHangup}
            onMute={handleMute}
            onSpeaker={handleSpeaker}
            isMuted={isMuted}
            isSpeaker={isSpeaker}
          />
        )}
        {tab === "messages" && <Messages activeLine={activeLine} />}
        {tab === "history" && <CallHistory onCallNumber={handleCallFromHistory} activeLine={activeLine} />}
        {tab === "settings" && (
          <SettingsView
            activeLine={activeLine}
            onLineChange={(l) => {
              setActiveLine(l);
              localStorage.setItem("activeLine", l);
            }}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 w-full bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800/50 px-4 py-2 flex justify-around items-center pb-safe">
        {[
          { id: "history" as Tab, icon: Clock, label: "Recientes" },
          { id: "dialer" as Tab, icon: Phone, label: "Teclado" },
          { id: "messages" as Tab, icon: MessageSquare, label: "Mensajes" },
          { id: "settings" as Tab, icon: Settings, label: "Ajustes" },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
              tab === id ? "text-blue-500" : "text-zinc-500 active:text-zinc-300"
            }`}
          >
            <Icon className={`w-6 h-6 ${tab === id && (id === "dialer" || id === "messages") ? "fill-current" : ""}`} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
