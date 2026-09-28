import React, { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import axios from "axios";
import socket from "../socket";

const API_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:5000";

const LANGUAGES = ["javascript", "python", "java", "cpp", "c"];

export default function EditorPage() {
  const { roomId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const username = state?.username;

  const [code, setCode] = useState("// Start coding together...\n");
  const [language, setLanguage] = useState("javascript");
  const [users, setUsers] = useState([]);
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const [chatInput, setChatInput] = useState("");
  const [chatLog, setChatLog] = useState([]);

  // Guards against re-broadcasting changes we just received from the server
  const receivingUpdate = useRef(false);

  useEffect(() => {
    if (!username) {
      navigate("/");
      return;
    }

    socket.connect();
    socket.emit("join-room", { roomId, username });

    socket.on("room-state", ({ code: savedCode, language: savedLang }) => {
      if (savedCode) setCode(savedCode);
      if (savedLang) setLanguage(savedLang);
    });

    socket.on("code-update", ({ code: newCode }) => {
      receivingUpdate.current = true;
      setCode(newCode);
    });

    socket.on("language-update", ({ language: newLang }) => setLanguage(newLang));

    socket.on("user-list", (list) => setUsers(list));
    socket.on("user-joined", ({ username: u }) =>
      setChatLog((log) => [...log, { system: true, message: `${u} joined the room` }])
    );
    socket.on("user-left", ({ username: u }) =>
      setChatLog((log) => [...log, { system: true, message: `${u} left the room` }])
    );

    socket.on("chat-message", (msg) => setChatLog((log) => [...log, msg]));

    return () => {
      socket.off("room-state");
      socket.off("code-update");
      socket.off("language-update");
      socket.off("user-list");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("chat-message");
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const handleEditorChange = (value) => {
    setCode(value);
    if (receivingUpdate.current) {
      receivingUpdate.current = false; // this change came from the server, don't re-emit
      return;
    }
    socket.emit("code-change", { roomId, code: value });
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    socket.emit("language-change", { roomId, language: newLang });
  };

  const runCode = async () => {
    setRunning(true);
    setOutput("Running...");
    try {
      const res = await axios.post(`${API_URL}/api/execute`, { code, language });
      const { stdout, stderr, compileOutput, status } = res.data;
      setOutput(stderr || compileOutput || stdout || `(no output) — ${status}`);
    } catch (err) {
      setOutput(`Execution error: ${err.response?.data?.error || err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const askAI = async () => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await axios.post(`${API_URL}/api/ai-debug`, {
        code,
        language,
        errorMessage: output,
      });
      setAiResult(res.data);
    } catch (err) {
      setAiResult({ explanation: `AI request failed: ${err.response?.data?.error || err.message}` });
    } finally {
      setAiLoading(false);
    }
  };

  const applyFix = () => {
    if (aiResult?.fixedCode) {
      setCode(aiResult.fixedCode);
      socket.emit("code-change", { roomId, code: aiResult.fixedCode });
    }
  };

  const sendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socket.emit("chat-message", { roomId, username, message: chatInput });
    setChatInput("");
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <strong>Room:</strong> {roomId}
        </div>
        <select value={language} onChange={handleLanguageChange} style={styles.select}>
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <div style={styles.users}>
          {users.map((u, i) => (
            <span key={i} style={styles.userChip}>
              {u}
            </span>
          ))}
        </div>
        <button style={styles.runBtn} onClick={runCode} disabled={running}>
          {running ? "Running..." : "▶ Run"}
        </button>
        <button style={styles.aiBtn} onClick={askAI} disabled={aiLoading}>
          {aiLoading ? "Thinking..." : "✨ AI Debug"}
        </button>
      </header>

      <div style={styles.main}>
        <div style={styles.editorPane}>
          <Editor
            height="100%"
            theme="vs-dark"
            language={language}
            value={code}
            onChange={handleEditorChange}
            options={{ fontSize: 14, minimap: { enabled: false } }}
          />
        </div>

        <div style={styles.sidePane}>
          <div style={styles.outputBox}>
            <h4 style={styles.paneTitle}>Output</h4>
            <pre style={styles.outputText}>{output}</pre>
          </div>

          {aiResult && (
            <div style={styles.aiBox}>
              <h4 style={styles.paneTitle}>AI Debug Suggestion</h4>
              <p style={styles.aiText}>{aiResult.explanation}</p>
              {aiResult.suggestions?.length > 0 && (
                <ul style={styles.aiText}>
                  {aiResult.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              )}
              {aiResult.fixedCode && (
                <button style={styles.applyBtn} onClick={applyFix}>
                  Apply Fix
                </button>
              )}
            </div>
          )}

          <div style={styles.chatBox}>
            <h4 style={styles.paneTitle}>Chat</h4>
            <div style={styles.chatLog}>
              {chatLog.map((m, i) => (
                <div key={i} style={{ opacity: m.system ? 0.6 : 1 }}>
                  {m.system ? m.message : <><strong>{m.username}:</strong> {m.message}</>}
                </div>
              ))}
            </div>
            <form onSubmit={sendChat} style={{ display: "flex", gap: 4 }}>
              <input
                style={styles.chatInput}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Message..."
              />
              <button style={styles.chatSend} type="submit">
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { height: "100vh", display: "flex", flexDirection: "column", background: "#1e1e2e" },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "10px 16px",
    background: "#2a2a3d",
    color: "#fff",
    fontFamily: "Segoe UI, sans-serif",
  },
  select: { padding: "4px 8px", borderRadius: "4px" },
  users: { display: "flex", gap: "6px", flex: 1 },
  userChip: {
    background: "#6c5ce7",
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "0.75rem",
  },
  runBtn: {
    background: "#00b894",
    color: "#fff",
    border: "none",
    padding: "6px 14px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  aiBtn: {
    background: "#6c5ce7",
    color: "#fff",
    border: "none",
    padding: "6px 14px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  main: { flex: 1, display: "flex", overflow: "hidden" },
  editorPane: { flex: 3 },
  sidePane: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "#252536",
    color: "#fff",
    padding: "10px",
    gap: "12px",
    overflowY: "auto",
    fontFamily: "Segoe UI, sans-serif",
  },
  paneTitle: { margin: "0 0 6px 0", fontSize: "0.9rem", color: "#a0a0b8" },
  outputBox: { background: "#1e1e2e", padding: "8px", borderRadius: "6px", minHeight: "80px" },
  outputText: { whiteSpace: "pre-wrap", fontSize: "0.8rem", margin: 0 },
  aiBox: { background: "#1e1e2e", padding: "8px", borderRadius: "6px" },
  aiText: { fontSize: "0.8rem" },
  applyBtn: {
    marginTop: "6px",
    background: "#00b894",
    border: "none",
    padding: "4px 10px",
    borderRadius: "4px",
    color: "#fff",
    cursor: "pointer",
  },
  chatBox: { background: "#1e1e2e", padding: "8px", borderRadius: "6px", flex: 1, display: "flex", flexDirection: "column" },
  chatLog: { flex: 1, overflowY: "auto", fontSize: "0.78rem", marginBottom: "6px", display: "flex", flexDirection: "column", gap: "3px" },
  chatInput: { flex: 1, padding: "6px", borderRadius: "4px", border: "1px solid #444", background: "#2a2a3d", color: "#fff" },
  chatSend: { padding: "6px 10px", borderRadius: "4px", border: "none", background: "#6c5ce7", color: "#fff", cursor: "pointer" },
};
