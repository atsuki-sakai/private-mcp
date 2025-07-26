import { NextRequest } from "next/server"
import { experimental_createMCPClient as createMCPClient, streamText } from "ai" 
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

const openrouter = createOpenRouter({
    apiKey: process.env.OPEN_ROUTER_API_KEY!,
});

export async function POST(request: NextRequest) {
    let mcpClient: Awaited<ReturnType<typeof createMCPClient>> | null = null;
    
    try {
        // MCPクライアントを作成
        mcpClient = await createMCPClient({
            transport: {
                type: "sse",
                url: "http://localhost:3001/sse",
            }
        });

        // リクエストボディを取得
        const { messages } = await request.json();
        
        // ツールを取得
        const tools = await mcpClient.tools();

        // ストリーミングレスポンスを作成
        const result = streamText({
            model: openrouter.chat('deepseek/deepseek-chat-v3-0324:free'),
            messages: messages,
            tools,
            onFinish: async () => {
                try {
                    if (mcpClient) {
                        await mcpClient.close();
                        console.log('MCP client closed successfully');
                    }
                } catch (error) {
                    console.error('Error closing MCP client:', error);
                }
            },
            onError: async (error) => {
                console.error('Error in streamText:', error);
                try {
                    if (mcpClient) {
                        await mcpClient.close();
                    }
                } catch (closeError) {
                    console.error('Error closing MCP client on error:', closeError);
                }
            }
        });

        return result.toDataStreamResponse();
        
    } catch (error) {
        console.error('Error in POST /api/chat:', error);
        
        // エラーレスポンスを返す
        return new Response(
            JSON.stringify({ 
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            }), 
            { 
                status: 500, 
                headers: { 'Content-Type': 'application/json' } 
            }
        );
    } finally {
        if (mcpClient) {
            await mcpClient.close();
        }
    }
}