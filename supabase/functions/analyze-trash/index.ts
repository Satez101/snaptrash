import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `You are SnapTrash Vision AI, an expert waste-identification system trained to recognize real-world trash items, including complex, multi-material objects.

Your task is to analyze uploaded images and provide the most accurate possible identification, even when:
- The image quality is imperfect
- The object is partially visible
- The item is made of multiple materials
- The item belongs to electronic or mixed-waste categories

❗ CRITICAL RULES:
1. ALWAYS attempt a best-guess identification - Do NOT refuse analysis for common objects
2. Do NOT default to "unclear" unless the image is completely empty or totally unrelated to waste/objects
3. If the item appears electronic (e.g., headphones, chargers, cables, remotes, phones, batteries), classify it as E-Waste
4. If multiple materials are present, choose the most responsible disposal category based on the primary/dominant material or environmental concern
5. For items that combine materials (e.g., coffee cup with plastic lid), identify as Mixed Waste and explain each component

WASTE CATEGORIES (choose one):
- Plastic (bottles, containers, packaging, bags, wrappers)
- Metal (cans, foil, metal containers, utensils)
- Glass (bottles, jars, broken glass)
- Paper (newspapers, cardboard, magazines, receipts)
- Organic (food waste, yard waste, compostables)
- E-Waste (electronics, batteries, cables, phones, headphones, chargers, remotes)
- Hazardous (chemicals, paint, medical waste, fluorescent bulbs)
- Textile (clothes, fabric, shoes)
- Mixed Waste (multi-material items that can't be easily separated)

Your response MUST be a valid JSON object with this EXACT structure:

{
  "success": true,
  "category": "string (one of the categories above)",
  "item": "string (specific item name like 'Wired Headphones', 'PET Bottle', 'Aluminum Can', etc.)",
  "disposal": "string (detailed, responsible disposal instructions specific to this item)",
  "tips": "string (one practical eco-friendly suggestion related to this waste type)",
  "impact": "string (clear environmental impact in simple terms - what happens if improperly disposed)",
  "recyclable": boolean (true if item can be recycled through standard recycling, false if needs special handling),
  "confidence": number (0.0 to 1.0 - be honest about certainty)
}

CONFIDENCE HANDLING:
- High confidence (0.85-1.0): Clear, well-lit object that you can identify with certainty
- Medium confidence (0.6-0.84): Partially visible or slightly unclear, but you can make a reasonable identification
- Low confidence (0.3-0.59): Poor image quality but you can still attempt identification - add disclaimer in disposal field like "Based on visible features, this appears to be..."
- Only return success: false if confidence would be below 0.3 (image is completely empty, blurry beyond recognition, or shows nothing waste-related)

ONLY return success: false when the image is COMPLETELY UNUSABLE:
{
  "success": false,
  "error": "Unable to identify - the image appears to be completely empty or contains no visible objects. Please capture a photo of the item you'd like to identify."
}

EXAMPLES OF WHAT TO ALWAYS IDENTIFY (never refuse):
- Headphones/earbuds → E-Waste
- Phone charger/cable → E-Waste
- Remote control → E-Waste
- Plastic bottle → Plastic
- Coffee cup → Mixed Waste (paper cup + plastic lid)
- Pizza box with grease → Mixed Waste (contaminated paper)
- Banana peel → Organic
- Broken electronics → E-Waste
- Clothing items → Textile

Your goal is to HELP USERS ACT, not to reject their input. Always provide actionable disposal guidance.`;

// Call AI with user's Gemini API key (direct Google API)
async function callGeminiAPI(apiKey: string, imageBase64: string) {
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
          parts: [
            { text: systemPrompt },
            { text: 'Analyze this image and identify the waste item. Provide detailed classification and responsible disposal instructions. Remember: ALWAYS attempt identification unless the image is completely empty.' },
            {
              inline_data: {
                mime_type: imageBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg',
                data: imageBase64.replace(/^data:image\/\w+;base64,/, '')
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1024,
      }
    }),
  });

  return response;
}

