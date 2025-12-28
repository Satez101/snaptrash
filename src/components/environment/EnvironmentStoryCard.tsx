import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface EnvironmentStoryCardProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  icon: ReactNode;
  gradient: string;
  currentIndex: number;
  totalCards: number;
  onNext: () => void;
  onPrev: () => void;
  isActive: boolean;
}

const EnvironmentStoryCard = ({
  children,
  title,
  subtitle,
  icon,
  gradient,
  currentIndex,
  totalCards,
  onNext,
  onPrev,
  isActive,
}: EnvironmentStoryCardProps) => {
  if (!isActive) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, x: 100, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -100, scale: 0.9 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="relative w-full h-full"
      >
        {/* Story progress bar */}
        <div className="absolute top-4 left-4 right-4 flex gap-1 z-20">
          {Array.from({ length: totalCards }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden"
            >
              <motion.div
                className="h-full bg-white"
                initial={{ width: i < currentIndex ? "100%" : "0%" }}
                animate={{ width: i <= currentIndex ? "100%" : "0%" }}
                transition={{ duration: i === currentIndex ? 5 : 0.3 }}
              />
            </div>
          ))}
        </div>

        {/* Main card content */}
        <div
          className={`relative w-full h-full rounded-3xl overflow-hidden ${gradient}`}
          style={{ minHeight: "70vh" }}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]" />
          </div>

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col p-6 pt-12">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                {icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white font-display">{title}</h2>
                {subtitle && (
                  <p className="text-white/70 text-sm">{subtitle}</p>
                )}
              </div>
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {children}
            </div>

            {/* Navigation hints */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
              <button
                onClick={onPrev}
                disabled={currentIndex === 0}
                className="flex items-center gap-1 text-white/70 hover:text-white transition-colors disabled:opacity-30"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">Previous</span>
              </button>
              <span className="text-white/50 text-sm">
                Tap to navigate
              </span>
              <button
                onClick={onNext}
                disabled={currentIndex === totalCards - 1}
                className="flex items-center gap-1 text-white/70 hover:text-white transition-colors disabled:opacity-30"
              >
                <span className="text-sm">Next</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Touch areas for navigation */}
          <div
            className="absolute inset-y-0 left-0 w-1/3 cursor-pointer z-10"
            onClick={onPrev}
          />
          <div
            className="absolute inset-y-0 right-0 w-1/3 cursor-pointer z-10"
            onClick={onNext}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EnvironmentStoryCard;