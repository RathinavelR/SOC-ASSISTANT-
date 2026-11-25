# Production Deployment Guide

This guide outlines deployment options for containerized or standalone cloud environments.

---

## 1. Quick Docker Compose (Recommended)

1. Clone the repository and navigate to root:
   ```bash
   cd ai-cybersecurity-soc-assistant
   ```

2. Copy and customize the environment configurations:
   ```bash
   cp backend/.env.example backend/.env
   cp ai-service/.env.example ai-service/.env
   cp frontend/.env.example frontend/.env
   ```

3. Launch all microservices:
   ```bash
   docker-compose up -d --build
   ```

4. Seed default admin and analyst users:
   ```bash
   docker-compose exec backend npm run seed
   ```

5. Access the applications:
   - **Frontend SOC Dashboard**: `http://localhost:80` (or `http://localhost:5173` in local dev)
   - **Backend API**: `http://localhost:5000`
   - **API Docs (Swagger)**: `http://localhost:5000/api/docs`
   - **AI ML Microservice**: `http://localhost:8000`

---

## 2. Deploy Frontend to Vercel

1. Push code to GitHub.
2. In Vercel, set root directory to `frontend`.
3. Set environment variable `VITE_API_URL` to your production backend URL (e.g. `https://soc-api.yourcompany.com/api`).
4. Set build command `npm run build` and output directory `dist`.

---

## 3. Deploy Backend to Render / Railway

1. In Render/Railway, create a Web Service linked to the `backend` folder.
2. Build command: `npm install`
3. Start command: `npm start`
4. Set Environment Variables:
   - `MONGODB_URI` (e.g., MongoDB Atlas connection string)
   - `JWT_SECRET`
   - `CLIENT_URL` (Your Vercel frontend URL)
   - `WAZUH_API_URL`
   - `WAZUH_API_USERNAME`
   - `WAZUH_API_PASSWORD`
   - `AI_SERVICE_URL`

---

## 4. Deploy AI Service to Render / Fly.io / AWS ECS

1. Deploy `ai-service` as a Python/Docker web service.
2. Start command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
3. Set `OPENAI_API_KEY` (Optional for LLM reasoning).
