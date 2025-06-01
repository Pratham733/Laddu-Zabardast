"use client";

import { useCart } from '@/context/cart-context';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button";

export default function CartPage() {
  // Remove isInitialised from destructure
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
  const [total, setTotal] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Ensure this runs only on the client
  }, []);

  useEffect(() => {
     if (isClient) {
        setTotal(getCartTotal());
     }
  }, [cart, getCartTotal, isClient]);

  if (!isClient) {
    // Render loading state or placeholder
    return (
      <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
        <h1 className="text-3xl font-bold mb-6 text-gradient">Loading Cart...</h1>
      </div>
    );
  }

  const handleRemove = (id: string, name: string) => {
    removeFromCart(id);
    if (cart.length == 1) {
        setTotal(0)
    }
    else {
        setTotal(getCartTotal())
    }

    toast({
      title: `${name} removed from cart`,
      variant: 'destructive',
    });
  };

  const handleClearCart = () => {
    setTotal(0)
    clearCart();
    toast({
        title: "Cart Cleared",
        description: "All items have been removed from your cart.",
        variant: "destructive",
    });
  }
  const handleUpdateQuantity = (id: string, quantity: number) => {
    updateQuantity(id, quantity);
    setTotal(getCartTotal())

  };

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
      <h1 className="text-3xl font-bold mb-6 text-gradient">Your Shopping Cart</h1> {/* Applied text-gradient */}
      {cart.length === 0 ? (
        <Card className="text-center py-12">
            <CardHeader>
                <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <CardTitle className="text-2xl font-semibold">Your Cart is Empty</CardTitle>
            </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">Looks like you haven't added anything yet. Let's find some goodies!</p>
            <Link href="/">
               {/* Replace <InteractiveHoverButton variant="gradient">Start Shopping</InteractiveHoverButton> */}
               <InteractiveHoverButton className="bg-orange-600 text-white shadow-md px-6 py-2 rounded-full hover:opacity-90 transition-opacity">
                  Start Shopping
               </InteractiveHoverButton>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <Card key={item.id} className="flex flex-col sm:flex-row items-center gap-4 p-4 shadow-sm">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  width={100}
                  height={100}
                  className="rounded-md object-cover aspect-square"
                  data-ai-hint={item.aiHint}
                />
                <div className="flex-grow text-center sm:text-left">
                  <h2 className="text-lg font-medium">{item.name}</h2>
                  <p className="text-sm text-muted-foreground">₹{typeof item.price === 'number' && !isNaN(item.price) ? item.price.toFixed(2) : '0.00'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                    className="h-8 w-14 text-center px-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="font-medium w-20 text-center sm:text-right">₹{typeof item.price === 'number' && !isNaN(item.price) ? (item.price * item.quantity).toFixed(2) : '0.00'}</p>
                 <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive/80 h-8 w-8"
                    onClick={() => handleRemove(item.id, item.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                 </Button>
              </Card>
            ))}
            <Button variant="outline" className="text-destructive hover:text-destructive" onClick={handleClearCart}>
                <Trash2 className="mr-2 h-4 w-4" /> Clear Cart
            </Button>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{typeof total === 'number' && !isNaN(total) ? total.toFixed(2) : '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>Free</span> {/* Or calculate shipping */}
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{typeof total === 'number' && !isNaN(total) ? total.toFixed(2) : '0.00'}</span>
                </div>
              </CardContent>
              <CardFooter>
                 {/* Replace <InteractiveHoverButton variant="gradient" className="w-full">Proceed to Checkout</InteractiveHoverButton> */}
                 <Link href="/checkout" className="w-full">
                    <InteractiveHoverButton className="w-full bg-orange-600 text-white shadow-md px-6 py-2 rounded-full hover:opacity-90 transition-opacity">
                        Proceed to Checkout
                    </InteractiveHoverButton>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
