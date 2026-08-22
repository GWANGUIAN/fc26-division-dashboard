import { useState } from "react";
import type { OneVsOneApplicationView, StreamerRecord } from "../shared/model.js";
import { buildDivisionListText } from "./appHelpers";
import { downloadStreamersXlsx } from "./xlsx-export.js";
import { playSfx, stopSfx } from "./sfxAudio";
import { formatDateTime } from "./formatters";
import {
  CARD_ZOOM_MAX,
  CARD_ZOOM_MIN,
  hasHeardSfx,
  markSfxHeard,
  seenKeyFor,
  useSeenUpdates,
} from "./storage";

import { useDashboardSnapshot } from "./useDashboardSnapshot";
import { useToast } from "./useToast";
import { useTheme } from "./useTheme";
import { useSfxSettings } from "./useSfxSettings";
import { usePendingAnnouncements } from "./usePendingAnnouncements";
import { useViewPreferences } from "./useViewPreferences";
import { useControlsStuck } from "./useControlsStuck";
import { useStreamerFilters } from "./useStreamerFilters";
import { useEvaluationApplications } from "./useEvaluationApplications";
import { useLatestActivity } from "./useLatestActivity";

import { TopBar } from "./TopBar";
import { HeroSection } from "./HeroSection";
import { FavoriteCelebration } from "./FavoriteCelebration";
import { JandyVideoSection } from "./JandyVideoSection";
import { ControlsBar } from "./ControlsBar";
import { ViewToolbar } from "./ViewToolbar";
import { DivisionResults } from "./DivisionResults";
import { EvaluationList } from "./EvaluationList";
import { LatestFeedDrawer } from "./LatestFeedDrawer";
import { AnnouncementModal } from "./AnnouncementModal";
import { DetailModal } from "./DetailModal";
import { TrophyModal } from "./TrophyModal";
import { EvaluationModal } from "./EvaluationViews";
import { SfxIntroNotice, SfxToggle } from "./SfxControls";
import { MusicPlayer } from "./MusicPlayer";
import { ThemeToggle } from "./ThemeToggle";
import { BrightnessGag } from "./BrightnessGag";
import { SquadBuilderOverlay } from "./squad-builder/SquadBuilderOverlay";

