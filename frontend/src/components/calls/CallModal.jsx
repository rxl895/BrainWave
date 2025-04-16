import React, { useState, useRef, useEffect } from 'react';
import { X, Mic, MicOff, Camera, CameraOff, PhoneOff } from 'lucide-react';
import {
  getLocalStream,
  closeConnection
} from '../../services/webrtcservices';

const RING_COLORS = [
  'ring-red-400', 'ring-orange-400', 'ring-yellow-400',
  'ring-green-400', 'ring-teal-400', 'ring-blue-400',
  'ring-indigo-400', 'ring-purple-400', 'ring-pink-400',
];

const BG_COLORS = [
  'bg-red-300', 'bg-orange-300', 'bg-yellow-300',
  'bg-green-300', 'bg-teal-300', 'bg-blue-300',
  'bg-indigo-300', 'bg-purple-300', 'bg-pink-300',
];

export const CallModal = ({ isOpen, onClose, callType, groupName, remoteStreams, currentUserId }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'voice');
  const [isTalking, setIsTalking] = useState(false);
  const [ringColor, setRingColor] = useState('ring-green-400');
  const [bgColor, setBgColor] = useState('bg-blue-300');

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const initCall = async () => {
      try {
        const localStream = await getLocalStream(callType === 'video', true);
        localStreamRef.current = localStream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        localStream.getAudioTracks().forEach((track) => {
          track.enabled = !isMuted;
        });
        localStream.getVideoTracks().forEach((track) => {
          track.enabled = !isVideoOff;
        });

        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(localStream);
        source.connect(analyser);
        analyser.fftSize = 256;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyserRef.current = analyser;

        const detectSpeech = () => {
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setIsTalking(avg > 15);
          animationFrameRef.current = requestAnimationFrame(detectSpeech);
        };

        detectSpeech();
      } catch (err) {
        console.error('Failed to get user media:', err);
      }
    };

    if (isOpen) {
      setRingColor(RING_COLORS[Math.floor(Math.random() * RING_COLORS.length)]);
      setBgColor(BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)]);
      initCall();
    }

    return () => {
      closeConnection();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setIsTalking(false);
    };
  }, [isOpen, callType]);

  useEffect(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !isMuted;
    });
  }, [isMuted]);

  useEffect(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = !isVideoOff;
    });
  }, [isVideoOff]);

  const renderLocalView = () => {
    return (
      <div className={`relative w-full h-full ${isTalking ? `${ringColor} ring-4 animate-pulse rounded-lg` : ''}`}>
        {isVideoOff ? (
          <div className={`w-full h-full flex items-center justify-center text-white text-xl font-semibold rounded-lg ${bgColor}`}>
            You
          </div>
        ) : (
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover rounded-lg"
            style={{ transform: 'scaleX(-1)' }}
          />
        )}
        <div className="absolute bottom-1 w-full text-white text-xs text-center">You</div>
      </div>
    );
  };

  const renderRemoteViews = () => {
    return Object.entries(remoteStreams).map(([userId, stream], i) => {
      const bg = BG_COLORS[i % BG_COLORS.length];
      return (
        <div key={userId} className="relative w-full h-full">
          <video
            autoPlay
            playsInline
            className="w-full h-full object-cover rounded-lg"
            ref={(el) => {
              if (el && !el.srcObject) el.srcObject = stream;
            }}
          />
          <div className={`absolute inset-0 rounded-lg ${bg} opacity-0 transition-opacity duration-300`} />
          <div className="absolute bottom-1 w-full text-white text-xs text-center">{userId}</div>
        </div>
      );
    });
  };

  if (!isOpen) return null;

  const allVideos = [renderLocalView(), ...renderRemoteViews()];
  const getGridClass = (count) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-3';
    if (count <= 9) return 'grid-cols-3';
    return 'grid-cols-4';
  };
  
  const gridCols = getGridClass(allVideos.length);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-6xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">
            {callType.charAt(0).toUpperCase() + callType.slice(1)} Call: {groupName}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className={`grid ${gridCols} gap-2 auto-rows-fr aspect-video mb-6`}>
            {allVideos}
        </div>


        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-4 rounded-full ${isMuted ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          {callType === 'video' && (
            <button
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={`p-4 rounded-full ${isVideoOff ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              {isVideoOff ? <CameraOff size={24} /> : <Camera size={24} />}
            </button>
          )}

          <button
            onClick={onClose}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700"
          >
            <PhoneOff size={24} />
          </button>
        </div>

        <div className="mt-4 text-center text-gray-400 text-sm">
          <p>{isTalking ? '🎤 You are speaking' : 'Waiting for audio...'}</p>
        </div>
      </div>
    </div>
  );
};
