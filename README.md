# WebSockets MCP Math Demo

A reference implementation demonstrating the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) over WebSockets using Cloudflare Workers and Durable Objects.

## Overview

This repository provides a reference implementation of MCP over WebSockets. It showcases:

- Complete MCP client-server architecture
- Persistent stateful sessions via Durable Objects
- Bidirectional real-time communication over WebSockets
- Tool discovery and invocation
- Deployment using Cloudflare Workers

## Technical Overview

### Architecture

This project demonstrates a full MCP implementation over WebSockets with both client and server components:

```
┌─────────────────┐                 ┌─────────────────┐
│                 │                 │                 │
│  MCP Client     │◄───WebSocket───►│  MCP Server     │
│  (CF Worker)    │                 │  (CF Worker)    │
│                 │      HTTP       │                 │
└─────────────────┘───────────────►└─────────────────┘
                                        │
                                        │ State Persistence
                                        ▼
                                  ┌─────────────────┐
                                  │  Durable Object │
                                  │  (MathAgent)    │
                                  │                 │
                                  └─────────────────┘
```

- **Client**: A Cloudflare Worker that serves the HTML/JS client application
- **Server**: A Cloudflare Worker that implements the MCP protocol with tool endpoints
- **Durable Objects**: Maintains persistent state for each agent session

### WebSocket Implementation

The implementation supports both HTTP and WebSocket transports:

1. **Connection Establishment**:
   - Client creates an agent via HTTP POST
   - Client establishes WebSocket connection to `/agent/{agentId}/websocket`
   - Server maintains the connection in a Durable Object

2. **Message Format**:
   ```json
   // Client to Server
   {
     "type": "mcp_request",
     "request": {
       "method": "add",
       "params": { "a": 5, "b": 3 }
     }
   }

   // Server to Client
   {
     "type": "mcp_response",
     "result": {
       "result": 8,
       "operation": "add",
       "a": 5,
       "b": 3
     },
     "timestamp": "2023-05-01T12:34:56.789Z"
   }
   ```

3. **Connection Management**:
   - Ping/pong heartbeat mechanism
   - Automatic reconnection
   - Session tracking

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (Cloudflare Workers CLI)
- Cloudflare account

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/mcp-websockets-demo.git
   cd mcp-websockets-demo/math-mcp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Deploy the server:
   ```bash
   cd server
   wrangler deploy
   ```

4. Deploy the client:
   ```bash
   cd ../client
   wrangler deploy
   ```

5. Note the deployed URLs for both workers, you'll need them to use the application.

### Usage

#### Web Interface

1. Open the client URL in your browser. The interface allows you to:
   - Connect to the MCP server
   - Run math operations
   - View the WebSocket message log

#### Programmatic API

You can also use the MCP server programmatically:

**HTTP Example:**

```javascript
// Create an agent
const agentResponse = await fetch('https://your-server.workers.dev/agent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'MathAgent' })
});
const { agentId } = await agentResponse.json();

// Make an MCP request
const result = await fetch('https://your-server.workers.dev/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentId,
    request: {
      method: 'add',
      params: { a: 5, b: 3 }
    }
  })
});
```

**WebSocket Example:**

```javascript
// Create an agent first via HTTP (see above)

// Establish WebSocket connection
const ws = new WebSocket(`wss://your-server.workers.dev/agent/${agentId}/websocket`);

// Listen for messages
ws.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
});

// Send an MCP request
ws.addEventListener('open', () => {
  ws.send(JSON.stringify({
    type: 'mcp_request',
    request: {
      method: 'add',
      params: { a: 5, b: 3 }
    }
  }));
});

## WebSocket MCP Protocol Specification

This implementation proposes the following extensions to the MCP protocol for WebSocket support:

### 1. Transport Layer

The WebSocket transport extends MCP with these characteristics:

- **Bidirectional Communication**: Both client and server can initiate messages
- **Persistent Connection**: Long-lived connection reduces overhead
- **Real-time Updates**: Enables server-initiated notifications and streaming results
- **Reduced Latency**: Eliminates HTTP request overhead for frequent interactions

### 2. Message Envelope

All WebSocket messages are wrapped in an envelope with a `type` field:

```json
{
  "type": "message_type",
  "payload": { ... },
  "timestamp": "ISO-8601 timestamp"
}
```

Common message types include:

- `mcp_request`: Client to server MCP method call
- `mcp_response`: Server to client response
- `ping`/`pong`: Connection health checks
- `error`: Error notifications
- `notification`: Server-initiated notifications

### 3. Connection Lifecycle

1. **Initialization**: Client creates an agent via HTTP before establishing WebSocket
2. **Connection**: Client connects to a WebSocket endpoint specific to the agent
3. **Heartbeat**: Client sends periodic pings to maintain the connection
4. **Termination**: Either side can close the connection

### 4. Implementation Considerations

When implementing WebSocket support for MCP:

