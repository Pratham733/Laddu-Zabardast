export function OrderInstructions({ instructions }: { instructions?: string }) {
  if (!instructions) return null;
  return (
    <div className="text-sm">
      <p className="font-semibold">Order instructions</p>
      <p className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">{instructions}</p>
    </div>
  );
}
