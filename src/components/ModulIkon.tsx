"use client";

// Üye modül kataloğunda kullanılabilecek hazır ikonlar (Material Symbols)
export const IKON_GALERI = [
  "photo_library", "collections", "image", "slideshow", "view_carousel",
  "article", "description", "menu_book", "auto_stories", "sticky_note_2",
  "smart_display", "video_library", "movie", "play_circle", "live_tv",
  "link", "public", "language", "share", "qr_code_2",
  "mail", "call", "chat", "forum", "sms",
  "photo_camera", "videocam", "mic", "headphones", "music_note",
  "store", "storefront", "shopping_bag", "shopping_cart", "local_offer",
  "sell", "payments", "credit_card", "account_balance_wallet", "receipt_long",
  "person", "group", "groups", "handshake", "support_agent",
  "work", "business_center", "school", "badge", "verified",
  "location_on", "map", "directions", "restaurant", "local_cafe",
  "fitness_center", "spa", "medical_services", "favorite", "pets",
  "star", "grade", "thumb_up", "campaign", "notifications",
  "event", "calendar_month", "schedule", "alarm", "today",
  "lightbulb", "rocket_launch", "bolt", "whatshot", "eco",
  "palette", "brush", "code", "terminal", "build",
  "cloud", "download", "upload", "folder", "inventory_2",
  "dashboard", "widgets", "apps", "grid_view", "category",
  "trending_up", "bar_chart", "pie_chart", "insights", "leaderboard",
  "card_giftcard", "redeem", "loyalty", "diamond", "workspace_premium",
];

type IkonVeri = { ikon?: string; ikonAd?: string; butonRenk?: string; ikonRenk?: string };

// Modül ikonunu render eder: yüklenen görsel varsa onu, yoksa renkli yuvarlak + Material ikon
export function ModulIkon({ veri, size = 44 }: { veri: IkonVeri; size?: number }) {
  const { ikon, ikonAd, butonRenk = "#d4af37", ikonRenk = "#000000" } = veri;
  if (ikon) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={ikon} alt="" className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size }} />;
  }
  return (
    <span className="rounded-full flex items-center justify-center flex-shrink-0" style={{ width: size, height: size, background: butonRenk }}>
      <span className="material-symbols-outlined" style={{ color: ikonRenk, fontSize: Math.round(size * 0.5) }}>
        {ikonAd || "widgets"}
      </span>
    </span>
  );
}

// Galeriden ikon seçtiren grid modal
export function IkonGaleri({ secili, onSec, onKapat }: { secili?: string; onSec: (ad: string) => void; onKapat: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onKapat}>
      <div className="w-full max-w-lg max-h-[70vh] rounded-2xl p-5 overflow-hidden flex flex-col"
        style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)" }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>İkon Seç</h3>
          <button onClick={onKapat} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="grid grid-cols-7 sm:grid-cols-8 gap-2 overflow-y-auto">
          {IKON_GALERI.map(ad => (
            <button key={ad} type="button" onClick={() => { onSec(ad); onKapat(); }}
              className={`aspect-square rounded-xl flex items-center justify-center transition-all hover:bg-white/10 ${secili === ad ? "bg-primary/20 ring-1 ring-primary" : "bg-white/5"}`}
              title={ad}>
              <span className="material-symbols-outlined text-on-surface text-xl">{ad}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
