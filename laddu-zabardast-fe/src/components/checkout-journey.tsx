import { Check } from "lucide-react";
import { Link } from "react-router-dom";

export function CheckoutJourney({ step }: { step: 1 | 2 | 3 }) {
  return <nav aria-label="Checkout progress" className="mb-6">
    <ol className="flex items-center gap-2 text-xs sm:gap-4 sm:text-sm">
      {["Cart", "Delivery & payment", "Confirmation"].map((label, index) => <li key={label} className={`flex min-w-0 items-center gap-2 ${index === step - 1 ? "font-semibold text-foreground" : "text-muted-foreground"}`} aria-current={index === step - 1 ? "step" : undefined}>
        <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${index < step ? "border-orange-700 bg-orange-700 text-white" : "border-border"}`}>{index < step - 1 ? <Check className="h-3 w-3" aria-hidden="true" /> : index + 1}</span>
        {index === 0 && step > 1 ? <Link to="/cart" className="hover:underline">{label}</Link> : <span>{label}</span>}
        {index < 2 && <span aria-hidden="true" className="ml-1 hidden w-6 border-t sm:block" />}
      </li>)}
    </ol>
  </nav>;
}
