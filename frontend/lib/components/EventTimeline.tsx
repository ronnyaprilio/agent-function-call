"use client";
import { EventItem } from "../types";

const typeOrder: Record<string, number> = {
  user_message: 0,
  agent_thought: 1,
  tool_call: 2,
  tool_result: 3,
  assistant_message: 4,
};

export default function EventTimeline({ events }: { events: EventItem[] }) {
  // 1. sort global by time ASC dulu (biar urutan natural)
  const sorted = [...events].sort(
    (a, b) =>
      new Date(a.created_at).getTime() -
      new Date(b.created_at).getTime()
  );

  // 2. split jadi "session blocks" berdasarkan user_message
  const blocks: EventItem[][] = [];
  let currentBlock: EventItem[] = [];

  for (const event of sorted) {
    if (event.type === "user_message") {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock);
      }
      currentBlock = [event];
    } else {
      currentBlock.push(event);
    }
  }

  if (currentBlock.length > 0) {
    blocks.push(currentBlock);
  }

  // 3. reverse blocks (DESC: request terbaru di atas)
  const reversedBlocks = blocks.reverse();

  return (
    <div className="card">
      <h2>Simulation Timeline</h2>

      <div style={{ marginTop: 16 }}>
        {reversedBlocks.map((block, i) => {
          const sortedBlock = block.sort(
            (a, b) => typeOrder[a.type] - typeOrder[b.type]
          );

          return (
            <div key={i} style={{ marginBottom: 24 }}>
              {sortedBlock.map((event, index) => (
                <div
                  key={`${event.created_at}-${index}`}
                  className={`message ${event.type}`}
                >
                  <div style={{ fontWeight: 700 }}>{event.type}</div>
                  <div>{event.content}</div>

                  {Object.keys(event.metadata || {}).length > 0 && (
                    <pre style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
                      {JSON.stringify(event.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}