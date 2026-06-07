"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { kaynakLabel, trDate } from "@/lib/labels";
import Image from "next/image";

interface Lead { id: string; ad: string; sirket: string; kaynak: string; createdAt: string }
interface Member {
  id: string; ad: string; soyad: string; email: string; telefon: string; unvan: string; departman: string;
  whatsapp: string; linkedin: string; biyografi: string; aktif: boolean; kartRenk: string;
  goruntulemeSayisi: number; leadSayisi: number; createdAt: string; leads: Lead[];
  firma?: { ad: string }; avatar?: string;
}

export default function UyeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [resetPw, setResetPw] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    fetch(`/api/firma/members/${id}`).then(r => r.json()).then(j => { if (j.ok) setMember(j.member); else setNotFound(true); }).finally(() => setLoading(false));
  }, [id]);

  const patch = async (body: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/firma/members/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await res.json();
      if (j.ok) { setMember(m => (m ? { ...m, ...j.member } : m)); if (j.geciciSifre) setResetPw(j.geciciSifre); }
    } finally { setBusy(false); }
  };

  const remove = async () => {
    if (!confirm("Bu üye kalıcı olarak silinecek. Emin misiniz?")) return;
    const res = await fetch(`/api/firma/members/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/firma/uyeler");
  };

  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Lütfen bir resim dosyası seçiniz."); return; }
    if (file.size > 5 * 1024 * 1024) { alert("Dosya boyutu 5MB'dan küçük olmalıdır."); return; }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/firma/members/${id}/photo`, { method: "POST", body: formData });
      const j = await res.json();
      if (j.ok) setMember(m => (m ? { ...m, avatar: j.photoUrl } : m));
      else alert(j.error ?? "Fotoğraf yüklenemedi.");
    } finally { setUploadingPhoto(false); }
  };

  if (loading) return <div className="glass-card rounded-2xl p-12 text-center text-on-surface-variant max-w-[900px]">Yükleniyor...</div>;
  if (notFound || !member) return (
    <div className="max-w-[900px] space-y-4">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary"><span className="material-symbols-outlined text-base">arrow_back</span>Geri</button>
      <div className="glass-card rounded-2xl p-12 text-center text-on-surface-variant">Üye bulunamadı.</div>
    </div>
  );

  const leads = member.leads ?? [];
  const contactItems = [
    { icon: "mail", label: "E-Posta", value: member.email, href: `mailto:${member.email}` },
    { icon: "phone", label: "Telefon", value: member.telefon, href: `tel:${member.telefon}` },
    { icon: "chat", label: "WhatsApp", value: member.whatsapp, href: `https://wa.me/${member.whatsapp}` },
    { icon: "link", label: "LinkedIn", value: member.linkedin, href: `https://${member.linkedin}` },
  ].filter(i => i.value);

  return (
    <div className="max-w-[900px] space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-all"><span className="material-symbols-outlined text-base">arrow_back</span>Üye Listesine Dön</button>

      <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 border-2 overflow-hidden" style={{ background: `${member.kartRenk}20`, borderColor: `${member.kartRenk}40` }}>
            {member.avatar ? (
              <Image src={member.avatar} alt={`${member.ad} ${member.soyad}`} width={80} height={80} className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-4xl" style={{ color: member.kartRenk }}>person</span>
            )}
          </div>
          <label className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-sm text-on-primary">add</span>
            <input type="file" accept="image/*" onChange={uploadPhoto} disabled={uploadingPhoto} className="hidden" />
          </label>
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>{member.ad} {member.soyad}</h2>
              <p className="text-on-surface-variant text-sm mt-0.5">{member.unvan || "—"} · {member.departman ? `Takım: ${member.departman}` : "—"}</p>
              {member.firma && <p className="text-primary text-xs mt-1">{member.firma.ad}</p>}
            </div>
            <div className="flex gap-2">
              <span className={`text-xs px-3 py-1.5 rounded-full font-medium border ${member.aktif ? "bg-tertiary/10 text-tertiary border-tertiary/20" : "bg-red-400/10 text-red-400 border-red-400/20"}`}>{member.aktif ? "Aktif" : "Pasif"}</span>
              <Link href={`/kart/${member.id}`} target="_blank" className="flex items-center gap-1.5 text-xs px-3 py-1.5 glass-card rounded-full text-on-surface-variant hover:text-primary transition-all"><span className="material-symbols-outlined text-sm">open_in_new</span>Kartı Gör</Link>
            </div>
          </div>
          {member.biyografi && <p className="text-sm text-on-surface-variant mt-3 max-w-lg">{member.biyografi}</p>}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: "visibility", label: "Görüntülenme", value: member.goruntulemeSayisi, color: "#00d4ff" },
              { icon: "group_add", label: "Lead", value: member.leadSayisi, color: "#42faba" },
              { icon: "nfc", label: "NFC Dokunma", value: Math.floor(member.goruntulemeSayisi * 0.6), color: "#6001d1" },
              { icon: "qr_code_2", label: "QR Tarama", value: Math.floor(member.goruntulemeSayisi * 0.4), color: "#a8e8ff" },
            ].map(s => (
              <div key={s.label} className="glass-card rounded-xl p-4"><div className="flex items-center gap-2 mb-2"><span className="material-symbols-outlined text-base" style={{ color: s.color }}>{s.icon}</span><span className="text-xs text-on-surface-variant">{s.label}</span></div><p className="text-xl font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>{s.value}</p></div>
            ))}
          </div>

          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-on-surface mb-4" style={{ fontFamily: "Sora, sans-serif" }}>Liderler ({leads.length})</h3>
            {leads.length === 0 ? <p className="text-sm text-on-surface-variant text-center py-6">Henüz lead yok</p> : (
              <div className="space-y-2">
                {leads.map(l => (
                  <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/3 transition-all">
                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0"><span className="material-symbols-outlined text-primary text-sm">person</span></div>
                    <div className="flex-1 min-w-0"><p className="text-sm text-on-surface">{l.ad}</p><p className="text-xs text-on-surface-variant">{l.sirket}</p></div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${l.kaynak === "NFC" ? "bg-primary/10 text-primary" : l.kaynak === "QR" ? "bg-tertiary/10 text-tertiary" : "bg-secondary/20 text-secondary"}`}>{kaynakLabel[l.kaynak]}</span>
                    <span className="text-xs text-on-surface-variant">{trDate(l.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-on-surface mb-4" style={{ fontFamily: "Sora, sans-serif" }}>İletişim</h3>
            <div className="space-y-3">
              {contactItems.map(c => (
                <a key={c.label} href={c.href} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-all group"><span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-all text-base">{c.icon}</span><div><p className="text-xs text-on-surface-variant">{c.label}</p><p className="text-sm text-on-surface truncate">{c.value}</p></div></a>
              ))}
              {contactItems.length === 0 && <p className="text-sm text-on-surface-variant">İletişim bilgisi yok.</p>}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 space-y-2">
            <h3 className="text-sm font-semibold text-on-surface mb-3" style={{ fontFamily: "Sora, sans-serif" }}>İşlemler</h3>
            <button onClick={() => patch({ aktif: !member.aktif })} disabled={busy} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-on-surface-variant hover:bg-white/5 transition-all disabled:opacity-50">
              <span className="material-symbols-outlined text-base">{member.aktif ? "toggle_off" : "toggle_on"}</span>{member.aktif ? "Pasife Al" : "Aktif Et"}
            </button>
            <button onClick={() => patch({ resetPassword: true })} disabled={busy} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-on-surface-variant hover:bg-white/5 transition-all disabled:opacity-50">
              <span className="material-symbols-outlined text-base">lock_reset</span>Şifre Sıfırla
            </button>
            <button onClick={remove} disabled={busy} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-400/5 transition-all disabled:opacity-50">
              <span className="material-symbols-outlined text-base">person_off</span>Üyeyi Sil
            </button>
            {resetPw && (
              <div className="mt-2 p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
                <p className="text-on-surface-variant mb-1">Yeni geçici şifre:</p>
                <p className="font-mono text-primary">{resetPw}</p>
              </div>
            )}
          </div>

          <div className="glass-card rounded-2xl p-4 text-xs space-y-2 text-on-surface-variant">
            <div className="flex justify-between"><span>Kart rengi</span><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ background: member.kartRenk }} /><span>{member.kartRenk}</span></div></div>
            <div className="flex justify-between"><span>Üyelik Tarihi</span><span>{trDate(member.createdAt)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
