import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  latitude: number;
  longitude: number;
}

// Fetch air quality from Open-Meteo Air Quality API (completely free, no key needed)
async function fetchAirQuality(lat: number, lon: number): Promise<{
  aqi: number | null;
  category: string;
  pm25: number | null;
  pm10: number | null;
  source: string | null;
  healthImpact: string;
} | null> {
  try {
    // Open-Meteo Air Quality API - free and reliable
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,us_aqi`;
    const response = await fetch(url);

    if (!response.ok) {
      console.log('Open-Meteo AQ API error:', response.status);
      return null;
    }

    const data = await response.json();
    const current = data.current;
    
    if (!current) {
      console.log('Open-Meteo AQ: No current data');
      return null;
    }

    const aqi = current.us_aqi !== undefined ? Math.round(current.us_aqi) : null;
    const pm25 = current.pm2_5 !== undefined ? Math.round(current.pm2_5 * 10) / 10 : null;
    const pm10 = current.pm10 !== undefined ? Math.round(current.pm10 * 10) / 10 : null;
    
    // Determine category and health impact based on US AQI
    let category = 'Unknown';
    let healthImpact = 'Data unavailable for health assessment.';
    
    if (aqi !== null) {
      if (aqi <= 50) {
        category = 'Good';
        healthImpact = 'Air quality is satisfactory. Enjoy outdoor activities!';
      } else if (aqi <= 100) {
        category = 'Moderate';
        healthImpact = 'Air quality is acceptable. Sensitive individuals should limit prolonged outdoor exertion.';
      } else if (aqi <= 150) {
        category = 'Unhealthy for Sensitive Groups';
        healthImpact = 'People with respiratory conditions, children, and elderly should reduce outdoor activity.';
      } else if (aqi <= 200) {
        category = 'Unhealthy';
        healthImpact = 'Everyone may experience health effects. Limit outdoor exposure and wear a mask if necessary.';
      } else if (aqi <= 300) {
        category = 'Very Unhealthy';
        healthImpact = 'Health alert! Everyone should avoid outdoor activities and use air purifiers indoors.';
      } else {
        category = 'Hazardous';
        healthImpact = 'Emergency conditions! Stay indoors, seal windows, and use air purifiers.';
      }
    }

    return {
      aqi,
      category,
      pm25,
      pm10,
      source: 'Open-Meteo',
      healthImpact,
    };
  } catch (error) {
    console.error('Open-Meteo AQ fetch error:', error);
    return null;
  }
}

// Fetch weather from Open-Meteo (completely free, no key needed)
async function fetchWeather(lat: number, lon: number): Promise<{
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
} | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m`;
    const response = await fetch(url);

    if (!response.ok) {
      console.log('Open-Meteo API error:', response.status);
      return null;
    }

    const data = await response.json();
    const current = data.current;

    if (!current) {
      return null;
    }

    const weatherDescriptions: Record<number, string> = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      95: 'Thunderstorm',
    };

    return {
      temperature: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      humidity: Math.round(current.relative_humidity_2m),
      windSpeed: Math.round(current.wind_speed_10m),
      description: weatherDescriptions[current.weather_code] || 'Unknown',
    };
  } catch (error) {
    console.error('Open-Meteo fetch error:', error);
    return null;
  }
}

