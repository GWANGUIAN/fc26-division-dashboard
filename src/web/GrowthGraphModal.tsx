import { useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";
import type { StreamerRecord } from "../shared/model.js";
import { buildGrowthSeries } from "../shared/growth-series.js";
import { GrowthGraphChart } from "./GrowthGraphChart";
import { GrowthStreamerPicker } from "./GrowthStreamerPicker";
import { Modal, useEscape } from "./Modal";

export function GrowthGraphModal({
  streamers,
  onClose,
}: {
  streamers: StreamerRecord[];
  onClose: () => void;
}) {
  useEscape(onClose);
  const data = useMemo(() => buildGrowthSeries(streamers), [streamers]);
  const [selectedIds, setSelectedIds] = useState<string[]>(() => data.series.map((series) => series.streamerId));

  return (
    <Modal
      onClose={onClose}
      label="성장 그래프"
      wide
      header={
        <div>
          <p className="eyebrow">GROWTH TRACKER</p>
          <h2 className="growth-graph__title">
            <TrendingUp aria-hidden="true" /> 성장 그래프
          </h2>
          <p className="growth-graph__intro">
            승격 보고를 기준으로 한 유저별 디비전 변화 추이입니다.
          </p>
        </div>
      }
    >
      <div className="growth-graph__toolbar">
        <GrowthStreamerPicker series={data.series} selectedIds={selectedIds} onChange={setSelectedIds} />
      </div>
      <GrowthGraphChart data={data} selectedIds={selectedIds} />
    </Modal>
  );
}
