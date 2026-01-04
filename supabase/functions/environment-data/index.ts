import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fetch real AQI data from Open-Meteo Air Quality API
async function fetchAirQuality(lat: number, lon: number) {
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.current) {
      return {
        aqi: data.current.european_aqi || 50,
        pm25: data.current.pm2_5 || 0,
        pm10: data.current.pm10 || 0,
        co: data.current.carbon_monoxide || 0,
        no2: data.current.nitrogen_dioxide || 0,
        so2: data.current.sulphur_dioxide || 0,
        o3: data.current.ozone || 0,
      };
    }
    return null;
  } catch (error) {
    console.error('AQI fetch error:', error);
    return null;
  }
}

// Fetch weather data from Open-Meteo
async function fetchWeather(lat: number, lon: number) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,uv_index,weather_code&daily=uv_index_max&timezone=auto`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.current) {
      return {
        temperature: Math.round(data.current.temperature_2m),
        humidity: Math.round(data.current.relative_humidity_2m),
        uvIndex: data.current.uv_index || 0,
        weatherCode: data.current.weather_code || 0,
      };
    }
    return null;
  } catch (error) {
    console.error('Weather fetch error:', error);
    return null;
  }
}

// Reverse geocode to get location name
async function reverseGeocode(lat: number, lon: number) {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${lat.toFixed(2)},${lon.toFixed(2)}&count=1`;
    // Use Nominatim for reverse geocoding
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const response = await fetch(nominatimUrl, {
      headers: { 'User-Agent': 'SnapTrash-App/1.0' }
    });
    const data = await response.json();
    
    if (data.address) {
      const city = data.address.city || data.address.town || data.address.village || data.address.county || '';
      const state = data.address.state || '';
      const country = data.address.country || '';
      return { city, state, country, displayName: data.display_name };
    }
    return { city: '', state: '', country: '', displayName: `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E` };
  } catch (error) {
    console.error('Geocode error:', error);
    return { city: '', state: '', country: '', displayName: `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E` };
  }
}

const analysisPrompt = (lat: number, lon: number, location: any, airQuality: any, weather: any) => `You are an environmental data analyst. Based on the following location and environmental data, provide a detailed, accurate analysis. Be specific and factual.

Location: ${location.city}, ${location.state}, ${location.country}
Coordinates: ${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E
Current Air Quality:
- AQI: ${airQuality?.aqi || 'Unknown'}
- PM2.5: ${airQuality?.pm25 || 0} µg/m³
- PM10: ${airQuality?.pm10 || 0} µg/m³
- NO2: ${airQuality?.no2 || 0} µg/m³
- SO2: ${airQuality?.so2 || 0} µg/m³
- CO: ${airQuality?.co || 0} µg/m³
- Ozone: ${airQuality?.o3 || 0} µg/m³

Weather:
- Temperature: ${weather?.temperature || 25}°C
- Humidity: ${weather?.humidity || 50}%
- UV Index: ${weather?.uvIndex || 5}

Provide a JSON response with this exact structure (no markdown, just JSON):
{
  "aqiAnalysis": {
    "level": "Good|Moderate|Unhealthy for Sensitive|Unhealthy|Very Unhealthy|Hazardous",
    "description": "2-3 sentences about current air quality conditions",
    "healthAdvice": "Specific health recommendations",
    "mainPollutants": ["list of main pollutants affecting the area"]
  },
  "industries": [
    {
      "name": "Specific industry name based on region",
      "type": "Industry type",
      "distance": "estimated km",
      "wasteTypes": ["types of waste produced"],
      "environmentalImpact": "Specific impact description",
      "riskLevel": "Low|Moderate|High"
    }
  ],
  "waterBodies": [
    {
      "name": "Name of nearby water body",
      "type": "River|Lake|Pond|Ocean",
      "distance": "estimated km",
      "pollutionLevel": "Low|Moderate|High|Severe",
      "pollutionSources": ["sources of pollution"],
      "impact": "Description of environmental impact"
    }
  ],
  "solutions": [
    {
      "title": "Solution title",
      "description": "Detailed actionable solution",
      "impact": "Expected positive impact",
      "difficulty": "Easy|Medium|Hard"
    }
  ]
}`;

// Call AI with user's Gemini API key (direct Google API)
async function callGeminiAPI(apiKey: string, prompt: string) {
  // Use gemini-1.5-flash which has better quota limits
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      }
    }),
  });

  return response;
}

// Call Lovable AI Gateway
async function callLovableAPI(apiKey: string, prompt: string) {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are an environmental data analyst. Always respond with valid JSON only, no markdown formatting.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
    }),
  });

  return response;
}