// Reverse geocode using Nominatim (OpenStreetMap, free)
async function reverseGeocode(lat: number, lon: number): Promise<{
  city: string;
  state: string;
  country: string;
  displayName: string;
  areaType: string;
} | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=14`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'SnapTrash/1.0 (environmental-app)' }
    });

    if (!response.ok) {
      console.log('Nominatim error:', response.status);
      return null;
    }

    const data = await response.json();
    const address = data.address || {};

    let areaType = 'Residential';
    if (address.industrial || data.type === 'industrial') {
      areaType = 'Industrial';
    } else if (address.commercial || data.type === 'commercial') {
      areaType = 'Commercial';
    } else if (address.retail) {
      areaType = 'Mixed Use';
    }

    return {
      city: address.city || address.town || address.village || address.suburb || 'Unknown',
      state: address.state || address.county || '',
      country: address.country || '',
      displayName: [
        address.city || address.town || address.village,
        address.state,
        address.country
      ].filter(Boolean).join(', ') || 'Unknown Location',
      areaType,
    };
  } catch (error) {
    console.error('Nominatim error:', error);
    return null;
  }
}

// Fetch nearby water bodies from Overpass (OpenStreetMap)
async function fetchNearbyWaterBodies(lat: number, lon: number): Promise<Array<{
  name: string;
  type: string;
}>> {
  try {
    const radius = 10000; // 10km radius
    const query = `
      [out:json][timeout:10];
      (
        way["natural"="water"](around:${radius},${lat},${lon});
        relation["natural"="water"](around:${radius},${lat},${lon});
        way["waterway"="river"](around:${radius},${lat},${lon});
        way["waterway"="stream"](around:${radius},${lat},${lon});
      );
      out tags 10;
    `;
    
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (!response.ok) {
      console.log('Overpass API error:', response.status);
      return [];
    }

    const data = await response.json();
    const waterBodies: Array<{ name: string; type: string }> = [];
    
    for (const element of (data.elements || []).slice(0, 5)) {
      const tags = element.tags || {};
      if (tags.name) {
        let type = 'Water Body';
        if (tags.waterway === 'river') type = 'River';
        else if (tags.waterway === 'stream') type = 'Stream';
        else if (tags.water === 'lake' || tags.natural === 'water') type = 'Lake';
        else if (tags.water === 'pond') type = 'Pond';
        
        waterBodies.push({ name: tags.name, type });
      }
    }
    
    return waterBodies;
  } catch (error) {
    console.error('Overpass API error:', error);
    return [];
  }
}

// Fetch nearby industrial facilities from Overpass (OpenStreetMap)
async function fetchNearbyIndustrial(lat: number, lon: number): Promise<Array<{
  name: string;
  type: string;
}>> {
  try {
    const radius = 10000; // 10km radius
    const query = `
      [out:json][timeout:10];
      (
        way["landuse"="industrial"](around:${radius},${lat},${lon});
        node["man_made"="works"](around:${radius},${lat},${lon});
        way["building"="industrial"](around:${radius},${lat},${lon});
      );
      out tags 10;
    `;
    
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (!response.ok) {
      console.log('Overpass API error:', response.status);
      return [];
    }

    const data = await response.json();
    const industrialSites: Array<{ name: string; type: string }> = [];
    
    for (const element of (data.elements || []).slice(0, 5)) {
      const tags = element.tags || {};
      const name = tags.name || tags.operator || 'Industrial Zone';
      let type = 'Industrial Area';
      
      if (tags['industrial']) {
        type = tags['industrial'].replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
      } else if (tags['man_made'] === 'works') {
        type = 'Manufacturing Facility';
      }
      
      industrialSites.push({ name, type });
    }
    
    return industrialSites;
  } catch (error) {
    console.error('Overpass API error:', error);
    return [];
  }
}

// Generate comprehensive AI analysis for all flashcards
async function generateAIAnalysis(
  location: { city: string; state: string; country: string; areaType: string },
  airQuality: { aqi: number | null; category: string } | null,
  weather: { temperature: number; humidity: number; description: string } | null,
  waterBodies: Array<{ name: string; type: string }>,
  industrialSites: Array<{ name: string; type: string }>
): Promise<{
  summary: string;
  industrialAnalysis: {
    pollutionTypes: string[];
    impactLevel: string;
    description: string;
  };
  waterAnalysis: {
    pollutionLevel: string;
    pollutionReasons: string[];
    description: string;
  };
  solutions: {
    citizenActions: string[];
    initiatives: string[];
    snaptrashActions: string[];
  };
} | null> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    return null;
  }

  try {
    const prompt = `You are an environmental analyst for SnapTrash, an eco-awareness app in India.

LOCATION: ${location.city}, ${location.state}, ${location.country}
AREA TYPE: ${location.areaType}
AIR QUALITY: ${airQuality?.aqi !== null ? `AQI ${airQuality?.aqi} (${airQuality?.category})` : 'Data unavailable'}
WEATHER: ${weather ? `${weather.temperature}°C, ${weather.humidity}% humidity, ${weather.description}` : 'Data unavailable'}
NEARBY WATER BODIES: ${waterBodies.length > 0 ? waterBodies.map(w => `${w.name} (${w.type})`).join(', ') : 'None detected in 10km radius'}
NEARBY INDUSTRIAL ZONES: ${industrialSites.length > 0 ? industrialSites.map(i => `${i.name} (${i.type})`).join(', ') : 'None detected in 10km radius'}

