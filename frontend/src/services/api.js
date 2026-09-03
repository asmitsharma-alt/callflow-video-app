const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : '/api';

/**
 * Requests a LiveKit room access token from the backend
 */
export async function fetchRoomToken({ roomName, participantName, isHost = false }) {
  const response = await fetch(`${API_BASE}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      roomName,
      participantName,
      isHost,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to fetch token (${response.status})`);
  }

  return response.json();
}

/**
 * Fetches active rooms list
 */
export async function fetchActiveRooms() {
  try {
    const response = await fetch(`${API_BASE}/rooms`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.rooms || [];
  } catch (error) {
    console.error('Failed to fetch rooms:', error);
    return [];
  }
}
