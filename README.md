<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# GovAuto Agent

AI-powered browser automation agent for government services (passports, licenses, permits) with chat, voice, and real Playwright automation. API-first so the same backend can power the web app and a WhatsApp bot.

## Prerequisites

- Node.js 20+
- For real browser automation: the app runs Playwright in the backend (no extra install if using default Chromium)

## Run locally

### 1. Environment

Copy [.env.example](.env.example) to `.env` or `.env.local` and set:

- `GEMINI_API_KEY` – your Gemini API key (backend only)
- `GEMINI_MODEL` – e.g. `gemini-2.0-flash` (optional; has default)
- `PORT` – backend port (default `4000`)
- `ADMIN_SECRET` – secret for admin panel and template API
- `VITE_API_URL` – frontend base URL for the API (e.g. `http://localhost:4000`)

### 2. Backend

```bash
cd server
npm install
npm run dev
```

Server runs at `http://localhost:4000`. Endpoints: `GET /health`, `POST /api/v1/chat`, `POST /api/v1/confirm-data`, `GET /api/v1/automation/status/:sessionId`, `POST /api/v1/automation/input`, `GET/POST/PUT/DELETE /api/v1/templates` (admin), `POST /api/v1/admin/verify`, `POST /webhook/whatsapp`.

### 3. Frontend

From the repo root:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Ensure the backend is running so the chat uses the API.

### 4. Admin panel

Go to `http://localhost:3000/admin`, enter the `ADMIN_SECRET`, then manage automation templates (name, document type, URL, steps). Templates are used when the agent starts automation for a matching document type.

## Scripts (root)

- `npm run dev` – start Vite frontend
- `npm run dev:server` – start backend in watch mode
- `npm run server` – start backend (after `cd server && npm run build` if using compiled JS)

## WhatsApp

The backend exposes `POST /webhook/whatsapp`. Configure your WhatsApp provider (e.g. Twilio, Meta Cloud API) to send incoming messages here. The handler runs the same chat pipeline and logs the reply; wire your provider’s “send message” API to complete the loop.
