"use client";
interface Props {
  title: string;
  onMenuClick: () => void;
}

export default function DashboardTopBar({ title, onMenuClick }: Props) {
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-surface-container-lowest/80 backdrop-blur-xl sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/5 transition-all text-on-surface-variant"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h1 className="text-on-surface font-semibold" style={{ fontFamily: "Sora, sans-serif" }}>
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-tertiary/10 border border-tertiary/20">
          <span className="flex h-1.5 w-1.5 rounded-full bg-tertiary" />
          <span className="text-tertiary text-xs font-medium">Aktif</span>
        </div>
      </div>
    </header>
  );
}
