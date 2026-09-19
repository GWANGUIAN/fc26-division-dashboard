import type { CastId } from "../types";

// Card copy for the character select (docs/world/02 §3: position, epithet, house). Public info that already
// lives in the repo's member data; not dialogue, but still worth a glance during the 검수 pass.

export interface CastProfile {
  position: string;
  /** Short epithet shown under the name. */
  epithet: string;
  /** Where their house is. */
  home: string;
}

export const CAST_PROFILES: Partial<Record<CastId, CastProfile>> = {
  janine95kim: { position: "GK", epithet: "서리의 골키퍼", home: "동쪽 얼음 링크 하우스" },
  bboringirl: { position: "CM", epithet: "강철 심장 미드필더", home: "남서쪽 회로 작업실" },
  sjh4018: { position: "CB", epithet: "공중 요새의 수문장", home: "북서쪽 구름 요새" },
  doormomo: { position: "CDM", epithet: "천리안의 지휘관", home: "북동쪽 룬 탑" },
  hachi97: { position: "WF", epithet: "황금 드래곤의 강림", home: "서쪽 용의 언덕" },
  kaksjak0730: { position: "CM", epithet: "밤하늘의 프리키커", home: "동쪽 천문대" },
  ju010228: { position: "ST", epithet: "봄의 골잡이", home: "서쪽 봄 정원" },
  haepalin: { position: "CB", epithet: "고요한 물결의 파수꾼", home: "동쪽 호수 위 집" },
  tleod1818: { position: "FB", epithet: "번개의 질주자", home: "남서쪽 번개 배달소" },
  tdnlamuron: { position: "WF", epithet: "타오르는 돌격병", home: "남서쪽 용암 훈련장" },
  lina0108: { position: "FB", epithet: "엇갈린 시선의 갈림길 요정", home: "서쪽 벚꽃 정원" },
};
