from datetime import datetime
import mongoengine as me

class ToolCall(me.EmbeddedDocument):
    tool_name = me.StringField(required=True)
    arguments = me.DictField(required=True)
    result = me.DictField(default=dict)
    status = me.StringField(required=True, choices=["pending", "success", "error"])
    created_at = me.DateTimeField(default=datetime.utcnow)

class Event(me.EmbeddedDocument):
    type = me.StringField(
        required=True,
        choices=["user_message", "agent_thought", "tool_call", "tool_result", "assistant_message"]
    )
    content = me.StringField()
    metadata = me.DictField(default=dict)
    created_at = me.DateTimeField(default=datetime.utcnow)

class Session(me.Document):
    session_id = me.StringField(required=True, unique=True)
    title = me.StringField(default="New Session")
    events = me.EmbeddedDocumentListField(Event)
    tool_calls = me.EmbeddedDocumentListField(ToolCall)
    created_at = me.DateTimeField(default=datetime.utcnow)
    updated_at = me.DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "sessions",
        "indexes": ["session_id", "-updated_at"]
    }