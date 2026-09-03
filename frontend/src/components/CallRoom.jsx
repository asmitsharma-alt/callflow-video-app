import React, { useState, useEffect } from 'react';
import { 
  LiveKitRoom, 
  useConnectionState, 
  RoomAudioRenderer, 
  useRoomContext 
} from '@livekit/components-react';
import { ConnectionState, RoomEvent, VideoPresets } from 'livekit-client';
import { ParticipantGrid } from './ParticipantGrid';
import { ControlBar } from './ControlBar';
import { ChatDrawer } from './ChatDrawer';
import { ParticipantList } from './ParticipantList';
import { DeviceSelector } from './DeviceSelector';
import { Copy, Check, Video, AlertCircle, Clock } from 'lucide-react';

function InCallLayout({ roomName, onLeave }) {
  const room = useRoomContext();
  const connectionState = useConnectionState();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  // Call duration counter
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopyInvite = () => {
    const url = `${window.location.origin}?room=${encodeURIComponent(roomName)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleToggleChat = () => {
    setIsChatOpen((prev) => {
      if (!prev) setUnreadCount(0); // Clear badge on open
      return !prev;
    });
    if (isParticipantsOpen) setIsParticipantsOpen(false);
  };

  const handleToggleParticipants = () => {
    setIsParticipantsOpen((prev) => !prev);
    if (isChatOpen) setIsChatOpen(false);
  };

  const isReconnecting = connectionState === ConnectionState.Reconnecting;

  return (
    <div className="relative w-screen h-screen bg-zinc-950 flex flex-col overflow-hidden select-none">
      {/* Auto-managed Audio Renderer for all remote participant tracks */}
      <RoomAudioRenderer />

      {/* Top Reconnecting Banner */}
      {isReconnecting && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-amber-500/90 text-black px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-lg backdrop-blur-md animate-pulse">
          <AlertCircle className="w-4 h-4" />
          <span>Network connection unstable. Reconnecting to call...</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="h-14 px-4 sm:px-6 border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md flex items-center justify-between z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Video className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-white">
              {roomName}
            </span>
            <button
              onClick={handleCopyInvite}
              className="text-xs text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 px-2 py-1 rounded-md flex items-center gap-1 transition-colors"
              title="Copy room invite link"
            >
              {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedLink ? 'Copied' : 'Invite'}</span>
            </button>
          </div>
        </div>

        {/* Call Duration Timer */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-800/40 px-3 py-1.5 rounded-full border border-zinc-700/40">
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          <span className="font-mono">{formatTime(secondsElapsed)}</span>
        </div>
      </header>

      {/* Main Call Body with Dynamic Grid & Slide-Over Drawers */}
      <main className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 h-full min-h-0 min-w-0 relative">
          <ParticipantGrid />

          {/* Floating Control Bar */}
          <ControlBar
            onToggleChat={handleToggleChat}
            onToggleParticipants={handleToggleParticipants}
            onOpenSettings={() => setIsSettingsOpen(true)}
            isChatOpen={isChatOpen}
            isParticipantsOpen={isParticipantsOpen}
            unreadCount={unreadCount}
            onLeave={onLeave}
          />
        </div>

        {/* Chat Drawer */}
        <ChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          onUnreadMessage={() => setUnreadCount((c) => c + 1)}
        />

        {/* Participant List Drawer */}
        <ParticipantList
          isOpen={isParticipantsOpen}
          onClose={() => setIsParticipantsOpen(false)}
        />
      </main>

      {/* In-Call Device Selector Modal */}
      <DeviceSelector
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

export function CallRoom({ 
  token, 
  serverUrl, 
  roomName, 
  initialVideo = true, 
  initialAudio = true, 
  onLeave,
  onError,
}) {
  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={true}
      video={initialVideo}
      audio={initialAudio}
      onDisconnected={onLeave}
      onError={(err) => {
        console.error('LiveKit connection error:', err);
        if (onError) onError(err);
      }}
      options={{
        publishDefaults: {
          simulcast: true,
          videoSimulcastLayers: [
            VideoPresets.h720,
            VideoPresets.h360,
            VideoPresets.h180,
          ],
          videoCodec: 'vp8',
          audioCaptureDefaults: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        },
        adaptiveStream: true,
        dynacast: true,
      }}
    >
      <InCallLayout roomName={roomName} onLeave={onLeave} />
    </LiveKitRoom>
  );
}
