import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 10000): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Request timeout');
        }
        throw error;
    }
}

// Fetch air quality data from OpenAQ (free API, no key needed)
async function fetchAirQuality(lat: number, lon: number) {
    try {
        // OpenAQ API endpoint for latest measurements
        const url = `https://api.openaq.org/v2/latest?coordinates=${lat},${lon}&radius=10000&limit=1`;
        const response = await fetchWithTimeout(url, { method: 'GET' }, 8000);

        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        if (data.results && data.results.length > 0) {
            const location = data.results[0];
            const pm25 = location.measurements?.find((m: any) => m.parameter === 'pm25');
            const pm10 = location.measurements?.find((m: any) => m.parameter === 'pm10');

            if (pm25 || pm10) {
                // Calculate AQI from PM2.5 (US EPA standard)
                const pm25Value = pm25?.value || pm10?.value * 0.5; // Approximate if only PM10 available
                let aqi = 0;
                let category = 'Good';
                let healthTip = 'Air quality is good. Enjoy outdoor activities!';

                if (pm25Value <= 12) {
                    aqi = Math.round((pm25Value / 12) * 50);
                    category = 'Good';
                    healthTip = 'Air quality is good. Enjoy outdoor activities!';
                } else if (pm25Value <= 35.4) {
                    aqi = Math.round(51 + ((pm25Value - 12.1) / (35.4 - 12.1)) * 49);
                    category = 'Moderate';
                    healthTip = 'Air quality is acceptable. Sensitive individuals may experience minor breathing issues.';
                } else if (pm25Value <= 55.4) {
                    aqi = Math.round(101 + ((pm25Value - 35.5) / (55.4 - 35.5)) * 49);
                    category = 'Poor';
                    healthTip = 'Air quality is unhealthy for sensitive groups. Limit outdoor activities.';
                } else {
                    aqi = Math.round(151 + ((pm25Value - 55.5) / (150.4 - 55.5)) * 99);
                    category = 'Severe';
                    healthTip = 'Air quality is unhealthy. Avoid outdoor activities, especially if you have respiratory issues.';
                }

                return {
                    aqi: Math.min(aqi, 300), // Cap at 300
                    category,
                    healthTip,
                    pm25: pm25?.value || null,
                    pm10: pm10?.value || null,
                };
            }
        }

        return null;
    } catch (error) {
        console.error('Error fetching air quality:', error);
        return null;
    }
}

// Fetch weather data from OpenWeatherMap
async function fetchWeather(lat: number, lon: number) {
    try {
        const OPENWEATHER_API_KEY = Deno.env.get('OPENWEATHER_API_KEY');

        if (!OPENWEATHER_API_KEY) {
            // Fallback: return null if no API key
            return null;
        }

        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
        const response = await fetchWithTimeout(url, { method: 'GET' }, 8000);

        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        return {
            temperature: Math.round(data.main.temp),
            feelsLike: Math.round(data.main.feels_like),
            humidity: data.main.humidity,
            description: data.weather[0]?.description || 'Clear',
        };
    } catch (error) {
        console.error('Error fetching weather:', error);
        return null;
    }
}

// Analyze location for industry/water insights (using reverse geocoding and basic logic)
async function analyzeLocation(lat: number, lon: number) {
    try {
        // Use Nominatim (OpenStreetMap) for reverse geocoding - free, no key needed
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`;
        const response = await fetchWithTimeout(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'SnapTrash-Environment/1.0'
            }
        }, 8000);

        if (!response.ok) {
            return { industry: 'Unknown', waterRisk: 'Medium', pollutionRisk: 'Medium' };
        }

        const data = await response.json();
        const address = data.address || {};

        // Simple classification based on address components
        let industry = 'Residential';
        if (address.industrial || address.commercial || address.landuse === 'industrial') {
            industry = 'Industrial';
        } else if (address.landuse === 'commercial' || address.landuse === 'retail') {
            industry = 'Mixed';
        }

        // Basic water risk assessment
        let waterRisk = 'Low';
        if (address.landuse === 'industrial' || address.landuse === 'commercial') {
            waterRisk = 'Medium';
        }

        // Pollution risk assessment based on area type
        let pollutionRisk = 'Low';
        if (address.landuse === 'industrial') {
            pollutionRisk = 'High';
        } else if (address.landuse === 'commercial' || address.landuse === 'retail' || industry === 'Mixed') {
            pollutionRisk = 'Medium';
        }

        return {
            industry,
            waterRisk,
            pollutionRisk,
            locationName: address.city || address.town || address.village || 'Unknown Location',
        };
    } catch (error) {
        console.error('Error analyzing location:', error);
        return { industry: 'Unknown', waterRisk: 'Medium', pollutionRisk: 'Medium' };
    }
}

// Use Gemini to summarize insights
async function summarizeWithGemini(environmentData: any) {
    try {
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

        if (!LOVABLE_API_KEY) {
            return null;
        }

        const prompt = `You are an environmental expert. Summarize the following location-based environmental data in a friendly, concise way. Focus on actionable insights.

Air Quality: ${environmentData.airQuality ? `AQI ${environmentData.airQuality.aqi} (${environmentData.airQuality.category})` : 'Data unavailable'}
Weather: ${environmentData.weather ? `${environmentData.weather.temperature}°C, ${environmentData.weather.humidity}% humidity` : 'Data unavailable'}
Location Type: ${environmentData.location?.industry || 'Unknown'}
Water Risk: ${environmentData.location?.waterRisk || 'Unknown'}

Provide:
1. A brief 2-3 sentence summary of the environmental conditions
2. One practical conservation tip specific to this location type
3. One water conservation tip

Keep it concise and friendly. Use simple language.`;

        const response = await fetchWithTimeout('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an environmental expert providing concise, actionable insights. Keep responses brief and friendly.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 200,
            }),
        }, 10000);

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || null;
    } catch (error) {
        console.error('Error summarizing with Gemini:', error);
        return null;
    }
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { latitude, longitude } = await req.json();

        if (!latitude || !longitude) {
            return new Response(
                JSON.stringify({ error: 'Latitude and longitude are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Fetch all data in parallel with timeouts
        const [airQuality, weather, location] = await Promise.all([
            fetchAirQuality(latitude, longitude),
            fetchWeather(latitude, longitude),
            analyzeLocation(latitude, longitude),
        ]);

        const environmentData = {
            airQuality,
            weather,
            location,
        };

        // Get AI summary (optional, won't fail if it errors)
        const summary = await summarizeWithGemini(environmentData);

        return new Response(
            JSON.stringify({
                success: true,
                data: environmentData,
                summary: summary || null,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error in environment-insights function:', error);
        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : 'Unknown error',
                success: false
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});

