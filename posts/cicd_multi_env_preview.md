---
title: "Od Single Branch do Multi-Environment - CI/CD w Homelabie"
date: "2026-02-02"
excerpt: "Jak przeszedłem z trybu 'YOLO Deployment' na produkcję do profesjonalnego podziału na środowiska Dev i Prod przy użyciu GitHub Actions i Cloudflare."
tags: ["CI/CD", "GitHub Actions", "Homelab", "DevOps"]
readTime: "5 min"
imageUrl: "/cicd-intro.png"
---

## Wstęp: Problem "Produkcja to moja jedyna baza"

Do tej pory mój blog żył w trybie "YOLO Deployment". Jeden branch `main`, jeden runner, jeden strzał na produkcję. Każdy błąd w kodzie lądował od razu publicznie. To klasyczne podejście "u mnie działa", które w świecie DevOps jest grzechem śmiertelnym.

Postanowiłem to zmienić i wdrożyć standard znany z komercyjnych projektów: **Preview Environments**.

## Architektura Rozwiązania

Cel był prosty:
1.  **Branch `main`** -> Produkcja (domena główna).
2.  **Branch `dev`** -> Środowisko testowe (domena alternatywna).
3.  **Automatyzacja** -> GitHub Actions rozróżnia te światy i wdraża kod w odpowiednie miejsca na tym samym serwerze.

### Wizualizacja Przepływu 

```ascii
      (User/Dev)
          |
      [git push]
          |
          v
  +------------------+
  |  Forgejo/GitHub  |
  +--------+---------+
           | (Webhook)
           v
  +------------------+
  |   GitHub Runner  |
  |  (Self-Hosted)   |
  +--------+---------+
           |
           +---------------------------------+
           | [Branch Check]                  |
           v                                 v
    (branch: main)                    (branch: dev)
           |                                 |
           v                                 v
 [ENV: PRODUCTION]                  [ENV: PREVIEW]
           |                                 |
           v                                 v
  +------------------+              +------------------+
  |  /var/www/html   |              | /var/www/vibe_dev|
  +--------+---------+              +--------+---------+
           |                                 |
           +----------------+----------------+
                            |
                            v
                     [ Nginx Server ]
                            |
                            v
                  [ Cloudflare Tunnel ]
                            |
              +-------------+-------------+
              |                           |
              v                           v
     [devops.mrozy.org]          [vibe-dev.mrozy.org]
       (PROD ACCESS)                (DEV ACCESS)
```

### 1. Git Flow: Divide and Conquer

Stworzyłem branch `dev`. To tutaj teraz trafiają wszystkie eksperymenty. Dopiero gdy zmiany są stabilne, robię Merge Request do `main`.

### 2. GitHub Actions: Inteligentny Runner

Największa zmiana zaszła w pliku `.github/workflows/deploy.yml`. Zamiast ślepo kopiować pliki, dodałem logikę warunkową w Bashu.

```yaml
# Fragment konfiguracji .github/workflows/deploy.yml

- name: Set Environment Variables
  id: set-env
  run: |
    if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
      echo "DEPLOY_DIR=/var/www/html" >> $GITHUB_ENV
      echo "ENV_NAME=Production" >> $GITHUB_ENV
    else
      echo "DEPLOY_DIR=/var/www/vibe_dev" >> $GITHUB_ENV
      echo "ENV_NAME=Preview (Dev)" >> $GITHUB_ENV
    fi
```

Co tu się dzieje?
*   Runner sprawdza `github.ref` (czyli który branch wywołał akcję).
*   Jeśli to `main`, ustawiamy katalog docelowy na `/var/www/html` (klasyczny root Nginxa).
*   W przeciwnym razie (czyli `dev`), lecimy do `/var/www/vibe_dev`.

Dzięki temu ten sam runner obsługuje dwa niezależne byty na jednym fizycznym dysku.

### 3. Nginx & Cloudflare Tunnel: Ostatni Element Układanki

Samo skopiowanie plików to połowa sukcesu. Trzeba je jeszcze wystawić na świat.

*   **Nginx:** Skonfigurowany do serwowania dwóch różnych katalogów (Virtual Hosts).
*   **Cloudflare Tunnel:** To tutaj dzieje się magia sieciowa. Dodałem drugą domenę do tunelu.
    *   `devops.mrozy.org` -> kieruje do aplikacji produkcyjnej.
    *   `vibe-dev.mrozy.org` -> kieruje do wersji preview.

To pozwala mi testować zmiany na żywo, na prawdziwej infrastrukturze, ale bez ryzyka wysadzenia głównego bloga.

## Wnioski "The Hard Way"

1.  **Uprawnienia:** Runner działa jako specyficzny użytkownik. `sudo chown -R www-data:www-data` na końcu pipeline'u jest kluczowe, żeby Nginx (działający jako `www-data`) mógł w ogóle odczytać nowe pliki.
2.  **Clean Builds:** Zawsze czyszczę katalog docelowy (`rm -rf`) przed wdrożeniem. Nadpisywanie plików bez czyszczenia to proszenie się o błędy cache'owania i "duchy" starych assetów.

## Co dalej?

Mając środowisko `dev`, mogę bezpiecznie testować bardziej agresywne zmiany – np. update bibliotek, nowe feature'y UI czy integrację z backendem, bez stresu, że "produkcja leży".

To mały krok dla kodu, ale wielki skok dla higieny pracy.

![Architektura po zmianach](/cicd-diagram.png)
