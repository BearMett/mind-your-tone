# Mind Your Tone

Codex와 Claude Code에서 프롬프트의 말투를 기록하고, 응답 끝에 톤 온도와 호칭을 보여주는 플러그인입니다.

[랭킹 보기](https://mind-your-tone.vercel.app)

## 설치

Python 3.6 이상이 `python3` 명령으로 실행되어야 합니다. 별도 패키지나 로그인은 필요 없습니다.

### Claude Code

```sh
claude plugin marketplace add BearMett/mind-your-tone
claude plugin install mind-your-tone@mind-your-tone
```

### Codex

```sh
codex plugin marketplace add BearMett/mind-your-tone
codex plugin add mind-your-tone@mind-your-tone
```

Codex를 다시 시작한 뒤 **Hooks need review**에서 훅을 신뢰해야 기록이 시작됩니다.

### 설치 확인

Codex나 Claude Code를 다시 시작하고 아무 프롬프트나 보내세요. 답변 끝에 아래와 같은 문구가 붙으면 정상입니다.

```text
Mind Your Tone · 🔥 78° · 정중한 독설가 · “공유해줘”로 랭킹에 올릴 수 있어요
```

표시되지 않으면 `Mind Your Tone 마지막 점수 보여줘`로 확인하세요. "No matching scored entry"가 나오면 Python 설치와 Codex의 훅 신뢰 여부를 확인해야 합니다.

## 사용

평소처럼 프롬프트를 입력하면 점수가 로컬에 기록됩니다. 다음 요청으로 기록을 확인하거나 관리할 수 있습니다.

- `Mind Your Tone 마지막 점수 보여줘`
- `Mind Your Tone 최근 기록 보여줘`
- `Mind Your Tone 호칭 도감 보여줘`
- `이름 바꿔줘 ○○` — 랭킹 표시 이름 변경
- `공유해줘` — 직전에 표시된 프롬프트와 점수를 공개 랭킹에 등록

공유 전에는 데이터가 외부로 전송되지 않습니다. 로컬 기록은 `~/.mind-your-tone/mind-your-tone.sqlite3`에 저장되며, 공개 시 마스킹된 280자 프롬프트와 점수·톤·호칭·에이전트 종류·표시 이름만 제출됩니다.

## 참고

이 프로젝트는 [*Mind Your Tone: Investigating How Prompt Politeness Affects LLM Accuracy*](https://arxiv.org/abs/2510.04950)에서 아이디어를 얻은 놀이형 기록장입니다. 점수는 클라이언트 에이전트가 생성하므로 신뢰 지표로 사용하지 마세요.

## 로컬 개발

```sh
bun install
bun test
vercel dev
```

로컬 저장소를 마켓플레이스 소스로 추가할 수 있습니다. Codex는 설치본을 캐시에 복사하므로 플러그인 변경 후 `.codex-plugin/plugin.json`의 `version`을 올리고 다시 설치하세요.

```sh
claude plugin marketplace add /path/to/mind-your-tone
codex plugin marketplace add /path/to/mind-your-tone
```

환경 변수는 [`.env.example`](.env.example)을 참고하세요. 로컬 API를 사용하려면 `MIND_YOUR_TONE_API_URL=http://localhost:3000/api/rankings`을 설정합니다.

## 라이선스

MIT
