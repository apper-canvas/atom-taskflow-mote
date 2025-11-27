import apper from "https://cdn.apper.io/actions/apper-actions.js";

apper.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      success: false,
      error: 'Method not allowed. Use POST.'
    }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get OpenAI API key from secrets
    const openaiApiKey = await apper.getSecret('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'OpenAI API key not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const { commentContext, previousComments = [] } = await req.json();
    
    if (!commentContext || typeof commentContext !== 'string') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Comment context is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build context from previous comments
    let contextText = `Original comment: ${commentContext}\n\n`;
    if (previousComments.length > 0) {
      contextText += "Previous comments in this thread:\n";
      previousComments.slice(-3).forEach((comment, index) => {
        contextText += `${index + 1}. ${comment.authorName}: ${comment.content}\n`;
      });
    }

    // Create OpenAI request
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates professional, contextually appropriate comment replies for a project management application. Generate 3 different reply suggestions that are concise, professional, and relevant to the conversation context. Each suggestion should be 1-2 sentences maximum.'
          },
          {
            role: 'user',
            content: `Generate 3 professional reply suggestions for this comment thread:\n\n${contextText}\n\nProvide only the reply text, one per line, no numbering or formatting.`
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      return new Response(JSON.stringify({
        success: false,
        error: `OpenAI API error: ${openaiResponse.status} - ${errorData}`
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const openaiData = await openaiResponse.json();
    
    if (!openaiData.choices?.[0]?.message?.content) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid response from OpenAI API'
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse suggestions from response
    const suggestions = openaiData.choices[0].message.content
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .slice(0, 3);

    return new Response(JSON.stringify({
      success: true,
      suggestions
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: `Server error: ${error.message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});