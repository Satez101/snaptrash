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
  "confidence": number (0.0 to 1.0 - be honest about certainty),
  "machineDisposalSteps": [
    {
      "step": number,
      "action": "string (short action description)",
      "slot": "string (which bin/slot to use: 'Recyclable', 'Organic', 'E-Waste', 'General Waste')",
      "tip": "string (optional helpful hint)"
    }
  ],
  "materialBreakdown": [
    {
      "material": "string (e.g., 'Plastic wrapper', 'Paper label', 'Metal cap')",
      "slot": "string (correct disposal slot for this component)",
      "action": "string (what to do with this part)"
    }
  ]
}

MACHINE DISPOSAL STEPS GUIDELINES:
- Generate 2-4 clear, actionable steps for disposing the item at a SnapTrash SmartStation
- Each step should be specific and helpful
- Include the correct slot/bin for each component
- If the item has multiple materials, break them down separately
- Be encouraging and friendly in tone

EXAMPLE for a plastic bottle:
{
  "machineDisposalSteps": [
    {"step": 1, "action": "Remove the bottle cap", "slot": "Recyclable", "tip": "Caps are often a different plastic type"},
    {"step": 2, "action": "Empty any remaining liquid", "slot": "N/A", "tip": "Dry containers recycle better"},
    {"step": 3, "action": "Crush the bottle to save space", "slot": "Recyclable", "tip": "Crushed bottles = more room for others"},
    {"step": 4, "action": "Drop in the Recyclable slot", "slot": "Recyclable", "tip": "You just earned SnapCreds! 🎉"}
  ]
}

EXAMPLE for coffee cup with lid:
{
  "materialBreakdown": [
    {"material": "Plastic lid", "slot": "Recyclable", "action": "Remove and recycle separately"},
    {"material": "Paper cup (wax-coated)", "slot": "General Waste", "action": "Cannot be recycled due to coating"},
    {"material": "Cardboard sleeve", "slot": "Recyclable", "action": "Can be recycled if clean"}
  ]
}

CONFIDENCE HANDLING:
- High confidence (0.85-1.0): Clear, well-lit object that you can identify with certainty
- Medium confidence (0.6-0.84): Partially visible or slightly unclear, but you can make a reasonable identification
- Low confidence (0.3-0.59): Poor image quality but you can still attempt identification - add disclaimer in disposal field
- Only return success: false if confidence would be below 0.3

ONLY return success: false when the image is COMPLETELY UNUSABLE:
{
  "success": false,
  "error": "Unable to identify - the image appears to be completely empty or contains no visible objects. Please capture a photo of the item you'd like to identify."
}

Your goal is to HELP USERS ACT, not to reject their input. Always provide actionable disposal guidance that works with SnapTrash Machines.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, latitude, longitude } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build location context for localized guidance
    let locationContext = '';
    if (latitude && longitude) {
      locationContext = `\n\nUser location coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}. There are SnapTrash SmartStations nearby. Provide disposal guidance optimized for using these machines, including step-by-step instructions for the machine interface.`;
    }

    console.log('SnapTrash Vision AI: Analyzing image...', latitude ? `(with location: ${latitude}, ${longitude})` : '(no location)');

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
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this image and identify the waste item. Provide detailed classification, responsible disposal instructions, AND step-by-step guidance for using a SnapTrash Machine to dispose of it correctly. Remember: ALWAYS attempt identification unless the image is completely empty.${locationContext}`
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service quota exceeded.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to analyze image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in AI response:', data);
      return new Response(
        JSON.stringify({ error: 'No analysis result from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('SnapTrash Vision AI response:', content);

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
        
        // Ensure machineDisposalSteps exists with defaults
        if (!result.machineDisposalSteps || !Array.isArray(result.machineDisposalSteps)) {
          result.machineDisposalSteps = [
            { step: 1, action: "Identify the waste category", slot: result.recyclable ? "Recyclable" : "General Waste", tip: "Check the label if unsure" },
            { step: 2, action: "Clean the item if possible", slot: "N/A", tip: "Dry items recycle better" },
            { step: 3, action: `Drop in the ${result.recyclable ? "Recyclable" : "General Waste"} slot`, slot: result.recyclable ? "Recyclable" : "General Waste", tip: "You earned SnapCreds! 🎉" }
          ];
        }
        
        // Ensure materialBreakdown exists for mixed waste
        if (result.category === 'Mixed Waste' && (!result.materialBreakdown || !Array.isArray(result.materialBreakdown))) {
          result.materialBreakdown = [];
        }
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
          confidence: 0.4,
          machineDisposalSteps: [
            { step: 1, action: "Check item for recycling symbols", slot: "N/A", tip: "Look for ♻️ symbols" },
            { step: 2, action: "When unsure, use General Waste", slot: "General Waste", tip: "Better safe than contaminating recycling" },
            { step: 3, action: "Ask a SnapTrash attendant if available", slot: "N/A", tip: "They're happy to help!" }
          ],
          materialBreakdown: []
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