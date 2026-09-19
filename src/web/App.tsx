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
import { MatchRecordSection } from "./match-record/MatchRecordSection";
import { ControlsBar } from "./ControlsBar";
import { ViewToolbar } from "./ViewToolbar";
import { DivisionResults } from "./DivisionResults";
import { EvaluationList } from "./EvaluationList";
import { LatestFeedDrawer } from "./LatestFeedDrawer";
import { AnnouncementModal } from "./AnnouncementModal";
import { DetailModal } from "./DetailModal";
import { TrophyModal } from "./TrophyModal";
import { GrowthGraphModal } from "./GrowthGraphModal";
import { UniformCustomizerModal } from "./uniform-customizer/UniformCustomizerModal";
import { TestScheduleModal } from "./TestScheduleModal";
import { WakgoodNotebookModal } from "./WakgoodNotebookModal";
import { EvaluationModal } from "./EvaluationViews";
import { SfxIntroNotice, SfxToggle } from "./SfxControls";
import { MusicPlayer } from "./MusicPlayer";
import { ThemeToggle } from "./ThemeToggle";
import { BrightnessGag } from "./BrightnessGag";
import { FakeAdRail } from "./FakeAdRail";
import { SquadBuilderOverlay } from "./squad-builder/SquadBuilderOverlay";
import { PassAnnouncementOverlay } from "./pass-announcement/PassAnnouncementOverlay";
import { PhotoBoothTrigger } from "./photo-booth/PhotoBoothTrigger";
import { PhotoBoothOverlay } from "./photo-booth/PhotoBoothOverlay";
import { GroupPhotoTrigger } from "./group-photo/GroupPhotoTrigger";
import { GroupPhotoOverlay } from "./group-photo/GroupPhotoOverlay";
import { LedSignboard } from "./group-photo/LedSignboard";
import { KickupsToggle } from "./minigame/KickupsToggle";
import { KickupsModal } from "./minigame/KickupsModal";
import { FreekickToggle } from "./minigame/FreekickToggle";
import { CardMatchToggle } from "./minigame/CardMatchToggle";
import { CardMatchModal } from "./minigame/CardMatchModal";
import { SoccerSum10Toggle } from "./minigame/soccer-sum10/SoccerSum10Toggle";
import { SoccerSum10Modal } from "./minigame/soccer-sum10/SoccerSum10Modal";
import { FortuneToggle } from "./fortune/FortuneToggle";
import { FortunePopup } from "./fortune/FortunePopup";
import { TotyCardPopup } from "./toty-card/TotyCardPopup";
import { getTotyCardAssets } from "./toty-card/totyCardAssets";
import { useWoowakgoodBonusUnlock } from "./toty-card/useWoowakgoodBonusUnlock";
import { WoowakgoodBonusButton } from "./toty-card/WoowakgoodBonusButton";
import { WoowakgoodBonusAnnounce } from "./toty-card/WoowakgoodBonusAnnounce";
import { WOOWAKGOOD_BONUS_STREAMER } from "./toty-card/woowakgoodBonusCard";
import { WorldToggle } from "./world/WorldToggle";

// Pulls in the `three` dependency (~600KB+), so it's lazy-loaded and only reaches the browser
// once a user actually opens this modal.
const FreekickModal = lazy(() => import("./minigame/FreekickModal"));

// 잔디동 월드 (2D 도트 RPG). The overlay, engine and every world asset stay out of the main bundle;
// only the floating button (WorldToggle) ships with it.
const WorldOverlay = lazy(() => import("./world/WorldOverlay"));

// "합격 인증샷" 포토부스 배너/트리거를 헤더에 다시 보이게 하려면 true로.
// 아래 잔디동 LED 티커 + 단체샷으로 임시 교체 — 다른 코드는 삭제되지 않았음.
const SHOW_PHOTO_BOOTH_CELEBRATION = false;

