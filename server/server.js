// Math MCP Worker with WebSocket Support via Durable Objects
// This worker implements the Model Context Protocol (MCP) for mathematical operations
// and supports both HTTP and WebSocket connections

// MathAgent Durable Object class for persistent WebSocket connections
export class MathAgent {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.storage = state.storage;
    this.sessions = new Map();
    this.agentId = null;
    this.name = null;
  }

  // Handle HTTP and WebSocket requests to the Durable Object
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle WebSocket connections
    if (request.headers.get("Upgrade") === "websocket") {
      return this.handleWebSocketConnection(request);
    }

    // Handle initialization
    if (path.endsWith("/init") && request.method === "POST") {
      const data = await request.json();
      this.agentId = data.agentId;
      this.name = data.name;
      
      // Store agent data in durable storage
      await this.storage.put("agentId", this.agentId);
      await this.storage.put("name", this.name);
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Handle MCP requests
    if (path.endsWith("/mcp") && request.method === "POST") {
      const data = await request.json();
      const result = await this.handleMcpRequest(data.request);
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Handle WebSocket endpoint accessed via HTTP
    if (path.endsWith("/websocket")) {
      return new Response("Expected WebSocket connection", { status: 400 });
    }

    // Handle other requests to the Durable Object
    return new Response("Durable Object endpoint", { status: 200 });
  }

  // Handle WebSocket connections
  async handleWebSocketConnection(request) {
    // Create a WebSocket pair
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Accept the WebSocket connection
    server.accept();

    // Generate a unique session ID
    const sessionId = crypto.randomUUID();
    
    // Store the WebSocket connection
    this.sessions.set(sessionId, server);

    // Set up event handlers for the WebSocket
    server.addEventListener("message", async (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Handle different message types
        if (message.type === "mcp_request") {
          const result = await this.handleMcpRequest(message.request);
          server.send(JSON.stringify({
            type: "mcp_response",
            result,
            timestamp: new Date().toISOString()
          }));
        } else if (message.type === "ping") {
          server.send(JSON.stringify({
            type: "pong",
            timestamp: new Date().toISOString()
          }));
        }
      } catch (error) {
        server.send(JSON.stringify({
          type: "error",
          error: error.message,
          timestamp: new Date().toISOString()
        }));
      }
    });

    // Handle WebSocket closure
    server.addEventListener("close", () => {
      this.sessions.delete(sessionId);
    });

    // Handle WebSocket errors
    server.addEventListener("error", () => {
      this.sessions.delete(sessionId);
    });

    // Send a welcome message
    server.send(JSON.stringify({
      type: "connected",
      sessionId,
      agentId: this.agentId,
      timestamp: new Date().toISOString()
    }));

    // Return the client WebSocket
    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  // Handle MCP requests
  async handleMcpRequest(request) {
    const { method, params = {} } = request;
    
    // Execute the requested method
    switch (method) {
      case "discover":
        return getToolDefinitions();
      case "echo":
        return {
          method: "echo",
          params
        };
      case "add":
        return add(params.a, params.b);
      case "subtract":
        return subtract(params.a, params.b);
      case "multiply":
        return multiply(params.a, params.b);
      case "divide":
        return divide(params.a, params.b);
      case "power":
        return power(params.base, params.exponent);
      case "sqrt":
        return sqrt(params.value);
      case "sin":
        return sin(params.angle);
      case "cos":
        return cos(params.angle);
      case "tan":
        return tan(params.angle);
      case "log":
        return log(params.value, params.base);
      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }

  // Broadcast a message to all connected WebSocket clients
  broadcast(message) {
    for (const session of this.sessions.values()) {
      session.send(JSON.stringify(message));
    }
  }
}

/**
 * Math Worker MCP Implementation
 * Provides mathematical operations through the MCP protocol
 */
export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return handleCors(request);
    }

    // Parse the URL to get the path
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Handle different endpoints
      if (path === '/agent' && request.method === 'POST') {
        return handleAgentCreation(request, env);
      } else if (path === '/mcp' && request.method === 'POST') {
        return handleMcpRequest(request, env);
      } else if (path === '/status' && request.method === 'GET') {
        return handleStatusRequest(request);
      } else if (path.startsWith('/agent/')) {
        // Extract agent ID from path
        const agentId = path.split('/')[2];
        
        // Handle WebSocket connection request
        if (path.endsWith('/websocket')) {
          return handleWebSocketConnection(request, agentId, env);
        }
        
        // Handle other agent-specific requests
        return handleAgentRequest(request, agentId, env);
      } else {
        return new Response('Not found', { status: 404 });
      }
    } catch (error) {
      console.error('Error handling request:', error);
      return addCorsHeaders(
        new Response(JSON.stringify({
          error: error.message || 'An unknown error occurred'
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
    }
  }
};

/**
 * Handle WebSocket connection requests
 */
async function handleWebSocketConnection(request, agentId, env) {
  // Validate agent ID
  if (!agentId || !agentId.startsWith("agent-")) {
    return addCorsHeaders(new Response("Invalid agent ID", { status: 400 }));
  }

  try {
    // Get Durable Object stub for the agent
    const id = env.MATH_AGENT.idFromName(agentId);
    const stub = env.MATH_AGENT.get(id);
    
    // Forward the request to the Durable Object
    return await stub.fetch(request);
  } catch (error) {
    return addCorsHeaders(new Response(`Error establishing WebSocket connection: ${error.message}`, { status: 500 }));
  }
}

/**
 * Handle agent-specific requests
 */
async function handleAgentRequest(request, agentId, env) {
  // Validate agent ID
  if (!agentId || !agentId.startsWith("agent-")) {
    return addCorsHeaders(new Response("Invalid agent ID", { status: 400 }));
  }

  try {
    // Get Durable Object stub for the agent
    const id = env.MATH_AGENT.idFromName(agentId);
    const stub = env.MATH_AGENT.get(id);
    
    // Forward the request to the Durable Object
    return await stub.fetch(request);
  } catch (error) {
    return addCorsHeaders(new Response(`Error handling agent request: ${error.message}`, { status: 500 }));
  }
}

/**
 * Handle agent creation requests
 */
async function handleAgentCreation(request, env) {
  // Only allow POST requests
  if (request.method !== "POST") {
    return addCorsHeaders(new Response("Method not allowed", { status: 405 }));
  }

  try {
    // Parse request body
    const body = await request.json();
    const name = body.name || "anonymous";
    
    // Generate a unique agent ID
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const agentId = `agent-${timestamp}-${randomId}`;
    
    // Create a Durable Object for the agent
    const id = env.MATH_AGENT.idFromName(agentId);
    const stub = env.MATH_AGENT.get(id);
    
    // Initialize the agent
    await stub.fetch(new Request(`https://dummy-url/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId, name })
    }));
    
    // Return the agent ID
    return addCorsHeaders(new Response(JSON.stringify({ agentId }), {
      headers: { "Content-Type": "application/json" }
    }));
  } catch (error) {
    return addCorsHeaders(new Response(`Error creating agent: ${error.message}`, { status: 500 }));
  }
}

/**
 * Handle MCP protocol requests
 */
async function handleMcpRequest(request, env) {
  // Only allow POST requests
  if (request.method !== "POST") {
    return addCorsHeaders(new Response("Method not allowed", { status: 405 }));
  }

  try {
    // Parse request body
    const body = await request.json();
    const { agentId, request: mcpRequest } = body;
    
    // Validate agent ID
    if (!agentId || !agentId.startsWith("agent-")) {
      return addCorsHeaders(new Response(JSON.stringify({ error: "Invalid agent ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }));
    }
    
    // Validate MCP request
    if (!mcpRequest || !mcpRequest.method) {
      return addCorsHeaders(new Response(JSON.stringify({ error: "Invalid MCP request" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }));
    }
    
    // Get Durable Object stub for the agent
    const id = env.MATH_AGENT.idFromName(agentId);
    const stub = env.MATH_AGENT.get(id);
    
    // Forward the MCP request to the Durable Object
    const response = await stub.fetch(new Request(`https://dummy-url/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request: mcpRequest })
    }));
    
    // Check if the agent exists
    if (response.status === 404) {
      return addCorsHeaders(new Response(JSON.stringify({ error: "Agent not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      }));
    }
    
    // Process the response
    const result = await response.json();
    
    // Return the result
    return addCorsHeaders(new Response(JSON.stringify({
      result,
      timestamp: new Date().toISOString()
    }), {
      headers: { "Content-Type": "application/json" }
    }));
  } catch (error) {
    return addCorsHeaders(new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    }));
  }
}

/**
 * Handle status requests
 */
async function handleStatusRequest(request) {
  // Only allow GET requests
  if (request.method !== "GET") {
    return addCorsHeaders(new Response("Method not allowed", { status: 405 }));
  }

  // Return status information
  return addCorsHeaders(new Response(JSON.stringify({
    status: "ok",
    timestamp: new Date().toISOString(),
    agentCount: 0 // In a real implementation, this would be tracked
  }), {
    headers: { "Content-Type": "application/json" }
  }));
}

/**
 * Get tool definitions for discovery
 */
function getToolDefinitions() {
  return {
    tools: [
      {
        name: 'add',
        description: 'Add two numbers',
        parameters: {
          type: 'object',
          properties: {
            a: {
              type: 'number',
              description: 'First number'
            },
            b: {
              type: 'number',
              description: 'Second number'
            }
          },
          required: ['a', 'b']
        }
      },
      {
        name: 'subtract',
        description: 'Subtract second number from first number',
        parameters: {
          type: 'object',
          properties: {
            a: {
              type: 'number',
              description: 'First number'
            },
            b: {
              type: 'number',
              description: 'Second number'
            }
          },
          required: ['a', 'b']
        }
      },
      {
        name: 'multiply',
        description: 'Multiply two numbers',
        parameters: {
          type: 'object',
          properties: {
            a: {
              type: 'number',
              description: 'First number'
            },
            b: {
              type: 'number',
              description: 'Second number'
            }
          },
          required: ['a', 'b']
        }
      },
      {
        name: 'divide',
        description: 'Divide first number by second number',
        parameters: {
          type: 'object',
          properties: {
            a: {
              type: 'number',
              description: 'Numerator'
            },
            b: {
              type: 'number',
              description: 'Denominator'
            }
          },
          required: ['a', 'b']
        }
      },
      {
        name: 'power',
        description: 'Raise a number to a power',
        parameters: {
          type: 'object',
          properties: {
            base: {
              type: 'number',
              description: 'Base number'
            },
            exponent: {
              type: 'number',
              description: 'Exponent'
            }
          },
          required: ['base', 'exponent']
        }
      },
      {
        name: 'sqrt',
        description: 'Calculate the square root of a number',
        parameters: {
          type: 'object',
          properties: {
            value: {
              type: 'number',
              description: 'The number to calculate the square root of'
            }
          },
          required: ['value']
        }
      },
      {
        name: 'sin',
        description: 'Calculate the sine of an angle (in radians)',
        parameters: {
          type: 'object',
          properties: {
            angle: {
              type: 'number',
              description: 'Angle in radians'
            }
          },
          required: ['angle']
        }
      },
      {
        name: 'cos',
        description: 'Calculate the cosine of an angle (in radians)',
        parameters: {
          type: 'object',
          properties: {
            angle: {
              type: 'number',
              description: 'Angle in radians'
            }
          },
          required: ['angle']
        }
      },
      {
        name: 'tan',
        description: 'Calculate the tangent of an angle (in radians)',
        parameters: {
          type: 'object',
          properties: {
            angle: {
              type: 'number',
              description: 'Angle in radians'
            }
          },
          required: ['angle']
        }
      },
      {
        name: 'log',
        description: 'Calculate the logarithm of a number with a specified base',
        parameters: {
          type: 'object',
          properties: {
            value: {
              type: 'number',
              description: 'The number to calculate the logarithm of'
            },
            base: {
              type: 'number',
              description: 'The base of the logarithm (default: natural logarithm)'
            }
          },
          required: ['value']
        }
      }
    ]
  };
}

/**
 * Add two numbers
 */
function add(a, b) {
  a = Number(a);
  b = Number(b);
  
  if (isNaN(a) || isNaN(b)) {
    throw new Error('Parameters must be numbers');
  }
  
  return {
    result: a + b,
    operation: 'add',
    a: a,
    b: b
  };
}

/**
 * Subtract second number from first number
 */
function subtract(a, b) {
  a = Number(a);
  b = Number(b);
  
  if (isNaN(a) || isNaN(b)) {
    throw new Error('Parameters must be numbers');
  }
  
  return {
    result: a - b,
    operation: 'subtract',
    a: a,
    b: b
  };
}

/**
 * Multiply two numbers
 */
function multiply(a, b) {
  a = Number(a);
  b = Number(b);
  
  if (isNaN(a) || isNaN(b)) {
    throw new Error('Parameters must be numbers');
  }
  
  return {
    result: a * b,
    operation: 'multiply',
    a: a,
    b: b
  };
}

/**
 * Divide first number by second number
 */
function divide(a, b) {
  a = Number(a);
  b = Number(b);
  
  if (isNaN(a) || isNaN(b)) {
    throw new Error('Parameters must be numbers');
  }
  
  if (b === 0) {
    throw new Error('Cannot divide by zero');
  }
  
  return {
    result: a / b,
    operation: 'divide',
    a: a,
    b: b
  };
}

/**
 * Raise a number to a power
 */
function power(base, exponent) {
  base = Number(base);
  exponent = Number(exponent);
  
  if (isNaN(base) || isNaN(exponent)) {
    throw new Error('Parameters must be numbers');
  }
  
  return {
    result: Math.pow(base, exponent),
    operation: 'power',
    base: base,
    exponent: exponent
  };
}

/**
 * Calculate the square root of a number
 */
function sqrt(value) {
  value = Number(value);
  
  if (isNaN(value)) {
    throw new Error('Parameter must be a number');
  }
  
  if (value < 0) {
    throw new Error('Cannot calculate square root of a negative number');
  }
  
  return {
    result: Math.sqrt(value),
    operation: 'sqrt',
    value: value
  };
}

/**
 * Calculate the sine of an angle (in radians)
 */
function sin(angle) {
  angle = Number(angle);
  
  if (isNaN(angle)) {
    throw new Error('Angle must be a number');
  }
  
  return {
    result: Math.sin(angle),
    operation: 'sin',
    angle: angle
  };
}

/**
 * Calculate the cosine of an angle (in radians)
 */
function cos(angle) {
  angle = Number(angle);
  
  if (isNaN(angle)) {
    throw new Error('Angle must be a number');
  }
  
  return {
    result: Math.cos(angle),
    operation: 'cos',
    angle: angle
  };
}

/**
 * Calculate the tangent of an angle (in radians)
 */
function tan(angle) {
  angle = Number(angle);
  
  if (isNaN(angle)) {
    throw new Error('Angle must be a number');
  }
  
  return {
    result: Math.tan(angle),
    operation: 'tan',
    angle: angle
  };
}

/**
 * Calculate the logarithm of a number with a specified base
 */
function log(value, base) {
  value = Number(value);
  
  if (isNaN(value)) {
    throw new Error('Value must be a number');
  }
  
  if (value <= 0) {
    throw new Error('Value must be positive for logarithm');
  }
  
  let result;
  let operation;
  
  if (base) {
    base = Number(base);
    
    if (isNaN(base)) {
      throw new Error('Base must be a number');
    }
    
    if (base <= 0 || base === 1) {
      throw new Error('Base must be positive and not equal to 1');
    }
    
    result = Math.log(value) / Math.log(base);
    operation = 'log_base';
  } else {
    result = Math.log(value);
    operation = 'ln';
  }
  
  return {
    result: result,
    operation: operation,
    value: value,
    base: base
  };
}

/**
 * Handle CORS preflight requests
 */
function handleCors(request) {
  return addCorsHeaders(new Response(null, { status: 204 }));
}

/**
 * Add CORS headers to a response
 */
function addCorsHeaders(response) {
  const headers = new Headers(response.headers);
  
  // Add CORS headers
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  headers.set('Access-Control-Max-Age', '86400');
  
  // Create a new response with the CORS headers
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
} 