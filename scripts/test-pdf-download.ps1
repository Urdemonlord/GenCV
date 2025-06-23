#!/usr/bin/env pwsh
# PowerShell script to test PDF download with curl

# Configuration
$apiUrl = "http://localhost:3001"
$outputFile = "test-download.pdf"

# Create a minimal CV data object
$cvData = @{
    personalInfo = @{
        fullName = "Test User"
        email = "test@example.com"
        phone = "123-456-7890"
    }
    summary = "This is a test CV download."
    skills = @("Testing", "PDF Generation", "Debugging")
} | ConvertTo-Json -Depth 10

# Save JSON data to a temporary file
$jsonFile = New-TemporaryFile
Set-Content -Path $jsonFile -Value $cvData -Encoding UTF8

Write-Host "Testing PDF download from $apiUrl/api/generate-pdf..."
Write-Host "Using test data: $($cvData | Out-String)"

# Make the request with curl
Write-Host "Sending request via curl..."
curl.exe -v -X POST "$apiUrl/api/generate-pdf" `
    -H "Content-Type: application/json" `
    -H "Accept: application/pdf" `
    -d "@$jsonFile" `
    --output "$outputFile" `
    --trace-ascii curl-trace.txt

# Check if file was created and is valid PDF
if (Test-Path $outputFile) {
    $fileSize = (Get-Item $outputFile).Length
    Write-Host "PDF file downloaded: $outputFile (Size: $fileSize bytes)"
    
    # Check PDF signature
    $bytes = [System.IO.File]::ReadAllBytes($outputFile)[0..4]
    $signature = [System.Text.Encoding]::ASCII.GetString($bytes)
    
    Write-Host "PDF signature: $signature"
    if ($signature -eq "%PDF-") {
        Write-Host "SUCCESS: Valid PDF signature detected." -ForegroundColor Green
    } else {
        Write-Host "ERROR: Invalid PDF signature. File may be corrupted." -ForegroundColor Red
    }
    
    # Additional file info
    if ($fileSize -lt 5000) {
        Write-Host "WARNING: PDF file is suspiciously small ($fileSize bytes)" -ForegroundColor Yellow
    }
} else {
    Write-Host "ERROR: Failed to download PDF file" -ForegroundColor Red
}

# Clean up
Remove-Item -Path $jsonFile

Write-Host "Test completed. Check curl-trace.txt for detailed request/response information."
