import { Moon, Sun } from "lucide-react";

export function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: "dark" | "light";
  onToggle: () => void;
}) {
  const isLight = theme === "light";
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-pressed={isLight}
      aria-label={isLight ? "다크모드로 전환" : "라이트모드로 전환"}
    >
      <span className="theme-toggle__icons">
        <Sun className="theme-toggle__icon theme-toggle__icon--sun" aria-hidden="true" />
        <Moon className="theme-toggle__icon theme-toggle__icon--moon" aria-hidden="true" />
      </span>
    </button>
  );
}
