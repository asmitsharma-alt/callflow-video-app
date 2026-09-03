import React from 'react';
import { useParticipants, ConnectionQualityIndicator } from '@livekit/components-react';
import { Users, X, Mic, MicOff, Video, VideoOff, Crown } from 'lucide-react';

export function ParticipantList({ isOpen, onClose }) {
  const participants = useParticipants();

  if (!isOpen) return null;

  return (
    <aside className="fixed sm:relative right-0 top-0 bottom-0 z-40 w-full sm:w-80 md:w-96 bg-zinc-900 border-l border-zinc-800 flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          <h2 className="text-sm font-semibold text-white">
            Participants ({participants.length})
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {participants.map((p) => {
          const isMicOn = p.isMicrophoneEnabled;
          const isCamOn = p.isCameraEnabled;
          const displayName = p.name || p.identity || 'Participant';

          return (
            <div
              key={p.identity}
              className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700/80 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-300 flex-shrink-0">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-zinc-200 truncate">
                      {displayName}
                    </span>
                    {p.isLocal && (
                      <span className="text-[10px] text-blue-400 font-medium bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    {p.isSpeaking ? 'Speaking...' : 'Listening'}
                  </div>
                </div>
              </div>

              {/* Status Icons */}
              <div className="flex items-center gap-2 text-zinc-400">
                <ConnectionQualityIndicator participant={p} />
                <div className="p-1">
                  {isMicOn ? (
                    <Mic className="w-3.5 h-3.5 text-zinc-300" />
                  ) : (
                    <MicOff className="w-3.5 h-3.5 text-red-400" />
                  )}
                </div>
                <div className="p-1">
                  {isCamOn ? (
                    <Video className="w-3.5 h-3.5 text-zinc-300" />
                  ) : (
                    <VideoOff className="w-3.5 h-3.5 text-red-400" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
