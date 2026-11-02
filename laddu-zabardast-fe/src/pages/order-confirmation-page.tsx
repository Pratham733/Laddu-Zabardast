// src/app/order-confirmation/page.tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@mui/material";
import { Check, Download, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks";
import { OrderSummary } from "@/components/order-summary";
import { AnimatePresence, motion } from "framer-motion";
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button";
import { ConfettiFireworks } from "@/components/magicui/confetti";
import { generateInvoice } from "@/routes";
import { getOrderDetails } from "@/queries";
import type { Order } from "@/models";
import { Row, Column, Box } from "@/components/ui/layout";

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams?.get("orderId");

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const { token } = useAuth();

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
    const oid = order?.id || (order as any)?.id;
    if (!oid) {
      console.error("Order ID not available for invoice download.");
      return;
    }
    if (!token) {
      alert("You must be logged in to download the invoice.");
      return;
    }
    setDownloadLoading(true);
    try {
      console.log(`Generating invoice for order ID: ${oid}`);
      const res = await generateInvoice(oid);
      // Log status and headers for diagnostics
      console.log("Invoice download response status:", res.status);
      console.log(
        "Invoice download response headers:",
        Array.from(res.headers.entries()),
      );
      if (!res.ok) {
        let backendError = await res.text();
        let errorMsg = `Failed to generate invoice. Status: ${res.status}`;
        try {
          const errJson = JSON.parse(backendError);
          if (errJson.error) errorMsg += `\n${errJson.error}`;
        } catch {
          if (backendError) errorMsg += `\n${backendError}`;
        }
        alert(errorMsg);
        console.error("Invoice download failed:", errorMsg);
        return;
      }
      // Check content-type and content-disposition
      const contentType = res.headers.get("content-type");
      const contentDisposition = res.headers.get("content-disposition");
      console.log("Content-Type:", contentType);
      console.log("Content-Disposition:", contentDisposition);
      if (!contentType?.includes("pdf")) {
        alert(`Unexpected content-type: ${contentType || "none"}`);
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${oid}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading invoice:", err);
      alert(
        `Could not download invoice. ${err instanceof Error ? err.message : ""}`,
      );
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
      <ConfettiFireworks />
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
          Order Confirmed!
        </motion.h1>
        <motion.p
          className="text-lg text-muted-foreground mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Thank you for your purchase. Your order has been successfully placed.
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
                  {order.id || (order as any).id}
                </span>
              </Box>
              <span className="text-xs text-green-600 font-medium">
                A confirmation email has been sent to your email address.
              </span>
            </Row>
            <Box className="mb-2">
              <span className="font-medium text-lg">Order Summary</span>
              <OrderSummary items={order.items as any} />
            </Box>
            <Row className="flex-col md:flex-row md:items-center md:justify-between gap-2 mt-4">
              <Box className="text-sm text-muted-foreground">
                {/* <span>Status:</span> <span className="font-semibold text-primary">{order.status}</span> */}
                {/* <span className="ml-4">Placed on: <span className="font-semibold">{new Date(order.date).toLocaleString()}</span></span> */}
              </Box>
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
          <Link href="/">
            <InteractiveHoverButton className="bg-orange-600 text-white shadow-md px-6 py-2 rounded-full hover:opacity-90 transition-opacity">
              Continue Shopping
            </InteractiveHoverButton>
          </Link>
          <Link href="/orders">
            <InteractiveHoverButton className="border border-gray-300 text-gray-900 bg-white shadow-md px-6 py-2 rounded-full hover:bg-gray-100 transition-colors flex items-center">
              <Row className="items-center">
                <FileText className="mr-2 h-4 w-4" /> View Orders
              </Row>
            </InteractiveHoverButton>
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}
