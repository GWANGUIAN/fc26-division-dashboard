import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type DownloadOption =
  | { key: string; label: string; href: string; download: string }
  | { key: string; label: string; onSelect: () => void };

/**
 * A download trigger that's a plain button/link when there's only one way
 * to get the asset, and a small popover with one row per choice once a
 * player has both a "기본" and a "호버" version (see totyCardAssets.ts's
 * getTotyCardPreviewBaseUrl/getCharacterHoverUrl) — used by both the
 * "이미지로 저장" (PNG) and "움짤로 저장" (GIF) buttons in TotyCardPopup, so
 * the popover behavior lives in one place instead of twice.
 */
export function TotyCardDownloadMenu({
  className,
  icon,
  label,
  disabled,
  options,
}: {
  className: string;
  icon: ReactNode;
  label: string;
  disabled?: boolean;
  options: DownloadOption[];
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    addEventListener("mousedown", closeOnOutsideClick);
    return () => removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);

  if (options.length === 0) return null;

  if (options.length === 1) {
    const only = options[0];
    return "href" in only ? (
      <a className={className} href={only.href} download={only.download}>
        {icon}
        {label}
      </a>
    ) : (
      <button type="button" className={className} onClick={only.onSelect} disabled={disabled}>
        {icon}
        {label}
      </button>
    );
  }

  return (
    <div className="toty-card-popup__download-group" ref={rootRef}>
      <button
        type="button"
        className={className}
        onClick={() => setOpen((current) => !current)}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {icon}
        {label}
      </button>
      {open && (
        <div className="toty-card-popup__download-menu" role="menu">
          {options.map((option) =>
            "href" in option ? (
              <a
                key={option.key}
                className="toty-card-popup__download-menu-item"
                role="menuitem"
                href={option.href}
                download={option.download}
                onClick={() => setOpen(false)}
              >
                {option.label}
              </a>
            ) : (
              <button
                key={option.key}
                type="button"
                className="toty-card-popup__download-menu-item"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  option.onSelect();
                }}
              >
                {option.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
