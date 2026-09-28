import { io } from "socket.io-client";

const SOCKET_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:5000";

// A single shared socket instance for the whole app
const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket"],
});

export default socket;
