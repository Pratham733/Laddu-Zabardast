import { Link } from "react-router-dom";
import { ArrowRight, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button-new";

export function StoreIntro() {
  return <section className="mx-4 mb-4 flex items-center justify-between gap-5 rounded-2xl border border-orange-600/15 bg-orange-600/5 p-5 sm:mx-6 sm:p-7">
    <div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-orange-700 dark:text-orange-400">Make it your own</p><h1 className="max-w-md text-2xl font-bold tracking-tight sm:text-3xl">A box full of your favourites.</h1><p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">Choose a box of 9 or 16 and fill it with the laddus you love.</p><div className="mt-4 flex flex-wrap gap-2"><Button asChild className="h-11 rounded-lg bg-orange-700 text-white shadow-none hover:bg-orange-800"><Link to="/build-a-box">Create your box<ArrowRight /></Link></Button><Button asChild variant="outline" className="h-11 rounded-lg bg-background"><Link to="/shop">Shop all products</Link></Button></div></div>
    <div className="hidden shrink-0 flex-col items-center rounded-2xl border border-orange-600/15 bg-background/70 p-6 sm:flex"><PackageOpen className="h-16 w-16 text-orange-700 dark:text-orange-400" strokeWidth={1.5} /><p className="mt-3 text-sm font-semibold">9 or 16 laddus</p><p className="mt-1 text-xs text-muted-foreground">Your choice. Your box.</p></div>
  </section>;
}