- **State Management**: Handle reconnection and state recovery
- **Message Ordering**: Implement sequencing for reliable message ordering
- **Error Handling**: Gracefully handle connection errors and message failures
- **Security**: Apply same authentication mechanisms as HTTP transport

## Key Code Components

Here are the key components for implementing WebSocket MCP:

### Server-Side WebSocket Handling

```javascript
// Handle WebSocket connections
async function handleWebSocketConnection(request, agentId, env) {
  // Get Durable Object stub for the agent
  const id = env.MATH_AGENT.idFromName(agentId);
  const stub = env.MATH_AGENT.get(id);
  
  // Forward the request to the Durable Object
  return await stub.fetch(request);
}

// Durable Object implementation
export class MathAgent {
  // Handle WebSocket connections
  async handleWebSocketConnection(request) {
    // Create a WebSocket pair
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    
    // Accept the WebSocket connection
    server.accept();
    
    // Set up event handlers for the WebSocket
    server.addEventListener("message", async (event) => {
      const message = JSON.parse(event.data);
      
      // Handle different message types
      if (message.type === "mcp_request") {
        const result = await this.handleMcpRequest(message.request);
        server.send(JSON.stringify({
          type: "mcp_response",
          result,
          timestamp: new Date().toISOString()
        }));
      }
    });
    
    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }
}
```

### Client-Side WebSocket Usage

```javascript
// Connect WebSocket
function connectWebSocket(agentId, serverUrl) {
  const ws = new WebSocket(`${serverUrl}/agent/${agentId}/websocket`);
  
  ws.onopen = () => {
    console.log('WebSocket connection established');
  };
  
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    
    // Handle different message types
    if (message.type === 'mcp_response') {
      handleMcpResponse(message);
    }
  };
  
  return ws;
}

// Send MCP request
function sendMcpRequest(ws, method, params) {
  ws.send(JSON.stringify({
    type: 'mcp_request',
    request: {
      method,
      params
    },
    timestamp: new Date().toISOString()
  }));
}
```

## Integration with TypeScript SDK

This reference implementation can be used to extend the [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) with WebSocket support:

```typescript
import { MCPClient } from '@modelcontextprotocol/typescript-sdk';

// Create WebSocket transport
class WebSocketTransport implements MCPTransport {
  private ws: WebSocket;
  private pendingRequests: Map<string, {resolve, reject}>;
  
  constructor(serverUrl: string, agentId: string) {
    this.ws = new WebSocket(`${serverUrl}/agent/${agentId}/websocket`);
    this.pendingRequests = new Map();
    
    this.ws.addEventListener('message', this.handleMessage.bind(this));
  }
  
  async send(method: string, params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestId = crypto.randomUUID();
      
      this.pendingRequests.set(requestId, { resolve, reject });
      
      this.ws.send(JSON.stringify({
        type: 'mcp_request',
        request: { method, params },
        requestId
      }));
    });
  }
  
  private handleMessage(event: MessageEvent) {
    const message = JSON.parse(event.data);
    
    if (message.type === 'mcp_response' && message.requestId) {
      const pending = this.pendingRequests.get(message.requestId);
      if (pending) {
        pending.resolve(message.result);
        this.pendingRequests.delete(message.requestId);
      }
    }
  }
}

// Use transport with MCP client
const transport = new WebSocketTransport('wss://example.com', 'agent-123');
const client = new MCPClient({ transport });

// Use MCP methods as usual
const result = await client.invoke('add', { a: 5, b: 3 });
```

## Advantages of WebSocket MCP

Adding WebSocket support to MCP provides several advantages:

1. **Lower Latency**: Perfect for contexts requiring rapid interactions
   - High-frequency trading
   - Real-time collaborative environments
   - Interactive agents requiring quick responses

2. **Bidirectional Communication**: Enables new interaction patterns
   - Server can push updates without client polling
   - Streaming large responses in chunks
   - Push notifications for external events

3. **Reduced Network Overhead**: More efficient for frequent communications
   - No HTTP header overhead for each request
   - Connection setup cost amortized over multiple requests
   - Especially helpful on mobile networks

4. **Stateful Sessions**: Simplifies maintaining conversation context
   - Server can associate state with the WebSocket connection
   - Client doesn't need to send full context with each request
   - Easier to implement streaming responses and partial updates

## Challenges and Solutions

WebSockets also introduce challenges that this implementation addresses:

1. **Connection Management**:
   - **Challenge**: WebSockets can disconnect unexpectedly
   - **Solution**: Heartbeat mechanism and automatic reconnection

2. **Stateless Workers**:
   - **Challenge**: Cloudflare Workers are stateless by default
   - **Solution**: Durable Objects maintain connection state

3. **Request/Response Pairing**:
   - **Challenge**: Matching responses to requests over a shared channel
   - **Solution**: Message ID tracking and correlation

4. **Error Handling**:
   - **Challenge**: Managing connection failures gracefully
   - **Solution**: Structured error responses and reconnection logic

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
