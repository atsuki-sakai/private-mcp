"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const zod_1 = require("zod");
const hono_mcp_server_sse_transport_1 = require("hono-mcp-server-sse-transport");
const streaming_1 = require("hono/streaming");
const node_server_1 = require("@hono/node-server");
const isHttps = false;
const host = "localhost";
const port = 8080;
const apiUrl = isHttps ? `https://${host}:${port}/api` : `http://${host}:${port}/api`;
const app = new hono_1.Hono();
const mcpServer = new mcp_js_1.McpServer({
    name: "first-mcp-server",
    version: "1.0.0",
    description: "A simple MCP server",
});
/*
 ユーザーを追加するツールを定義
*/
async function addUser(name, email, password) {
    try {
        const response = await fetch(`${apiUrl}/users`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, email, password }),
        });
        if (!response.ok) {
            console.error(`Failed to add user: ${response.statusText}`);
            return null;
        }
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error("Failed to add user", error);
        return null;
    }
}
mcpServer.tool("addUser", "Add a user to the database", {
    name: zod_1.z.string().min(1).max(255),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6).max(255),
}, async ({ name, email, password }) => {
    return addUser(name, email, password);
});
/*
 ユーザーを取得するツールを定義
*/
async function getUser(id) {
    try {
        const response = await fetch(`${apiUrl}/users/${id}`);
        if (!response.ok) {
            console.error(`Failed to get user: ${response.statusText}`);
            return null;
        }
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error("Failed to get user", error);
        return null;
    }
}
mcpServer.tool("getUser", "Get a user by id from the database", {
    id: zod_1.z.string().min(1).max(255),
}, async ({ id }) => {
    return getUser(id);
});
/*
 ユーザーを削除するツールを定義
*/
async function deleteUser(id) {
    try {
        const response = await fetch(`${apiUrl}/users/${id}`, {
            method: "DELETE",
        });
        if (!response.ok) {
            console.error(`Failed to delete user: ${response.statusText}`);
            return null;
        }
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error("Failed to delete user", error);
        return null;
    }
}
mcpServer.tool("deleteUser", "Delete a user by id from the database", {
    id: zod_1.z.string().min(1).max(255),
}, async ({ id }) => {
    return deleteUser(id);
});
let transports = {};
app.get("/sse", (c) => {
    console.log("SSE Connected.");
    return (0, streaming_1.streamSSE)(c, async (stream) => {
        try {
            const transport = new hono_mcp_server_sse_transport_1.SSETransport('/messeges', stream);
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
    const transport = transports[sessionId];
    if (transport == null) {
        return c.text('No transport found for sessionId', 400);
    }
    return await transport.handlePostMessage(c);
});
(0, node_server_1.serve)({
    fetch: app.fetch,
    port: 3001,
});
