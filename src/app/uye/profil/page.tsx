"use client";
import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { Member } from "@/lib/mock-data";

export default function ProfilPage() {
  const { user, updateUserData } = useAuth();
  const member = user?.data as unknown as Member;

  const [form, setForm] = useState({
    ad: member?.ad ?? "",
    soyad: member?.soyad ?? "",
    email: member?.email ?? "",
    unvan: member?.unvan ?? "",
    departman: member?.departman ?? "",
    telefon: member?.telefon ?? "",
    whatsapp: member?.whatsapp ?? "",
    linkedin: member?.linkedin ?? "",
    instagram: member?.instagram ?? "",
    website: member?.website ?? "",
    biyografi: member?.biyografi ?? "",
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatar, setAvatar] = useState<string>(member?.avatar ?? "");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const [error, setError] = useState("");

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError("");
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/me/photo", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Yüklenemedi.");
      setAvatar(json.photoUrl);
      updateUserData({ ...user?.data, avatar: json.photoUrl });
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Yüklenemedi.");
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Kaydedilemedi.");
      updateUserData(json.member);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:border-primary outline-none transition-all";
  const labelClass = "text-xs text-on-surface-variant mb-1.5 block";

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar */}
        <div className="glass-card rounded-2xl p-6 flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <div
              className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/30 overflow-hidden flex items-center justify-center cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="Profil fotoğrafı" className="w-full h-full object-cover object-center" />
              ) : (
                <span className="material-symbols-outlined text-primary text-4xl">person</span>
              )}
              {photoUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                  <span className="material-symbols-outlined text-white text-xl animate-spin">progress_activity</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary-container rounded-full flex items-center justify-center border-2 border-background hover:scale-110 transition-all"
            >
              <span className="material-symbols-outlined text-on-primary-container text-sm">photo_camera</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>
          <div>
            <p className="font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>
              {member?.ad} {member?.soyad}
            </p>
            <p className="text-sm text-on-surface-variant">{member?.email}</p>
            <p className="text-xs text-primary mt-1">{member?.firmaAdi}</p>
            {photoError && <p className="text-xs text-red-400 mt-1">{photoError}</p>}
            {!photoError && <p className="text-xs text-on-surface-variant/50 mt-1">Fotoğrafa tıkla veya kameraya bas</p>}
          </div>
        </div>

        {/* Kişisel Bilgiler */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-on-surface mb-4" style={{ fontFamily: "Sora, sans-serif" }}>Kişisel Bilgiler</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Ad</label>
              <input value={form.ad} onChange={e => set("ad", e.target.value)} className={inputClass} placeholder="Adınız" />
            </div>
            <div>
              <label className={labelClass}>Soyad</label>
              <input value={form.soyad} onChange={e => set("soyad", e.target.value)} className={inputClass} placeholder="Soyadınız" />
            </div>
            <div>
              <label className={labelClass}>Ünvan / Kariyer</label>
              <input value={form.unvan} onChange={e => set("unvan", e.target.value)} className={inputClass} placeholder="Satış Müdürü" />
            </div>
            <div>
              <label className={labelClass}>Takım</label>
              <input value={form.departman} onChange={e => set("departman", e.target.value)} className={inputClass} placeholder="Satış" />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>E-Posta</label>
              <input type="email" value={form.email} onChange={e => set("email", e.target.value)} className={inputClass} placeholder="email@example.com" />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Telefon</label>
              <input value={form.telefon} onChange={e => set("telefon", e.target.value)} className={inputClass} placeholder="+90 5xx xxx xx xx" />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Biyografi</label>
              <textarea value={form.biyografi} onChange={e => set("biyografi", e.target.value)} rows={3}
                className={`${inputClass} resize-none`} placeholder="Kendinizden kısaca bahsedin..." />
            </div>
          </div>
        </div>

        {/* Sosyal Medya */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-on-surface mb-4" style={{ fontFamily: "Sora, sans-serif" }}>Sosyal & İletişim</h3>
          <div className="space-y-4">
            {[
              { key: "whatsapp", icon: "phone", label: "WhatsApp", placeholder: "+90 5xx xxx xx xx" },
              { key: "linkedin", icon: "link", label: "LinkedIn", placeholder: "linkedin.com/in/kullaniciad" },
              { key: "instagram", icon: "photo_camera", label: "Instagram", placeholder: "@kullaniciad" },
              { key: "website", icon: "public", label: "Website", placeholder: "www.example.com" },
            ].map(item => (
              <div key={item.key} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-on-surface-variant text-base">{item.icon}</span>
                </div>
                <div className="flex-1">
                  <label className={labelClass}>{item.label}</label>
                  <input
                    value={form[item.key as keyof typeof form] as string}
                    onChange={e => set(item.key, e.target.value)}
                    className={inputClass}
                    placeholder={item.placeholder}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-primary-container text-on-primary-container font-semibold rounded-xl hover:scale-[1.02] transition-all disabled:opacity-60">
            {saving ? (
              <><span className="material-symbols-outlined text-base animate-spin">progress_activity</span>Kaydediliyor</>
            ) : (
              <><span className="material-symbols-outlined text-base">save</span>Kaydet</>
            )}
          </button>
          {saved && (
            <div className="flex items-center gap-1.5 text-tertiary text-sm">
              <span className="material-symbols-outlined text-base">check_circle</span>
              Kaydedildi!
            </div>
          )}
          {error && (
            <div className="flex items-center gap-1.5 text-red-400 text-sm">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
