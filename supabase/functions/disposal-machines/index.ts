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

    // Simulated disposal machines data
    const machines = [
      {
        id: "1",
        name: "Ecoza Hub - Central Mall",
        location: "Central Mall, Ground Floor",
        distance: 0.8,
        available: true,
        acceptedTypes: ["Plastic", "Glass", "Metal", "Paper"],
        rewardMultiplier: 1.5,
        lastUpdated: "2 mins ago",
        coordinates: { lat: latitude + 0.005, lng: longitude + 0.003 },
      },
      {
        id: "2",
        name: "Ecoza Station - Metro Supermarket",
        location: "Metro Supermarket, Entrance",
        distance: 1.2,
        available: true,
        acceptedTypes: ["Plastic", "E-Waste", "Metal"],
        rewardMultiplier: 2.0,
        lastUpdated: "5 mins ago",
        coordinates: { lat: latitude - 0.008, lng: longitude + 0.006 },
      },
      {
        id: "3",
        name: "Ecoza Point - Green Park",
        location: "Green Park, East Gate",
        distance: 2.1,
        available: false,
        acceptedTypes: ["Organic", "Paper", "Plastic"],
        rewardMultiplier: 1.0,
        lastUpdated: "1 hour ago",
        coordinates: { lat: latitude + 0.012, lng: longitude - 0.009 },
      },
      {
        id: "4",
        name: "Ecoza Drop - City Center",
        location: "City Center Plaza",
        distance: 3.5,
        available: true,
        acceptedTypes: ["Plastic", "Glass", "Metal", "E-Waste", "Paper"],
        rewardMultiplier: 2.5,
        lastUpdated: "10 mins ago",
        coordinates: { lat: latitude - 0.02, lng: longitude + 0.015 },
      },
    ];

    return new Response(JSON.stringify({ machines }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Machines error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
