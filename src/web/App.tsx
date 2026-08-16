import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { DashboardSnapshot, OneVsOneApplicationView, SoopProfileTag, StreamerRecord } from "../shared/model.js";
import { defaultSoopProfileUrl, soopChannelUrl } from "../shared/model.js";
import { DEFAULT_ONE_VS_ONE_CONFIG } from "../shared/one-vs-one-results.js";
import { loadSnapshot } from "./api.js";
import soopIcon from "./assets/soop_icon.svg";

const divisions = Array.from({ length: 10 }, (_, index) => index + 1);
const cafeIcon = "N";

const koreaDateKey = (value: Date) => new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
}).format(value);

function formatDateTime(value?: string) {
  if (!value) return "보고 없음";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Seoul" }).format(new Date(value));
}

function formatCafePostDate(value?: string) {
  if (!value) return "보고 없음";
  const date = new Date(value);
  if (koreaDateKey(date) === koreaDateKey(new Date())) {
    return new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" }).format(date);
  }
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Seoul" }).format(date);
}

const tagStyle: Record<SoopProfileTag, string> = { "파트너": "partner", "베스트": "best", "루키존": "rookie", "스포츠": "sports", "서포터즈": "supporters" };

function SoopTags({ tags }: { tags?: SoopProfileTag[] }) {
  if (!tags?.length) return null;
  return <span className="soop-tags" aria-label={`SOOP 등급: ${tags.join(", ")}`}>{tags.map((tag) => <span className={`soop-tag soop-tag--${tagStyle[tag]}`} key={tag}>{tag}</span>)}</span>;
}

function Avatar({ profileImageUrl, soopId, displayName }: Pick<StreamerRecord, "profileImageUrl" | "soopId" | "displayName">) {
  const [failed, setFailed] = useState(false);
  const src = profileImageUrl ?? defaultSoopProfileUrl(soopId);
  return src && !failed
    ? <img className="avatar" src={src} alt="" onError={() => setFailed(true)} />
    : <span className="avatar avatar-fallback" aria-hidden="true">{displayName.slice(0, 1)}</span>;
}

function StreamerCard({ streamer, onOpen }: { streamer: StreamerRecord; onOpen: () => void }) {
  return <button className="streamer-card" onClick={onOpen} aria-label={`${streamer.displayName} 상세 보기`}>
    <Avatar {...streamer} />
    <span className="streamer-card__copy"><strong>{streamer.displayName}</strong><SoopTags tags={streamer.soopTags} /><small>{streamer.lastPost ? formatCafePostDate(streamer.lastPost.publishedAt) : "첫 보고 대기"}</small></span>
    <span className="streamer-card__rank">D{streamer.currentDivision}</span>
    {!streamer.isMapped && <span className="unmapped" title="SOOP 정보 미연결">카페</span>}
  </button>;
}

function DetailModal({ streamer, onClose }: { streamer: StreamerRecord; onClose: () => void }) {
  const post = streamer.lastPost;
  const channel = soopChannelUrl(streamer.soopId);
  useEscape(onClose);
  return <Modal onClose={onClose} label="디비전 상세"><div className="modal__identity"><Avatar {...streamer} /><div><span className="eyebrow">CURRENT DIVISION</span><h2>{streamer.displayName} <b>{streamer.currentDivision}부</b></h2><SoopTags tags={streamer.soopTags} /><p>{streamer.isMapped ? "SOOP 스트리머 정보 연동됨" : "카페 작성자 · SOOP 정보 미연결"}</p></div></div>
    {post ? <><div className="report"><span>{post.category}</span><h3>{post.title}</h3><time>{formatCafePostDate(post.publishedAt)}</time></div>{post.imageUrls.length > 0 && <div className="gallery">{post.imageUrls.map((url) => <img src={url} alt={`${streamer.displayName} 게시글 이미지`} key={url} loading="lazy" />)}</div>}</> : <p className="empty-detail">아직 확인된 디비전 보고 게시글이 없습니다.</p>}
    <div className="actions">{post && <CafeLink href={post.articleUrl} />}{channel && <SoopLink href={channel}>SOOP 방송국 ↗</SoopLink>}</div>
  </Modal>;
}

function CafeLink({ href, label = "네이버 카페 원문" }: { href: string; label?: string }) { return <a className="action cafe" href={href} target="_blank" rel="noreferrer"><i>{cafeIcon}</i> {label}</a>; }
function SoopLink({ href, children }: { href: string; children: ReactNode }) { return <a className="action soop" href={href} target="_blank" rel="noreferrer"><img className="soop-icon" src={soopIcon} alt="" />{children}</a>; }

