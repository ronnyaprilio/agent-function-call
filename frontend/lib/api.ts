import { Session, SessionSummary } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function createSession(title?: string): Promise<Session> {
  return apiFetch<Session>("/sessions/create/", {
    method: "POST",
    body: JSON.stringify({ title: title || "New Session" }),
  });
}

export async function listSessions(): Promise<SessionSummary[]> {
  return apiFetch<SessionSummary[]>("/sessions/");
}

export async function getSession(sessionId: string): Promise<Session> {
  return apiFetch<Session>(`/sessions/${sessionId}/`);
}

export async function sendMessage(sessionId: string, message: string): Promise<Session> {
  return apiFetch<Session>(`/sessions/${sessionId}/message/`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}