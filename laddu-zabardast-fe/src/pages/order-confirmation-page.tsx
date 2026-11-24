import { OrderInstructions } from "@/components/order-instructions";
import Link from "next/link";
import { saveInvoice } from "@/mobile/invoice";
import { Capacitor } from "@capacitor/core";
import { useSearchParams } from "next/navigation";
import { Button } from "@mui/material";
import { Check, Download, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { OrderSummary } from "@/components/order-summary";
import { motion } from "framer-motion";
import { Button as StorefrontButton } from "@/components/ui/button-new";
import { ConfettiFireworks } from "@/components/magicui/confetti";
import { generateInvoice } from "@/routes/orders";
import { getOrderDetails } from "@/queries";
import type { Order } from "@/models";
import { Row, Box } from "@/components/ui/layout";

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams?.get("orderId");

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError("Order ID not found in URL.");
        setIsLoading(false);
        console.error("Order ID not found in URL.");
        return;
      }

      setIsLoading(true);
      setError(null);
      setOrder(null);

      try {
        console.log(`Fetching order details for order ID: ${orderId}`);
        const orderData = await getOrderDetails(orderId);
        if (orderData) {
          console.log("Order details fetched successfully:", orderData);
          setOrder(orderData); // Ensure the backend response includes the totalAmount property
        } else {
          setError("Order not found.");
        }
      } catch (err) {
        console.error("Error fetching order details:", err);
        setError("Could not fetch order details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const downloadInvoice = async () => {
    if (!order?.id) return;
    setInvoiceError(null);
    setDownloadLoading(true);
    try {
      const response = await generateInvoice(order.id);
      await saveInvoice(response, order.id);
    } catch (error) {
      const detail = error instanceof Error ? ` ${error.message}` : "";
      setInvoiceError(`Could not download the invoice.${detail}`);
    } finally {
      setDownloadLoading(false);
    }
  };

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8 md:px-6 md:py-12 flex flex-col items-center justify-center min-h-[70vh]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-lg font-medium animate-pulse">
            Loading confirmation...
          </p>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 md:px-6 md:py-12 flex flex-col items-center justify-center min-h-[70vh]">
      {/* Confetti effect triggers on mount */}
      {order && <ConfettiFireworks />}
      <motion.div
        className="text-center space-y-6 max-w-2xl w-full"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.2,
          }}
        >
          <Check className="h-20 w-20 mx-auto text-green-500 drop-shadow-lg animate-bounce-in" />
        </motion.div>
        <motion.h1
          className="text-4xl md:text-5xl font-bold text-gradient mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {order ? "Order Confirmed!" : "Order confirmation unavailable"}
        </motion.h1>
        <motion.p
          className="text-lg text-muted-foreground mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {order && "Thank you for your purchase. Your order has been placed."}
        </motion.p>
        {error && <p className="text-red-500">{error}</p>}
        {order && (
          <motion.div
            className="bg-muted/70 p-6 rounded-xl border border-border space-y-4 text-left shadow-lg animate-fade-in"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Row className="flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
              <Box>
                <span className="text-xs text-muted-foreground">Order ID:</span>
                <span className="ml-2 text-base font-semibold text-primary">
                  {order.id}
                </span>
              </Box>
            </Row>
            <Box className="mb-2">
              <span className="font-medium text-lg">Order Summary</span>
              <OrderSummary items={order.items} />
            </Box>
            <OrderInstructions instructions={order.instructions} />
            <Row className="flex-col md:flex-row md:items-center md:justify-between gap-2 mt-4">
              {order.paymentMethod?.toLowerCase() === "cod" && (
                <p className="text-sm text-muted-foreground">Cash on delivery</p>
              )}
              <Box className="text-xl font-bold text-right text-primary">
                Total: ₹{(order.totalAmount || 0).toFixed(2)}
              </Box>
            </Row>
          </motion.div>
        )}
        <motion.div
          className="flex flex-col sm:flex-row justify-center gap-4 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <StorefrontButton asChild className="rounded-full bg-orange-600 px-6 text-white">
            <Link href="/">Continue Shopping</Link>
          </StorefrontButton>
          {order?.id && (
            <Button
              type="button"
              variant="outlined"
              startIcon={<Download className="h-4 w-4" />}
              disabled={downloadLoading}
              onClick={downloadInvoice}
            >
              {downloadLoading ? "Preparing invoice…" : Capacitor.isNativePlatform() ? "Save or share invoice" : "Download invoice"}
            </Button>
          )}
          <StorefrontButton asChild variant="outline" className="rounded-full px-6">
            <Link href="/orders"><FileText className="h-4 w-4" /> View Orders</Link>
          </StorefrontButton>
        </motion.div>
        {invoiceError && <p role="alert" className="text-sm text-destructive">{invoiceError}</p>}
      </motion.div>
    </main>
  );
}
