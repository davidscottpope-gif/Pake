<div align="center">
  <img src="https://raw.githubusercontent.com/tw93/Pake/main/assets/logo.png" width="138" />
  <h1>Pake</h1>
  <p><b>명령어 하나로 모든 웹페이지를 데스크톱 앱으로 변환. macOS 전용 (Mac 전용 포크).</b></p>
  <p><a href="README.md">English</a> · <a href="README_CN.md">中文</a> · <a href="README_TW.md">繁體</a> · <a href="README_JA.md">日本語</a> · 한국어 · <a href="README_DE.md">Deutsch</a> · <a href="README_FR.md">Français</a></p>
  <a href="https://twitter.com/HiTw93" target="_blank"><img alt="twitter" src="https://img.shields.io/badge/follow-Tw93-red?style=flat-square&logo=Twitter"></a>
  <a href="https://t.me/+9f9gf4ZrFSQ2OWVl" target="_blank"><img alt="telegram" src="https://img.shields.io/badge/chat-telegram-blueviolet?style=flat-square&logo=Telegram"></a>
  <a href="https://github.com/tw93/Pake/releases" target="_blank"><img alt="GitHub downloads" src="https://img.shields.io/github/downloads/tw93/Pake/total.svg?style=flat-square"></a>
  <a href="https://github.com/tw93/Pake/commits" target="_blank"><img alt="GitHub commit" src="https://img.shields.io/github/commit-activity/m/tw93/Pake?style=flat-square"></a>
  <a href="https://github.com/tw93/Pake/issues?q=is%3Aissue+is%3Aclosed" target="_blank"><img alt="GitHub closed issues" src="https://img.shields.io/github/issues-closed/tw93/Pake.svg?style=flat-square"></a>
</div>

## 특징

- 🎐 **가벼운 용량**: Electron 패키지 대비 약 20배 작으며, 일반적으로 10 MB 미만
- 🚀 **빠른 성능**: Rust Tauri 기반으로 기존 JS 프레임워크보다 가볍고 적은 메모리 사용
- ⚡ **쉬운 사용**: CLI 명령어 한 줄 또는 온라인 빌드로 복잡한 설정 없이 패키징
- 📦 **풍부한 기능**: 단축키 전달, 몰입형 창, 드래그 앤 드롭, 커스텀 스타일, 광고 차단 지원

## 시작하기

