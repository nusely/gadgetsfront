'use client';

import dynamic from 'next/dynamic';

// Import ShopContent as client-only to avoid hydration issues
const ShopContent = dynamic(() => import('./ShopContent').then(mod => ({ default: mod.ShopContent })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7A19] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    </div>
  )
});

export function ShopClientWrapper() {
  return <ShopContent />;
}
