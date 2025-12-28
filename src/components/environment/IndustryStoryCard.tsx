import { Factory, MapPin, AlertTriangle, Trash2 } from "lucide-react";

interface Industry {
  name: string;
  type: string;
  distance: string;
  wasteTypes: string[];
  environmentalImpact: string;
  riskLevel: string;
}

interface IndustryStoryCardProps {
  industries: Industry[];
}

const getRiskColor = (level: string) => {
  switch (level.toLowerCase()) {
    case "low": return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    case "moderate": return "bg-amber-500/20 text-amber-300 border-amber-500/30";
    case "high": return "bg-red-500/20 text-red-300 border-red-500/30";
    default: return "bg-white/20 text-white/80";
  }
};

const getRiskIcon = (level: string) => {
  switch (level.toLowerCase()) {
    case "low": return "🟢";
    case "moderate": return "🟡";
    case "high": return "🔴";
    default: return "⚪";
  }
};

const IndustryStoryCard = ({ industries }: IndustryStoryCardProps) => {
  return (
    <div className="space-y-4 text-white">
      {/* Header info */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500/30 flex items-center justify-center">
            <Factory className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">Nearby Industries</h3>
            <p className="text-sm text-white/70">
              {industries.length} industrial zone{industries.length !== 1 ? 's' : ''} detected
            </p>
          </div>
        </div>
      </div>

      {/* Industries list */}
      <div className="space-y-4">
        {industries.map((industry, index) => (
          <div
            key={index}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10"
          >
            {/* Industry header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{getRiskIcon(industry.riskLevel)}</span>
                  <h4 className="font-bold text-lg">{industry.name}</h4>
                </div>
                <p className="text-white/70 text-sm">{industry.type}</p>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full border ${getRiskColor(industry.riskLevel)}`}>
                {industry.riskLevel} Risk
              </span>
            </div>

            {/* Distance */}
            <div className="flex items-center gap-2 mb-3 text-white/80">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{industry.distance} km away</span>
            </div>

            {/* Waste types */}
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2 text-white/90">
                <Trash2 className="w-4 h-4" />
                <span className="text-sm font-medium">Waste Produced:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {industry.wasteTypes.map((waste, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 bg-white/10 rounded-lg"
                  >
                    {waste}
                  </span>
                ))}
              </div>
            </div>

            {/* Environmental impact */}
            <div className="pt-3 border-t border-white/10">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-400 flex-shrink-0" />
                <p className="text-sm text-white/80 leading-relaxed">
                  {industry.environmentalImpact}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {industries.length === 0 && (
        <div className="text-center py-8 text-white/70">
          <Factory className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No major industrial zones detected nearby</p>
        </div>
      )}
    </div>
  );
};

export default IndustryStoryCard;