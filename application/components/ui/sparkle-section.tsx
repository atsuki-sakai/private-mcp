import React from 'react';
import Image from 'next/image';

// Figmaデザインに基づくSparkleSectionコンポーネント
interface SparkleSectionProps {
  children?: React.ReactNode;
  className?: string;
}

export const SparkleSection: React.FC<SparkleSectionProps> = ({ 
  children, 
  className = "" 
}) => {
  return (
    <div className={`flex flex-col items-stretch min-h-screen p-10 lg:p-20 ${className}`}>
      {/* Content Frame - FigmaのContentノードに対応 */}
      <div className="flex flex-col items-stretch border border-gray-300 rounded-lg overflow-hidden">
        {/* Thumbnail - FigmaのThumbnailノードに対応 */}
        <div className="w-full h-48 relative">
          <Image
            src="/images/thumbnail.png"
            alt="Sparkle Design Thumbnail"
            fill
            className="object-cover"
            priority
          />
        </div>
        
        {/* コンテンツエリア */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SparkleSection; 