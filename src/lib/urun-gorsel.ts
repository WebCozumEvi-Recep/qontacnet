// Ürünün tüm görsellerini tek diziye toplar (ana görsel + galeri JSON'u)
export function tumGorseller(u: { gorsel: string; gorseller?: string | null }): string[] {
  const ek = (() => {
    if (!u.gorseller) return [];
    try {
      const arr = JSON.parse(u.gorseller);
      return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
    } catch {
      return [];
    }
  })();
  return [u.gorsel, ...ek].filter(Boolean);
}
