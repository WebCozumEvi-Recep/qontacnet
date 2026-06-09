"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Member {
  id: string; ad: string; soyad: string; email: string; unvan: string; departman: string;
  aktif: boolean; kartRenk: string; goruntulemeSayisi: number; leadSayisi: number; avatar?: string;
}

export default function UyelerPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAktif, setFilterAktif] = useState<"Tümü" | "Aktif" | "Pasif">("Tümü");
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ ad: "", soyad: "", email: "", unvan: "", departman: "" });
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState("");
  const [createdPw, setCreatedPw] = useState<{ email: string; sifre: string } | null>(null);

  const load = () => fetch("/api/firma/members").then(r => r.json()).then(j => { if (j.ok) setMembers(j.members); }).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const createMember = async () => {
    setAddError("");
    setSaving(true);
    try {
      const res = await fetch("/api/firma/members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error ?? "Eklenemedi.");
      setCreatedPw({ email: form.email, sifre: j.geciciSifre });
      setForm({ ad: "", soyad: "", email: "", unvan: "", departman: "" });
      await load();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Eklenemedi.");
    } finally { setSaving(false); }
  };

  const closeAdd = () => { setShowAddModal(false); setCreatedPw(null); setAddError(""); setForm({ ad: "", soyad: "", email: "", unvan: "", departman: "" }); };

  const filtered = members.filter(m => {
    const ms = !search || `${m.ad} ${m.soyad} ${m.email} ${m.unvan} ${m.departman}`.toLowerCase().includes(search.toLowerCase());
    const ma = filterAktif === "Tümü" || (filterAktif === "Aktif" ? m.aktif : !m.aktif);
    return ms && ma;
  });

  return (
    <div className="max-w-[1000px] space-y-5">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3 flex-wrap flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">search</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ad, e-posta veya unvan ara..." className="w-full bg-surface-dim border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary outline-none transition-all" />
          </div>
          <div className="flex gap-2">
            {(["Tümü", "Aktif", "Pasif"] as const).map(k => (
              <button key={k} onClick={() => setFilterAktif(k)} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filterAktif === k ? "bg-primary-container text-on-primary-container" : "glass-card text-on-surface-variant hover:text-on-surface"}`}>{k}</button>
            ))}
          </div>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold hover:scale-[1.02] transition-all whitespace-nowrap"><span className="material-symbols-outlined text-base">person_add</span>Üye Ekle</button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[{ label: "Toplam", value: members.length, color: "#00d4ff" }, { label: "Aktif", value: members.filter(m => m.aktif).length, color: "#42faba" }, { label: "Pasif", value: members.filter(m => !m.aktif).length, color: "#ff6b6b" }].map(s => (
          <div key={s.label} className="glass-card rounded-xl p-4 text-center"><p className="text-2xl font-bold" style={{ fontFamily: "Sora, sans-serif", color: s.color }}>{s.value}</p><p className="text-xs text-on-surface-variant mt-0.5">{s.label} Üye</p></div>
        ))}
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-white/5 text-xs text-on-surface-variant font-medium uppercase tracking-wider">
          <span>Üye</span><span>Ünvan / Kariyer</span><span>Takım</span><span>Görüntülenme</span><span>Durum</span><span>İşlem</span>
        </div>
        <div className="divide-y divide-white/5">
          {loading ? <div className="py-16 text-center text-on-surface-variant text-sm">Yükleniyor...</div> : filtered.map(m => (
            <div key={m.id} className="grid md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-5 py-4 hover:bg-white/3 transition-all items-center">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 border" style={{ background: `${m.kartRenk}15`, borderColor: `${m.kartRenk}30` }}>
                  {m.avatar
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={m.avatar} alt={`${m.ad} ${m.soyad}`} className="w-full h-full object-cover object-center" />
                    : <span className="material-symbols-outlined text-sm" style={{ color: m.kartRenk }}>person</span>}
                </div>
                <div><p className="text-sm font-medium text-on-surface">{m.ad} {m.soyad}</p><p className="text-xs text-on-surface-variant">{m.email}</p></div>
              </div>
              <div><p className="text-sm text-on-surface">{m.unvan || "—"}</p></div>
              <div><span className="text-xs px-2 py-1 rounded-full bg-white/5 text-on-surface-variant">{m.departman || "—"}</span></div>
              <div className="text-sm text-on-surface font-medium">{m.goruntulemeSayisi}</div>
              <div><span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${m.aktif ? "bg-tertiary/10 text-tertiary border-tertiary/20" : "bg-red-400/10 text-red-400 border-red-400/20"}`}>{m.aktif ? "Aktif" : "Pasif"}</span></div>
              <div className="flex gap-1">
                <Link href={`/firma/uyeler/${m.id}`} className="w-8 h-8 rounded-lg glass-card flex items-center justify-center hover:text-primary transition-all"><span className="material-symbols-outlined text-sm">visibility</span></Link>
                <Link href={`/kart/${m.id}`} target="_blank" className="w-8 h-8 rounded-lg glass-card flex items-center justify-center hover:text-primary transition-all"><span className="material-symbols-outlined text-sm">open_in_new</span></Link>
              </div>
            </div>
          ))}
          {!loading && filtered.length === 0 && <div className="py-16 text-center text-on-surface-variant text-sm"><span className="material-symbols-outlined text-4xl block mb-3 opacity-30">person_search</span>Üye bulunamadı</div>}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeAdd}>
          <div className="glass-card rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6"><h3 className="text-base font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Yeni Üye Ekle</h3><button onClick={closeAdd} className="text-on-surface-variant hover:text-on-surface transition-all"><span className="material-symbols-outlined">close</span></button></div>

            {createdPw ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-tertiary text-sm"><span className="material-symbols-outlined">check_circle</span>Üye oluşturuldu!</div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-sm">
                  <p className="text-on-surface-variant text-xs">Üye bu bilgilerle giriş yapabilir:</p>
                  <p className="text-on-surface"><span className="text-on-surface-variant">E-posta:</span> {createdPw.email}</p>
                  <p className="text-on-surface"><span className="text-on-surface-variant">Geçici şifre:</span> <span className="font-mono text-primary">{createdPw.sifre}</span></p>
                  <p className="text-xs text-on-surface-variant">Bu şifreyi üyeyle paylaşın; üye girip profilini düzenleyebilir.</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setCreatedPw(null)} className="flex-1 py-3 glass-card rounded-xl text-on-surface-variant text-sm">Bir Üye Daha</button>
                  <button onClick={closeAdd} className="flex-1 py-3 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold">Bitti</button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input value={form.ad} onChange={upd("ad")} placeholder="Ad *" className="bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none" />
                  <input value={form.soyad} onChange={upd("soyad")} placeholder="Soyad" className="bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none" />
                </div>
                <input value={form.email} onChange={upd("email")} type="email" placeholder="E-posta *" className="w-full bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none" />
                <div className="grid grid-cols-2 gap-3">
                  <input value={form.unvan} onChange={upd("unvan")} placeholder="Ünvan / Kariyer" className="bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none" />
                  <input value={form.departman} onChange={upd("departman")} placeholder="Takım" className="bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none" />
                </div>
                {addError && <div className="flex items-center gap-2 text-red-400 text-sm"><span className="material-symbols-outlined text-base">error</span>{addError}</div>}
                <div className="flex gap-3 pt-2">
                  <button onClick={closeAdd} className="flex-1 py-3 glass-card rounded-xl text-on-surface-variant text-sm">İptal</button>
                  <button onClick={createMember} disabled={saving || !form.ad || !form.email} className="flex-1 py-3 bg-primary-container text-on-primary-container rounded-xl text-sm font-semibold disabled:opacity-50">{saving ? "Ekleniyor..." : "Üye Oluştur"}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
