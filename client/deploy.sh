#!/bin/bash

# Math MCP Client Deployment Script

echo "🚀 Deploying Math MCP Client..."
echo "==================================="

# Check if Wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Please install it with: npm install -g wrangler"
    exit 1
fi

# Deploy with Wrangler
echo "📦 Deploying with Wrangler..."
npx wrangler@latest deploy

echo ""
echo "✅ Deployment complete! Your client is now available at:"
echo "https://mcp-math-client.dinas.workers.dev"
echo ""
echo "🔗 It connects to your MCP server at:"
echo "https://mcp-math-server.dinas.workers.dev"
echo ""
echo "📊 Ready for mathematical operations!" 