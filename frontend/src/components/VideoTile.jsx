import React from 'react';
import { 
  VideoTrack, 
  AudioTrack, 
  useParticipantInfo, 
  ConnectionQualityIndicator 
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { MicOff, Monitor, Wifi } from 'lucide-react';

export function VideoTile({ trackReference, isLocal = false, isScreenShare = false }) {
  const { identity, name, isSpeaking, metadata } = useParticipantInfo({
    participant: trackReference.participant,
  });

  const displayName = name || identity || (isLocal ? 'You' : 'Participant');
  const hasVideo = trackReference.publication && !trackReference.publication.isMuted;
  const isAudioMuted = !trackReference.participant.isMicrophoneEnabled;

  return (
    <div
      className={`relative w-full h-full rounded-xl overflow-hidden bg-zinc-900 border transition-all duration-200 flex items-center justify-center group select-none ${
        isSpeaking 
          ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.35)]' 
          : 'border-zinc-800/80 hover:border-zinc-700'
      }`}
    >
      {/* Video Stream or Avatar Fallback */}
      {hasVideo ? (
        <div className="w-full h-full flex items-center justify-center bg-black">
          <VideoTrack
            trackRef={trackReference}
            className={`w-full h-full object-contain ${
              isLocal && !isScreenShare ? 'transform -scale-x-100' : ''
            }`}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-zinc-400 space-y-3">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/10 border border-white/10">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-zinc-300">{displayName}</span>
        </div>
      )}

      {/* Render Audio Track if remote */}
      {!isLocal && trackReference.source === Track.Source.Microphone && (
        <AudioTrack trackRef={trackReference} />
      )}

      {/* Screen Share Badge */}
      {isScreenShare && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-blue-600/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-medium text-white shadow-md">
          <Monitor className="w-3.5 h-3.5" />
          <span>Screen Share</span>
        </div>
      )}

      {/* Bottom Info Bar: Name, Mic Status, Connection Quality */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-black/65 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-medium text-white border border-white/10 max-w-[80%] truncate">
          <span className="truncate">{displayName} {isLocal && '(You)'}</span>
          {isAudioMuted && (
            <MicOff className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          )}
        </div>

        <div className="bg-black/65 backdrop-blur-md p-1.5 rounded-lg border border-white/10 flex items-center justify-center">
          <ConnectionQualityIndicator participant={trackReference.participant} />
        </div>
      </div>
    </div>
  );
}
