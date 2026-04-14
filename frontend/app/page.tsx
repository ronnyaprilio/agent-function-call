"use client";

import { useEffect, useState } from "react";
import SessionList from "../lib/components/SessionList";
import ChatWindow from "../lib/components/ChatWindow";
import EventTimeline from "../lib/components/EventTimeline";
import { createSession, getSession, listSessions, sendMessage } from "../lib/api";
import { Session, SessionSummary } from "../lib/types";

export default function HomePage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>();
  const [selectedSession, setSelectedSession] = useState<Session>();
  const [loading, setLoading] = useState(false);

  async function refreshSessions(selectNewest = false) {
    const data = await listSessions();
    setSessions(data);
    if (selectNewest && data.length > 0) {
      setSelectedSessionId(data[0].session_id);
    }
  }

  async function loadSession(sessionId: string) {
    setLoading(true);
    try {
      const data = await getSession(sessionId);
      setSelectedSession(data);
      setSelectedSessionId(sessionId);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateSession() {
    const newSession = await createSession("Simulation Session");
    await refreshSessions();
    await loadSession(newSession.session_id);
  }

  async function handleSend(message: string) {
    if (!selectedSessionId) return;
    const updated = await sendMessage(selectedSessionId, message);
    setSelectedSession(updated);
    await refreshSessions();
  }

  useEffect(() => {
    refreshSessions(true);
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      loadSession(selectedSessionId);
    }
  }, [selectedSessionId]);

  return (
    <div className="container">
      <aside className="sidebar">
        <SessionList
          sessions={sessions}
          selectedSessionId={selectedSessionId}
          onSelect={loadSession}
          onCreate={handleCreateSession}
        />
      </aside>

      <main className="main">
        {!selectedSession ? (
          <div className="empty-state">
            <h2>No session selected</h2>
            <p>Click "New Session" first to start a simulation.</p>
          </div>
        ) : (
          <>
            <ChatWindow session={selectedSession} onSend={handleSend} />
            <div style={{ height: 16 }} />
            {loading ? <div>Loading...</div> : <EventTimeline events={selectedSession.events} />}
          </>
        )}
      </main>
    </div>
  );
}