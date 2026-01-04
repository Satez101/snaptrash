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
    const { message, history } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: `You are SnapTrash Expert, an environmental AI assistant.

RESPONSE FORMAT (STRICT):
• Keep answers SHORT and CRISP (max 3-5 bullet points)
• Use bullet points (•) for all key information
• Each bullet should be 1 line max
• No long paragraphs - users want quick facts
• Add a brief 1-line summary at the end if needed

TOPICS YOU COVER:
• Waste disposal & recycling
• Environmental sustainability
• Climate change & awareness
• Air quality (AQI) & pollution
• Renewable energy
• Water conservation
• E-waste & composting

RULES:
• If off-topic, politely redirect in 1 line
• Use 1-2 relevant emojis max
• For disposal questions, mention SnapTrash machines in the app`
          },
          ...(history || []),
          { role: 'user', content: message }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI error:', response.status, errorText);
      throw new Error('AI service error');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "I couldn't process that. Please try again.";

    return new Response(JSON.stringify({ response: content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});