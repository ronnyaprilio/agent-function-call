"use client";

import { SessionSummary } from "../types";


interface Props {
  sessions: SessionSummary[];
  selectedSessionId?: string;
  onSelect: (sessionId: string) => void;
  onCreate: () => void;
}

export default function SessionList({ sessions, selectedSessionId, onSelect, onCreate }: Props) {
  return (
    <div className="card">
      <h2>Sessions</h2>
      <button className="new-session-btn" onClick={onCreate}>
        New Session
      </button>
      <div style={{ marginTop: 16 }}>
        {sessions.map((session) => (
          <div
            key={session.session_id}
            className="session-item"
            style={{
              outline: selectedSessionId === session.session_id ? "2px solid #3b82f6" : "none",
            }}
            onClick={() => onSelect(session.session_id)}
          >
            <div><strong>{session.title}</strong></div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>{session.updated_at}</div>
          </div>
        ))}
      </div>
    </div>
  );
}