const { execSync } = require('child_process');
const fs = require('fs');

// Simple test to call MCP tools via JSON RPC
function callMCPTool(toolName, args = {}) {
    const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
            name: toolName,
            arguments: args
        }
    };
    
    // Save request to temp file
    fs.writeFileSync('/tmp/mcp-request.json', JSON.stringify(request));
    
    try {
        // Use node to send request to MCP server
        const response = execSync(`echo '${JSON.stringify(request)}' | node -e "
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            
            rl.on('line', (line) => {
                console.log('Request:', line);
                rl.close();
            });
        "`, { encoding: 'utf8' });
        
        return response;
    } catch (error) {
        console.error('Error calling MCP tool:', error.message);
        return null;
    }
}

// Test getting calls module fields
console.log('Testing MCP tools...');
const result = callMCPTool('crm_get_module_fields', { module_name: 'Calls' });
console.log('Result:', result);