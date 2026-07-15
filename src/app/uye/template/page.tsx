"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { TemplateGalleryCard } from "@/components/templates/TemplateGalleryCard";
import { MiniCardPreview } from "@/components/templates/MiniCardPreview";
import {
  DB_MODULE_TO_CHIP,
  MOCK_DESCRIPTIONS,
  type CardTemplateItem,
  type TemplateModuleChip,
} from "@/lib/template-design";

const STORAGE_KEY = "qontac_member_template_id";

interface ApiTemplate {
  id: string;
  ad: string;
  renk: string;
  aktif: boolean;
  memberCount?: number;
}

/** Design-only: module list per template until a single API returns enriched templates */
const DESIGN_MODULE_FALLBACK: Record<string, TemplateModuleChip[]> = {
  tpl_1: [
    { id: "m1", type: "HERO", title: "Tanıtım" },
    { id: "m2", type: "ABOUT", title: "Hakkımızda" },
    { id: "m3", type: "GALLERY", title: "Ürünler" },
    { id: "m4", type: "FORM", title: "İletişim" },
  ],
  tpl_2: [
    { id: "m5", type: "ABOUT", title: "Biz Kimiz" },
    { id: "m6", type: "VIDEO", title: "Tanıtım Videosu" },
    { id: "m7", type: "FAQ", title: "SSS" },
  ],
};

function enrichTemplate(t: ApiTemplate): CardTemplateItem {
  return {
    id: t.id,
    name: t.ad,
    color: t.renk,
    description: MOCK_DESCRIPTIONS[t.id] ?? MOCK_DESCRIPTIONS.default,
    modules: DESIGN_MODULE_FALLBACK[t.id] ?? [
      { id: `ph-${t.id}`, type: "ABOUT", title: "Hakkımızda" },
      { id: `ph2-${t.id}`, type: "GALLERY", title: "Galeri" },
    ],
    memberCount: t.memberCount ?? 0,
    isDefault: t.aktif,
  };
}

export default function MemberTemplatePage() {
  const { user } = useAuth();
  const member = user?.data as { ad?: string; soyad?: string; unvan?: string; firmaAdi?: string } | undefined;

  const [items, setItems] = useState<CardTemplateItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [noFirm, setNoFirm] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored) setSelectedId(stored);

    fetch("/api/me/templates")
      .then(r => r.json())
      .then(j => {
        if (!j.ok) return;
        if (!j.templates?.length) {
          setNoFirm(true);
          return;
        }
        const enriched = (j.templates as ApiTemplate[]).map(enrichTemplate);
        setItems(enriched);
        const defaultTpl = enriched.find(t => t.isDefault);
        if (!stored && defaultTpl) {
          setSelectedId(defaultTpl.id);
          setPendingId(defaultTpl.id);
        } else if (stored) {
          setPendingId(stored);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const pending = items.find(t => t.id === pendingId);
  const active = items.find(t => t.id === selectedId);
  const hasChange = pendingId !== null && pendingId !== selectedId;

  const applyTemplate = async () => {
    if (!pendingId) return;
    setSaving(true);
    // TODO: PATCH /api/me/template { templateId }
    await new Promise(r => setTimeout(r, 600));
    localStorage.setItem(STORAGE_KEY, pendingId);
    setSelectedId(pendingId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const memberName = [member?.ad, member?.soyad].filter(Boolean).join(" ") || "Ad Soyad";

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center text-on-surface-variant text-sm max-w-[900px]">
        Yükleniyor...
      </div>
    );
  }

  if (noFirm || items.length === 0) {
    return (
      <div className="max-w-[520px] mx-auto glass-card rounded-2xl p-10 text-center space-y-4">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 block">corporate_fare</span>
        <h2 className="text-lg font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>
          Henüz firma şablonu yok
        </h2>
        <p className="text-sm text-on-surface-variant">
          Firmasız kayıt olduysan veya firman henüz şablon oluşturmadıysa burada seçim yapamazsın.
          Kart aktivasyonundan sonra firmanın hazır şablonları listelenecek.
        </p>
        <Link href="/uye/kartim" className="inline-block text-sm text-primary hover:underline">
          ← Kartıma dön
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] space-y-6">
      <div className="glass-card rounded-2xl p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
        <div className="w-12 h-12 rounded-xl bg-secondary/15 border border-secondary/25 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-secondary text-2xl">style</span>
        </div>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>
            Kart Şablonu Seç
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            {member?.firmaAdi ?? "Firmanız"} tarafından hazırlanan şablonlardan birini seç.
            Kurumsal modüller ve tema rengi buna göre kartında görünür.
          </p>
        </div>
        {active && (
          <div className="text-xs text-on-surface-variant bg-white/5 rounded-xl px-3 py-2 border border-white/10">
            Aktif: <span className="text-on-surface font-medium">{active.name}</span>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Template list */}
        <div className="lg:col-span-3 space-y-3">
          <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider px-1">
            Firma şablonları ({items.length})
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {items.map(t => (
              <TemplateGalleryCard
                key={t.id}
                item={t}
                selected={t.id === pendingId}
                onSelect={() => setPendingId(t.id)}
                showMemberCount
              />
            ))}
          </div>
        </div>

        {/* Live preview + apply */}
        <div className="lg:col-span-2 space-y-4">
          <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider px-1">
            Önizleme
          </p>
          <div className="glass-card rounded-2xl p-5 sticky top-24 space-y-4">
            {pending ? (
              <>
                <MiniCardPreview
                  name={pending.name}
                  color={pending.color}
                  modules={pending.modules}
                  memberName={memberName}
                  role={member?.unvan || "Unvan"}
                />
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-on-surface">{pending.name}</p>
                  <p className="text-xs text-on-surface-variant">{pending.description}</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-on-surface-variant text-center py-8">Bir şablon seç</p>
            )}

            {hasChange && (
              <div className="p-3 rounded-xl bg-amber-400/8 border border-amber-400/20 text-xs text-amber-200/90 flex gap-2">
                <span className="material-symbols-outlined text-sm flex-shrink-0">info</span>
                Şablon değişince kartındaki kurumsal modüller güncellenir. Kişisel modüllerin kalır.
              </div>
            )}

            <button
              type="button"
              onClick={applyTemplate}
              disabled={!pendingId || !hasChange || saving}
              className="w-full py-3 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100"
            >
              <span className={`material-symbols-outlined text-base ${saving ? "animate-spin" : ""}`}>
                {saving ? "progress_activity" : saved ? "check_circle" : "done"}
              </span>
              {saving ? "Uygulanıyor..." : saved ? "Uygulandı!" : hasChange ? "Bu Şablonu Kullan" : "Seçili şablon aktif"}
            </button>

            <Link
              href="/uye/kartim"
              className="block text-center text-xs text-on-surface-variant hover:text-primary transition-colors"
            >
              Kart ayarlarına git →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
