# Friction Scoring Methodology

## Score Range

**1** = Frictionless (minimal fields, no obstacles)
**10** = Maximum friction (many fields, captcha, multi-step, poor UX)

## Weighted Components

Each component contributes points to the raw score. Sum all points, then cap at 10.

### 1. Field Count (max 3 points)

| Required Fields | Points |
|---|---|
| 1–3 | 0 |
| 4–5 | 1 |
| 6–8 | 2 |
| 9+ | 3 |

### 2. Field Complexity (max 2 points)

| Condition | Points |
|---|---|
| All fields are simple (text, email, textarea) | 0 |
| Has dropdowns or checkboxes | +0.5 |
| Has file upload | +1 |
| Has phone with country code selector | +0.5 |
| Has date picker or custom widgets | +0.5 |

Cap at 2.

### 3. CAPTCHA (max 2 points)

| CAPTCHA Type | Points |
|---|---|
| None | 0 |
| Turnstile (invisible/simple) | 0.5 |
| reCAPTCHA v3 (invisible) | 0.5 |
| reCAPTCHA v2 (checkbox) | 1 |
| hCaptcha | 1.5 |
| Image-based / puzzle CAPTCHA | 2 |

### 4. Navigation Difficulty (max 1 point)

| Time to Find Contact Page | Points |
|---|---|
| < 3 seconds | 0 |
| 3–8 seconds | 0.5 |
| > 8 seconds or not found in nav | 1 |

### 5. Multi-Step Form (max 1 point)

| Steps | Points |
|---|---|
| Single page | 0 |
| 2 steps | 0.5 |
| 3+ steps | 1 |

### 6. Interruptions (max 1 point)

| Condition | Points |
|---|---|
| No cookie banners or pop-ups | 0 |
| Cookie banner only | 0.25 |
| Cookie banner + marketing pop-up | 0.5 |
| Multiple interruptions or aggressive overlays | 1 |

### 7. Scroll & Visibility (max 0.5 points)

| Condition | Points |
|---|---|
| Form fully above the fold | 0 |
| Partial scroll needed | 0.25 |
| Significant scroll to reach form | 0.5 |

### 8. Mobile Responsiveness (max 0.5 points)

| Condition | Points |
|---|---|
| Fully responsive | 0 |
| Minor issues | 0.25 |
| Not usable on mobile | 0.5 |

## Calculation

```
raw_score = field_count + field_complexity + captcha + navigation
          + multi_step + interruptions + scroll + mobile

friction_score = min(10, round(raw_score))
```

## Interpretation Guide

| Score | Label | Description |
|---|---|---|
| 1–2 | Excellent | Minimal friction, quick and easy |
| 3–4 | Good | Some fields but straightforward |
| 5–6 | Moderate | Noticeable friction, could be improved |
| 7–8 | Poor | High friction, likely to lose users |
| 9–10 | Terrible | Maximum friction, hostile UX |
