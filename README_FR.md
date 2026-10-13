<div align="center">
  <img src="https://raw.githubusercontent.com/tw93/Pake/main/assets/logo.png" width="138" />
  <h1>Pake</h1>
  <p><b>Transformez n'importe quelle page web en application de bureau en une seule commande. macOS uniquement (fork Mac-only).</b></p>
  <p><a href="README.md">English</a> · <a href="README_CN.md">中文</a> · <a href="README_TW.md">繁體</a> · <a href="README_JA.md">日本語</a> · <a href="README_KR.md">한국어</a> · <a href="README_DE.md">Deutsch</a> · Français</p>
  <a href="https://twitter.com/HiTw93" target="_blank"><img alt="twitter" src="https://img.shields.io/badge/follow-Tw93-red?style=flat-square&logo=Twitter"></a>
  <a href="https://t.me/+9f9gf4ZrFSQ2OWVl" target="_blank"><img alt="telegram" src="https://img.shields.io/badge/chat-telegram-blueviolet?style=flat-square&logo=Telegram"></a>
  <a href="https://github.com/tw93/Pake/releases" target="_blank"><img alt="GitHub downloads" src="https://img.shields.io/github/downloads/tw93/Pake/total.svg?style=flat-square"></a>
  <a href="https://github.com/tw93/Pake/commits" target="_blank"><img alt="GitHub commit" src="https://img.shields.io/github/commit-activity/m/tw93/Pake?style=flat-square"></a>
  <a href="https://github.com/tw93/Pake/issues?q=is%3Aissue+is%3Aclosed" target="_blank"><img alt="GitHub closed issues" src="https://img.shields.io/github/issues-closed/tw93/Pake.svg?style=flat-square"></a>
</div>

## Fonctionnalités

- 🎐 **Léger** : Paquet d'installation près de 20 fois plus petit qu'Electron, généralement moins de 10 Mo sur le disque
- 🚀 **Rapide** : Conçu avec Rust Tauri, bien plus performant que les frameworks JS classiques avec une empreinte mémoire réduite
- ⚡ **Simple** : Une seule commande CLI ou compilation en ligne, sans configuration complexe
- 📦 **Complet** : Prise en charge des raccourcis, fenêtres immersives, glisser-déposer, personnalisation de styles et blocage de publicités

## Démarrage rapide

