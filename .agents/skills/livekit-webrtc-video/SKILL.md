---
name: livekit-webrtc-video
description: Best practices, architecture patterns, and deployment guidelines for building production WebRTC video calling applications using LiveKit SFU, React, Node.js Express, and Render.
---

# LiveKit WebRTC Video Calling Skill

This skill provides expert knowledge and patterns for developing, tuning, and deploying real-time WebRTC audio/video calling applications powered by the LiveKit SFU.

---

## 1. Core Architecture Overview

```
[WebRTC Client (Browser)] <==== RTP/SRTP UDP ====> [LiveKit SFU]
         |                                               ^
         | POST /api/token                               |
         v                                               |
[Node.js Token API] ------------ JWT Signing -----------+
```

- **LiveKit SFU (Selective Forwarding Unit)**: Routes WebRTC audio/video/data tracks between peers. No client uploads more than once per media track, even in 12+ participant calls.
- **Node.js Signaling / Token Service**: Issues short-lived JSON Web Tokens (JWT) embedded with `VideoGrant` claims that authorize room access, publishing, subscribing, and data messaging.
- **Client SDKs**:
  - `livekit-client`: Low-level core WebRTC state management, device discovery, reconnection, track subscription.
  - `@livekit/components-react`: High-level React hooks and prebuilt UI wrappers (`LiveKitRoom`, `useTracks`, `useParticipants`, `useConnectionState`).

---

## 2. Token Generation (Node.js + `livekit-server-sdk`)

When generating room tokens in Node.js:
```javascript
import { AccessToken } from 'livekit-server-sdk';

export function createToken({ roomName, participantIdentity, participantName, isHost = false }) {
  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: participantIdentity,
      name: participantName,
      ttl: '2h', // 2-hour token lifespan
    }
  );

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    roomAdmin: isHost,
  });

  return at.toJwt();
}
```

---

## 3. WebRTC Audio & Video Best Practices

### A. Echo Cancellation & Audio Processing
Always configure browser audio tracks with hardware or software echo cancellation and noise suppression:
```javascript
const audioCaptureOptions = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};
```

### B. Adaptive Simulcast
For rooms with 3+ participants, always enable **simulcast** on published video tracks:
- High (1080p / 720p @ 1.5 - 3 Mbps)
- Medium (480p / 360p @ 500 kbps)
- Low (180p / 240p @ 150 kbps)

In `@livekit/components-react`:
```jsx
<LiveKitRoom
  video={true}
  audio={true}
  options={{
    publishDefaults: {
      simulcast: true,
      videoSimulcastLayers: [
        VideoPresets.h720,
        VideoPresets.h360,
        VideoPresets.h180,
      ],
      videoCodec: 'vp8', // Most compatible baseline across all browsers
    },
    adaptiveStream: true, // Automatically pauses unsubscribed/off-screen video tracks
    dynacast: true,        // Publishers dynamically pause high resolution if no viewer needs it
  }}
>
```

### C. Screen Sharing with System Audio
When triggering screen share in browser clients, request system audio where supported:
```javascript
await room.localParticipant.setScreenShareEnabled(true, {
  audio: true,
  resolution: { width: 1920, height: 1080, frameRate: 30 },
});
```

---

## 4. UI Polish Principles for Video Apps (Emil Kowalski Philosophy)

1. **Floating Pill Control Bar**:
   - Keep control buttons grouped in an ergonomically accessible floating pill at the bottom center.
   - Use distinct background states (`bg-zinc-800` vs `bg-red-500/20` for muted, `bg-red-600` for hangup).
   - Instant response on press (`active:scale-95 transition-transform duration-100 ease-out`).
2. **Active Speaker Highlight**:
   - Highlight active speakers with a subtle ring or soft glow (`ring-2 ring-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.3)]`).
   - Do NOT abruptly swap video tile positions during brief utterances — keep participant positions stable in the grid, but highlight the speaker.
3. **Graceful Fallbacks**:
   - When a participant turns off their camera, smoothly transition to a clean monogram avatar circle with their initials and name tag.
4. **Lobby / Pre-Join Preview**:
   - Never throw users directly into a call without a device check.
   - Show an interactive camera mirror and real-time audio volume visualizer so users can verify their mic before speaking.

---

## 5. Render Deployment Architecture & The UDP Caveat

### Critical Constraint
- **Render Web Services**: Forward HTTP and TCP traffic on port 443/80 through a reverse proxy (Envoy). They **do not open inbound UDP ports**.
- **WebRTC Reality**: Audio/video media streams over UDP (RTP/SRTP). If a self-hosted LiveKit SFU runs in a Render Web Service container, clients cannot connect via UDP and will either fail or fall back to high-latency TCP-over-TLS.

### Recommended Production Topology on Render
1. **Frontend**: Render Static Site
   - Build: `npm run build`
   - Publish directory: `dist`
   - Zero cost, edge CDN, automated HTTPS.
2. **Token & Signaling API**: Render Web Service
   - Runtime: Node.js
   - Environment variables: `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`.
3. **LiveKit Media Server**:
   - **Option A (Recommended)**: **LiveKit Cloud**. Connect your backend and frontend to LiveKit Cloud (free tier: 100 GB/month, 100 concurrent participants, globally distributed SFU edge nodes).
   - **Option B**: Self-host LiveKit on a VPS with direct UDP port ranges (Fly.io with UDP allocation, Hetzner, AWS EC2, or DigitalOcean Droplet) using `docker-compose.yml`.
