import { useMemo, useState } from "react";
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
import { useSoopLiveStreamers } from "./useSoopLiveStreamers";

import { TopBar } from "./TopBar";
import { HeroSection } from "./HeroSection";
import { FavoriteCelebration } from "./FavoriteCelebration";
import { SoopLiveSection } from "./SoopLiveSection";
import { JandyVideoSection } from "./JandyVideoSection";
import { ControlsBar } from "./ControlsBar";
import { ViewToolbar } from "./ViewToolbar";
import { DivisionResults } from "./DivisionResults";
import { EvaluationList } from "./EvaluationList";
import { LatestFeedDrawer } from "./LatestFeedDrawer";
import { AnnouncementModal } from "./AnnouncementModal";
import { DetailModal } from "./DetailModal";
import { TrophyModal } from "./TrophyModal";
import { GrowthGraphModal } from "./GrowthGraphModal";
import { EvaluationModal } from "./EvaluationViews";
import { SfxIntroNotice, SfxToggle } from "./SfxControls";
import { MusicPlayer } from "./MusicPlayer";
import { ThemeToggle } from "./ThemeToggle";
import { PromoPostPicker } from "./PromoPostPicker";
import { BrightnessGag } from "./BrightnessGag";
import { SquadBuilderOverlay } from "./squad-builder/SquadBuilderOverlay";
import { KickupsToggle } from "./minigame/KickupsToggle";
import { KickupsModal } from "./minigame/KickupsModal";

export function App() {
  const { snapshot, loading: snapshotLoading, refresh: refreshSnapshot } =
    useDashboardSnapshot();
  const [view, setView] = useState<"division" | "evaluation">("division");
  const [selected, setSelected] = useState<StreamerRecord>();
  const [selectedApplication, setSelectedApplication] =
    useState<OneVsOneApplicationView>();
  const [feedOpen, setFeedOpen] = useState(false);
  const [trophyOpen, setTrophyOpen] = useState(false);
  const [squadBuilderOpen, setSquadBuilderOpen] = useState(false);
  const [growthGraphOpen, setGrowthGraphOpen] = useState(false);
  const [kickupsOpen, setKickupsOpen] = useState(false);

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
    growthGraphDiscovered,
    handleGrowthGraphOpen,
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
  const soopLive = useSoopLiveStreamers(snapshot?.streamers ?? []);
  const liveStreamerIds = useMemo(
    () => new Set(soopLive.entries.map((entry) => entry.streamerId)),
    [soopLive.entries],
  );

  const celebrationSlidesWithIro = useMemo(() => {
    const iroMessage =
      "천년돌 아이로의 하루고멤 합격을 축하합니다🎤 - 플러그 일동 -";
    if (celebrationSlides.length === 0) {
      return [{ key: "iro-celebration", message: iroMessage }];
    }
    const result: typeof celebrationSlides = [];
    let iroCount = 0;
    celebrationSlides.forEach((slide, index) => {
      if (index % 2 === 0) {
        result.push({ key: `iro-celebration-${iroCount++}`, message: iroMessage });
      }
      result.push(slide);
    });
    return result;
  }, [celebrationSlides]);

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
      <FavoriteCelebration slides={celebrationSlidesWithIro} />
      <HeroSection isDivision={isDivision} snapshot={snapshot} />
      <SoopLiveSection soopLive={soopLive} />
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
          growthGraphDiscovered={growthGraphDiscovered}
          cardZoom={cardZoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          sortMode={sortMode}
          onSortModeChange={setSortMode}
          onSquadBuilderOpen={() => setSquadBuilderOpen(true)}
          onGrowthGraphOpen={() => {
            handleGrowthGraphOpen();
            setGrowthGraphOpen(true);
          }}
          onRefresh={refreshSnapshot}
          refreshing={snapshotLoading}
        />
      )}
      {isDivision ? (
        <DivisionResults
          viewMode={viewMode}
          loading={snapshotLoading}
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
          onOpenTrophy={() => setTrophyOpen(true)}
          hideEmptyDivisions={query.trim().length > 0}
          liveStreamerIds={liveStreamerIds}
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
          isLive={liveStreamerIds.has(selected.id)}
          onClose={() => {
            stopSfx();
            setSelected(undefined);
          }}
          onOpenTrophy={() => setTrophyOpen(true)}
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
      {growthGraphOpen && (
        <GrowthGraphModal
          streamers={snapshot?.streamers ?? []}
          onClose={() => setGrowthGraphOpen(false)}
        />
      )}
      {squadBuilderOpen && (
        <SquadBuilderOverlay
          streamers={snapshot?.streamers ?? []}
          onClose={() => setSquadBuilderOpen(false)}
        />
      )}
      {kickupsOpen && (
        <KickupsModal
          onClose={() => setKickupsOpen(false)}
          sfxEnabled={sfxEnabled}
          sfxVolume={sfxVolume}
        />
      )}
      <LatestFeedDrawer
        open={feedOpen}
        onClose={() => setFeedOpen(false)}
        posts={latest}
      />
      <div className="bottom-left-toolbar">
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
        <KickupsToggle onClick={() => setKickupsOpen(true)} />
        <PromoPostPicker
          posts={snapshot?.promoPosts ?? []}
          sfxEnabled={sfxEnabled}
          sfxVolume={sfxVolume}
        />
      </div>
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
