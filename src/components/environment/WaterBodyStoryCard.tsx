import { Droplets, MapPin, AlertTriangle, Fish, Waves } from "lucide-react";

interface WaterBody {
  name: string;
  type: string;
  distance: string;
  pollutionLevel: string;
  pollutionSources: string[];
  impact: string;
}

interface WaterBodyStoryCardProps {
  waterBodies: WaterBody[];
}

const getPollutionColor = (level: string) => {
  switch (level.toLowerCase()) {
    case "low": return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    case "moderate": return "bg-amber-500/20 text-amber-300 border-amber-500/30";
    case "high": return "bg-orange-500/20 text-orange-300 border-orange-500/30";
    case "severe": return "bg-red-500/20 text-red-300 border-red-500/30";
    default: return "bg-white/20 text-white/80";
  }
};

const getWaterIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "river": return "🏞️";
    case "lake": return "🏖️";
    case "pond": return "🪷";
    case "ocean": return "🌊";
    case "sea": return "🌊";
    default: return "💧";
  }
};

const getPollutionEmoji = (level: string) => {
  switch (level.toLowerCase()) {
    case "low": return "✨";
    case "moderate": return "💧";
    case "high": return "⚠️";
    case "severe": return "☠️";
    default: return "💧";
  }
};

const WaterBodyStoryCard = ({ waterBodies }: WaterBodyStoryCardProps) => {
  return (
    <div className="space-y-4 text-white">
      {/* Header info */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/30 flex items-center justify-center">
            <Waves className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">Water Bodies Impact</h3>
            <p className="text-sm text-white/70">
              {waterBodies.length} water source{waterBodies.length !== 1 ? 's' : ''} analyzed
            </p>
          </div>
        </div>
      </div>

      {/* Water bodies list */}
      <div className="space-y-4">
        {waterBodies.map((water, index) => (
          <div
            key={index}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{getWaterIcon(water.type)}</span>
                  <h4 className="font-bold text-lg">{water.name}</h4>
                </div>
                <p className="text-white/70 text-sm">{water.type}</p>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full border flex items-center gap-1 ${getPollutionColor(water.pollutionLevel)}`}>
                {getPollutionEmoji(water.pollutionLevel)} {water.pollutionLevel}
              </span>
            </div>

            {/* Distance */}
            <div className="flex items-center gap-2 mb-3 text-white/80">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{water.distance} km away</span>
            </div>

            {/* Pollution sources */}
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2 text-white/90">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium">Pollution Sources:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {water.pollutionSources.map((source, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 bg-white/10 rounded-lg"
                  >
                    {source}
                  </span>
                ))}
              </div>
            </div>

            {/* Impact */}
            <div className="pt-3 border-t border-white/10">
              <div className="flex items-start gap-2">
                <Fish className="w-4 h-4 mt-0.5 text-cyan-400 flex-shrink-0" />
                <p className="text-sm text-white/80 leading-relaxed">
                  {water.impact}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {waterBodies.length === 0 && (
        <div className="text-center py-8 text-white/70">
          <Droplets className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No significant water bodies detected nearby</p>
        </div>
      )}
    </div>
  );
};

export default WaterBodyStoryCard;