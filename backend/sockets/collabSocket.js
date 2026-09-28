const Room = require("../models/Room");

// In-memory map: roomId -> Map(socketId -> username)
// (Mongo stores the durable code; this map is just for live presence)
const roomUsers = new Map();

function getUsersInRoom(roomId) {
  const users = roomUsers.get(roomId);
  return users ? Array.from(users.values()) : [];
}

function initCollabSocket(io) {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // --- JOIN ROOM ---
    socket.on("join-room", async ({ roomId, username }) => {
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.username = username;

      if (!roomUsers.has(roomId)) roomUsers.set(roomId, new Map());
      roomUsers.get(roomId).set(socket.id, username);

      // Load or create persisted room state
      let room = await Room.findOne({ roomId });
      if (!room) {
        room = await Room.create({ roomId });
      }

      // Send current code + language to the newly joined client only
      socket.emit("room-state", { code: room.code, language: room.language });

      // Notify everyone in the room of the updated user list
      io.to(roomId).emit("user-list", getUsersInRoom(roomId));
      socket.to(roomId).emit("user-joined", { username });
    });

    // --- CODE CHANGE (broadcast to others + persist) ---
    socket.on("code-change", async ({ roomId, code }) => {
      socket.to(roomId).emit("code-update", { code });

      // Debounced-ish persistence: fire and forget, don't block real-time flow
      Room.findOneAndUpdate({ roomId }, { code }, { upsert: true }).catch((err) =>
        console.error("Persist code error:", err.message)
      );
    });

    // --- LANGUAGE CHANGE ---
    socket.on("language-change", async ({ roomId, language }) => {
      socket.to(roomId).emit("language-update", { language });
      Room.findOneAndUpdate({ roomId }, { language }, { upsert: true }).catch((err) =>
        console.error("Persist language error:", err.message)
      );
    });

    // --- CURSOR / SELECTION SHARING (optional visual presence) ---
    socket.on("cursor-move", ({ roomId, position, username }) => {
      socket.to(roomId).emit("cursor-update", { position, username, socketId: socket.id });
    });

    // --- CHAT (lightweight in-room chat, optional but nice for a demo) ---
    socket.on("chat-message", ({ roomId, username, message }) => {
      io.to(roomId).emit("chat-message", { username, message, ts: Date.now() });
    });

    // --- DISCONNECT ---
    socket.on("disconnect", () => {
      const { roomId, username } = socket.data;
      if (roomId && roomUsers.has(roomId)) {
        roomUsers.get(roomId).delete(socket.id);
        io.to(roomId).emit("user-list", getUsersInRoom(roomId));
        socket.to(roomId).emit("user-left", { username });
        if (roomUsers.get(roomId).size === 0) roomUsers.delete(roomId);
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}

module.exports = initCollabSocket;
