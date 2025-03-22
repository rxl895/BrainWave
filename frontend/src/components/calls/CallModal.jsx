import React, { useState } from 'react';
import { X, Mic, MicOff, Camera, CameraOff, PhoneOff } from 'lucide-react';

export const CallModal = ({ isOpen, onClose, callType, groupName }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'voice');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">
            {callType.charAt(0).toUpperCase() + callType.slice(1)} Call: {groupName}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-8">
          <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center mb-4">
            {callType === 'video' && !isVideoOff ? (
              <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                <Camera size={48} className="text-gray-500" />
              </div>
            ) : (
              <div className="text-gray-500 text-center">
                <div className="mb-2">
                  <CameraOff size={48} className="mx-auto" />
                </div>
                <p>Video is turned off</p>
              </div>
            )}
          </div>
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
        
        <div className="mt-8 text-center text-gray-400 text-sm">
          <p>This is a mock interface for the call feature</p>
          <p>Actual implementation would integrate with WebRTC or a video call service</p>
        </div>
      </div>
    </div>
  );
}; 