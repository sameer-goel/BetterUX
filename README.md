# BetterUX.ai 🔭

**Autonomous UX benchmarking agent. Test any website's contact experience. URL in, friction score out. No access needed.**

> *"They need access. You just need a URL."*

## What is BetterUX?

BetterUX is an AI-powered external UX benchmarking tool that tests any website's "Contact Us" page — without needing access, JavaScript tags, or permission. It navigates like a real human, analyzes every form field, and produces a friction score.

## The Problem

Every UX analytics tool (Hotjar, Zuko, Maze) requires you to **own the website** — install their JS tag, wait for traffic, then analyze. That means:
- ❌ Can't test competitors
- ❌ Can't audit clients before a pitch
- ❌ Can't benchmark industry standards

## The Solution

BetterUX works from the **outside in**. Give it any URL, and in 60 seconds you get:
- 🔍 Contact page discovery (nav, footer, direct path heuristics)
- 📋 Complete form field inventory (type, required/optional)
- 🛡️ CAPTCHA & cookie banner detection
- ⏱️ Navigation time & estimated human completion time
- 📊 Friction score (1-10)
- 📈 Multi-site comparison scorecards

## Quick Start

```bash
# Install dependencies
npm install playwright
npx playwright install chromium

# Run a benchmark
node benchmark.js examples/test-consulting.json
```

## Usage

Create a JSON file with sites to test:

```json
{
  "sites": [
    "https://www.accenture.com",
    "https://www.zendesk.com",
    "https://www.deloitte.com"
  ]
}
```

Run the benchmark:

```bash
node benchmark.js my-sites.json
```

Results are saved to `results/` as both JSON (raw data) and Markdown (formatted report).

## Sample Output

| Metric | accenture.com | zendesk.com | deloitte.com |
|--------|-----------|---------|----------|
| Fields (req/opt) | 6/2 | 0/5 | 9/5 |
| CAPTCHA | reCAPTCHA 🔴 | None ✅ | None ✅ |
| Cookie Banner | Yes | Yes | Yes |
| Est. Human Time | 72s | 35s | 70s |
| **Friction Score** | **5.5/10** | **4/10** | **5/10** |

## Scoring Methodology

Friction score (1-10) based on weighted components:

| Component | Scoring |
|-----------|---------|
| Field count | 1-3: 0, 4-6: 1, 7-10: 2, 11+: 3 |
| Complex fields (dropdowns, file uploads) | 0: 0, 1-2: 1, 3+: 2 |
| CAPTCHA | None: 0, Turnstile: 1, reCAPTCHA/hCaptcha: 2 |
| Navigation time | <2s: 0, 2-5s: 1, >5s: 2 |
| Multi-step form | No: 0, Yes: 1 |
| Scroll required | No: 0, Yes: 0.5 |
| Cookie banner | No: 0, Yes: 0.5 |
| Form not above fold | +0.5 |

Higher score = more friction = worse UX.

## Use Cases

- **UX Consultants**: Audit client + competitor in one report
- **Product Teams**: Benchmark your contact form against the industry
- **Sales Teams**: Lead with prospect-specific UX insights
- **Agencies**: Deliver competitive scorecards as a service
- **Investors**: Due diligence on digital properties

## Tech Stack

- **Playwright** — headless browser automation
- **Node.js** — runtime
- Built as an **OpenClaw Agent Skill** for autonomous operation

## Category

**Contact Experience Intelligence** — a new category. Form analytics requires access. Contact Experience Intelligence just requires a URL.

## License

MIT

## Author

Built by [Sameer Goel](https://nl.linkedin.com/in/sameer-goel) with Scout 🔭
