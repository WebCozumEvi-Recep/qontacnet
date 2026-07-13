import { MODULE_META, type TemplateModuleChip } from "@/lib/template-design";

export function TemplateModuleChips({
  modules,
  max = 4,
  size = "sm",
}: {
  modules: TemplateModuleChip[];
  max?: number;
  size?: "sm" | "xs";
}) {
  const shown = modules.slice(0, max);
  const rest = modules.length - shown.length;
  const text = size === "xs" ? "text-[10px]" : "text-xs";
  const pad = size === "xs" ? "px-1.5 py-0.5" : "px-2 py-1";

  if (modules.length === 0) {
    return (
      <span className={`${text} text-on-surface-variant/50 italic`}>Modül yok</span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map(m => {
        const meta = MODULE_META[m.type];
        return (
          <span
            key={m.id}
            className={`inline-flex items-center gap-1 ${pad} rounded-lg bg-white/5 border border-white/10 ${text} text-on-surface-variant`}
          >
            <span className="material-symbols-outlined text-[13px]">{meta.icon}</span>
            {meta.label}
          </span>
        );
      })}
      {rest > 0 && (
        <span className={`${pad} rounded-lg ${text} text-on-surface-variant/60`}>+{rest}</span>
      )}
    </div>
  );
}
