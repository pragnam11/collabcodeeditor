const express = require("express");
const router = express.Router();

const { executeCode } = require("../controllers/executeController");
const { debugWithAI } = require("../controllers/aiController");
const Room = require("../models/Room");

router.post("/execute", executeCode);
router.post("/ai-debug", debugWithAI);

// Fetch a room's persisted code (useful when a user opens a room link directly)
router.get("/room/:roomId", async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) {
      return res.json({ roomId: req.params.roomId, code: "", language: "javascript" });
    }
    return res.json(room);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
