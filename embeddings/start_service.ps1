# Start Embeddings Service
Write-Host "Starting DocMind AI Embeddings Service..." -ForegroundColor Green

# Activate virtual environment and start server
& "$PSScriptRoot\venv\Scripts\Activate.ps1"
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
