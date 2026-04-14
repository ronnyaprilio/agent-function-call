"use client";

import { useState } from "react";
import { Session } from "../types";

interface Props {
  session?: Session;
  onSend: (message: string) => Promise<void>;
}

export default function ChatWindow({ session, onSend }: Props) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!message.trim() || !session) return;
    setLoading(true);
    try {
      await onSend(message);
      setMessage("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h1>Agent Function Call Simulation</h1>
      <p>Demo version. Try: "weather in london" or "calculate 2 + 2 * 3" or "what is the result of 89 times 76 and divide it by 8"</p>

      <div style={{ marginTop: 16 }}>
        {session ? (
          <>
            <div><strong>Session:</strong> {session.title}</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>{session.session_id}</div>
          </>
        ) : (
          <div>No session selected</div>
        )}
      </div>

      <div className="input-row">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter a message..."
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          disabled={!session || loading}
        />
        <button onClick={handleSend} disabled={!session || loading}>
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}