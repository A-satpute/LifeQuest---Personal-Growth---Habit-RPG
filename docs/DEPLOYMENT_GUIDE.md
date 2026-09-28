# 🚀 LifeQuest — Production Deployment & Cloud Infrastructure Guide

This guide details the recommended production architecture, environment configuration, database provisioning, containerization, and deployment procedures for the LifeQuest platform.

---

## 🏛️ 1. Production Architecture Overview

LifeQuest is built as a cloud-native, decoupled 3-tier architecture:

```
    ┌───────────────────────────┐
    │     Static CDN Edge       │  Vercel / Netlify / Cloudflare Pages
    │   (React 19 + Vite SPA)   │  Custom Domain with SSL/TLS termination
    └─────────────┬─────────────┘
                  │ HTTPS (REST API)
                  ▼
    ┌───────────────────────────┐
    │     Node.js App Server    │  Render / Railway / AWS App Runner / Fly.io
    │     (Express.js API)      │  Dockerized container or Node runtime
    └─────────────┬─────────────┘
                  │ SSL Pooled Connection
                  ▼
    ┌───────────────────────────┐
    │    Managed PostgreSQL     │  Neon / Supabase / AWS RDS
    │   (Prisma ORM Client)     │  Multi-AZ, Daily Backups, PgBouncer pooling
    └───────────────────────────┘
```

---

## 🔑 2. Environment Variables Specification

Never commit real production credentials to Git. Use the hosting platform's secure environment variable management dashboard.

### Backend (`server/.env` / Cloud Environment Variables)

| Variable | Type | Production Example | Description |
|---|---|---|---|
| `PORT` | Number | `5000` | Port for the Express HTTP server |
| `NODE_ENV` | String | `production` | Enables optimized logging, caching, and security flags |
| `DATABASE_URL` | String | `postgresql://usr:pwd@db.host.com:5432/lifequest?sslmode=require` | Connection string for Managed PostgreSQL |
| `JWT_SECRET` | String | `c9f8a3e1b7d542...` (64+ char random string) | Cryptographic key used to sign and verify JWTs |
| `JWT_EXPIRES_IN` | String | `7d` | Token validity duration |
| `CLIENT_URL` | String | `https://lifequest.app` | Allowed CORS origin for browser requests |
| `GEMINI_API_KEY` | String | `AIzaSyD...` | Google Gemini API key for AI Goal Architect |
| `NOTIFICATION_SCHEDULER_ENABLED` | Boolean | `true` | Enables background notification check loop |

### Frontend (`client/.env` / Cloud Environment Variables)

| Variable | Type | Production Example | Description |
|---|---|---|---|
| `VITE_API_URL` | String | `https://api.lifequest.app/api` | Base URL pointing to the live backend API |

---

## 🗄️ 3. Database Provisioning (Managed PostgreSQL)

### Recommended Providers:
- **Neon Serverless Postgres** (neon.tech)
- **Supabase** (supabase.com)
- **AWS RDS PostgreSQL**

### Deployment Steps:
1. Create a new PostgreSQL instance (version 15+).
2. Obtain the secure connection string with SSL enabled (`sslmode=require`).
3. Set the `DATABASE_URL` in your server environment variables.
4. Run the production migration command from your local terminal or CI/CD pipeline:
   ```bash
   cd server
   npx prisma migrate deploy
   ```
5. *(Optional for demo/grading instances)* Seed initial demo data:
   ```bash
   npx prisma db seed
   ```

---

## ⚙️ 4. Backend Deployment (e.g. Render / Railway / Docker)

### Option A: Direct Node.js Platform (Render / Railway)
1. Link your GitHub repository to Render/Railway.
2. Select **Web Service** with the root directory set to `server`.
3. Configure build and start commands:
   - **Build Command:** `npm install && npm run build && npx prisma generate`
   - **Start Command:** `node dist/app.js`
4. Add the backend environment variables listed above.
5. Deploy and note your public API URL (e.g., `https://lifequest-api.onrender.com`).

### Option B: Docker Containerization
A production `Dockerfile` for the backend:
```dockerfile
# Multi-stage production build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 5000
CMD ["node", "dist/app.js"]
```

---

## 🌐 5. Frontend Deployment (e.g. Vercel / Netlify / Cloudflare Pages)

1. Link your GitHub repository to Vercel/Netlify.
2. Set the root directory to `client`.
3. Configure the build settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add the frontend environment variable:
   - `VITE_API_URL` = `https://your-backend-api-url.com/api`
5. Configure SPA routing rewrites:
   - **Vercel (`vercel.json`):**
     ```json
     {
       "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
     }
     ```
   - **Netlify (`_redirects`):**
     ```text
     /*    /index.html   200
     ```

---

## 🔒 6. Security & Production Checklist

- [ ] **HTTPS Enforced:** All communication over TLS 1.3.
- [ ] **Strict CORS:** `CLIENT_URL` explicitly set to the frontend domain; wildcard `*` disabled.
- [ ] **Secure JWT Secret:** Generated using a high-entropy cryptographically secure random generator:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- [ ] **API Key Protection:** `GEMINI_API_KEY` defined only in server-side environment variables.
- [ ] **Database Connection Pooling:** Enabled via PgBouncer or native Prisma connection limits (`?connection_limit=10`).
- [ ] **Rate Limiting:** Optional reverse-proxy rate limiting (e.g. Cloudflare DDoS & WAF protection).

---

## 🦸 7. Demo Account Configuration

For evaluators and academic grading:
- **Demo Email:** `hero@lifequest.com`
- **Demo Password:** `HeroPassword123!`
- **Seeding Mechanism:** Executed via `npm run prisma:seed` in the `server` directory.
- **Safety Guarantee:** In production environments, either omit running `prisma:seed` or change the demo password after initial setup.