function Modal({ children, onClose, label }: { children: ReactNode; onClose: () => void; label: string }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="modal" role="dialog" aria-modal="true" aria-label={label} onMouseDown={(event) => event.stopPropagation()}><button className="close" onClick={onClose} aria-label="닫기">×</button>{children}</section></div>;
}

function useEscape(onClose: () => void) { useEffect(() => { const close = (event: KeyboardEvent) => event.key === "Escape" && onClose(); addEventListener("keydown", close); return () => removeEventListener("keydown", close); }, [onClose]); }

function EvaluationCard({ application, onOpen }: { application: OneVsOneApplicationView; onOpen: () => void }) {
  const result = application.result;
  return <article className={`evaluation-card ${result ? "evaluation-card--completed" : ""}`}>
    <button className="evaluation-card__main" onClick={onOpen} aria-label={`${application.displayName} 1대1 평가 상세 보기`}><Avatar {...application} /><span><strong>{application.displayName}</strong><SoopTags tags={application.soopTags} /><small>{application.cafeAuthor} · 신청 {formatCafePostDate(application.publishedAt)}</small></span><b className={`evaluation-status ${result ? "done" : "waiting"}`}>{result ? "대결 완료" : "대결 전"}</b></button>
    {result && <button className="evaluation-result" onClick={onOpen}><span>{result.candidateScore} : {result.woowakgoodScore}</span><strong>{result.verdict}</strong><small>{formatDateTime(result.playedAt)}</small></button>}
    <div className="evaluation-card__actions"><CafeLink href={application.articleUrl} label="신청글" /></div>
  </article>;
}

function EvaluationModal({ application, onClose }: { application: OneVsOneApplicationView; onClose: () => void }) {
  const opponent = DEFAULT_ONE_VS_ONE_CONFIG.opponent;
  const result = application.result;
  useEscape(onClose);
  return <Modal onClose={onClose} label="1대1 평가 상세"><div className="modal__identity"><Avatar {...application} /><div><span className="eyebrow">ONE VS ONE APPLICATION</span><h2>{application.displayName}</h2><SoopTags tags={application.soopTags} /><p>{application.cafeAuthor} · 신청 {formatCafePostDate(application.publishedAt)}</p></div></div>
    <div className="report"><span>{application.category}</span><h3>{application.title}</h3></div>
    {result ? <section className="scoreboard"><p className="eyebrow">MATCH RESULT</p><div className="scoreboard__players"><span>{application.displayName}</span><span>{opponent.displayName}<SoopTags tags={opponent.soopTags} /></span></div><strong>{result.candidateScore}<i>:</i>{result.woowakgoodScore}</strong><time>대결 일시 · {formatDateTime(result.playedAt)}</time><div className="verdict"><b>{result.verdict}</b><p>{result.detail}</p>{result.note && <small>{result.note}</small>}</div></section> : <p className="empty-detail">대결 결과가 아직 등록되지 않았습니다. 결과가 확정되면 이 카드에 공지 기준 판정이 표시됩니다.</p>}
    <div className="actions"><CafeLink href={application.articleUrl} label="신청글" />{application.soopId && <SoopLink href={soopChannelUrl(application.soopId)!}>신청자 SOOP ↗</SoopLink>}<SoopLink href={soopChannelUrl(opponent.soopId)!}>우왁굳 SOOP ↗</SoopLink></div>
  </Modal>;
}

