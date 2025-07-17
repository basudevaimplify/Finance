# Finance

This repository contains a FastAPI backend and a React/Express frontend.

## Local setup

### Backend
1. Create a Python 3.11 virtual environment and activate it:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the API server:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend
1. Install Node dependencies:
   ```bash
   npm install
   ```
2. Run the development server which serves both the API and the client:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5000`.

# Finance1