// Call Lovable AI Gateway
async function callLovableAPI(apiKey: string, imageBase64: string) {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this image and identify the waste item. Provide detailed classification and responsible disposal instructions. Remember: ALWAYS attempt identification unless the image is completely empty.'
            },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64
              }
            }
          ]
        }
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
    const { imageBase64, userGeminiApiKey } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    let response;
    let useUserKey = false;

    // Try Lovable AI first
    if (LOVABLE_API_KEY) {
      console.log('SnapTrash Vision AI: Analyzing image with Lovable AI...');
      response = await callLovableAPI(LOVABLE_API_KEY, imageBase64);
      
      // If Lovable AI fails with 402 (quota) or 429 (rate limit), try user's key
      if ((response.status === 402 || response.status === 429) && userGeminiApiKey) {
        console.log('Lovable AI quota exceeded, falling back to user Gemini API key...');
        useUserKey = true;
      }
    }

    // Use user's Gemini API key as fallback
    if (useUserKey || !LOVABLE_API_KEY) {
      if (!userGeminiApiKey) {
        const errorMsg = !LOVABLE_API_KEY 
          ? 'AI service not configured. Please add your Gemini API key in Settings.'
          : 'AI quota exceeded. Please add your Gemini API key in Settings to continue.';
        return new Response(
          JSON.stringify({ error: errorMsg, needsApiKey: true }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('SnapTrash Vision AI: Analyzing image with user Gemini API key...');
      response = await callGeminiAPI(userGeminiApiKey, imageBase64);
    }

    if (!response || !response.ok) {
      const errorText = response ? await response.text() : 'No response';
      console.error('AI error:', response?.status, errorText);
      
      if (response?.status === 400 && errorText.includes('API_KEY_INVALID')) {
        return new Response(
          JSON.stringify({ error: 'Invalid Gemini API key. Please check your API key in Settings.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response?.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to analyze image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // Handle different response formats (Lovable AI vs Google Gemini API)
    let content;
    if (data.choices?.[0]?.message?.content) {
      // Lovable AI format
      content = data.choices[0].message.content;
    } else if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      // Google Gemini API format
      content = data.candidates[0].content.parts[0].text;
    }
    
    if (!content) {
      console.error('No content in AI response:', data);
      return new Response(
        JSON.stringify({ error: 'No analysis result from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('SnapTrash Vision AI response received');

    // Parse the JSON from the AI response
    let result;
    try {
      // Try to extract JSON from the response (handle markdown code blocks)
      let jsonString = content;
      
      // Remove markdown code blocks if present
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonString = codeBlockMatch[1].trim();
      } else {
        // Try to find raw JSON object
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonString = jsonMatch[0];
        }
      }
      
      result = JSON.parse(jsonString);
      
      // Ensure required fields exist
      if (result.success === undefined) {
        result.success = true;
      }
      
      // Validate and sanitize the response
      if (result.success) {
        result.category = result.category || 'Mixed Waste';
        result.item = result.item || 'Unidentified Item';
        result.disposal = result.disposal || 'Please check with your local waste management facility for proper disposal.';
        result.tips = result.tips || 'Consider if this item can be reused before disposing.';
        result.impact = result.impact || 'Improper disposal can contribute to landfill overflow and environmental pollution.';
        result.recyclable = result.recyclable ?? false;
        result.confidence = typeof result.confidence === 'number' ? Math.min(1, Math.max(0, result.confidence)) : 0.7;
      }
      
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw content:', content);
      
      // Attempt to create a reasonable response from failed parse
      return new Response(
        JSON.stringify({ 
          success: true,
          category: 'Mixed Waste',
          item: 'Unidentified Item',
          disposal: 'Unable to fully analyze. Please check with your local waste management facility for proper disposal of this item.',
          tips: 'When in doubt, check your local recycling guidelines or contact waste management.',
          impact: 'Proper disposal prevents environmental contamination and supports recycling efforts.',
          recyclable: false,
          confidence: 0.4
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-trash function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
