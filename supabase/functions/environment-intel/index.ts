import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  latitude: number;
  longitude: number;
}

// Fetch air quality from OpenAQ (completely free, no key needed)
async function fetchAirQuality(lat: number, lon: number): Promise<{
  aqi: number | null;
  category: string;
  pm25: number | null;
  pm10: number | null;
  source: string | null;
} | null> {
  try {
    const url = `https://api.openaq.org/v2/latest?coordinates=${lat},${lon}&radius=25000&limit=1`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      console.log('OpenAQ API returned non-ok status:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      console.log('OpenAQ: No monitoring stations found nearby');
      return null;
    }

    const station = data.results[0];
    const measurements = station.measurements || [];
    
    const pm25 = measurements.find((m: any) => m.parameter === 'pm25')?.value;
    const pm10 = measurements.find((m: any) => m.parameter === 'pm10')?.value;
    
    // Calculate AQI from PM2.5 (US EPA standard)
    let aqi: number | null = null;
    let category = 'Unknown';
    
    const pmValue = pm25 ?? (pm10 ? pm10 * 0.5 : null);
    
    if (pmValue !== null) {
      if (pmValue <= 12) {
        aqi = Math.round((pmValue / 12) * 50);
        category = 'Good';
      } else if (pmValue <= 35.4) {
        aqi = Math.round(50 + ((pmValue - 12) / 23.4) * 50);
        category = 'Moderate';
      } else if (pmValue <= 55.4) {
        aqi = Math.round(100 + ((pmValue - 35.4) / 20) * 50);
        category = 'Unhealthy for Sensitive';
      } else if (pmValue <= 150.4) {
        aqi = Math.round(150 + ((pmValue - 55.4) / 95) * 50);
        category = 'Unhealthy';
      } else {
        aqi = Math.round(200 + ((pmValue - 150.4) / 100) * 100);
        category = 'Very Unhealthy';
      }
      aqi = Math.min(aqi, 500);
    }

    return {
      aqi,
      category,
      pm25: pm25 ? Math.round(pm25 * 10) / 10 : null,
      pm10: pm10 ? Math.round(pm10 * 10) / 10 : null,
      source: station.location || 'OpenAQ',
    };
  } catch (error) {
    console.error('OpenAQ fetch error:', error);
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

    // Weather code to description mapping
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

    // Determine area type from OSM data
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

// Generate AI summary using Lovable AI (only summarizes REAL data)
async function generateAISummary(
  location: { city: string; state: string; country: string },
  airQuality: { aqi: number | null; category: string } | null,
  weather: { temperature: number; humidity: number; description: string } | null,
  areaType: string
): Promise<string | null> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    return null;
  }

  try {
    // Build a factual prompt with ONLY real data
    const dataPoints: string[] = [];
    
    if (airQuality && airQuality.aqi !== null) {
      dataPoints.push(`Air Quality Index: ${airQuality.aqi} (${airQuality.category})`);
    } else {
      dataPoints.push('Air Quality: Data not available from nearby monitoring stations');
    }
    
    if (weather) {
      dataPoints.push(`Weather: ${weather.temperature}°C, ${weather.humidity}% humidity, ${weather.description}`);
    } else {
      dataPoints.push('Weather: Data not available');
    }
    
    dataPoints.push(`Area Classification: ${areaType}`);
    dataPoints.push(`Location: ${location.city}, ${location.state}, ${location.country}`);

    const prompt = `You are an environmental advisor for SnapTrash, an eco-friendly waste management app.

Based on the following REAL environmental data for ${location.city}, provide a brief, friendly summary (2-3 sentences max). Focus on practical advice for the user's day.

DATA:
${dataPoints.join('\n')}

RULES:
- Only reference data that is explicitly provided above
- If data is missing, acknowledge it briefly without guessing
- Be encouraging and practical
- Keep it under 60 words
- No markdown, just plain text`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return 'Environmental summary temporarily unavailable. Please try again later.';
      }
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error('AI summary error:', error);
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
    const [airQuality, weather, location] = await Promise.all([
      fetchAirQuality(latitude, longitude),
      fetchWeather(latitude, longitude),
      reverseGeocode(latitude, longitude),
    ]);

    // Generate AI summary with ONLY the real data we have
    const summary = await generateAISummary(
      location || { city: 'Unknown', state: '', country: '' },
      airQuality,
      weather,
      location?.areaType || 'Unknown'
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
        available: airQuality.aqi !== null,
      } : { available: false, message: 'No air quality monitoring stations found nearby' },
      weather: weather ? {
        temperature: weather.temperature,
        feelsLike: weather.feelsLike,
        humidity: weather.humidity,
        windSpeed: weather.windSpeed,
        description: weather.description,
        available: true,
      } : { available: false, message: 'Weather data unavailable' },
      summary: summary || 'Environmental summary unavailable.',
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