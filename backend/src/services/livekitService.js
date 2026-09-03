import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { config } from '../config.js';

/**
 * Returns an instance of LiveKit's RoomServiceClient for server-side management
 */
export function getRoomServiceClient() {
  const httpUrl = config.livekit.url
    .replace(/^wss:\/\//, 'https://')
    .replace(/^ws:\/\//, 'http://');

  return new RoomServiceClient(
    httpUrl,
    config.livekit.apiKey,
    config.livekit.apiSecret
  );
}

/**
 * Creates a signed JWT token granting access to a LiveKit room
 */
export async function generateRoomToken({ roomName, participantIdentity, participantName, isHost = false }) {
  if (!roomName) throw new Error('Room name is required');
  if (!participantIdentity) throw new Error('Participant identity is required');

  const at = new AccessToken(
    config.livekit.apiKey,
    config.livekit.apiSecret,
    {
      identity: participantIdentity,
      name: participantName || participantIdentity,
      ttl: '24h', // Token valid for 24 hours to safely accommodate any machine clock skew
    }
  );

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    roomAdmin: Boolean(isHost),
  });

  const token = await at.toJwt();

  return {
    token,
    url: config.livekit.url,
    roomName,
    participantIdentity,
    participantName: participantName || participantIdentity,
    isHost: Boolean(isHost),
  };
}

/**
 * Lists active rooms from the LiveKit media server
 */
export async function listActiveRooms() {
  try {
    const roomClient = getRoomServiceClient();
    const rooms = await roomClient.listRooms();
    return rooms.map((r) => ({
      sid: r.sid,
      name: r.name,
      numParticipants: r.numParticipants,
      maxParticipants: r.maxParticipants,
      creationTime: r.creationTime,
    }));
  } catch (error) {
    console.error('Error fetching rooms from LiveKit:', error.message);
    // If LiveKit is unreachable (e.g. invalid cloud credentials), return empty list rather than crashing
    return [];
  }
}
