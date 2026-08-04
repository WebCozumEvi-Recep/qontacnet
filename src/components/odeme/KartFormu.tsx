"use client";
import { useState } from "react";

// Kredi kartı alanları. Seçili ödeme sağlayıcısı kart bilgisini bizden bekliyorsa
// (DijiGate) gösterilir; QNB 3DHost'ta kart bankanın sayfasında girilir.
//
// Kart verisi yalnızca bu bileşenin state'inde tutulur, sipariş isteğinin gövdesinde
// sunucuya iletilir ve oradan doğrudan sağlayıcıya gider. Hiçbir yerde saklanmaz,
// localStorage'a yazılmaz ve tarayıcı geçmişine (URL) konmaz.

export interface KartAlanlari {
  sahip: string;
  numara: string;
  ay: string;
  yil: string;
  cvc: string;
}

export const BOS_KART: KartAlanlari = { sahip: "", numara: "", ay: "", yil: "", cvc: "" };

/** "4111111111111111" → "4111 1111 1111 1111" */
function numaraBicimle(ham: string): string {
  return ham.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
}

const inputCls = "w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary outline-none transition-all";

export function KartFormu({ kart, onChange }: { kart: KartAlanlari; onChange: (k: KartAlanlari) => void }) {
  const [yillar] = useState(() => {
    // Yıl listesi bir kez üretilir; render sırasında tarih okumamak için lazy initializer.
    const bu = new Date().getFullYear();
    return Array.from({ length: 15 }, (_, i) => String(bu + i));
  });

  const set = (k: keyof KartAlanlari, v: string) => onChange({ ...kart, [k]: v });

  return (
    <div className="border border-white/10 rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-lg">credit_card</span>
        <p className="text-sm font-medium text-on-surface">Kart Bilgileri</p>
        <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-on-surface-variant">
          <span className="material-symbols-outlined text-sm">lock</span>3D Secure
        </span>
      </div>

      <div>
        <label className="block text-xs text-on-surface-variant mb-1.5">Kart Üzerindeki İsim</label>
        <input
          required value={kart.sahip}
          onChange={e => set("sahip", e.target.value.toUpperCase())}
          autoComplete="cc-name" placeholder="AD SOYAD" className={inputCls}
        />
      </div>

      <div>
        <label className="block text-xs text-on-surface-variant mb-1.5">Kart Numarası</label>
        <input
          required value={numaraBicimle(kart.numara)}
          onChange={e => set("numara", e.target.value.replace(/\D/g, "").slice(0, 19))}
          autoComplete="cc-number" inputMode="numeric" placeholder="0000 0000 0000 0000"
          className={`${inputCls} font-mono tracking-wider`}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-on-surface-variant mb-1.5">Ay</label>
          <select required value={kart.ay} onChange={e => set("ay", e.target.value)} autoComplete="cc-exp-month" className={inputCls}>
            <option value="">AA</option>
            {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-on-surface-variant mb-1.5">Yıl</label>
          <select required value={kart.yil} onChange={e => set("yil", e.target.value)} autoComplete="cc-exp-year" className={inputCls}>
            <option value="">YYYY</option>
            {yillar.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-on-surface-variant mb-1.5">CVC</label>
          <input
            required value={kart.cvc}
            onChange={e => set("cvc", e.target.value.replace(/\D/g, "").slice(0, 4))}
            autoComplete="cc-csc" inputMode="numeric" placeholder="000" className={inputCls}
          />
        </div>
      </div>

      <p className="text-[11px] text-on-surface-variant">
        Kart bilgileriniz saklanmaz. Ödeme, bankanızın 3D Secure ekranında onaylanarak tamamlanır.
      </p>
    </div>
  );
}
