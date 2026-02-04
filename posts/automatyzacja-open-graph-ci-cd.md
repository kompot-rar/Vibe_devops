---
id: '12'
title: 'Automatyzacja Open Graph: Czyli jak zmusiłem CI/CD do robienia miniaturek'
date: '2026-02-04'
tags: ['CI/CD', 'GitHub Actions', 'Automation', 'Node.js', 'Nginx']
readTime: '6 min'
imageUrl: '/og-automation-banner.png'
excerpt: 'Każdy szanujący się blog musi mieć ładne podglądy na LinkedInie. Ale czy DevOps będzie je robił ręcznie w Canvie? Oczywiście, że nie. Zobacz jak zaprzęgłem GitHuba i Nginxa do generowania grafik.'
---

## Problem: Jestem leniwy (i to moja zaleta)

Pisanie postów jest fajne. Konfigurowanie klastrów jest fajne. Ale robienie ręcznie obrazka "Social Preview" dla każdego nowego wpisu? To brzmi jak kara.
A bez tego linki na LinkedInie czy Discordzie wyglądają jak "broken links" – puste, smutne, nieprofesjonalne.

Jako inżynier aspirujący do miana **Senior DevOps**, wyznaję zasadę: **Jeśli musisz coś zrobić więcej niż dwa razy, zautomatyzuj to.**

Postanowiłem więc, że grafiki Open Graph (OG) będą generować się same, w locie, podczas każdego `git push`. A przy okazji stało się to świetnym ćwiczeniem z modyfikacji pipeline'u CI/CD i konfiguracji Nginxa.

## Architektura rozwiązania

Nie chciałem zewnętrznych serwisów SaaS. Chciałem, żeby to działo się na moim runnerze.
Plan był prosty:
1.  **Trigger:** Push do repozytorium.
2.  **Build Script:** Node.js skanuje pliki `.md`.
3.  **Generation:** Biblioteka **Satori** (od Vercel) generuje SVG z HTML-a, a **Resvg** zamienia to na PNG.
4.  **Injection:** Skrypt "patchuje" pliki `index.html`, wstrzykując odpowiednie metatagi.
5.  **Serve:** Nginx serwuje statyczne pliki dla crawlerów, a Reacta dla ludzi.

Brzmi prosto? Oczywiście, że po drodze wszystko wybuchło.

## Krok 1: Walka z Satori i CSS-in-JS

Satori to niesamowite narzędzie – pozwala pisać HTML/CSS i wypluwa SVG. Ale okazało się, że jest bardzo "wrażliwe".

Moim celem było:
*   Jeśli post ma banner (zrzut ekranu z terminala) -> Weź go, przybliż (zoom), nałóż watermark i zmniejsz wagę pliku.
*   Jeśli post nie ma bannera -> Wygeneruj ładną wizytówkę z tytułem i datą.

Pierwsze podejście z użyciem parsera HTML (`satori-html`) skończyło się serią błędów:
`Error: Expected <div> to have explicit "display: flex"`

Okazało się, że przy skomplikowanych layoutach (obrazek w tle + watermark na dole), parser głupieje.
**Rozwiązanie?** "Bare Metal VDOM". Zamiast pisać HTML w stringu, zacząłem budować obiekty JS ręcznie. Mniej czytelne dla człowieka, ale pancerne dla kompilatora.

```javascript
// Zamiast HTML stringa:
// <div style="display: flex...">...</div>

// Piszę obiekt:
{
  type: 'div',
  props: {
    style: { display: 'flex', ... },
    children: [ ... ]
  }
}
```
Efekt? Pełna kontrola nad renderowaniem. 

## Krok 2: Optymalizacja (7MB -> 400KB)

Moje zrzuty ekranu z monitoringu 4K ważyły po 7-8 MB. LinkedIn i Twitter odrzucają takie kobyły.
Zamiast zmniejszać je ręcznie, dodałem logikę do skryptu:

1.  Wczytaj plik z dysku.
2.  Przekonwertuj do Base64.
3.  Wrzuć jako `backgroundImage` do kontenera 1200x630.
4.  Satori + Resvg renderują to do nowego PNG.

Efekt uboczny? **Automatyczny Watermark.** Każdy obrazek dostaje teraz moje logo w prawym dolnym rogu. Zero pracy ręcznej, 100% spójności marki.

## Krok 3: Nginx i problem SPA

To był najciekawszy moment "DevOpsowy".
Moja strona to **Single Page Application (React)**. To oznacza, że fizycznie istnieje tylko jeden plik `index.html`.
Kiedy crawler Facebooka wchodzi na `/blog/moj-post`, serwer zwraca mu ten pusty `index.html` (bo treść renderuje się w JS po stronie klienta). Crawler nie wykonuje JS, więc nie widzi metatagów. Pustka.

Mogłem użyć SSR (Next.js), ale to overkill dla statycznego bloga.
Zastosowałem **Meta-Patching**.

Po zbudowaniu aplikacji (`npm run build`), mój skrypt:
1.  Tworzy fizyczne katalogi: `dist/blog/nazwa-posta/`.
2.  Kopiuje tam `index.html`.
3.  Wstrzykuje do środka: `<meta property="og:image" content="...">`.

Ale to nie koniec. Nginx domyślnie przy SPA ma taką konfigurację:
```nginx
try_files $uri /index.html;
```
To oznacza: "Jak nie ma pliku, serwuj apkę Reacta".
Musiałem to zmienić na:
```nginx
try_files $uri $uri/ /index.html;
```
Dodanie `$uri/` sprawia, że Nginx najpierw sprawdza, czy istnieje **katalog** z takim postem. Jeśli tak – serwuje z niego mój "spatchowany" `index.html` z metadanymi. Jeśli nie – leci do Reacta.

## Krok 4: CI/CD Pipeline

Na koniec wszystko spiąłem w GitHub Actions.
Co ważne – musiałem obsłużyć różne środowiska (Dev vs Prod). Obrazki na wersji deweloperskiej muszą wskazywać na `vibe-dev.mrozy.org`, a na produkcji na domenę główną.

```yaml
      - name: Set Environment Variables
        run: |
          if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
            echo "PUBLIC_URL=https://devops.mrozy.org" >> $GITHUB_ENV
          else
            echo "PUBLIC_URL=https://vibe-dev.mrozy.org" >> $GITHUB_ENV
          fi

      - name: Generate Open Graph Images
        run: node scripts/og-generator/generate-og.js

      - name: Patch Meta Tags
        env:
          PUBLIC_URL: ${{ env.PUBLIC_URL }}
        run: node scripts/og-generator/patch-meta.js
```

## Podsumowanie

Cała operacja zajęła jeden wieczór (i kilkanaście commitów z przekleństwami w treści, kiedy Satori odmawiał współpracy).
Ale rezultat jest satysfakcjonujący:
1.  Piszę post w Markdown.
2.  Robię `git push`.
3.  Pipeline sam generuje, skaluje i taguje grafiki.
4.  Link wklejony na Discorda wygląda jak milion dolarów.

To jest właśnie DevOps. Nie chodzi tylko o Kubernetesy i chmury. Chodzi o to, żeby maszyny wykonywały nudną robotę za nas, i robiły to lepiej niż my.
