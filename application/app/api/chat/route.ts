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
        const mcpUrl = process.env.NODE_ENV === 'development' && process.env.DOCKER 
            ? "http://mcp-server:3001/sse"  // Docker内
            : "http://localhost:3001/sse";   // ローカル
            
        mcpClient = await createMCPClient({
            transport: {
                type: "sse",
                url: mcpUrl,
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
            onFinish: () => {
                // ストリーミング完了後にMCPクライアントをクローズ
                setTimeout(async () => {
                    try {
                        await mcpClient?.close();
                        console.log('MCP client closed after streaming completion');
                    } catch (error) {
                        console.error('Error closing MCP client:', error);
                    }
                }, 100);
            }
        });

        return result.toDataStreamResponse();
        
    } catch (error) {
        console.error('Error in POST /api/chat:', error);
        
        // エラー時にMCPクライアントをクローズ
        if (mcpClient) {
            try {
                await mcpClient.close();
                console.log('MCP client closed due to error');
            } catch (closeError) {
                console.error('Error closing MCP client:', closeError);
            }
        }
        
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
    }
}