import React from "react";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PackagePlus,
  ListOrdered,
  DollarSign,
  Tag,
  FileText,
  Image as ImageIcon,
  Loader2,
  Sliders,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  ArrowUpDown,
  Eye,
  EyeOff,
  Link as LinkIcon,
  GripVertical,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useAuth, toast } from "@/hooks";
import type { Product, Order, OrderItem, BannerItem } from "@/types";
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button";
import {
  getAllBannersAdmin,
  createBanner,
  updateBanner,
  deleteBanner,
} from "@/routes/banner";
import { getOrders } from "@/queries";
import MultilineTextFields from "@/components/multiline-text-field";
import Button from "@mui/material/Button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Reorder, useDragControls } from "framer-motion";
import { addProduct, deleteProduct, getProducts, updateProduct } from "@/routes/products";
import { updateOrderStatus, updatePaymentStatus } from "@/routes/orders";

interface ProductFormState {
  name: string;
  price: string;
  category: string;
  description: string;
  imageUrl: string;
}

interface DraggableBannerItemProps {
  banner: BannerItem;
  index: number;
  onToggleActive: (banner: BannerItem) => void;
  onEdit: (banner: BannerItem) => void;
  onDelete: (id: string) => void;
}

function DraggableBannerItem({
  banner,
  index,
  onToggleActive,
  onEdit,
  onDelete,
}: DraggableBannerItemProps) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={banner}
      id={banner.id}
      dragListener={false}
      dragControls={controls}
      whileDrag={{
        scale: 1.01,
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
        zIndex: 50,
      }}
      className={cn(
        "flex flex-col md:flex-row items-start md:items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all duration-200 gap-3 sm:gap-4 select-none",
        banner.isActive
          ? "bg-card hover:border-primary/50 shadow-sm"
          : "bg-muted/30 border-dashed border-border/80 opacity-90",
      )}
    >
      {/* Left: Drag Handle, Order #, Thumbnail, and Content */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full md:w-auto">
        {/* Drag Grip Handle */}
        <div
          onPointerDown={(e) => controls.start(e)}
          className="cursor-grab active:cursor-grabbing p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors flex items-center justify-center shrink-0 touch-none"
          title="Click and drag to reorder sliding order"
        >
          <GripVertical className="h-5 w-5" />
        </div>

        {/* Position badge */}
        <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/30 text-primary font-black text-xs flex items-center justify-center shrink-0">
          #{index + 1}
        </div>

        {/* Banner Thumbnail */}
        <div className="w-20 h-14 sm:w-24 sm:h-16 rounded-lg overflow-hidden border border-border/60 bg-muted shrink-0 shadow-inner relative group">
          <img
            src={banner.imageURL}
            alt={banner.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              if (banner.altURL) e.currentTarget.src = banner.altURL;
            }}
          />
        </div>

        {/* Banner Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-sm sm:text-base text-foreground truncate">
              {banner.name}
            </h4>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/20 text-secondary-foreground font-mono font-medium">
              key: {banner.key}
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {banner.description || "No description provided"}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
            <span className="font-semibold text-foreground/80">
              Btn: &ldquo;{banner.buttonText || "Shop Now"}&rdquo;
            </span>
            <span>&rarr;</span>
            <span className="text-primary truncate">{banner.buttonLink}</span>
          </div>
        </div>
      </div>

      {/* Right: Enable/Disable Switch Section & Action Buttons */}
      <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-border/50 shrink-0">
        {/* Enable / Disable Button Section */}
        <div className="flex items-center gap-2.5 bg-muted/50 px-3 py-1.5 rounded-xl border border-border/70 shadow-sm">
          <Switch
            id={`switch-${banner.id}`}
            checked={banner.isActive}
            onCheckedChange={() => onToggleActive(banner)}
          />
          <label
            htmlFor={`switch-${banner.id}`}
            className="cursor-pointer select-none text-left"
          >
            <div
              className={cn(
                "text-xs font-bold flex items-center gap-1",
                banner.isActive
                  ? "text-emerald-500 dark:text-emerald-400"
                  : "text-zinc-400 dark:text-zinc-500",
              )}
            >
              {banner.isActive ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span>Enabled</span>
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>Disabled</span>
                </>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {banner.isActive ? "Shown on Home" : "Hidden"}
            </div>
          </label>
        </div>

        {/* Edit & Delete Action Buttons */}
        <div className="flex items-center gap-1.5">
          <Button
            size="small"
            variant="outlined"
            onClick={() => onEdit(banner)}
            className="text-xs"
          >
            <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => onDelete(banner.id)}
            className="text-xs"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Reorder.Item>
  );
}

