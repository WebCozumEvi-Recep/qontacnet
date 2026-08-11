"use client";
import { useMemo, useState } from "react";

// Üye modüllerinde kullanılabilecek hazır ikonlar (Material Symbols).
//
// Buradaki adlar ikon fontu alt kümesine giren tek kaynaktır — yeni ikon
// eklendiğinde `node scripts/build-icon-font.mjs` çalıştırılmalı, aksi hâlde
// glif fontta olmadığı için ekranda ikon adı düz yazı olarak görünür.
export const IKON_GRUPLARI: { ad: string; ikonlar: string[] }[] = [
  {
    ad: "İş & Ofis",
    ikonlar: [
      "work", "business_center", "badge", "corporate_fare", "apartment", "domain",
      "storefront", "store", "factory", "warehouse", "point_of_sale", "receipt_long",
      "request_quote", "description", "folder", "inventory_2", "analytics", "trending_up",
      "bar_chart", "pie_chart", "insights", "leaderboard", "handshake", "groups",
      "support_agent", "campaign", "verified", "workspace_premium", "assignment", "task_alt",
    ],
  },
  {
    ad: "Meslekler",
    ikonlar: [
      "engineering", "construction", "architecture", "plumbing", "carpenter",
      "electrical_services", "hardware", "precision_manufacturing", "agriculture",
      "restaurant", "local_cafe", "bakery_dining", "local_bar", "local_florist",
      "content_cut", "brush", "palette", "design_services", "photo_camera", "videocam",
      "mic", "music_note", "theater_comedy", "sports_soccer", "fitness_center", "spa",
      "medical_services", "health_and_safety", "medication", "vaccines", "dentistry",
      "psychology", "gavel", "balance", "school", "menu_book", "science", "biotech",
      "computer", "code", "terminal", "dns", "cloud", "security", "shield",
      "directions_car", "local_shipping", "two_wheeler", "flight", "sailing", "train",
      "pets", "cleaning_services", "home_repair_service", "roofing", "checkroom",
      "diamond", "real_estate_agent", "hotel", "key", "elderly", "child_care",
      "volunteer_activism", "church", "mosque", "translate", "record_voice_over",
    ],
  },
  {
    ad: "İletişim",
    ikonlar: [
      "mail", "call", "chat", "forum", "sms", "share", "link", "public", "language",
      "qr_code_2", "contact_page", "alternate_email", "phone_iphone", "wifi", "rss_feed",
      "location_on", "map", "directions", "near_me", "explore",
    ],
  },
  {
    ad: "Medya & İçerik",
    ikonlar: [
      "photo_library", "collections", "image", "slideshow", "view_carousel",
      "smart_display", "video_library", "movie", "play_circle", "live_tv", "headphones",
      "podcasts", "article", "menu_book", "auto_stories", "sticky_note_2", "newspaper",
      "photo_camera_back", "gallery_thumbnail",
    ],
  },
  {
    ad: "Satış & Ödeme",
    ikonlar: [
      "shopping_bag", "shopping_cart", "local_offer", "sell", "payments", "credit_card",
      "account_balance_wallet", "account_balance", "savings", "price_check", "percent",
      "card_giftcard", "redeem", "loyalty", "local_mall", "shopping_basket",
    ],
  },
  {
    ad: "Zaman & Etkinlik",
    ikonlar: [
      "event", "calendar_month", "schedule", "alarm", "today", "history", "event_available",
      "celebration", "emoji_events", "military_tech", "flag",
    ],
  },
  {
    ad: "Genel",
    ikonlar: [
      "star", "grade", "thumb_up", "favorite", "notifications", "lightbulb", "rocket_launch",
      "bolt", "whatshot", "eco", "dashboard", "widgets", "apps", "grid_view", "category",
      "download", "upload", "settings", "help", "info", "check_circle", "person", "group",
      "home", "search", "visibility", "build", "database", "chat_bubble_outline",
    ],
  },
];

/** Tüm ikonların düz listesi (yinelenenler ayıklanmış). */
export const IKON_GALERI: string[] = [...new Set(IKON_GRUPLARI.flatMap(g => g.ikonlar))];

type IkonVeri = { ikon?: string; ikonAd?: string; butonRenk?: string; ikonRenk?: string };

