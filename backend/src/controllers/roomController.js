import { listActiveRooms, getRoomServiceClient } from '../services/livekitService.js';

export async function listRoomsHandler(req, res) {
  try {
    const rooms = await listActiveRooms();
    return res.status(200).json({ rooms });
  } catch (error) {
    console.error('Error listing rooms:', error);
    return res.status(500).json({ error: 'Failed to list rooms', details: error.message });
  }
}

export async function getRoomDetailsHandler(req, res) {
  try {
    const { roomName } = req.params;
    const roomClient = getRoomServiceClient();
    const participants = await roomClient.listParticipants(roomName);

    return res.status(200).json({
      roomName,
      participantCount: participants.length,
      participants: participants.map((p) => ({
        identity: p.identity,
        name: p.name,
        joinedAt: p.joinedAt,
        isPublisher: p.isPublisher,
      })),
    });
  } catch (error) {
    console.error('Error getting room details:', error.message);
    return res.status(404).json({ error: 'Room not found or LiveKit server offline' });
  }
}
