#!/bin/bash
# Start the Python FastAPI server

echo "Starting Python FastAPI server on port 8000..."
cd "$(dirname "$0")"

# Kill any existing server on port 8000
pkill -f "uvicorn.*8000" || true

# Start the server
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload