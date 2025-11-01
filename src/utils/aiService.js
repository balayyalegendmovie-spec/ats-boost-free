/**
 * AI Service for Resume Optimization and Cover Letter Generation
 * Uses HuggingFace Inference API
 */

const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/';
const DEFAULT_MODEL = 'mistralai/Mistral-7B-Instruct-v0.2';

/**
 * Optimize resume content for ATS compatibility
 * @param {string} resumeText - Original resume text
 * @param {string} jobDescription - Target job description
 * @param {string} apiKey - HuggingFace API key
 * @returns {Promise<Object>} Optimized resume suggestions
 */
export async function optimizeResume(resumeText, jobDescription, apiKey) {
  try {
    if (!resumeText || !jobDescription) {
      throw new Error('Resume text and job description are required');
    }

    if (!apiKey) {
      throw new Error('HuggingFace API key is required');
    }

    const prompt = `You are an ATS (Applicant Tracking System) expert. Analyze the following resume and job description, then provide specific suggestions to optimize the resume for ATS compatibility.

Job Description:
${jobDescription}

Resume:
${resumeText}

Provide optimization suggestions in the following categories:
1. Keywords to add
2. Skills to highlight
3. Format improvements
4. Content enhancements

Be specific and actionable.`;

    const response = await fetch(`${HUGGINGFACE_API_URL}${DEFAULT_MODEL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          top_p: 0.95,
          return_full_text: false,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `HuggingFace API error: ${response.status} - ${errorData.error || response.statusText}`
      );
    }

    const data = await response.json();
    
    if (!data || !data[0] || !data[0].generated_text) {
      throw new Error('Invalid response from HuggingFace API');
    }

    return {
      success: true,
      suggestions: data[0].generated_text,
      originalResume: resumeText,
      jobDescription: jobDescription,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error in optimizeResume:', error);
    return {
      success: false,
      error: error.message,
      suggestions: null,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Generate a cover letter based on resume and job description
 * @param {string} resumeText - User's resume text
 * @param {string} jobDescription - Target job description
 * @param {string} companyName - Company name
 * @param {string} apiKey - HuggingFace API key
 * @returns {Promise<Object>} Generated cover letter
 */
export async function generateCoverLetter(resumeText, jobDescription, companyName, apiKey) {
  try {
    if (!resumeText || !jobDescription || !companyName) {
      throw new Error('Resume text, job description, and company name are required');
    }

    if (!apiKey) {
      throw new Error('HuggingFace API key is required');
    }

    const prompt = `You are a professional career coach. Write a compelling cover letter for the following job application.

Company: ${companyName}

Job Description:
${jobDescription}

Candidate Resume:
${resumeText}

Write a professional, personalized cover letter that:
1. Highlights relevant experience from the resume
2. Matches the job requirements
3. Shows enthusiasm for the role
4. Is concise and well-structured
5. Uses a professional tone

Cover Letter:`;

    const response = await fetch(`${HUGGINGFACE_API_URL}${DEFAULT_MODEL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 600,
          temperature: 0.8,
          top_p: 0.95,
          return_full_text: false,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `HuggingFace API error: ${response.status} - ${errorData.error || response.statusText}`
      );
    }

    const data = await response.json();
    
    if (!data || !data[0] || !data[0].generated_text) {
      throw new Error('Invalid response from HuggingFace API');
    }

    return {
      success: true,
      coverLetter: data[0].generated_text,
      companyName: companyName,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error in generateCoverLetter:', error);
    return {
      success: false,
      error: error.message,
      coverLetter: null,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Validate HuggingFace API key
 * @param {string} apiKey - HuggingFace API key to validate
 * @returns {Promise<Object>} Validation result
 */
export async function validateApiKey(apiKey) {
  try {
    if (!apiKey) {
      throw new Error('API key is required');
    }

    const response = await fetch(`${HUGGINGFACE_API_URL}${DEFAULT_MODEL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: 'Test',
        parameters: {
          max_new_tokens: 10,
        },
      }),
    });

    return {
      valid: response.ok,
      status: response.status,
      message: response.ok ? 'API key is valid' : 'API key is invalid',
    };
  } catch (error) {
    console.error('Error validating API key:', error);
    return {
      valid: false,
      error: error.message,
      message: 'Failed to validate API key',
    };
  }
}

export default {
  optimizeResume,
  generateCoverLetter,
  validateApiKey,
};