export function App() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>();
  const [view, setView] = useState<"division" | "evaluation">("division");
  const [query, setQuery] = useState("");
  const [evaluationFilter, setEvaluationFilter] = useState<"all" | "pending" | "completed">("all");
  const [selected, setSelected] = useState<StreamerRecord>();
  const [selectedApplication, setSelectedApplication] = useState<OneVsOneApplicationView>();
  const [feedOpen, setFeedOpen] = useState(false);
  useEffect(() => { loadSnapshot().then(setSnapshot).catch(() => undefined); }, []);
  const streamers = useMemo(() => (snapshot?.streamers ?? []).filter((streamer) => searchable(streamer.displayName, streamer.cafeAliases, query)), [snapshot, query]);
  const applications = useMemo(() => (snapshot?.oneVsOneApplications ?? []).filter((application) => searchable(application.displayName, application.cafeAliases, query) && (evaluationFilter === "all" || (evaluationFilter === "completed" ? Boolean(application.result) : !application.result))), [snapshot, query, evaluationFilter]);
  const latest = snapshot?.latestPosts.length ? snapshot.latestPosts : streamers.flatMap((streamer) => streamer.lastPost ? [streamer.lastPost] : []).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const isDivision = view === "division";
  return <main>
    <header className="topbar"><a className="brand" href="#top"><span>JANDY</span><strong>동아리 후보 대시보드</strong></a><nav className="main-nav" aria-label="메인 메뉴"><button className={isDivision ? "active" : ""} onClick={() => setView("division")}>디비전 현황</button><button className={!isDivision ? "active" : ""} onClick={() => setView("evaluation")}>1:1 평가</button></nav><button className="feed-toggle" onClick={() => setFeedOpen(true)}>최신 소식 <em>{latest.length}</em></button></header>
    <section className="hero" id="top"><div><p className="eyebrow">FC26 · {isDivision ? "SEASON DIVISION BOARD" : "ONE VS ONE EVALUATION"}</p><h1>{isDivision ? <>잰디 <mark>동아리 후보</mark><br />대시보드</> : <>1:1 <mark>평가 신청</mark><br />현황</>}</h1><p className="intro">{isDivision ? "카페에 보고된 FC26 디비전 승격 현황을 추적합니다." : "1대1 평가 신청 게시글과 운영자가 등록한 대결 결과를 표시합니다."}</p></div><div className="sync"><span className="sync-dot" /> <b>3 MINUTE REFRESH</b><small><span className="refresh-icon" aria-hidden="true">↻</span> 3분마다 갱신 · {snapshot ? `${formatDateTime(snapshot.generatedAt)} 기준` : "데이터 연결 중"}</small></div></section>
    <section className="controls" aria-label={isDivision ? "스트리머 검색" : "평가 신청 필터"}><label><span className="sr-only">검색</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름 또는 카페 닉네임 검색" /></label>{!isDivision && <div className="segmented">{(["all", "pending", "completed"] as const).map((value) => <button key={value} className={evaluationFilter === value ? "active" : ""} onClick={() => setEvaluationFilter(value)}>{value === "all" ? "전체" : value === "pending" ? "대결 전" : "대결 완료"}</button>)}</div>}</section>
    {isDivision ? <section className="board" aria-label="FC26 디비전 보드">{divisions.map((division) => { const entries = streamers.filter((streamer) => streamer.currentDivision === division); return <section className={`division division-${division}`} key={division}><div className="division__label"><span>{division === 10 ? "SEASON" : "DIVISION"}</span><strong>{division}</strong>{division === 10 && <small>미참여</small>}</div><div className="division__players">{entries.map((streamer) => <StreamerCard key={streamer.id} streamer={streamer} onOpen={() => setSelected(streamer)} />)}{entries.length === 0 && <p className="vacant">{division === 10 ? "시즌 미참여 후보 없음" : "후보 대기 중"}</p>}</div></section>; })}</section> : <section className="evaluation-list" aria-label="1대1 평가 신청 목록">{applications.map((application) => <EvaluationCard key={application.articleId} application={application} onOpen={() => setSelectedApplication(application)} />)}{applications.length === 0 && <p className="empty-list">표시할 1대1 평가 신청자가 없습니다.</p>}</section>}
    <footer>왁물원 카페 게시글 기반 · 마지막 동기화 {snapshot ? formatDateTime(snapshot.generatedAt) : "확인 중"}</footer>
    {selected && <DetailModal streamer={selected} onClose={() => setSelected(undefined)} />}{selectedApplication && <EvaluationModal application={selectedApplication} onClose={() => setSelectedApplication(undefined)} />}
    {feedOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => setFeedOpen(false)}><aside className="feed" role="dialog" aria-modal="true" aria-label="최신 소식" onMouseDown={(event) => event.stopPropagation()}><button className="close" onClick={() => setFeedOpen(false)} aria-label="닫기">×</button><p className="eyebrow">LATEST REPORTS</p><h2>최신 소식</h2>{latest.slice(0, 25).map((post) => <a href={post.articleUrl} target="_blank" rel="noreferrer" key={post.articleId}><span>{post.category}</span><strong>{post.title}</strong><small>{post.cafeAuthor} · {formatCafePostDate(post.publishedAt)}</small></a>)}</aside></div>}
  </main>;
}

function searchable(displayName: string, aliases: string[], query: string) { return [displayName, ...aliases].join(" ").toLocaleLowerCase("ko-KR").includes(query.toLocaleLowerCase("ko-KR")); }
