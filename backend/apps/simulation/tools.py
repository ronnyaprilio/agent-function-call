import ast
import operator as op
from datetime import datetime

_ALLOWED_OPERATORS = {
    ast.Add: op.add,
    ast.Sub: op.sub,
    ast.Mult: op.mul,
    ast.Div: op.truediv,
    ast.Pow: op.pow,
    ast.USub: op.neg,
}

def _safe_eval(node):
    if isinstance(node, ast.Constant):
        if isinstance(node.value, (int, float)):
            return node.value
        raise TypeError("Unsupported constant")
    elif isinstance(node, ast.Num):
        return node.n
    elif isinstance(node, ast.BinOp):
        if type(node.op) not in _ALLOWED_OPERATORS:
            raise TypeError("Unsupported operator")
        return _ALLOWED_OPERATORS[type(node.op)](_safe_eval(node.left), _safe_eval(node.right))
    elif isinstance(node, ast.UnaryOp):
        if type(node.op) not in _ALLOWED_OPERATORS:
            raise TypeError("Unsupported unary operator")
        return _ALLOWED_OPERATORS[type(node.op)](_safe_eval(node.operand))
    raise TypeError("Unsupported expression")

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
        parsed = ast.parse(expression, mode='eval').body
        result = _safe_eval(parsed)
        return {"expression": expression, "result": result}
    except Exception as e:
        return {"expression": expression, "error": str(e)}

AVAILABLE_TOOLS = {
    "weather_tool": weather_tool,
    "calculator_tool": calculator_tool,
}