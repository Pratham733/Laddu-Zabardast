//src/components/product-card.tsx
import type { Product } from '@/types/product';

// Sample products removed - now using only database products
export const sampleProducts: Product[] = [
  {
    id: '4',
    name: 'Mango Pickle (Aam ka Achar)',
    description: 'Tangy and spicy raw mango pickle, a staple in Indian households.',
    price: 180.00, // Example price in INR
    imageUrl: '/images/bg.png',
    category: 'pickle',
    aiHint: 'mango pickle indian achar',
  },
  {
    id: '5',
    name: 'Lemon Pickle (Nimbu ka Achar)',
    description: 'Sour and spicy lemon pickle, preserved in aromatic spices.',
    price: 160.00, // Example price in INR
    imageUrl: '/images/bg.png',
    category: 'pickle',
    aiHint: 'lemon pickle indian achar',
  },
    {
    id: '6',
    name: 'Mixed Vegetable Pickle',
    description: 'A medley of seasonal vegetables pickled in traditional spices.',
    price: 200.00, // Example price in INR
    imageUrl: '/images/bg.png',
    category: 'pickle',
    aiHint: 'mixed vegetable pickle indian achar',
  },
];
