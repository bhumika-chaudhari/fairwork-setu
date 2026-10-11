# UI/UX Design Specification

## 1. Design principles

1. **Voice first:** Speaking should be easier than typing.
2. **Hindi first:** Default UI language should be Hindi, with English available.
3. **Low-literacy friendly:** Use icons, colors, numbers, and short sentences.
4. **Mobile first:** Design for one-hand use on low-end Android phones.
5. **Trustworthy:** Show sources, avoid overpromising, and use clear disclaimers.
6. **Calm and positive:** Avoid red-heavy designs; use red only for urgent alerts.

## 2. Visual identity

### Product name

**Setu**

### Tagline

**Aapke Kaam, Paisa, Sehat aur Skill ka Sathi**

### Logo concept

A simple bridge icon connecting two points, with a rising line underneath to represent income growth.

## 3. Color system

| Token | Color | Hex | Usage |
|---|---|---|---|
| `primary` | Deep teal | `#0F766E` | Buttons, active tab, headers |
| `primary-dark` | Dark teal | `#115E59` | Pressed state |
| `accent` | Warm saffron | `#F59E0B` | Savings, highlights, progress |
| `background` | Off-white | `#FAF7F2` | App background |
| `surface` | White | `#FFFFFF` | Cards |
| `text-primary` | Charcoal | `#1F2937` | Main text |
| `text-secondary` | Grey | `#4B5563` | Supporting text |
| `success` | Green | `#16A34A` | Income, completed actions |
| `warning` | Amber | `#D97706` | Attention messages |
| `danger` | Red | `#DC2626` | Urgent alerts only |
| `health` | Blue | `#2563EB` | Health module |

### Contrast rules

- Normal text must have at least **4.5:1** contrast with its background.
- Large headings may use at least **3:1** contrast.
- Do not use light grey text on white backgrounds.
- Do not rely on color alone; add icons or labels for status.

## 4. Typography

| Element | Font | Size | Weight |
|---|---|---|---|
| App title | Noto Sans / Inter | 24px | Bold |
| Screen heading | Noto Sans Devanagari UI | 22px | SemiBold |
| Card title | Noto Sans Devanagari UI | 18px | SemiBold |
| Body text | Noto Sans Devanagari UI | 16px | Regular |
| Small text | Noto Sans Devanagari UI | 14px | Regular |
| Income number | Noto Sans / Inter | 36–48px | Bold |

Use **Noto Sans Devanagari UI** for Hindi because it is designed for app and website interfaces in Devanagari script. [web:79][web:92]

## 5. Spacing system

Use a 4px spacing scale:

- `4px`: Icon-label gap
- `8px`: Small internal spacing
- `12px`: Card list gap
- `16px`: Screen padding and card padding
- `20px`: Section spacing
- `24px`: Major section separation

### Touch targets

- Minimum button size: **48 × 48 px**
- Primary action button height: **52–56 px**
- Bottom navigation icon area: **56–64 px**
- Keep at least **12 px** between adjacent actionable elements.

## 6. Layout system

### Mobile layout

```text
+--------------------------+
|         Status bar        |
+--------------------------+
|        Screen header      |
+--------------------------+
|                          |
|         Content          |
|                          |
+--------------------------+
|     [ 🎤 Voice Button ]   |
+--------------------------+
| Home | Kaam | Dhan | More |
+--------------------------+
```

### Grid

- Use a single-column layout.
- Cards should span full width with 16px side margins.
- Use horizontal scroll only for job cards or course cards.

## 7. Core screens

### 7.1 Onboarding

```text
आपकी भाषा चुनें
[ हिंदी ]  [ English ]

आप क्या काम करते हैं?
[ ड्राइवर ] [ डिलीवरी ] [ मजदूर ]
[ इलेक्ट्रीशियन ] [ दर्जी ] [ अन्य ]

आपकी स्किल्स बोलकर बताइए
[ 🎤 बोलें ]
```

### 7.2 Home

```text
नमस्ते, रमेश 👋

आज की कमाई
₹750

आज ₹50 बचा सकते हैं
[ 🎯 बचत शुरू करें ]

आज के काम सुझाव
[ Electrician Helper · 2.4 km · 92% match ]

स्वास्थ्य सुझाव
[ नज़दीकी सरकारी अस्पताल · 1.8 km ]
```

### 7.3 Kaam

```text
काम खोजें

[ स्किल: इलेक्ट्रीशियन ]
[ शहर: पुणे ]
[ आज उपलब्ध ]

काम सुझाव
+--------------------------------+
| Electrician Helper             |
| 2.4 km · ₹700–₹900/day         |
| Skill match: 92%               |
| [ दिखाएं ]                      |
+--------------------------------+
```

### 7.4 Dhan

```text
मेरा पैसा

इस हफ्ते की कमाई
₹4,650

अगले हफ्ते की अनुमानित कमाई
₹4,200–₹5,000

खर्च
- पेट्रोल: ₹600
- खाना: ₹900
- किराया: ₹2,000

आपातकालीन बचत
₹1,250 / ₹5,000
[██████░░░░] 25%
```

### 7.5 Sehat

```text
स्वास्थ्य सहायता

[ 🎤 सवाल पूछें ]

नज़दीकी सरकारी अस्पताल
- Name
- Distance
- Timings
- Services
- Source link

आपातकालीन नंबर
- 108 Ambulance
- 112 Emergency
```

### 7.6 Kaushal

```text
मेरा स्किल पासपोर्ट

नाम: रमेश कुमार
काम: इलेक्ट्रीशियन
शहर: पुणे
स्किल्स: वायरिंग, फैन रिपेयर
अनुभव: 4 साल

[ PDF डाउनलोड करें ]

सीखने के सुझाव
- Basic electrical safety
- Solar panel installation
- Home-appliance repair
```

## 8. Voice interaction

The microphone button should always be visible on the Home screen.

### Voice examples

| Worker says | App action |
|---|---|
| “Aaj 800 kamaye” | Adds ₹800 income |
| “150 petrol mein gaye” | Adds ₹150 travel expense |
| “Mujhe Pune mein plumber ka kaam chahiye” | Opens Kaam search |
| “Mujhe sasta hospital chahiye” | Opens Sehat search |
| “Main mobile repair karta hoon” | Adds skill to profile |

### Voice UX rules

- Show a listening animation.
- Show the transcript immediately.
- Let the worker edit before saving.
- Confirm money entries with a large summary card.
- If speech is unclear, ask one short clarifying question.

## 9. Accessibility

- Minimum font size: 14px; preferred body size: 16px.
- Use icons with text labels.
- Support dark mode.
- Provide haptic feedback for successful voice entries.
- Avoid technical jargon.
- Provide a “Read aloud” option for key information in later versions.
- Ensure color is not the only indicator of status.

## 10. Empty and error states

| State | Message |
|---|---|
| No work found | “अभी आपके शहर में मैचिंग काम नहीं मिला। कुछ और स्किल जोड़ें।” |
| No income data | “अभी कोई कमाई दर्ज नहीं है। 🎤 बोलकर आज की कमाई जोड़ें।” |
| Poor internet | “इंटरनेट धीमा है। आप ऑफलाइन एंट्री कर सकते हैं।” |
| Voice unclear | “माफ़ कीजिए, साफ़ सुनाई नहीं दिया। फिर से बोलें।” |
| Health emergency | Show emergency numbers immediately and advise contacting local emergency services. |
