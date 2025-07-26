"use client"

import SparkleSection from '@/components/ui/sparkle-section';

export default function SparkleDemoPage() {
  return (
    <div className="min-h-screen bg-white">
      <SparkleSection>
        {/* デモコンテンツ */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Sparkle Design Community
          </h1>
          <p className="text-gray-600 leading-relaxed">
            このセクションはFigmaデザインに基づいて作成されたReactコンポーネントです。
            白い背景、適切なパディング、グレーのボーダー、角丸、そしてサムネイル画像を含む構造になっています。
          </p>
          <div className="flex gap-4 pt-4">
            <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
              アクション1
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
              アクション2
            </button>
          </div>
        </div>
      </SparkleSection>
    </div>
  );
} 