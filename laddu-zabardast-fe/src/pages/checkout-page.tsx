import React, { useEffect, useState } from "react";
import { Container, Column, Row, Box } from "@/components/ui/layout";
import { Button } from "@mui/material";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cartLineInput } from "@/packets/cart";
import { BoxContents } from "@/components/box-contents";
import { createOrder } from "@/routes/orders";
import { getAddresses, saveAddress } from "@/routes/address";
import { getProductById } from "@/routes/products";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useCart, useAuth, toast } from "@/hooks";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, House, CreditCard, Landmark } from "lucide-react";
import Image from "next/image";

import type { Address, CartItem } from "@/models";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button";
import { addressSchema, formSchema, ORDER_INSTRUCTIONS_LIMIT, type FormSchema } from "@/schema";

// Extend JSX.IntrinsicElements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      form: React.DetailedHTMLProps<
        React.FormHTMLAttributes<HTMLFormElement>,
        HTMLFormElement
      >;
      div: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLDivElement>,
        HTMLDivElement
      >;
      span: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLSpanElement>,
        HTMLSpanElement
      >;
      img: React.DetailedHTMLProps<
        React.ImgHTMLAttributes<HTMLImageElement>,
        HTMLImageElement
      >;
    }
  }
}

const addressLabel = (address: Address) =>
  [address.label, address.street, address.city, address.postalCode].filter(Boolean).join(", ") +
  (address.isDefault ? " (Default)" : "");

const upiQrUrl = import.meta.env.VITE_UPI_QR_URL?.trim();

