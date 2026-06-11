import { useState } from "react";
import { Facebook, Link2, Twitter, MessageCircle, Check } from "lucide-react";
import fabiansLogo from "@/assets/fabians-logo.png";
import veltoLogo from "@/assets/velto-logo.png";
import { TalaveraDivider } from "./TalaveraDivider";

export function Footer() {
  const [copied, setCopied] = useState(false);
  const shareText = "¡Mira el menú de Fabian's Mexican Restaurant! 🌮";
  const [shareUrl, setShareUrl] = useState("");
  if (typeof window !== "undefined" && !shareUrl) setShareUrl(window.location.href);
  const enc = (s: string) => encodeURIComponent(s);

  const links = {
    whatsapp: `https://wa.me/?text=${enc(shareText + " " + shareUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${enc(shareUrl)}`,
    twitter:  `https://twitter.com/intent/tweet?text=${enc(shareText)}&url=${enc(shareUrl)}`,
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* noop */ }
  };

  return (
    <footer className="relative border-t border-arena/10 bg-carbon px-4 py-12 talavera-pattern">
      <div className="mx-auto max-w-5xl">
        <TalaveraDivider className="mb-8" symbol="❦" />

        {/* Co-branding row */}
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
          <img src={fabiansLogo} alt="Fabian's Mexican Restaurant" className="h-20 md:h-24 object-contain" />
          <span className="text-sombrero/60 text-2xl font-display">×</span>
          <img src={veltoLogo} alt="Velto" className="h-14 md:h-16 object-contain rounded-2xl" />
        </div>

        <p className="mt-4 text-center text-xs uppercase tracking-[0.25em] text-arena/40 font-[var(--font-heading)]">
          Powered by Velto
        </p>

        <TalaveraDivider className="my-10" />

        {/* Share row */}
        <div className="flex flex-col items-center gap-4">
          <h4 className="text-arena/70 font-[var(--font-heading)] text-sm uppercase tracking-widest">Compartir el menú</h4>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href={links.whatsapp} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-full bg-jalapeno/15 border border-jalapeno/40 text-jalapeno px-4 py-2 text-sm font-semibold hover:bg-jalapeno/25 transition">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
            <a href={links.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-full bg-arena/5 border border-arena/15 text-arena px-4 py-2 text-sm font-semibold hover:bg-arena/10 transition">
              <Facebook className="h-4 w-4" /> Facebook
            </a>
            <a href={links.twitter} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-full bg-arena/5 border border-arena/15 text-arena px-4 py-2 text-sm font-semibold hover:bg-arena/10 transition">
              <Twitter className="h-4 w-4" /> X
            </a>
            <button onClick={copy} className="flex items-center gap-2 rounded-full bg-sombrero text-carbon px-4 py-2 text-sm font-semibold hover:scale-105 transition">
              {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
              {copied ? "¡Copiado!" : "Copiar link"}
            </button>
          </div>
        </div>

        <p className="mt-10 text-center text-xs text-arena/40 font-body">
          © {new Date().getFullYear()} Fabian's Mexican Restaurant · 116 Wilson Pike Circle, Brentwood, TN 37027 · (615) 376-9978
        </p>
        <p className="mt-1 text-center text-[11px] text-arena/30 font-body">
          Diseño y asistente AI por Velto
        </p>
      </div>
    </footer>
  );
}