/**
 * Modülün kartta görünecek ikon verisi.
 *
 * Tanımın ikonu adminden gelir; üye kendi modülü için ikon seçtiyse (içerikteki
 * `ikonAd`) o öne geçer. Üye ikon seçtiğinde tanımdaki yüklenmiş görsel devre
 * dışı kalır — yoksa görsel her zaman kazandığı için seçim işe yaramaz görünürdü.
 */
export function modulIkonVerisi(
  modul: { icerik?: { ikonAd?: string } | null; tanim?: IkonVeri | null },
): IkonVeri {
  const tanim = modul.tanim ?? {};
  const secilen = modul.icerik?.ikonAd;
  if (!secilen) return tanim;
  return { ...tanim, ikon: "", ikonAd: secilen };
}

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

/**
 * Galeriden ikon seçtiren modal: arama kutusu + kategori süzgeci.
 *
 * `onVarsayilan` verilirse "Varsayılana dön" düğmesi çıkar (üyenin seçimini
 * silip modül tanımının kendi ikonuna geri dönmek için).
 */
export function IkonGaleri({ secili, onSec, onKapat, onVarsayilan }: {
  secili?: string;
  onSec: (ad: string) => void;
  onKapat: () => void;
  onVarsayilan?: () => void;
}) {
  const [arama, setArama] = useState("");
  const [grup, setGrup] = useState("Tümü");

  const gosterilecek = useMemo(() => {
    const q = arama.trim().toLowerCase().replace(/\s+/g, "_");
    const kaynak = grup === "Tümü"
      ? IKON_GRUPLARI
      : IKON_GRUPLARI.filter(g => g.ad === grup);

    return kaynak
      .map(g => ({ ad: g.ad, ikonlar: g.ikonlar.filter(i => !q || i.includes(q)) }))
      .filter(g => g.ikonlar.length > 0);
  }, [arama, grup]);

  const toplam = gosterilecek.reduce((t, g) => t + g.ikonlar.length, 0);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onKapat}>
      <div className="w-full max-w-2xl max-h-[80vh] rounded-2xl p-5 overflow-hidden flex flex-col"
        style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)" }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>İkon Seç</h3>
          <button onClick={onKapat} className="text-on-surface-variant hover:text-on-surface" aria-label="Kapat">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 mb-3">
          <span className="material-symbols-outlined text-on-surface-variant text-base">search</span>
          <input
            value={arama}
            onChange={e => setArama(e.target.value)}
            placeholder="İkon ara (ör. work, restaurant, hukuk için gavel)"
            autoFocus
            className="flex-1 bg-transparent py-2.5 text-sm text-on-surface outline-none"
          />
          {arama && (
            <button type="button" onClick={() => setArama("")} className="text-on-surface-variant hover:text-on-surface" aria-label="Aramayı temizle">
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {["Tümü", ...IKON_GRUPLARI.map(g => g.ad)].map(g => (
            <button key={g} type="button" onClick={() => setGrup(g)}
              className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                grup === g ? "bg-primary/20 text-primary ring-1 ring-primary/40" : "bg-white/5 text-on-surface-variant hover:text-on-surface"
              }`}>
              {g}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto space-y-4 pr-1">
          {toplam === 0 && (
            <p className="text-xs text-on-surface-variant text-center py-8">
              Aramanla eşleşen ikon yok. İkon adları İngilizcedir — ör. avukat için <em>gavel</em>,
              kuaför için <em>content_cut</em>, inşaat için <em>construction</em>.
            </p>
          )}
          {gosterilecek.map(g => (
            <div key={g.ad}>
              {grup === "Tümü" && (
                <p className="text-[11px] uppercase tracking-wide text-on-surface-variant mb-1.5">{g.ad}</p>
              )}
              <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
                {g.ikonlar.map(ad => (
                  <button key={ad} type="button" onClick={() => { onSec(ad); onKapat(); }}
                    className={`aspect-square rounded-xl flex items-center justify-center transition-all hover:bg-white/10 ${
                      secili === ad ? "bg-primary/20 ring-1 ring-primary" : "bg-white/5"
                    }`}
                    title={ad}>
                    <span className="material-symbols-outlined text-on-surface text-xl">{ad}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {onVarsayilan && (
          <div className="pt-3 mt-1 border-t border-white/10">
            <button type="button" onClick={() => { onVarsayilan(); onKapat(); }}
              className="text-xs text-on-surface-variant hover:text-on-surface inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">refresh</span>
              Varsayılan ikona dön
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
