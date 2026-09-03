import React, { useState, useEffect } from 'react';
import { PreJoinPreview } from './components/PreJoinPreview';
import { CallRoom } from './components/CallRoom';
import { fetchRoomToken } from './services/api';
import { AlertTriangle, X } from 'lucide-react';

export default function App() {
  const [tokenData, setTokenData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [initialRoomName, setInitialRoomName] = useState('');
  const [initialMediaState, setInitialMediaState] = useState({ video: true, audio: true });

  // Read ?room= query param from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setInitialRoomName(roomParam);
    }
  }, []);

  const handleJoin = async ({ roomName, participantName, initialVideo, initialAudio }) => {
    setErrorMsg('');
    setInitialMediaState({ video: initialVideo, audio: initialAudio });

    try {
      const data = await fetchRoomToken({
        roomName,
        participantName,
        isHost: false,
      });

      setTokenData(data);
    } catch (err) {
      console.error('Failed to join room:', err);
      setErrorMsg(
        err.message || 'Unable to connect to video server. Please verify backend is running.'
      );
    }
  };

  const handleRoomError = (err) => {
    console.error('Call connection error:', err);
    setErrorMsg(
      err?.message?.includes('401') || err?.message?.includes('Unauthorized')
        ? 'LiveKit authentication failed (401). Please check your LIVEKIT_API_KEY and LIVEKIT_API_SECRET in backend/.env.'
        : `Connection failed: ${err?.message || 'Unable to connect to LiveKit server'}`
    );
    setTokenData(null);
  };

  const handleLeave = () => {
    setTokenData(null);
    const url = new URL(window.location.href);
    window.history.replaceState({}, '', url.pathname);
  };

  return (
    <div className="w-full h-full min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* Global Error Banner */}
      {errorMsg && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-lg w-full px-4">
          <div className="bg-red-950/90 border border-red-800/80 text-red-200 px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg('')}
              className="p-1 text-red-400 hover:text-red-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Screen Router */}
      {!tokenData ? (
        <PreJoinPreview 
          onJoin={handleJoin} 
          initialRoomName={initialRoomName} 
        />
      ) : (
        <CallRoom
          token={tokenData.token}
          serverUrl={tokenData.url}
          roomName={tokenData.roomName}
          initialVideo={initialMediaState.video}
          initialAudio={initialMediaState.audio}
          onLeave={handleLeave}
          onError={handleRoomError}
        />
      )}
    </div>
  );
}
