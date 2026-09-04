import type { StreamerRecord } from "../../shared/model.js";
import { PassFifaCard } from "./PassFifaCard";

export function RevealCardFront({
  streamer,
}: {
  streamer: StreamerRecord;
}) {
  return (
    <div className="reveal-card-front">
      <PassFifaCard streamer={streamer} />
    </div>
  );
}
