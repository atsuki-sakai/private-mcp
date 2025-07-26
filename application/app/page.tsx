"use client"

import { useQuery } from "@tanstack/react-query"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useChat } from "@ai-sdk/react"
import { Textarea } from "@/components/ui/textarea"
import { User, Bot, Loader2 } from "lucide-react"
import { format } from "date-fns"

type User = {
  _id: string
  name: string
  email: string
  password: string
}

export default function Home() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("http://localhost:3000/users", {
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    retry: 3,
    retryDelay: 1000,
  }) as { data: User[], isLoading: boolean, error: Error }

  
  const { messages, input , handleInputChange, handleSubmit } = useChat({
    api: "/api/chat",
    experimental_throttle: 1000,
  })

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-6">ユーザー一覧</h1>
      {isLoading && <p className="text-blue-600">読み込み中...</p>}
      {error && (
        <div className="text-red-600">
          <p>エラー: {error.message}</p>
          <p className="text-sm">バックエンドサーバーが http://localhost:3000 で実行されているか確認してください</p>
        </div>
      )}
      {data && data.length > 0 && (
        <div className="w-full max-w-4xl space-y-6">
          {/* ユーザーテーブル */}
          <div className=" overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>名前</TableHead>
                  <TableHead>メールアドレス</TableHead>
                  <TableHead>パスワード</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-mono text-xs">{user._id}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="font-mono text-xs">{user.password}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-2 border-2 border-gray-300 p-2 rounded-md">
            <h4 className="text-sm font-semibold">メッセージ</h4>
            
            { messages.length > 0 ? messages.map((message) => (
              // チャットバブルの左右寄せをroleで分岐
              <div
                key={message.id}
                className={`flex gap-2 items-end ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {/* ユーザーアイコンまたはボットアイコン */}
                {message.role === "user" ? null : (
                  <div className="w-1/12 flex justify-start">
                    <Bot className="w-4 h-4 text-blue-500" />
                  </div>
                )}
                {/* チャットバブル本体 */}
                <div
                  className={`max-w-[70%] px-4 py-2 rounded-lg text-xs break-words shadow
                    ${message.role === "user"
                      ? "bg-blue-100 text-right ml-auto rounded-br-none"
                      : "bg-gray-100 text-left mr-auto rounded-bl-none"}
                  `}
                >
                  {message.content}
                </div>
                {/* ユーザーアイコン */}
                {message.role === "user" ? (
                  <div className="w-1/12 flex justify-end">
                    <User className="w-4 h-4 text-green-500" />
                  </div>
                ) : null}
              </div>
            )) : <p className="text-xs text-gray-500">メッセージがありません</p>} 
          </div>
          {/* メッセージ入力フォーム */}
          <form onSubmit={handleSubmit} className="">
            <h2 className="text-sm font-semibold mb-4">メッセージ送信</h2>
            <div className="flex gap-3">
              <Textarea 
                placeholder="メッセージを入力してください" 
                className="flex-1"
                value={input}
                rows={12}
                onChange={handleInputChange}
              />
              <Button 
                type="submit"
                variant="outline"
                className="px-6"
              >
                送信
              </Button>
            </div>
          </form>
        </div>
      )}
      {data && data.length === 0 && (
        <p className="text-gray-500">ユーザーデータがありません</p>
      )}
    </div>
  );
}
