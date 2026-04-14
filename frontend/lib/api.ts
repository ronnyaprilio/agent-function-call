import { EventItem, Session, SessionSummary } from "./types";

const STORAGE_KEY = "agent-sessions";

function nowISO(): string {
  return new Date().toISOString();
}

function makeSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readStorage(): Session[] {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session[]) : [];
  } catch {
    return [];
  }
}

function writeStorage(sessions: Session[]) {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function sessionSummary(session: Session): SessionSummary {
  return {
    session_id: session.session_id,
    title: session.title,
    created_at: session.created_at,
    updated_at: session.updated_at,
  };
}

const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

function parseNumberWords(words: string[]): {value: number; invalid?: string} {
  let total = 0;
  let current = 0;
  let seen = false;

  for (const raw of words) {
    const word = raw.toLowerCase();
    if (word === "and") {
      continue;
    }
    if (word === "hundred") {
      if (!seen) {
        current = 1;
      }
      current *= 100;
      seen = true;
      continue;
    }
    if (word === "thousand") {
      if (!seen) {
        current = 1;
      }
      current *= 1000;
      total += current;
      current = 0;
      seen = false;
      continue;
    }
    if (word in NUMBER_WORDS) {
      seen = true;
      current += NUMBER_WORDS[word];
      continue;
    }
    return { value: 0, invalid: raw };
  }

  return { value: total + current };
}

type ConvertWordsResult = {
  converted: string;
  invalid?: string;
};

function convertWordsToDigits(text: string): {converted: string; invalid?: string} {
  const tokens = text.match(/[A-Za-z]+|[0-9]+|[+\-*/().]/g) || [];
  const result: string[] = [];
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];
    const word = token.toLowerCase();

    if (
      /^[a-z]+$/.test(word) &&
      (word in NUMBER_WORDS || word === "and" || word === "hundred" || word === "thousand")
    ) {
      const seq: string[] = [];
      let j = i;

      while (j < tokens.length) {
        const next = tokens[j].toLowerCase();
        if (
          /^[a-z]+$/.test(next) &&
          (next in NUMBER_WORDS || next === "and" || next === "hundred" || next === "thousand")
        ) {
          seq.push(next);
          j++;
          continue;
        }
        break;
      }

      const parsed = parseNumberWords(seq);
      if (parsed.invalid) {
        return { converted: text, invalid: seq.join(" ") };
      }

      result.push(String(parsed.value));
      i = j;
      continue;
    }

    result.push(token);
    i++;
  }

  return { converted: result.join(" ") };
}

export function normalizeExpression(expression: string): string {
  let normalized = expression.toLowerCase();

  normalized = normalized.replace(
    /\b(what is the result of|what is the|what's the|what is|what's|what|result of|calculate)\b/g,
    " "
  );

  const replacements: Array<{ pattern: RegExp; replace: string }> = [
    { pattern: /\band add it by\b/g, replace: " + " },
    { pattern: /\band add by\b/g, replace: " + " },
    { pattern: /\band add\b/g, replace: " + " },
    { pattern: /\badd it by\b/g, replace: " + " },
    { pattern: /\badded to\b/g, replace: " + " },
    { pattern: /\badd\b/g, replace: " + " },

    { pattern: /\band divide it by\b/g, replace: " / " },
    { pattern: /\bdivide it by\b/g, replace: " / " },
    { pattern: /\band divide by\b/g, replace: " / " },
    { pattern: /\bdivided by\b/g, replace: " / " },
    { pattern: /\bdivide by\b/g, replace: " / " },
    { pattern: /\bdivide\b/g, replace: " / " },
    { pattern: /\bover\b/g, replace: " / " },

    { pattern: /\bmultiplied by\b/g, replace: " * " },
    { pattern: /\btimes\b/g, replace: " * " },
    { pattern: /\bx\b/g, replace: " * " },

    { pattern: /\bplus\b/g, replace: " + " },

    { pattern: /\bminus\b/g, replace: " - " },
    { pattern: /\bsubtract\b/g, replace: " - " },
    { pattern: /\bless\b/g, replace: " - " },
  ];

  for (const { pattern, replace } of replacements) {
    normalized = normalized.replace(pattern, replace);
  }

  normalized = normalized.replace(/\b(it|by|the|a|an|please|pls|is|of)\b/g, " ");

  normalized = normalized.replace(/\?/g, " ");
  normalized = normalized.replace(/\s+/g, " ").trim();

  const converted = convertWordsToDigits(normalized);
  if (converted.invalid) {
    throw new Error(`Invalid request: ${converted.invalid}`);
  }

  normalized = converted.converted;

  normalized = normalized.replace(/[^0-9+\-*/().\s]+/g, " ");
  normalized = normalized.replace(/\s+/g, "");

  if (!normalized) {
    throw new Error("Empty arithmetic expression.");
  }

  if (!/^[0-9+\-*/().]+$/.test(normalized)) {
    throw new Error("Only numeric arithmetic expressions are supported.");
  }

  if (/\*\*|\/\*|\*\/|\+\+|--|\+\-|-[+\-]/.test(normalized)) {
    throw new Error("Invalid arithmetic expression.");
  }

  return normalized;
}

function evaluateExpression(expression: string): number {
  const sanitized = normalizeExpression(expression);
  return Function(`"use strict"; return (${sanitized})`)();
}

function cleanLocation(location: string): string {
  let cleaned = location.replace(/[?!.]/g, "").trim();
  cleaned = cleaned.replace(/^(?:the|a|an)\s+/i, "");
  cleaned = cleaned.replace(/\s+(?:today|now|pls|please|bro|man|dude)\b/gi, "");
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned;
}

