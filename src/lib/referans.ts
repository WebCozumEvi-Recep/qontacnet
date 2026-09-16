// Firmaya özel satış linki. Bu sayfadan yapılan satışlar firmanın referansıyla
// kaydedilir ve alıcı ödeme sonrası firmaya bağlı üye olur (bkz. /f/[id]).
export const satisLinki = (firmaId: string) => `https://qontac.net/f/${encodeURIComponent(firmaId)}`;
