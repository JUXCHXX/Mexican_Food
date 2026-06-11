import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import donVelto from "@/assets/don-velto.png";
import { ChatPanel } from "./ChatPanel";

const POPUPS = [
  "¡Hola! ¿No sabes qué pedir? ¡Yo te ayudo! 🌮",
  "¿Buscas algo con camarones? Tenemos varias opciones 🍤",
  "¿Primera vez aquí? Te recomiendo los Nachos Jalisco 🔥",
  "¿Algo para compartir? Pregúntame 😊",
  "¿Quieres saber el precio de algo? Solo pregúntame 💬",
];

function useTypewriter(text: string, speed = 28) {
  const [out, setOut] = useState("");
  useEffect(() => {
    setOut("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return out;
}

export function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [popupIndex, setPopupIndex] = useState(0);
  const [showPopup, setShowPopup] = useState(false);

  // Cycle popups every ~8s; show 4s, hide 4s
  useEffect(() => {
    if (open) { setShowPopup(false); return; }
    let mounted = true;
    const showTimer = setTimeout(() => mounted && setShowPopup(true), 1500);
    const cycle = setInterval(() => {
      if (!mounted) return;
      setShowPopup(false);
      setTimeout(() => {
        if (!mounted) return;
        setPopupIndex((i) => (i + 1) % POPUPS.length);
        setShowPopup(true);
      }, 600);
    }, 8000);
    return () => { mounted = false; clearTimeout(showTimer); clearInterval(cycle); };
  }, [open]);

  // Auto-hide a popup after ~4s
  useEffect(() => {
    if (!showPopup) return;
    const t = setTimeout(() => setShowPopup(false), 4500);
    return () => clearTimeout(t);
  }, [showPopup, popupIndex]);

  const typed = useTypewriter(POPUPS[popupIndex]);

  return (
    <>
      <AnimatePresence>{open && <ChatPanel onClose={() => setOpen(false)} />}</AnimatePresence>

      {/* Popup tooltip */}
      <AnimatePresence>
        {showPopup && !open && (
          <motion.div
            key={popupIndex}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-24 right-4 z-40 max-w-[260px] rounded-2xl rounded-br-sm bg-gris border border-sombrero/30 px-4 py-2.5 text-sm text-arena font-body shadow-2xl"
          >
            {typed}
            <span className="ml-0.5 inline-block w-[2px] h-3 align-middle bg-sombrero animate-pulse" />
            <div className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 bg-gris border-r border-b border-sombrero/30" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="brand-pulse fixed bottom-5 right-4 z-40 h-16 w-16 rounded-full overflow-hidden ring-2 ring-sombrero/70 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.6)] hover:scale-105 transition-transform"
        aria-label="Abrir asistente"
      >
        <img src={donVelto} alt="Don Velto — Asistente" className="h-full w-full object-cover" />
      </button>
    </>
  );
}
