import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import type { Review } from "@/types";
import { ProductFoodDetails } from "@/components/product-food-details";
import { SweetenerSelect } from "@/components/sweetener-select";
import type { Product, Sweetener } from "@/models/product";
import { sweetenerOptions } from "@/lib/sweeteners";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button-new";
import { toast, useAuth, useCart, useWishlist } from "@/hooks";
import { ProductCard } from "@/components/product-card";
import { Textarea } from "@/components/ui/textarea";
import { errorMessage } from "@/lib/store-display";
import {
  getProductById,
  getProducts,
} from "@/routes/products";
import { Container, Column, Row, Box, Section } from "@/components/ui/layout";
import { getProductReviews, submitReview, updateReview } from "@/routes/reviews";

const productAction = "h-11 rounded-xl px-4 font-semibold shadow-none";
const primaryAction = `${productAction} bg-orange-700 text-white hover:bg-orange-800`;
const emptyReview = { rating: 0, comment: "" };

function ProductReviews({ productId, user, isAdmin }: {
  productId: string;
  user: { userId: string } | null;
  isAdmin: boolean;
}) {
  const [reviews, setReviews] = useState<Review[]>();
  const [editing, setEditing] = useState<Review>();
  const [form, setForm] = useState(emptyReview);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const hasReview = reviews?.some(review => review.userId === user?.userId);

  useEffect(() => {
    let active = true;
    getProductReviews(productId)
      .then(data => { if (active) setReviews(data.reviews ?? []); })
      .catch(() => { if (active) setLoadError("Could not load reviews."); });
    return () => { active = false; };
  }, [productId]);

  function resetForm() {
    setEditing(undefined);
    setForm(emptyReview);
    setSaveError("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const comment = form.comment.trim();
    if (!user || !form.rating || !comment || saving) return;
    setSaving(true);
    setSaveError("");
    try {
      const payload = { rating: form.rating, comment };
      const { review } = editing?.id
        ? await updateReview(productId, editing.id, payload)
        : await submitReview(productId, payload);
      setReviews(current => editing
        ? (current ?? []).map(item => item.id === review.id ? review : item)
        : [...(current ?? []), review]);
      resetForm();
    } catch (reason) {
      setSaveError(errorMessage(reason, "Could not save your review. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section className="mt-8" aria-labelledby="product-reviews">
      <h2 id="product-reviews" className="mb-4 text-2xl font-semibold">Reviews</h2>
      {loadError && <p role="alert" className="text-sm text-destructive">{loadError}</p>}
      {reviews?.map(review => (
        <Box key={review.id} className="mb-3 rounded-xl border bg-card p-4">
          <Row className="items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="break-words font-semibold">{review.userName}</p>
              <p className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</p>
              <span className="mt-1 block text-orange-700 dark:text-orange-400" aria-label={`${review.rating} out of 5 stars`} role="img">
                {"★".repeat(review.rating)}<span className="text-muted-foreground">{"☆".repeat(5 - review.rating)}</span>
              </span>
            </div>
            {review.id && (user?.userId === review.userId || isAdmin) && (
              <Button type="button" variant="outline" className={`shrink-0 ${productAction}`}
                aria-label={`Edit review by ${review.userName}`} disabled={saving} onClick={() => {
                  setEditing(review);
                  setForm({ rating: review.rating, comment: review.comment });
                  setSaveError("");
                }}>
                Edit
              </Button>
            )}
          </Row>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">{review.comment}</p>
        </Box>
      ))}

      {user && reviews && (editing || !hasReview) && (
        <form onSubmit={handleSubmit} className="mt-4 rounded-xl border bg-card p-3 sm:p-4">
          <h3 className="mb-3 font-semibold">{editing ? "Edit review" : "Write a review"}</h3>
          <fieldset disabled={saving} className="space-y-3">
            <div role="group" aria-label="Rating" className="flex flex-wrap gap-1.5">
              {[1, 2, 3, 4, 5].map(rating => (
                <Button key={rating} type="button" variant="outline" size="icon"
                  className={`h-11 w-11 rounded-xl text-lg shadow-none ${rating <= form.rating ? "border-orange-500/50 bg-orange-500/10 text-orange-700 dark:text-orange-400" : "text-muted-foreground"}`}
                  aria-label={`Rate ${rating} ${rating === 1 ? "star" : "stars"}`}
                  aria-pressed={rating === form.rating}
                  onClick={() => setForm(current => ({ ...current, rating }))}>
                  {rating <= form.rating ? "★" : "☆"}
                </Button>
              ))}
            </div>
            <div>
              <label htmlFor="review-comment" className="mb-1 block text-sm font-medium">Comment</label>
              <Textarea id="review-comment" className="min-h-24 rounded-xl" value={form.comment} required
                onChange={event => setForm(current => ({ ...current, comment: event.target.value }))} />
            </div>
            {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" className={primaryAction} disabled={!form.rating || !form.comment.trim()}>
                {saving ? "Saving…" : editing ? "Save review" : "Submit review"}
              </Button>
              {editing && <Button type="button" variant="outline" className={productAction} onClick={resetForm}>Cancel</Button>}
            </div>
          </fieldset>
        </form>
      )}
    </Section>
  );
}

interface PageProps {
  params: {
    productId: string;
  };
}

export default function Page({ params }: PageProps) {
  const { productId } = params;
  const [product, setProduct] = useState<Product | null>(null);
  const [sweetener, setSweetener] = useState<Sweetener>("jaggery");
  const [productLoading, setProductLoading] = useState(true);
  const navigate = useNavigate();
  const { addToCart, isInitialised: cartReady } = useCart();
  const { wishlist, addToWishlist, removeFromWishlist, isInitialised: wishlistReady } = useWishlist();
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const { user, isUserAdmin } = useAuth();

  useEffect(() => {
    let active = true;
    setProductLoading(true);
    setProduct(null);
    setSweetener("jaggery");
    getProductById(productId)
      .then(({ product }) => { if (active) setProduct(product); })
      .catch((error) => { if (active) console.error("Could not load product:", error); })
      .finally(() => { if (active) setProductLoading(false); });
    return () => { active = false; };
  }, [productId]);

  // Fetch related products by category
  useEffect(() => {
    if (!product) return;
    let active = true;
    getProducts(product.category)
      .then((data) => {
        const related = (data.products || [])
          .filter(
            (p: Product) =>
              p.category === product.category && p.id !== product.id,
          )
          .slice(0, 4);
        if (active) setRelatedProducts(related);
      })
      .catch(console.error);
    return () => { active = false; };
  }, [product]);

  if (productLoading) return <Container className="p-8 text-center">Loading product…</Container>;

  if (!product) {
    return (
      <Container className="p-8 text-center text-red-500">
        Product not found.
      </Container>
    );
  }

  const option = sweetenerOptions(product).find(entry => entry.value === sweetener);
  const available = product.available !== false;
  const saved = wishlist.some((item) => item.id === product.id);
  return (
    <Container className="max-w-6xl px-4 py-4 sm:p-6 md:p-8">
      <Box className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-8">
        <Box className="relative aspect-square">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover rounded-lg"
            priority
          />
        </Box>
        <Column className="min-w-0 break-words">
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          <p className="text-xl mb-4">₹{(option?.price ?? product.price).toFixed(2)}</p>
          <p className="mb-2 text-sm text-muted-foreground">
            {product.category === "laddu" ? "Laddus" : product.category === "pickle" ? "Pickles" : "Gift boxes"}
            {product.weight && ` · ${product.weight}`}
          </p>
          <p className="mb-4 text-sm font-medium" role="status">{available ? "In stock" : "Out of stock"}</p>
          <Box className="prose max-w-none mb-6">
            <h2 className="mb-2 font-semibold">Description</h2>
            <p className="whitespace-pre-wrap">{product.description || "No description available."}</p>
          </Box>
          {product.category === "laddu" && <div className="mb-4"><SweetenerSelect product={product} value={sweetener} onChange={setSweetener} disabled={!available} /></div>}
          <ProductFoodDetails product={product} sweetener={option?.value} />
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Button type="button" className={primaryAction} disabled={!available || !product.id}
              onClick={() => navigate(`/checkout?${new URLSearchParams({ buyNow: productId, ...(option ? { sweetener } : {}) })}`)}>
              Buy Now
            </Button>
            <Button type="button" variant="outline" className={productAction} disabled={!available || !product.id || !cartReady}
              onClick={() => {
                addToCart(product, option?.value);
                toast({ title: `${product.name} added to cart` });
              }}>
              Add to Cart
            </Button>
            <Button type="button" variant="outline" className={`col-span-2 ${productAction}`} disabled={!product.id || !wishlistReady} aria-pressed={saved}
              onClick={() => saved ? removeFromWishlist(product) : addToWishlist(product)}>
              {saved ? "Remove from Wishlist" : "Add to Wishlist"}
            </Button>
          </div>
        </Column>
      </Box>{" "}
      <ProductReviews
        key={productId}
        productId={productId}
        user={user}
        isAdmin={isUserAdmin()}
      />
      <Section className="mt-16">
        <h2 className="text-2xl font-bold mb-8">Related Products</h2>
        <Box className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
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
