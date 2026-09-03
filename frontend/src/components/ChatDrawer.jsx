import React, { useState, useEffect, useRef } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import { Send, X, MessageSquare } from 'lucide-react';

export function ChatDrawer({ isOpen, onClose, onUnreadMessage }) {
  const room = useRoomContext();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Listen for incoming Data Channel messages
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload, participant) => {
      try {
        const text = new TextDecoder().decode(payload);
        const data = JSON.parse(text);

        if (data.type === 'chat') {
          const newMsg = {
            id: `${Date.now()}_${Math.random()}`,
            sender: participant?.name || participant?.identity || 'Anonymous',
            text: data.text,
            time: new Date(data.timestamp || Date.now()).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            isLocal: participant?.isLocal || false,
          };

          setMessages((prev) => [...prev, newMsg]);

          if (!isOpen && onUnreadMessage) {
            onUnreadMessage();
          }
        }
      } catch (err) {
        console.warn('Failed to parse received data channel message:', err);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, isOpen, onUnreadMessage]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !room) return;

    const messageContent = inputText.trim();
    const payloadData = {
      type: 'chat',
      text: messageContent,
      timestamp: Date.now(),
    };

    try {
      const payloadBytes = new TextEncoder().encode(JSON.stringify(payloadData));
      // Broadcast reliable message to all participants
      await room.localParticipant.publishData(payloadBytes, { reliable: true });

      // Add to local state
      const localMsg = {
        id: `${Date.now()}_local`,
        sender: room.localParticipant.name || 'You',
        text: messageContent,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isLocal: true,
      };
      setMessages((prev) => [...prev, localMsg]);
      setInputText('');
    } catch (err) {
      console.error('Failed to send chat message:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <aside className="fixed sm:relative right-0 top-0 bottom-0 z-40 w-full sm:w-80 md:w-96 bg-zinc-900 border-l border-zinc-800 flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          <h2 className="text-sm font-semibold text-white">In-Call Chat</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 space-y-2 p-4">
            <MessageSquare className="w-8 h-8 opacity-40" />
            <p className="text-xs">No messages yet. Say hello to everyone in the call!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.isLocal ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 text-[11px] text-zinc-400">
                <span className="font-semibold">{msg.sender}</span>
                <span>•</span>
                <span>{msg.time}</span>
              </div>
              <div
                className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-xs break-words ${
                  msg.isLocal
                    ? 'bg-blue-600 text-white rounded-tr-xs'
                    : 'bg-zinc-800 text-zinc-100 rounded-tl-xs'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Box */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-800 flex items-center gap-2">
        <input
          type="text"
          placeholder="Type a message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </aside>
  );
}
