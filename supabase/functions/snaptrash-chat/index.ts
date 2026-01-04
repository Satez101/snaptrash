import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `You are SnapTrash Expert, an environmental AI assistant.

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
• For disposal questions, mention SnapTrash machines in the app`;

// Call AI with user's Gemini API key
async function callGeminiAPI(apiKey: string, message: string, history: any[], model: string = 'gemini-2.0-flash') {
  const contents = [];
  
  for (const msg of (history || [])) {
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    });
  }
  
  contents.push({
    role: 'user',
    parts: [{ text: message }]
  });

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
      }
    }),
  });

  return response;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, history, userGeminiApiKey, userGeminiModel } = await req.json();

    if (!userGeminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Please add your Gemini API key in Settings.', needsApiKey: true }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const model = userGeminiModel || 'gemini-2.0-flash';
    console.log('Using Gemini model:', model);
    
    const response = await callGeminiAPI(userGeminiApiKey, message, history, model);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      
      if (response.status === 400 && errorText.includes('API_KEY_INVALID')) {
        return new Response(
          JSON.stringify({ error: 'Invalid API key. Please check your key in Settings.', invalidKey: true }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit hit. Please wait and try again.', rateLimited: true }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'AI service error. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't process that. Please try again.";

    return new Response(JSON.stringify({ response: content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ error: 'Something went wrong. Please try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
