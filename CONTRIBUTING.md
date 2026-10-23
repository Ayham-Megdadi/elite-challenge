# Contributing to تحدّي النخبة

شكرًا على اهتمامك بالمشروع. المساهمة الأكثر تأثيرًا هي **إضافة أسئلة جديدة** — إليك كيف تبدأ.

---

## Ways to Contribute

| Type | How |
|------|-----|
| 📝 **New questions** | JSON file via Pull Request — see format below |
| 🐛 **Bug report** | Open an Issue — include browser, OS, steps to reproduce, console errors |
| 💡 **Feature request** | Open an Issue with `[Feature]` in the title |
| 🌍 **New category** | Open an Issue — propose the category name and submit at least 18 questions (6 per difficulty × 3 levels + 2 veryhard) |
| ♿ **Accessibility** | PRs improving ARIA, keyboard navigation, or reduced-motion are very welcome |
| 🎨 **UI/UX** | Open an Issue first to align direction before coding |

---

## Adding Questions (Highest Impact)

### Minimum per Category (to unlock in a round)

| Difficulty | Count needed |
|-----------|-------------|
| `easy` | ≥ 6 |
| `medium` | ≥ 6 |
| `hard` | ≥ 4 |
| `veryhard` | ≥ 2 |

A category with fewer questions than these minimums will not appear in the game.  
**Target:** 20+ per difficulty per category to ensure variety across many sessions.

### JSON Format

```json
{
  "id": "geo_042",
  "category": "geography",
  "difficulty": "medium",
  "type": "mcq",
  "question": "أي بحر يفصل أوروبا عن أفريقيا؟",
  "options": ["البحر المتوسط", "البحر الأحمر", "بحر العرب", "بحر الشمال"],
  "correctAnswer": "البحر المتوسط",
  "explanation": "مضيق جبل طارق يربط المحيط الأطلسي بالبحر المتوسط الذي يفصل القارتين.",
  "source": "موسوعة ناشيونال جيوغرافيك",
  "status": "active",
  "tags": ["بحار", "أوروبا", "أفريقيا"]
}
```

### Category IDs

| ID | Arabic |
|----|--------|
| `geography` | جغرافيا |
| `history` | تاريخ |
| `religion` | دين |
| `general` | ثقافة عامة |
| `technology` | تكنولوجيا |
| `nature` | طبيعة وحيوانات |
| `figures` | شخصيات تاريخية |
| `math` | رياضيات |
| `guess-country` | خمّن الدولة |
| `civilizations` | تاريخ وحضارات |
| `sira` | سيرة الرسول |
| `foreign-films` | أفلام أجنبية |
| `film-story` | قصة فيلم |
| `bab-alhara` | باب الحارة |
| `zaman-albarghouth` | زمن البرغوث |
| `turkish-arts` | فن تركي |
| `riddles` | ألغاز |

### Question Quality Rules

- IDs must be **globally unique** — format: `category_NNN` (e.g. `geo_042`, `tech_107`)
- MCQ must have **exactly 4 options** — no duplicates, no obviously wrong distractors
- `correctAnswer` must **exactly match** one of the `options` (character for character)
- Wrong options should be **plausible** — related to the topic, not random nonsense
- `explanation` should be 1–2 sentences, educational, not just restating the answer
- Avoid questions where the answer changes over time (current records, living people's ages, prices)
- No political, sectarian, or offensive content

### Validate Before Submitting

Use the built-in admin panel to validate your questions before opening a PR:

```bash
python3 -m http.server 8000
# open http://localhost:8000/admin.html
# Import your JSON file — the panel shows validation errors before saving
```

---

## Code Contributions

### Setup

```bash
git clone https://github.com/Ayham-Megdadi/elite-challenge.git
cd elite-challenge
python3 -m http.server 8000
# http://localhost:8000       → game
# http://localhost:8000/admin.html → admin panel
```

### Module Contract — Do Not Break

| File | Responsibility | Hard Rule |
|------|---------------|-----------|
| `game-engine.js` | Pure game logic | **Zero DOM access — ever** |
| `question-bank.js` | Bank loading, validation, round building | No direct localStorage calls |
| `storage.js` | localStorage + Arabic normalization | All calls wrapped in try/catch |
| `ui.js` | Shared UI utilities | No game logic |
| `app.js` | Game controller | Wires everything — allowed DOM access |
| `admin.js` | Admin controller | Wires admin UI — allowed DOM access |

### Pull Request Process

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature` or `fix/your-bug`
3. Make your changes
4. Test in Chrome + Firefox on desktop and mobile viewport
5. Ensure RTL layout is intact — test with Arabic content
6. Verify `game-engine.js` has zero DOM references after your change
7. Open a Pull Request with a clear description of what and why

### Code Style

- Vanilla ES Modules only — no npm, no bundler, no frameworks
- CSS custom properties from `style.css :root` — no hardcoded colors anywhere
- All user-facing strings must be in Arabic
- `localStorage` access only through `storage.js` — never directly in other modules
- New features that touch the game loop must not break the DOM-free contract of `game-engine.js`

---

## What Will NOT Be Merged

- External npm dependencies or additional CDN scripts (beyond Google Fonts)
- Changes that add DOM access to `game-engine.js`
- Hardcoded colors, non-RTL layouts, or English-only UI strings
- Removal or weakening of accessibility attributes
- Questions with political, religious bias, or offensive content
- Duplicate questions (after normalization check)
- Categories with fewer than the minimum required questions

---

*شكرًا على مساهمتك — Ayham Megdadi*
