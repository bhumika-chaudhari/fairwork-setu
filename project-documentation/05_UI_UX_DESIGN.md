# UI/UX Design Specification: Setu (सेतु)

## 1. Design Principles

1. **Voice-First & Multimodal:** Speaking or snapping a receipt must be faster and easier than typing.
2. **Vernacular-First:** High-contrast Hindi, Marathi, and English typography engineered for low-literacy ergonomics.
3. **One-Handed Mobile Ergonomics:** All primary interaction zones are placed within easy thumb reach on 5.0" to 6.7" Android smartphones.
4. **Field-Resilient Contrast:** High-contrast text and bold numbers readable under bright direct sunlight on motorcycle handlebars or auto dashboards.
5. **Calm, Dignified Aesthetic:** Deep Emerald (`#073B3A`), Warm Cocoa (`#7C2D16`), and Saffron Gold (`#E5953E`) creating a premium, respectful identity for informal workers.
6. **Multi-Sensory Confirmation:** Every critical action is reinforced with tactile haptic vibrations and distinct audio chimes (`playTap()`, `playSuccess()`).

---

## 2. Visual Identity & Brand Palette

### Color Tokens

| Token | Name | Hex | Usage |
|---|---|---|---|
| `primary` | Deep Emerald | `#073B3A` | Primary headers, widget cards, active states |
| `primary-dark` | Forest Shade | `#052A29` | Deep surfaces, header bars |
| `accent` | Saffron Gold | `#E5953E` | Active dock indicator, highlights, savings rings |
| `warm-cocoa` | Earth Cocoa | `#7C2D16` | Active tab gradient, action buttons |
| `background` | Warm Sand | `#FDFBF7` | Main page body background |
| `surface` | Pure White / Glass | `#FFFFFF` | Content cards with subtle drop shadows |
| `text-primary` | Deep Charcoal | `#111827` | Primary headings and figures |
| `text-secondary`| Muted Slate | `#4B5563` | Subtitles, labels, and metadata |
| `success` | Forest Green | `#16A34A` | Income credits, verified skill badges |
| `danger` | Crimson Coral | `#DC2626` | Expenses, emergency triage alerts |

---

## 3. Typography & Numerics

* **Latin Typography:** `Inter`, `-apple-system`, `BlinkMacSystemFont`
* **Devanagari Typography:** `Noto Sans Devanagari UI`, `Poppins`
* **Numerics & Financial Figures:** Bold, prominent tabular numbers:
  * Earnings Hero Numbers: `36px–48px bold`
  * Card Totals: `22px–28px semi-bold`
  * Body Text: `16px regular` (strictly avoiding tiny < 14px fonts)

---

## 4. Mobile Layout & Navigation Architecture

### 4.1 Floating Apple-Inspired Liquid Glass Dock
Rather than a traditional static bottom bar, Setu features a floating, blurred glass dock (`backdrop-blur-3xl bg-white/90`) positioned above the system navigation bar:

```text
+-------------------------------------------------------------+
|                     Android Status Bar                      |
+-------------------------------------------------------------+
|  [Setu Logo]                 [🔔 Bell] [🔊 Sound] [Language] |
+-------------------------------------------------------------+
|                                                             |
|                    Active Screen Content                    |
|                (Cards, Trends, Charts, Jobs)                |
|                                                             |
+-------------------------------------------------------------+
|                                  [🔔 Bell] [🔊 Sound]       |
|                                  [ 🎙️ Quick Mic FAB ]       |
+-------------------------------------------------------------+
|      +-----------------------------------------------+      |
|      | 🏠 Home | 💼 Kaam | 💰 Dhan | 🩺 Sehat | 📜 Kaushal | 🛡️ Haq |      |
|      +-----------------------------------------------+      |
+-------------------------------------------------------------+
```

### 4.2 The 6 Bottom Dock Tabs
1. **🏠 Home (`/home`):** Daily shift status, today's earnings ticker, recent cashflow cards.
2. **💼 Kaam (`/kaam`):** Nearby gig work, local contract listings, skill match % cards.
3. **💰 Dhan (`/dhan`):** Cashflow ledger, 7-day predictive forecast chart, stability score.
4. **🩺 Sehat (`/sehat`):** Multilingual symptom checker, 108 emergency dialer, hospital locator.
5. **📜 Kaushal (`/kaushal`):** Digital Skill Passport profile card, NCVET course recommendations.
6. **🛡️ Haq (`/haq`):** Government welfare schemes, legal wage rights, grievance templates.

---

## 5. Mobile Native UI Ergonomics

### 5.1 Home-Screen Card Widget UI (4x2 RemoteViews)
* **Background:** Deep Emerald (`#073B3A`) rounded card.
* **Layout:**
  ```text
  +---------------------------------------------------------+
  | 🇮🇳 FairWork Setu • रोज़गार साथी                        |
  | Aaj ki Kamai: ₹850      Kharcha: ₹210    Net: ₹640     |
  |---------------------------------------------------------|
  | [ ➖ Kharcha ]      [ ➕ Kamai ]      [ 🎙️ Bolkar Log ]  |
  +---------------------------------------------------------+
  ```

### 5.2 Lock-Screen Shift Tracker Notification UI
* **Category:** `VISIBILITY_PUBLIC` Ongoing Sticky Notification.
* **Layout:**
  ```text
  +---------------------------------------------------------+
  | 🟢 Setu Shift Active • ऑन-ड्यूटी                        |
  | Live Cash Tracker running. Tap to log fare or fuel slip.|
  | [ ➕ Kamai ]   [ ➖ Kharcha ]   [ 🎙️ Bolkar ]   [ ⏹ End ]|
  +---------------------------------------------------------+
  ```

### 5.3 Hardware Accelerometer "Shake-to-Log" Feedback
* **Detection:** Physical double-shake gesture ($gForce \ge 2.7\text{ G}$).
* **Tactile Feedback:** 180ms haptic vibration pulse.
* **Visual Result:** Voice Assistant modal pops up immediately over the current screen without disrupting page navigation.

### 5.4 Camera Receipt & Bill OCR Modal UI
* **Trigger:** Tapping **"📸 Scan Bill"** in Transaction Modal.
* **Interface:** Native camera capture followed by live scanning progress bar ("*Scanning receipt text... 85%*").
* **Result Preview:** Populates amount (e.g. ₹350), category (`travel_fuel`), and description, with editable inputs before confirmation.
