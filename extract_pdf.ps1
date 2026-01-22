# PowerShell script to extract text from PDF
# This is a simple approach - may need PDF library

$pdfPath = "设置轮循操作文档.pdf"

# Try using .NET libraries if available
try {
    Add-Type -AssemblyName System.Drawing
    Write-Host "Attempting to read PDF..."
    
    # Check if file exists
    if (Test-Path $pdfPath) {
        Write-Host "File exists: $pdfPath"
        $fileInfo = Get-Item $pdfPath
        Write-Host "File size: $($fileInfo.Length) bytes"
        Write-Host "File created: $($fileInfo.CreationTime)"
    } else {
        Write-Host "File not found: $pdfPath"
    }
} catch {
    Write-Host "Error: $_"
}
