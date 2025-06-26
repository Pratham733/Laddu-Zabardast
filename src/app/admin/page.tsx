"use client";
import React from "react";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PackagePlus, ListOrdered, DollarSign, Tag, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import type { Product } from "@/types/product";
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  orderStatus: string; // Changed from status to orderStatus
  shippingDetails: {
    name: string;
    email: string;
  };
  items: OrderItem[];
  totalAmount: number;
  createdAt: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'completed';
  paymentMethod: 'cod' | 'card' | 'upi' | 'cash';
}

interface ProductFormState {
  name: string;
  price: string;
  category: string;
  description: string;
  imageUrl: string;
}

export default function AdminPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [productImageUrl, setProductImageUrl] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<ProductFormState>({
    name: '',
    price: '',
    category: '',
    description: '',
    imageUrl: ''
  });
  const [category, setCategory] = useState<'laddu' | 'pickle' | 'all'>('laddu');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoadingOrders(true);
      try {
        const response = await fetch("/api/orders", {
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch orders: ${response.status}`);
        }
        const data = await response.json();
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
        const res = await fetch("/api/add-product");
        const data = await res.json();
        setProducts(data.products || []);
      } catch (error) {
        toast({ title: "Error", description: "Failed to fetch products.", variant: "destructive" });
      } finally {
        setIsLoadingProducts(false);
      }
    }
    fetchProducts();
  }, [isSubmittingProduct]);

  // File upload section component
  interface FileUploadSectionProps {
    fileInputRef: React.RefObject<HTMLInputElement>;
    dragActive: boolean;
    setDragActive: (active: boolean) => void;
    isUploadingImage: boolean;
    uploadProgress: number;
    productImageUrl: string;
    handleFileUpload: (file: File) => Promise<void>;
  }

  const FileUploadSection: React.FC<FileUploadSectionProps> = ({
    fileInputRef,
    dragActive,
    setDragActive,
    isUploadingImage,
    uploadProgress,
    productImageUrl,
    handleFileUpload
  }) => {
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) {
        handleFileUpload(file);
      }
    };

    const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileUpload(file);
      }
    };

    return (
      <div
        className={`relative border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center transition-colors duration-200 ${
          dragActive ? 'border-primary bg-primary/10' : 'border-muted bg-muted/30'
        } ${isUploadingImage ? 'opacity-60 pointer-events-none' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ cursor: isUploadingImage ? 'not-allowed' : 'pointer' }}
        onClick={() => !isUploadingImage && fileInputRef.current?.click()}
      >      {productImageUrl && productImageUrl.trim() ? (
        <img 
          src={productImageUrl.trim()} 
          alt="Product Preview" 
          className="h-32 rounded border-2 border-primary/40 mb-2 shadow-lg transition-transform hover:scale-105" 
        />
      ) : (
        <>
          <ImageIcon className="h-10 w-10 text-primary mb-2 animate-bounce" />
          <span className="text-sm text-muted-foreground">Drag & drop or click to upload</span>
        </>
      )}      <input
        type="file"
        id="product-image"
        name="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleProductImageChange}
        disabled={isUploadingImage}
        multiple={false}
      />
        {isUploadingImage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-black/70 rounded-lg">
            <span className="text-primary font-semibold">Uploading...</span>
            <div className="w-32 h-2 bg-muted rounded mt-2 overflow-hidden">
              <div 
                className="h-2 bg-primary rounded transition-all" 
                style={{ width: `${uploadProgress}%` }} 
              />
            </div>
          </div>
        )}
      </div>
    );
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
        category: formData.get("category") as string,
        description: formData.get("description") as string,
        imageUrl: productImageUrl, // Use the already uploaded image URL
      };

      const response = await fetch("/api/add-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(product),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to add product" }));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      toast({
        title: "Product Added",
        description: `${product.name} has been successfully added.`,
      });

      // Reset form and state
      form.reset();
      setProductImageUrl("");
      if (fileInputRef.current) fileInputRef.current.value = "";

    } catch (error: any) {
      console.error("Error adding product:", error);
      toast({
        title: "Error Adding Product",
        description: error.message || "Could not add the product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      if (!response.ok) {
        throw new Error("Failed to update order status");
      }
      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId ? { ...order, orderStatus: newStatus } : order // Update orderStatus
        )
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

  const handlePaymentStatusUpdate = async (orderId: string, newPaymentStatus: 'completed' | 'paid') => {
    try {
      const response = await fetch(`/api/orders`, { // Assuming the same endpoint can handle payment status
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ orderId, paymentStatus: newPaymentStatus }), // Send paymentStatus
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to update payment status" }));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }
      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId ? { ...order, paymentStatus: newPaymentStatus } : order
        )
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

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ 
        title: "Error", 
        description: "Please upload an image file", 
        variant: "destructive" 
      });
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast({ 
        title: "Error", 
        description: "File size must be less than 5MB", 
        variant: "destructive" 
      });
      return;
    }

    setIsUploadingImage(true);
    setUploadProgress(0);    try {
      // Create the form data
      const formData = new FormData();
      formData.append('file', file);

      // Log the file details
      console.log('File details:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      // Make the request
      const response = await fetch('/api/upload-product-image', {
        method: 'POST',
        body: formData,
        // Do not set any headers - let the browser handle it
      });

      // Log response details
      console.log('Upload response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload error response:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || `Upload failed with status ${response.status}`);
        } catch (e) {
          throw new Error(`Upload failed: ${errorText || response.statusText}`);
        }
      }

      const data = await response.json();
      console.log('Upload success response:', data);
      
      setProductImageUrl(data.url);
      toast({ 
        title: "Success", 
        description: "Image uploaded successfully" 
      });

    } catch (err) {
      console.error('Upload error:', err);
      toast({ 
        title: "Upload Failed", 
        description: err instanceof Error ? err.message : "An unexpected error occurred", 
        variant: "destructive" 
      });
    } finally {
      setIsUploadingImage(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, []);

  return (
    <div className="container mx-auto px-2 sm:px-4 py-6 md:px-6 md:py-12">
      {/* Add a beautiful Hello message at the top of the Admin Dashboard */}
      <div className="relative flex flex-col items-center justify-center mb-6 sm:mb-8 animate-fade-in">
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-0 blur-xl opacity-40 w-40 sm:w-60 h-16 sm:h-24 bg-gradient-to-r from-primary to-secondary rounded-full" />
        <div className="bg-gradient-to-r from-primary to-secondary rounded-full p-0.5 sm:p-1 shadow-2xl mb-2 z-10 border-2 sm:border-4 border-white dark:border-zinc-900">
          <img src="/images/logo.png" alt="Logo" className="h-14 w-14 sm:h-20 sm:w-20 rounded-full border-2 sm:border-4 border-white shadow-xl" />
        </div>
      </div>

      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-8 md:mb-12 text-gradient">
        Admin Dashboard
      </h1>

      <div className="grid grid-cols-1 gap-3 sm:gap-6 lg:grid-cols-2 lg:gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-2xl">
              <ListOrdered className="h-5 w-5 sm:h-6 sm:w-6 text-primary" /> Order Management
            </CardTitle>
            <CardDescription className="text-xs sm:text-base">View and manage customer orders.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto p-1 sm:p-2 md:p-4">
            {isLoadingOrders ? (
              <p className="text-muted-foreground text-sm sm:text-base">Loading orders...</p>
            ) : orders.length > 0 ? (
              <div className="w-full overflow-x-auto relative">
                {/* Mobile scroll hint overlay */}
                <div className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-white/80 dark:from-zinc-900/80 to-transparent hidden xs:block" style={{zIndex:2}} />
                <Table className="min-w-[340px] xs:min-w-[420px] sm:min-w-[600px] border-separate border-spacing-y-1 sm:border-spacing-y-2 text-xs sm:text-sm">
                  <TableHeader>
                    <TableRow>{/*No whitespace*/}<TableHead>Order ID</TableHead><TableHead>Customer</TableHead><TableHead>Order Status</TableHead><TableHead>Payment Status</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Update Order Status</TableHead><TableHead>Update Payment</TableHead>{/*No whitespace*/}</TableRow>
                  </TableHeader>
                  <TableBody>
                  {orders.map((order) => (
  <React.Fragment key={order._id}>
    <TableRow>
      <TableCell className="font-medium truncate max-w-[100px]">{order._id}</TableCell>
      <TableCell>{order.shippingDetails?.name || 'N/A'}</TableCell>
      <TableCell>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          order.orderStatus === 'delivered' ? 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100' :
          order.orderStatus === 'processing' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100' :
          order.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100' :
          order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100' :
          'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100'
        }`}>
          {order.orderStatus}
        </span>
      </TableCell>
      <TableCell>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${
          order.paymentStatus === 'paid' || order.paymentStatus === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100' :
          order.paymentStatus === 'pending' ? 'bg-orange-100 text-orange-700 dark:bg-orange-700 dark:text-orange-100' :
          order.paymentStatus === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100' :
          'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100'
        }`}>
          {order.paymentStatus}
        </span>
      </TableCell>
      <TableCell className="text-right">₹{order.totalAmount?.toFixed(2) || '0.00'}</TableCell>
      <TableCell>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const formElement = e.currentTarget;
            const select = formElement.elements.namedItem('orderStatusSelect') as HTMLSelectElement;
            if (order.orderStatus === 'delivered') {
              toast({
                title: 'Order Already Delivered',
                description: 'Delivered orders cannot have their status changed.',
                variant: 'destructive',
              });
              return;
            }
            await handleStatusChange(order._id, select.value);
          }}
          className="flex flex-row gap-2 items-center"
        >
          <select
            name="orderStatusSelect"
            defaultValue={order.orderStatus}
            className="border rounded px-2 py-1.5 bg-background dark:bg-zinc-800 dark:text-white text-xs focus:ring-primary focus:border-primary"
            disabled={order.orderStatus === 'delivered'}
          >
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <InteractiveHoverButton
            type="submit"
            className="px-3 py-1.5 text-xs border"
            disabled={order.orderStatus === 'delivered'}
          >
            Update
          </InteractiveHoverButton>
        </form>
      </TableCell>
      <TableCell className="text-left">
        {typeof order.paymentMethod !== 'string' && (
          <span className="text-xs text-red-500 font-semibold">No payment method</span>
        )}
        {(order.paymentMethod && (order.paymentMethod.toLowerCase() === 'cod' || order.paymentMethod.toLowerCase() === 'cash') && order.paymentStatus !== 'paid' && order.paymentStatus !== 'completed') && (
          <InteractiveHoverButton
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 text-xs"
            onClick={() => handlePaymentStatusUpdate(order._id, 'completed')}
          >
            Mark as Paid
          </InteractiveHoverButton>
        )}
      </TableCell>
      <TableCell>
        <button
          className="text-primary underline text-xs"
          onClick={() => setExpandedOrderId(expandedOrderId === order._id ? null : order._id)}
        >
          {expandedOrderId === order._id ? "Hide Details" : "View Details"}
        </button>
      </TableCell>
    </TableRow>

    {expandedOrderId === order._id && (
      <TableRow>
        <TableCell colSpan={8} className="bg-white dark:bg-zinc-900/90 p-4 rounded-b-xl border-t border-primary/20 shadow-inner">
          <div className="space-y-3">
            <div className="font-semibold text-base mb-1 text-primary dark:text-yellow-400">Order Details</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="font-semibold mb-1 text-secondary dark:text-blue-400">Shipping Information</div>
                <div className="text-sm">
                  <div><span className="font-medium">Name:</span> <span className="dark:text-zinc-100">{order.shippingDetails.name}</span></div>
                  <div><span className="font-medium">Email:</span> <span className="dark:text-zinc-100">{order.shippingDetails.email}</span></div>
                </div>
              </div>
              <div>
                <div className="font-semibold mb-1 text-secondary dark:text-blue-400">Order Info</div>
                <div className="text-sm">
                  <div><span className="font-medium">Order ID:</span> <span className="dark:text-zinc-100">{order._id}</span></div>
                  <div><span className="font-medium">Status:</span> <span className="dark:text-zinc-100">{order.orderStatus}</span></div>
                  <div><span className="font-medium">Payment:</span> <span className="dark:text-zinc-100">{order.paymentStatus} ({order.paymentMethod})</span></div>
                  <div><span className="font-medium">Placed on:</span> <span className="dark:text-zinc-100">{new Date(order.createdAt).toLocaleString()}</span></div>
                </div>
              </div>
            </div>
            <div className="font-semibold mt-2 mb-1 text-secondary dark:text-blue-400">Items</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border rounded shadow bg-zinc-50 dark:bg-zinc-800/80">
                <thead>
                  <tr className="bg-primary/10 dark:bg-primary/20">
                    <th className="px-2 py-1 text-left text-zinc-700 dark:text-zinc-100">Name</th>
                    <th className="px-2 py-1 text-center text-zinc-700 dark:text-zinc-100">Qty</th>
                    <th className="px-2 py-1 text-right text-zinc-700 dark:text-zinc-100">Unit Price</th>
                    <th className="px-2 py-1 text-right text-zinc-700 dark:text-zinc-100">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-b last:border-b-0 border-zinc-200 dark:border-zinc-700">
                      <td className="px-2 py-1 dark:text-zinc-100">{item.name}</td>
                      <td className="px-2 py-1 text-center dark:text-zinc-100">{item.quantity}</td>
                      <td className="px-2 py-1 text-right dark:text-zinc-100">₹{item.price.toFixed(2)}</td>
                      <td className="px-2 py-1 text-right font-semibold dark:text-zinc-100">₹{(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-2">
              <span className="font-bold text-lg text-primary dark:text-yellow-400">Total: ₹{order.totalAmount?.toFixed(2) || '0.00'}</span>
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
              <p className="text-muted-foreground text-sm sm:text-base">No orders available at the moment.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-2xl">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-2xl">
              <PackagePlus className="h-5 w-5 sm:h-6 sm:w-6 text-primary animate-bounce" /> Add New Product
            </CardTitle>
            <CardDescription className="text-xs sm:text-base text-muted-foreground">Fill in the details to add a new product to the store.</CardDescription>
          </CardHeader>
          <CardContent>
            <form encType="multipart/form-data" onSubmit={handleAddProduct} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <Label htmlFor="name" className="flex items-center gap-1 mb-1 font-semibold text-primary">
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
                  <Label htmlFor="price" className="flex items-center gap-1 mb-1 font-semibold text-primary">
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
                  {/* Category tab buttons */}
                  <InteractiveHoverButton type="button" className={`transition-all duration-200 shadow-md ${category === 'laddu' ? 'bg-orange-600 text-white' : 'border'}`} onClick={() => setCategory('laddu')}>Laddu</InteractiveHoverButton>
                  <InteractiveHoverButton type="button" className={`transition-all duration-200 shadow-md ${category === 'pickle' ? 'bg-orange-600 text-white' : 'border'}`} onClick={() => setCategory('pickle')}>Pickle</InteractiveHoverButton>
                  <InteractiveHoverButton type="button" className={`transition-all duration-200 shadow-md ${category === 'all' ? 'bg-orange-600 text-white' : 'border'}`} onClick={() => setCategory('all')}>All</InteractiveHoverButton>
                </div>
                <input type="hidden" name="category" value={category} />
              </div>
              <div>
                <Label htmlFor="description" className="flex items-center gap-1 mb-1 font-semibold text-primary">
                  <FileText className="h-4 w-4" /> Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  required
                  rows={3}
                  placeholder="Describe the product..."
                  className="bg-background/70 border-2 border-primary/30 focus:border-primary/70 shadow-sm"
                  disabled={isSubmittingProduct}
                />
              </div>
              <div>
                <Label htmlFor="product-image" className="flex items-center gap-1 mb-1 font-semibold text-primary">
                  <ImageIcon className="h-4 w-4" /> Product Image
                </Label>
                <FileUploadSection
                  fileInputRef={fileInputRef}
                  dragActive={dragActive}
                  setDragActive={setDragActive}
                  isUploadingImage={isUploadingImage}
                  uploadProgress={uploadProgress}
                  productImageUrl={productImageUrl}
                  handleFileUpload={handleFileUpload}
                />
              </div>
              <Button 
                type="submit" 
                disabled={isSubmittingProduct || isUploadingImage} 
                className="w-full"
              >
                {isSubmittingProduct ? 'Adding Product...' : 'Add Product'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg mt-8 sm:mt-10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-2xl">
            <ListOrdered className="h-5 w-5 sm:h-6 sm:w-6 text-primary animate-fade-in" /> Product Management
          </CardTitle>
          <CardDescription className="text-xs sm:text-base">View, edit, and update all products.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingProducts ? (
            <div className="flex flex-col items-center justify-center py-8 sm:py-12 animate-pulse">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted mb-4" />
              <p className="text-muted-foreground text-base sm:text-lg font-semibold">Loading products...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="overflow-x-auto transition-all duration-500">
              <Table className="min-w-[600px] sm:min-w-full border-separate border-spacing-y-2 text-xs sm:text-sm">
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-black dark:to-zinc-900">{/*No whitespace*/}<TableHead className="text-center">Image</TableHead><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Price</TableHead><TableHead>Description</TableHead><TableHead>Actions</TableHead>{/*No whitespace*/}</TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((prod, idx) => (
                    <TableRow
                      key={prod._id || prod.id}
                      className="group hover:scale-[1.01] hover:shadow-xl transition-all duration-300 bg-white/90 dark:bg-black hover:bg-gradient-to-r hover:from-primary/5 hover:to-secondary/10 dark:hover:from-zinc-900 dark:hover:to-black"
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >{/*No whitespace*/}
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
                      <TableCell className="font-semibold text-primary/90 dark:text-white text-black">{prod.name}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold transition-colors duration-200 ${prod.category === 'laddu' ? 'bg-yellow-100 text-yellow-700' : prod.category === 'pickle' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'} dark:bg-zinc-800 dark:text-white`}>{prod.category}</span>
                      </TableCell>
                      <TableCell className="font-mono text-lg font-bold text-secondary dark:text-white text-black">₹{prod.price}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground dark:text-white text-black">{prod.description}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {/* Edit/Delete buttons */}
                          <InteractiveHoverButton className="transition-all duration-200 hover:scale-105 bg-orange-600 text-white px-3 py-1 rounded" onClick={() => {
                            setEditingProduct(prod);
                            setEditForm({
                              name: prod.name,
                              price: prod.price.toString(),
                              category: prod.category,
                              description: prod.description,
                              imageUrl: prod.imageUrl
                            });
                          }}>Edit</InteractiveHoverButton>
                          <InteractiveHoverButton className="transition-all duration-200 hover:scale-105 bg-red-600 text-white px-3 py-1 rounded" onClick={async () => {
                            if (confirm(`Are you sure you want to delete '${prod.name}'?`)) {
                              const res = await fetch(`/api/add-product?id=${prod._id || prod.id}`, {
                                method: 'DELETE',
                              });
                              if (res.ok) {
                                toast({ title: 'Product Deleted', description: `'${prod.name}' has been deleted.` });
                                const data = await res.json();
                                setProducts(data.products || []);
                              } else {
                                toast({ title: 'Delete Failed', description: 'Could not delete product.', variant: 'destructive' });
                              }
                            }
                          }}>Delete</InteractiveHoverButton>
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
              <p className="text-muted-foreground text-base sm:text-lg font-semibold">No products available.</p>
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
            <h2 className="text-2xl font-bold mb-6 text-center text-gradient">Edit Product</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const res = await fetch(`/api/add-product?id=${editingProduct._id || editingProduct.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ...editForm }),
                });
                if (res.ok) {
                  toast({ title: 'Product Updated', description: 'Product details updated.' });
                  setEditingProduct(null);
                  const data = await res.json();
                  setProducts(data.products || []);
                } else {
                  toast({ title: 'Update Failed', description: 'Could not update product.', variant: 'destructive' });
                }
              }}
              className="space-y-5"
            >
              <div>
                <Label htmlFor="edit-name" className="mb-1 font-semibold">Name</Label>
                <Input id="edit-name" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required placeholder="Name" className="bg-background/70" />
              </div>
              <div>
                <Label htmlFor="edit-price" className="mb-1 font-semibold">Price (₹)</Label>
                <Input id="edit-price" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} required type="number" min="0" step="0.01" placeholder="Price" className="bg-background/70 text-black dark:text-white" />
              </div>
              <div>
                <Label className="mb-1 font-semibold">Category</Label>
                <div className="flex gap-2 mb-2">
                  <InteractiveHoverButton type="button" onClick={() => setEditForm(f => ({ ...f, category: 'laddu' }))} className="transition-all duration-200">Laddu</InteractiveHoverButton>
                  <InteractiveHoverButton type="button" onClick={() => setEditForm(f => ({ ...f, category: 'pickle' }))} className="transition-all duration-200">Pickle</InteractiveHoverButton>
                  <InteractiveHoverButton type="button" onClick={() => setEditForm(f => ({ ...f, category: 'all' }))} className="transition-all duration-200">All</InteractiveHoverButton>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-description" className="mb-1 font-semibold">Description</Label>
                <Textarea id="edit-description" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} required rows={3} placeholder="Description" className="bg-background/70" />
              </div>
              <div>
                <Label htmlFor="edit-imageUrl" className="mb-1 font-semibold">Image URL</Label>
                <Input id="edit-imageUrl" value={editForm.imageUrl} onChange={e => setEditForm(f => ({ ...f, imageUrl: e.target.value }))} required placeholder="Image URL" className="bg-background/70" />
                {editForm.imageUrl && (
                  <img src={editForm.imageUrl} alt="Preview" className="h-24 w-24 object-cover rounded mt-2 border shadow transition-transform duration-200 hover:scale-105 mx-auto" />
                )}
              </div>
              <InteractiveHoverButton type="submit" className="w-full shadow-lg hover:scale-[1.03] transition-transform duration-200 bg-orange-600 text-white">Save Changes</InteractiveHoverButton>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
