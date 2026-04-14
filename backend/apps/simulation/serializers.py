from rest_framework import serializers

class CreateSessionSerializer(serializers.Serializer):
    title = serializers.CharField(required=False, allow_blank=True, default="New Session")

class MessageSerializer(serializers.Serializer):
    message = serializers.CharField()