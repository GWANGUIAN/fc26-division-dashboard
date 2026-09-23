import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { coverLoopBuiltinPerformers } from "./coverLoopLabData";
import { extractSoopTitleNo } from "./coverLoopMedia";
import {
  CUSTOM_COVER_LOOP_MAX_IMAGE_BYTES,
  CUSTOM_COVER_LOOP_MAX_VIDEO_BYTES,
  type CoverLoopTrackFormInput,
  type CustomCoverLoopTrack,
} from "./customCoverLoopTypes";
import { getCoverLoopMedia } from "./customCoverLoopMediaDB";
import {
  LYRIC_FORMAT_EXAMPLE,
  parseCoverLoopLyrics,
  stringifyCoverLoopLyrics,
  type LyricParseError,
} from "./customCoverLoopLyrics";
import { extractYouTubeVideoId, fetchYouTubeOEmbed } from "./youtubeOEmbed";
import "./cover-loop-playlist-manager.css";

const MAX_IMAGE_MB = CUSTOM_COVER_LOOP_MAX_IMAGE_BYTES / (1024 * 1024);
const MAX_VIDEO_MB = CUSTOM_COVER_LOOP_MAX_VIDEO_BYTES / (1024 * 1024);

/**
 * 곡 추가/수정 패널 — 관리 모달 오른쪽에 항상 떠 있는다(별도 모달로 여닫지 않음). 수정 대상을
 * 바꿀 때는 부모가 key를 바꿔 이 컴포넌트를 리마운트시켜 내부 상태를 초기화한다.
 */
