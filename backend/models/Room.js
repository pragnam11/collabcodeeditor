const mongoose = require("mongoose");

/**
 * A "Room" represents one collaborative editing session.
 * We persist the latest code + language so that a room can be
 * restored if all users disconnect and someone rejoins later.
 */
const RoomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    language: {
      type: String,
      default: "javascript",
    },
    code: {
      type: String,
      default: "// Start coding together...\n",
    },
    lastActiveUsers: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", RoomSchema);
