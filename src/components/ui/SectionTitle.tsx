interface Props {
  badge?: string;
  title: string;
  highlight?: string;
  subtitle?: string;
  center?: boolean;
}

export default function SectionTitle({ badge, title, highlight, subtitle, center = true }: Props) {
  return (
    <div className={`mb-16 ${center ? "text-center" : ""}`}>
      {badge && (
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          {badge}
        </div>
      )}
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-white mb-4">
        {title}{" "}
        {highlight && <span className="gradient-text">{highlight}</span>}
      </h2>
      {subtitle && <p className="text-[#AAB3C5] text-lg max-w-2xl mx-auto leading-relaxed">{subtitle}</p>}
    </div>
  );
}
