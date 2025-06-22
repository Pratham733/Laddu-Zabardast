// "use client";
// import React from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// // import { ProductDetails } from '@/components/ProductDetails';

// // This page expects a query param: ?id=PRODUCT_ID_OR_SLUG
// export default function ProductDetailsPage() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const productId = searchParams ? searchParams.get('id') : null;

//   if (!productId) {
//     return (
//       <div className="container mx-auto p-8 text-center text-red-500 min-h-[80vh] flex items-center justify-center">
//         No product selected.
//       </div>
//     );
//   }

//   return (
//     <div className="w-full min-h-[80vh] bg-background flex items-center justify-center">
//       <div className="w-full max-w-5xl">
//         {/* <ProductDetails productId={productId} onBack={() => router.back()} /> */}
//       </div>
//     </div>
//   );
// }
