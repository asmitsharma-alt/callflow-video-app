# CallFlow: Web Video Calling App

A modern, reliable, browser-based video calling application supporting 1:1 and multi-party conferences (up to 12 participants), adaptive camera quality via simulcast, screen sharing with audio, in-call chat, and pre-join device preview.

Built with **React (Vite + Tailwind CSS)**, **Node.js Express token API**, and **LiveKit SFU**, ready for one-click deployment on **Render**.

---

## 🌟 Key Features

- **Pre-Call Lobby**: Interactive camera preview mirror, live microphone volume visualizer, audio & video device selection.
- **Adaptive Simulcast**: Publishes 3 distinct video layers (720p, 360p, 180p) and dynamically scales bitrate/resolution based on viewer bandwidth.
- **Smart Responsive Grid**: Auto-adjusts layout from 1 to 12 participants with active speaker glowing borders.
- **Screen Share with Audio**: Share window/tab/screen with system audio; transitions layout into a spotlight view with a participant strip.
- **In-Call Text Chat**: Zero-latency real-time text chat using LiveKit Data Channels (no extra WebSocket server needed).
- **Participant Drawer**: Inspect all connected users, audio/video status, and connection quality indicators.
- **In-Call Device Selector**: Switch mic, camera, or output speakers on the fly.
- **Auto-Reconnection**: Transparent ICE restart and reconnection handling if network drops.
- **Render Ready**: Complete `render.yaml` blueprint for automated deployment.

---

## 🏗️ Architecture

```
[Browser Client] <======== WebRTC (UDP/SRTP) ========> [LiveKit SFU (Cloud / VPS)]
       │                                                      ▲
       │ POST /api/token                                      │
       ▼                                                      │
[Express API on Render] ────────── Signs JWT ─────────────────┘
```

> [!IMPORTANT]
> **Hosting LiveKit on Render (UDP Caveat)**:
> Render Web Services route HTTP/TCP traffic via reverse-proxies and **do not open arbitrary inbound UDP ports**. WebRTC media streaming relies heavily on UDP for low latency. 
> 
> **Recommended Topology**:
> 1. Host the **Frontend** as a **Render Static Site** (Fast, global CDN, free SSL).
> 2. Host the **API Server** as a **Render Web Service** (Node/Express).
> 3. Use **LiveKit Cloud** (Generous free tier: 100 GB/month bandwidth, 50k participant-minutes, 100 concurrent participants, globally distributed edge SFU nodes).
> 4. *(Alternative)*: Self-host LiveKit on a VPS with direct UDP access (AWS EC2, Hetzner, Fly.io, DigitalOcean) using the provided `livekit/docker-compose.yml`.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v18 or higher (v20+ recommended)
- **LiveKit Cloud Account** (or local LiveKit server):
  1. Sign up for free at [cloud.livekit.io](https://cloud.livekit.io)
  2. Create a project and retrieve your **WebSocket URL** (`wss://...`), **API Key**, and **API Secret**.

### 2. Configure Backend
```bash
cd backend
cp .env.example .env
```
Edit `backend/.env` with your LiveKit credentials:
```env
PORT=5000
CORS_ORIGIN=http://localhost:5173
LIVEKIT_URL=wss://<your-project-id>.livekit.cloud
LIVEKIT_API_KEY=<your-api-key>
LIVEKIT_API_SECRET=<your-api-secret>
```

Start the backend:
```bash
npm install
npm run dev
```
The API server will run at `http://localhost:5000`. Test health at `http://localhost:5000/api/health`.

### 3. Configure Frontend
Open a new terminal:
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
The frontend will start at `http://localhost:5173`.

---

## 🌐 Deployment to Render

### Option A: Using Render Blueprint (`render.yaml`) - Recommended
1. Push this repository to GitHub or GitLab.
2. In the [Render Dashboard](https://dashboard.render.com), click **New** -> **Blueprint**.
3. Connect your repository. Render will detect `render.yaml` and configure:
   - `web-video-api`: Node Web Service (Express)
   - `web-video-client`: Static Site (React/Vite)
4. Under Environment Variables for `web-video-api`, enter your:
   - `LIVEKIT_URL` (e.g. `wss://your-project.livekit.cloud`)
   - `LIVEKIT_API_KEY`
   - `LIVEKIT_API_SECRET`
5. Click **Apply**.

### Option B: Manual Setup on Render
1. **API Service**:
   - Create a **Web Service** pointing to the `backend/` directory.
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add env vars: `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `CORS_ORIGIN`.
2. **Frontend Static Site**:
   - Create a **Static Site** pointing to `frontend/`.
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Add rewrite rule: Source `/*` -> Destination `/index.html`.
   - Add env var: `VITE_API_URL` = `https://<your-api-service>.onrender.com`.

---

## 🎹 Keyboard Shortcuts (In Call)

| Key | Action |
|---|---|
| `M` | Toggle Microphone Mute / Unmute |
| `V` | Toggle Camera On / Off |

---

## 📦 Project Structure

```
.
├── .agents/skills/livekit-webrtc-video/   # Antigravity domain skill
├── backend/                             # Express Token & Room API
│   ├── src/
│   │   ├── controllers/                 # Token & Room handlers
│   │   ├── routes/                      # API routing
│   │   ├── services/                    # LiveKit SDK integration
│   │   ├── config.js                    # Env config
│   │   └── server.js                    # Express app
│   └── package.json
├── frontend/                            # React + Vite Client
│   ├── src/
│   │   ├── components/                  # PreJoin, Grid, Tiles, ControlBar, Drawers
│   │   ├── hooks/                       # Audio meter hook
│   │   ├── services/                    # API client
│   │   ├── App.jsx                      # App router
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── livekit/                             # Docker Compose for self-hosted LiveKit
├── render.yaml                          # Render Blueprint
└── README.md
```
