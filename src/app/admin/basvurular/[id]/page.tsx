"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { basvuruDurumMap, trDate } from "@/lib/labels";

interface Note { id: string; icerik: string; adminAd: string; createdAt: string; }
interface Application {
  id: string; firmaAdi: string; yetkili: string; email: string; telefon: string;
  uyeSayisi: string; mesaj: string; durum: string; createdAt: string;
  notlar: Note[];
}

interface EditForm { firmaAdi: string; yetkili: string; email: string; telefon: string; uyeSayisi: string; mesaj: string; }

export default function BasvuruDetayPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);
  const [converted, setConverted] = useState<{ email: string; sifre: string } | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/admin/applications/${id}`).then(r => r.json()).then(j => {
      if (j.ok) setApp(j.application);
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [app?.notlar]);

  async function updateDurum(durum: string) {
    if (!app) return;
    setBusy(true);
    const res = await fetch(`/api/admin/applications/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durum }),
    });
    const j = await res.json();
    if (j.ok) setApp(prev => prev ? { ...prev, durum } : prev);
    setBusy(false);
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setNoteLoading(true);
    const res = await fetch(`/api/admin/applications/${id}/notes`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ icerik: noteText.trim() }),
    });
    const j = await res.json();
    setNoteLoading(false);
    if (j.ok) {
      setApp(prev => prev ? { ...prev, notlar: [...prev.notlar, j.note] } : prev);
      setNoteText("");
    }
  }

  function openEdit() {
    if (!app) return;
    setEditForm({ firmaAdi: app.firmaAdi, yetkili: app.yetkili, email: app.email, telefon: app.telefon, uyeSayisi: app.uyeSayisi, mesaj: app.mesaj ?? "" });
    setShowEdit(true);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editForm) return;
    setEditLoading(true);
    const res = await fetch(`/api/admin/applications/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const j = await res.json();
    setEditLoading(false);
    if (j.ok) {
      setApp(prev => prev ? { ...prev, ...editForm } : prev);
      setShowEdit(false);
    } else {
      alert(j.error ?? "Güncellenemedi.");
    }
  }

  async function deleteApp() {
    if (!app) return;
    if (!confirm(`"${app.firmaAdi}" başvurusunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/applications/${id}`, { method: "DELETE" });
    const j = await res.json();
    setBusy(false);
    if (j.ok) {
      router.push("/admin/basvurular");
    } else {
      alert(j.error ?? "Silinemedi.");
    }
  }

  async function convert() {
    if (!app) return;
    if (!confirm(`"${app.firmaAdi}" başvurusunu firmaya dönüştürmek istediğinize emin misiniz?`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/applications/${id}`, { method: "POST" });
    const j = await res.json();
    setBusy(false);
    if (j.ok) {
      setConverted({ email: j.email, sifre: j.geciciSifre });
      setApp(prev => prev ? { ...prev, durum: "DONUSUM" } : prev);
    } else {
      alert(j.error ?? "Dönüştürülemedi.");
    }
  }

  if (loading) return <div className="p-12 text-center text-on-surface-variant">Yükleniyor...</div>;
  if (!app) return <div className="p-12 text-center text-on-surface-variant">Başvuru bulunamadı.</div>;

  const durum = basvuruDurumMap[app.durum] ?? { label: app.durum, color: "#aaa" };

  return (
    <div className="max-w-[1100px] space-y-5">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-all">
          <span className="material-symbols-outlined text-base">arrow_back</span>Başvurular
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-full font-medium"
            style={{ background: `${durum.color}15`, color: durum.color, border: `1px solid ${durum.color}30` }}>
            {durum.label}
          </span>
          <button onClick={openEdit} disabled={busy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-on-surface-variant hover:text-on-surface hover:bg-white/8 transition-all disabled:opacity-40">
            <span className="material-symbols-outlined text-sm">edit</span>Düzenle
          </button>
          <button onClick={deleteApp} disabled={busy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-40">
            <span className="material-symbols-outlined text-sm">delete</span>Sil
          </button>
        </div>
      </div>

      {/* Düzenle Modal */}
      {showEdit && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>Başvuruyu Düzenle</h2>
              <button onClick={() => setShowEdit(false)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={saveEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-xs text-on-surface-variant">Firma Adı</span>
                  <input value={editForm.firmaAdi} onChange={e => setEditForm(f => f ? { ...f, firmaAdi: e.target.value } : f)}
                    className="w-full bg-surface-dim border border-white/10 rounded-xl px-3 py-2 text-sm text-on-surface focus:border-primary outline-none transition-all" required />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-on-surface-variant">Yetkili</span>
                  <input value={editForm.yetkili} onChange={e => setEditForm(f => f ? { ...f, yetkili: e.target.value } : f)}
                    className="w-full bg-surface-dim border border-white/10 rounded-xl px-3 py-2 text-sm text-on-surface focus:border-primary outline-none transition-all" required />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-on-surface-variant">E-posta</span>
                  <input type="email" value={editForm.email} onChange={e => setEditForm(f => f ? { ...f, email: e.target.value } : f)}
                    className="w-full bg-surface-dim border border-white/10 rounded-xl px-3 py-2 text-sm text-on-surface focus:border-primary outline-none transition-all" required />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-on-surface-variant">Telefon</span>
                  <input value={editForm.telefon} onChange={e => setEditForm(f => f ? { ...f, telefon: e.target.value } : f)}
                    className="w-full bg-surface-dim border border-white/10 rounded-xl px-3 py-2 text-sm text-on-surface focus:border-primary outline-none transition-all" />
                </label>
              </div>
              <label className="space-y-1 block">
                <span className="text-xs text-on-surface-variant">Üye Sayısı</span>
                <input value={editForm.uyeSayisi} onChange={e => setEditForm(f => f ? { ...f, uyeSayisi: e.target.value } : f)}
                  className="w-full bg-surface-dim border border-white/10 rounded-xl px-3 py-2 text-sm text-on-surface focus:border-primary outline-none transition-all" />
              </label>
              <label className="space-y-1 block">
                <span className="text-xs text-on-surface-variant">Mesaj</span>
                <textarea value={editForm.mesaj} onChange={e => setEditForm(f => f ? { ...f, mesaj: e.target.value } : f)} rows={3}
                  className="w-full bg-surface-dim border border-white/10 rounded-xl px-3 py-2 text-sm text-on-surface focus:border-primary outline-none transition-all resize-none" />
              </label>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowEdit(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-on-surface-variant hover:bg-white/5 transition-all">
                  İptal
                </button>
                <button type="submit" disabled={editLoading}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-black text-sm font-semibold hover:scale-[1.02] transition-all disabled:opacity-40">
                  {editLoading ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_380px] gap-5">
        {/* Sol: notlar / yazışma geçmişi */}
        <div className="flex flex-col gap-4">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h1 className="text-lg font-bold text-on-surface" style={{ fontFamily: "Sora, sans-serif" }}>{app.firmaAdi}</h1>
                <p className="text-xs text-on-surface-variant mt-0.5">Başvuru tarihi: {trDate(app.createdAt)}</p>
              </div>
            </div>
            {app.mesaj && (
              <div className="mt-4 p-4 rounded-xl bg-white/3 border border-white/8">
                <p className="text-xs text-on-surface-variant mb-1 font-medium uppercase tracking-wide">Başvuru Mesajı</p>
                <p className="text-sm text-on-surface leading-relaxed">{app.mesaj}</p>
              </div>
            )}
          </div>

          {/* Notlar / yazışma geçmişi */}
          <div className="glass-card rounded-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-white/8 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">forum</span>
              <h2 className="text-sm font-semibold text-on-surface">Yazışma Geçmişi</h2>
              <span className="text-xs text-on-surface-variant ml-auto">{app.notlar.length} not</span>
            </div>

            <div className="flex-1 p-4 space-y-3 min-h-[200px] max-h-[420px] overflow-y-auto">
              {app.notlar.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-on-surface-variant">
                  <span className="material-symbols-outlined text-3xl opacity-30 mb-2">chat_bubble_outline</span>
                  <p className="text-sm">Henüz not eklenmemiş.</p>
                </div>
              ) : (
                app.notlar.map(note => (
                  <div key={note.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-primary text-sm">admin_panel_settings</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-on-surface">{note.adminAd || "Admin"}</span>
                        <span className="text-xs text-on-surface-variant">{trDate(note.createdAt)}</span>
                      </div>
                      <div className="p-3 rounded-xl rounded-tl-sm bg-white/4 border border-white/8 text-sm text-on-surface leading-relaxed">
                        {note.icerik}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={addNote} className="p-4 border-t border-white/8 flex gap-3">
              <input value={noteText} onChange={e => setNoteText(e.target.value)}
                placeholder="Not ekle veya mesaj yaz..."
                className="flex-1 bg-surface-dim border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary outline-none transition-all" />
              <button type="submit" disabled={noteLoading || !noteText.trim()}
                className="px-4 py-2.5 bg-primary text-black rounded-xl text-sm font-semibold hover:scale-[1.02] transition-all disabled:opacity-40">
                <span className="material-symbols-outlined text-base">{noteLoading ? "hourglass_empty" : "send"}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Sağ: bilgiler + aksiyonlar */}
        <div className="space-y-4">
          {/* İletişim bilgileri */}
          <div className="glass-card rounded-2xl p-5">
            <p className="text-xs text-on-surface-variant mb-3 font-medium uppercase tracking-wide">İletişim Bilgileri</p>
            <div className="space-y-3">
              <InfoRow icon="person" label="Yetkili" value={app.yetkili} />
              <InfoRow icon="mail" label="E-posta" value={app.email} href={`mailto:${app.email}`} />
              <InfoRow icon="phone" label="Telefon" value={app.telefon} href={`tel:${app.telefon}`} />
              <InfoRow icon="group" label="Üye Sayısı" value={app.uyeSayisi + " üye"} />
            </div>
          </div>

          {/* Durum güncelle */}
          <div className="glass-card rounded-2xl p-5">
            <p className="text-xs text-on-surface-variant mb-3 font-medium uppercase tracking-wide">Durum Güncelle</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(basvuruDurumMap).map(([key, val]) => (
                <button key={key} onClick={() => updateDurum(key)} disabled={busy}
                  className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-all disabled:opacity-50 ${app.durum === key ? "ring-2 ring-offset-1 ring-offset-transparent" : "opacity-70 hover:opacity-100"}`}
                  style={{
                    background: `${val.color}15`, color: val.color, borderColor: `${val.color}30`,
                    ...(app.durum === key ? { ringColor: val.color } : {}),
                  }}>
                  {val.label}
                </button>
              ))}
            </div>
          </div>

          {/* Aksiyonlar */}
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <p className="text-xs text-on-surface-variant mb-3 font-medium uppercase tracking-wide">Aksiyonlar</p>
            <a href={`mailto:${app.email}`}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-primary-container/20 border border-primary/20 text-sm text-primary hover:bg-primary-container/30 transition-all">
              <span className="material-symbols-outlined text-base">mail</span>E-posta Gönder
            </a>
            {app.telefon && (
              <a href={`tel:${app.telefon}`}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-white/3 border border-white/8 text-sm text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all">
                <span className="material-symbols-outlined text-base">phone</span>Ara
              </a>
            )}
            {converted ? (
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 space-y-1 text-sm">
                <p className="text-green-400 flex items-center gap-2 font-medium">
                  <span className="material-symbols-outlined text-base">check_circle</span>Firma oluşturuldu!
                </p>
                <p className="text-on-surface-variant">Giriş: <span className="text-on-surface">{converted.email}</span></p>
                <p className="text-on-surface-variant">Geçici şifre: <span className="font-mono text-primary">{converted.sifre}</span></p>
              </div>
            ) : app.durum !== "DONUSUM" ? (
              <button onClick={convert} disabled={busy}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-tertiary/10 border border-tertiary/20 text-sm text-tertiary hover:bg-tertiary/20 transition-all disabled:opacity-50">
                <span className="material-symbols-outlined text-base">business</span>
                {busy ? "İşleniyor..." : "Firmaya Dönüştür"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, href }: { icon: string; label: string; value: string; href?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="material-symbols-outlined text-on-surface-variant text-base mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-on-surface-variant">{label}</p>
        {href ? (
          <a href={href} className="text-sm text-primary hover:underline truncate block">{value}</a>
        ) : (
          <p className="text-sm text-on-surface">{value}</p>
        )}
      </div>
    </div>
  );
}
