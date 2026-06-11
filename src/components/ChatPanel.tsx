import { motion } from "framer-motion";
import { Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import donVelto from "@/assets/don-velto.png";
import { askDonVelto } from "@/lib/groq-chat.functions";

interface Msg { role: "user" | "assistant"; content: string }

const STORAGE_KEY = "fabians-chat-messages";
const DEFAULT_MESSAGE: Msg = { role: "assistant", content: "¡Hola! Soy Don Velto 🌮 Pregúntame lo que quieras sobre el menú de Fabian's." };

export function ChatPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([DEFAULT_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setMessages(JSON.parse(stored));
      } catch {
        setMessages([DEFAULT_MESSAGE]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await askDonVelto({ data: { messages: next } });
      setMessages([...next, { role: "assistant", content: res.reply }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "En este momento no puedo responder, pero puedes explorar el menú arriba 🌮" }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40, scale: 0.97 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-24 right-4 z-50 w-[min(380px,calc(100vw-2rem))] h-[min(560px,calc(100vh-8rem))] flex flex-col overflow-hidden rounded-3xl border border-sombrero/30 bg-carbon shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-arena/10 bg-gris px-4 py-3">
        <div className="flex items-center gap-3">
          <img src={donVelto} alt="" className="h-10 w-10 rounded-full ring-2 ring-sombrero/60" />
          <div>
            <div className="font-[var(--font-heading)] font-semibold text-arena leading-tight">Asistente de Fabian's</div>
            <div className="text-[11px] text-jalapeno flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-jalapeno animate-pulse" /> En línea
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-arena/70 hover:text-sombrero p-1 rounded-full hover:bg-arena/5" aria-label="Cerrar">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={[
                "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed font-body whitespace-pre-wrap",
                m.role === "user"
                  ? "bg-sombrero text-carbon font-medium rounded-br-sm"
                  : "bg-gris text-arena rounded-bl-sm border border-arena/5",
              ].join(" ")}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gris border border-arena/5 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
              <span className="h-2 w-2 rounded-full bg-sombrero animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-2 w-2 rounded-full bg-sombrero animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-2 w-2 rounded-full bg-sombrero animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-arena/10 bg-gris/60 p-3 flex gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); send(); } }}
          placeholder="Escribe tu pregunta…"
          className="flex-1 rounded-full bg-carbon border border-arena/15 px-4 py-2.5 text-sm text-arena placeholder:text-arena/40 focus:outline-none focus:border-sombrero/60 font-body"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="h-10 w-10 shrink-0 rounded-full bg-sombrero text-carbon flex items-center justify-center disabled:opacity-40 hover:scale-105 transition"
          aria-label="Enviar"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
