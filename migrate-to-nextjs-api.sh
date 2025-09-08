#!/bin/bash

# ========= GenCV Migration to Next.js API Routes =========
# This script helps migrate the Express backend to Next.js API Routes
# and prepares the project for Vercel deployment.

# Install required dependencies for the API routes
echo "Installing dependencies for API routes..."
cd apps/web
npm install puppeteer-core @sparticuz/chromium @google/generative-ai

# Inform about the API routes structure
echo ""
echo "✅ API routes structure created:"
echo "  - /api/enhance        → AI text enhancement"
echo "  - /api/generate-pdf   → PDF generation"
echo ""

# Update the environment variables
echo "Updating environment variables for production..."
cd ../..
echo "GEMINI_API_KEY=AIzaSyCHzPhc7hQ0WnmxO4N9woh3bixY4NpdMBU" > .env.production
echo "NEXT_PUBLIC_API_URL=/api" >> .env.production

# Create a .vercel.json configuration file
echo "Creating Vercel configuration file..."
cat > vercel.json << EOL
{
  "buildCommand": "cd ../.. && npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "ignoreCommand": "cd ../.. && npm run dev",
  "git": {
    "deploymentEnabled": {
      "main": true
    }
  }
}
EOL

# Build the project
echo "Building the project..."
npm run build

echo ""
echo "✅ Migration completed successfully!"
echo "✅ Your project is now ready to be deployed to Vercel."
echo ""
echo "To deploy to Vercel:"
echo "1. Push your changes to GitHub"
echo "2. Import your repository in Vercel"
echo "3. Set the Root Directory to 'apps/web'"
echo "4. Add the environment variable GEMINI_API_KEY in the Vercel dashboard"
echo "5. Deploy!"
echo ""
echo "Your CV Generator will now work with the integrated Next.js API routes"
echo "instead of requiring a separate Express backend."
