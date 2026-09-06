import { useNavigate } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const DRAG_THRESHOLD = 8;

export function MyOrdersBubble() {
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dragStart = useRef<{ pointerX: number; pointerY: number; left: number; top: number }>();
  const didDrag = useRef(false);
  const [position, setPosition] = useState<{ left: number; top: number }>();
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => setShowHint(false), 7_000);
    return () => window.clearTimeout(timeout);
  }, []);

  const move = (event: React.PointerEvent<HTMLButtonElement>) => {
    const start = dragStart.current;
    const button = buttonRef.current;
    if (!start || !button) return;
    const deltaX = event.clientX - start.pointerX;
    const deltaY = event.clientY - start.pointerY;
    if (Math.hypot(deltaX, deltaY) > DRAG_THRESHOLD) didDrag.current = true;
    const maxLeft = Math.max(0, window.innerWidth - button.offsetWidth);
    const maxTop = Math.max(0, window.innerHeight - button.offsetHeight);
    setPosition({
      left: Math.min(maxLeft, Math.max(0, start.left + deltaX)),
      top: Math.min(maxTop, Math.max(0, start.top + deltaY)),
    });
  };

  return (
    <div
      className="fixed z-40"
      style={
        position
          ? { left: position.left, top: position.top }
          : { right: "5.5rem", bottom: "1.25rem" }
      }
    >
      {showHint && (
        <div className="absolute bottom-20 right-0 w-56 rounded-2xl rounded-br-sm border border-jalapeno/40 bg-gris px-4 py-2.5 text-sm text-arena shadow-2xl">
          ¿Ya hiciste un pedido? Revisa el estado aquí.
          <div className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 border-b border-r border-jalapeno/40 bg-gris" />
        </div>
      )}
      <button
        ref={buttonRef}
        type="button"
        aria-label="Ver mis pedidos"
        onPointerDown={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          dragStart.current = {
            pointerX: event.clientX,
            pointerY: event.clientY,
            left: rect.left,
            top: rect.top,
          };
          didDrag.current = false;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={move}
        onPointerUp={(event) => {
          dragStart.current = undefined;
          event.currentTarget.releasePointerCapture(event.pointerId);
          if (!didDrag.current) navigate({ to: "/mis-pedidos" });
        }}
        className="flex h-16 w-16 touch-none items-center justify-center rounded-full border-2 border-jalapeno/70 bg-jalapeno text-arena shadow-[0_10px_30px_-5px_rgba(0,0,0,0.6)] transition-transform hover:scale-105"
      >
        <ClipboardList className="h-7 w-7" />
        <span className="sr-only">Mis pedidos</span>
      </button>
    </div>
  );
}
