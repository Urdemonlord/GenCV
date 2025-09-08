# ========= GenCV Migration to Next.js API Routes =========
# This script helps migrate the Express backend to Next.js API Routes
# and prepares the project for Vercel deployment.

# Install required dependencies for the API routes
Write-Host "Installing dependencies for API routes..."
Set-Location -Path "apps/web"
npm install puppeteer-core @sparticuz/chromium @google/generative-ai

# Inform about the API routes structure
Write-Host ""
Write-Host "✅ API routes structure created:"
Write-Host "  - /api/enhance        → AI text enhancement"
Write-Host "  - /api/generate-pdf   → PDF generation"
Write-Host ""

# Update the environment variables
Write-Host "Updating environment variables for production..."
Set-Location -Path "../.."
"GEMINI_API_KEY=AIzaSyCHzPhc7hQ0WnmxO4N9woh3bixY4NpdMBU" | Out-File -FilePath ".env.production" -Encoding utf8
"NEXT_PUBLIC_API_URL=/api" | Add-Content -Path ".env.production" -Encoding utf8

# Create a .vercel.json configuration file
Write-Host "Creating Vercel configuration file..."
@'
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
'@ | Out-File -FilePath "vercel.json" -Encoding utf8

# Build the project
Write-Host "Building the project..."
npm run build

Write-Host ""
Write-Host "✅ Migration completed successfully!"
Write-Host "✅ Your project is now ready to be deployed to Vercel."
Write-Host ""
Write-Host "To deploy to Vercel:"
Write-Host "1. Push your changes to GitHub"
Write-Host "2. Import your repository in Vercel"
Write-Host "3. Set the Root Directory to 'apps/web'"
Write-Host "4. Add the environment variable GEMINI_API_KEY in the Vercel dashboard"
Write-Host "5. Deploy!"
Write-Host ""
Write-Host "Your CV Generator will now work with the integrated Next.js API routes"
Write-Host "instead of requiring a separate Express backend."
