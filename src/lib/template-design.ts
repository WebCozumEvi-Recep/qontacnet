/** UI-only types & mock data for template picker (backend wiring later). */

export type ModuleType =
  | "ABOUT"
  | "GALLERY"
  | "VIDEO"
  | "FORM"
  | "HTML"
  | "SINGLE_IMAGE"
  | "FAQ"
  | "HERO";

export interface TemplateModuleChip {
  id: string;
  type: ModuleType;
  title: string;
}

export interface CardTemplateItem {
  id: string;
  name: string;
  color: string;
  description: string;
  modules: TemplateModuleChip[];
  memberCount: number;
  isDefault?: boolean;
}

export const MODULE_META: Record<ModuleType, { label: string; icon: string }> = {
  ABOUT: { label: "Hakkımızda", icon: "info" },
  GALLERY: { label: "Galeri", icon: "photo_library" },
  VIDEO: { label: "Video", icon: "smart_display" },
  FORM: { label: "Form", icon: "edit_note" },
  HTML: { label: "HTML", icon: "code" },
  SINGLE_IMAGE: { label: "Görsel", icon: "image" },
  FAQ: { label: "SSS", icon: "quiz" },
  HERO: { label: "Hero", icon: "wallpaper" },
};

/** Maps DB FirmaModulTip → design ModuleType */
export const DB_MODULE_TO_CHIP: Record<string, ModuleType> = {
  HAKKIMIZDA: "ABOUT",
  GALERI: "GALLERY",
  VIDEO: "VIDEO",
  FORM: "FORM",
  HTML: "HTML",
  TEK_GORSEL: "SINGLE_IMAGE",
  SSS: "FAQ",
  HERO: "HERO",
};

export const MOCK_MEMBER_COUNTS: Record<string, number> = {
  // filled at runtime when templates load from API
};

export const MOCK_DESCRIPTIONS: Record<string, string> = {
  default: "Üyeleriniz bu şablonu seçtiğinde kurumsal modüller kartlarında görünür.",
};
