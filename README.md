# Mind Your Tone

Codex와 Claude Code에서 내가 쓰는 프롬프트의 말투를 기록하는 작은 플러그인입니다. 응답마다 톤 온도(0°에서 100°, 뜨거울수록 폭군)를 보여주고, 공손함·직설·조급함·비꼼·실망·폭발 중 대표 톤에 따라 호칭을 해금합니다.

아이디어는 Dobariya와 Kumar의 논문 [*Mind Your Tone: Investigating How Prompt Politeness Affects LLM Accuracy*](https://arxiv.org/abs/2510.04950)에서 가져왔습니다. 이 프로젝트는 정확도를 재현하는 연구 도구가 아니라, 사람과 에이전트가 어떻게 함께 일하는지 돌아보는 놀이형 기록장입니다.

랭킹: https://mind-your-tone.vercel.app (뜨거운 순과 온화한 순, 둘 다 있습니다)

## 설치

Python 3.6 이상이 `python3` 명령으로 실행되어야 합니다. 별도 패키지나 로그인은 필요 없습니다. macOS와 Linux에는 보통 이미 있습니다. Windows는 Microsoft Store 판 Python이 `python3` 별칭을 제공하며, 그 외 설치본은 별칭을 직접 잡아야 합니다.

### Claude Code

```sh
claude plugin marketplace add BearMett/mind-your-tone
claude plugin install mind-your-tone@mind-your-tone
```

Claude Code를 다시 시작하면 적용됩니다.

### Codex

```sh
codex plugin marketplace add BearMett/mind-your-tone
codex plugin add mind-your-tone@mind-your-tone
```

Codex를 다시 시작하면 첫 화면에 **Hooks need review** 안내가 뜹니다. 플러그인이 넣는 훅을 Codex가 검토하라고 요구하는 절차입니다. `Review hooks`로 내용을 확인하거나 `Trust all and continue`를 고르면 그때부터 기록이 시작됩니다. 신뢰하지 않으면 훅이 실행되지 않아 아무것도 기록되지 않습니다.

### 설치 확인

아무 프롬프트나 하나 보내 보세요. 답변 끝에 아래처럼 붙으면 정상입니다.

```text
🔥 톤 온도 78° · 정중한 독설가 · “공유해줘”로 랭킹에 올릴 수 있어요
```

공유 제안이 없을 때는 `🍃 톤 온도 12° · 매너 있는 동료`처럼 한 줄만 붙습니다. 온도는 20°마다 🍃 산들바람, 🌤 쾌적, 🌡 후끈, 🔥 폭염, 🌋 분화로 바뀝니다.

아무것도 붙지 않으면 `Mind Your Tone 마지막 점수 보여줘`로 물어보세요. "No matching scored entry"가 나오면 훅이 실행되지 않은 것이니 Python 설치와(Codex의 경우) 훅 신뢰 여부를 확인하세요.

## 사용

설치 뒤에는 평소처럼 프롬프트를 입력하면 됩니다. 점수는 로컬에만 기록되며, 공유를 요청하기 전에는 아무것도 밖으로 나가지 않습니다.

아래는 예시 문구이고, 같은 뜻이면 어떤 표현이든 에이전트가 알아듣습니다.

- `Mind Your Tone 마지막 점수 보여줘`
- `Mind Your Tone 최근 기록 보여줘`
- `Mind Your Tone 호칭 도감 보여줘`
- `이름 바꿔줘 ○○` — 랭킹 표시 이름 변경
- `공유해줘` — 직전에 표시된 프롬프트와 점수를 공개 랭킹에 등록

새 호칭이 열리거나, 개인 최고점(60점 이상)이나 최저점(20점 이하)을 갱신하면 같은 줄 끝에 공유를 제안합니다. 해금된 호칭은 `호칭 도감 보여줘`로 볼 수 있습니다. 등록이 끝나면 뜨거운 순과 온화한 순 각각의 순위와 내 항목으로 바로 가는 링크를 돌려줍니다.

랭킹 표시 이름은 처음 필요할 때 "졸린 수달"처럼 형용사와 명사를 조합해 자동으로 정해지고 로컬에 저장됩니다. `이름 바꿔줘`로 바꾸거나, 실행 환경에 `MIND_YOUR_TONE_NAME`을 설정해 고정할 수 있습니다.

`공유해줘`는 직전에 표시된 프롬프트를 공개하는 승인입니다. 민감정보가 마스킹된 경우에만 정확한 공개 내용을 보여주고 한 번 더 확인합니다.

로컬 기록과 해금 도감, 표시 이름은 `~/.mind-your-tone/mind-your-tone.sqlite3`에 저장됩니다. 공개 제출에는 마스킹된 280자 프롬프트, 톤 온도, 대표 톤, 호칭, 에이전트 종류, 표시 이름만 노출됩니다.

## 동작 방식

- 프롬프트 제출 훅이 원문을 로컬 SQLite에 저장하고, 에이전트에게 작업을 마친 뒤 두 관점(함께 일하는 에이전트가 느낀 압박, 제3자가 본 무례함)으로 채점하라는 지시를 붙입니다. 채점 기준을 맞추기 위한 앵커 예시가 지시에 포함됩니다.
- 채점 결과는 플러그인이 띄우는 로컬 MCP 서버의 `score` 툴로 저장됩니다. 셸 명령이 아니라 MCP 툴을 쓰는 이유는 Codex 샌드박스 밖에서 홈 디렉터리에 쓰기 위해서이고, 로컬 전용 툴(`score`, `preview`, `history`, `collection`, `set_name`)은 플러그인 훅이 자동 승인해 매번 권한을 묻지 않습니다. `publish`만 승인이 필요합니다.
- Codex 화면에는 훅이 넣는 지시문이 "hook context"로 그대로 보입니다. 숨기는 기능이 아니라 그렇게 설계된 것입니다.

## 무로그인 제출과 한계

공개 제출은 짧은 proof-of-work, IP 해시 기반 시간당 20회 제한, 전체 시간당 200회 제한, 중복 ID 방지, 서버 재마스킹을 거칩니다. 원본 IP는 저장하지 않습니다.

점수는 클라이언트 에이전트가 만들기 때문에 조작할 수 있습니다. 상금·권한·신뢰 지표로 쓰지 않는 놀이형 랭킹이라는 전제입니다. 실제 남용이 생기면 그때 OAuth와 계정 단위 제재를 추가합니다.

## 로컬 개발

```sh
bun install
bun test
vercel dev
```

플러그인을 로컬 경로에서 설치하려면 마켓플레이스 소스로 저장소 경로를 넘기면 됩니다. Codex는 설치 시점의 스냅샷을 캐시에 복사하므로, 스크립트를 고친 뒤에는 `.codex-plugin/plugin.json`의 `version`을 올리고 `codex plugin add`를 다시 실행하세요.

```sh
claude plugin marketplace add /path/to/mind-your-tone
codex plugin marketplace add /path/to/mind-your-tone
```

서버 환경 변수는 [`.env.example`](.env.example)을 참고하세요. 플러그인이 로컬 API를 가리키게 하려면 `MIND_YOUR_TONE_API_URL=http://localhost:3000/api/rankings`을 설정합니다.

## 라이선스

MIT
