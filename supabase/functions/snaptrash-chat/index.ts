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

// Call AI with user's Gemini API key (direct Google API)
async function callGeminiAPI(apiKey: string, message: string, history: any[]) {
  const contents = [];
  
  // Add history
  for (const msg of (history || [])) {
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    });
  }
  
  // Add current message
  contents.push({
    role: 'user',
    parts: [{ text: message }]
  });

  // Use gemini-2.0-flash which is free via Google AI Studio
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey, {
    method: 'POST',
    headers: {
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

// Call Lovable AI Gateway
async function callLovableAPI(apiKey: string, message: string, history: any[]) {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        ...(history || []),
        { role: 'user', content: message }
      ],
    }),
  });

  return response;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, history, userGeminiApiKey } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    let response;
    let useUserKey = false;

    // Try Lovable AI first
    if (LOVABLE_API_KEY) {
      response = await callLovableAPI(LOVABLE_API_KEY, message, history);
      
      // If Lovable AI fails with 402 (quota) or 429 (rate limit), try user's key
      if ((response.status === 402 || response.status === 429) && userGeminiApiKey) {
        console.log('Lovable AI quota exceeded, falling back to user Gemini API key...');
        useUserKey = true;
      }
    }

    // Use user's Gemini API key as fallback
    if (useUserKey || !LOVABLE_API_KEY) {
      if (!userGeminiApiKey) {
        return new Response(
          JSON.stringify({ error: 'AI quota exceeded. Please add your Gemini API key.', needsApiKey: true }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('Using user Gemini API key for chat...');
      response = await callGeminiAPI(userGeminiApiKey, message, history);
    }

    if (!response || !response.ok) {
      const errorText = response ? await response.text() : 'No response';
      console.error('AI error:', response?.status, errorText);
      
      if (response?.status === 400 && errorText.includes('API_KEY_INVALID')) {
        return new Response(
          JSON.stringify({ error: 'Invalid Gemini API key. Please check your key.', invalidKey: true }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response?.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Gemini rate limit hit. Please wait a moment and try again.', rateLimited: true }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'AI service error. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // Handle different response formats
    let content;
    if (data.choices?.[0]?.message?.content) {
      // Lovable AI format
      content = data.choices[0].message.content;
    } else if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      // Google Gemini API format
      content = data.candidates[0].content.parts[0].text;
    } else {
      content = "I couldn't process that. Please try again.";
    }

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
