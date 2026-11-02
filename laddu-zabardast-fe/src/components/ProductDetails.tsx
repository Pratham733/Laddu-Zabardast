"use client";

// --- PRODUCT DETAILS FUNCTIONALITY TEMPORARILY DISABLED ---
// The following code is commented out to disable product details and review functionality for now.
import React from 'react';
export const ProductDetails = ({ productId, onBack }: { productId: string, onBack?: () => void }) => (
  <div className="p-8 text-center text-lg text-muted-foreground">
    Product details and reviews are temporarily disabled.<br />
    Product ID: <span className="font-mono text-primary">{productId}</span>
    <br />
    <button className="mt-4 px-4 py-2 bg-gray-200 dark:bg-zinc-800 text-gray-800 dark:text-gray-100 rounded hover:bg-gray-300 dark:hover:bg-zinc-700 transition-colors" onClick={onBack}>&larr; Back</button>
  </div>
);
