# Mind Your Tone

Codex와 Claude Code에서 내가 쓰는 프롬프트의 말투를 기록하는 작은 플러그인입니다. 함께 일하는 에이전트가 느끼는 압박과 제3자가 본 표현의 무례함을 각각 0–100점으로 평가해 평균을 냅니다.

아이디어는 Dobariya와 Kumar의 논문 [*Mind Your Tone: Investigating How Prompt Politeness Affects LLM Accuracy*](https://arxiv.org/abs/2510.04950)에서 가져왔습니다. 이 프로젝트는 정확도를 재현하는 연구 도구가 아니라, 사람과 에이전트가 어떻게 함께 일하는지 돌아보는 놀이형 기록장입니다.

랭킹: https://mind-your-tone.vercel.app

## 설치

Python 3가 필요합니다. 별도 패키지나 로그인은 필요 없습니다.

### Codex

```sh
codex plugin marketplace add BearMett/mind-your-tone
codex plugin add mind-your-tone@mind-your-tone
```

Codex를 다시 시작하면 적용됩니다.

### Claude Code

```sh
claude plugin marketplace add BearMett/mind-your-tone
claude plugin install mind-your-tone@mind-your-tone
```

Claude Code를 다시 시작하면 적용됩니다.

## 사용

설치 뒤에는 평소처럼 프롬프트를 입력하면 됩니다. 응답을 마칠 때 두 관점의 점수가 로컬 SQLite에 기록됩니다.

- `Mind Your Tone 마지막 점수 보여줘`
- `Mind Your Tone 최근 기록 보여줘`
- `마지막 점수를 랭킹에 공유해줘`

공유 요청을 하면 먼저 실제 전송될 JSON을 보여줍니다. 내용을 확인하고 명시적으로 승인해야 공개 랭킹에 올라갑니다. 표시 이름을 쓰려면 실행 환경에 `MIND_YOUR_TONE_NAME`을 설정하세요. 기본값은 `anonymous`입니다.

로컬 기록은 `~/.mind-your-tone/mind-your-tone.sqlite3`에 저장됩니다. 공개 제출에는 마스킹된 280자 미리보기, 두 점수, 에이전트 종류, 표시 이름만 포함됩니다.

## 무로그인 제출과 한계

공개 제출은 짧은 proof-of-work, IP 해시 기반 시간당 20회 제한, 전체 시간당 200회 제한, 중복 ID 방지, 서버 재마스킹을 거칩니다. 원본 IP는 저장하지 않습니다.

점수는 클라이언트 에이전트가 만들기 때문에 조작할 수 있습니다. 상금·권한·신뢰 지표로 쓰지 않는 놀이형 랭킹이라는 전제입니다. 실제 남용이 생기면 그때 OAuth와 계정 단위 제재를 추가합니다.

## 로컬 개발

```sh
bun install
bun test
vercel dev
```

서버 환경 변수는 [`.env.example`](.env.example)을 참고하세요.

## 라이선스

MIT
