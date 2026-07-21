"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

interface Member { ad?: string; soyad?: string; unvan?: string; departman?: string; firmaAdi?: string; goruntulemeSayisi?: number; leadSayisi?: number; kartAktif?: boolean }
interface Stats {
  stats: {
    goruntulenme: number; baglanti: number; nfc: number; qr: number; link: number; form: number;
    okunmamis: number; buAy: number; kartAktif: boolean;
    views?: { nfc: number; qr: number; link: number };
  };
  haftalik: { gun: string; sayi: number }[];
  aylikTrafik?: { gun: number; nfc: number; qr: number; link: number }[];
}

function StatCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string | number; sub: string; color: string }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center`} style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
          <span className="material-symbols-outlined text-xl" style={{ color }}>{icon}</span>
        </div>
      </div>
      <p className="text-2xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>{value}</p>
      <p className="text-sm text-on-surface-variant mt-0.5">{label}</p>
      <p className="text-xs text-tertiary mt-2">{sub}</p>
    </div>
  );
}

export default function UyeDashboard() {
  const { user } = useAuth();
  const member = user?.data as unknown as Member;
  const [d, setD] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/me/stats").then(r => r.json()).then(j => { if (j.ok) setD(j); }).catch(() => {});
  }, []);

  const haftalik = d?.haftalik ?? [];
  const maxView = Math.max(...haftalik.map(h => h.sayi), 1);
  const aylikTrafik = d?.aylikTrafik ?? [];
  const maxTrafik = Math.max(...aylikTrafik.map(g => g.nfc + g.qr + g.link), 1);
  const kartAktif = d?.stats.kartAktif ?? member?.kartAktif ?? false;

  return (
    <div className="space-y-6 max-w-[1100px]">

      {/* Kart aktivasyon banner — kart henüz aktive edilmemişse */}
      {!kartAktif && (
        <div className="glass-card rounded-2xl p-5 border border-amber-400/20 bg-amber-400/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-amber-400 text-xl">nfc</span>
            </div>
            <div>
              <p className="font-semibold text-on-surface text-sm" style={{ fontFamily: "Sora, sans-serif" }}>
                NFC Kartın Henüz Aktive Edilmedi
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Fiziksel kartını aktive etmek için kartın üzerindeki QR kodu oku.
              </p>
            </div>
          </div>
          <a
            href="#"
            onClick={e => { e.preventDefault(); alert("Fiziksel kartınızın üzerindeki QR kodu telefonunuzla okutun."); }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-400/15 border border-amber-400/30 text-amber-400 rounded-xl text-xs font-medium hover:bg-amber-400/25 transition-all whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
            Nasıl Aktive Edilir?
          </a>
        </div>
      )}

      {/* Welcome */}
      <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>
            Hoş geldin, {member?.ad ?? "Üye"} 👋
          </h2>
          <p className="text-on-surface-variant text-sm mt-1">
            {member?.unvan} · {member?.departman || member?.firmaAdi}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href={`/kart/${user?.id}`} target="_blank" className="flex items-center gap-2 px-4 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold hover:scale-[1.02] transition-all">
            <span className="material-symbols-outlined text-base">open_in_new</span>
            Kartımı Görüntüle
          </Link>
        </div>
      </div>

      {/* Stats — trafik ve talepler, NFC/QR kırılımı kutu içinde */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#d4af3720", border: "1px solid #d4af3730" }}>
              <span className="material-symbols-outlined text-xl" style={{ color: "#d4af37" }}>visibility</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>{d?.stats.goruntulenme ?? member?.goruntulemeSayisi ?? 0}</p>
              <p className="text-sm text-on-surface-variant">Toplam Görüntülenme</p>
            </div>
          </div>
          <div className="flex gap-2 text-xs">
            {[
              { l: "NFC", v: d?.stats.views?.nfc ?? 0, c: "#6001d1" },
              { l: "QR", v: d?.stats.views?.qr ?? 0, c: "#42faba" },
              { l: "Link", v: d?.stats.views?.link ?? 0, c: "#a29bfe" },
            ].map(x => (
              <span key={x.l} className="flex-1 text-center rounded-lg py-1.5 border" style={{ background: `${x.c}12`, borderColor: `${x.c}30`, color: x.c }}>
                {x.l}: <b>{x.v}</b>
              </span>
            ))}
          </div>
          <p className="text-[10px] text-on-surface-variant/60 mt-1.5">Kaynak kırılımı bu aya aittir</p>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#42faba20", border: "1px solid #42faba30" }}>
              <span className="material-symbols-outlined text-xl" style={{ color: "#42faba" }}>group_add</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>{d?.stats.baglanti ?? member?.leadSayisi ?? 0}</p>
              <p className="text-sm text-on-surface-variant">İletişim Talepleri · {d?.stats.buAy ?? 0} bu ay</p>
            </div>
          </div>
          <div className="flex gap-2 text-xs">
            {[
              { l: "NFC", v: d?.stats.nfc ?? 0, c: "#6001d1" },
              { l: "QR", v: d?.stats.qr ?? 0, c: "#42faba" },
              { l: "Link", v: d?.stats.link ?? 0, c: "#a29bfe" },
              { l: "Form", v: d?.stats.form ?? 0, c: "#f0d289" },
            ].map(x => (
              <span key={x.l} className="flex-1 text-center rounded-lg py-1.5 border" style={{ background: `${x.c}12`, borderColor: `${x.c}30`, color: x.c }}>
                {x.l}: <b>{x.v}</b>
              </span>
            ))}
          </div>
          {(d?.stats.okunmamis ?? 0) > 0 && (
            <p className="text-[10px] text-amber-400 mt-1.5">{d?.stats.okunmamis} okunmamış talep var</p>
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Haftalık bağlantı grafiği — son 7 gün, gerçek */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-on-surface mb-4" style={{ fontFamily: "Sora, sans-serif" }}>
            Son 7 Gün Talep
          </h3>
          {haftalik.every(h => h.sayi === 0) ? (
            <div className="h-32 flex items-center justify-center text-xs text-on-surface-variant">
              Son 7 günde yeni talep yok.
            </div>
          ) : (
            <div className="flex items-end gap-2 h-32">
              {haftalik.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                  <span className="text-xs text-on-surface-variant" style={{ fontSize: "10px" }}>{h.sayi || ""}</span>
                  <div
                    className="w-full rounded-t-lg transition-all"
                    style={{ height: `${(h.sayi / maxView) * 100}%`, minHeight: h.sayi ? 4 : 0, background: i === 6 ? "#d4af37" : "rgba(212, 175, 55,0.35)" }}
                  />
                  <span className="text-xs text-on-surface-variant">{h.gun}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Aylık trafik — NFC/QR/Link ayrımıyla günlük yığılmış çubuklar */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Bu Ay Trafik</h3>
            <div className="flex gap-3 text-[10px] text-on-surface-variant">
              {[["NFC", "#6001d1"], ["QR", "#42faba"], ["Link", "#a29bfe"]].map(([l, c]) => (
                <span key={l} className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: c }} />{l}</span>
              ))}
            </div>
          </div>
          {aylikTrafik.every(g => g.nfc + g.qr + g.link === 0) ? (
            <div className="h-32 flex items-center justify-center text-xs text-on-surface-variant">
              Bu ay henüz kaynak bazlı trafik verisi yok.
            </div>
          ) : (
            <div className="flex items-end gap-[3px] h-32">
              {aylikTrafik.map(g => {
                const toplam = g.nfc + g.qr + g.link;
                return (
                  <div key={g.gun} className="flex-1 flex flex-col items-center justify-end h-full" title={`${g.gun}. gün — NFC: ${g.nfc}, QR: ${g.qr}, Link: ${g.link}`}>
                    <div className="w-full flex flex-col-reverse rounded-t overflow-hidden" style={{ height: `${(toplam / maxTrafik) * 88}%`, minHeight: toplam ? 4 : 0 }}>
                      {g.nfc > 0 && <div style={{ flex: g.nfc, background: "#6001d1" }} />}
                      {g.qr > 0 && <div style={{ flex: g.qr, background: "#42faba" }} />}
                      {g.link > 0 && <div style={{ flex: g.link, background: "#a29bfe" }} />}
                    </div>
                    <span className="text-on-surface-variant mt-1" style={{ fontSize: 8 }}>{g.gun % 5 === 0 || g.gun === 1 ? g.gun : ""}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Card preview CTA — yalnızca kart aktifse */}
      {kartAktif && (
        <div className="glass-card rounded-2xl p-6 border border-primary/10 bg-primary/5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-2xl">nfc</span>
              </div>
              <div>
                <p className="font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>NFC Kartın Aktif</p>
                <p className="text-sm text-on-surface-variant">Fiziksel kartın dijital profilinle bağlı ve aktif durumda.</p>
              </div>
            </div>
            <Link href="/uye/qr" className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 border border-primary/30 text-primary rounded-xl text-sm font-medium hover:bg-primary/20 transition-all whitespace-nowrap">
              <span className="material-symbols-outlined text-base">qr_code_2</span>
              QR Kodunu Gör
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
