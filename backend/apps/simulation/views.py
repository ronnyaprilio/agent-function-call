from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .serializers import CreateSessionSerializer, MessageSerializer
from .services import AgentSimulationService

def session_to_dict(session):
    return {
        "session_id": session.session_id,
        "title": session.title,
        "events": [
            {
                "type": e.type,
                "content": e.content,
                "metadata": e.metadata,
                "created_at": e.created_at.isoformat() if e.created_at else None,
            }
            for e in session.events
        ],
        "tool_calls": [
            {
                "tool_name": t.tool_name,
                "arguments": t.arguments,
                "result": t.result,
                "status": t.status,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in session.tool_calls
        ],
        "created_at": session.created_at.isoformat() if session.created_at else None,
        "updated_at": session.updated_at.isoformat() if session.updated_at else None,
    }

@api_view(["GET"])
def health_check(request):
    return Response({"status": "ok"})

@api_view(["POST"])
def create_session(request):
    serializer = CreateSessionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    session = AgentSimulationService.create_session(serializer.validated_data["title"])
    return Response(session_to_dict(session), status=status.HTTP_201_CREATED)

@api_view(["GET"])
def list_sessions(request):
    sessions = AgentSimulationService.list_sessions()
    data = [
        {
            "session_id": s.session_id,
            "title": s.title,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "updated_at": s.updated_at.isoformat() if s.updated_at else None,
        }
        for s in sessions
    ]
    return Response(data)

@api_view(["GET"])
def get_session(request, session_id):
    session = AgentSimulationService.get_session(session_id)
    if not session:
        return Response({"detail": "Session not found"}, status=404)
    return Response(session_to_dict(session))

@api_view(["POST"])
def send_message(request, session_id):
    serializer = MessageSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    session = AgentSimulationService.get_session(session_id)
    if not session:
        return Response({"detail": "Session not found"}, status=404)

    updated = AgentSimulationService.simulate_agent(session, serializer.validated_data["message"])
    return Response(session_to_dict(updated))