export default function CheckoutPage() {
  const { cart, clearCart, isInitialised } = useCart();
  const buyNow = useSearchParams().get("buyNow")?.trim() || "";
  const [directOrder, setDirectOrder] = useState<{ id: string; item?: CartItem }>();
  const directReady = directOrder?.id === buyNow;
  const orderItems = buyNow
    ? (directReady && directOrder.item ? [directOrder.item] : [])
    : cart;
  const total = orderItems.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0) / 100;
  const checkoutReady = buyNow ? directReady : isInitialised;
  const { user } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [addressLoading, setAddressLoading] = useState(true);
  const [addressError, setAddressError] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);
  const chosenAddress = savedAddresses.find((address) => address.id === selectedAddress);
  const [savedPhones, setSavedPhones] = useState<string[]>([]);
  const [selectedPhone, setSelectedPhone] = useState(user?.phone ? "profile" : "new"); // 'profile' or 'new'
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "cod">("cod");

  useEffect(() => {
    setIsClient(true); // Ensure this runs only on the client
  }, []);

  useEffect(() => {
    if (!buyNow) return;
    let active = true;
    getProductById(buyNow)
      .then(({ product }) => {
        if (!active) return;
        const item = product.id && product.available !== false && product.price > 0
          ? { ...product, id: product.id, quantity: 1 }
          : undefined;
        setDirectOrder({ id: buyNow, item });
      })
      .catch(() => { if (active) setDirectOrder({ id: buyNow }); });
    return () => { active = false; };
  }, [buyNow]);

  useEffect(() => {
    if (!buyNow && isClient && isInitialised && cart.length === 0 && !isProcessing) {
      router.push("/");
    }
  }, [buyNow, cart.length, router, isClient, isProcessing, isInitialised]);

  const userId = user?.userId;
  useEffect(() => {
    if (!userId) return;
    let active = true;
    getAddresses().then(({ addresses }) => {
      if (!active) return;
      const saved = addresses.filter((address) => Boolean(address.id));
      setSavedAddresses(saved);
      setSelectedAddress((current) =>
        current || saved.find((address) => address.isDefault)?.id || saved[0]?.id || "new"
      );
    }).catch(() => {
      if (!active) return;
      setAddressError("Saved addresses could not be loaded. You can enter a new address.");
      setSelectedAddress("new");
    }).finally(() => { if (active) setAddressLoading(false); });
    return () => { active = false; };
  }, [userId]);

  useEffect(() => {
    setSavedPhones(user?.phone ? [user.phone] : []);
  }, [user?.phone]);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    },
  });

  // Update default values if user loads after form init
  useEffect(() => {
    if (user) {
      form.reset({
        ...form.getValues(),
        name:
          form.getValues("name") ||
          (user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : ""),
        email: form.getValues("email") || (user.email ?? ""),
        phone: form.getValues("phone") || (user.phone ?? ""),
        address: form.getValues("address") || "",
        city: form.getValues("city") || "",
        postalCode: form.getValues("postalCode") || "",
        country: form.getValues("country") || "",
      });
    }
  }, [user, form]);

  useEffect(() => {
    if (!selectedAddress) return;
    const address = chosenAddress;
    form.setValue("address", address?.street ?? "");
    form.setValue("city", address?.city ?? "");
    form.setValue("state", address?.state ?? "");
    form.setValue("postalCode", address?.postalCode ?? "");
    form.setValue("country", address?.country ?? "");
    form.clearErrors(["address", "city", "state", "postalCode", "country"]);
  }, [selectedAddress, chosenAddress, form]);

  const handleSaveAddress = async () => {
    const values = form.getValues();
    const parsed = addressSchema.safeParse({
      street: values.address.trim(), city: values.city.trim(), state: values.state?.trim() ?? "",
      postalCode: values.postalCode.trim(), country: values.country.trim(),
    });
    if (!parsed.success) {
      setAddressError(parsed.error.issues[0]?.message ?? "Enter a complete address.");
      return;
    }
    setSavingAddress(true);
    setAddressError("");
    try {
      const { addresses, addressId } = await saveAddress(parsed.data);
      setSavedAddresses(addresses);
      setSelectedAddress(addressId);
      toast({ title: "Address saved" });
    } catch (error) {
      setAddressError(error instanceof Error ? error.message : "Could not save the address.");
    } finally {
      setSavingAddress(false);
    }
  };

  // Effect to update phone field when selectedPhone changes
  useEffect(() => {
    if (selectedPhone === "profile" && savedPhones.length > 0) {
      form.setValue("phone", savedPhones[0] ?? "");
    } else if (selectedPhone === "new") {
      form.setValue("phone", "");
    }
  }, [selectedPhone, savedPhones, form]);

  const onSubmit = async (data: FormSchema) => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "Please log in to complete your order.",
        variant: "destructive",
      });
      router.push(`/login?redirect=/checkout`);
      return;
    }
    if (!checkoutReady || orderItems.length === 0 || addressLoading || savingAddress || isProcessing) return;
    setIsProcessing(true);
    toast({
      title: "Processing Order...",
      description: "Please wait while we confirm your order.",
    });

    try {
      const { instructions, ...shippingDetails } = data;
      const orderData = {
        shippingDetails,
        instructions,
        items: orderItems.map(cartLineInput),
        totalAmount: total,
        paymentMethod: paymentMethod,
      };

      const result = await createOrder(orderData);
      const { orderId } = result;

      if (!buyNow) clearCart();
      toast({
        title: "Order Successful!",
        description: "Thank you for your purchase. Your order is confirmed.",
        variant: "default",
      });
      router.push(`/order-confirmation?orderId=${orderId}`);
    } catch (orderError) {
      console.error("Order creation error:", orderError);
      toast({
        title: "Order Creation Failed",
        description: `There was an issue saving your order: ${orderError instanceof Error ? orderError.message : "Unknown error"}. Please contact support.`,
        variant: "destructive",
        duration: 10000,
      });
      setIsProcessing(false);
    }
  };

  if (buyNow && directReady && !directOrder.item) {
    return <Container className="px-4 py-8 md:px-6 md:py-12">
      <p>This product is unavailable for checkout.</p>
      <Button onClick={() => router.push("/shop")}>Back to shop</Button>
    </Container>;
  }

  if (!isClient || !checkoutReady || (total === 0 && !isProcessing)) {
    return (
      <Container className="px-4 py-8 md:px-6 md:py-12">
        <h1 className="text-3xl font-bold mb-6 text-gradient">
          Loading Checkout...
        </h1>
        <Row className="justify-center items-center py-16">
          <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
        </Row>
      </Container>
    );
  }

  return (
    <Container className="px-2 sm:px-4 py-6 md:px-6 md:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-gradient text-center">
        Checkout
      </h1>
      <Box className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-8">
        <Box className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">
                Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4 sm:space-y-6"
                >
                  <Box className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Your Name"
                              {...field}
                              disabled={isProcessing}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="your.email@example.com"
                              {...field}
                              disabled={isProcessing}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormItem className="mb-3 sm:mb-4">
                      <FormLabel className="text-sm sm:text-base">
                        Select Mobile Number
                      </FormLabel>
                      <Select
                        onValueChange={(value) => setSelectedPhone(value)}
                        defaultValue={selectedPhone}
                        disabled={isProcessing}
                      >
                        <FormControl>
                          <SelectTrigger className="select-trigger w-full">
                            <SelectValue
                              placeholder="Choose a saved number or add new"
                              className="select-value w-full"
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem
                            value="profile"
                            className="flex items-center h-12 px-4 text-base"
                          >
                            {savedPhones.length > 0
                              ? savedPhones[0]
                              : "No saved number"}
                          </SelectItem>
                          <SelectItem
                            value="new"
                            className="flex items-center h-12 px-4 text-base"
                          >
                            Add New Number
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                    {selectedPhone === "new" && (
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder="+919999999999"
                                {...field}
                                disabled={isProcessing}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </Box>

                  {/* Address Selection Dropdown */}
                  <FormItem className="mb-3 sm:mb-4">
                    <Label htmlFor="checkout-address" className="text-sm sm:text-base">
                      Select Address
                    </Label>
                    <Select
                      onValueChange={(value) => { if (value) { setSelectedAddress(value); setAddressError(""); } }}
                      value={selectedAddress}
                      disabled={isProcessing || addressLoading || savingAddress}
                    >
                      <FormControl>
                        <SelectTrigger id="checkout-address" aria-label="Select Address" className="select-trigger w-full">
                          <SelectValue
                            placeholder={addressLoading ? "Loading addresses…" : "Choose a saved address or add new"}
                            className="select-value w-full"
                          >
                            {chosenAddress ? addressLabel(chosenAddress) : selectedAddress === "new" ? "Add Address" : undefined}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {savedAddresses.map((addr) => addr.id && (
                          <SelectItem key={addr.id} value={addr.id} className="flex items-center h-12 px-4 text-base">
                            {addressLabel(addr)}
                          </SelectItem>
                        ))}
                        <SelectItem value="new" className="flex items-center h-12 px-4 text-base">
                          <Row className="items-center">
                            <House className="mr-2 h-4 w-4" />
                            Add Address
                          </Row>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="123 Sweet Lane"
                            {...field}
                            readOnly={selectedAddress !== "new"}
                            disabled={isProcessing || savingAddress || addressLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Box className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Foodville"
                              {...field}
                              readOnly={selectedAddress !== "new"}
                              disabled={isProcessing || savingAddress || addressLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="12345"
                              {...field}
                              readOnly={selectedAddress !== "new"}
                              disabled={isProcessing || savingAddress || addressLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="India"
                              {...field}
                              readOnly={selectedAddress !== "new"}
                              disabled={isProcessing || savingAddress || addressLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Box>

                  {selectedAddress === "new" && (
                    <div className="flex flex-wrap items-end gap-3">
                      <FormField control={form.control} name="state" render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl><Input {...field} value={field.value ?? ""} disabled={isProcessing || savingAddress} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <Button type="button" variant="outlined" disabled={isProcessing || savingAddress} onClick={handleSaveAddress}>
                        {savingAddress ? "Saving address…" : "Save address"}
                      </Button>
                    </div>
                  )}
                  {addressError && <p role="alert" className="text-sm text-destructive">{addressError}</p>}

                  <Separator className="my-4 sm:my-6" />

                  <FormField
                    control={form.control}
                    name="instructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order instructions (optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value ?? ""}
                            rows={3}
                            placeholder="For example, pack the boxes separately."
                            disabled={isProcessing}
                          />
                        </FormControl>
                        <FormDescription>Up to {ORDER_INSTRUCTIONS_LIMIT} characters.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator className="my-4 sm:my-6" />

                  {/* Payment Method Selection */}
                  <FormItem className="space-y-2 sm:space-y-3">
                    <FormLabel className="text-base">Payment Method</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value: "upi" | "cod") =>
                          setPaymentMethod(value)
                        }
                        defaultValue={paymentMethod}
                        className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-4"
                      >
                        {upiQrUrl && (
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="upi" id="upi" />
                            </FormControl>
                            <FormLabel htmlFor="upi" className="font-normal flex items-center">
                              <CreditCard className="mr-2 h-5 w-5 text-primary" />
                              UPI / QR Code
                            </FormLabel>
                          </FormItem>
                        )}
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="cod" id="cod" />
                          </FormControl>
                          <FormLabel
                            htmlFor="cod"
                            className="font-normal flex items-center"
                          >
                            <Landmark className="mr-2 h-5 w-5 text-green-600" />{" "}
                            Cash on Delivery
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>

                  {/* QR Code Payment Section - Conditional */}
                  {paymentMethod === "upi" && upiQrUrl && (
                    <Column className="my-6 p-6 border rounded-md bg-card items-center shadow-sm transition-all duration-300 ease-in-out">
                      <CardTitle className="text-xl mb-4 text-center">
                        Scan to Pay with UPI
                      </CardTitle>
                      <Box className="mb-4 p-2 border rounded-md inline-block bg-background">
                        <Image
                          src={upiQrUrl}
                          alt="QR Code for Payment"
                          width={250}
                          height={250}
                          className="rounded-md"
                          data-ai-hint="qr code payment"
                        />
                      </Box>
                      <p className="text-sm text-muted-foreground mt-2 text-center">
                        Scan the QR code with your payment app. After paying, submit the order for payment verification.
                      </p>
                    </Column>
                  )}

                  <InteractiveHoverButton
                    type="submit"
                    className="w-full mt-4 sm:mt-6 text-base sm:text-lg py-3 sm:py-4"
                    disabled={isProcessing || savingAddress || addressLoading || orderItems.length === 0}
                  >
                    {isProcessing ? (
                      <>
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Confirming Order...
                      </>
                    ) : paymentMethod === "upi" ? (
                      `I have made the UPI payment - ₹${total.toFixed(2)}`
                    ) : (
                      `Place Order (Cash on Delivery) - ₹${total.toFixed(2)}`
                    )}
                  </InteractiveHoverButton>
                </form>
              </Form>
            </CardContent>
          </Card>
        </Box>

        <Box className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Your Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 max-h-60 overflow-y-auto">
              {orderItems.map((item) => (
                <Row
                  key={item.id}
                  className="items-center justify-between gap-4 text-sm"
                >
                  <Row className="items-center gap-2">
                    <span className="font-medium">{item.quantity} x</span>
                    <span className="truncate">{item.name}</span>
                    <BoxContents box={item.box} />
                  </Row>
                  <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                </Row>
              ))}
              {orderItems.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  Your cart is empty.
                </p>
              )}
            </CardContent>
            <CardFooter className="flex-col items-start space-y-2 pt-4 border-t">
              <Row className="justify-between w-full">
                <span>Subtotal</span>
                <span>₹{total.toFixed(2)}</span>
              </Row>
              <Row className="justify-between w-full">
                <span>Shipping</span>
                <span>Free</span>
              </Row>
              <Separator />
              <Row className="justify-between w-full font-bold text-lg">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </Row>
            </CardFooter>
          </Card>
        </Box>
      </Box>
    </Container>
  );
}
