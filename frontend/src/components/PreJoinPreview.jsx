import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, CameraOff, Mic, MicOff, Settings2, Video, 
  Sparkles, Copy, Check, ArrowRight, ShieldCheck 
} from 'lucide-react';
import { useAudioMeter } from '../hooks/useAudioMeter';

export function PreJoinPreview({ onJoin, initialRoomName = '' }) {
  const [roomName, setRoomName] = useState(initialRoomName || 'team-sync');
  const [participantName, setParticipantName] = useState('');
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Device lists
  const [videoDevices, setVideoDevices] = useState([]);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedVideoId, setSelectedVideoId] = useState('');
  const [selectedAudioId, setSelectedAudioId] = useState('');

  // MediaStream for preview
  const [mediaStream, setMediaStream] = useState(null);
  const videoRef = useRef(null);
  const audioTrack = mediaStream ? mediaStream.getAudioTracks()[0] : null;
  const audioLevel = useAudioMeter(audioEnabled ? audioTrack : null);

  // Initialize and enumerate devices
  useEffect(() => {
    let activeStream = null;

    async function initDevices() {
      if (!navigator?.mediaDevices?.getUserMedia) {
        console.warn('getUserMedia is not supported on this browser context');
        return;
      }

      try {
        let stream = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: { echoCancellation: true, noiseSuppression: true },
          });
        } catch (mediaErr) {
          console.warn('Combined media access failed, trying individual audio/video...', mediaErr);
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setVideoEnabled(false);
          } catch (audioErr) {
            try {
              stream = await navigator.mediaDevices.getUserMedia({ video: true });
              setAudioEnabled(false);
            } catch (vidErr) {
              console.warn('No media devices available or permissions denied');
            }
          }
        }

        if (stream) {
          activeStream = stream;
          setMediaStream(stream);
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        const vDevs = devices.filter((d) => d.kind === 'videoinput');
        const aDevs = devices.filter((d) => d.kind === 'audioinput');

        setVideoDevices(vDevs);
        setAudioDevices(aDevs);

        if (vDevs.length > 0) setSelectedVideoId(vDevs[0].deviceId);
        if (aDevs.length > 0) setSelectedAudioId(aDevs[0].deviceId);
      } catch (err) {
        console.warn('Initial media access error:', err);
      }
    }

    initDevices();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Bind media stream to preview video element
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  // Handle device change or track toggle
  useEffect(() => {
    if (!mediaStream) return;

    mediaStream.getVideoTracks().forEach((t) => {
      t.enabled = videoEnabled;
    });
    mediaStream.getAudioTracks().forEach((t) => {
      t.enabled = audioEnabled;
    });
  }, [videoEnabled, audioEnabled, mediaStream]);

  // Switch camera device
  const handleVideoDeviceChange = async (deviceId) => {
    setSelectedVideoId(deviceId);
    if (!mediaStream) return;

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: selectedAudioId ? { deviceId: { exact: selectedAudioId } } : true,
      });

      mediaStream.getTracks().forEach((t) => t.stop());
      setMediaStream(newStream);
    } catch (err) {
      console.error('Error switching camera:', err);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}?room=${encodeURIComponent(roomName)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roomName.trim() || !participantName.trim()) return;

    // Release preview stream before handing over to LiveKit SDK
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
    }

    setIsLoading(true);
    try {
      await onJoin({
        roomName: roomName.trim(),
        participantName: participantName.trim(),
        initialVideo: videoEnabled,
        initialAudio: audioEnabled,
        selectedVideoId,
        selectedAudioId,
      });
    } catch (err) {
      console.warn('onJoin failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              CallFlow
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                LiveKit SFU
              </span>
            </h1>
            <p className="text-xs text-zinc-400">High-definition adaptive video calls</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900/80 border border-zinc-800 px-3 py-1.5 rounded-full">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>SRTP Encrypted</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Video Preview Mirror */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="relative aspect-video w-full rounded-2xl bg-zinc-900 border border-zinc-800/80 overflow-hidden shadow-2xl flex items-center justify-center">
            {videoEnabled && mediaStream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-zinc-500 space-y-2">
                <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-semibold text-lg">
                  {participantName ? participantName.slice(0, 2).toUpperCase() : <CameraOff className="w-7 h-7" />}
                </div>
                <p className="text-xs font-medium">Camera is turned off</p>
              </div>
            )}

            {/* Mic Level Bar on Preview */}
            <div className="absolute top-4 left-4 flex items-center space-x-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs">
              {audioEnabled ? (
                <>
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  <div className="w-16 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-75 ease-out rounded-full"
                      style={{ width: `${Math.min(100, audioLevel * 1.5)}%` }}
                    />
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-1 text-red-400">
                  <MicOff className="w-3.5 h-3.5" />
                  <span>Muted</span>
                </div>
              )}
            </div>

            {/* In-Preview Quick Toggles (Emil Kowalski style floating pill) */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-zinc-900/90 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg">
              <button
                type="button"
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`p-2.5 rounded-full transition-all duration-150 active:scale-95 ${
                  audioEnabled 
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-white' 
                    : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                }`}
                title={audioEnabled ? 'Mute Mic' : 'Unmute Mic'}
              >
                {audioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setVideoEnabled(!videoEnabled)}
                className={`p-2.5 rounded-full transition-all duration-150 active:scale-95 ${
                  videoEnabled 
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-white' 
                    : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                }`}
                title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
              >
                {videoEnabled ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2.5 rounded-full transition-all duration-150 active:scale-95 ${
                  showSettings ? 'bg-blue-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                }`}
                title="Device Settings"
              >
                <Settings2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Collapsible Device Selectors */}
          {showSettings && (
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3 animate-in fade-in duration-200">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Audio & Video Devices</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Camera</label>
                  <select
                    value={selectedVideoId}
                    onChange={(e) => handleVideoDeviceChange(e.target.value)}
                    className="w-full text-xs bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500"
                  >
                    {videoDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Microphone</label>
                  <select
                    value={selectedAudioId}
                    onChange={(e) => setSelectedAudioId(e.target.value)}
                    className="w-full text-xs bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-blue-500"
                  >
                    {audioDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Join / Room Configuration Form */}
        <div className="lg:col-span-5">
          <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800/90 shadow-xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Join Meeting</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Enter your name and room ID to start or join a conference.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Your Display Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asmit Kumar"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700/80 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Room Name
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                  >
                    {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedLink ? 'Copied Link' : 'Copy Invite'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. daily-standup"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700/80 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || !roomName.trim() || !participantName.trim()}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm text-white shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-150"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Enter Call</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="pt-4 border-t border-zinc-800/80">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Simulcast auto-adapts to your connection</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
