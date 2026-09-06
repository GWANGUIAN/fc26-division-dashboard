import { ChevronDown, ExternalLink } from "lucide-react";

/**
 * Renders VOD replay link(s) for a note entry. A single URL renders as a
 * plain "다시보기" link (unchanged look). Two or more URLs (a player who was
 * evaluated across separate segments) collapse into one "다시보기" trigger
 * that reveals the numbered links in a hover/focus tooltip instead of
 * listing every link inline — inline links for e.g. three or four segments
 * would crowd out the rest of the row (see WakgoodNotebookModal's header).
 *
 * `className` is reused as the base BEM block for every generated class
 * (`${className}-wrap`, `-multi`, `-menu`, `-menu-item`), so each caller only
 * needs to style its own `${className}` (the trigger/link) and can opt into
 * the rest via that same prefix in styles.css.
 */
export function WakgoodVodLinks({
  urls,
  className,
}: {
  urls: string[] | undefined;
  className: string;
}) {
  if (!urls || urls.length === 0) return null;

  return (
    <span className={`${className}-wrap`}>
      {urls.length === 1 ? (
        <a
          className={className}
          href={urls[0]}
          target="_blank"
          rel="noreferrer"
        >
          다시보기 <ExternalLink aria-hidden="true" />
        </a>
      ) : (
        <span className={`${className}-multi`} tabIndex={0}>
          <span className={className}>
            다시보기 <ChevronDown aria-hidden="true" />
          </span>
          <span className={`${className}-menu`} role="menu">
            {urls.map((url, index) => (
              <a
                key={url}
                className={`${className}-menu-item`}
                href={url}
                target="_blank"
                rel="noreferrer"
                role="menuitem"
              >
                다시보기 {index + 1} <ExternalLink aria-hidden="true" />
              </a>
            ))}
          </span>
        </span>
      )}
    </span>
  );
}
