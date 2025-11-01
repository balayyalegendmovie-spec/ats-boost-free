# ats-boost

## Environment Configuration

### Setting up API Keys

⚠️ **IMPORTANT SECURITY NOTICE** ⚠️

The HuggingFace API key (`VITE_HUGGINGFACE_API_KEY`) should **NEVER** be shared publicly or committed to version control with real values.

#### For Local Development:

1. Copy `.env.example` to `.env`
2. Replace the placeholder value in `.env` with your actual HuggingFace API key
3. Ensure `.env` is in your `.gitignore` (it should be by default)

#### For Production/CI/CD (GitHub Actions):

**Step-by-Step Instructions to Secure Your API Key:**

1. Go to your GitHub repository page
2. Click on **Settings** tab
3. Navigate to **Secrets and variables** > **Actions**
4. Click **New repository secret** button
5. Enter the following:
   - **Name:** `VITE_HUGGINGFACE_API_KEY`
   - **Value:** Paste your actual HuggingFace API token
6. Click **Save**

Your secret will now be available in GitHub Actions workflows without exposing it in your code.

#### Security Best Practices:

- ✅ **DO:** Use `.env.example` with placeholder values only
- ✅ **DO:** Store real API keys in GitHub Secrets for CI/CD
- ✅ **DO:** Keep your `.env` file in `.gitignore`
- ❌ **DON'T:** Commit real API keys to the repository
- ❌ **DON'T:** Share API keys in public forums or documentation
- ❌ **DON'T:** Use real secrets in `.env.example`

**Note:** If you accidentally commit an API key, revoke it immediately and generate a new one.
