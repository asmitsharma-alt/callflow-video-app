import React, { useState, useEffect } from 'react';
import { useLocalParticipant, useRoomContext, useParticipants } from '@livekit/components-react';
import { 
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, 
  Settings2, MessageSquare, Users, PhoneOff 
} from 'lucide-react';

export function ControlBar({
  onToggleChat,
  onToggleParticipants,
  onOpenSettings,
  isChatOpen,
  isParticipantsOpen,
  unreadCount = 0,
  onLeave,
}) {
  const room = useRoomContext();
  const { isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant();
  const participants = useParticipants();

  // Keyboard shortcut listener (M for mic, V for camera)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is currently typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        toggleMic();
      } else if (e.key === 'v' || e.key === 'V') {
        toggleCamera();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMicrophoneEnabled, isCameraEnabled, room]);

  const toggleMic = async () => {
    if (!room?.localParticipant) return;
    try {
      await room.localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch (err) {
      console.error('Failed to toggle mic:', err);
    }
  };

  const toggleCamera = async () => {
    if (!room?.localParticipant) return;
    try {
      await room.localParticipant.setCameraEnabled(!isCameraEnabled);
    } catch (err) {
      console.error('Failed to toggle camera:', err);
    }
  };

  const toggleScreenShare = async () => {
    if (!room?.localParticipant) return;
    try {
      await room.localParticipant.setScreenShareEnabled(!isScreenShareEnabled, {
        audio: true,
        resolution: { width: 1920, height: 1080, frameRate: 30 },
      });
    } catch (err) {
      console.error('Failed to toggle screen share:', err);
    }
  };

  return (
    <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 z-30 flex items-center gap-2 sm:gap-3 bg-zinc-900/90 backdrop-blur-xl px-4 py-2.5 rounded-full border border-white/10 shadow-2xl">
      {/* Microphone Toggle */}
      <button
        type="button"
        onClick={toggleMic}
        className={`relative p-3 rounded-full transition-all duration-150 active:scale-95 flex items-center justify-center ${
          isMicrophoneEnabled
            ? 'bg-zinc-800 hover:bg-zinc-700 text-white'
            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
        }`}
        title={isMicrophoneEnabled ? 'Mute Microphone (M)' : 'Unmute Microphone (M)'}
      >
        {isMicrophoneEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
      </button>

      {/* Camera Toggle */}
      <button
        type="button"
        onClick={toggleCamera}
        className={`relative p-3 rounded-full transition-all duration-150 active:scale-95 flex items-center justify-center ${
          isCameraEnabled
            ? 'bg-zinc-800 hover:bg-zinc-700 text-white'
            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
        }`}
        title={isCameraEnabled ? 'Turn Off Camera (V)' : 'Turn On Camera (V)'}
      >
        {isCameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
      </button>

      {/* Screen Share Toggle */}
      <button
        type="button"
        onClick={toggleScreenShare}
        className={`relative p-3 rounded-full transition-all duration-150 active:scale-95 flex items-center justify-center ${
          isScreenShareEnabled
            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30'
            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
        }`}
        title={isScreenShareEnabled ? 'Stop Screen Share' : 'Share Screen with Audio'}
      >
        {isScreenShareEnabled ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
      </button>

      <div className="h-6 w-px bg-zinc-700/80 mx-1 hidden sm:block" />

      {/* Chat Drawer Toggle */}
      <button
        type="button"
        onClick={onToggleChat}
        className={`relative p-3 rounded-full transition-all duration-150 active:scale-95 flex items-center justify-center ${
          isChatOpen
            ? 'bg-blue-600 text-white'
            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
        }`}
        title="Chat"
      >
        <MessageSquare className="w-5 h-5" />
        {unreadCount > 0 && !isChatOpen && (
          <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Participants Drawer Toggle */}
      <button
        type="button"
        onClick={onToggleParticipants}
        className={`relative p-3 rounded-full transition-all duration-150 active:scale-95 flex items-center justify-center ${
          isParticipantsOpen
            ? 'bg-blue-600 text-white'
            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
        }`}
        title="Participants"
      >
        <Users className="w-5 h-5" />
        <span className="ml-1 text-xs font-semibold text-zinc-300">
          {participants.length}
        </span>
      </button>

      {/* Settings Modal Toggle */}
      <button
        type="button"
        onClick={onOpenSettings}
        className="p-3 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all duration-150 active:scale-95 flex items-center justify-center"
        title="Device Settings"
      >
        <Settings2 className="w-5 h-5" />
      </button>

      <div className="h-6 w-px bg-zinc-700/80 mx-1" />

      {/* Leave Call Button */}
      <button
        type="button"
        onClick={onLeave}
        className="px-4 py-3 rounded-full bg-red-600 hover:bg-red-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-lg shadow-red-600/30 transition-all duration-150 active:scale-95"
        title="Leave Call"
      >
        <PhoneOff className="w-4 h-4" />
        <span className="hidden sm:inline">Leave</span>
      </button>
    </div>
  );
}
