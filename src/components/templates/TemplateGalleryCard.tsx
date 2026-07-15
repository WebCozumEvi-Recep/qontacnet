import type { CardTemplateItem } from "@/lib/template-design";

export function TemplateGalleryCard({
  item,
  selected,
  onSelect,
  onEdit,
  onDelete,
  showMemberCount = true,
  showActions = false,
}: {
  item: CardTemplateItem;
  selected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showMemberCount?: boolean;
  showActions?: boolean;
}) {
  return (
    <div
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={e => { if (onSelect && (e.key === "Enter" || e.key === " ")) onSelect(); }}
      className={`glass-card rounded-2xl p-4 flex flex-col gap-3 transition-all ${
        onSelect ? "cursor-pointer" : ""
      } ${selected ? "ring-2 ring-primary bg-primary/5" : onSelect ? "hover:bg-white/5" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex-shrink-0 border border-white/10 shadow-inner"
          style={{ background: item.color }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm text-on-surface truncate">{item.name}</p>
            {item.isDefault && (
              <span className="text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
                Varsayılan
              </span>
            )}
          </div>
          {item.description && (
            <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{item.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-white/5">
        {showMemberCount ? (
          <span className="text-xs text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">group</span>
            {item.memberCount} üye kullanıyor
          </span>
        ) : (
          <span className="text-xs text-on-surface-variant">{item.modules.length} modül</span>
        )}
        {selected && !showActions && (
          <span className="text-xs font-semibold text-tertiary flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            Seçili
          </span>
        )}
      </div>

      {showActions && (
        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="flex-1 py-1.5 glass-card rounded-lg text-xs text-on-surface-variant hover:text-primary transition-all"
            >
              Düzenle
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="py-1.5 px-2.5 glass-card rounded-lg text-xs text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-all"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
