'use client';

import { useEffect, useState, useMemo } from "react";
import { getUserOrders, getOrderDetails } from "@/services/order";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, parseISO, compareDesc } from "date-fns";
import type { Order, SimplifiedOrder } from "@/types/order";
import { useAuth } from "@/context/auth-context";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { CheckCircle, Truck, Package, XCircle, Loader2, ChevronDown } from "lucide-react";

const groupOrdersByMonth = (orders: SimplifiedOrder[]) => {
  const sortedOrders = [...orders].sort((a, b) =>
    compareDesc(parseISO(a.date), parseISO(b.date))
  );
  return sortedOrders.reduce((acc, order) => {
    const monthYear = format(parseISO(order.date), "MMMM yyyy");
    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(order);
    return acc;
  }, {} as Record<string, SimplifiedOrder[]>);
};

// Helper for status badge color
const statusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case "processing":
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">Processing</Badge>;
    case "shipped":
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">Shipped</Badge>;
    case "delivered":
      return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">Delivered</Badge>;
    case "cancelled":
      return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// Helper for progress bar value
const statusProgress = (status: string) => {
  switch (status.toLowerCase()) {
    case "processing": return 25;
    case "shipped": return 60;
    case "delivered": return 100;
    case "cancelled": return 0;
    default: return 0;
  }
};

// Helper for status icon
const statusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "processing": return <Loader2 className="text-yellow-500 animate-spin" size={18} />;
    case "shipped": return <Truck className="text-blue-500" size={18} />;
    case "delivered": return <CheckCircle className="text-green-500" size={18} />;
    case "cancelled": return <XCircle className="text-red-500" size={18} />;
    default: return <Package className="text-gray-400" size={18} />;
  }
};

