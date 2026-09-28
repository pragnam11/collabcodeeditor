# Real-Time Collaborative Code Editor with AI-Assisted Debugging

A full-stack web app where multiple users can edit and run code together in
real time, with an AI assistant that explains bugs and suggests fixes.

## Tech Stack
- **Frontend:** React, Monaco Editor, Socket.io-client, React Router
- **Backend:** Node.js, Express, Socket.io
- **Database:** MongoDB (Mongoose) — stores each room's latest code
- **Code Execution:** Judge0 API (sandboxed multi-language execution)
- **AI Debugging:** Any OpenAI-compatible chat completion API

## Folder Structure
```
collab-code-editor/
├── backend/
│   ├── server.js              # Express + Socket.io entry point
│   ├── models/Room.js         # Mongoose schema for a collaborative room
│   ├── controllers/
│   │   ├── executeController.js  # Judge0 sandboxed execution
│   │   └── aiController.js       # LLM-based debugging
│   ├── routes/api.js          # REST endpoints
│   ├── sockets/collabSocket.js   # Real-time sync logic
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.js
    │   ├── socket.js          # shared socket.io client
    │   └── components/
    │       ├── JoinRoom.js    # create/join room screen
    │       └── EditorPage.js  # main collaborative editor UI
    └── public/index.html
```

## How It Works
1. A user creates or joins a room by ID. Socket.io places them in that
   room's channel.
2. Every keystroke in the Monaco editor is broadcast via `code-change` and
   applied to other clients' editors (`code-update`), while also being
   persisted to MongoDB so the room survives disconnects.
3. Clicking **Run** sends the current code to the backend, which forwards
   it to the Judge0 API for sandboxed execution and returns
   stdout/stderr.
4. Clicking **AI Debug** sends the code (plus the last run's output) to an
   LLM, which returns an explanation, a corrected code snippet, and tips —
   shown in the sidebar with an "Apply Fix" button.
5. A lightweight chat panel lets collaborators talk without leaving the
   editor.

## Setup

### Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in MongoDB URI, Judge0 key, AI API key
npm run dev
```

### Frontend
```bash
cd frontend
npm install
echo "REACT_APP_SERVER_URL=http://localhost:5000" > .env
npm start
```

Open two browser tabs at `http://localhost:3000`, join the same room ID
from both, and start typing — changes sync instantly.

## Notes for Viva / Report
- **CRDT/OT note:** this implementation uses a simple "last write wins"
  broadcast model, which is fine for a demo but can cause conflicts with
  many simultaneous editors. Mention Yjs or ShareDB (CRDT/OT libraries) as
  a "future enhancement" if asked about conflict resolution at scale.
- **Judge0** requires a free RapidAPI key (or self-hosting Judge0 via
  Docker) — mention this dependency in your report's "Tools/Requirements"
  section.
- **AI Debugging** works with any OpenAI-compatible endpoint — you can
  swap in a free-tier provider (e.g., Groq, local Ollama with an
  OpenAI-compatible wrapper) if you don't have an OpenAI key.
