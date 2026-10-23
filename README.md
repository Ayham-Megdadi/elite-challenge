<div align="center">

<img src="assets/images/tahadi_ayham.png" alt="تحدّي النخبة" width="200"/>

<br/><br/>

<img src="https://readme-typing-svg.demolab.com?font=Tajawal&size=34&pause=1000&color=D4AF37&center=true&vCenter=true&width=900&lines=%D8%AA%D8%AD%D8%AF%D9%91%D9%8A+%D8%A7%D9%84%D9%86%D8%AE%D8%A8%D8%A9;ELITE+CHALLENGE;18+%D8%B3%D8%A4%D8%A7%D9%84%D9%8B%D8%A7+%C2%B7+4+%D9%85%D8%B1%D8%A7%D8%AD%D9%84+%C2%B7+4%2C000+%D9%86%D9%82%D8%B7%D8%A9;%D9%84%D8%A7%D8%B9%D8%A8+%D9%88%D8%A7%D8%AD%D8%AF+%D8%A3%D9%88+%D9%81%D8%B1%D9%8A%D9%82%D8%A7%D9%86+%C2%B7+%D9%8A%D8%B9%D9%85%D9%84+100%25+%D8%A8%D9%84%D8%A7+%D8%A5%D9%86%D8%AA%D8%B1%D9%86%D8%AA" alt="Typing SVG" />

<br/><br/>

