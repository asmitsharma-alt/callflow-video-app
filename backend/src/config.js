import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  externalUrl: process.env.RENDER_EXTERNAL_URL || process.env.SERVER_URL || '',
  corsOrigin: process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) 
    : ['http://localhost:5173', 'http://localhost:3000'],
  livekit: {
    url: process.env.LIVEKIT_URL || 'wss://demo.livekit.cloud',
    apiKey: process.env.LIVEKIT_API_KEY || 'devkey',
    apiSecret: process.env.LIVEKIT_API_SECRET || 'secret',
  },
};

if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
  console.warn('⚠️ Warning: LIVEKIT_API_KEY or LIVEKIT_API_SECRET not set in environment. Using fallback credentials.');
}