export default function OrdersPage() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState<SimplifiedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, Order | null>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user?.email || !token) {
      // Keep this log for debugging auth issues
      console.error("Email or token missing. Please log in.");
      setLoading(false);
      setError("Please log in to view your orders.");
      return;
    }

    setError(null); // Reset error before fetch

    getUserOrders(user.email, token)
      .then((data) => {
        setOrders(data);
      })
      .catch((err) => {
        // Keep this log for debugging API errors
        console.error("Error fetching orders:", err);
        setError("Failed to load orders. Please try again later.");
      })
      .finally(() => setLoading(false));
  }, [user?.email, token]);
  
  async function handleViewDetails(orderId: string) {
    if (!user) {
      // Keep this log for debugging auth issues
      console.error("No user available. Please log in.");
      setError("Please log in to view order details.");
      return;
    }

    if (details[orderId]) {
      setDetails((prev) => ({ ...prev, [orderId]: null }));
      return;
    }

    setLoadingDetails((prev) => ({ ...prev, [orderId]: true }));
    try {
      const fullOrder = await getOrderDetails(orderId);
      setDetails((prev) => ({ ...prev, [orderId]: fullOrder || null }));
    } catch (err) {
      // Keep this log for debugging API errors
      console.error(`Error fetching order details for ${orderId}:`, err);
      setError("Failed to load order details. Please try again.");
    } finally {
      setLoadingDetails((prev) => ({ ...prev, [orderId]: false }));
    }
  }

  const groupedOrders = useMemo(() => groupOrdersByMonth(orders), [orders]);

  if (loading) return <div className="text-center py-20">Loading...</div>;

  if (error)
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-600">
        {error}
      </div>
    );

  const totalOrders = orders.length;

  return (
    <div className="container mx-auto px-2 py-6 md:px-4 md:py-8">
      {totalOrders === 0 ? (
        <Card className="text-center py-10 mt-8 shadow-sm">
          <CardTitle>No Orders</CardTitle>
          <CardDescription>You haven't placed any orders yet.</CardDescription>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedOrders).map(([monthYear, ordersInMonth]) => (
            <section key={monthYear}>
              <h2 className="text-lg font-semibold mb-3 pb-1 border-b border-border">{monthYear}</h2>
              <div className="space-y-4">
                {ordersInMonth.map((order) => (
                  <Card key={order.id} className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row justify-between items-center pb-1 gap-3">
                      <div className="flex-grow">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          {statusIcon(order.status)}
                          Order #{order.id.slice(-6).toUpperCase()}
                        </CardTitle>
                        <CardDescription className="text-xs">Placed: {format(parseISO(order.date), "PPP")}</CardDescription>
                      </div>
                      <div>{statusBadge(order.status)}</div>
                    </CardHeader>
                    <CardContent className="pt-1 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">{order.items} item(s)</span>
                        <span className="font-bold text-base text-primary">₹{order.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="w-28">
                        <Progress value={statusProgress(order.status)} />
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(order.id)}
                        disabled={loadingDetails[order.id]}
                        aria-expanded={!!details[order.id]}
                        aria-controls={`order-details-${order.id}`}
                        className="text-xs px-3 py-1 flex items-center gap-1"
                      >
                        {loadingDetails[order.id] ? <Loader2 className="h-3 w-3 animate-spin" /> : (details[order.id] ? "Hide" : "Details")}
                        {!loadingDetails[order.id] && <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${details[order.id] ? 'rotate-180' : ''}`} />}
                      </Button>
                    </CardContent>

                    {/* Order Details Section - Enhanced Styling and Transition */}
                    <div
                      id={`order-details-${order.id}`}
                      className={`overflow-hidden transition-all duration-300 ease-in-out border-t border-border dark:border-zinc-700 ${details[order.id] ? 'max-h-[1000px] opacity-100 py-4 px-4 md:px-6' : 'max-h-0 opacity-0 py-0 px-4 md:px-6'}`}
                      style={{ maxHeight: details[order.id] ? '1000px' : '0px' }} // Ensure max-height for transition
                    >
                      {details[order.id] && ( // Only render content if details are loaded and visible
                        <div className="space-y-4 bg-background dark:bg-zinc-800 p-4 rounded-md shadow-inner">
                          <div>
                            <h4 className="font-semibold text-md mb-2 text-foreground dark:text-zinc-100 border-b pb-1 dark:border-zinc-700">Shipping Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                              <div className="space-y-0.5">
                                <p className="font-medium text-foreground dark:text-zinc-200">{details[order.id]?.shippingDetails.name}</p>
                                <p className="text-muted-foreground dark:text-zinc-400">{details[order.id]?.shippingDetails.address}</p>
                                <p className="text-muted-foreground dark:text-zinc-400">
                                  {details[order.id]?.shippingDetails.city}, {details[order.id]?.shippingDetails.postalCode}
                                </p>
                                <p className="text-muted-foreground dark:text-zinc-400">{details[order.id]?.shippingDetails.country}</p>
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-muted-foreground dark:text-zinc-400">Email: {details[order.id]?.shippingDetails.email}</p>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="inline-flex items-center gap-1.5 cursor-default text-muted-foreground dark:text-zinc-400">
                                        Payment: {details[order.id]?.paymentStatus === 'completed' || details[order.id]?.paymentStatus === 'paid' ? <CheckCircle className="text-green-500" size={16} /> : <Loader2 className="text-yellow-500 animate-spin" size={16} />}
                                        <span className="capitalize">{details[order.id]?.paymentStatus}</span>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-popover text-popover-foreground dark:bg-zinc-700 dark:text-zinc-200">
                                      {details[order.id]?.paymentStatus === 'completed' || details[order.id]?.paymentStatus === 'paid' ? 'Payment received' : 'Awaiting payment confirmation'}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold text-md pt-3 mb-2 text-foreground dark:text-zinc-100 border-b pb-1 dark:border-zinc-700">Items Ordered</h4>
                            {details[order.id]?.items?.length ? (
                              <ul className="space-y-3">
                                {details[order.id]?.items.map((item) => (
                                  <li key={item.id || item.productId} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 dark:hover:bg-zinc-700/50 transition-colors">
                                    <img
                                      src={item.imageUrl || '/placeholder-image.png'} // Fallback image
                                      alt={item.name}
                                      width={50}
                                      height={50}
                                      className="rounded-md object-cover border border-border dark:border-zinc-700"
                                    />
                                    <div className="flex-grow">
                                      <p className="font-medium text-sm text-foreground dark:text-zinc-200">{item.name}</p>
                                      <p className="text-xs text-muted-foreground dark:text-zinc-400">
                                        Quantity: {item.quantity}
                                      </p>
                                    </div>
                                    <p className="text-sm font-semibold text-foreground dark:text-zinc-200">₹{(item.price * item.quantity).toFixed(2)}</p>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-muted-foreground dark:text-zinc-400">No items found in this order.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