export function App() {
  const snapshot = useDashboardSnapshot();
  const [view, setView] = useState<"division" | "evaluation">("division");
  const [selected, setSelected] = useState<StreamerRecord>();
  const [selectedApplication, setSelectedApplication] =
    useState<OneVsOneApplicationView>();
  const [feedOpen, setFeedOpen] = useState(false);
  const [trophyOpen, setTrophyOpen] = useState(false);
  const [squadBuilderOpen, setSquadBuilderOpen] = useState(false);

  const { toast, showToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const {
    sfxEnabled,
    sfxVolume,
    sfxIntroVisible,
    toggleSfx,
    changeSfxVolume,
    setSfxIntroVisible,
  } = useSfxSettings();
  const {
    pendingAnnouncements,
    dismiss: dismissAnnouncements,
    acknowledge: acknowledgeAnnouncements,
  } = usePendingAnnouncements();
  const {
    viewMode,
    setViewMode,
    cardViewDiscovered,
    sortMode,
    setSortMode,
    cardZoom,
    handleZoomIn,
    handleZoomOut,
  } = useViewPreferences();
  const { sentinelRef: controlsSentinelRef, stuck: controlsStuck } =
    useControlsStuck();
  const { seenKeys, markSeen } = useSeenUpdates();

  const {
    query,
    setQuery,
    activityOnly,
    setActivityOnly,
    sfxOnly,
    setSfxOnly,
    achievementOnly,
    setAchievementOnly,
    trophyAwards,
    streamers,
    includedStreamers,
    excludedNames,
    divisionStats,
    cardStreamers,
  } = useStreamerFilters(snapshot, sortMode);
  const { evaluationFilter, setEvaluationFilter, applications } =
    useEvaluationApplications(snapshot, query);
  const { latest, celebrationSlides } = useLatestActivity(snapshot, streamers);

  async function handleCopyDivisionList() {
    try {
      await navigator.clipboard.writeText(buildDivisionListText(streamers));
      showToast("디비전 목록이 복사되었습니다");
    } catch {
      showToast("복사에 실패했습니다");
    }
  }
  async function handleDownloadDivisionList() {
    try {
      const today = new Date().toISOString().slice(0, 10);
      await downloadStreamersXlsx(
        streamers,
        `fc26-division-list-${today}.xlsx`,
      );
    } catch {
      showToast("엑셀 다운로드에 실패했습니다");
    }
  }
  function openStreamer(streamer: StreamerRecord) {
    if (streamer.lastPost) markSeen(seenKeyFor(streamer));
    if (sfxEnabled && streamer.sfx) {
      playSfx(streamer.sfx, sfxVolume / 100);
      if (!hasHeardSfx()) setSfxIntroVisible(true);
    }
    setSelected(streamer);
  }

  const isDivision = view === "division";
  return (
    <main>
      <TopBar
        view={view}
        onViewChange={setView}
        latestCount={latest.length}
        onFeedOpen={() => setFeedOpen(true)}
        onTrophyOpen={() => setTrophyOpen(true)}
      />
      <FavoriteCelebration slides={celebrationSlides} />
      <HeroSection isDivision={isDivision} snapshot={snapshot} />
      <JandyVideoSection />
      <ControlsBar
        sentinelRef={controlsSentinelRef}
        stuck={controlsStuck}
        isDivision={isDivision}
        query={query}
        onQueryChange={setQuery}
        sfxOnly={sfxOnly}
        onToggleSfxOnly={() => setSfxOnly((current) => !current)}
        achievementOnly={achievementOnly}
        onToggleAchievementOnly={() =>
          setAchievementOnly((current) => !current)
        }
        activityOnly={activityOnly}
        onToggleActivityOnly={() => setActivityOnly((current) => !current)}
        onCopyList={handleCopyDivisionList}
        onDownloadList={handleDownloadDivisionList}
        evaluationFilter={evaluationFilter}
        onEvaluationFilterChange={setEvaluationFilter}
      />
      {isDivision && (
        <ViewToolbar
          divisionStats={divisionStats}
          streamersForHistogram={includedStreamers}
          excludedNames={excludedNames}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          cardViewDiscovered={cardViewDiscovered}
          cardZoom={cardZoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          sortMode={sortMode}
          onSortModeChange={setSortMode}
          onSquadBuilderOpen={() => setSquadBuilderOpen(true)}
        />
      )}
      {isDivision ? (
        <DivisionResults
          viewMode={viewMode}
          streamers={streamers}
          cardStreamers={cardStreamers}
          trophyAwards={trophyAwards}
          seenKeys={seenKeys}
          onOpenStreamer={openStreamer}
          cardZoom={cardZoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          zoomMin={CARD_ZOOM_MIN}
          zoomMax={CARD_ZOOM_MAX}
          onSquadBuilderOpen={() => setSquadBuilderOpen(true)}
        />
      ) : (
        <EvaluationList
          applications={applications}
          onSelect={setSelectedApplication}
        />
      )}
      <footer>
        왁물원 카페 게시글 기반 · 마지막 동기화{" "}
        {snapshot ? formatDateTime(snapshot.generatedAt) : "확인 중"}
      </footer>
      {selected && (
        <DetailModal
          streamer={selected}
          awards={trophyAwards}
          onClose={() => {
            stopSfx();
            setSelected(undefined);
          }}
          latestPosts={snapshot?.latestPosts}
          sfxVolume={sfxVolume}
        />
      )}
      {selectedApplication && (
        <EvaluationModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(undefined)}
        />
      )}
      {trophyOpen && (
        <TrophyModal
          awards={trophyAwards}
          excludedNames={excludedNames}
          onClose={() => setTrophyOpen(false)}
        />
      )}
      {squadBuilderOpen && (
        <SquadBuilderOverlay
          streamers={snapshot?.streamers ?? []}
          onClose={() => setSquadBuilderOpen(false)}
        />
      )}
      <LatestFeedDrawer
        open={feedOpen}
        onClose={() => setFeedOpen(false)}
        posts={latest}
      />
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      <BrightnessGag />
      <div className="floating-toolbar">
        <SfxToggle
          enabled={sfxEnabled}
          volume={sfxVolume}
          onToggle={toggleSfx}
          onVolumeChange={changeSfxVolume}
          highlight={sfxIntroVisible}
        />
        <MusicPlayer />
      </div>
      {sfxIntroVisible && (
        <SfxIntroNotice
          enabled={sfxEnabled}
          volume={sfxVolume}
          onToggle={toggleSfx}
          onVolumeChange={changeSfxVolume}
          onDismiss={() => setSfxIntroVisible(false)}
          onAcknowledge={markSfxHeard}
        />
      )}
      {pendingAnnouncements.length > 0 && (
        <AnnouncementModal
          announcements={pendingAnnouncements}
          onClose={dismissAnnouncements}
          onAcknowledge={acknowledgeAnnouncements}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </main>
  );
}
