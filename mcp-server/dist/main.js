import { Hono } from "hono";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { SSETransport } from "hono-mcp-server-sse-transport";
import { streamSSE } from "hono/streaming";
import { serve } from "@hono/node-server";
const isHttps = false;
const host = "localhost";
const port = 3001;
const apiUrl = "http://localhost:3000/users";
const app = new Hono();
const mcpServer = new McpServer({
    name: "first-mcp-server",
    version: "1.0.0",
    description: "A simple MCP server",
});
/*
 ユーザーを追加するツールを定義
*/
async function addUser(name, email, password) {
    try {
        const response = await fetch(`${apiUrl}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, email, password }),
        });
        if (!response.ok) {
            throw new Error(`Failed to add user: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return {
            success: true,
            data: data,
            message: "User added successfully"
        };
    }
    catch (error) {
        throw new Error(`Failed to add user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
mcpServer.tool("addUser", "Add a user to the database", {
    name: z.string().min(1).max(255),
    email: z.string().email(),
    password: z.string().min(6).max(255),
}, async ({ name, email, password }) => {
    try {
        const result = await addUser(name, email, password);
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify(result, null, 2)
                }]
        };
    }
    catch (error) {
        return {
            content: [{
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                }],
            isError: true
        };
    }
});
/*
 ユーザーを取得するツールを定義
*/
async function getUser(id) {
    try {
        const response = await fetch(`${apiUrl}/${id}`);
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`User with id '${id}' not found`);
            }
            throw new Error(`Failed to get user: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return {
            success: true,
            data: data,
            message: "User retrieved successfully"
        };
    }
    catch (error) {
        throw new Error(`Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
mcpServer.tool("getUser", "Get a user by id from the database", {
    id: z.string().min(1).max(255),
}, async ({ id }) => {
    try {
        const result = await getUser(id);
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify(result, null, 2)
                }]
        };
    }
    catch (error) {
        return {
            content: [{
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                }],
            isError: true
        };
    }
});
/*
 ユーザーを削除するツールを定義
*/
async function deleteUser(id) {
    try {
        const response = await fetch(`${apiUrl}/${id}`, {
            method: "DELETE",
        });
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`User with id '${id}' not found`);
            }
            throw new Error(`Failed to delete user: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return {
            success: true,
            data: data,
            message: "User deleted successfully"
        };
    }
    catch (error) {
        throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
mcpServer.tool("deleteUser", "Delete a user by id from the database", {
    id: z.string().min(1).max(255),
}, async ({ id }) => {
    try {
        const result = await deleteUser(id);
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify(result, null, 2)
                }]
        };
    }
    catch (error) {
        return {
            content: [{
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                }],
            isError: true
        };
    }
});
// In-memory user storage (replace with database in production)
let users = {};
let userIdCounter = 1;
let transports = {};
app.get("/sse", (c) => {
    console.log("SSE Connected.");
    return streamSSE(c, async (stream) => {
        try {
            const transport = new SSETransport('/messages', stream);
            console.log("SSE Transport created." + transport.sessionId);
            transports[transport.sessionId] = transport;
            stream.onAbort(() => {
                delete transports[transport.sessionId];
                console.log("SSE Transport aborted." + transport.sessionId);
            });
            await mcpServer.connect(transport);
            while (true) {
                // This will keep the connection alive
                // You can also await for a promise that never resolves
                await stream.sleep(60000);
            }
        }
        catch (error) {
            console.error("Error creating SSE Transport", error);
        }
    });
});
app.post('/messages', async (c) => {
    const sessionId = c.req.query('sessionId');
    const transport = transports[sessionId ?? ''];
    if (!transport) {
        return c.text('No transport found for sessionId', 400);
    }
    return await transport.handlePostMessage(c);
});
serve({
    fetch: app.fetch,
    port: port,
});
console.log(`MCP Server is running on http://localhost:${port}`);
console.log(`SSE is running on http://localhost:${port}/sse`);
