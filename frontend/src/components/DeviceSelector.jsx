import React, { useState, useEffect } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { Camera, Mic, Volume2, X } from 'lucide-react';

export function DeviceSelector({ isOpen, onClose }) {
  const room = useRoomContext();

  const [videoDevices, setVideoDevices] = useState([]);
  const [audioInputDevices, setAudioInputDevices] = useState([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState([]);

  const [selectedVideoId, setSelectedVideoId] = useState('');
  const [selectedAudioInputId, setSelectedAudioInputId] = useState('');
  const [selectedAudioOutputId, setSelectedAudioOutputId] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    async function loadDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setVideoDevices(devices.filter((d) => d.kind === 'videoinput'));
        setAudioInputDevices(devices.filter((d) => d.kind === 'audioinput'));
        setAudioOutputDevices(devices.filter((d) => d.kind === 'audiooutput'));

        if (room) {
          if (room.getActiveDevice) {
            setSelectedVideoId(room.getActiveDevice('videoinput') || '');
            setSelectedAudioInputId(room.getActiveDevice('audioinput') || '');
            setSelectedAudioOutputId(room.getActiveDevice('audiooutput') || '');
          }
        }
      } catch (err) {
        console.error('Failed to enumerate devices:', err);
      }
    }

    loadDevices();
  }, [isOpen, room]);

  const handleVideoChange = async (deviceId) => {
    setSelectedVideoId(deviceId);
    if (room && room.switchActiveDevice) {
      await room.switchActiveDevice('videoinput', deviceId);
    }
  };

  const handleAudioInputChange = async (deviceId) => {
    setSelectedAudioInputId(deviceId);
    if (room && room.switchActiveDevice) {
      await room.switchActiveDevice('audioinput', deviceId);
    }
  };

  const handleAudioOutputChange = async (deviceId) => {
    setSelectedAudioOutputId(deviceId);
    if (room && room.switchActiveDevice) {
      await room.switchActiveDevice('audiooutput', deviceId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h2 className="text-base font-semibold text-white">Device Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Camera Selection */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300 mb-1.5">
              <Camera className="w-4 h-4 text-blue-400" />
              <span>Camera</span>
            </label>
            <select
              value={selectedVideoId}
              onChange={(e) => handleVideoChange(e.target.value)}
              className="w-full text-xs bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-zinc-200 focus:outline-none focus:border-blue-500"
            >
              {videoDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                </option>
              ))}
            </select>
          </div>

          {/* Microphone Selection */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300 mb-1.5">
              <Mic className="w-4 h-4 text-emerald-400" />
              <span>Microphone</span>
            </label>
            <select
              value={selectedAudioInputId}
              onChange={(e) => handleAudioInputChange(e.target.value)}
              className="w-full text-xs bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-zinc-200 focus:outline-none focus:border-blue-500"
            >
              {audioInputDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                </option>
              ))}
            </select>
          </div>

          {/* Speaker Selection (if supported by browser) */}
          {audioOutputDevices.length > 0 && (
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300 mb-1.5">
                <Volume2 className="w-4 h-4 text-purple-400" />
                <span>Audio Output (Speakers)</span>
              </label>
              <select
                value={selectedAudioOutputId}
                onChange={(e) => handleAudioOutputChange(e.target.value)}
                className="w-full text-xs bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-zinc-200 focus:outline-none focus:border-blue-500"
              >
                {audioOutputDevices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Speaker ${d.deviceId.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm font-medium text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
