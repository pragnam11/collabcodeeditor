require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const apiRoutes = require("./routes/api");
const initCollabSocket = require("./sockets/collabSocket");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // tighten this to your frontend URL in production
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

app.use("/api", apiRoutes);

app.get("/", (req, res) => {
  res.json({ status: "Collaborative Code Editor backend is running" });
});

// Attach real-time collaboration logic
initCollabSocket(io);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/collab-code-editor")
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    // Start server anyway so real-time editing still works without persistence
    server.listen(PORT, () =>
      console.log(`Server running on port ${PORT} (without DB persistence)`)
    );
  });