Based on this REAL data, provide a JSON response with the following structure:
{
  "summary": "A 2-sentence friendly environmental summary for the user",
  "industrialAnalysis": {
    "pollutionTypes": ["array of pollution types like air, water, noise, chemical - MAX 3 items"],
    "impactLevel": "Low/Medium/High based on number and type of industries",
    "description": "1-2 sentences about industrial impact in this area"
  },
  "waterAnalysis": {
    "pollutionLevel": "Low/Medium/High - estimate based on area type and nearby industries",
    "pollutionReasons": ["array of likely pollution sources - MAX 3 items"],
    "description": "1-2 sentences about water body conditions"
  },
  "solutions": {
    "citizenActions": ["3 practical things citizens can do - SHORT phrases"],
    "initiatives": ["2-3 local/government initiatives common in this region"],
    "snaptrashActions": ["3 specific SnapTrash features to use - be specific"]
  }
}

RULES:
- Only reference data explicitly provided
- If industrial/water data is empty, say "No major industrial zones/water bodies detected nearby"
- Keep all text SHORT and youth-friendly
- Be encouraging and actionable
- Return ONLY valid JSON, no markdown`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.log('AI rate limited');
        return null;
      }
      console.log('AI API error:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    
    if (!content) return null;

    // Parse JSON from response (handle potential markdown wrapping)
    let jsonStr = content;
    if (content.includes('```json')) {
      jsonStr = content.split('```json')[1].split('```')[0].trim();
    } else if (content.includes('```')) {
      jsonStr = content.split('```')[1].split('```')[0].trim();
    }
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('AI analysis error:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude }: RequestBody = await req.json();

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ success: false, error: 'Latitude and longitude are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Environment Intel: Fetching data for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);

    // Fetch all data in parallel
    const [airQuality, weather, location, waterBodies, industrialSites] = await Promise.all([
      fetchAirQuality(latitude, longitude),
      fetchWeather(latitude, longitude),
      reverseGeocode(latitude, longitude),
      fetchNearbyWaterBodies(latitude, longitude),
      fetchNearbyIndustrial(latitude, longitude),
    ]);

    // Generate comprehensive AI analysis
    const aiAnalysis = await generateAIAnalysis(
      location || { city: 'Unknown', state: '', country: '', areaType: 'Unknown' },
      airQuality,
      weather,
      waterBodies,
      industrialSites
    );

    const response = {
      success: true,
      location: location ? {
        city: location.city,
        state: location.state,
        country: location.country,
        displayName: location.displayName,
        areaType: location.areaType,
      } : null,
      airQuality: airQuality ? {
        aqi: airQuality.aqi,
        category: airQuality.category,
        pm25: airQuality.pm25,
        pm10: airQuality.pm10,
        source: airQuality.source,
        healthImpact: airQuality.healthImpact,
        available: airQuality.aqi !== null,
      } : { 
        available: false, 
        message: 'No air quality monitoring stations found nearby',
        healthImpact: 'Unable to assess air quality. Consider checking local weather services.',
      },
      weather: weather ? {
        temperature: weather.temperature,
        feelsLike: weather.feelsLike,
        humidity: weather.humidity,
        windSpeed: weather.windSpeed,
        description: weather.description,
        available: true,
      } : { available: false, message: 'Weather data unavailable' },
      waterBodies: {
        list: waterBodies,
        pollutionLevel: aiAnalysis?.waterAnalysis?.pollutionLevel || 'Unknown',
        pollutionReasons: aiAnalysis?.waterAnalysis?.pollutionReasons || [],
        description: aiAnalysis?.waterAnalysis?.description || 'Water body analysis unavailable.',
        available: waterBodies.length > 0,
      },
      industrial: {
        list: industrialSites,
        pollutionTypes: aiAnalysis?.industrialAnalysis?.pollutionTypes || [],
        impactLevel: aiAnalysis?.industrialAnalysis?.impactLevel || 'Unknown',
        description: aiAnalysis?.industrialAnalysis?.description || 'Industrial analysis unavailable.',
        available: industrialSites.length > 0,
      },
      solutions: aiAnalysis?.solutions || {
        citizenActions: ['Reduce single-use plastics', 'Use public transport', 'Plant trees'],
        initiatives: ['Swachh Bharat Mission', 'Local waste segregation programs'],
        snaptrashActions: ['Scan waste for proper disposal', 'Report illegal dumping', 'Earn EcoCreds by recycling'],
      },
      summary: aiAnalysis?.summary || 'Environmental analysis unavailable. Please try again later.',
      fetchedAt: new Date().toISOString(),
    };

    console.log('Environment Intel: Response generated successfully');

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Environment Intel error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
