import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

export default function JoinRoom() {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const createNewRoom = (e) => {
    e.preventDefault();
    const newRoomId = uuidv4().slice(0, 8);
    setRoomId(newRoomId);
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (!roomId || !username) {
      alert("Room ID and username are required");
      return;
    }
    navigate(`/room/${roomId}`, { state: { username } });
  };

  return (
    <div style={styles.wrapper}>
      <form style={styles.card} onSubmit={joinRoom}>
        <h1 style={styles.title}>Collab Code Editor</h1>
        <p style={styles.subtitle}>Real-time collaborative coding with AI-assisted debugging</p>

        <input
          style={styles.input}
          placeholder="Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <button style={styles.linkBtn} onClick={createNewRoom}>
          Generate new room ID
        </button>

        <input
          style={styles.input}
          placeholder="Your name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <button style={styles.joinBtn} type="submit">
          Join Room
        </button>
      </form>
    </div>
  );
}

const styles = {
  wrapper: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#1e1e2e",
    fontFamily: "Segoe UI, sans-serif",
  },
  card: {
    background: "#2a2a3d",
    padding: "2.5rem",
    borderRadius: "12px",
    width: "320px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  title: { color: "#fff", margin: 0, fontSize: "1.5rem" },
  subtitle: { color: "#a0a0b8", margin: "0 0 12px 0", fontSize: "0.85rem" },
  input: {
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid #444",
    background: "#1e1e2e",
    color: "#fff",
    outline: "none",
  },
  linkBtn: {
    background: "none",
    border: "none",
    color: "#8ab4f8",
    fontSize: "0.8rem",
    cursor: "pointer",
    textAlign: "left",
    padding: 0,
  },
  joinBtn: {
    marginTop: "10px",
    padding: "10px",
    borderRadius: "6px",
    border: "none",
    background: "#6c5ce7",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