- **Débutants** : Téléchargez des [Applications populaires](#télécharger-des-applications-populaires) prêtes à l'emploi ou utilisez la [Compilation en ligne](docs/github-actions-usage.md) sans installation locale
- **Développeurs** : Installez l'[Outil CLI](docs/cli-usage.md) pour empaqueter n'importe quel site d'une commande avec icône et fenêtres sur mesure
- **Avancés** : Clonez le dépôt pour le [Développement personnalisé](#développement) ou consultez les [Fonctionnalités avancées](docs/advanced-usage.md)
- **Dépannage** : Consultez la [FAQ](docs/faq.md) pour résoudre les problèmes courants

## Télécharger des applications populaires

> Fork personnel Mac-only de [tw93/Pake](https://github.com/tw93/Pake) : applications macOS uniquement. Les builds Linux et Windows ont été supprimés. Les liens ci-dessous pointent vers les exemples `.dmg` macOS précompilés du projet amont, pas vers des versions de ce fork.

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

<summary>🏂 Vous pouvez télécharger d'autres applications depuis les <a href="https://github.com/tw93/Pake/releases">Releases</a>. <b>Cliquez pour afficher les raccourcis</b></summary>

<br/>

| Mac                                                       | Fonction                          |
| --------------------------------------------------------- | --------------------------------- |
| <kbd>⌘</kbd> + <kbd>[</kbd>                               | Page précédente                   |
| <kbd>⌘</kbd> + <kbd>]</kbd>                               | Page suivante                     |
| <kbd>⌘</kbd> + <kbd>↑</kbd>                               | Défilement tout en haut           |
| <kbd>⌘</kbd> + <kbd>↓</kbd>                               | Défilement tout en bas            |
| <kbd>⌘</kbd> + <kbd>R</kbd>                               | Actualiser la page                |
| <kbd>⌘</kbd> + <kbd>W</kbd>                               | Masquer la fenêtre (sans quitter) |
| <kbd>⌘</kbd> + <kbd>-</kbd>                               | Réduire le zoom                   |
| <kbd>⌘</kbd> + <kbd>=</kbd>                               | Agrandir le zoom                  |
| <kbd>⌘</kbd> + <kbd>0</kbd>                               | Réinitialiser le zoom             |
| <kbd>⌘</kbd> + <kbd>L</kbd>                               | Copier l'URL actuelle             |
| <kbd>⌘</kbd> + <kbd>⇧</kbd> + <kbd>⌥</kbd> + <kbd>V</kbd> | Coller et adapter le style        |
| <kbd>⌘</kbd> + <kbd>⇧</kbd> + <kbd>H</kbd>                | Page d'accueil                    |
| <kbd>⌘</kbd> + <kbd>⌥</kbd> + <kbd>I</kbd>                | Outils de développement (debug)   |
| <kbd>⌘</kbd> + <kbd>⇧</kbd> + <kbd>⌫</kbd>                | Vider le cache et redémarrer      |
| <kbd>⌃</kbd> + <kbd>⌘</kbd> + <kbd>F</kbd>                | Plein écran natif                 |

Un double-clic sur la barre de titre permet également de basculer en plein écran. Sur Mac, un balayage permet d'avancer ou de reculer, la barre de titre se fait glisser pour déplacer la fenêtre, et la barre de menus propose navigation, zoom et contrôle des fenêtres.

</details>

## Empaqueter en une ligne de commande

![Pake](https://raw.githubusercontent.com/tw93/static/main/pake/pake1.gif)

```bash
# Installer Pake CLI
git clone --single-branch --branch feature/macos-only-ts-js-cleanup https://github.com/davidscottpope-gif/Pake.git Pake-mac
cd Pake-mac
pnpm install --frozen-lockfile
pnpm run cli:build
npm link

# Utilisation basique, récupération automatique de l'icône
pake https://github.com --name GitHub

# Utilisation avancée, options personnalisées
pake https://weekly.tw93.fun --name Weekly --icon https://cdn.tw93.fun/pake/weekly.icns --width 1200 --height 800 --hide-title-bar
```

La première compilation nécessite la mise en place de l'environnement et prend un peu plus de temps, les suivantes sont très rapides. Documentation complète des options dans le [Guide CLI](docs/cli-usage.md). Alternative sans terminal : [Compilation en ligne GitHub Actions](docs/github-actions-usage.md).

Utilisation dans un script ou avec un agent IA : ajoutez `--json` pour obtenir un résultat lisible par machine, décrivez les applications de façon déclarative avec `--config app.json` ([schéma](schema/pake.schema.json)), ou empaquetez directement un dossier local via `pake ./dist --name MyTool`. Contrat complet dans [llms.txt](llms.txt). Le skill officiel s'installe ainsi :

```text
# Claude Code
/plugin marketplace add davidscottpope-gif/Pake
/plugin install pake@pake

# Codex
codex plugin marketplace add davidscottpope-gif/Pake
codex plugin add pake@pake
```

Transmettez ce prompt à votre agent IA :

```text
Utilisez la branche source de ce fork Mac-only. Lisez le fichier llms.txt lié, lancez pake avec --json et analysez stdout comme un seul objet JSON.
https://github.com/davidscottpope-gif/Pake/blob/feature/macos-only-ts-js-cleanup/llms.txt
```

## Développement

Nécessite Rust `>=1.85` et Node `>=22` (LTS recommandée ; `>=20.9` fonctionne également). Consultez la [Documentation Tauri](https://v2.tauri.app/start/prerequisites/). Si vous n'êtes pas familier avec l'environnement de développement, préférez l'outil CLI.

```bash
# Installer les dépendances
pnpm i

# Développement local [clic droit pour ouvrir le mode debug]
pnpm run dev

# Compiler l'application
pnpm run build
```

Pour la personnalisation de styles, l'ajout de fonctionnalités et la communication entre la page et le conteneur Pake, consultez les [Fonctionnalités avancées](docs/advanced-usage.md).

## Contributeurs

Pake ne serait pas possible sans ces précieux contributeurs ❤️

<a href="https://github.com/tw93/Pake/graphs/contributors">
  <img src="./CONTRIBUTORS.svg?v=2" alt="Contributors" width="1000" />
</a>

## Soutien

- La façon la plus directe de me soutenir est d'acheter [Mole for Mac](https://mole.fit), mon application de nettoyage pour Mac
- Si Pake vous est utile, n'hésitez pas à lui attribuer une étoile sur GitHub, à le [recommander](https://twitter.com/intent/tweet?url=https://github.com/tw93/Pake&text=Pake%20-%20Transformez%20n'importe%20quelle%20page%20web%20en%20application%20de%20bureau%20en%20une%20seule%20commande.%20macOS%20uniquement) autour de vous ou à ouvrir une issue ou une PR, y compris pour suggérer des sites qui feraient de bonnes applications de bureau
- J'ai deux chattes, TangYuan et Coke, et si Pake vous rend service, vous pouvez leur offrir <a href="https://cats.tw93.fun?name=Pake" target="_blank">une friandise 🥩</a>

<details>
<summary>Ceux qui ont déjà contribué 🐱</summary>
<br/>
<a href="https://cats.tw93.fun?name=Pake"><img src="https://cdn.jsdelivr.net/gh/tw93/sponsors@main/assets/sponsors.svg" width="1000" loading="lazy" /></a>
</details>

## Licence open source

Pake est distribué sous licence GPL-3.0, voir [LICENSE](./LICENSE) et [Pake Output Exception](./LICENSE-EXCEPTION). Les applications créées avec Pake vous appartiennent entièrement et peuvent être utilisées ou distribuées librement. Si vous créez un fork pour un produit dérivé, merci de choisir un nom distinct et de citer Pake comme source.
