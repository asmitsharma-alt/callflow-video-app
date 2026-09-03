import React from 'react';
import { useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { VideoTile } from './VideoTile';

export function ParticipantGrid() {
  // Query both camera and screen share tracks for local and remote participants
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  // Check if any participant is sharing their screen
  const screenShareTrack = tracks.find((t) => t.source === Track.Source.ScreenShare);
  const cameraTracks = tracks.filter((t) => t.source === Track.Source.Camera);

  // If there is an active screen share, render Spotlight Layout
  if (screenShareTrack) {
    return (
      <div className="w-full h-full p-3 flex flex-col md:flex-row gap-3 overflow-hidden">
        {/* Main Screen Share Area */}
        <div className="flex-1 h-full min-h-0 min-w-0">
          <VideoTile
            trackReference={screenShareTrack}
            isLocal={screenShareTrack.participant.isLocal}
            isScreenShare={true}
          />
        </div>

        {/* Side Strip of Participant Cameras */}
        <div className="w-full md:w-64 h-36 md:h-full flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto pr-1">
          {cameraTracks.map((track) => (
            <div key={track.participant.identity} className="h-full md:h-44 flex-shrink-0 aspect-video">
              <VideoTile
                trackReference={track}
                isLocal={track.participant.isLocal}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Normal Camera Grid Layout (Auto-responsive up to 12 participants)
  const count = cameraTracks.length;

  const getGridClasses = () => {
    if (count <= 1) return 'grid-cols-1 max-w-4xl max-h-[85vh]';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2 max-w-5xl max-h-[85vh]';
    if (count <= 4) return 'grid-cols-2 max-w-5xl max-h-[85vh]';
    if (count <= 6) return 'grid-cols-2 md:grid-cols-3 max-w-6xl max-h-[90vh]';
    if (count <= 9) return 'grid-cols-3 max-w-7xl max-h-[90vh]';
    return 'grid-cols-3 md:grid-cols-4 max-w-[95vw] max-h-[90vh]'; // 10-12
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      <div className={`grid gap-3 w-full h-full items-center justify-center ${getGridClasses()}`}>
        {cameraTracks.map((track) => (
          <div key={track.participant.identity} className="w-full h-full min-h-0 min-w-0 aspect-video flex items-center justify-center">
            <VideoTile
              trackReference={track}
              isLocal={track.participant.isLocal}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
