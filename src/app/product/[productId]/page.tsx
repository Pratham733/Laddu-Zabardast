'use client';

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Product } from "@/types/product";
import { sampleProducts } from "@/data/products";
import type { Review } from '@/types/review';
import { useAuth } from '@/context/auth-context';
import { ProductCard } from '@/components/product-card';
import type { ChangeEvent, FormEvent } from 'react';

const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const response = await fetch(`/api/products/${id}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
};

interface ReviewFormState {
  rating: number;
  comment: string;
}

const ProductReviews: React.FC<{ 
  productId: string; 
  user: { userId: string; name?: string } | null; 
  isAdmin: boolean 
}> = ({ productId, user, isAdmin }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [formState, setFormState] = useState<ReviewFormState>({
    rating: 0,
    comment: ''
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFormChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    setFormState(prev => ({ ...prev, comment: value }));
  };

  useEffect(() => {
    fetch(`/api/products/${productId}/reviews`)
      .then(res => res.json())
      .then(data => {
        setReviews(data.reviews || []);
        if (user) {
          const mine = (data.reviews || []).find((r: Review) => r.userId === user.userId);
          setMyReview(mine || null);
          if (mine) {
            setFormState({
              rating: mine.rating,
              comment: mine.comment
            });
          }
        }
      });
  }, [productId, user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || formState.rating === 0) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/products/${productId}/reviews${editing ? `/${myReview?._id}` : ''}`, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState)
      });

      if (response.ok) {
        const { review } = await response.json();
        if (editing) {
          setReviews(reviews.map(r => r._id === review._id ? review : r));
          setMyReview(review);
        } else {
          setReviews([...reviews, review]);
          setMyReview(review);
        }
        setEditing(false);
        setFormState({ rating: 0, comment: '' });
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    }
    setLoading(false);
  };

  return (
    <div className="mt-8">
      <h3 className="text-2xl font-semibold mb-4">Reviews</h3>
      {reviews.map(review => (
        <div key={review._id} className="bg-card p-4 rounded-lg mb-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <span className="font-semibold">{review.userName}</span>
                <span className="ml-2 text-sm text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={i < review.rating ? "text-yellow-400" : "text-gray-300"}>
                    ★
                  </span>
                ))}
              </div>
            </div>
            {(user?.userId === review.userId || isAdmin) && (
              <button
                className="text-sm text-blue-500 hover:text-blue-700"
                onClick={() => {
                  setEditing(true);
                  setFormState({
                    rating: review.rating,
                    comment: review.comment
                  });
                }}
              >
                Edit
              </button>
            )}
          </div>
          <p className="mt-2 text-muted-foreground">{review.comment}</p>
        </div>
      ))}

      {user && !myReview && !editing && (
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Rating</label>
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`text-2xl ${i < formState.rating ? "text-yellow-400" : "text-gray-300"}`}
                  onClick={() => setFormState(prev => ({ ...prev, rating: i + 1 }))}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Comment</label>
            <textarea
              className="w-full p-2 border rounded-lg bg-background"
              value={formState.comment}
              onChange={handleFormChange}
              required
            />
          </div>
          <button
            type="submit"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg"
            disabled={loading || formState.rating === 0}
          >
            {loading ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      )}
    </div>
  );
};

interface PageProps {
  params: {
    productId: string;
  };
}

export default function Page({ params }: PageProps) {
  const { productId } = params;
  const [product, setProduct] = useState<Product | null>(null);  const { user, isUserAdmin } = useAuth();

  useEffect(() => {
    getProductById(productId).then(setProduct);
  }, [productId]);

  if (!product) {
    return (
      <div className="container mx-auto p-8 text-center text-red-500">
        Product not found.
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="relative aspect-square">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover rounded-lg"
            priority
          />
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          <p className="text-xl mb-4">₹{product.price.toFixed(2)}</p>
          <div className="prose max-w-none mb-6">
            <p>{product.description}</p>
          </div>
          <button
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg w-full md:w-auto"
          >
            Add to Cart
          </button>
        </div>
      </div>      <ProductReviews 
        productId={productId}
        user={user}
        isAdmin={isUserAdmin()} 
      />

      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-8">Related Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">          {sampleProducts
            .filter(p => p.category === product.category && p.id !== product.id)
            .slice(0, 4)
            .map(p => (
              <div key={p.id}>
                <ProductCard product={p} />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}