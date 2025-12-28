import { motion } from "framer-motion";
import { MapPin, Wifi, Satellite } from "lucide-react";

interface LocationLoaderProps {
  status: "requesting" | "detecting" | "refining";
  accuracy?: number;
}

const LocationLoader = ({ status, accuracy }: LocationLoaderProps) => {
  const statusMessages = {
    requesting: "Requesting location access...",
    detecting: "Detecting your location...",
    refining: accuracy ? `Refining accuracy (~${Math.round(accuracy)}m)...` : "Improving accuracy...",
  };

  const statusSubtext = {
    requesting: "Please allow location access when prompted",
    detecting: "Using GPS and network signals",
    refining: "Getting a more precise fix",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background overflow-hidden">
      <div className="text-center max-w-sm mx-auto px-4 relative">
        {/* Animated rings */}
        <div className="relative w-40 h-40 mx-auto mb-8">
          {/* Outer pulsing ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/20"
            animate={{
              scale: [1, 1.5, 1.5],
              opacity: [0.5, 0, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/30"
            animate={{
              scale: [1, 1.3, 1.3],
              opacity: [0.6, 0, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut",
              delay: 0.3,
            }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/40"
            animate={{
              scale: [1, 1.15, 1.15],
              opacity: [0.7, 0, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut",
              delay: 0.6,
            }}
          />

          {/* Rotating dashed circle */}
          <motion.div
            className="absolute inset-4 rounded-full border-2 border-dashed border-primary/50"
            animate={{ rotate: 360 }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          {/* Inner glowing circle */}
          <motion.div
            className="absolute inset-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm"
            animate={{
              boxShadow: [
                "0 0 20px hsl(var(--primary) / 0.3)",
                "0 0 40px hsl(var(--primary) / 0.5)",
                "0 0 20px hsl(var(--primary) / 0.3)",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg"
              animate={{
                y: [0, -4, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <MapPin className="w-8 h-8 text-primary-foreground" />
            </motion.div>
          </div>

          {/* Orbiting signal icons */}
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: -360 }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1">
              <motion.div
                className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <Satellite className="w-4 h-4 text-primary" />
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1">
              <motion.div
                className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center"
                animate={{ rotate: -360 }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <Wifi className="w-4 h-4 text-secondary" />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Status text */}
        <motion.div
          key={status}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {statusMessages[status]}
          </h2>
          <p className="text-muted-foreground text-sm mb-4">
            {statusSubtext[status]}
          </p>
        </motion.div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary"
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>

        {/* Permission hint */}
        <motion.p
          className="text-xs text-muted-foreground mt-6 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          💡 For best results, enable GPS and allow precise location access
        </motion.p>
      </div>
    </div>
  );
};

export default LocationLoader;
