# PRD: Web Video Calling App

**Owner:** Asmit | **Status:** Draft | **Target platform:** Web (deployed on Render)

---

## 1. Overview
A browser-based video calling app supporting 1:1 and group calls, screen sharing, and adaptive camera quality, built on an SFU (LiveKit) architecture and deployed on Render.

## 2. Goals
- Reliable multi-party video calls (target: up to 12 participants per room at launch)
- Best-achievable camera quality via adaptive simulcast (auto bitrate/resolution based on viewer bandwidth)
- Screen sharing with audio
- Deployable end-to-end on Render (or Render + LiveKit Cloud hybrid)
- Low time-to-first-frame / low join latency (<2s)

## 3. Non-Goals (v1)
- Native mobile apps (web-responsive only)
- End-to-end encryption (SFU model uses SRTP hop-by-hop, not E2E)
- Recording/transcription (defer to v2)
- Virtual backgrounds / AI filters (defer to v2)

## 4. Target Users
- Small teams / businesses needing embeddable video calling (pharmacy consults, gym coaching sessions, client meetings)
- Use case is functional, not consumer-social — prioritize reliability over flashy UI

## 5. Core Features (Must-Have)

| Feature | Detail |
|---|---|
| Room creation | Unique room ID/link, shareable |
| Join flow | Camera/mic preview before joining, device picker |
| Video grid | Dynamic grid layout, active speaker highlight |
| Audio | Mute/unmute, echo cancellation, noise suppression |
| Camera | Toggle on/off, adaptive resolution (simulcast) |
| Screen share | Share full screen/tab/window, with system audio where supported |
| Chat | In-call text chat via data channel |
| Participant list | Names, mute status, host controls |
| Reconnection | Auto-reconnect on network drop |
| Auth | Basic token-based room access (JWT), no public open rooms |

## 6. Nice-to-Have (v2)
- Recording (LiveKit Egress)
- Virtual backgrounds/blur
- Waiting room / host approval
- Breakout rooms
- Live captions (Whisper/STT integration)

## 7. Architecture

```
[Browser Client] --WebRTC--> [LiveKit SFU] <--WebRTC-- [Browser Client]
       |                          |
       |--HTTPS (join/token)------|
       v
[Node/Express API on Render] --issues JWT-- [LiveKit Server]
       |
[Postgres/Redis - room state, users] (Render managed DB)
```

- **Media server:** LiveKit (self-hosted via Docker on Render, or LiveKit Cloud managed)
- **Signaling/API:** Node.js + Express — room creation, JWT token issuance, participant metadata
- **Frontend:** React + `@livekit/components-react` (prebuilt UI components) + `livekit-client` SDK
- **Database:** Postgres (room/user records) — Render managed Postgres
- **TURN/STUN:** LiveKit built-in TURN, or Twilio TURN as fallback for restrictive NATs

## 8. Tech Stack Decision

| Layer | Choice | Reason |
|---|---|---|
| Media SFU | LiveKit | Best OSS SFU, simulcast, screen share native |
| Frontend | React + Vite | Fast dev, LiveKit React components available |
| Backend | Node.js + Express | Simple token/auth service |
| Hosting | Render (Docker services) | User requirement |
| DB | Render Postgres | Managed, low-ops |
| Media hosting alt | LiveKit Cloud | If self-hosted UDP on Render proves unreliable |

## 9. Deployment Plan (Render-specific)

1. **Frontend**: Render Static Site (React build)
2. **API server**: Render Web Service (Node/Express, HTTPS)
3. **LiveKit server**: Render Web Service (Docker) — **risk: verify UDP port support on Render before committing**; fallback to LiveKit Cloud if UDP is unreliable/unsupported
4. **Database**: Render Managed Postgres
5. Env vars: `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL`, `DATABASE_URL`

## 10. Non-Functional Requirements
- **Latency:** <150ms media latency target (regional Render deployment close to users)
- **Quality:** Adaptive simulcast — 3 layers (low/medium/high) per publisher
- **Scalability:** Horizontal LiveKit node scaling if >50 concurrent rooms (post-v1 concern)
- **Security:** JWT-based room tokens, HTTPS everywhere, no anonymous room creation
- **Browser support:** Chrome, Edge, Firefox, Safari (WebRTC baseline)

## 11. Success Metrics
- Call join success rate >98%
- Median join latency <2s
- Screen share failure rate <2%
- Video freeze/drop rate <5% of session time on average connection

## 12. Risks
| Risk | Mitigation |
|---|---|
| Render UDP/port limitations for self-hosted LiveKit | Fallback to LiveKit Cloud managed SFU |
| NAT traversal failures on strict corporate networks | TURN server fallback (Twilio or LiveKit TURN) |
| Cost scaling with concurrent rooms | Start with LiveKit Cloud free/starter tier, monitor usage |

## 13. Milestones
1. **Week 1:** Token server + basic 1:1 call working (LiveKit + React)
2. **Week 2:** Group call grid, mute/camera controls, chat
3. **Week 3:** Screen share, reconnection handling, adaptive quality tuning
4. **Week 4:** Render deployment, TURN fallback testing, polish + launch
