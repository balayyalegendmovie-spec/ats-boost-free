# ats-boost

## Environment Configuration

### Setting up API Keys

This project uses HuggingFace API for AI-powered features. To configure the API key:

1. **For Local Development:**
   - Copy `.env.example` to `.env`
   - Replace the placeholder value in `.env` with your actual HuggingFace API key

2. **For Production/CI/CD:**
   - **DO NOT** commit real API keys to the repository
   - Use GitHub repository secrets to store the real API key:
     - Go to your repository Settings > Secrets and variables > Actions
     - Add a new secret named `VITE_HUGGINGFACE_API_KEY`
     - The secret will be available in GitHub Actions workflows
   - Reference the secret in your deployment configuration

3. **Security Best Practices:**
   - Never commit `.env` files containing real credentials
   - Always use environment variables or secrets management for sensitive data
   - Rotate API keys regularly and revoke any accidentally exposed keys
