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
async function addUser(name: string, email: string, password: string) {
    try {
        const response = await fetch(`${apiUrl}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, email, password }),
        });
        if (!response.ok) {
            console.error(`Failed to add user: ${response.status} ${response.statusText}`);
            return {
                success: false,
                data: null,
                message: `Failed to add user: ${response.status} ${response.statusText}`
            };
        }
        const data = await response.json();
        return {
            success: true,
            data: data,
            message: "User added successfully"
        };
    } catch (error) {
        console.error(`Failed to add user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return {
            success: false,
            data: null,
            message: `Failed to add user: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

mcpServer.tool(
    "addUser",
    "Add a user to the database",
    {
        name: z.string().min(1).max(255),
        email: z.string().email(),
        password: z.string().min(6).max(255),
    },
    async ({ name, email, password }) => {
        try {
            const result = await addUser(name, email, password);
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(result, null, 2)
                }]
            };
        } catch (error) {
            return {
                content: [{
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                }],
                isError: true
            };
        }
    }
);

/*
 ユーザーを取得するツールを定義
*/
async function getUser(id: string) {
    try {
        const response = await fetch(`${apiUrl}/${id}`);
        if (!response.ok) {
            if (response.status === 404) {
                console.error(`User with id '${id}' not found`);
                return {
                    success: false,
                    data: null,
                    message: `User with id '${id}' not found`
                };
            }
            console.error(`Failed to get user: ${response.status} ${response.statusText}`);
            return {
                success: false,
                data: null,
                message: `Failed to get user: ${response.status} ${response.statusText}`
            };
        }
        const data = await response.json();
        return {
            success: true,
            data: data,
            message: "User retrieved successfully"
        };
    } catch (error) {
        console.error(`Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return {
            success: false,
            data: null,
            message: `Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

mcpServer.tool(
    "getUser",
    "Get a user by id from the database",
    {
        id: z.string().min(1).max(255),
    },
    async ({ id }) => {
        try {
            const result = await getUser(id);
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(result, null, 2)
                }]
            };
        } catch (error) {
            return {
                content: [{
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                }],
                isError: true
            };
        }
    }
);

/*
 ユーザーを削除するツールを定義
*/
async function deleteUser(id: string) {
    try {
        const response = await fetch(`${apiUrl}/${id}`, {
            method: "DELETE",
        });
        if (!response.ok) {
            if (response.status === 404) {
                console.error(`User with id '${id}' not found`);
                return {
                    success: false,
                    data: null,
                    message: `User with id '${id}' not found`
                };
            }
            console.error(`Failed to delete user: ${response.status} ${response.statusText}`);
            return {
                success: false,
                data: null,
                message: `Failed to delete user: ${response.status} ${response.statusText}`
            };
        }
        const data = await response.json();
        return {
            success: true,
            data: data,
            message: "User deleted successfully"
        };
    } catch (error) {
        console.error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return {
            success: false,
            data: null,
            message: `Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

mcpServer.tool(
    "deleteUser",
    "Delete a user by id from the database",
    {
        id: z.string().min(1).max(255),
    },
    async ({ id }) => {
        try {
            const result = await deleteUser(id);
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(result, null, 2)
                }]
            };
        } catch (error) {
            return {
                content: [{
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                }],
                isError: true
            };
        }
    }
);

// 接続管理の改善
let transports: { [sessionId: string]: SSETransport } = {};

// 接続をクリーンアップする関数
function cleanupTransport(sessionId: string) {
    if (transports[sessionId]) {
        delete transports[sessionId];
        console.log(`Transport cleaned up for session: ${sessionId}`);
    }
}

app.get("/sse", (c) => {
    console.log("SSE Connected.");
    return streamSSE(c, async (stream) => {
        let transport: SSETransport | null = null;
        
        try {
            // SSEトランスポートを作成
            transport = new SSETransport('/messages', stream);
            console.log(`SSE Transport created for session: ${transport.sessionId}`);
            
            // トランスポートを保存
            transports[transport.sessionId] = transport;
            
            // 接続の中断処理を設定
            stream.onAbort(() => {
                if (transport) {
                    cleanupTransport(transport.sessionId);
                    console.log(`SSE Transport aborted for session: ${transport.sessionId}`);
                }
            });
            
            // MCPサーバーに接続
            await mcpServer.connect(transport);
            console.log(`MCP Server connected for session: ${transport.sessionId}`);
            
            // 接続を維持（60秒間隔でハートビート）
            while (true) {
                try {
                    await stream.sleep(60_000);
                    // 接続が有効かチェック
                    if (!transport || !transports[transport.sessionId]) {
                        console.log(`Transport no longer valid for session: ${transport?.sessionId}`);
                        break;
                    }
                } catch (error) {
                    console.error(`Error in connection loop for session ${transport?.sessionId}:`, error);
                    break;
                }
            }
        } catch (error) {
            console.error(`Error creating SSE Transport:`, error);
            if (transport) {
                cleanupTransport(transport.sessionId);
            }
        } finally {
            // 最終的なクリーンアップ
            if (transport) {
                cleanupTransport(transport.sessionId);
            }
        }
    });
});

app.post('/messages', async (c) => {
    try {
        const sessionId = c.req.query('sessionId');
        
        if (!sessionId) {
            console.error('No sessionId provided in request');
            return c.text('Session ID is required', 400);
        }
        
        const transport = transports[sessionId];
        
        if (!transport) {
            console.error(`No transport found for sessionId: ${sessionId}`);
            return c.text('No transport found for sessionId', 400);
        }
        
        // メッセージを処理
        const result = await transport.handlePostMessage(c);
        return result;
        
    } catch (error) {
        console.error('Error handling POST message:', error);
        return c.text('Internal server error', 500);
    }
});

// ヘルスチェックエンドポイントを追加
app.get('/health', (c) => {
    return c.json({
        status: 'ok',
        activeConnections: Object.keys(transports).length,
        timestamp: new Date().toISOString()
    });
});

// サーバーを起動
serve({
    fetch: app.fetch,
    port: port,
});

console.log(`MCP Server is running on http://localhost:${port}`);
console.log(`SSE is running on http://localhost:${port}/sse`);
console.log(`Health check available at http://localhost:${port}/health`);