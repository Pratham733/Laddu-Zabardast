import React, { useEffect, useState } from "react";
import Image from "next/image";
import type { Product, Review } from "@/types";
import { useAuth } from "@/hooks";
import { ProductCard } from "@/components/product-card";
import type { ChangeEvent, FormEvent } from "react";
import {
  getProductReviews,
  submitReview,
  updateReview,
  getProductById as fetchProductById,
  getProducts,
} from "@/routes";
import { Container, Column, Row, Box, Section } from "@/components/ui/layout";

const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const data = await fetchProductById(id);
    return data.product || data;
  } catch (error) {
    console.error("Error fetching product:", error);
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
  isAdmin: boolean;
}> = ({ productId, user, isAdmin }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [formState, setFormState] = useState<ReviewFormState>({
    rating: 0,
    comment: "",
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFormChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    setFormState((prev) => ({ ...prev, comment: value }));
  };

  useEffect(() => {
    getProductReviews(productId)
      .then((data) => {
        setReviews(data.reviews || []);
        if (user) {
          const currentUserId = user.userId;
          const mine = (data.reviews || []).find(
            (r: Review) => currentUserId && r.userId === currentUserId,
          );
          setMyReview(mine || null);
          if (mine) {
            setFormState({
              rating: mine.rating,
              comment: mine.comment,
            });
          }
        }
      })
      .catch(console.error);
  }, [productId, user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || formState.rating === 0) return;

    setLoading(true);
    try {
      const data =
        editing && myReview?.id
          ? await updateReview(productId, myReview.id, formState)
          : await submitReview(productId, formState);

      const review = data.review;
      if (editing) {
        setReviews(reviews.map((r) => (r.id === review.id ? review : r)));
        setMyReview(review);
      } else {
        setReviews([...reviews, review]);
        setMyReview(review);
      }
      setEditing(false);
      setFormState({ rating: 0, comment: "" });
    } catch (error) {
      console.error("Error submitting review:", error);
    }
    setLoading(false);
  };

  return (
    <Section className="mt-8">
      <h3 className="text-2xl font-semibold mb-4">Reviews</h3>
      {reviews.map((review) => (
        <Box key={review.id} className="bg-card p-4 rounded-lg mb-4">
          <Row className="justify-between items-start">
            <Column>
              <Row className="items-center">
                <span className="font-semibold">{review.userName}</span>
                <span className="ml-2 text-sm text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </Row>
              <Row className="items-center mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={
                      i < review.rating ? "text-yellow-400" : "text-gray-300"
                    }
                  >
                    ★
                  </span>
                ))}
              </Row>
            </Column>
            {(user?.userId === review.userId || isAdmin) && (
              <button
                className="text-sm text-blue-500 hover:text-blue-700"
                onClick={() => {
                  setEditing(true);
                  setFormState({
                    rating: review.rating,
                    comment: review.comment,
                  });
                }}
              >
                Edit
              </button>
            )}
          </Row>
          <p className="mt-2 text-muted-foreground">{review.comment}</p>
        </Box>
      ))}

      {user && !myReview && !editing && (
        <form onSubmit={handleSubmit} className="mt-4">
          <Box className="mb-4">
            <label className="block text-sm font-medium mb-2">Rating</label>
            <Row className="gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`text-2xl ${i < formState.rating ? "text-yellow-400" : "text-gray-300"}`}
                  onClick={() =>
                    setFormState((prev) => ({ ...prev, rating: i + 1 }))
                  }
                >
                  ★
                </button>
              ))}
            </Row>
          </Box>
          <Box className="mb-4">
            <label className="block text-sm font-medium mb-2">Comment</label>
            <textarea
              className="w-full p-2 border rounded-lg bg-background"
              value={formState.comment}
              onChange={handleFormChange}
              required
            />
          </Box>
          <button
            type="submit"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg"
            disabled={loading || formState.rating === 0}
          >
            {loading ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      )}
    </Section>
  );
};

interface PageProps {
  params: {
    productId: string;
  };
}

export default function Page({ params }: PageProps) {
  const { productId } = params;
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const { user, isUserAdmin } = useAuth();

  useEffect(() => {
    getProductById(productId).then(setProduct);
  }, [productId]);

  // Fetch related products by category
  useEffect(() => {
    if (!product) return;
    getProducts()
      .then((data) => {
        const related = (data.products || [])
          .filter(
            (p: Product) =>
              p.category === product.category && p.id !== product.id,
          )
          .slice(0, 4);
        setRelatedProducts(related);
      })
      .catch(console.error);
  }, [product]);

  if (!product) {
    return (
      <Container className="p-8 text-center text-red-500">
        Product not found.
      </Container>
    );
  }

  return (
    <Container className="p-4 md:p-8">
      <Box className="grid md:grid-cols-2 gap-8">
        <Box className="relative aspect-square">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover rounded-lg"
            priority
          />
        </Box>
        <Column>
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          <p className="text-xl mb-4">₹{product.price.toFixed(2)}</p>
          <Box className="prose max-w-none mb-6">
            <p>{product.description}</p>
          </Box>
          <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg w-full md:w-auto">
            Add
          </button>
        </Column>
      </Box>{" "}
      <ProductReviews
        productId={productId}
        user={user}
        isAdmin={isUserAdmin()}
      />
      <Section className="mt-16">
        <h2 className="text-2xl font-bold mb-8">Related Products</h2>
        <Box className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {relatedProducts.map((p) => (
            <Box key={p.id}>
              <ProductCard product={p} />
            </Box>
          ))}
        </Box>
      </Section>
    </Container>
  );
}