[![Play Now](https://img.shields.io/badge/🕹️%20Play%20Now-Live%20Demo-D4AF37?style=for-the-badge)](https://ayham-megdadi.github.io/elite-challenge/)
[![Admin Panel](https://img.shields.io/badge/⚙️%20Admin%20Panel-Manage%20Questions-4a6fa5?style=for-the-badge)](https://ayham-megdadi.github.io/elite-challenge/admin.html)

<br/>

![HTML](https://img.shields.io/badge/HTML5-Semantic-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-Custom%20Design-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JS](https://img.shields.io/badge/JavaScript-ES%20Modules-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Arabic](https://img.shields.io/badge/Arabic-Full%20RTL-009900?style=for-the-badge)
![Questions](https://img.shields.io/badge/Questions-2000%2B-blueviolet?style=for-the-badge)
![Offline](https://img.shields.io/badge/Works-100%25%20Offline-brightgreen?style=for-the-badge)
![GitHub Pages](https://img.shields.io/badge/Hosted-GitHub%20Pages-181717?style=for-the-badge&logo=github)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

<br/>

> **Developed by [Ayham Megdadi](https://www.instagram.com/ayham_megdadi/)**  
> Arabic cultural trivia game — 18 questions · 4 stages · 4,000 points · Solo or Teams · 2,000+ question bank · Full admin panel

</div>

---

## 📖 Overview

**تحدّي النخبة** *(ELITE CHALLENGE)* is a fully Arabic, RTL-first cultural quiz game that runs entirely in the browser — no server, no internet connection, no installation required.

Inspired by classic TV quiz formats, it challenges players across **4 progressive difficulty stages** using a bank of **2,000+ curated questions** across **17 categories**. The game features a smart anti-repeat engine, a steal mechanic in team mode, two lifelines, and a full-featured admin panel for managing the question bank — all in a polished dark navy + gold design.

**[🕹️ Play Now → ayham-megdadi.github.io/elite-challenge](https://ayham-megdadi.github.io/elite-challenge/)**

---

## ✨ What Makes This Different

Most browser quiz games are either too simple or require a backend. تحدّي النخبة is built differently:

| | What most games do | What تحدّي النخبة does |
|--|--|--|
| **Questions** | Hardcoded, repeats fast | 2,000+ bank · smart weighted anti-repeat |
| **Admin** | Edit JSON manually | Full visual admin panel at `/admin.html` |
| **Architecture** | Logic mixed with UI | Game engine is 100% DOM-free — zero coupling |
| **Teams** | Basic turn swap | Steal mechanic, per-player lifelines, stage scoring |
| **Data** | Lost on refresh | Persistent usage history in `localStorage` |
| **Offline** | Needs server | `file://` compatible — open and play anywhere |

---

## 🎮 Game Features

| Feature | Description |
|---------|-------------|
| 🏆 **4 Progressive Stages** | سهلة → متوسطة → صعبة جدًا → صعبة للغاية |
| 💯 **4,000 Max Score** | 6×100 + 6×200 + 4×300 + 2×500 — tied to difficulty |
| 👤 **Solo Mode** | Single player — full scoring and personal best tracking |
| 👥 **Teams Mode** | Two teams with alternating turns and steal opportunity |
| 🔄 **Steal Mechanic** | On wrong answer → opposing team gets one steal attempt |
| 🃏 **50/50 Lifeline** | Remove 2 wrong options — available from Stage 2 |
| 🔁 **Swap Lifeline** | Replace question with unused one of same difficulty — Stage 3+ |
| ⏱️ **Optional Timer** | Configurable countdown per question (10–180 seconds) |
| 📚 **17 Categories** | Full list below — pick 1 to 6 per round |
| 🧠 **Anti-Repeat Engine** | Questions ranked by usage count + recency — freshest first |
| 📊 **Detailed Results** | Score per stage, best category, accuracy rate, round duration |
| 💾 **Auto-Save** | Settings and usage history persist via `localStorage` |
| 📤 **Export Results** | Download local data as JSON |
| 🌙 **Dark Gold UI** | Navy + gold design — polished, readable, RTL throughout |
| ♿ **Accessible** | Semantic HTML · ARIA labels · focus-visible · reduced-motion |
| 📱 **Responsive** | Desktop, tablet, and mobile |
| 🚫 **Zero Dependencies** | Pure ES Modules — no npm, no bundler, no frameworks |

---

## 🗂️ Stages & Scoring

| Stage | Questions | Difficulty | Points Each | Stage Total |
|-------|-----------|-----------|-------------|-------------|
| المرحلة الأولى | 1–6 | سهلة | 100 | 600 |
| المرحلة الثانية | 7–12 | متوسطة | 200 | 1,200 |
| المرحلة الثالثة | 13–16 | صعبة جدًا | 300 | 1,200 |
| المرحلة النهائية | 17–18 | صعبة للغاية | 500 | 1,000 |
| **Total** | **18** | | | **4,000** |

Points are tied to difficulty in `question-bank.js` — never hardcoded in the UI.

---

## 🃏 Lifelines

| Lifeline | Available | Effect | Per Player |
|----------|-----------|--------|-----------|
| **حذف إجابتين (50/50)** | Stage 2+ | Removes 2 wrong MCQ options randomly | Once |
| **تبديل السؤال (Swap)** | Stage 3+ | Replaces question with unused one (same category + difficulty) | Once |

If no valid swap replacement exists, the lifeline is **not consumed** and the player is notified.

---

## 📚 Question Categories (17)

| # | Category | Arabic |
|---|----------|--------|
| 1 | Geography | جغرافيا |
| 2 | History | تاريخ |
| 3 | Religion | دين |
| 4 | General Culture | ثقافة عامة |
| 5 | Technology | تكنولوجيا |
| 6 | Nature & Animals | طبيعة وحيوانات |
| 7 | Historical Figures | شخصيات تاريخية |
| 8 | Mathematics | رياضيات |
| 9 | Guess the Country | خمّن الدولة |
| 10 | History & Civilizations | تاريخ وحضارات |
| 11 | Prophet's Biography | سيرة الرسول |
| 12 | Foreign Films | أفلام أجنبية |
| 13 | Movie Story | قصة فيلم |
| 14 | Bab Al-Hara | باب الحارة |
| 15 | Zaman Al-Bargouth | زمن البرغوث |
| 16 | Turkish Arts | فن تركي |
| 17 | Riddles | ألغاز |

Each round: pick 1–6 categories. Questions are **distributed evenly** across selected categories, per difficulty level.

---

## ⚙️ Admin Panel

A full visual question bank manager lives at **[`/admin.html`](https://ayham-megdadi.github.io/elite-challenge/admin.html)** — no code editing required.

### Dashboard Stats
- Total questions · per category · per difficulty
- Active / archived / needs-review counts
- Detected duplicates and similar questions

### Question Table
- Search by text, answer, category, or ID
- Filter by category · difficulty · status · used/unused · needs-review · duplicates
- Sort by any column · paginated for thousands of questions
- **Actions per row:** View · Edit · Delete · Duplicate · Archive/Activate

### Add / Edit Questions
- Auto-generated unique ID
- Full validation before save:
  - No empty question or correct answer
  - Exactly 4 options for MCQ
  - No duplicate options (after Arabic normalization)
  - No duplicate question text in bank
  - Similarity check against existing questions
- Duplicate detected → shows existing question for review before allowing save

### Import / Export
| Direction | Options |
|-----------|---------|
| **Export** | All questions · Active only · By category · By difficulty · Needs-review |
| **Import** | Upload JSON → validation preview → confirm before merge |

Import preview shows: new questions count · conflicts · invalid entries — no silent overwrites.

### Data Architecture (GitHub Pages compatible)

```
questions.json  ←  source of truth (committed to repo)
     +
localStorage    ←  local additions, edits, usage history
     =
Merged bank     ←  what the game and admin panel see
```

Merge strategy: **ID wins** — user edits override base JSON for the same question ID. Deletions and archives are tracked in a separate usage log, so a re-added question doesn't reset its history.

> All admin changes are local to the browser. To publish to all users: export JSON → commit to repo → push to GitHub.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                index.html / admin.html               │
│                   (Presentation)                    │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────▼────────────┐
          │         app.js          │  Controller — wires all modules
          │         admin.js        │  Admin controller
          └───┬─────────┬───────────┘
              │         │
    ┌─────────▼──┐  ┌───▼──────────────┐
    │game-engine │  │  question-bank   │
    │   .js      │  │      .js         │
    │            │  │                  │
    │ Pure logic │  │ Load · Validate  │
    │ Zero DOM   │  │ Build round      │
    │ Scoring    │  │ Anti-repeat      │
    │ Turns      │  │ Swap finder      │
    │ Lifelines  │  │ Bank stats       │
    └────────────┘  └───────┬──────────┘
                            │
                   ┌────────▼─────────┐
                   │   storage.js     │
                   │                  │
                   │ localStorage R/W │
                   │ Usage history    │
                   │ Settings         │
                   │ Arabic normalize │
                   └────────┬─────────┘
                            │
                   ┌────────▼─────────┐
                   │ data/questions   │
                   │     .json        │
                   │ 2,000+ questions │
                   └──────────────────┘
```

**Key design principles:**
- `game-engine.js` is **completely DOM-free** — testable in isolation, zero UI coupling
- `question-bank.js` uses a **weighted selection algorithm** — scores by usage count + recency + randomness
- `storage.js` wraps all `localStorage` in `try/catch` — safe in private/incognito browsing
- `normalizeArabic()` handles diacritics · ألف variants · ة→ه · ى→ي · ؤ→و for duplicate detection
- Admin panel and game share **one data layer** — no separate question copies

---

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/Ayham-Megdadi/elite-challenge.git
cd elite-challenge

# Serve locally (ES Modules require a server)
python3 -m http.server 8000

# Open game
open http://localhost:8000

# Open admin panel
open http://localhost:8000/admin.html
```

> ⚠️ ES Modules require a server — `file://` won't work for module imports.  
> Use Python's http.server, VS Code Live Server, or any static server.

---

## 🗂️ Repository Structure

```
elite-challenge/
├── index.html              ← Game entry point
├── admin.html              ← Admin panel (standalone)
├── .nojekyll               ← Required for GitHub Pages with assets/
├── README.md
└── assets/
    ├── css/
    │   ├── style.css       ← Design system (variables, layout, components)
    │   ├── game.css        ← Game-specific styles
    │   └── admin.css       ← Admin panel styles
    ├── js/
    │   ├── app.js          ← Game controller
    │   ├── admin.js        ← Admin panel controller
    │   ├── game-engine.js  ← Pure game logic (DOM-free)
    │   ├── question-bank.js← Bank loading, validation, round builder
    │   ├── storage.js      ← localStorage + Arabic normalization
    │   └── ui.js           ← Shared UI utilities
    └── data/
        └── questions.json  ← 2,000+ question bank
```

---

## 📋 Question Bank Format

```json
{
  "schemaVersion": 1,
  "updatedAt": "2025-01-01",
  "categories": [
    { "id": "geography", "name": "جغرافيا" }
  ],
  "questions": [
    {
      "id": "geo_001",
      "category": "geography",
      "difficulty": "easy",
      "type": "mcq",
      "question": "ما عاصمة الأردن؟",
      "options": ["عمّان", "بيروت", "دمشق", "القاهرة"],
      "correctAnswer": "عمّان",
      "explanation": "عمّان هي عاصمة المملكة الأردنية الهاشمية.",
      "source": "جغرافيا عامة",
      "status": "active",
      "tags": ["عواصم", "عرب"]
    }
  ]
}
```

### Difficulty Values

| Value | Label | Stage | Points |
|-------|-------|-------|--------|
| `easy` | سهلة | 1 | 100 |
| `medium` | متوسطة | 2 | 200 |
| `hard` | صعبة جدًا | 3 | 300 |
| `veryhard` | صعبة للغاية | 4 | 500 |

### Minimum per Category (for a valid round)

| Difficulty | Minimum |
|-----------|---------|
| easy | 6 |
| medium | 6 |
| hard | 4 |
| veryhard | 2 |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Structure | HTML5 — Semantic, WAI-ARIA |
| Styling | CSS3 — Custom properties, RTL, responsive |
| Logic | Vanilla JavaScript — ES Modules |
| Storage | `localStorage` — settings · usage history · results |
| Font | Tajawal (Google Fonts) |
| Data | JSON (2,000+ questions) |
| Hosting | GitHub Pages — zero cost, zero backend |

---

## ⚖️ License

MIT License — free to use, modify, and distribute with attribution.

---

<div align="center">

*Built with ❤️ by [Ayham Megdadi](https://www.instagram.com/ayham_megdadi/)*  
*⭐ Star this repo to support the project!*

[![Play Now](https://img.shields.io/badge/🕹️%20Play%20Now-Live%20Demo-D4AF37?style=for-the-badge)](https://ayham-megdadi.github.io/elite-challenge/)

</div>
