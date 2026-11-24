import { useStorefront } from "@/context/storefront-context";

export function StoreContactLinks() {
  const { contact } = useStorefront();
  if (!contact) return null;
  return <span className="inline-flex flex-wrap justify-center gap-x-4 gap-y-1">
    <a href={`mailto:${contact.email}`} className="inline-flex min-h-11 items-center break-all underline underline-offset-4">{contact.email}</a>
    {contact.phones.map((phone, index) => (
      <a key={`${phone}-${index}`} href={`tel:${phone}`} className="inline-flex min-h-11 items-center underline underline-offset-4">
        {phone.replace(/^\+91(?=\d{10}$)/, "+91 ")}
      </a>
    ))}
  </span>;
}
