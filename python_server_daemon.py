#!/usr/bin/env python3
"""
Simple daemon script to start the Python FastAPI server
"""
import os
import signal
import sys
import time
from pathlib import Path

# Add the current directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

def start_server():
    """Start the FastAPI server"""
    try:
        import uvicorn
        print("Starting FastAPI server on port 8000...")
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=False,
            log_level="info"
        )
    except Exception as e:
        print(f"Error starting server: {e}")
        sys.exit(1)

def handle_signal(signum, frame):
    """Handle shutdown signals"""
    print("\nShutting down server...")
    sys.exit(0)

if __name__ == "__main__":
    # Handle shutdown signals
    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)
    
    # Start the server
    start_server()