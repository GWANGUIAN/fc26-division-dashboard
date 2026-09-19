/**
 * Release-facing credits. Audio files deliberately remain attributed as "verification required"
 * until their download URLs and licences are recorded in docs/world/07-audio.md. We do not invent
 * a licence from an MP3 filename or make an unverified asset look cleared for distribution.
 */
export function WorldCredits() {
  return (
    <div className="world-credits" aria-live="polite">
      <p><strong>잔디동 월드</strong> · FC26 디비전 대시보드 안의 2D 도트 RPG</p>
      <dl>
        <div><dt>기획·구현</dt><dd>잔디동 월드 팀</dd></div>
        <div><dt>이미지</dt><dd>월드 전용 변환 에셋 447개 · 상세 목록은 에셋 체크리스트</dd></div>
        <div><dt>오디오</dt><dd>BGM 13/14, SFX 53/53, 앰비언스 9/9</dd></div>
        <div><dt>사용 라이브러리</dt><dd>React · Vite · Lucide</dd></div>
      </dl>
      <p className="world-credits__notice"><strong>배포 전 확인 필요:</strong> 다운로드 원본의 제작자·URL·라이선스가 저장소에 남아 있지 않습니다. 오디오 출처를 <code>docs/world/07-audio.md</code>에 기록하기 전에는 외부 공개용 오디오 크레딧을 확정할 수 없습니다.</p>
    </div>
  );
}
