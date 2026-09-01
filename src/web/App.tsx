import { lazy, Suspense, useMemo, useState } from "react";
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
import { useView } from "./useView";

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
import { TestScheduleModal } from "./TestScheduleModal";
import { EvaluationModal } from "./EvaluationViews";
import { SfxIntroNotice, SfxToggle } from "./SfxControls";
import { MusicPlayer } from "./MusicPlayer";
import { ThemeToggle } from "./ThemeToggle";
import { BrightnessGag } from "./BrightnessGag";
import { SquadBuilderOverlay } from "./squad-builder/SquadBuilderOverlay";
import { PassAnnouncementOverlay } from "./pass-announcement/PassAnnouncementOverlay";
import { PhotoBoothTrigger } from "./photo-booth/PhotoBoothTrigger";
import { PhotoBoothOverlay } from "./photo-booth/PhotoBoothOverlay";
import { KickupsToggle } from "./minigame/KickupsToggle";
import { KickupsModal } from "./minigame/KickupsModal";
import { FreekickToggle } from "./minigame/FreekickToggle";

// Pulls in the `three` dependency (~600KB+), so it's lazy-loaded and only reaches the browser
// once a user actually opens this modal.
const FreekickModal = lazy(() => import("./minigame/FreekickModal"));

export function App() {
  const { snapshot, loading: snapshotLoading, refresh: refreshSnapshot } =
    useDashboardSnapshot();
  const { view, setView } = useView();
  const [selected, setSelected] = useState<StreamerRecord>();
  const [selectedApplication, setSelectedApplication] =
    useState<OneVsOneApplicationView>();
  const [feedOpen, setFeedOpen] = useState(false);
  const [trophyOpen, setTrophyOpen] = useState(false);
  const [squadBuilderOpen, setSquadBuilderOpen] = useState(false);
  const [passAnnouncementOpen, setPassAnnouncementOpen] = useState(false);
  const [testScheduleOpen, setTestScheduleOpen] = useState(false);
  const [photoBoothOpen, setPhotoBoothOpen] = useState(false);
  const [growthGraphOpen, setGrowthGraphOpen] = useState(false);
  // A single slot (rather than one boolean per minigame) makes it structurally impossible for two
  // minigame modals to be open at once.
  const [activeMinigame, setActiveMinigame] = useState<"kickups" | "freekick" | null>(null);

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
    achievementOnly,
    setAchievementOnly,
    positionGroupFilter,
    setPositionGroupFilter,
    trophyAwards,
    streamers,
    includedStreamers,
    excludedNames,
    divisionStats,
    cardStreamers,
    passedStreamers,
    nonPassedStreamers,
  } = useStreamerFilters(snapshot, sortMode);
  const { evaluationFilter, setEvaluationFilter, applications } =
    useEvaluationApplications(snapshot, query);
  const { latest, celebrationSlides } = useLatestActivity(snapshot, streamers);
  const soopLive = useSoopLiveStreamers(passedStreamers);
  const liveStreamerIds = useMemo(
    () => new Set(soopLive.entries.map((entry) => entry.streamerId)),
    [soopLive.entries],
  );


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
      <div className="photo-booth-anchor">
        <PhotoBoothTrigger
          passedStreamers={passedStreamers}
          onOpen={() => setPhotoBoothOpen(true)}
        />
        <FavoriteCelebration slides={celebrationSlides} />
      </div>
      <HeroSection isDivision={isDivision} snapshot={snapshot} />
      <SoopLiveSection soopLive={soopLive} />
      <JandyVideoSection />
      <ControlsBar
        sentinelRef={controlsSentinelRef}
        stuck={controlsStuck}
        isDivision={isDivision}
        query={query}
        onQueryChange={setQuery}
        achievementOnly={achievementOnly}
        onToggleAchievementOnly={() =>
          setAchievementOnly((current) => !current)
        }
        activityOnly={activityOnly}
        onToggleActivityOnly={() => setActivityOnly((current) => !current)}
        positionGroupFilter={positionGroupFilter}
        onPositionGroupFilterChange={setPositionGroupFilter}
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
          onPassAnnouncementOpen={() => setPassAnnouncementOpen(true)}
          onTestScheduleOpen={() => setTestScheduleOpen(true)}
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
          nonPassedStreamers={nonPassedStreamers}
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
          streamers={passedStreamers ?? []}
          onClose={() => setGrowthGraphOpen(false)}
        />
      )}
      {squadBuilderOpen && (
        <SquadBuilderOverlay
          streamers={passedStreamers}
          onClose={() => setSquadBuilderOpen(false)}
        />
      )}
      {passAnnouncementOpen && (
        <PassAnnouncementOverlay
          streamers={passedStreamers}
          sfxEnabled={sfxEnabled}
          sfxVolume={sfxVolume}
          onSfxVolumeChange={changeSfxVolume}
          onClose={() => setPassAnnouncementOpen(false)}
        />
      )}
      {testScheduleOpen && (
        <TestScheduleModal
          streamers={passedStreamers ?? []}
          onClose={() => setTestScheduleOpen(false)}
        />
      )}
      {photoBoothOpen && (
        <PhotoBoothOverlay
          passedStreamers={passedStreamers}
          sfxEnabled={sfxEnabled}
          sfxVolume={sfxVolume}
          onClose={() => setPhotoBoothOpen(false)}
        />
      )}
      {activeMinigame === "kickups" && (
        <KickupsModal
          onClose={() => setActiveMinigame(null)}
          sfxVolume={sfxVolume}
          onSfxVolumeChange={changeSfxVolume}
        />
      )}
      {activeMinigame === "freekick" && (
        <Suspense fallback={null}>
          <FreekickModal
            onClose={() => setActiveMinigame(null)}
            sfxVolume={sfxVolume}
            onSfxVolumeChange={changeSfxVolume}
          />
        </Suspense>
      )}
      <LatestFeedDrawer
        open={feedOpen}
        onClose={() => setFeedOpen(false)}
        posts={latest}
      />
      <div className="bottom-left-toolbar">
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
        <KickupsToggle onClick={() => setActiveMinigame("kickups")} />
        <FreekickToggle onClick={() => setActiveMinigame("freekick")} />
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
