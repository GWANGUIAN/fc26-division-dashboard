import { useEffect, useRef, useState } from "react";
import { BookOpenCheck, Check, ChevronRight, CircleHelp, Music4, Play, RotateCcw, Sparkles, Trophy, Volume2, VolumeX, X } from "lucide-react";
import { Modal, useEscape } from "../../Modal.js";
import { playSfx, stopSfx } from "../../sfxAudio.js";
import {
  loadFootballRulesQuizMusicEnabled,
  loadFootballRulesQuizMusicVolume,
  loadFootballRulesQuizSfxEnabled,
  loadFootballRulesQuizSfxVolume,
  saveFootballRulesQuizMusicEnabled,
  saveFootballRulesQuizMusicVolume,
  saveFootballRulesQuizSfxEnabled,
  saveFootballRulesQuizSfxVolume,
} from "../../storage.js";
import { SoundControl } from "../SoundControl.js";
import { FOOTBALL_RULES_QUIZ_ANSWER_LABELS, FOOTBALL_RULES_QUIZ_QUESTIONS } from "./quizData.js";
import { advanceFootballRulesQuiz, chooseFootballRulesQuizAnswer, createFootballRulesQuizState, gradeFootballRulesQuiz, startFootballRulesQuiz } from "./quizEngine.js";
import "./football-rules-quiz.css";

const SOUND = {
  open: "/sfxes/football-rules-quiz-open.mp3",
  select: "/sfxes/football-rules-quiz-select.mp3",
  correct: "/sfxes/football-rules-quiz-correct.mp3",
  wrong: "/sfxes/football-rules-quiz-wrong.mp3",
  next: "/sfxes/football-rules-quiz-next.mp3",
  result: "/sfxes/football-rules-quiz-result.mp3",
  perfect: "/sfxes/football-rules-quiz-perfect.mp3",
} as const;

