export type EventType =
  | "user_message"
  | "agent_thought"
  | "tool_call"
  | "tool_result"
  | "assistant_message";

export interface EventItem {
  type: EventType;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ToolCall {
  tool_name: string;
  arguments: Record<string, unknown>;
  result: Record<string, unknown>;
  status: "pending" | "success" | "error";
  created_at: string;
}

export interface Session {
  session_id: string;
  title: string;
  events: EventItem[];
  tool_calls: ToolCall[];
  created_at: string;
  updated_at: string;
}

export interface SessionSummary {
  session_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}