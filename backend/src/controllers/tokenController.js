import { generateRoomToken } from '../services/livekitService.js';

export async function createTokenHandler(req, res) {
  try {
    const { roomName, participantName, isHost } = req.body;

    if (!roomName || typeof roomName !== 'string' || !roomName.trim()) {
      return res.status(400).json({ error: 'Room name is required and must be a non-empty string' });
    }

    if (!participantName || typeof participantName !== 'string' || !participantName.trim()) {
      return res.status(400).json({ error: 'Participant name is required' });
    }

    // Clean and normalize strings
    const cleanRoomName = roomName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const cleanParticipantName = participantName.trim();
    const participantIdentity = `user_${Math.random().toString(36).substring(2, 8)}_${Date.now()}`;

    const tokenData = await generateRoomToken({
      roomName: cleanRoomName,
      participantIdentity,
      participantName: cleanParticipantName,
      isHost: Boolean(isHost),
    });

    return res.status(200).json(tokenData);
  } catch (error) {
    console.error('Error generating token:', error);
    return res.status(500).json({
      error: 'Failed to generate room token',
      details: error.message,
    });
  }
}
