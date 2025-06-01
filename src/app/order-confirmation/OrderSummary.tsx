// src/app/order-confirmation/OrderSummary.tsx
"use client";
import Image from "next/image";
import type { OrderItem } from "@/types/order";

export function OrderSummary({ items }: { items: OrderItem[] }) {
  return (
    <div className="divide-y divide-border rounded-lg overflow-hidden shadow-sm bg-background/80 backdrop-blur-md">
      {items.map((item, idx) => (
        <div key={item.id || idx} className="flex items-center gap-4 p-4 animate-fade-in">
          <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted border">
            <Image
              src={item.imageUrl || "/images/1.jpg"}
              alt={item.name}
              width={80}
              height={80}
              className="object-cover w-full h-full"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-base truncate">{item.name}</div>
            <div className="text-sm text-muted-foreground">Qty: {item.quantity}</div>
            <div className="text-sm text-muted-foreground">Unit: ₹{item.price.toFixed(2)}</div>
          </div>
          <div className="font-bold text-lg text-primary text-right min-w-[80px]">
            ₹{(item.price * item.quantity).toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  );
}
