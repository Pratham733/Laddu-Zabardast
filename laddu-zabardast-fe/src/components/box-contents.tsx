import type { LadduBox } from "@/models";

export function BoxContents({ box }: { box?: LadduBox }) {
  if (!box) return null;
  return (
    <p className="mt-1 text-sm text-muted-foreground">
      {box.items.map((item) => `${item.quantity} × ${item.name ?? item.productId}`).join(", ")}
    </p>
  );
}
