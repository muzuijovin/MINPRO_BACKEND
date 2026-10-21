export function generateSlug(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 250)
    .replace(/-+$/g, "");
}

// Fungsi ini mengubah judul menjadi format slug yang cocok untuk URL.