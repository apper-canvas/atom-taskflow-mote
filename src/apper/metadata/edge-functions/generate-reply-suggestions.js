import apper from 'https://cdn.apper.io/actions/apper-actions.js';

export default apper.serve(async (req) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Method not allowed'
      }), { 
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get OpenAI API key from secrets
    const apiKey = await apper.getSecret('OPENAI_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'OpenAI API key not configured'
      }), { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    let requestData;
    try {
      requestData = await req.json();
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON in request body'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { commentText, contextComments = [], authorName = 'User' } = requestData;

    // Validate input
    if (!commentText || typeof commentText !== 'string' || commentText.trim().length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Comment text is required'
      }), { 
        status: 422,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build context for OpenAI
    let contextText = '';
    if (contextComments.length > 0) {
      contextText = contextComments
        .slice(-5) // Last 5 comments for context
        .map(comment => `${comment.authorName}: ${comment.content}`)
        .join('\n');
    }

    const prompt = `You are helping generate professional and helpful reply suggestions for a team collaboration comment thread. 

Context of previous comments:
${contextText || 'No previous context available'}

Current comment to reply to:
"${commentText.trim()}"

Generate 3 different reply suggestions that are:
- Professional and constructive
- Contextually relevant to the discussion
- Brief (1-2 sentences each)
- Helpful for team collaboration
- Varied in tone (supportive, questioning, solution-oriented)

Return only a JSON array of strings, no additional text.`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates professional reply suggestions for team collaboration.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      return new Response(JSON.stringify({
        success: false,
        error: `OpenAI API error: ${response.status} ${response.statusText}`
      }), { 
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const aiResponse = await response.json();
    
    if (!aiResponse.choices || !aiResponse.choices[0] || !aiResponse.choices[0].message) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid response from OpenAI API'
      }), { 
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const aiContent = aiResponse.choices[0].message.content.trim();
    
    // Parse AI response as JSON
    let suggestions;
    try {
      suggestions = JSON.parse(aiContent);
      if (!Array.isArray(suggestions) || suggestions.length === 0) {
        throw new Error('Invalid suggestions format');
      }
    } catch (error) {
      // Fallback: split by lines if JSON parsing fails
      suggestions = aiContent.split('\n').filter(line => line.trim().length > 0).slice(0, 3);
    }

    // Ensure we have valid suggestions
    const validSuggestions = suggestions
      .filter(s => typeof s === 'string' && s.trim().length > 0)
      .slice(0, 3)
      .map(s => s.trim().replace(/^["']|["']$/g, ''));

    if (validSuggestions.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No valid suggestions generated'
      }), { 
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      suggestions: validSuggestions
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error occurred'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});