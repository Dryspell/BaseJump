import "./App.css";
import React from "react";
import { Routes, Route } from "react-router-dom";
import Homepage from "./Pages/Homepage";
import ChatPage from "./Pages/ChatPage";
import GamePage from "./Pages/GamePage";
import ExamplePage from "./Pages/ExamplePage";

function App() {
    return (
        <div className="App">
            <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/chats" element={<ChatPage />} />
                <Route path="/game" element={<GamePage />} />
                <Route path="/examples" element={<ExamplePage />} />
            </Routes>
        </div>
    );
}

export default App;
