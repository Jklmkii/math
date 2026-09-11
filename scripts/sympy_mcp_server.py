import sys
import json
import traceback
import sympy
from sympy import *

# Predefine common symbols
x, y, z, t, a, b, c, n, k = symbols('x y z t a b c n k')

SAFE_SYMPY_ENV = {name: getattr(sympy, name) for name in dir(sympy) if not name.startswith('_')}
SAFE_SYMPY_ENV.update({
    'x': x, 'y': y, 'z': z, 't': t,
    'a': a, 'b': b, 'c': c, 'n': n, 'k': k
})

def handle_calculate(arguments):
    expr_str = arguments.get("expression", "")
    if not expr_str:
        return "Error: Empty expression provided."
    res = eval(expr_str, {"__builtins__": {}}, SAFE_SYMPY_ENV)
    latex_rep = latex(res) if hasattr(sympy, 'latex') else str(res)
    return f"Result: {res}\nLaTeX: {latex_rep}"

def handle_solve(arguments):
    eq_str = arguments.get("equation", "")
    var_str = arguments.get("variable", "x")
    var = Symbol(var_str)
    eq = eval(eq_str, {"__builtins__": {}}, SAFE_SYMPY_ENV)
    sol = solve(eq, var)
    return f"Solutions for {var_str}: {sol}\nLaTeX: {latex(sol)}"

def handle_simplify(arguments):
    expr_str = arguments.get("expression", "")
    expr = eval(expr_str, {"__builtins__": {}}, SAFE_SYMPY_ENV)
    simp = simplify(expr)
    return f"Simplified: {simp}\nLaTeX: {latex(simp)}"

def handle_diff(arguments):
    expr_str = arguments.get("expression", "")
    var_str = arguments.get("variable", "x")
    order = int(arguments.get("order", 1))
    var = Symbol(var_str)
    expr = eval(expr_str, {"__builtins__": {}}, SAFE_SYMPY_ENV)
    d = diff(expr, var, order)
    return f"Derivative d^{order}/d{var_str}^{order}: {d}\nLaTeX: {latex(d)}"

def handle_integrate(arguments):
    expr_str = arguments.get("expression", "")
    var_str = arguments.get("variable", "x")
    var = Symbol(var_str)
    expr = eval(expr_str, {"__builtins__": {}}, SAFE_SYMPY_ENV)
    lower = arguments.get("lower_limit")
    upper = arguments.get("upper_limit")
    if lower is not None and upper is not None:
        l = eval(str(lower), {"__builtins__": {}}, SAFE_SYMPY_ENV)
        u = eval(str(upper), {"__builtins__": {}}, SAFE_SYMPY_ENV)
        res = integrate(expr, (var, l, u))
    else:
        res = integrate(expr, var)
    return f"Integral: {res}\nLaTeX: {latex(res)}"

TOOLS = [
    {
        "name": "calculate_cas",
        "description": "Evaluate mathematical and symbolic expressions with SymPy (derivatives, integrals, matrices, series, limits, algebra).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "expression": {
                    "type": "string",
                    "description": "Expression or SymPy function call, e.g. 'solve(x**2 - 5*x + 6, x)', 'diff(sin(x)*exp(x), x)', 'Matrix([[1, 2], [3, 4]]).det()'"
                }
            },
            "required": ["expression"]
        }
    },
    {
        "name": "solve_equation",
        "description": "Solve algebraic equations symbolically using SymPy.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "equation": {
                    "type": "string",
                    "description": "Equation expression (e.g. 'Eq(x**2 - 4, 0)' or 'x**2 - 4')"
                },
                "variable": {
                    "type": "string",
                    "description": "Variable to solve for (default: 'x')"
                }
            },
            "required": ["equation"]
        }
    },
    {
        "name": "simplify_expression",
        "description": "Algebraically simplify a mathematical expression.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "expression": {
                    "type": "string",
                    "description": "Mathematical expression to simplify"
                }
            },
            "required": ["expression"]
        }
    },
    {
        "name": "differentiate_expression",
        "description": "Calculate symbolic derivatives.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "expression": {
                    "type": "string",
                    "description": "Expression to differentiate"
                },
                "variable": {
                    "type": "string",
                    "description": "Variable (default 'x')"
                },
                "order": {
                    "type": "integer",
                    "description": "Order of differentiation (default 1)"
                }
            },
            "required": ["expression"]
        }
    },
    {
        "name": "integrate_expression",
        "description": "Calculate symbolic indefinite or definite integrals.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "expression": {
                    "type": "string",
                    "description": "Expression to integrate"
                },
                "variable": {
                    "type": "string",
                    "description": "Variable of integration (default 'x')"
                },
                "lower_limit": {
                    "type": "string",
                    "description": "Optional lower limit"
                },
                "upper_limit": {
                    "type": "string",
                    "description": "Optional upper limit"
                }
            },
            "required": ["expression"]
        }
    }
]

TOOL_HANDLERS = {
    "calculate_cas": handle_calculate,
    "solve_equation": handle_solve,
    "simplify_expression": handle_simplify,
    "differentiate_expression": handle_diff,
    "integrate_expression": handle_integrate
}

def send_response(response_dict):
    out = json.dumps(response_dict)
    sys.stdout.write(out + "\n")
    sys.stdout.flush()

def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stdin, 'reconfigure'):
        sys.stdin.reconfigure(encoding='utf-8')

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
        except Exception as e:
            sys.stderr.write(f"Invalid JSON: {e}\n")
            continue

        req_id = req.get("id")
        method = req.get("method")
        params = req.get("params", {})

        if method == "initialize":
            send_response({
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {
                        "tools": {}
                    },
                    "serverInfo": {
                        "name": "sympy-cas-server",
                        "version": "1.0.0"
                    }
                }
            })
        elif method == "notifications/initialized":
            pass
        elif method == "ping":
            send_response({
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {}
            })
        elif method == "tools/list":
            send_response({
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "tools": TOOLS
                }
            })
        elif method == "tools/call":
            tool_name = params.get("name")
            tool_args = params.get("arguments", {})
            handler = TOOL_HANDLERS.get(tool_name)
            if not handler:
                send_response({
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {
                        "content": [{"type": "text", "text": f"Unknown tool: {tool_name}"}],
                        "isError": True
                    }
                })
            else:
                try:
                    res_text = handler(tool_args)
                    send_response({
                        "jsonrpc": "2.0",
                        "id": req_id,
                        "result": {
                            "content": [{"type": "text", "text": str(res_text)}],
                            "isError": False
                        }
                    })
                except Exception as e:
                    err_details = traceback.format_exc()
                    send_response({
                        "jsonrpc": "2.0",
                        "id": req_id,
                        "result": {
                            "content": [{"type": "text", "text": f"Execution error: {str(e)}\n{err_details}"}],
                            "isError": True
                        }
                    })
        else:
            if req_id is not None:
                send_response({
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "error": {
                        "code": -32601,
                        "message": f"Method '{method}' not found"
                    }
                })

if __name__ == "__main__":
    main()
