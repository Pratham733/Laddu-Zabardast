import { useState } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import type { BannerItem } from "@/models/banner";
import { Button } from "@/components/ui/button-new";
import { EmptyState, StatusBadge } from "@/components/store-feedback";
import { adminAction, adminSelect } from "./product-editor";

export function BannersPanel({ banners, busy, onAdd, onEdit, onDelete, onToggle, onMove }: { banners: BannerItem[]; busy: string; onAdd: () => void; onEdit: (banner: BannerItem) => void; onDelete: (banner: BannerItem) => void; onToggle: (banner: BannerItem) => void; onMove: (index: number, direction: -1 | 1) => void }) {
  const [filter, setFilter] = useState("all");
  const filtered = banners.filter(banner => filter === "all" || (filter === "active") === banner.isActive);
  return <section aria-label="Manage banners" className="space-y-4">
    <div className="flex flex-wrap justify-between gap-3"><select aria-label="Filter banners" className={`${adminSelect} max-w-48`} value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All banners</option><option value="active">Visible in store</option><option value="hidden">Hidden banners</option></select><Button className={adminAction} onClick={onAdd} disabled={Boolean(busy)}><Plus />Add banner</Button></div>
    <p className="text-sm text-muted-foreground">Use the arrows to change slide order. Changes are saved automatically.</p>
    {filtered.length === 0 ? <EmptyState title={banners.length ? "No banners in this view" : "Create your first store banner"} description={banners.length ? "Choose another visibility filter." : "Highlight a product, gift box or collection on your home page."} /> : <div className="space-y-3">
      {filtered.map(banner => {
        const index = banners.findIndex(item => item.id === banner.id);
        return <article key={banner.id} className="overflow-hidden rounded-xl border bg-card p-4">
          <div className="flex items-start gap-3"><Image src={banner.imageURL} alt={banner.name} width={112} height={72} className="h-16 w-24 shrink-0 rounded-lg border object-cover sm:h-20 sm:w-32" /><div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">Slide {index + 1}</p><h3 className="mt-1 break-words font-semibold">{banner.name}</h3><p className="mt-1 break-all text-xs text-muted-foreground">{banner.buttonText} → {banner.buttonLink}</p></div></div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3"><StatusBadge status={banner.isActive ? "available" : "unavailable"} /><div className="flex flex-wrap gap-1">
            <Button variant="outline" className="h-11 w-11" aria-label={`Move ${banner.name} up`} disabled={Boolean(busy) || index === 0} onClick={() => onMove(index, -1)}><ArrowUp /></Button><Button variant="outline" className="h-11 w-11" aria-label={`Move ${banner.name} down`} disabled={Boolean(busy) || index === banners.length - 1} onClick={() => onMove(index, 1)}><ArrowDown /></Button>
            <Button variant="outline" className="h-11 w-11" aria-label={`${banner.isActive ? "Hide" : "Show"} ${banner.name}`} disabled={Boolean(busy)} onClick={() => onToggle(banner)}>{banner.isActive ? <EyeOff /> : <Eye />}</Button>
            <Button variant="outline" className="h-11 w-11" aria-label={`Edit banner ${banner.name}`} disabled={Boolean(busy)} onClick={() => onEdit(banner)}><Pencil /></Button><Button variant="ghost" className="h-11 w-11 text-destructive" aria-label={`Delete banner ${banner.name}`} disabled={Boolean(busy)} onClick={() => onDelete(banner)}><Trash2 /></Button>
          </div></div>
        </article>;
      })}
    </div>}
  </section>;
}
