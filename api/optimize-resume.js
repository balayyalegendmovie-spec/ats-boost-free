// Vercel serverless function for resume optimization using HuggingFace API

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are accepted'
    });
  }

  try {
    const { resumeText, jobDescription } = req.body;

    // Validate input
    if (!resumeText || !jobDescription) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Both resumeText and jobDescription are required'
      });
    }

    // Validate environment variable
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      console.error('HUGGINGFACE_API_KEY not configured');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'API key not configured. Please set HUGGINGFACE_API_KEY environment variable.'
      });
    }

    // Create optimization prompt
    const prompt = `Optimize the following resume for the given job description. Provide specific suggestions for improvements, keyword optimization, and alignment with job requirements.

Job Description:
${jobDescription}

Resume:
${resumeText}

Provide detailed optimization suggestions:`;

    // Call HuggingFace API
    const response = await fetch(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 1000,
            temperature: 0.7,
            top_p: 0.95,
            return_full_text: false
          }
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('HuggingFace API error:', response.status, errorData);
      
      if (response.status === 401) {
        return res.status(500).json({ 
          error: 'API authentication failed',
          message: 'Invalid API key configuration'
        });
      }
      
      if (response.status === 429) {
        return res.status(429).json({ 
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.'
        });
      }
      
      return res.status(500).json({ 
        error: 'API request failed',
        message: `HuggingFace API error: ${response.status}`
      });
    }

    const data = await response.json();
    
    // Extract suggestions from response
    let suggestions = '';
    if (Array.isArray(data) && data.length > 0 && data[0].generated_text) {
      suggestions = data[0].generated_text;
    } else if (data.generated_text) {
      suggestions = data.generated_text;
    } else {
      console.error('Unexpected API response format:', data);
      return res.status(500).json({ 
        error: 'Unexpected response format',
        message: 'Unable to parse API response'
      });
    }

    // Return success response
    return res.status(200).json({
      success: true,
      suggestions: suggestions.trim(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in optimize-resume handler:', error);
    
    // Handle network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'Service unavailable',
        message: 'Unable to connect to HuggingFace API'
      });
    }
    
    // Handle timeout errors
    if (error.code === 'ETIMEDOUT') {
      return res.status(504).json({ 
        error: 'Request timeout',
        message: 'API request timed out. Please try again.'
      });
    }
    
    // Generic error response
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred while processing your request'
    });
  }
}
