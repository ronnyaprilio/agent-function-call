from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List

@dataclass
class ToolCall:
    tool_name: str
    arguments: Dict[str, Any]
    result: Dict[str, Any]
    status: str
    created_at: datetime = field(default_factory=datetime.utcnow)

@dataclass
class Event:
    type: str
    content: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)

@dataclass
class Session:
    session_id: str
    title: str = "New Session"
    events: List[Event] = field(default_factory=list)
    tool_calls: List[ToolCall] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