// Generate AI-powered environmental analysis
async function generateEnvironmentalAnalysis(
  lat: number, 
  lon: number, 
  location: any, 
  airQuality: any, 
  weather: any,
  userGeminiApiKey?: string
) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const prompt = analysisPrompt(lat, lon, location, airQuality, weather);
  
  let response;
  let useUserKey = false;

  // Try Lovable AI first
  if (LOVABLE_API_KEY) {
    response = await callLovableAPI(LOVABLE_API_KEY, prompt);
    
    // If Lovable AI fails with 402 (quota) or 429 (rate limit), try user's key
    if ((response.status === 402 || response.status === 429) && userGeminiApiKey) {
      console.log('Lovable AI quota exceeded, falling back to user Gemini API key...');
      useUserKey = true;
    }
  }

  // Use user's Gemini API key as fallback
  if (useUserKey || !LOVABLE_API_KEY) {
    if (!userGeminiApiKey) {
      console.log('No API key available, using fallback analysis');
      return generateFallbackAnalysis(location, airQuality, weather);
    }
    
    console.log('Using user Gemini API key for environment analysis...');
    response = await callGeminiAPI(userGeminiApiKey, prompt);
  }

  if (!response || !response.ok) {
    console.error('AI API error:', response?.status);
    return generateFallbackAnalysis(location, airQuality, weather);
  }

  try {
    const data = await response.json();
    
    // Handle different response formats
    let content;
    if (data.choices?.[0]?.message?.content) {
      content = data.choices[0].message.content;
    } else if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      content = data.candidates[0].content.parts[0].text;
    }
    
    if (!content) {
      return generateFallbackAnalysis(location, airQuality, weather);
    }
    
    // Parse JSON from response, handling potential markdown wrapping
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.slice(7);
    }
    if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.slice(3);
    }
    if (jsonContent.endsWith('```')) {
      jsonContent = jsonContent.slice(0, -3);
    }
    
    return JSON.parse(jsonContent.trim());
  } catch (error) {
    console.error('AI analysis error:', error);
    return generateFallbackAnalysis(location, airQuality, weather);
  }
}

function generateFallbackAnalysis(location: any, airQuality: any, weather: any) {
  const aqi = airQuality?.aqi || 50;
  let level = "Good";
  if (aqi > 150) level = "Unhealthy";
  else if (aqi > 100) level = "Unhealthy for Sensitive";
  else if (aqi > 50) level = "Moderate";

  return {
    aqiAnalysis: {
      level,
      description: `Current air quality in ${location.city || 'your area'} shows an AQI of ${aqi}. Main contributors include vehicular emissions and industrial activities.`,
      healthAdvice: aqi <= 50 
        ? "Air quality is good. Enjoy outdoor activities!"
        : aqi <= 100
        ? "Sensitive individuals should consider limiting prolonged outdoor exertion."
        : "Consider reducing outdoor activities and wearing masks outdoors.",
      mainPollutants: ["PM2.5", "PM10", "NO2"]
    },
    industries: [
      {
        name: "Local Manufacturing Zone",
        type: "Mixed Industrial",
        distance: "5-10",
        wasteTypes: ["Industrial effluents", "Air emissions", "Solid waste"],
        environmentalImpact: "Contributes to local air pollution and potential groundwater contamination",
        riskLevel: "Moderate"
      }
    ],
    waterBodies: [
      {
        name: "Local Water Sources",
        type: "River/Lake",
        distance: "10-15",
        pollutionLevel: "Moderate",
        pollutionSources: ["Urban runoff", "Industrial discharge", "Agricultural waste"],
        impact: "Affects aquatic ecosystems and drinking water quality"
      }
    ],
    solutions: [
      {
        title: "Use Public Transport",
        description: "Reduce vehicular emissions by using public transportation or carpooling",
        impact: "Can reduce personal carbon footprint by up to 30%",
        difficulty: "Easy"
      },
      {
        title: "Plant Trees",
        description: "Participate in local tree plantation drives to improve air quality",
        impact: "Trees absorb pollutants and produce oxygen",
        difficulty: "Medium"
      },
      {
        title: "Reduce Water Waste",
        description: "Conserve water and avoid disposing chemicals in drains",
        impact: "Protects water bodies from pollution",
        difficulty: "Easy"
      }
    ]
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, userGeminiApiKey } = await req.json();
    
    console.log(`Fetching environment data for: ${latitude}, ${longitude}`);

    // Fetch all data in parallel
    const [airQuality, weather, location] = await Promise.all([
      fetchAirQuality(latitude, longitude),
      fetchWeather(latitude, longitude),
      reverseGeocode(latitude, longitude),
    ]);

    console.log('Air Quality:', airQuality);
    console.log('Weather:', weather);
    console.log('Location:', location);

    // Generate AI-powered analysis
    const analysis = await generateEnvironmentalAnalysis(
      latitude, 
      longitude, 
      location, 
      airQuality, 
      weather,
      userGeminiApiKey
    );

    const data = {
      location: {
        city: location.city,
        state: location.state,
        country: location.country,
        displayName: location.displayName,
        coordinates: { lat: latitude, lng: longitude }
      },
      airQuality: {
        aqi: airQuality?.aqi || 50,
        pm25: airQuality?.pm25 || 0,
        pm10: airQuality?.pm10 || 0,
        no2: airQuality?.no2 || 0,
        so2: airQuality?.so2 || 0,
        co: airQuality?.co || 0,
        o3: airQuality?.o3 || 0,
        ...analysis.aqiAnalysis
      },
      weather: {
        temperature: weather?.temperature || 25,
        humidity: weather?.humidity || 50,
        uvIndex: weather?.uvIndex || 5,
      },
      industries: analysis.industries,
      waterBodies: analysis.waterBodies,
      solutions: analysis.solutions,
      lastUpdated: new Date().toISOString()
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