export function App() {
  const { snapshot, loading: snapshotLoading } = useDashboardSnapshot();
  const { view, setView } = useView();
  const [selected, setSelected] = useState<StreamerRecord>();
  const [selectedApplication, setSelectedApplication] =
    useState<OneVsOneApplicationView>();
  const [feedOpen, setFeedOpen] = useState(false);
  const [trophyOpen, setTrophyOpen] = useState(false);
  const [uniformCustomizerOpen, setUniformCustomizerOpen] = useState(false);
  const [squadBuilderOpen, setSquadBuilderOpen] = useState(false);
  const [passAnnouncementOpen, setPassAnnouncementOpen] = useState(false);
  const [testScheduleOpen, setTestScheduleOpen] = useState(false);
  const [wakgoodNotebookOpen, setWakgoodNotebookOpen] = useState(false);
  const [photoBoothOpen, setPhotoBoothOpen] = useState(false);
  const [groupPhotoOpen, setGroupPhotoOpen] = useState(false);
  const [growthGraphOpen, setGrowthGraphOpen] = useState(false);
  const [fortuneOpen, setFortuneOpen] = useState(false);
  const [worldOpen, setWorldOpen] = useState(false);
  const [totyCardStreamer, setTotyCardStreamer] =
    useState<Pick<StreamerRecord, "id" | "displayName" | "hopedPosition1" | "currentDivision" | "sfx">>();
  // A single slot (rather than one boolean per minigame) makes it structurally impossible for two
  // minigame modals to be open at once.
  const [activeMinigame, setActiveMinigame] = useState<"kickups" | "freekick" | "cardmatch" | "soccer-sum10" | null>(null);

  const { toast, showToast } = useToast();
  const [woowakgoodAnnounceVisible, setWoowakgoodAnnounceVisible] = useState(false);
  const woowakgoodUnlocked = useWoowakgoodBonusUnlock(snapshot?.streamers, () =>
    setWoowakgoodAnnounceVisible(true),
  );
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
    selectedPositions,
    setSelectedPositions,
    availablePositionCodes,
    isAllPositionsSelected,
    trophyAwards,
    streamers,
    includedStreamers,
    excludedNames,
    divisionStats,
    cardStreamers,
    passedStreamers,
    boardStreamers,
    nonPassedStreamers,
    secondRoundNonPassedStreamers,
  } = useStreamerFilters(snapshot, sortMode);
  const { evaluationFilter, setEvaluationFilter, applications } =
    useEvaluationApplications(snapshot, query);
  const { latest, celebrationSlides, celebrationRound, celebrationEligibleStreamers } =
    useLatestActivity(snapshot, streamers);
  const soopLive = useSoopLiveStreamers(boardStreamers);
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
      <FakeAdRail />
      <WorldToggle onClick={() => setWorldOpen(true)} />
      <TopBar
        onUniformOpen={() => setUniformCustomizerOpen(true)}
        onTrophyOpen={() => setTrophyOpen(true)}
      />
      {woowakgoodUnlocked && (
        <WoowakgoodBonusButton onOpen={() => setTotyCardStreamer(WOOWAKGOOD_BONUS_STREAMER)} />
      )}
      {woowakgoodAnnounceVisible && (
        <WoowakgoodBonusAnnounce onDone={() => setWoowakgoodAnnounceVisible(false)} />
      )}
      <div className="photo-booth-anchor">
        {SHOW_PHOTO_BOOTH_CELEBRATION ? (
          <>
            <PhotoBoothTrigger
              passedStreamers={celebrationEligibleStreamers}
              onOpen={() => setPhotoBoothOpen(true)}
            />
            <FavoriteCelebration slides={celebrationSlides} round={celebrationRound} />
          </>
        ) : (
          <>
            <GroupPhotoTrigger
              passedStreamers={celebrationEligibleStreamers}
              onOpen={() => setGroupPhotoOpen(true)}
            />
            <LedSignboard
              mode="scroll"
              names={[
                ...celebrationEligibleStreamers.map((streamer) =>
                  streamer.displayName === "하치_HACHI" ? "하치쿤" : streamer.displayName,
                ),
                "태긔",
              ]}
              cheerText="잔디동 Let's Go!!"
            />
          </>
        )}
      </div>
      <HeroSection isDivision={isDivision} />
      <SoopLiveSection soopLive={soopLive} />
      <JandyVideoSection />
      <MatchRecordSection streamers={passedStreamers ?? []} />
      <ControlsBar
        sentinelRef={controlsSentinelRef}
        stuck={controlsStuck}
        isDivision={isDivision}
        query={query}
        onQueryChange={setQuery}
        activityOnly={activityOnly}
        onToggleActivityOnly={() => setActivityOnly((current) => !current)}
        selectedPositions={selectedPositions}
        onSelectedPositionsChange={setSelectedPositions}
        availablePositionCodes={availablePositionCodes}
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
          cardZoom={cardZoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          sortMode={sortMode}
          onSortModeChange={setSortMode}
          onSquadBuilderOpen={() => setSquadBuilderOpen(true)}
          onPassAnnouncementOpen={() => setPassAnnouncementOpen(true)}
          onTestScheduleOpen={() => setTestScheduleOpen(true)}
          onWakgoodNotebookOpen={() => setWakgoodNotebookOpen(true)}
          onGrowthGraphOpen={() => setGrowthGraphOpen(true)}
        />
      )}
      {isDivision ? (
        <DivisionResults
          viewMode={viewMode}
          loading={snapshotLoading}
          streamers={streamers}
          cardStreamers={cardStreamers}
          nonPassedStreamers={nonPassedStreamers}
          secondRoundNonPassedStreamers={secondRoundNonPassedStreamers}
          trophyAwards={trophyAwards}
          seenKeys={seenKeys}
          onOpenStreamer={openStreamer}
          onOpenTotyCard={setTotyCardStreamer}
          cardZoom={cardZoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          zoomMin={CARD_ZOOM_MIN}
          zoomMax={CARD_ZOOM_MAX}
          onSquadBuilderOpen={() => setSquadBuilderOpen(true)}
          onOpenTrophy={() => setTrophyOpen(true)}
          hideEmptyDivisions={query.trim().length > 0}
          liveStreamerIds={liveStreamerIds}
          selectedPositions={selectedPositions}
          isAllPositionsSelected={isAllPositionsSelected}
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
          onOpenTotyCard={() => setTotyCardStreamer(selected)}
          latestPosts={snapshot?.latestPosts}
          sfxVolume={sfxVolume}
        />
      )}
      {totyCardStreamer && (
        <TotyCardPopup
          // Forces a clean remount (fresh variant roll, reveal-from-mystery
          // sequence) when the viewer switches player via the popup's own
          // streamer select, rather than live-swapping a pack-opening
          // sequence already mid-flight.
          key={totyCardStreamer.id}
          streamer={totyCardStreamer}
          assets={getTotyCardAssets(totyCardStreamer.id)!}
          allStreamers={snapshot?.streamers ?? []}
          woowakgoodUnlocked={woowakgoodUnlocked}
          sfxEnabled={sfxEnabled}
          sfxVolume={sfxVolume}
          onToggleSfx={toggleSfx}
          onSfxVolumeChange={changeSfxVolume}
          onSelectStreamer={setTotyCardStreamer}
          onClose={() => setTotyCardStreamer(undefined)}
        />
      )}
      {selectedApplication && (
        <EvaluationModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(undefined)}
        />
      )}
      {uniformCustomizerOpen && (
        <UniformCustomizerModal onClose={() => setUniformCustomizerOpen(false)} />
      )}
      {trophyOpen && (
        <TrophyModal
          awards={trophyAwards}
          excludedNames={excludedNames}
          sfxEnabled={sfxEnabled}
          sfxVolume={sfxVolume}
          onClose={() => setTrophyOpen(false)}
        />
      )}
      {growthGraphOpen && (
        <GrowthGraphModal
          streamers={boardStreamers ?? []}
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
      {wakgoodNotebookOpen && (
        <WakgoodNotebookModal
          streamers={passedStreamers ?? []}
          onClose={() => setWakgoodNotebookOpen(false)}
        />
      )}
      {photoBoothOpen && (
        <PhotoBoothOverlay
          passedStreamers={celebrationEligibleStreamers}
          round={celebrationRound}
          sfxEnabled={sfxEnabled}
          sfxVolume={sfxVolume}
          onClose={() => setPhotoBoothOpen(false)}
        />
      )}
      {groupPhotoOpen && (
        <GroupPhotoOverlay
          passedStreamers={celebrationEligibleStreamers}
          sfxEnabled={sfxEnabled}
          sfxVolume={sfxVolume}
          onClose={() => setGroupPhotoOpen(false)}
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
      {activeMinigame === "cardmatch" && (
        <CardMatchModal
          onClose={() => setActiveMinigame(null)}
          streamers={snapshot?.streamers}
          sfxVolume={sfxVolume}
        />
      )}
      {activeMinigame === "soccer-sum10" && (
        <SoccerSum10Modal
          onClose={() => setActiveMinigame(null)}
        />
      )}
      {fortuneOpen && (
        <FortunePopup
          streamers={snapshot?.streamers}
          sfxVolume={sfxVolume}
          onSfxVolumeChange={changeSfxVolume}
          onClose={() => setFortuneOpen(false)}
        />
      )}
      {worldOpen && (
        <Suspense fallback={null}>
          <WorldOverlay
            onClose={() => setWorldOpen(false)}
            dashboard={{
              streamers: snapshot?.streamers,
              woowakgoodUnlocked,
              sfxEnabled,
              sfxVolume,
              onToggleSfx: toggleSfx,
              onSfxVolumeChange: changeSfxVolume,
            }}
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
        <CardMatchToggle onClick={() => setActiveMinigame("cardmatch")} />
        <SoccerSum10Toggle onClick={() => setActiveMinigame("soccer-sum10")} />
        <FortuneToggle onClick={() => setFortuneOpen(true)} />
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