export default function AdminPage() {
  const { token } = useAuth();
  const [adminTab, setAdminTab] = useState<"product" | "banners">("product");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<ProductFormState>({
    name: "",
    price: "",
    category: "",
    description: "",
    imageUrl: "",
  });
  const [category, setCategory] = useState<"laddu" | "pickle" | "all">("laddu");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Banner Management State
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [bannerFilter, setBannerFilter] = useState<
    "all" | "active" | "disabled"
  >("all");
  const [isLoadingBanners, setIsLoadingBanners] = useState(true);
  const [isSubmittingBanner, setIsSubmittingBanner] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [bannerForm, setBannerForm] = useState({
    name: "",
    key: "sweets",
    description: "",
    imageURL: "",
    altURL: "",
    buttonLink: "/shop",
    buttonText: "Shop Laddus",
    order: 1,
    isActive: true,
  });

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoadingOrders(true);
      try {
        const data = await getOrders();
        setOrders(data.orders || []);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast({
          title: "Error Fetching Orders",
          description: "Could not load order data. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingOrders(false);
      }
    };
    if (token) fetchOrders();
  }, [token]);

  useEffect(() => {
    async function fetchProducts() {
      setIsLoadingProducts(true);
      try {
        const data = await getProducts();
        setProducts(data.products || []);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch products.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingProducts(false);
      }
    }
    fetchProducts();
  }, [isSubmittingProduct]);

  const fetchBanners = async () => {
    setIsLoadingBanners(true);
    try {
      const data = await getAllBannersAdmin();
      setBanners(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching banners:", error);
      toast({
        title: "Error Fetching Banners",
        description: "Could not load banner data.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBanners(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Banner name is required.",
        variant: "destructive",
      });
      return;
    }
    if (!bannerForm.imageURL.trim()) {
      toast({
        title: "Validation Error",
        description: "Banner Image URL is required.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingBanner(true);
    try {
      if (editingBanner) {
        await updateBanner(editingBanner.id, {
          ...bannerForm,
          order: Number(bannerForm.order) || 1,
        });
        toast({
          title: "Banner Updated",
          description: "Banner details updated successfully.",
        });
        setEditingBanner(null);
      } else {
        await createBanner({
          ...bannerForm,
          order: Number(bannerForm.order) || banners.length + 1,
        });
        toast({
          title: "Banner Created",
          description: "New sliding banner added successfully.",
        });
      }
      setBannerForm({
        name: "",
        key: "sweets",
        description: "",
        imageURL: "",
        altURL: "",
        buttonLink: "/shop",
        buttonText: "Shop Laddus",
        order: banners.length + 1,
        isActive: true,
      });
      await fetchBanners();
    } catch (err: any) {
      console.error("Error saving banner:", err);
      toast({
        title: "Action Failed",
        description: err.message || "Failed to save banner.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingBanner(false);
    }
  };

  const handleEditBanner = (b: BannerItem) => {
    setEditingBanner(b);
    setBannerForm({
      name: b.name,
      key: b.key || "sweets",
      description: b.description || "",
      imageURL: b.imageURL,
      altURL: b.altURL || "",
      buttonLink: b.buttonLink || "/shop",
      buttonText: b.buttonText || "Shop Now",
      order: b.order || 1,
      isActive: b.isActive !== false,
    });
    setAdminTab("banners");
    window.scrollTo({ top: 150, behavior: "smooth" });
  };

  const handleCancelBannerEdit = () => {
    setEditingBanner(null);
    setBannerForm({
      name: "",
      key: "sweets",
      description: "",
      imageURL: "",
      altURL: "",
      buttonLink: "/shop",
      buttonText: "Shop Laddus",
      order: banners.length + 1,
      isActive: true,
    });
  };

  const handleDeleteBanner = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this sliding banner?"))
      return;
    try {
      await deleteBanner(id);
      toast({
        title: "Banner Deleted",
        description: "Sliding banner removed from database.",
      });
      await fetchBanners();
    } catch (err: any) {
      console.error("Error deleting banner:", err);
      toast({
        title: "Delete Failed",
        description: err.message || "Failed to delete banner.",
        variant: "destructive",
      });
    }
  };

  const handleToggleBannerActive = async (b: BannerItem) => {
    try {
      await updateBanner(b.id, { ...b, isActive: !b.isActive });
      toast({
        title: !b.isActive ? "Banner Enabled" : "Banner Disabled",
        description: `Banner is now ${!b.isActive ? "visible on" : "hidden from"} home page carousel.`,
      });
      await fetchBanners();
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleReorderBanners = async (newOrder: BannerItem[]) => {
    // 1. Immediately update UI state
    const updated = newOrder.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));
    setBanners(updated);

    // 2. Persist new ordering to backend database
    try {
      await Promise.all(
        updated.map((item) =>
          updateBanner(item.id, {
            key: item.key,
            name: item.name,
            description: item.description,
            imageURL: item.imageURL,
            altURL: item.altURL,
            buttonLink: item.buttonLink,
            buttonText: item.buttonText,
            order: item.order,
            isActive: item.isActive,
          }),
        ),
      );
      toast({
        title: "Order Saved",
        description: "New banner sliding order saved successfully.",
      });
    } catch (err: any) {
      console.error("Error saving banner order:", err);
      toast({
        title: "Reorder Failed",
        description: err.message || "Failed to persist new banner order.",
        variant: "destructive",
      });
      await fetchBanners();
    }
  };

  const handleAddProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmittingProduct(true);

    try {
      const form = event.currentTarget;
      const formData = new FormData(form);
      const product = {
        name: formData.get("name") as string,
        price: parseFloat(formData.get("price") as string),
        category: formData.get("category") as "laddu" | "pickle",
        description: formData.get("description") as string,
        imageUrl: formData.get("imageUrl") as string,
      };

      const data = await addProduct(product);

      toast({
        title: "Product Added",
        description: `${product.name} has been successfully added.`,
      });

      // Reset form and state
      form.reset();
    } catch (error: any) {
      console.error("Error adding product:", error);
      toast({
        title: "Error Adding Product",
        description:
          error.message || "Could not add the product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map(
          (order) =>
            order.id === orderId ? { ...order, orderStatus: newStatus } : order, // Update orderStatus
        ),
      );
      toast({
        title: "Order Status Updated",
        description: `Order status updated to ${newStatus}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error Updating Status",
        description: error.message || "Could not update order status.",
        variant: "destructive",
      });
    }
  };

  const handlePaymentStatusUpdate = async (
    orderId: string,
    newPaymentStatus: "completed" | "paid",
  ) => {
    try {
      await updatePaymentStatus(orderId, newPaymentStatus);
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, paymentStatus: newPaymentStatus }
            : order,
        ),
      );
      toast({
        title: "Payment Status Updated",
        description: `Order payment status updated to ${newPaymentStatus}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error Updating Payment Status",
        description: error.message || "Could not update payment status.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-6 md:px-6 md:py-12">
      <div className="relative flex flex-col items-center justify-center mb-6 sm:mb-8 animate-fade-in">
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-0 blur-xl opacity-40 w-40 sm:w-60 h-16 sm:h-24 bg-gradient-to-r from-primary to-secondary rounded-full" />
        <div className="bg-gradient-to-r from-primary to-secondary rounded-full p-0.5 sm:p-1 shadow-2xl mb-2 z-10 border-2 sm:border-4 border-white dark:border-zinc-900">
          <img
            src="/images/logo.png"
            alt="Logo"
            className="h-14 w-14 sm:h-20 sm:w-20 rounded-full border-2 sm:border-4 border-white shadow-xl"
          />
        </div>
      </div>

      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-8 md:mb-12 text-gradient">
        Admin Dashboard
      </h1>

      <div className="grid grid-cols-1 gap-3 sm:gap-6 lg:grid-cols-2 lg:gap-8">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-2xl">
            {/* <CardTitle className="flex items-center gap-2 text-lg sm:text-2xl">
              <PackagePlus className="h-5 w-5 sm:h-6 sm:w-6 text-primary animate-bounce" />{" "}
              Add New Product
            </CardTitle>
            <CardDescription className="text-xs sm:text-base text-muted-foreground">
              Fill in the details to add a new product to the store.
            </CardDescription> */}
            <div className="flex items-center gap-1.5 p-1.5 bg-background/90 dark:bg-zinc-950/80 rounded-xl border border-border/80 shadow-inner w-full sm:max-w-md">
              <button
                type="button"
                onClick={() => setAdminTab("product")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-bold text-xs sm:text-sm transition-all duration-200 select-none",
                  adminTab === "product"
                    ? "bg-primary text-primary-foreground shadow-md ring-1 ring-primary/40"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                )}
              >
                <PackagePlus className="h-4 w-4 shrink-0" />
                <span>NEW PRODUCT</span>
              </button>
              <button
                type="button"
                onClick={() => setAdminTab("banners")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-bold text-xs sm:text-sm transition-all duration-200 select-none",
                  adminTab === "banners"
                    ? "bg-primary text-primary-foreground shadow-md ring-1 ring-primary/40"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                )}
              >
                <Sliders className="h-4 w-4 shrink-0" />
                <span>SLIDING BANNERS</span>
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {adminTab === "product" ? (
              <form
                encType="multipart/form-data"
                onSubmit={handleAddProduct}
                className="space-y-4 sm:space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label
                      htmlFor="name"
                      className="flex items-center gap-1 mb-1 font-semibold text-primary"
                    >
                      <PackagePlus className="h-4 w-4" /> Product Name
                    </Label>
                    <Input
                      type="text"
                      id="name"
                      name="name"
                      required
                      placeholder="e.g., Special Besan Laddu"
                      className="bg-background/70 border-2 border-primary/30 focus:border-primary/70 shadow-sm"
                      disabled={isSubmittingProduct}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="price"
                      className="flex items-center gap-1 mb-1 font-semibold text-primary"
                    >
                      <DollarSign className="h-4 w-4" /> Price (₹)
                    </Label>
                    <Input
                      type="number"
                      id="price"
                      name="price"
                      required
                      placeholder="e.g., 450.00"
                      step="0.01"
                      min="0"
                      className="bg-background/70 border-2 border-primary/30 focus:border-primary/70 shadow-sm"
                      disabled={isSubmittingProduct}
                    />
                  </div>
                </div>
                <div>
                  <Label className="flex items-center gap-1 mb-1 font-semibold text-primary">
                    <Tag className="h-4 w-4" /> Category
                  </Label>
                  <div className="flex gap-2 mb-2">
                    <Button
                      variant={category === "laddu" ? "contained" : "outlined"}
                      className="transition-all duration-200 shadow-md"
                      onClick={() => setCategory("laddu")}
                    >
                      Laddu
                    </Button>
                    <Button
                      variant={category === "pickle" ? "contained" : "outlined"}
                      className="transition-all duration-200 shadow-md"
                      onClick={() => setCategory("pickle")}
                    >
                      Pickle
                    </Button>
                    <Button
                      variant={category === "all" ? "contained" : "outlined"}
                      className="transition-all duration-200 shadow-md"
                      onClick={() => setCategory("all")}
                    >
                      All
                    </Button>
                  </div>
                  <input type="hidden" name="category" value={category} />
                </div>
                <div>
                  <Label
                    htmlFor="description"
                    className="flex items-center gap-1 mb-1 font-semibold text-primary"
                  >
                    <FileText className="h-4 w-4" /> Description
                  </Label>
                  <MultilineTextFields
                    id="description"
                    name="description"
                    label="Description"
                    multiline
                    maxRows={4}
                  />
                </div>
                <div>
                  <Label
                    htmlFor="product-image"
                    className="flex items-center gap-1 mb-1 font-semibold text-primary"
                  >
                    <ImageIcon className="h-4 w-4" /> Product Image URL
                  </Label>
                  <MultilineTextFields
                    id="product-image"
                    name="imageUrl"
                    label="Product Image URL"
                    multiline
                    maxRows={4}
                  />
                </div>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmittingProduct}
                  className="w-full"
                >
                  {isSubmittingProduct ? "Adding Product..." : "Add Product"}
                </Button>
              </form>
            ) : (
              <form
                onSubmit={handleBannerSubmit}
                className="space-y-4 sm:space-y-5"
              >
                <div className="flex items-center justify-between pb-2 border-b">
                  <h3 className="font-semibold text-base sm:text-lg flex items-center gap-2 text-primary">
                    <Sliders className="h-5 w-5" />
                    {editingBanner
                      ? `Edit Banner: ${editingBanner.name}`
                      : "Add New Sliding Banner"}
                  </h3>
                  {editingBanner && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleCancelBannerEdit}
                    >
                      Cancel Edit
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="banner-name"
                      className="flex items-center gap-1 mb-1 font-semibold text-primary"
                    >
                      <Sparkles className="h-4 w-4" /> Banner Title / Name
                    </Label>
                    <Input
                      id="banner-name"
                      value={bannerForm.name}
                      onChange={(e) =>
                        setBannerForm({ ...bannerForm, name: e.target.value })
                      }
                      required
                      placeholder="e.g., Authentic Indian Sweets"
                      disabled={isSubmittingBanner}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="banner-key"
                      className="flex items-center gap-1 mb-1 font-semibold text-primary"
                    >
                      <Tag className="h-4 w-4" /> Key / Slug
                    </Label>
                    <Input
                      id="banner-key"
                      value={bannerForm.key}
                      onChange={(e) =>
                        setBannerForm({ ...bannerForm, key: e.target.value })
                      }
                      placeholder="e.g., sweets, pickles"
                      disabled={isSubmittingBanner}
                    />
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="banner-desc"
                    className="flex items-center gap-1 mb-1 font-semibold text-primary"
                  >
                    <FileText className="h-4 w-4" /> Description
                  </Label>
                  <Textarea
                    id="banner-desc"
                    value={bannerForm.description}
                    onChange={(e) =>
                      setBannerForm({
                        ...bannerForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Short promotional text displayed on the hero slide"
                    rows={2}
                    disabled={isSubmittingBanner}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="banner-img"
                      className="flex items-center gap-1 mb-1 font-semibold text-primary"
                    >
                      <ImageIcon className="h-4 w-4" /> Image URL (Required)
                    </Label>
                    <Input
                      id="banner-img"
                      value={bannerForm.imageURL}
                      onChange={(e) =>
                        setBannerForm({
                          ...bannerForm,
                          imageURL: e.target.value,
                        })
                      }
                      required
                      placeholder="https://... or /images/..."
                      disabled={isSubmittingBanner}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="banner-alt"
                      className="flex items-center gap-1 mb-1 font-semibold text-primary"
                    >
                      <ImageIcon className="h-4 w-4" /> Fallback Alt URL
                    </Label>
                    <Input
                      id="banner-alt"
                      value={bannerForm.altURL}
                      onChange={(e) =>
                        setBannerForm({ ...bannerForm, altURL: e.target.value })
                      }
                      placeholder="/images/ban1.jpg"
                      disabled={isSubmittingBanner}
                    />
                  </div>
                </div>

                {bannerForm.imageURL && (
                  <div className="p-2 border rounded-lg bg-muted/20 flex flex-col items-center">
                    <span className="text-xs text-muted-foreground mb-1">
                      Image Live Preview:
                    </span>
                    <img
                      src={bannerForm.imageURL}
                      alt="Banner Preview"
                      className="h-24 w-full object-cover rounded shadow"
                      onError={(e) => {
                        if (bannerForm.altURL)
                          e.currentTarget.src = bannerForm.altURL;
                      }}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label
                      htmlFor="banner-link"
                      className="flex items-center gap-1 mb-1 font-semibold text-primary"
                    >
                      <LinkIcon className="h-4 w-4" /> Button Link
                    </Label>
                    <Input
                      id="banner-link"
                      value={bannerForm.buttonLink}
                      onChange={(e) =>
                        setBannerForm({
                          ...bannerForm,
                          buttonLink: e.target.value,
                        })
                      }
                      placeholder="/shop"
                      disabled={isSubmittingBanner}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="banner-btn"
                      className="flex items-center gap-1 mb-1 font-semibold text-primary"
                    >
                      <FileText className="h-4 w-4" /> Button Text
                    </Label>
                    <Input
                      id="banner-btn"
                      value={bannerForm.buttonText}
                      onChange={(e) =>
                        setBannerForm({
                          ...bannerForm,
                          buttonText: e.target.value,
                        })
                      }
                      placeholder="Shop Laddus"
                      disabled={isSubmittingBanner}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="banner-order"
                      className="flex items-center gap-1 mb-1 font-semibold text-primary"
                    >
                      <ArrowUpDown className="h-4 w-4" /> Display Order
                    </Label>
                    <Input
                      id="banner-order"
                      type="number"
                      min={1}
                      value={bannerForm.order}
                      onChange={(e) =>
                        setBannerForm({
                          ...bannerForm,
                          order: parseInt(e.target.value, 10) || 1,
                        })
                      }
                      disabled={isSubmittingBanner}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-muted/40 shadow-sm">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="banner-active"
                      className="cursor-pointer font-bold text-sm flex items-center gap-1.5"
                    >
                      {bannerForm.isActive ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span>Status: Enabled (Live)</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-zinc-400" />
                          <span>Status: Disabled (Hidden)</span>
                        </>
                      )}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {bannerForm.isActive
                        ? "This banner will be displayed on the home page hero carousel."
                        : "This banner is hidden from customers. You can re-enable it anytime."}
                    </p>
                  </div>
                  <Switch
                    id="banner-active"
                    checked={bannerForm.isActive}
                    onCheckedChange={(checked) =>
                      setBannerForm({ ...bannerForm, isActive: checked })
                    }
                    disabled={isSubmittingBanner}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isSubmittingBanner}
                    className="flex-1"
                  >
                    {isSubmittingBanner
                      ? "Saving Banner..."
                      : editingBanner
                        ? "Save Changes"
                        : "Add Sliding Banner"}
                  </Button>
                  {editingBanner && (
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={handleCancelBannerEdit}
                      disabled={isSubmittingBanner}
                    >
                      Cancel Edit
                    </Button>
                  )}
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-2xl">
              <ListOrdered className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />{" "}
              Order Management
            </CardTitle>
            <CardDescription className="text-xs sm:text-base">
              View and manage customer orders.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto p-1 sm:p-2 md:p-4">
            {isLoadingOrders ? (
              <p className="text-muted-foreground text-sm sm:text-base">
                Loading orders...
              </p>
            ) : orders.length > 0 ? (
              <div className="w-full overflow-x-auto relative">
                {/* Mobile scroll hint overlay */}
                <div
                  className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-white/80 dark:from-zinc-900/80 to-transparent hidden xs:block"
                  style={{ zIndex: 2 }}
                />
                <Table className="min-w-[340px] xs:min-w-[420px] sm:min-w-[600px] border-separate border-spacing-y-1 sm:border-spacing-y-2 text-xs sm:text-sm">
                  <TableHeader>
                    <TableRow>
                      {/*No whitespace*/}
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Order Status</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Update Order Status</TableHead>
                      <TableHead>Update Payment</TableHead>
                      {/*No whitespace*/}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <React.Fragment key={order.id}>
                        <TableRow>
                          <TableCell className="font-medium truncate max-w-[100px]">
                            {order.id}
                          </TableCell>
                          <TableCell>
                            {order.shippingDetails?.name || "N/A"}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                order.orderStatus === "delivered"
                                  ? "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100"
                                  : order.orderStatus === "processing"
                                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100"
                                    : order.orderStatus === "shipped"
                                      ? "bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100"
                                      : order.orderStatus === "cancelled"
                                        ? "bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100"
                                        : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100"
                              }`}
                            >
                              {order.orderStatus}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                                order.paymentStatus === "paid" ||
                                order.paymentStatus === "completed"
                                  ? "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100"
                                  : order.paymentStatus === "pending"
                                    ? "bg-orange-100 text-orange-700 dark:bg-orange-700 dark:text-orange-100"
                                    : order.paymentStatus === "failed"
                                      ? "bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100"
                                      : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100"
                              }`}
                            >
                              {order.paymentStatus}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            ₹{order.totalAmount?.toFixed(2) || "0.00"}
                          </TableCell>
                          <TableCell>
                            <form
                              onSubmit={async (e) => {
                                e.preventDefault();
                                const formElement = e.currentTarget;
                                const select = formElement.elements.namedItem(
                                  "orderStatusSelect",
                                ) as HTMLSelectElement;
                                if (order.orderStatus === "delivered") {
                                  toast({
                                    title: "Order Already Delivered",
                                    description:
                                      "Delivered orders cannot have their status changed.",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                await handleStatusChange(
                                  order.id || "",
                                  select.value,
                                );
                              }}
                              className="flex flex-row gap-2 items-center"
                            >
                              <select
                                name="orderStatusSelect"
                                defaultValue={order.orderStatus}
                                className="border rounded px-2 py-1.5 bg-background dark:bg-zinc-800 dark:text-white text-xs focus:ring-primary focus:border-primary"
                                disabled={order.orderStatus === "delivered"}
                              >
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                              <InteractiveHoverButton
                                type="submit"
                                className="px-3 py-1.5 text-xs border"
                                disabled={order.orderStatus === "delivered"}
                              >
                                Update
                              </InteractiveHoverButton>
                            </form>
                          </TableCell>
                          <TableCell className="text-left">
                            {typeof order.paymentMethod !== "string" && (
                              <span className="text-xs text-red-500 font-semibold">
                                No payment method
                              </span>
                            )}
                            {order.paymentMethod &&
                              (order.paymentMethod.toLowerCase() === "cod" ||
                                order.paymentMethod.toLowerCase() === "cash") &&
                              order.paymentStatus !== "paid" &&
                              order.paymentStatus !== "completed" && (
                                <InteractiveHoverButton
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 text-xs"
                                  onClick={() =>
                                    handlePaymentStatusUpdate(
                                      order.id || "",
                                      "completed",
                                    )
                                  }
                                >
                                  Mark as Paid
                                </InteractiveHoverButton>
                              )}
                          </TableCell>
                          <TableCell>
                            <button
                              className="text-primary underline text-xs"
                              onClick={() =>
                                setExpandedOrderId(
                                  expandedOrderId === order.id
                                    ? null
                                    : order.id || null,
                                )
                              }
                            >
                              {expandedOrderId === order.id
                                ? "Hide Details"
                                : "View Details"}
                            </button>
                          </TableCell>
                        </TableRow>

                        {expandedOrderId === order.id && (
                          <TableRow>
                            <TableCell
                              colSpan={8}
                              className="bg-white dark:bg-zinc-900/90 p-4 rounded-b-xl border-t border-primary/20 shadow-inner"
                            >
                              <div className="space-y-3">
                                <div className="font-semibold text-base mb-1 text-primary dark:text-yellow-400">
                                  Order Details
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <div className="font-semibold mb-1 text-secondary dark:text-blue-400">
                                      Shipping Information
                                    </div>
                                    <div className="text-sm">
                                      <div>
                                        <span className="font-medium">
                                          Name:
                                        </span>{" "}
                                        <span className="dark:text-zinc-100">
                                          {order.shippingDetails.name}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="font-medium">
                                          Email:
                                        </span>{" "}
                                        <span className="dark:text-zinc-100">
                                          {order.shippingDetails.email}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="font-semibold mb-1 text-secondary dark:text-blue-400">
                                      Order Info
                                    </div>
                                    <div className="text-sm">
                                      <div>
                                        <span className="font-medium">
                                          Order ID:
                                        </span>{" "}
                                        <span className="dark:text-zinc-100">
                                          {order.id}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="font-medium">
                                          Status:
                                        </span>{" "}
                                        <span className="dark:text-zinc-100">
                                          {order.orderStatus}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="font-medium">
                                          Payment:
                                        </span>{" "}
                                        <span className="dark:text-zinc-100">
                                          {order.paymentStatus} (
                                          {order.paymentMethod})
                                        </span>
                                      </div>
                                      <div>
                                        <span className="font-medium">
                                          Placed on:
                                        </span>{" "}
                                        <span className="dark:text-zinc-100">
                                          {order.createdAt
                                            ? new Date(
                                                order.createdAt,
                                              ).toLocaleString()
                                            : "N/A"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="font-semibold mt-2 mb-1 text-secondary dark:text-blue-400">
                                  Items
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="min-w-full text-xs border rounded shadow bg-zinc-50 dark:bg-zinc-800/80">
                                    <thead>
                                      <tr className="bg-primary/10 dark:bg-primary/20">
                                        <th className="px-2 py-1 text-left text-zinc-700 dark:text-zinc-100">
                                          Name
                                        </th>
                                        <th className="px-2 py-1 text-center text-zinc-700 dark:text-zinc-100">
                                          Qty
                                        </th>
                                        <th className="px-2 py-1 text-right text-zinc-700 dark:text-zinc-100">
                                          Unit Price
                                        </th>
                                        <th className="px-2 py-1 text-right text-zinc-700 dark:text-zinc-100">
                                          Total
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {order.items.map((item) => (
                                        <tr
                                          key={item.id}
                                          className="border-b last:border-b-0 border-zinc-200 dark:border-zinc-700"
                                        >
                                          <td className="px-2 py-1 dark:text-zinc-100">
                                            {item.name}
                                          </td>
                                          <td className="px-2 py-1 text-center dark:text-zinc-100">
                                            {item.quantity}
                                          </td>
                                          <td className="px-2 py-1 text-right dark:text-zinc-100">
                                            ₹{item.price.toFixed(2)}
                                          </td>
                                          <td className="px-2 py-1 text-right font-semibold dark:text-zinc-100">
                                            ₹
                                            {(
                                              item.price * item.quantity
                                            ).toFixed(2)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                <div className="flex justify-end mt-2">
                                  <span className="font-bold text-lg text-primary dark:text-yellow-400">
                                    Total: ₹
                                    {order.totalAmount?.toFixed(2) || "0.00"}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm sm:text-base">
                No orders available at the moment.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sliding Banners Management Card */}
      <Card className="shadow-lg mt-8 sm:mt-10">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-2xl">
              <Sliders className="h-5 w-5 sm:h-6 sm:w-6 text-primary animate-fade-in" />{" "}
              Sliding Banners (Hero Carousel)
            </CardTitle>
            <CardDescription className="text-xs sm:text-base">
              Drag to reorder sliding sequence, toggle enable/disable
              visibility, and manage banner content.
            </CardDescription>
          </div>
          <Button
            variant="contained"
            size="small"
            onClick={() => {
              handleCancelBannerEdit();
              setAdminTab("banners");
              window.scrollTo({ top: 150, behavior: "smooth" });
            }}
            className="shrink-0"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Banner
          </Button>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 space-y-4">
          {/* Filter Bar & Reorder Hint */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
            <div className="flex items-center gap-1.5 p-1 bg-muted/60 dark:bg-zinc-900/80 rounded-xl border border-border/70 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setBannerFilter("all")}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all",
                  bannerFilter === "all"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                All Banners ({banners.length})
              </button>
              <button
                type="button"
                onClick={() => setBannerFilter("active")}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
                  bannerFilter === "active"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Enabled ({banners.filter((b) => b.isActive).length})
              </button>
              <button
                type="button"
                onClick={() => setBannerFilter("disabled")}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
                  bannerFilter === "disabled"
                    ? "bg-zinc-700 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <XCircle className="h-3.5 w-3.5" />
                Disabled ({banners.filter((b) => !b.isActive).length})
              </button>
            </div>

            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <GripVertical className="h-4 w-4 text-primary shrink-0" />
              <span>Drag handle ☰ to reorder live carousel position</span>
            </div>
          </div>

          {isLoadingBanners ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : banners.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-2xl bg-muted/20">
              <Sliders className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-foreground">
                No sliding banners in database
              </p>
              <p className="text-muted-foreground text-xs mt-1 mb-4">
                Add your first promotional banner using the form above.
              </p>
              <Button
                variant="contained"
                size="small"
                onClick={() => {
                  setAdminTab("banners");
                  window.scrollTo({ top: 150, behavior: "smooth" });
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Create Banner
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {bannerFilter !== "all" && (
                <div className="text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground flex items-center justify-between">
                  <span>
                    Showing {bannerFilter} banners (
                    {
                      banners.filter((b) =>
                        bannerFilter === "active" ? b.isActive : !b.isActive,
                      ).length
                    }
                    ).
                  </span>
                  <button
                    type="button"
                    onClick={() => setBannerFilter("all")}
                    className="text-primary underline font-semibold ml-2"
                  >
                    View All to Drag & Reorder
                  </button>
                </div>
              )}

              {bannerFilter === "all" ? (
                <Reorder.Group
                  axis="y"
                  values={banners}
                  onReorder={handleReorderBanners}
                  className="space-y-2.5"
                >
                  {banners.map((b, idx) => (
                    <DraggableBannerItem
                      key={b.id}
                      banner={b}
                      index={idx}
                      onToggleActive={handleToggleBannerActive}
                      onEdit={handleEditBanner}
                      onDelete={handleDeleteBanner}
                    />
                  ))}
                </Reorder.Group>
              ) : (
                <div className="space-y-2.5">
                  {banners
                    .filter((b) =>
                      bannerFilter === "active" ? b.isActive : !b.isActive,
                    )
                    .map((b) => {
                      const originalIndex = banners.findIndex(
                        (x) => x.id === b.id,
                      );
                      return (
                        <DraggableBannerItem
                          key={b.id}
                          banner={b}
                          index={originalIndex}
                          onToggleActive={handleToggleBannerActive}
                          onEdit={handleEditBanner}
                          onDelete={handleDeleteBanner}
                        />
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg mt-8 sm:mt-10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-2xl">
            <ListOrdered className="h-5 w-5 sm:h-6 sm:w-6 text-primary animate-fade-in" />{" "}
            Product Management
          </CardTitle>
          <CardDescription className="text-xs sm:text-base">
            View, edit, and update all products.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingProducts ? (
            <div className="flex flex-col items-center justify-center py-8 sm:py-12 animate-pulse">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted mb-4" />
              <p className="text-muted-foreground text-base sm:text-lg font-semibold">
                Loading products...
              </p>
            </div>
          ) : products.length > 0 ? (
            <div className="overflow-x-auto transition-all duration-500">
              <Table className="min-w-[600px] sm:min-w-full border-separate border-spacing-y-2 text-xs sm:text-sm">
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-black dark:to-zinc-900">
                    {/*No whitespace*/}
                    <TableHead className="text-center">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                    {/*No whitespace*/}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((prod, idx) => (
                    <TableRow
                      key={prod.id}
                      className="group hover:scale-[1.01] hover:shadow-xl transition-all duration-300 bg-white/90 dark:bg-black hover:bg-gradient-to-r hover:from-primary/5 hover:to-secondary/10 dark:hover:from-zinc-900 dark:hover:to-black"
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      {/*No whitespace*/}
                      <TableCell className="flex justify-center items-center">
                        <div className="w-14 h-14 rounded-lg overflow-hidden border-2 border-primary/30 shadow-md bg-muted animate-fade-in">
                          {prod.imageUrl ? (
                            <img
                              src={prod.imageUrl}
                              alt={prod.name}
                              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <ImageIcon className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-primary/90 dark:text-white text-black">
                        {prod.name}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold transition-colors duration-200 ${prod.category === "laddu" ? "bg-yellow-100 text-yellow-700" : prod.category === "pickle" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"} dark:bg-zinc-800 dark:text-white`}
                        >
                          {prod.category}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-lg font-bold text-secondary dark:text-white text-black">
                        ₹{prod.price}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground dark:text-white text-black">
                        {prod.description}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {/* Edit/Delete buttons */}
                          <InteractiveHoverButton
                            className="transition-all duration-200 hover:scale-105 bg-orange-600 text-white px-3 py-1 rounded"
                            onClick={() => {
                              setEditingProduct(prod);
                              setEditForm({
                                name: prod.name,
                                price: prod.price.toString(),
                                category: prod.category,
                                description: prod.description,
                                imageUrl: prod.imageUrl,
                              });
                            }}
                          >
                            Edit
                          </InteractiveHoverButton>
                          <InteractiveHoverButton
                            className="transition-all duration-200 hover:scale-105 bg-red-600 text-white px-3 py-1 rounded"
                            onClick={async () => {
                              if (
                                confirm(
                                  `Are you sure you want to delete '${prod.name}'?`,
                                )
                              ) {
                                try {
                                  const data = await deleteProduct(prod.id!);
                                  toast({
                                    title: "Product Deleted",
                                    description: `'${prod.name}' has been deleted.`,
                                  });
                                  setProducts(data.products || []);
                                } catch (err: any) {
                                  toast({
                                    title: "Delete Failed",
                                    description:
                                      err.message ||
                                      "Could not delete product.",
                                    variant: "destructive",
                                  });
                                }
                              }
                            }}
                          >
                            Delete
                          </InteractiveHoverButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 sm:py-12 animate-fade-in">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted mb-4" />
              <p className="text-muted-foreground text-base sm:text-lg font-semibold">
                No products available.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {editingProduct && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fadeIn px-2 sm:px-0">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-4 sm:p-8 w-full max-w-lg relative animate-popIn border border-primary/20">
            <button
              className="absolute top-3 right-3 text-2xl text-gray-400 hover:text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full bg-white/80 dark:bg-zinc-800/80 w-9 h-9 flex items-center justify-center shadow-md"
              onClick={() => setEditingProduct(null)}
              aria-label="Close edit modal"
              type="button"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-6 text-center text-gradient">
              Edit Product
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const data = await updateProduct(
                    (editingProduct.id || editingProduct.id)!,
                    {
                      ...editForm,
                      category: editForm.category as "laddu" | "pickle",
                      price: parseFloat(editForm.price),
                    },
                  );
                  toast({
                    title: "Product Updated",
                    description: "Product details updated.",
                  });
                  setEditingProduct(null);
                  setProducts(data.products || []);
                } catch (err: any) {
                  toast({
                    title: "Update Failed",
                    description: err.message || "Could not update product.",
                    variant: "destructive",
                  });
                }
              }}
              className="space-y-5"
            >
              <div>
                <Label htmlFor="edit-name" className="mb-1 font-semibold">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                  placeholder="Name"
                  className="bg-background/70"
                />
              </div>
              <div>
                <Label htmlFor="edit-price" className="mb-1 font-semibold">
                  Price (₹)
                </Label>
                <Input
                  id="edit-price"
                  value={editForm.price}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, price: e.target.value }))
                  }
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Price"
                  className="bg-background/70 text-black dark:text-white"
                />
              </div>
              <div>
                <Label className="mb-1 font-semibold">Category</Label>
                <div className="flex gap-2 mb-2">
                  <InteractiveHoverButton
                    type="button"
                    onClick={() =>
                      setEditForm((f) => ({ ...f, category: "laddu" }))
                    }
                    className="transition-all duration-200"
                  >
                    Laddu
                  </InteractiveHoverButton>
                  <InteractiveHoverButton
                    type="button"
                    onClick={() =>
                      setEditForm((f) => ({ ...f, category: "pickle" }))
                    }
                    className="transition-all duration-200"
                  >
                    Pickle
                  </InteractiveHoverButton>
                  <InteractiveHoverButton
                    type="button"
                    onClick={() =>
                      setEditForm((f) => ({ ...f, category: "all" }))
                    }
                    className="transition-all duration-200"
                  >
                    All
                  </InteractiveHoverButton>
                </div>
              </div>
              <div>
                <Label
                  htmlFor="edit-description"
                  className="mb-1 font-semibold"
                >
                  Description
                </Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, description: e.target.value }))
                  }
                  required
                  rows={3}
                  placeholder="Description"
                  className="bg-background/70"
                />
              </div>
              <div>
                <Label htmlFor="edit-imageUrl" className="mb-1 font-semibold">
                  Image URL
                </Label>
                <Input
                  id="edit-imageUrl"
                  value={editForm.imageUrl}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, imageUrl: e.target.value }))
                  }
                  required
                  placeholder="Image URL"
                  className="bg-background/70"
                />
                {editForm.imageUrl && (
                  <img
                    src={editForm.imageUrl}
                    alt="Preview"
                    className="h-24 w-24 object-cover rounded mt-2 border shadow transition-transform duration-200 hover:scale-105 mx-auto"
                  />
                )}
              </div>
              <InteractiveHoverButton
                type="submit"
                className="w-full shadow-lg hover:scale-[1.03] transition-transform duration-200 bg-orange-600 text-white"
              >
                Save Changes
              </InteractiveHoverButton>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
