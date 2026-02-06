---
title: 'Battlelog: 06.02.2026'
date: '2026-02-06'
excerpt: '6 minut vs 51 sekund. Jak przestałem wysyłać bajty na wakacje do USA i zrozumiałem fizykę Homelaba.'
tags: ['ci-cd', 'optimization', 'docker', 'github-actions']
coverImage: '/docker-god-mode-proof.png'
---

Są dwa typy inżynierów DevOps. Ci, którzy kopiują rozwiązania z chmury 1:1 na własny serwer, i ci, którzy szanują swój czas. Do dzisiaj byłem w tej pierwszej grupie.

Mój pipeline wdrożeniowy trwał **6 minut**.
Teraz trwa **51 sekund**.

Oto historia o tym, jak przestałem wysyłać bajty na wakacje do USA.

## Problem: Pętla Absurdu

Mój setup to klasyczny Self-Hosted Runner na GitHub Actions, który stoi fizycznie w moim pokoju na Lenovo ThinkCentre. Logicznym wydawało się użycie gotowych akcji: `docker/build-push-action`.

Co się działo pod spodem?
1.  **Build:** Mój serwer buduje obraz Dockera (lokalnie).
2.  **Push:** Mój serwer wypycha 60MB obrazu do GitHub Container Registry (GHCR) przez moje domowe łącze (upload).
3.  **Pull:** Ten sam serwer, w kolejnym kroku, pobiera **ten sam obraz** z powrotem z GitHuba (download).

Rozumiecie to? Mój serwer miał gotowy, gorący obraz na dysku, ale zamiast go użyć, wysyłał go przez Atlantyk do serwerowni Microsoftu, tylko po to, żeby ściągnąć go z powrotem.

**Efekt:** 6 minut gapienia się w terminal i marnowanie transferu. W chmurze (gdzie Runner != Serwer docelowy) to ma sens. W Homelabie to zbrodnia.

## Rozwiązanie: Local-First Strategy

Zrozumiałem, że w środowisku on-premise, gdzie Runner *jest* Hostem, muszę zmienić myślenie. Przepisałem pipeline na surowe komendy shellowe.

### Stary Flow (Cloud Native way):
❌ Build -> Upload (Internet) -> Download (Internet) -> Deploy

### Nowy Flow (Homelab way):
✅ Build (Local) -> Deploy (Instant) -> Push (Background Backup)

Wyciąłem pośrednika. Docker buduje obraz, taguje go i **natychmiast** podnosi kontener. Push do rejestru (jako backup) leci w tle, kiedy aplikacja już wstaje.

**Wynik? Zjazd z 5m 53s na 0m 51s.** To jest prawie 700% optymalizacji.

## "Scorched Earth" Cleanup

Przy okazji rozwiązałem klasyczny problem "Ghost Containers". Self-hosted runnery lubią zostawiać śmieci. Czasami `docker compose down` nie wystarcza i nowy deployment wywala się, bo port 8080 jest zajęty przez zombie-proces z poprzedniego builda.

Wdrożyłem politykę spalonej ziemi w BASH-u:

```bash
# Safety Net for Port 8080
EXISTING_CONTAINER=$(docker ps -q --filter "publish=8080")
if [ ! -z "$EXISTING_CONTAINER" ]; then
   echo "⚠️ Found rogue container. Executing Order 66..."
   docker rm -f $EXISTING_CONTAINER
fi
```

Brutalne? Tak. Skuteczne? Absolutnie. Produkcja ma wstawać, a nie prosić o pozwolenie.

## Debloat i Sprzątanie

Na koniec dnia zrobiłem wiosenne porządki. Projekt, który zaczynał jako szablon AI, był pełen śmieci – zbędne klucze API, widgety czatu, ciężkie biblioteki. Wywaliłem ponad 1000 linii kodu.

Dodałem też **Automated Garbage Collector** do GHCR. GitHub daje 500MB na prywatne obrazy. Mój pipeline teraz automatycznie kasuje stare wersje obrazów, zostawiając tylko 5 ostatnich. Koszt utrzymania infrastruktury: **0 PLN**.

## Co dalej?

Docker Compose to tylko rozgrzewka. W ten weekend wjeżdża **K3s**. Szykuję architekturę "The Forge" – lokalny rejestr obrazów wewnątrz sieci LAN, żeby klaster 3 węzłów instalował się z prędkością światłowodu, a nie Neostrady.

Nie sztuką jest użyć gotowego narzędzia. Sztuką jest zrozumieć, kiedy to narzędzie działa przeciwko Tobie.
