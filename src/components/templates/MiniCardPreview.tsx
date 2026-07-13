import type { TemplateModuleChip } from "@/lib/template-design";
import { TemplateModuleChips } from "@/components/templates/TemplateModuleChips";

export function MiniCardPreview({
  name,
  color,
  modules,
  memberName = "Ad Soyad",
  role = "Unvan",
}: {
  name: string;
  color: string;
  modules: TemplateModuleChip[];
  memberName?: string;
  role?: string;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden border border-white/10"
      style={{ background: "#050816" }}
    >
      <div
        className="p-4 text-center"
        style={{ background: `radial-gradient(ellipse at 50% -20%, ${color}22 0%, transparent 65%)` }}
      >
        <div
          className="w-14 h-14 rounded-full border-2 mx-auto mb-2 flex items-center justify-center"
          style={{ borderColor: `${color}55`, background: `${color}18` }}
        >
          <span className="material-symbols-outlined text-2xl" style={{ color }}>person</span>
        </div>
        <p className="text-sm font-semibold text-white">{memberName}</p>
        <p className="text-xs font-medium mt-0.5" style={{ color }}>{role}</p>
      </div>
      <div className="px-3 pb-3 space-y-2">
        <div className="flex justify-center gap-2">
          {["call", "mail", "chat"].map(icon => (
            <div
              key={icon}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: `${color}25` }}
            >
              <span className="material-symbols-outlined text-sm" style={{ color }}>{icon}</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl p-2.5 bg-white/5 border border-white/8">
          <p className="text-[10px] text-on-surface-variant mb-1.5 truncate">{name}</p>
          <TemplateModuleChips modules={modules} max={3} size="xs" />
        </div>
      </div>
    </div>
  );
}