export default function FootballRulesQuizModal({ onClose }: { onClose: () => void }) {
  useEscape(onClose);
  const [state, setState] = useState(createFootballRulesQuizState);
  const [failedAssets, setFailedAssets] = useState<Set<string>>(() => new Set());
  const [sfxOn, setSfxOn] = useState(loadFootballRulesQuizSfxEnabled);
  const [sfxVolume, setSfxVolume] = useState(loadFootballRulesQuizSfxVolume);
  const [musicOn, setMusicOn] = useState(loadFootballRulesQuizMusicEnabled);
  const [musicVolume, setMusicVolume] = useState(loadFootballRulesQuizMusicVolume);
  const musicRef = useRef<HTMLAudioElement | null>(null);

  const stopMusic = () => musicRef.current?.pause();
  const startMusic = () => {
    if (!musicOn) return;
    const audio = musicRef.current ?? new Audio("/football-rules-quiz-bgm.mp3");
    audio.loop = true;
    audio.volume = musicVolume / 100;
    musicRef.current = audio;
    void audio.play().catch(() => {});
  };
  const play = (sound: keyof typeof SOUND) => {
    if (sfxOn) playSfx(SOUND[sound], sfxVolume / 100);
  };

  useEffect(() => {
    play("open");
    return () => {
      stopMusic();
      stopSfx();
    };
    // The modal opening effect is attempted once; browsers ignore it safely before a gesture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = () => {
    setState(startFootballRulesQuiz());
    play("open");
    startMusic();
  };
  const choose = (optionIndex: number) => {
    const question = FOOTBALL_RULES_QUIZ_QUESTIONS[state.questionIndex];
    if (!question || state.selectedIndex !== null || state.phase !== "question") return;
    play("select");
    window.setTimeout(() => play(optionIndex === question.answerIndex ? "correct" : "wrong"), 55);
    setState((current) => chooseFootballRulesQuizAnswer(current, optionIndex));
  };
  const advance = () => {
    if (state.phase !== "question" || state.selectedIndex === null) return;
    const last = state.questionIndex === FOOTBALL_RULES_QUIZ_QUESTIONS.length - 1;
    if (last) {
      stopMusic();
      play(state.score === FOOTBALL_RULES_QUIZ_QUESTIONS.length ? "perfect" : "result");
    } else {
      play("next");
    }
    setState((current) => advanceFootballRulesQuiz(current));
  };
  const toggleSfx = () => setSfxOn((current) => {
    const next = !current;
    saveFootballRulesQuizSfxEnabled(next);
    return next;
  });
  const changeSfxVolume = (volume: number) => {
    const next = Math.round(volume);
    setSfxVolume(next);
    saveFootballRulesQuizSfxVolume(next);
  };
  const toggleMusic = () => setMusicOn((current) => {
    const next = !current;
    saveFootballRulesQuizMusicEnabled(next);
    if (!next) stopMusic();
    return next;
  });
  const changeMusicVolume = (volume: number) => {
    const next = Math.round(volume);
    setMusicVolume(next);
    saveFootballRulesQuizMusicVolume(next);
    if (musicRef.current) musicRef.current.volume = next / 100;
  };
  const markAssetFailed = (asset: string) => setFailedAssets((current) => new Set(current).add(asset));

  const question = FOOTBALL_RULES_QUIZ_QUESTIONS[state.questionIndex];
  const selectedCorrect = state.phase === "question" && state.selectedIndex !== null && state.selectedIndex === question?.answerIndex;
  const grade = gradeFootballRulesQuiz(state.score);
  const showQuestionArt = Boolean(question && !failedAssets.has(question.illustration));
  const showGradeArt = !failedAssets.has(grade.illustration);

  return (
    <Modal
      onClose={onClose}
      label="축구 상식 퀴즈"
      wide
      className="football-rules-quiz-modal"
      header={<div><p className="eyebrow">MINIGAME</p><h2 className="football-rules-quiz__title"><img src="/football-rules-quiz-icon.webp" alt="" aria-hidden="true" /> 축구 상식 퀴즈</h2><p className="football-rules-quiz__intro">규정 속 숨은 판정을 맞혀 보세요. 시간 제한 없이, 한 문제씩 차분하게 풀 수 있어요.</p></div>}
    >
      <div className="football-rules-quiz">
        <div className="football-rules-quiz__toolbar">
          <div className="football-rules-quiz__score" aria-label={`현재 점수 ${state.score}점`}><Trophy aria-hidden="true" /> {state.score}점</div>
          <SoundControl enabled={musicOn} volume={musicVolume} onToggle={toggleMusic} onVolumeChange={changeMusicVolume} icon={<Music4 aria-hidden="true" />} label="배경음악" wrapperClassName="football-rules-quiz__sound" />
          <SoundControl enabled={sfxOn} volume={sfxVolume} onToggle={toggleSfx} onVolumeChange={changeSfxVolume} icon={sfxOn ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />} label="효과음" wrapperClassName="football-rules-quiz__sound" />
        </div>

        {state.phase === "intro" && (
          <section className="football-rules-quiz__intro-card">
            <span className="football-rules-quiz__intro-orb"><CircleHelp aria-hidden="true" /></span>
            <p className="football-rules-quiz__kicker">FOOTBALL RULES 11</p>
            <strong>판정의 순간을 읽어 보세요!</strong>
            <span>11문항을 순서대로 풀고, 매 문제 뒤에 규정 해설을 확인합니다.</span>
            <button type="button" className="football-rules-quiz__primary" onClick={start}><Play aria-hidden="true" /> 퀴즈 시작</button>
          </section>
        )}

        {state.phase === "question" && question && (
          <section className={`football-rules-quiz__question ${state.selectedIndex !== null ? "is-answered" : ""}`} aria-labelledby="football-rules-quiz-question">
            <div className="football-rules-quiz__progress" aria-label={`전체 11문항 중 ${state.questionIndex + 1}번 문제`}>
              <span>Q {String(state.questionIndex + 1).padStart(2, "0")} / {FOOTBALL_RULES_QUIZ_QUESTIONS.length}</span>
              <div className="football-rules-quiz__pips" aria-hidden="true">{FOOTBALL_RULES_QUIZ_QUESTIONS.map((_, index) => <i key={index} className={index === state.questionIndex ? "is-current" : index < state.questionIndex ? "is-done" : ""} />)}</div>
            </div>
            <figure className="football-rules-quiz__art">
              {showQuestionArt ? <img src={question.illustration} alt={`${question.mainCharacter}이 등장하는 ${state.questionIndex + 1}번 축구 규정 상황 일러스트`} onError={() => markAssetFailed(question.illustration)} /> : <div className="football-rules-quiz__art-fallback" role="img" aria-label={`${question.mainCharacter}의 축구 규정 상황 일러스트 준비 중`}><BookOpenCheck aria-hidden="true" /><span>{question.mainCharacter}의 판정 상황</span></div>}
            </figure>
            <h3 id="football-rules-quiz-question">{question.question}</h3>
            <div className="football-rules-quiz__choices" role="group" aria-label="답안 선택지">
              {question.options.map((option, index) => {
                const selected = state.selectedIndex === index;
                const correct = index === question.answerIndex;
                const stateClass = state.selectedIndex === null ? "" : correct ? "is-correct" : selected ? "is-wrong" : "is-dim";
                return <button key={option} type="button" disabled={state.selectedIndex !== null} className={`football-rules-quiz__choice ${stateClass}`} onClick={() => choose(index)} aria-pressed={selected}><b>{FOOTBALL_RULES_QUIZ_ANSWER_LABELS[index]}</b><span>{option}</span>{state.selectedIndex !== null && correct && <Check aria-label="정답" />}{state.selectedIndex !== null && selected && !correct && <X aria-label="오답" />}</button>;
              })}
            </div>
            {state.selectedIndex !== null && (
              <div className={`football-rules-quiz__feedback ${selectedCorrect ? "is-correct" : "is-wrong"}`} role="status" aria-live="polite">
                <span className="football-rules-quiz__burst" aria-hidden="true" />
                <strong>{selectedCorrect ? "정답! 판정이 정확해요." : "아쉬워요! 해설을 확인해 볼까요?"}</strong>
                <p><b>해설</b>{question.explanation}</p>
                <button type="button" className="football-rules-quiz__primary" onClick={advance}>{state.questionIndex === FOOTBALL_RULES_QUIZ_QUESTIONS.length - 1 ? "결과 보기" : "다음 문제"}<ChevronRight aria-hidden="true" /></button>
              </div>
            )}
          </section>
        )}

        {state.phase === "result" && (
          <section className="football-rules-quiz__result" aria-live="polite">
            <p className="football-rules-quiz__kicker">QUIZ COMPLETE</p>
            <div className="football-rules-quiz__grade-art">
              {showGradeArt ? <img src={grade.illustration} alt={`${grade.title} 결과 일러스트`} onError={() => markAssetFailed(grade.illustration)} /> : <div className="football-rules-quiz__grade-fallback"><Sparkles aria-hidden="true" /><Trophy aria-hidden="true" /></div>}
            </div>
            <strong>{grade.title}</strong>
            <span className="football-rules-quiz__final-score">{state.score} <small>/ {FOOTBALL_RULES_QUIZ_QUESTIONS.length}</small></span>
            <p>{grade.subtitle}</p>
            <button type="button" className="football-rules-quiz__primary" onClick={start}><RotateCcw aria-hidden="true" /> 다시 도전</button>
          </section>
        )}
      </div>
    </Modal>
  );
}
