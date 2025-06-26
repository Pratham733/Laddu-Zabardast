"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Product } from "@/types/product";
import { sampleProducts } from "@/data/products";
import type { Review } from '@/types/review';
import { useAuth } from '@/context/auth-context';
import { ProductCard } from '@/components/product-card';

interface ProductDetailsPageProps {
  params: {
    productId: string;
  };
}
const getProductById = (id: string): Product | undefined => {
  return sampleProducts.find((product) => product.id === id);
};

const ProductReviews: React.FC<{ productId: string; user: any; isAdmin: boolean }> = ({ productId, user, isAdmin }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${productId}/reviews`).then(res => res.json()).then(data => {
      setReviews(data.reviews || []);
      if (user) {
        const mine = (data.reviews || []).find((r: Review) => r.userId === user.userId);
        setMyReview(mine || null);
        if (mine) {
          setRating(mine.rating);
          setComment(mine.comment);
        }
      }
    });
  }, [productId, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const method = myReview ? 'PUT' : 'POST';
    const url = myReview ? `/api/reviews/${myReview._id}` : '/api/reviews';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, rating, comment }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMyReview(data.review);
      setRating(data.review.rating);
      setComment(data.review.comment);
      // Refetch reviews
      fetch(`/api/products/${productId}/reviews`).then(res => res.json()).then(data => setReviews(data.reviews || []));
      setEditing(false);
    } else {
      alert(data.error || 'Failed to submit review');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this review?')) return;
    setLoading(true);
    await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
    setLoading(false);
    setMyReview(null);
    setRating(0);
    setComment('');
    fetch(`/api/products/${productId}/reviews`).then(res => res.json()).then(data => setReviews(data.reviews || []));
  };

  const handlePin = async (id: string, pin: boolean) => {
    await fetch(`/api/reviews/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pinned: pin }) });
    fetch(`/api/products/${productId}/reviews`).then(res => res.json()).then(data => setReviews(data.reviews || []));
  };

  return (
    <div className="mt-8">
      <h3 className="font-bold text-lg mb-2">Customer Reviews</h3>
      {reviews.length === 0 && <div className="text-muted-foreground">No reviews yet.</div>}
      <ul>
        {reviews.map(r => (
          <li key={r._id} className={`mb-4 p-3 rounded ${r.pinned ? 'bg-yellow-50 border-l-4 border-yellow-400' : 'bg-muted/30'}`}>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{r.userName}</span>
              <span className="text-yellow-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
              {r.pinned && <span className="text-xs bg-yellow-300 text-yellow-900 px-2 py-0.5 rounded ml-2">Pinned</span>}
            </div>
            <div className="text-sm mt-1">{r.comment}</div>
            <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
              <span>{new Date(r.createdAt).toLocaleDateString()}</span>
              {user?.userId === r.userId && (
                <>
                  <button onClick={() => { setEditing(true); setMyReview(r); setRating(r.rating); setComment(r.comment); }} className="underline">Edit</button>
                  <button onClick={() => handleDelete(r._id)} className="underline text-red-500">Delete</button>
                </>
              )}
              {isAdmin && (
                <>
                  <button onClick={() => handlePin(r._id, !r.pinned)} className="underline text-yellow-600">{r.pinned ? 'Unpin' : 'Pin'}</button>
                  <button onClick={() => handleDelete(r._id)} className="underline text-red-500">Delete</button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
      {/* Add/Edit Review Form */}
      {user && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Your Rating:</span>
            {[1,2,3,4,5].map(star => (
              <button type="button" key={star} onClick={() => setRating(star)} className={star <= rating ? 'text-yellow-500' : 'text-gray-300'}>
                ★
              </button>
            ))}
          </div>
          <textarea
            className="w-full border rounded p-2"
            rows={2}
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Write your review..."
            required
          />
          <div className="flex gap-2">
            <button type="submit" className="bg-primary text-white px-4 py-1.5 rounded shadow" disabled={loading || rating === 0 || !comment}>{editing ? 'Update' : 'Submit'} Review</button>
            {editing && <button type="button" className="underline" onClick={() => { setEditing(false); setComment(myReview?.comment || ''); setRating(myReview?.rating || 0); }}>Cancel</button>}
          </div>
        </form>
      )}
    </div>
  );
};

const ProductDetailsPage: React.FC<ProductDetailsPageProps> = ({
  params,
}) => {
  const { productId } = params;
  const { user, isUserAdmin } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    // Fetch product details from API
    fetch(`/api/products/${productId}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Product not found');
        }
        return res.json();
      })
      .then((data) => setProduct(data.product))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // Fetch all products for related section
    fetch('/api/add-product')
      .then((res) => res.json())
      .then((data) => setAllProducts(data.products || []));
  }, [productId]);

  if (loading) {
    return <div className="container mx-auto p-8 text-center text-lg">Loading product...</div>;
  }
  if (error || !product) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold mb-2">Product Details</h1>
        <p className="text-red-500">{error || 'Product not found.'}</p>
      </div>
    );
  }

  // Related products: same category, not current, max 4
  const relatedProducts = allProducts.filter(
    (p) => p.category === product.category && (p._id !== product._id && p.id !== product.id)
  ).slice(0, 4);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="w-full h-auto">
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={600}
            height={400}
            className="object-cover w-full h-full"
          />
        </div>
        <div className="flex flex-col gap-2">
          <p>{product.description}</p>
          <p className="text-xl font-semibold">Price: ₹{product.price.toFixed(2)}</p>
        </div>
      </div>
      {/* Reviews Section */}
      <ProductReviews productId={productId} user={user} isAdmin={isUserAdmin()} />
      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <h3 className="font-bold text-lg mb-4">Related Products</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((relProd) => (
              <ProductCard key={relProd._id || relProd.id} product={relProd} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailsPage;