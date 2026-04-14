from datetime import datetime

def weather_tool(arguments: dict) -> dict:
    city = arguments.get("city", "unknown")
    return {
        "city": city,
        "temperature_c": 24,
        "condition": "Sunny",
        "timestamp": datetime.utcnow().isoformat()
    }

def calculator_tool(arguments: dict) -> dict:
    expression = arguments.get("expression", "0")
    try:
        result = eval(expression, {"__builtins__": {}})
        return {"expression": expression, "result": result}
    except Exception as e:
        return {"expression": expression, "error": str(e)}

AVAILABLE_TOOLS = {
    "weather_tool": weather_tool,
    "calculator_tool": calculator_tool,
}