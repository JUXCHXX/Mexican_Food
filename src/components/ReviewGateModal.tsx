import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import fabianLogo from "@/assets/fabians-logo.png";

const hasReviewCookie = (): boolean => {
  if (typeof document === "undefined") return false;
  const cookies = document.cookie.split("; ");
  return cookies.some((c) => c.startsWith("fabians_review_shown="));
};

const setReviewCookie = (): void => {
  document.cookie = "fabians_review_shown=true; max-age=2592000; path=/";
};

const GOOGLE_REVIEW_URL = "https://g.page/r/Ceifp0vMzoMKEBM/review";

interface Review {
  author: string;
  badge: string;
  stars: number;
  text: string;
}

const reviews: Review[] = [
  {
    author: "Ray L",
    badge: "Local Guide",
    stars: 5,
    text: "Excellent! Great Service, atmosphere and quality food, clean. Gringa Texana delicious. Cannot go wrong.",
  },
  {
    author: "M M 'MM'",
    badge: "Local Guide",
    stars: 5,
    text: "Great hot food, went twice since I found the place. Lots of food for price, chips were good and white sauce was great.",
  },
  {
    author: "Jay Johnston",
    badge: "Local Guide",
    stars: 5,
    text: "My choice for Mexican in Brentwood! So good! Mazatlan lives on at Fabians!",
  },
];

const getInitialColor = (name: string): string => {
  const colors = ["bg-sombrero", "bg-jalapeno", "bg-tradicional"];
  const charCode = name.toLowerCase().charCodeAt(0);
  return colors[charCode % colors.length];
};

export function ReviewGateModal() {
  const [show, setShow] = useState(false);
  const [userReviewed, setUserReviewed] = useState(false);

  useEffect(() => {
    // Check if cookie exists on mount
    if (hasReviewCookie()) return;

    // Show modal after 1 minute
    const timer = setTimeout(() => {
      setShow(true);
    }, 60000);

    return () => clearTimeout(timer);
  }, []);

  const handleGoogleClick = () => {
    window.open(GOOGLE_REVIEW_URL, "_blank");
    setUserReviewed(true);
  };

  const handleConfirm = () => {
    setReviewCookie();
    setShow(false);
  };

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-lg w-full bg-carbon border border-arena/20 rounded-3xl p-8"
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src={fabianLogo}
            alt="Fabian's Mexican Restaurant"
            className="h-24 object-contain"
          />
        </div>

        {/* Título */}
        <h2 className="text-3xl font-display text-arena text-center mb-6">
          ¿Te gustó Fabian's?
        </h2>

        {/* Puntuación */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl font-bold text-arena">4.1</span>
            <span className="text-2xl text-sombrero">★★★★☆</span>
          </div>
          <p className="text-sm text-arena/50">667 opiniones en Google</p>
        </div>

        {/* Reseñas */}
        <div className="space-y-3 mb-8">
          {reviews.map((review) => (
            <div
              key={review.author}
              className="bg-gris/30 rounded-2xl border border-arena/10 p-4"
            >
              <div className="flex gap-3">
                {/* Avatar con inicial */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm ${getInitialColor(review.author)}`}
                >
                  {review.author[0].toUpperCase()}
                </div>

                {/* Contenido de la reseña */}
                <div className="flex-1 min-w-0">
                  {/* Nombre y badge */}
                  <div className="flex items-baseline gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-arena text-sm">
                      {review.author}
                    </span>
                    <span className="text-xs text-arena/40">{review.badge}</span>
                  </div>

                  {/* Estrellas */}
                  <div className="text-sm text-sombrero mb-1">
                    {"⭐".repeat(review.stars)}
                  </div>

                  {/* Texto de reseña */}
                  <p className="text-sm text-arena/70 italic">{review.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Botón primario - Calificar en Google */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleGoogleClick}
          className="w-full bg-sombrero text-carbon font-bold rounded-2xl py-4 text-lg mb-3 transition-all duration-300 hover:shadow-lg hover:shadow-sombrero/50"
        >
          ⭐ Calificar en Google
        </motion.button>

        {/* Botón secundario - Aparece solo después de hacer clic en Google */}
        {userReviewed && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleConfirm}
            className="w-full border border-arena/30 text-arena/60 hover:text-arena hover:border-arena/50 rounded-2xl py-3 text-lg font-semibold transition-all duration-300"
          >
            Ya califiqué, ver el menú →
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}
