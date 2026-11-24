import { Capacitor } from "@capacitor/core";

export async function saveInvoice(response: Response, orderId: string): Promise<void> {
  if (!response.headers.get("content-type")?.includes("application/pdf")) {
    throw new Error("The server did not return a PDF.");
  }
  const filename = response.headers.get("content-disposition")?.match(/filename="(invoice-\d{14}\.pdf)"/i)?.[1]
    ?? `invoice-${orderId.replace(/[^a-zA-Z0-9-]/g, "")}.pdf`;
  await saveDownload(response, filename, "Order invoice");
}

export async function saveInvoiceArchive(response: Response, month: string): Promise<void> {
  if (!response.headers.get("content-type")?.includes("application/zip")) {
    throw new Error("The server did not return an invoice archive.");
  }
  await saveDownload(response, `invoices-${month}.zip`, "Invoice archive");
}

async function saveDownload(response: Response, filename: string, title: string): Promise<void> {
  const blob = await response.blob();
  if (Capacitor.isNativePlatform()) {
    const [{ Filesystem, Directory }, { Share }] = await Promise.all([
      import("@capacitor/filesystem"), import("@capacitor/share"),
    ]);
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Could not read the download."));
      reader.onload = () => resolve(String(reader.result).split(",")[1]);
      reader.readAsDataURL(blob);
    });
    const { uri } = await Filesystem.writeFile({
      path: filename, data: base64, directory: Directory.Cache,
    });
    try {
      await Share.share({ title, files: [uri], dialogTitle: "Save or share" });
    } catch (error) {
      if (!(error instanceof Error && error.message === "Share canceled")) throw error;
    }
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
