// src/services/webrtcService.js

let localStream = null;

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    // Add TURN server here for production use if needed
  ],
};

// Get user's audio/video stream
export const getLocalStream = async (video = true, audio = true) => {
  if (!localStream) {
    localStream = await navigator.mediaDevices.getUserMedia({ video, audio });
  }
  return localStream;
};

// Create a new RTCPeerConnection for a specific user
export const createPeerConnection = (onTrackCallback) => {
  const connection = new RTCPeerConnection(ICE_SERVERS);

  connection.onicecandidate = (event) => {
    if (event.candidate) {
      window.dispatchEvent(
        new CustomEvent('ice-candidate', { detail: { candidate: event.candidate, from: connection._id } })
      );
    }
  };

  connection.ontrack = (event) => {
    const remoteStream = new MediaStream();
    remoteStream.addTrack(event.track);
    onTrackCallback(remoteStream);
  };

  // Add local tracks to the peer
  if (localStream) {
    localStream.getTracks().forEach((track) => {
      connection.addTrack(track, localStream);
    });
  }

  return connection;
};

// Create an SDP offer for a given connection
export const createOffer = async (connection) => {
  const offer = await connection.createOffer();
  await connection.setLocalDescription(offer);
  return offer;
};

// Create an SDP answer for a given connection
export const createAnswer = async (connection) => {
  const answer = await connection.createAnswer();
  await connection.setLocalDescription(answer);
  return answer;
};

// Set the remote SDP for a given connection
export const setRemoteDescription = async (sdp, connection) => {
  const desc = new RTCSessionDescription(sdp);
  await connection.setRemoteDescription(desc);
};

// Add a remote ICE candidate to a specific connection
export const addIceCandidate = async (candidate, connection) => {
  try {
    await connection.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (e) {
    console.error('Error adding received ice candidate', e);
  }
};

// Close all local tracks and reset local stream
export const closeConnection = () => {
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }
};
