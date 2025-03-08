/**
 * Math MCP Client Worker
 * This worker serves the MCP client HTML and handles requests
 */

// HTML content of the client
const HTML_CONTENT = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Math MCP Client</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
    <style>
        :root {
            --primary-color: #2563eb; /* Professional blue */
            --primary-light: #93c5fd;
            --primary-dark: #1e40af;
            --accent-color: #0ea5e9; /* Sky blue */
            --accent-light: #bae6fd;
            --success-color: #10b981; /* Emerald green */
            --warning-color: #f59e0b; /* Amber */
            --error-color: #ef4444; /* Red */
            --text-color: #1f2937;
            --text-light: #4b5563;
            --background-color: #f8fafc; /* Light gray background */
            --card-background: #fff;
            --border-color: #e2e8f0;
            --border-radius: 8px;
            --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            --transition: all 0.2s ease;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Inter', Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            background-color: var(--background-color);
            color: var(--text-color);
        }

        h1 {
            font-size: 2.2rem;
            margin-bottom: 0.5rem;
            color: var(--primary-dark);
        }

        h2 {
            font-size: 1.5rem;
            margin-top: 1.5rem;
            margin-bottom: 1rem;
            color: var(--primary-color);
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 0.5rem;
        }

        h3 {
            font-size: 1.2rem;
            margin-top: 1rem;
            margin-bottom: 0.5rem;
            color: var(--text-color);
        }

        p {
            margin-bottom: 1rem;
        }

        .subtitle {
            font-size: 1.1rem;
            color: var(--text-light);
            margin-bottom: 2rem;
        }

        .card {
            background-color: var(--card-background);
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
            margin-bottom: 20px;
            padding: 20px;
            overflow: hidden;
        }

        .input-group {
            margin-bottom: 20px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: var(--text-color);
        }

        input, select {
            width: 100%;
            padding: 10px;
            border-radius: var(--border-radius);
            border: 1px solid var(--border-color);
            font-size: 16px;
            transition: var(--transition);
            font-family: 'Inter', Arial, sans-serif;
        }

        input:focus, select:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
        }

        button {
            padding: 10px 16px;
            border-radius: var(--border-radius);
            border: none;
            background-color: var(--primary-color);
            color: white;
            font-weight: 600;
            cursor: pointer;
            margin-right: 10px;
            transition: var(--transition);
            font-family: 'Inter', Arial, sans-serif;
            font-size: 16px;
        }

        button:hover {
            background-color: var(--primary-dark);
        }

        button:disabled {
            background-color: var(--border-color);
            cursor: not-allowed;
        }

        .result {
            font-size: 1.5rem;
            font-weight: 600;
            margin-top: 10px;
            color: var(--primary-dark);
        }

        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }

        .connected {
            background-color: var(--success-color);
            box-shadow: 0 0 8px var(--success-color);
        }

        .disconnected {
            background-color: var(--error-color);
            box-shadow: 0 0 8px var(--error-color);
        }

        .connection-status {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
            font-weight: 600;
        }

        pre {
            background-color: #f1f5f9;
            padding: 15px;
            border-radius: var(--border-radius);
            overflow-x: auto;
            font-family: monospace;
            font-size: 14px;
            margin-top: 10px;
        }

        .log-container {
            height: 200px;
            overflow-y: auto;
            background-color: #f8fafc;
            border: 1px solid var(--border-color);
            padding: 15px;
            border-radius: var(--border-radius);
            font-family: monospace;
            font-size: 14px;
            margin-top: 10px;
        }

        .log-entry {
            margin-bottom: 5px;
            line-height: 1.4;
        }

        .log-sent {
            background-color: rgba(37, 99, 235, 0.1);
            padding: 5px;
            border-radius: var(--border-radius);
        }

        .log-received {
            background-color: rgba(16, 185, 129, 0.1);
            padding: 5px;
            border-radius: var(--border-radius);
        }

        .log-error {
            background-color: rgba(239, 68, 68, 0.1);
            padding: 5px;
            border-radius: var(--border-radius);
            color: var(--error-color);
        }

        .log-info {
            background-color: rgba(14, 165, 233, 0.1);
            padding: 5px;
            border-radius: var(--border-radius);
        }

        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid var(--border-color);
            color: var(--text-light);
            font-size: 0.9rem;
        }

        .footer a {
            color: var(--primary-color);
            text-decoration: none;
        }

        .footer a:hover {
            text-decoration: underline;
        }

        .info-card {
            margin-bottom: 30px;
            background-color: #f0f9ff; /* Light blue background */
            border-left: 4px solid var(--primary-color);
        }

        .info-content {
            padding: 0 10px;
        }

        .info-content h3 {
            margin-top: 20px;
            color: var(--primary-dark);
            font-size: 1.1rem;
            font-weight: 600;
        }

        .info-content p {
            margin-bottom: 15px;
            line-height: 1.5;
        }

        .info-content ul {
            margin-left: 20px;
            margin-bottom: 15px;
        }

        .info-content li {
            margin-bottom: 8px;
            line-height: 1.4;
        }
    </style>
