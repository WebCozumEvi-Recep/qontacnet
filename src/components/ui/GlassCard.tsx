import React, { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  style?: React.CSSProperties;
}

export default function GlassCard({ children, className = "", hover = true, style }: Props) {
  return (
    <div className={`glass ${hover ? "glass-hover" : ""} p-6 ${className}`} style={style}>
      {children}
    </div>
  );
}