export function CoverLoopTrackForm({
  existing,
  onSubmit,
  onCancel,
}: {
  existing?: CustomCoverLoopTrack;
  onSubmit: (input: CoverLoopTrackFormInput) => void | Promise<void>;
  onCancel: () => void;
}) {
  const isEdit = !!existing;

  const [mediaType, setMediaType] = useState<"youtube" | "soop-clip">(
    existing?.media.type ?? "youtube",
  );

  const [performerStreamerId, setPerformerStreamerId] = useState(
    existing?.performer.streamerId ?? coverLoopBuiltinPerformers[0]?.id ?? "",
  );

  const [youtubeUrl, setYoutubeUrl] = useState(
    existing?.media.type === "youtube"
      ? `https://www.youtube.com/watch?v=${existing.media.videoId}`
      : "",
  );
  const [videoId, setVideoId] = useState(
    existing?.media.type === "youtube" ? existing.media.videoId : "",
  );
  const [soopUrl, setSoopUrl] = useState(
    existing?.media.type === "soop-clip"
      ? `https://vod.sooplive.com/player/${existing.media.titleNo}`
      : "",
  );
  const [titleNo, setTitleNo] = useState<number | undefined>(
    existing?.media.type === "soop-clip" ? existing.media.titleNo : undefined,
  );
  const [clipTitle, setClipTitle] = useState(
    existing?.media.type === "soop-clip" ? existing.media.clipTitle ?? "" : "",
  );
  const [title, setTitle] = useState(existing?.title ?? "");
  const [artist, setArtist] = useState(existing?.artist ?? "");
  const [oEmbedState, setOEmbedState] = useState<"idle" | "loading" | "error">("idle");
  const [youtubeUrlError, setYoutubeUrlError] = useState<string | null>(null);
  const [soopUrlError, setSoopUrlError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [artistError, setArtistError] = useState<string | null>(null);

  const [backgroundKind, setBackgroundKind] = useState<"reuse" | "upload">(
    existing?.background.kind ?? "reuse",
  );

  const existingBackground = existing?.background;
  const hasExistingImage = existingBackground?.kind === "upload";
  const hasExistingVideo = existingBackground?.kind === "upload" && !!existingBackground.videoKey;
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoRemoved, setVideoRemoved] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | undefined>(undefined);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | undefined>(undefined);
  const [imageError, setImageError] = useState<string | null>(null);
  const [videoErrorMsg, setVideoErrorMsg] = useState<string | null>(null);
  const localImagePreviewRef = useRef<string | undefined>(undefined);
  const localVideoPreviewRef = useRef<string | undefined>(undefined);

  // 수정 화면 진입 시 기존 업로드 이미지/영상을 IndexedDB에서 불러와 미리보기로 보여준다.
  useEffect(() => {
    if (existingBackground?.kind !== "upload") return;
    let cancelled = false;
    const { imageKey, videoKey } = existingBackground;
    (async () => {
      const imageBlob = await getCoverLoopMedia(imageKey);
      if (!cancelled && imageBlob) {
        const url = URL.createObjectURL(imageBlob);
        localImagePreviewRef.current = url;
        setImagePreviewUrl(url);
      }
      if (videoKey) {
        const videoBlob = await getCoverLoopMedia(videoKey);
        if (!cancelled && videoBlob) {
          const url = URL.createObjectURL(videoBlob);
          localVideoPreviewRef.current = url;
          setVideoPreviewUrl(url);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 기존 배경은 마운트 시 한 번만 불러온다
  }, []);

  useEffect(
    () => () => {
      if (localImagePreviewRef.current) URL.revokeObjectURL(localImagePreviewRef.current);
      if (localVideoPreviewRef.current) URL.revokeObjectURL(localVideoPreviewRef.current);
    },
    [],
  );

  const [lyricsText, setLyricsText] = useState(
    existing?.lyrics ? stringifyCoverLoopLyrics(existing.lyrics.cues) : "",
  );
  const [lyricsErrors, setLyricsErrors] = useState<LyricParseError[]>([]);
  const lyricsDisabled = mediaType === "soop-clip";

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > CUSTOM_COVER_LOOP_MAX_IMAGE_BYTES) {
      setImageError(`이미지 용량은 ${MAX_IMAGE_MB}MB 이하여야 합니다.`);
      event.target.value = "";
      return;
    }
    setImageError(null);
    if (localImagePreviewRef.current) URL.revokeObjectURL(localImagePreviewRef.current);
    const url = URL.createObjectURL(file);
    localImagePreviewRef.current = url;
    setImageFile(file);
    setImagePreviewUrl(url);
  }

  function handleVideoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > CUSTOM_COVER_LOOP_MAX_VIDEO_BYTES) {
      setVideoErrorMsg(`영상 용량은 ${MAX_VIDEO_MB}MB 이하여야 합니다.`);
      event.target.value = "";
      return;
    }
    setVideoErrorMsg(null);
    setVideoRemoved(false);
    if (localVideoPreviewRef.current) URL.revokeObjectURL(localVideoPreviewRef.current);
    const url = URL.createObjectURL(file);
    localVideoPreviewRef.current = url;
    setVideoFile(file);
    setVideoPreviewUrl(url);
  }

  function handleRemoveVideo() {
    if (localVideoPreviewRef.current) {
      URL.revokeObjectURL(localVideoPreviewRef.current);
      localVideoPreviewRef.current = undefined;
    }
    setVideoFile(null);
    setVideoPreviewUrl(undefined);
    setVideoRemoved(true);
  }

  async function handleFetchInfo() {
    const id = extractYouTubeVideoId(youtubeUrl);
    if (!id) {
      setOEmbedState("error");
      return;
    }
    setVideoId(id);
    setOEmbedState("loading");
    const info = await fetchYouTubeOEmbed(id);
    if (!info) {
      setOEmbedState("error");
      return;
    }
    setOEmbedState("idle");
    setTitle(info.title);
    setArtist(info.author);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    let hasError = false;
    let media: CoverLoopTrackFormInput["media"] | undefined;

    if (mediaType === "youtube") {
      const id = videoId || extractYouTubeVideoId(youtubeUrl);
      if (!youtubeUrl.trim()) {
        setYoutubeUrlError("유튜브 URL을 입력해주세요.");
        hasError = true;
      } else if (!id) {
        setYoutubeUrlError("올바른 유튜브 URL이 아닙니다.");
        hasError = true;
      } else {
        setYoutubeUrlError(null);
        media = { type: "youtube", videoId: id };
      }
    } else {
      const parsedTitleNo = titleNo ?? extractSoopTitleNo(soopUrl);
      if (!soopUrl.trim()) {
        setSoopUrlError("SOOP 클립 URL을 입력해주세요.");
        hasError = true;
      } else if (!parsedTitleNo) {
        setSoopUrlError("올바른 SOOP 클립 URL이 아닙니다.");
        hasError = true;
      } else {
        setSoopUrlError(null);
        media = { type: "soop-clip", titleNo: parsedTitleNo, clipTitle: clipTitle.trim() || undefined };
      }
    }

    if (!title.trim()) {
      setTitleError("제목을 입력해주세요.");
      hasError = true;
    } else {
      setTitleError(null);
    }
    if (!artist.trim()) {
      setArtistError("아티스트를 입력해주세요.");
      hasError = true;
    } else {
      setArtistError(null);
    }
    if (backgroundKind === "upload" && !imageFile && !hasExistingImage) {
      setImageError("이미지를 선택해주세요.");
      hasError = true;
    }

    let lyrics: CoverLoopTrackFormInput["lyrics"];
    if (!lyricsDisabled && lyricsText.trim()) {
      const result = parseCoverLoopLyrics(lyricsText);
      if (!result.ok) {
        setLyricsErrors(result.errors);
        hasError = true;
      } else {
        setLyricsErrors([]);
        lyrics = { lyricStartSeconds: result.cues[0]?.startSeconds ?? 0, cues: result.cues };
      }
    } else {
      setLyricsErrors([]);
    }

    if (hasError || !media) return;

    const performerDisplayName =
      coverLoopBuiltinPerformers.find((performer) => performer.id === performerStreamerId)?.displayName ??
      performerStreamerId;

    const background: CoverLoopTrackFormInput["background"] =
      backgroundKind === "reuse"
        ? { kind: "reuse", streamerId: performerStreamerId }
        : {
            kind: "upload",
            imageFile,
            videoFile,
            keepExistingVideo: !videoFile && !videoRemoved && hasExistingVideo,
          };

    void onSubmit({
      performer: { streamerId: performerStreamerId, displayName: performerDisplayName },
      title: title.trim(),
      artist: artist.trim(),
      media,
      background,
      objectPosition: "center",
      lyrics,
    });
  }

  return (
    <div className="cover-loop-track-form-panel">
      <h3>{isEdit ? "곡 수정" : "곡 추가"}</h3>
      <form onSubmit={handleSubmit} className="cover-loop-track-form">
        <div className="cover-loop-track-form__field">
          <span>미디어 종류</span>
          <div className="cover-loop-track-form__toggle" role="radiogroup" aria-label="미디어 종류">
            <button
              type="button"
              className={`cover-loop-track-form__toggle-btn${mediaType === "youtube" ? " cover-loop-track-form__toggle-btn--active" : ""}`}
              aria-pressed={mediaType === "youtube"}
              onClick={() => setMediaType("youtube")}
            >
              유튜브
            </button>
            <button
              type="button"
              className={`cover-loop-track-form__toggle-btn${mediaType === "soop-clip" ? " cover-loop-track-form__toggle-btn--active" : ""}`}
              aria-pressed={mediaType === "soop-clip"}
              onClick={() => setMediaType("soop-clip")}
            >
              SOOP 클립
            </button>
          </div>
        </div>

        <div className="cover-loop-track-form__field">
          <span>누구의 영상인가요?</span>
          <div className="cover-loop-track-form__performer-grid" role="radiogroup" aria-label="누구의 영상인가요?">
            {coverLoopBuiltinPerformers.map((performer) => (
              <button
                key={performer.id}
                type="button"
                className={`cover-loop-track-form__performer-btn${performer.id === performerStreamerId ? " cover-loop-track-form__performer-btn--active" : ""}`}
                aria-pressed={performer.id === performerStreamerId}
                onClick={() => setPerformerStreamerId(performer.id)}
              >
                {performer.displayName}
              </button>
            ))}
          </div>
        </div>

        {mediaType === "youtube" ? (
          <div className="cover-loop-track-form__field">
            <span>
              유튜브 URL <span className="cover-loop-track-form__required">*</span>
            </span>
            <div className="cover-loop-track-form__url-row">
              <input
                value={youtubeUrl}
                onChange={(event) => {
                  setYoutubeUrl(event.target.value);
                  setYoutubeUrlError(null);
                }}
                onBlur={() => {
                  const id = extractYouTubeVideoId(youtubeUrl);
                  if (id) setVideoId(id);
                }}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <button type="button" onClick={handleFetchInfo} disabled={oEmbedState === "loading"}>
                {oEmbedState === "loading" ? "불러오는 중..." : "정보 불러오기"}
              </button>
            </div>
            {oEmbedState === "error" && (
              <p className="cover-loop-track-form__hint">
                정보를 불러오지 못했습니다. 제목/아티스트를 직접 입력해주세요.
              </p>
            )}
            {youtubeUrlError && <p className="cover-loop-track-form__error">{youtubeUrlError}</p>}
          </div>
        ) : (
          <>
            <div className="cover-loop-track-form__field">
              <span>
                SOOP 클립 URL <span className="cover-loop-track-form__required">*</span>
              </span>
              <input
                value={soopUrl}
                onChange={(event) => {
                  setSoopUrl(event.target.value);
                  setSoopUrlError(null);
                }}
                onBlur={() => {
                  const parsed = extractSoopTitleNo(soopUrl);
                  if (parsed) setTitleNo(parsed);
                }}
                placeholder="https://vod.sooplive.com/player/145540969"
              />
              <p className="cover-loop-track-form__hint">
                SOOP은 정보 자동 불러오기를 지원하지 않아 제목/아티스트는 직접 입력해야 합니다.
              </p>
              {soopUrlError && <p className="cover-loop-track-form__error">{soopUrlError}</p>}
            </div>
            <label className="cover-loop-track-form__field">
              <span>클립 제목 (선택)</span>
              <input
                value={clipTitle}
                onChange={(event) => setClipTitle(event.target.value)}
                placeholder="원본 클립 제목"
              />
            </label>
          </>
        )}

        <label className="cover-loop-track-form__field">
          <span>
            제목 <span className="cover-loop-track-form__required">*</span>
          </span>
          <input
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setTitleError(null);
            }}
            placeholder="곡 제목"
            maxLength={80}
          />
          {titleError && <p className="cover-loop-track-form__error">{titleError}</p>}
        </label>
        <label className="cover-loop-track-form__field">
          <span>
            아티스트 <span className="cover-loop-track-form__required">*</span>
          </span>
          <input
            value={artist}
            onChange={(event) => {
              setArtist(event.target.value);
              setArtistError(null);
            }}
            placeholder="원곡 가수"
            maxLength={80}
          />
          {artistError && <p className="cover-loop-track-form__error">{artistError}</p>}
        </label>

        <div className="cover-loop-track-form__field">
          <span>배경</span>
          <div className="cover-loop-track-form__toggle" role="radiogroup" aria-label="배경 선택">
            <button
              type="button"
              className={`cover-loop-track-form__toggle-btn${backgroundKind === "reuse" ? " cover-loop-track-form__toggle-btn--active" : ""}`}
              aria-pressed={backgroundKind === "reuse"}
              onClick={() => setBackgroundKind("reuse")}
            >
              기존 루프 애니메이션 재사용
            </button>
            <button
              type="button"
              className={`cover-loop-track-form__toggle-btn${backgroundKind === "upload" ? " cover-loop-track-form__toggle-btn--active" : ""}`}
              aria-pressed={backgroundKind === "upload"}
              onClick={() => setBackgroundKind("upload")}
            >
              직접 업로드
            </button>
          </div>
          {backgroundKind === "upload" && (
            <div className="cover-loop-track-form__upload-row">
              <label className="cover-loop-track-form__upload-field">
                <span>이미지 (필수, {MAX_IMAGE_MB}MB 이하)</span>
                {imagePreviewUrl && (
                  <img className="cover-loop-track-form__preview" src={imagePreviewUrl} alt="" />
                )}
                <input type="file" accept="image/*" onChange={handleImageChange} />
                {imageError && <p className="cover-loop-track-form__error">{imageError}</p>}
              </label>
              <label className="cover-loop-track-form__upload-field">
                <span>영상 (선택, {MAX_VIDEO_MB}MB 이하)</span>
                {videoPreviewUrl && (
                  <video
                    className="cover-loop-track-form__preview"
                    src={videoPreviewUrl}
                    muted
                    loop
                    playsInline
                  />
                )}
                <input type="file" accept="video/*" onChange={handleVideoChange} />
                {videoPreviewUrl && (
                  <button type="button" onClick={handleRemoveVideo}>
                    영상 제거
                  </button>
                )}
                {videoErrorMsg && <p className="cover-loop-track-form__error">{videoErrorMsg}</p>}
              </label>
            </div>
          )}
        </div>

        {!lyricsDisabled && (
          <div className="cover-loop-track-form__field">
            <span>가사 (선택)</span>
            <p className="cover-loop-track-form__hint">
              형식: [분:초:센티초]가사 — 예)
              <br />
              <code>{LYRIC_FORMAT_EXAMPLE}</code>
            </p>
            <textarea
              value={lyricsText}
              onChange={(event) => {
                setLyricsText(event.target.value);
                setLyricsErrors([]);
              }}
              placeholder={LYRIC_FORMAT_EXAMPLE}
              rows={6}
            />
            {lyricsErrors.length > 0 && (
              <ul className="cover-loop-track-form__error">
                {lyricsErrors.map((error) => (
                  <li key={error.line}>
                    {error.line}번째 줄: {error.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="cover-loop-track-form__actions">
          <button type="button" onClick={onCancel}>
            {isEdit ? "취소" : "초기화"}
          </button>
          <button type="submit">{isEdit ? "저장" : "추가"}</button>
        </div>
      </form>
    </div>
  );
}