</head>
<body>
    <h1>Math MCP Client</h1>
    <p class="subtitle">Demo time!</p>

    <div class="card info-card">
        <h2>About</h2>
        <div class="info-content">
            <h3>What is this?</h3>
            <p>This demo shows the Model Context Protocol (MCP) in action - a standardized way for clients (AI agents) to discover and use tools exposed by an MCP server (in this case, we're doing math).</p>
            
            <h3>How it works</h3>
            <ul>
                <li><strong>Agent Creation</strong>: The client creates an agent on the server - basically a session that can access tools and remember state between requests.</li>
                <li><strong>WebSocket Connection</strong>: We establish a WebSocket connection for two-way communication, letting the server push updates when needed.</li>
                <li><strong>Tool Discovery</strong>: The client asks what tools are available (click "Discover Tools" to see the full list).</li>
                <li><strong>Running Operations</strong>: Send requests to run operations like <code>{ method: "add", params: { a: 5, b: 3 } }</code> and get results back.</li>
            </ul>
            
            <h3>Technology</h3>
            <ul>
                <li><strong>Cloudflare Workers</strong>: Powers both the client and server components</li>
                <li><strong>Durable Objects</strong>: Maintains persistent connections and session state</li>
                <li><strong>WebSockets</strong>: Enables real-time communication between client and server</li>
                <li><strong>MCP Protocol</strong>: Handles standardized message exchange and tool discovery</li>
            </ul>
        </div>
    </div>

    <div class="card">
        <h2>Connection</h2>
        <div class="input-group">
            <label for="agent-name">Agent Name:</label>
            <input type="text" id="agent-name" value="MathMCPClient">
        </div>
        <div class="input-group">
            <label for="mcp-url">MCP Server URL:</label>
            <input type="text" id="mcp-url" value="https://math-mcp-server.dinas.workers.dev" style="width: 100%;">
        </div>
        <div class="connection-status">
            <span class="status-indicator disconnected" id="status-indicator"></span>
            <span id="connection-status">Disconnected</span>
        </div>
        <button id="connect-btn">Connect</button>
        <button id="disconnect-btn" disabled>Disconnect</button>
        <div class="input-group">
            <label>Agent ID: <span id="agent-id">None</span></label>
        </div>
    </div>

    <div class="card">
        <h2>Basic Math</h2>
        <div class="input-group">
            <label for="operation">Operation:</label>
            <select id="operation">
                <option value="add">Addition</option>
                <option value="subtract">Subtraction</option>
                <option value="multiply">Multiplication</option>
                <option value="divide">Division</option>
            </select>
        </div>
        <div class="input-group">
            <label for="num1">First Number:</label>
            <input type="number" id="num1" value="5">
        </div>
        <div class="input-group">
            <label for="num2">Second Number:</label>
            <input type="number" id="num2" value="3">
        </div>
        <button id="calculate-basic" disabled>Calculate</button>
        <div class="result" id="basic-result">Result will appear here</div>
    </div>

    <div class="card">
        <h2>Advanced Math</h2>
        <div class="input-group">
            <label for="adv-operation">Operation:</label>
            <select id="adv-operation">
                <option value="power">Power</option>
                <option value="sqrt">Square Root</option>
                <option value="sin">Sine</option>
                <option value="cos">Cosine</option>
                <option value="tan">Tangent</option>
                <option value="log">Logarithm</option>
            </select>
        </div>
        <div class="input-group">
            <label for="value">Value:</label>
            <input type="number" id="value" value="16">
        </div>
        <div class="input-group" id="exponent-group">
            <label for="exponent">Exponent/Base:</label>
            <input type="number" id="exponent" value="2">
        </div>
        <button id="calculate-adv" disabled>Calculate</button>
        <div class="result" id="adv-result">Result will appear here</div>
    </div>

    <div class="card">
        <h2>Tool Discovery</h2>
        <button id="discover-btn" disabled>Discover Tools</button>
        <pre id="tools-result">No tools discovered yet</pre>
    </div>

    <div class="card">
        <h2>Connection Log</h2>
        <div id="ws-log" class="log-container"></div>
    </div>

    <div class="footer">
        <p>Powered by Model Context Protocol | Built on Cloudflare</p>
    </div>

    <script>
        // Global variables
        let agentId = null;
        let ws = null;
        
        // DOM Elements
        const agentName = document.getElementById('agent-name');
        const mcpUrl = document.getElementById('mcp-url');
        const statusIndicator = document.getElementById('status-indicator');
        const connectionStatus = document.getElementById('connection-status');
        const agentIdElement = document.getElementById('agent-id');
        const connectBtn = document.getElementById('connect-btn');
        const disconnectBtn = document.getElementById('disconnect-btn');
        const calculateBasicBtn = document.getElementById('calculate-basic');
        const calculateAdvBtn = document.getElementById('calculate-adv');
        const discoverBtn = document.getElementById('discover-btn');
        const basicResult = document.getElementById('basic-result');
        const advResult = document.getElementById('adv-result');
        const toolsResult = document.getElementById('tools-result');
        const wsLog = document.getElementById('ws-log');
        
        // Event listeners
        connectBtn.addEventListener('click', connect);
        disconnectBtn.addEventListener('click', disconnect);
        calculateBasicBtn.addEventListener('click', calculateBasic);
        calculateAdvBtn.addEventListener('click', calculateAdvanced);
        discoverBtn.addEventListener('click', discoverTools);
        document.getElementById('adv-operation').addEventListener('change', toggleExponentField);
        
        // Initialize
        toggleExponentField();
        
        // Toggle exponent field visibility based on operation
        function toggleExponentField() {
            const operation = document.getElementById('adv-operation').value;
            const exponentGroup = document.getElementById('exponent-group');
            
            if (operation === 'power' || operation === 'log') {
                exponentGroup.style.display = 'block';
                document.querySelector('label[for="exponent"]').textContent = 
                    operation === 'power' ? 'Exponent:' : 'Base (optional):';
            } else {
                exponentGroup.style.display = 'none';
            }
        }
        
        // Connect to the MCP server
        async function connect() {
            try {
                // Update UI
                statusIndicator.className = 'status-indicator disconnected';
                connectionStatus.textContent = 'Connecting...';
                
                // Create agent
                const response = await fetch(mcpUrl.value + '/agent', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: agentName.value || 'MathMCPClient'
                    })
                });
                
                const data = await response.json();
                
                if (!data.agentId) {
                    throw new Error('Failed to create agent');
                }
                
                agentId = data.agentId;
                
                // Update UI
                agentIdElement.textContent = agentId;
                
                // Connect WebSocket
                connectWebSocket();
                
                // Enable buttons
                disconnectBtn.disabled = false;
                calculateBasicBtn.disabled = false;
                calculateAdvBtn.disabled = false;
                discoverBtn.disabled = false;
                connectBtn.disabled = true;
                
            } catch (error) {
                logMessage('Error connecting: ' + error.message, 'error');
                statusIndicator.className = 'status-indicator disconnected';
                connectionStatus.textContent = 'Connection Failed';
            }
        }
        
        // Disconnect from the MCP server
        function disconnect() {
            // Close WebSocket if open
            if (ws) {
                ws.close();
                ws = null;
            }
            
            // Reset state
            agentId = null;
            agentIdElement.textContent = 'None';
            
            // Update UI
            statusIndicator.className = 'status-indicator disconnected';
            connectionStatus.textContent = 'Disconnected';
            
            // Disable buttons
            disconnectBtn.disabled = true;
            calculateBasicBtn.disabled = true;
            calculateAdvBtn.disabled = true;
            discoverBtn.disabled = true;
            connectBtn.disabled = false;
            
            logMessage('Disconnected from server', 'info');
        }
        
        // Connect WebSocket
        function connectWebSocket() {
            // Convert HTTP to WebSocket protocol
            const wsUrl = mcpUrl.value.replace('https://', 'wss://').replace('http://', 'ws://');
            ws = new WebSocket(wsUrl + '/agent/' + agentId + '/websocket');
            
            ws.onopen = () => {
                statusIndicator.className = 'status-indicator connected';
                connectionStatus.textContent = 'Connected';
                logMessage('WebSocket connection established', 'info');
                
                // Send a ping every 30 seconds to keep the connection alive
                setInterval(() => {
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        const pingMessage = {
                            type: 'ping',
                            timestamp: new Date().toISOString()
                        };
                        ws.send(JSON.stringify(pingMessage));
                        logMessage('SENT: ' + JSON.stringify(pingMessage), 'sent');
                    }
                }, 30000);
            };
            
            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                logMessage('RECEIVED: ' + JSON.stringify(message), 'received');
                
                // Handle different message types
                if (message.type === 'mcp_response') {
                    handleMcpResponse(message);
                }
            };
            
            ws.onerror = (error) => {
                logMessage('WebSocket error: ' + error, 'error');
            };
            
            ws.onclose = () => {
                logMessage('WebSocket connection closed', 'info');
                if (agentId) {
                    // Only update UI if we haven't manually disconnected
                    statusIndicator.className = 'status-indicator disconnected';
                    connectionStatus.textContent = 'Connection Lost';
                }
            };
        }
        
        // Handle MCP response from WebSocket
        function handleMcpResponse(message) {
            // Implementation depends on the specific response
            console.log('Handling MCP response:', message);
        }
        
        // Calculate basic math operations
        function calculateBasic() {
            if (!agentId || !ws || ws.readyState !== WebSocket.OPEN) {
                basicResult.textContent = 'Not connected';
                basicResult.classList.add('error');
                return;
            }
            
            const operation = document.getElementById('operation').value;
            const num1 = parseFloat(document.getElementById('num1').value);
            const num2 = parseFloat(document.getElementById('num2').value);
            
            if (isNaN(num1) || isNaN(num2)) {
                basicResult.textContent = 'Please enter valid numbers';
                basicResult.classList.add('error');
                return;
            }
            
            basicResult.textContent = 'Calculating...';
            basicResult.classList.remove('error');
            
            const request = {
                agentId: agentId,
                request: {
                    method: operation,
                    params: {
                        a: num1,
                        b: num2
                    }
                }
            };
            
            // Send request via HTTP
            fetch(mcpUrl.value + '/mcp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(request)
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    basicResult.textContent = 'Error: ' + data.error;
                    basicResult.classList.add('error');
                } else {
                    basicResult.textContent = data.result.result;
                    basicResult.classList.remove('error');
                }
                logMessage('RECEIVED: ' + JSON.stringify(data), 'received');
            })
            .catch(error => {
                basicResult.textContent = 'Error: ' + error.message;
                basicResult.classList.add('error');
                logMessage('Error: ' + error.message, 'error');
            });
            
            logMessage('SENT: ' + JSON.stringify(request), 'sent');
        }
        
        // Calculate advanced math operations
        function calculateAdvanced() {
            if (!agentId || !ws || ws.readyState !== WebSocket.OPEN) {
                advResult.textContent = 'Not connected';
                advResult.classList.add('error');
                return;
            }
            
            const operation = document.getElementById('adv-operation').value;
            const value = parseFloat(document.getElementById('value').value);
            const exponent = parseFloat(document.getElementById('exponent').value);
            
            if (isNaN(value) || (operation === 'power' && isNaN(exponent))) {
                advResult.textContent = 'Please enter valid numbers';
                advResult.classList.add('error');
                return;
            }
            
            advResult.textContent = 'Calculating...';
            advResult.classList.remove('error');
            
            let params = {};
            
            if (operation === 'power') {
                params = {
                    base: value,
                    exponent: exponent
                };
            } else if (operation === 'sqrt') {
                params = {
                    value: value
                };
            } else if (operation === 'sin' || operation === 'cos' || operation === 'tan') {
                params = {
                    angle: value
                };
            } else if (operation === 'log') {
                params = {
                    value: value,
                    base: exponent
                };
            }
            
            const request = {
                agentId: agentId,
                request: {
                    method: operation,
                    params: params
                }
            };
            
            // Send request via HTTP
            fetch(mcpUrl.value + '/mcp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(request)
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    advResult.textContent = 'Error: ' + data.error;
                    advResult.classList.add('error');
                } else {
                    advResult.textContent = data.result.result;
                    advResult.classList.remove('error');
                }
                logMessage('RECEIVED: ' + JSON.stringify(data), 'received');
            })
            .catch(error => {
                advResult.textContent = 'Error: ' + error.message;
                advResult.classList.add('error');
                logMessage('Error: ' + error.message, 'error');
            });
            
            logMessage('SENT: ' + JSON.stringify(request), 'sent');
        }
        
        // Discover available tools
        function discoverTools() {
            if (!agentId || !ws || ws.readyState !== WebSocket.OPEN) {
                toolsResult.textContent = 'Not connected';
                return;
            }
            
            toolsResult.textContent = 'Discovering tools...';
            
            const request = {
                agentId: agentId,
                request: {
                    method: 'discover'
                }
            };
            
            // Send request via HTTP
            fetch(mcpUrl.value + '/mcp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(request)
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    toolsResult.textContent = 'Error: ' + data.error;
                } else {
                    toolsResult.textContent = JSON.stringify(data, null, 2);
                }
                logMessage('RECEIVED: ' + JSON.stringify(data), 'received');
            })
            .catch(error => {
                toolsResult.textContent = 'Error: ' + error.message;
                logMessage('Error: ' + error.message, 'error');
            });
            
            logMessage('SENT: ' + JSON.stringify(request), 'sent');
        }
        
        // Log a message to the WebSocket log
        function logMessage(message, type) {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry log-' + type;
            logEntry.textContent = '[' + new Date().toLocaleTimeString() + '] ' + message;
            
            wsLog.appendChild(logEntry);
            wsLog.scrollTop = wsLog.scrollHeight;
            
            // Limit log size
            while (wsLog.children.length > 100) {
                wsLog.removeChild(wsLog.firstChild);
            }
        }
    </script>
</body>
</html>`;

/**
 * Handle all requests to the worker
 */
async function handleRequest(request) {
  // Add CORS headers to allow requests from any origin
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  // Serve the HTML content
  return new Response(HTML_CONTENT, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      ...corsHeaders,
    },
  });
}

// Export default function for ES modules syntax
export default {
  async fetch(request, env, ctx) {
    return handleRequest(request);
  }
}; 