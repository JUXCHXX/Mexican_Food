import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const hasCookieCookie = (): boolean => {
  if (typeof document === "undefined") return false;
  const cookies = document.cookie.split("; ");
  return cookies.some((c) => c.startsWith("fabians_cookies_accepted="));
};

const setCookieCookie = (): void => {
  document.cookie = "fabians_cookies_accepted=true; max-age=31536000; path=/";
};

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if cookie is already accepted
    if (!hasCookieCookie()) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    setCookieCookie();
    setShow(false);
  };

  const handleEssentialOnly = () => {
    setCookieCookie();
    setShow(false);
  };

  if (!show) return null;

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      exit={{ y: 100 }}
      className="fixed bottom-0 left-0 right-0 z-[90] bg-carbon/95 backdrop-blur-md border-t border-arena/15 px-4 py-4"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Texto */}
        <p className="text-sm text-arena/70 flex-1">
          Usamos cookies para mejorar tu experiencia. Al continuar navegando aceptas nuestra política de cookies.
        </p>

        {/* Botones */}
        <div className="flex gap-3 w-full md:w-auto flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAccept}
            className="bg-sombrero text-carbon font-bold rounded-full px-6 py-2 text-sm transition-all duration-300"
          >
            Aceptar
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleEssentialOnly}
            className="border border-arena/30 text-arena/60 hover:text-arena/80 font-semibold rounded-full px-6 py-2 text-sm transition-all duration-300"
          >
            Solo esenciales
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
