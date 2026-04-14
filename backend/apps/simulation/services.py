import uuid
from datetime import datetime
from .models import Session, Event, ToolCall
from .tools import AVAILABLE_TOOLS

class AgentSimulationService:
    @staticmethod
    def create_session(title: str = "New Session") -> Session:
        session = Session(
            session_id=str(uuid.uuid4()),
            title=title or "New Session",
            events=[],
            tool_calls=[],
        )
        session.save()
        return session

    @staticmethod
    def list_sessions():
        return Session.objects.order_by("-updated_at")

    @staticmethod
    def get_session(session_id: str):
        return Session.objects(session_id=session_id).first()

    @staticmethod
    def simulate_agent(session: Session, user_message: str) -> Session:
        session.events.append(Event(
            type="user_message",
            content=user_message,
            created_at=datetime.utcnow(),
        ))

        lower_msg = user_message.lower()

        thought = "I will analyze the request and determine whether a tool is needed."
        session.events.append(Event(
            type="agent_thought",
            content=thought,
            created_at=datetime.utcnow(),
        ))

        if "weather" in lower_msg:
            arguments = {"city": "London"}
            tool_name = "weather_tool"
            result = AVAILABLE_TOOLS[tool_name](arguments)

            session.tool_calls.append(ToolCall(
                tool_name=tool_name,
                arguments=arguments,
                result=result,
                status="success",
                created_at=datetime.utcnow(),
            ))

            session.events.append(Event(
                type="tool_call",
                content=f"Calling {tool_name}",
                metadata={"arguments": arguments},
                created_at=datetime.utcnow(),
            ))
            session.events.append(Event(
                type="tool_result",
                content=f"{result}",
                metadata=result,
                created_at=datetime.utcnow(),
            ))
            session.events.append(Event(
                type="assistant_message",
                content=f"The weather in {result['city']} is {result['condition']} and {result['temperature_c']}°C.",
                created_at=datetime.utcnow(),
            ))

        elif "calculate" in lower_msg or any(ch.isdigit() for ch in lower_msg):
            expression = user_message.replace("calculate", "").strip() or "0"
            arguments = {"expression": expression}
            tool_name = "calculator_tool"
            result = AVAILABLE_TOOLS[tool_name](arguments)
            status = "error" if "error" in result else "success"

            session.tool_calls.append(ToolCall(
                tool_name=tool_name,
                arguments=arguments,
                result=result,
                status=status,
                created_at=datetime.utcnow(),
            ))

            session.events.append(Event(
                type="tool_call",
                content=f"Calling {tool_name}",
                metadata={"arguments": arguments},
                created_at=datetime.utcnow(),
            ))
            session.events.append(Event(
                type="tool_result",
                content=f"{result}",
                metadata=result,
                created_at=datetime.utcnow(),
            ))

            final_content = (
                f"The result is {result['result']}."
                if status == "success"
                else f"I encountered an error: {result['error']}"
            )

            session.events.append(Event(
                type="assistant_message",
                content=final_content,
                created_at=datetime.utcnow(),
            ))
        else:
            session.events.append(Event(
                type="assistant_message",
                content="I can help simulate function calls. Try asking for weather or calculations.",
                created_at=datetime.utcnow(),
            ))

        session.updated_at = datetime.utcnow()
        session.save()
        return session