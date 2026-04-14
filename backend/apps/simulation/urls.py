from django.urls import path
from .views import health_check, create_session, list_sessions, get_session, send_message

urlpatterns = [
    path("health/", health_check),
    path("sessions/", list_sessions),
    path("sessions/create/", create_session),
    path("sessions/<str:session_id>/", get_session),
    path("sessions/<str:session_id>/message/", send_message),
]