- **일반 사용자**: 빌드된 [추천 패키지](#추천-패키지-다운로드)를 사용하거나, 환경 설정이 필요 없는 [GitHub Actions 온라인 빌드](docs/github-actions-usage.md) 활용
- **개발자**: [CLI 도구](docs/cli-usage.md) 설치 후 명령어 한 줄로 아이콘과 창 설정이 포함된 앱 패키징
- **고급 사용자**: 로컬에서 저장소를 클론하여 [커스텀 개발](#개발)을 진행하거나, [고급 사용 가이드](docs/advanced-usage.md)에서 스타일 커스텀 및 기능 확장 확인
- **문제 해결**: [FAQ](docs/faq.md)에서 자주 묻는 질문 및 문제 해결 방법 확인

## 추천 패키지 다운로드

> [tw93/Pake](https://github.com/tw93/Pake)의 개인용 Mac 전용 포크입니다. macOS 앱만 지원하며 Linux와 Windows 빌드는 제거했습니다. 아래 다운로드 링크는 업스트림이 미리 빌드한 macOS `.dmg` 예시이며 이 포크의 릴리스가 아닙니다.

<table>
    <tr>
        <td>WeRead
            <a href="https://github.com/tw93/Pake/releases/latest/download/WeRead.dmg">Mac</a>
        </td>
        <td>Twitter
            <a href="https://github.com/tw93/Pake/releases/latest/download/Twitter.dmg">Mac</a>
        </td>
    </tr>
    <tr>
        <td><img src=https://raw.githubusercontent.com/tw93/static/main/pake/WeRead.jpg width=600/></td>
        <td><img src=https://raw.githubusercontent.com/tw93/static/main/pake/Twitter.jpg width=600/></td>
    </tr>
    <tr>
        <td>Grok
            <a href="https://github.com/tw93/Pake/releases/latest/download/Grok.dmg">Mac</a>
        </td>
        <td>DeepSeek
            <a href="https://github.com/tw93/Pake/releases/latest/download/DeepSeek.dmg">Mac</a>
        </td>
    </tr>
    <tr>
        <td><img src=https://raw.githubusercontent.com/tw93/static/main/pake/Grok.png width=600/></td>
        <td><img src=https://raw.githubusercontent.com/tw93/static/main/pake/DeepSeek.png width=600/></td>
    </tr>
    <tr>
        <td>ChatGPT
            <a href="https://github.com/tw93/Pake/releases/latest/download/ChatGPT.dmg">Mac</a>
        </td>
        <td>Gemini
            <a href="https://github.com/tw93/Pake/releases/latest/download/Gemini.dmg">Mac</a>
        </td>
    </tr>
    <tr>
        <td><img src=https://raw.githubusercontent.com/tw93/static/main/pake/ChatGPT.png width=600/></td>
        <td><img src=https://raw.githubusercontent.com/tw93/static/main/pake/Gemini.png width=600/></td>
    </tr>
    <tr>
      <td>YouTube Music
            <a href="https://github.com/tw93/Pake/releases/latest/download/YouTubeMusic.dmg">Mac</a>
      </td>
      <td>YouTube
            <a href="https://github.com/tw93/Pake/releases/latest/download/YouTube.dmg">Mac</a>
      </td>
    </tr>
    <tr>
        <td><img src=https://raw.githubusercontent.com/tw93/static/main/pake/YouTubeMusic.png width=600 /></td>
        <td><img src=https://raw.githubusercontent.com/tw93/static/main/pake/YouTube.jpg width=600 /></td>
    </tr>
    <tr>
        <td>LiZhi
            <a href="https://github.com/tw93/Pake/releases/latest/download/LiZhi.dmg">Mac</a>
        </td>
        <td>ProgramMusic
            <a href="https://github.com/tw93/Pake/releases/latest/download/ProgramMusic.dmg">Mac</a>
        </td>
    </tr>
    <tr>
        <td><img src=https://raw.githubusercontent.com/tw93/static/main/pake/LiZhi.jpg width=600/></td>
        <td><img src=https://raw.githubusercontent.com/tw93/static/main/pake/ProgramMusic.jpg width=600/></td>
    </tr>
    <tr>
        <td>Excalidraw
            <a href="https://github.com/tw93/Pake/releases/latest/download/Excalidraw.dmg">Mac</a>
        </td>
        <td>XiaoHongShu
            <a href="https://github.com/tw93/Pake/releases/latest/download/XiaoHongShu.dmg">Mac</a>
        </td>
    </tr>
    <tr>
        <td><img src=https://raw.githubusercontent.com/tw93/static/main/pake/Excalidraw.png width=600/></td>
        <td><img src=https://raw.githubusercontent.com/tw93/static/main/pake/XiaoHongShu.png width=600/></td>
    </tr>
    <tr>
        <td>Notion
            <a href="https://github.com/tw93/Pake/releases/latest/download/Notion.dmg">Mac</a>
        </td>
        <td>Flomo
            <a href="https://github.com/tw93/Pake/releases/latest/download/Flomo.dmg">Mac</a>
        </td>
    </tr>
    <tr>
        <td><img src=https://raw.githubusercontent.com/tw93/static/main/pake/Notion.png width=600/></td>
        <td><img src=https://raw.githubusercontent.com/tw93/static/main/pake/Flomo.png width=600/></td>
    </tr>
</table>

<details>

<summary>🏂 더 많은 애플리케이션은 <a href="https://github.com/tw93/Pake/releases">Releases</a>에서 다운로드할 수 있습니다. <b>클릭하여 단축키 안내 펼치기</b></summary>

<br/>

| Mac                                                       | 기능                          |
| --------------------------------------------------------- | ----------------------------- |
| <kbd>⌘</kbd> + <kbd>[</kbd>                               | 이전 페이지로 이동            |
| <kbd>⌘</kbd> + <kbd>]</kbd>                               | 다음 페이지로 이동            |
| <kbd>⌘</kbd> + <kbd>↑</kbd>                               | 페이지 맨 위로 스크롤         |
| <kbd>⌘</kbd> + <kbd>↓</kbd>                               | 페이지 맨 아래로 스크롤       |
| <kbd>⌘</kbd> + <kbd>R</kbd>                               | 페이지 새로고침               |
| <kbd>⌘</kbd> + <kbd>W</kbd>                               | 창 숨기기(종료 아님)          |
| <kbd>⌘</kbd> + <kbd>-</kbd>                               | 페이지 축소                   |
| <kbd>⌘</kbd> + <kbd>=</kbd>                               | 페이지 확대                   |
| <kbd>⌘</kbd> + <kbd>0</kbd>                               | 확대/축소 초기화              |
| <kbd>⌘</kbd> + <kbd>L</kbd>                               | 현재 URL 복사                 |
| <kbd>⌘</kbd> + <kbd>⇧</kbd> + <kbd>⌥</kbd> + <kbd>V</kbd> | 서식 맞춰 붙여넣기            |
| <kbd>⌘</kbd> + <kbd>⇧</kbd> + <kbd>H</kbd>                | 홈으로 이동                   |
| <kbd>⌘</kbd> + <kbd>⌥</kbd> + <kbd>I</kbd>                | 개발자 도구 열기(디버그 전용) |
| <kbd>⌘</kbd> + <kbd>⇧</kbd> + <kbd>⌫</kbd>                | 캐시 삭제 및 재시작           |
| <kbd>⌃</kbd> + <kbd>⌘</kbd> + <kbd>F</kbd>                | 전체화면 전환                 |

타이틀 바를 더블 클릭하여 전체화면을 전환할 수도 있습니다. Mac에서는 제스처로 뒤로 가기/앞으로 가기와 타이틀 바 드래그로 창 이동을 지원하며 메뉴 표시줄에서 탐색, 확대/축소 및 창 제어 옵션도 제공합니다.

</details>

## CLI로 한 줄 패키징

![Pake](https://raw.githubusercontent.com/tw93/static/main/pake/pake1.gif)

```bash
# Pake CLI 설치
git clone --single-branch --branch feature/macos-only-ts-js-cleanup https://github.com/davidscottpope-gif/Pake.git Pake-mac
cd Pake-mac
pnpm install --frozen-lockfile
pnpm run cli:build
npm link

# 기본 사용법, 파비콘 자동 다운로드
pake https://github.com --name GitHub

# 고급 사용법, 사용자 지정 옵션
pake https://weekly.tw93.fun --name Weekly --icon https://cdn.tw93.fun/pake/weekly.icns --width 1200 --height 800 --hide-title-bar
```

첫 패키징은 빌드 환경 준비로 인해 시간이 조금 더 걸릴 수 있으나 이후에는 빠르게 완료됩니다. 전체 옵션 설명은 [CLI 사용 가이드](docs/cli-usage.md)를 참조하세요. 명령줄 도구를 사용하지 않으려면 [GitHub Actions 온라인 빌드](docs/github-actions-usage.md)를 활용할 수 있습니다.

스크립트나 AI agent에서 Pake를 사용할 때는 `--json`으로 기계가 읽을 수 있는 결과를 받고, `--config app.json`([schema](schema/pake.schema.json))으로 앱을 선언적으로 정의하며, 로컬 빌드 결과물은 `pake ./dist --name MyTool`로 바로 패키징할 수 있습니다. 전체 agent 사양은 [llms.txt](llms.txt)를 참조하세요. 공식 skill은 다음과 같이 설치합니다.

```text
# Claude Code
/plugin marketplace add davidscottpope-gif/Pake
/plugin install pake@pake

# Codex
codex plugin marketplace add davidscottpope-gif/Pake
codex plugin add pake@pake
```

AI agent에게 다음 내용을 전달하여 실행할 수 있습니다:

```text
이 Mac 전용 포크의 소스 브랜치로 웹페이지를 앱으로 만드세요. 링크의 llms.txt를 읽고 pake에 --json을 붙여 stdout을 하나의 JSON 객체로 해석하세요.
https://github.com/davidscottpope-gif/Pake/blob/feature/macos-only-ts-js-cleanup/llms.txt
```

## 개발

Rust `>=1.85` 및 Node `>=22`(LTS 권장, `>=20.9`도 지원)가 필요합니다. 자세한 설치 안내는 [Tauri 공식 문서](https://v2.tauri.app/start/prerequisites/)를 참조하세요. 개발 환경 설정이 번거롭다면 CLI 도구 사용을 권장합니다.

```bash
# 의존성 설치
pnpm i

# 로컬 개발 [우클릭으로 디버그 모드 실행]
pnpm run dev

# 애플리케이션 빌드
pnpm run build
```

스타일 커스텀, 기능 확장, 컨테이너 통신 등 고급 기능은 [고급 사용 가이드](docs/advanced-usage.md)를 확인하세요.

## 기여자

Pake의 성장은 훌륭한 오픈소스 기여자분들과 함께 만들어갑니다 ❤️

<a href="https://github.com/tw93/Pake/graphs/contributors">
  <img src="./CONTRIBUTORS.svg?v=2" alt="Contributors" width="1000" />
</a>

## 후원

- 가장 직접적인 후원 방법은 제가 개발한 Mac 정리 앱 [Mole for Mac](https://mole.fit)을 이용해 주시는 것입니다
- Pake가 유용했다면 GitHub Star를 눌러주시고, [주변 개발자 동료들에게 추천](https://twitter.com/intent/tweet?url=https://github.com/tw93/Pake&text=Pake%20-%20명령어%20하나로%20모든%20웹페이지를%20데스크톱%20앱으로%20변환.%20macOS%20전용)해 주시면 큰 힘이 되며, 문제나 데스크톱 앱으로 만들면 좋은 웹사이트가 있다면 issue나 PR로 알려 주세요
- TangYuan과 Coke라는 두 마리의 고양이를 키우고 있는데, Pake가 유용하셨다면 그 아이들에게 <a href="https://cats.tw93.fun?name=Pake" target="_blank">캔 간식 🥩</a>을 선물해 주셔도 좋습니다

<details>
<summary>따뜻한 응원을 보내주신 분들 🐱</summary>
<br/>
<a href="https://cats.tw93.fun?name=Pake"><img src="https://cdn.jsdelivr.net/gh/tw93/sponsors@main/assets/sponsors.svg" width="1000" loading="lazy" /></a>
</details>

## 오픈소스 라이선스

Pake는 GPL-3.0 라이선스로 배포됩니다. 자세한 내용은 [LICENSE](./LICENSE) 및 [Pake Output Exception](./LICENSE-EXCEPTION)을 확인하세요. Pake로 패키징한 앱의 소유권은 온전히 사용자에게 있으며, 자유롭게 사용 및 배포할 수 있습니다. Pake를 포크하여 독립된 제품을 만들 경우, 오해를 방지하기 위해 다른 이름을 사용하고 출처를 명시해 주시기 바랍니다.
