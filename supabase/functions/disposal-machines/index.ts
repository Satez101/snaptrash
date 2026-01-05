import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SnapTrash SmartStation database - simulated locations based on user coordinates
const generateNearbyMachines = (latitude: number, longitude: number) => {
  const machines = [
    {
      id: "st-001",
      name: "SnapTrash Hub - Central Mall",
      location: "Ground Floor, Near Food Court",
      area: "Central Mall",
      distance: 0.5,
      available: true,
      acceptedTypes: ["Plastic", "Glass", "Metal", "Paper"],
      rewardMultiplier: 1.5,
      lastUpdated: "2 mins ago",
      coordinates: { lat: latitude + 0.004, lng: longitude + 0.003 },
      type: "mall",
    },
    {
      id: "st-002",
      name: "SnapTrash Station - City University",
      location: "Student Center, East Wing",
      area: "City University Campus",
      distance: 0.8,
      available: true,
      acceptedTypes: ["Plastic", "E-Waste", "Paper", "Metal"],
      rewardMultiplier: 2.0,
      lastUpdated: "5 mins ago",
      coordinates: { lat: latitude - 0.006, lng: longitude + 0.005 },
      type: "campus",
    },
    {
      id: "st-003",
      name: "SnapTrash Point - Metro Mart",
      location: "Main Entrance, Parking Area",
      area: "Metro Mart Supermarket",
      distance: 1.2,
      available: true,
      acceptedTypes: ["Plastic", "Glass", "Organic", "Paper"],
      rewardMultiplier: 1.8,
      lastUpdated: "8 mins ago",
      coordinates: { lat: latitude + 0.008, lng: longitude - 0.004 },
      type: "mall",
    },
    {
      id: "st-004",
      name: "SnapTrash Eco-Station - Green Park",
      location: "Main Gate, Visitor Center",
      area: "Green Park Municipal",
      distance: 1.8,
      available: false,
      acceptedTypes: ["Organic", "Paper", "Plastic"],
      rewardMultiplier: 1.2,
      lastUpdated: "1 hour ago",
      coordinates: { lat: latitude + 0.012, lng: longitude - 0.009 },
      type: "park",
    },
    {
      id: "st-005",
      name: "SnapTrash Terminal - Tech Hub",
      location: "Lobby, Building A",
      area: "Tech Park Corporate",
      distance: 2.1,
      available: true,
      acceptedTypes: ["E-Waste", "Plastic", "Metal", "Paper"],
      rewardMultiplier: 2.5,
      lastUpdated: "10 mins ago",
      coordinates: { lat: latitude - 0.015, lng: longitude + 0.012 },
      type: "campus",
    },
    {
      id: "st-006",
      name: "SnapTrash Kiosk - Municipal Center",
      location: "Public Square, South Side",
      area: "Municipal Administration",
      distance: 2.5,
      available: true,
      acceptedTypes: ["Plastic", "Glass", "Metal", "Paper", "E-Waste"],
      rewardMultiplier: 1.5,
      lastUpdated: "15 mins ago",
      coordinates: { lat: latitude - 0.018, lng: longitude - 0.014 },
      type: "municipal",
    },
    {
      id: "st-007",
      name: "SnapTrash Drop - Riverside Walk",
      location: "Near Amphitheater",
      area: "Riverside Park",
      distance: 3.2,
      available: true,
      acceptedTypes: ["Plastic", "Organic", "Paper"],
      rewardMultiplier: 1.3,
      lastUpdated: "20 mins ago",
      coordinates: { lat: latitude + 0.022, lng: longitude + 0.018 },
      type: "park",
    },
    {
      id: "st-008",
      name: "SnapTrash Center - Fashion Square",
      location: "Level 2, Near Escalators",
      area: "Fashion Square Mall",
      distance: 3.8,
      available: true,
      acceptedTypes: ["Plastic", "Glass", "Metal", "Paper", "Organic"],
      rewardMultiplier: 2.0,
      lastUpdated: "25 mins ago",
      coordinates: { lat: latitude - 0.025, lng: longitude - 0.020 },
      type: "mall",
    },
  ];

  // Sort by distance
  return machines.sort((a, b) => a.distance - b.distance);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude } = await req.json();

    if (!latitude || !longitude) {
      console.log("Missing coordinates, using default location");
      // Default to a sample location if no coords provided
      const defaultLat = 28.6139;
      const defaultLng = 77.2090;
      const machines = generateNearbyMachines(defaultLat, defaultLng);
      return new Response(JSON.stringify({ machines }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Fetching machines near: ${latitude}, ${longitude}`);
    const machines = generateNearbyMachines(latitude, longitude);

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