function extractWeatherLocation(message: string): string | null {
  const cleaned = message
    .toLowerCase()
    .replace(/[?!.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const noiseWords = new Set([
    "give",
    "me",
    "some",
    "data",
    "of",
    "the",
    "a",
    "an",
    "is",
    "what",
    "how",
    "please",
    "pls",
    "bro",
    "weather",
    "forecast",
    "temperature",
    "now",
    "today",
  ]);

  const tokens = cleaned.split(" ").filter(Boolean);

  const candidates = tokens.filter((t) => !noiseWords.has(t));

  if (candidates.length === 0) return null;

  return candidates[candidates.length - 1];
}

async function weatherTool(args: Record<string, unknown>) {
  const city = String(args.city || "Banjar");

  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
    );

    const geoData = await geoRes.json();

    if (!geoData.results?.length) {
      return {
        city,
        error: "City not found",
      };
    }

    const { latitude, longitude, name } = geoData.results[0];

    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
    );

    const weatherData = await weatherRes.json();

    return {
      city: name,
      temperature_c: weatherData.current_weather?.temperature,
      windspeed: weatherData.current_weather?.windspeed,
      condition: "real-time",
      timestamp: nowISO(),
    };
  } catch (err) {
    return {
      city,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function calculatorTool(args: Record<string, unknown>) {
  const expression = String(args.expression || "0");

  try {
    const result = evaluateExpression(expression);
    return { expression, result };
  } catch (error) {
    return {
      expression,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

const NUMBER_WORD_SET = new Set([
  ...Object.keys(NUMBER_WORDS),
  "hundred",
  "thousand",
  "and",
]);

function containsNumberWords(text: string): boolean {
  const words = text.toLowerCase().split(/\s+/);
  return words.some((w) => NUMBER_WORD_SET.has(w));
}

async function simulateAgent(session: Session, userMessage: string): Promise<Session> {
  const now = nowISO();

  session.events.push({
    type: "user_message",
    content: userMessage,
    metadata: {},
    created_at: now,
  });

  session.events.push({
    type: "agent_thought",
    content: "Analyzing request and deciding tool usage...",
    metadata: {},
    created_at: now,
  });

  const lower = userMessage.toLowerCase();

  if (lower.includes("weather")) {
    const city = extractWeatherLocation(userMessage);
    const args = { city: city || "" };
    const result = await weatherTool(args);
    const status = "error" in result ? "error" : "success";

    session.tool_calls.push({
      tool_name: "weather_tool",
      arguments: args,
      result,
      status,
      created_at: now,
    });

    session.events.push({
      type: "tool_call",
      content: "Calling weather_tool",
      metadata: { args },
      created_at: now,
    });

    session.events.push({
      type: "tool_result",
      content: JSON.stringify(result),
      metadata: result,
      created_at: now,
    });

    session.events.push({
      type: "assistant_message",
      content:
        status === "success"
          ? `Weather in ${result.city}: ${result.temperature_c}°C, wind ${result.windspeed} km/h.`
          : city
          ? `Weather error: ${result.error}`
          : "Please ask for weather with a location, for example 'weather in California'.",
      metadata: {},
      created_at: now,
    });

  } else if (
    lower.includes("calculate") ||
    /\d/.test(lower) ||
    containsNumberWords(lower)
  ) {
    const expression = userMessage.replace(/calculate/i, "").trim() || "0";
    const args = { expression };
    const result = calculatorTool(args);

    const status = "error" in result ? "error" : "success";

    session.tool_calls.push({
      tool_name: "calculator_tool",
      arguments: args,
      result,
      status,
      created_at: now,
    });

    session.events.push({
      type: "tool_call",
      content: "Calling calculator_tool",
      metadata: { args },
      created_at: now,
    });

    session.events.push({
      type: "tool_result",
      content: JSON.stringify(result),
      metadata: result,
      created_at: now,
    });

    session.events.push({
      type: "assistant_message",
      content:
        status === "success"
          ? `The result is ${result.result}.`
          : `Error: ${result.error}`,
      metadata: {},
      created_at: now,
    });

  } else {
    session.events.push({
      type: "assistant_message",
      content: "I can help with weather and calculations. Try asking!",
      metadata: {},
      created_at: now,
    });
  }

  session.updated_at = now;
  return session;
}

export async function createSession(title?: string): Promise<Session> {
  const now = nowISO();
  const sessions = readStorage();

  const session: Session = {
    session_id: makeSessionId(),
    title: title || "New Session",
    events: [],
    tool_calls: [],
    created_at: now,
    updated_at: now,
  };

  sessions.unshift(session);
  writeStorage(sessions);

  return session;
}

export async function listSessions(): Promise<SessionSummary[]> {
  return readStorage()
    .slice()
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .map(sessionSummary);
}

export async function getSession(sessionId: string): Promise<Session> {
  const session = readStorage().find((s) => s.session_id === sessionId);
  if (!session) throw new Error("Session not found");
  return session;
}

export async function sendMessage(sessionId: string, message: string): Promise<Session> {
  const sessions = readStorage();
  const index = sessions.findIndex((s) => s.session_id === sessionId);

  if (index === -1) throw new Error("Session not found");

  const updatedSession = await simulateAgent({ ...sessions[index] }, message);

  sessions[index] = updatedSession;
  writeStorage(sessions);

  return updatedSession;
}