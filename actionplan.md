# Action Plan: Automatyczne Generowanie Open Graph (OG) 🚀

Cel: Automatyczne generowanie obrazów podglądu (social preview) dla każdego posta oraz podstron, aby zwiększyć profesjonalizm bloga i zasięgi na social mediach.

## 🛠 Tech Stack
- **Satori (Vercel):** Konwersja HTML/CSS na SVG (pozwala projektować layouty OG w React-podobnym stylu).
- **Resvg:** Konwersja SVG na PNG (wysoka wydajność).
- **Gray-matter:** Do wyciągania metadanych z plików `.md`.
- **Node.js (Build-time script):** Uruchamiany w GitHub Actions.

## 📋 Kroki Implementacji

### 1. Przygotowanie Infrastruktury (Skrypty)
- [x] Instalacja zależności: `npm install -D satori @resvg/resvg-js gray-matter`.
- [x] Utworzenie katalogu `scripts/og-generator/`.
- [x] Przygotowanie szablonu HTML/CSS (layoutu) dla grafiki (np. Logo + Tytuł posta + Twoje nazwisko).

### 2. Skrypt Generujący (`generate-og.js`)
- [x] Napisanie skryptu, który:
    - Skanuje katalog `/posts`.
    - Dla każdego posta pobiera `title` i `date`.
    - Generuje unikalny obrazek i zapisuje go w `public/og/posts/<slug>.png`.
    - Generuje generyczne obrazy dla strony głównej i Roadmapy.

### 3. Rozwiązanie Problemu SPA (SEO/Crawlers)
Ponieważ roboty social media słabo radzą sobie z React SPA, zastosujemy "Meta-Patching":
- [x] Skrypt `patch-meta.js`, który po wykonaniu `npm run build`:
    - Dla każdego posta w `dist/` tworzy katalog (np. `dist/posts/nazwa-posta/index.html`).
    - Wstawia tam statyczne tagi `<meta property="og:image" ...>`.
    - Dodaje przekierowanie JS do głównej aplikacji, aby użytkownik trafił na właściwy post.

### 4. Integracja z CI/CD (`deploy.yml`)
- [x] Aktualizacja workflow:
    - Dodanie kroku `Run OG Generator` przed `Build Project`.
    - Dodanie kroku `Post-build Meta Patching` po `Build Project`.

### 5. Walidacja
- [x] Test lokalny przy użyciu `npm run build`.
- [x] Weryfikacja na produkcji za pomocą [Open Graph Checker](https://opengraph.xyz/).

---

## 💡 Dlaczego tak? (Perspektywa DevOps)
- **Zero Manual Work:** Piszesz post, robisz `git push`, a grafiki "robią się same".
- **Performance:** Grafiki są statyczne, serwowane bezpośrednio przez Nginx, zero narzutu na runtime.
- **Reliability:** Użycie Satori gwarantuje, że Twoje layouty będą wyglądać tak samo w CI/CD, jak i lokalnie.

---
*Status: Zaimplementowano.*