//src/app/checkout/page.tsx
"use client";

import { useCart } from '@/context/cart-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, Home, CreditCard, Landmark } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import Image from 'next/image';
import type { Address } from '@/types/product';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { InteractiveHoverButton } from '@/components/magicui/interactive-hover-button';

// Define form schema with Zod
const formSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  city: z.string().min(1, 'City is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
});

type FormSchema = z.infer<typeof formSchema>;

// Extend JSX.IntrinsicElements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'form': React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>;
      'div': React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      'span': React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;
      'img': React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>;
    }
  }
}

export default function CheckoutPage() {
  const { cart, getCartTotal, clearCart } = useCart();
  const { user, token } = useAuth(); // Get user and token from auth context
  const router = useRouter();
  const [total, setTotal] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("new"); // 'new' or address index
  const [savedPhones, setSavedPhones] = useState<string[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string>("profile"); // 'profile' or 'new'
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "cod">("upi");


  useEffect(() => {
    setIsClient(true); // Ensure this runs only on the client
  }, []);

  useEffect(() => {
    if (isClient) {
        const calculatedTotal = getCartTotal();
        setTotal(calculatedTotal);
        if (calculatedTotal === 0 && !isProcessing) { // Don't redirect if already processing
            // Redirect if cart is empty on client side
            toast({ title: "Your cart is empty!", description: "Redirecting to home page.", variant: "destructive" });
            router.push('/');
        }
    }
  }, [cart, getCartTotal, router, isClient, isProcessing]);

  useEffect(() => {
    const fetchAddresses = async () => {
      if (user && token) {
        try {
          const res = await fetch('/api/addresses', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setSavedAddresses(data.addresses || []);
          } else {
            console.error("Failed to fetch addresses");
            setSavedAddresses([]); // Ensure it's an empty array on failure
          }
        } catch (error) {
          console.error("Error fetching addresses:", error);
          setSavedAddresses([]); // Ensure it's an empty array on error
        }
      }
    };
    const fetchPhones = async () => {
      if (user) {
        // Assuming user.phone is a string or array of phones
        if (user.phone) {
          if (Array.isArray(user.phone)) {
            setSavedPhones(user.phone);
          } else if (typeof user.phone === 'string') {
            setSavedPhones([user.phone]);
          }
        } else {
          setSavedPhones([]);
        }
      }
    };
    if (isClient) {
        fetchAddresses();
        fetchPhones();
    }
  }, [user, token, isClient]);


  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      address: '',
      city: '',
      postalCode: '',
      country: '',
    },
  });

  // Update default values if user loads after form init
  useEffect(() => {
      if (user) {
          form.reset({
              ...form.getValues(),
              name: form.getValues('name') || (user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : ''),
              email: form.getValues('email') || (user.email ?? ''),
              phone: form.getValues('phone') || (user.phone ?? ''),
              address: form.getValues('address') || '',
              city: form.getValues('city') || '',
              postalCode: form.getValues('postalCode') || '',
              country: form.getValues('country') || '',
          });
      }
  }, [user, form]);

  // Effect to update form when a saved address is selected
  useEffect(() => {
    if (selectedAddress !== "new" && savedAddresses.length > 0) {
      const addressIndex = parseInt(selectedAddress, 10);
      if (!isNaN(addressIndex) && savedAddresses[addressIndex]) {
        const addr = savedAddresses[addressIndex];
        form.reset({
          ...form.getValues(),
          address: addr.street ?? '',
          city: addr.city ?? '',
          postalCode: addr.postalCode ?? '',
          country: addr.country ?? '',
        });
      }
    } else if (selectedAddress === "new") {
       form.reset({
        name: user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : '',
        email: user?.email ?? '',
        phone: user?.phone ?? '',
        address: '',
        city: '',
        postalCode: '',
        country: '',
      });
    }
  }, [selectedAddress, savedAddresses, form, user]);

  // Effect to update phone field when selectedPhone changes
  useEffect(() => {
    if (selectedPhone === "profile" && savedPhones.length > 0) {
      form.setValue("phone", savedPhones[0] ?? '');
    } else if (selectedPhone === "new") {
      form.setValue("phone", "");
    }
  }, [selectedPhone, savedPhones, form]);

  const onSubmit = async (data: FormSchema) => {
    if (!token) {
        toast({ title: "Authentication Error", description: "Please log in to complete your order.", variant: "destructive" });
        router.push(`/login?redirect=/checkout`);
        return;
    }
    setIsProcessing(true);
    toast({
        title: "Processing Order...",
        description: "Please wait while we confirm your order.",
    });

    try {
        // For QR code flow, we assume payment is done externally.
        // The user clicks "I have made the payment" to proceed.
        const orderData = {
            shippingDetails: data,
            items: cart,
            totalAmount: total,
            paymentStatus: paymentMethod === 'upi' ? 'completed' : 'pending',
            paymentMethod: paymentMethod, // Add the selected payment method
            orderStatus: 'Processing',
        };

        const response = await fetch('/api/create-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderData),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to save order. Invalid server response.' }));
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const { orderId } = await response.json();

        clearCart();
        toast({
            title: "Order Successful!",
            description: "Thank you for your purchase. Your order is confirmed.",
            variant: 'default',
        });
        router.push(`/order-confirmation?orderId=${orderId}`);

    } catch (orderError: any) {
         console.error("Order creation error:", orderError);
         toast({
            title: "Order Creation Failed",
            description: `There was an issue saving your order: ${orderError.message}. Please contact support.`,
            variant: "destructive",
            duration: 10000,
         });
         setIsProcessing(false);
    }
  };

   if (!isClient || (total === 0 && !isProcessing) ) {
     return (
       <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
         <h1 className="text-3xl font-bold mb-6 text-gradient">Loading Checkout...</h1>
         <div className="flex justify-center items-center py-16">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
         </div>
       </div>
     );
   }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-6 md:px-6 md:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-gradient text-center">Checkout</h1>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Shipping Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your Name" {...field} disabled={isProcessing} />
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
                            <Input type="email" placeholder="your.email@example.com" {...field} disabled={isProcessing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormItem className="mb-3 sm:mb-4">
                      <FormLabel className="text-sm sm:text-base">Select Mobile Number</FormLabel>
                      <Select
                        onValueChange={(value) => setSelectedPhone(value)}
                        defaultValue={selectedPhone}
                        disabled={isProcessing}
                      >
                        <FormControl>
                          <SelectTrigger className="select-trigger w-full">
                            <SelectValue placeholder="Choose a saved number or add new" className="select-value w-full" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="profile" className="flex items-center h-12 px-4 text-base">
                            {savedPhones.length > 0 ? savedPhones[0] : "No saved number"}
                          </SelectItem>
                          <SelectItem value="new" className="flex items-center h-12 px-4 text-base">Add New Number</SelectItem>
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
                              <Input type="tel" placeholder="+919999999999" {...field} disabled={isProcessing} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {/* Address Selection Dropdown */}
                  {savedAddresses && savedAddresses.length > 0 && (
                    <FormItem className="mb-3 sm:mb-4">
                      <FormLabel className="text-sm sm:text-base">Select Address</FormLabel>
                      <Select
                        onValueChange={(value) => setSelectedAddress(value)}
                        defaultValue={selectedAddress}
                        disabled={isProcessing}
                      >
                        <FormControl>
                          <SelectTrigger className="select-trigger w-full">
                            <SelectValue placeholder="Choose a saved address or add new" className="select-value w-full" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="new" className="flex items-center h-12 px-4 text-base">
                            <div className="flex items-center">
                              <Home className="mr-2 h-4 w-4" />
                              Add New Address
                            </div>
                          </SelectItem>
                          {savedAddresses.map((addr, index) => (
                            <SelectItem key={index} value={index.toString()} className="flex items-center h-12 px-4 text-base">
                              {`${addr.street}, ${addr.city}${addr.isDefault ? " (Default)" : ""}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Sweet Lane" {...field} disabled={isProcessing || (selectedAddress !== 'new' && savedAddresses.length > 0)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="Foodville" {...field} disabled={isProcessing || (selectedAddress !== 'new' && savedAddresses.length > 0)} />
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
                            <Input placeholder="12345" {...field} disabled={isProcessing || (selectedAddress !== 'new' && savedAddresses.length > 0)} />
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
                            <Input placeholder="India" {...field} disabled={isProcessing || (selectedAddress !== 'new' && savedAddresses.length > 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator className="my-4 sm:my-6"/>

                  {/* Payment Method Selection */}
                  <FormItem className="space-y-2 sm:space-y-3">
                    <FormLabel className="text-base">Payment Method</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value: "upi" | "cod") => setPaymentMethod(value)}
                        defaultValue={paymentMethod}
                        className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-4"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="upi" id="upi" />
                          </FormControl>
                          <FormLabel htmlFor="upi" className="font-normal flex items-center">
                            <CreditCard className="mr-2 h-5 w-5 text-primary" /> UPI / QR Code
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="cod" id="cod" />
                          </FormControl>
                          <FormLabel htmlFor="cod" className="font-normal flex items-center">
                            <Landmark className="mr-2 h-5 w-5 text-green-600" /> Cash on Delivery
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>

                  {/* QR Code Payment Section - Conditional */}
                  {paymentMethod === 'upi' && (
                    <div className="my-6 p-6 border rounded-md bg-card flex flex-col items-center shadow-sm transition-all duration-300 ease-in-out">
                        <CardTitle className="text-xl mb-4 text-center">Scan to Pay with UPI</CardTitle>
                        <div className="mb-4 p-2 border rounded-md inline-block bg-background">
                          <Image
                              src="/images/GPay.png" // Replace with your actual QR code URL
                              alt="QR Code for Payment"
                              width={250}
                              height={250}
                              className="rounded-md"
                              data-ai-hint="qr code payment"
                          />
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 text-center">
                            Scan the QR code with your payment app.
                            After completing the payment, click the button below.
                        </p>
                    </div>
                  )}

                  <InteractiveHoverButton type="submit" className="w-full mt-4 sm:mt-6 text-base sm:text-lg py-3 sm:py-4 bg-orange-600 text-white shadow-md rounded-full hover:opacity-90 transition-opacity" disabled={isProcessing || cart.length === 0}>
                      {isProcessing ? (
                          <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirming Order...
                          </>
                      ) : paymentMethod === 'upi' ? (
                          `I have made the UPI payment - ₹${total.toFixed(2)}`
                      ) : (
                          `Place Order (Cash on Delivery) - ₹${total.toFixed(2)}`
                      )}
                  </InteractiveHoverButton>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Your Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 max-h-60 overflow-y-auto">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between gap-4 text-sm">
                   <div className="flex items-center gap-2">
                    <span className="font-medium">{item.quantity} x</span>
                    <span className="truncate">{item.name}</span>
                   </div>
                  <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
               {cart.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">Your cart is empty.</p>
                )}
            </CardContent>
             <CardFooter className="flex-col items-start space-y-2 pt-4 border-t">
                 <div className="flex justify-between w-full">
                    <span>Subtotal</span>
                    <span>₹{total.toFixed(2)}</span>
                 </div>
                <div className="flex justify-between w-full">
                    <span>Shipping</span>
                    <span>Free</span>
                </div>
                 <Separator />
                 <div className="flex justify-between w-full font-bold text-lg">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                 </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};
