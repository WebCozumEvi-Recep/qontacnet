import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "outline";
  className?: string;
  onClick?: () => void;
}

export default function GradientButton({ children, href, variant = "primary", className = "", onClick }: Props) {
  const base = "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 cursor-pointer";

  const styles = {
    primary: "bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:from-cyan-400 hover:to-purple-500 shadow-lg hover:shadow-cyan-500/25 hover:scale-105",
    secondary: "bg-white/10 text-white border border-white/20 hover:bg-white/15 hover:border-white/30 hover:scale-105",
    outline: "border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 hover:scale-105",
  };

  const cls = `${base} ${styles[variant]} ${className}`;

  if (href) return <a href={href} className={cls}>{children}</a>;
  return <button onClick={onClick} className={cls}>{children}</button>;
}
