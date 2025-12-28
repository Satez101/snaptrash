import { Wind, AlertCircle, Heart, Gauge } from "lucide-react";

interface AQIData {
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
  level: string;
  description: string;
  healthAdvice: string;
  mainPollutants: string[];
}

interface AQIStoryCardProps {
  data: AQIData;
}

const getAqiColor = (aqi: number) => {
  if (aqi <= 50) return "from-emerald-500 to-green-600";
  if (aqi <= 100) return "from-yellow-500 to-amber-600";
  if (aqi <= 150) return "from-orange-500 to-orange-600";
  if (aqi <= 200) return "from-red-500 to-red-600";
  if (aqi <= 300) return "from-purple-500 to-purple-700";
  return "from-rose-800 to-rose-900";
};

const getAqiEmoji = (aqi: number) => {
  if (aqi <= 50) return "😊";
  if (aqi <= 100) return "🙂";
  if (aqi <= 150) return "😐";
  if (aqi <= 200) return "😷";
  if (aqi <= 300) return "🤢";
  return "💀";
};

const AQIStoryCard = ({ data }: AQIStoryCardProps) => {
  const pollutants = [
    { name: "PM2.5", value: data.pm25, unit: "µg/m³", limit: 25, icon: "🔬" },
    { name: "PM10", value: data.pm10, unit: "µg/m³", limit: 50, icon: "💨" },
    { name: "NO₂", value: data.no2, unit: "µg/m³", limit: 40, icon: "🏭" },
    { name: "SO₂", value: data.so2, unit: "µg/m³", limit: 20, icon: "⚗️" },
    { name: "O₃", value: data.o3, unit: "µg/m³", limit: 100, icon: "☀️" },
  ];

  return (
    <div className="space-y-6 text-white">
      {/* Big AQI Display */}
      <div className="text-center py-4">
        <div className="text-8xl mb-2">{getAqiEmoji(data.aqi)}</div>
        <div className={`inline-flex items-center justify-center w-36 h-36 rounded-full bg-gradient-to-br ${getAqiColor(data.aqi)} shadow-2xl mb-4`}>
          <div className="text-center">
            <div className="text-5xl font-bold font-display">{data.aqi}</div>
            <div className="text-sm opacity-80">AQI</div>
          </div>
        </div>
        <h3 className="text-2xl font-bold">{data.level}</h3>
      </div>

      {/* Description */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <Wind className="w-5 h-5 mt-1 flex-shrink-0" />
          <p className="text-white/90 leading-relaxed">{data.description}</p>
        </div>
      </div>

      {/* Health Advice */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <Heart className="w-5 h-5 mt-1 flex-shrink-0 text-red-300" />
          <div>
            <h4 className="font-semibold mb-1">Health Advice</h4>
            <p className="text-white/80 text-sm">{data.healthAdvice}</p>
          </div>
        </div>
      </div>

      {/* Pollutants Grid */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Gauge className="w-4 h-4" />
          Pollutant Levels
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {pollutants.map((p) => (
            <div
              key={p.name}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-3"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg">{p.icon}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  p.value > p.limit ? 'bg-red-500/50' : 'bg-green-500/50'
                }`}>
                  {p.value > p.limit ? 'High' : 'Safe'}
                </span>
              </div>
              <div className="text-lg font-bold">{p.value.toFixed(1)}</div>
              <div className="text-xs text-white/60">{p.name} ({p.unit})</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Pollutants */}
      {data.mainPollutants && data.mainPollutants.length > 0 && (
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-1 flex-shrink-0 text-yellow-300" />
            <div>
              <h4 className="font-semibold mb-2">Main Pollutants</h4>
              <div className="flex flex-wrap gap-2">
                {data.mainPollutants.map((pollutant, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-white/20 rounded-full text-sm"
                  >
                    {pollutant}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AQIStoryCard;