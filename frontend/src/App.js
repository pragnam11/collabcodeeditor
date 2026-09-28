import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import JoinRoom from "./components/JoinRoom";
import EditorPage from "./components/EditorPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<JoinRoom />} />
        <Route path="/room/:roomId" element={<EditorPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
