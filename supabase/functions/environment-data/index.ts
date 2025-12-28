import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude } = await req.json();

    // Simulated environment data based on location
    const aqi = Math.floor(Math.random() * 150) + 20;
    const temperature = Math.floor(Math.random() * 20) + 15;
    const humidity = Math.floor(Math.random() * 40) + 40;
    const solarPotential = Math.floor(Math.random() * 30) + 60;

    const data = {
      aqi,
      aqiLevel: aqi <= 50 ? "Good" : aqi <= 100 ? "Moderate" : "Unhealthy",
      temperature,
      humidity,
      solarPotential,
      solarRating: solarPotential >= 80 ? "Excellent" : solarPotential >= 60 ? "Good" : "Fair",
      location: `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`,
      industrialZones: [
        { name: "Metro Industrial Park", distance: 3.2, riskLevel: "Low" },
        { name: "Chemical Processing Zone", distance: 8.5, riskLevel: "Moderate" },
        { name: "Manufacturing District", distance: 12.1, riskLevel: "Low" },
      ],
      riskIndicators: [
        { type: "Air Pollution", level: aqi <= 50 ? "Low" : aqi <= 100 ? "Moderate" : "High", description: "Based on current AQI readings and local emission sources." },
        { type: "Water Quality", level: "Low", description: "Local water treatment facilities operating within normal parameters." },
        { type: "Noise Pollution", level: "Moderate", description: "Urban area with typical city noise levels during daytime." },
      ],
    };

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Environment data error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
