/**
 * Release-facing credits. Audio provenance remains documented separately in docs/world/07-audio.md.
 */
export function WorldCredits() {
  return (
    <div className="world-credits" aria-live="polite" aria-label="크레딧 내용" tabIndex={0}>
      <p><strong>잔디동 월드</strong> · FC26 디비전 대시보드 안의 2D 도트 RPG</p>
      <dl>
        <div><dt>기획·구현</dt><dd>뉴팬치</dd></div>
        <div><dt>이미지</dt><dd>월드 전용 변환 에셋 447개</dd></div>
        <div><dt>오디오</dt><dd>BGM 13/14, SFX 53/53, 앰비언스 9/9</dd></div>
        <div><dt>사용 라이브러리</dt><dd>React · Vite · Lucide</dd></div>
      </dl>
    </div>
  );
}
