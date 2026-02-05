---
id: '13'
title: 'Docker. Ostatni przystanek przed Kubernetesem'
excerpt: 'Od reinstallowania Linuxa po instalacji Dockera, do 15-sekundowych buildów dzięki inteligentnemu cache''owaniu. Zobacz, jak przejąłem pełną kontrolę nad infrastrukturą mojego bloga.'
date: '2026-02-05'
tags: ['Docker', 'CI/CD', 'GitHub Actions', 'DevOps', 'Self-Hosted']
readTime: '6 min'
imageUrl: '/docker-god-mode-proof.png'
author: 'Kompot'
---

# Pamiętam jeszcze te czasy, kiedy instalacja Dockera kończyła się formatem całego Linuxa.

Serio. Wystarczyło jedno błędne polecenie in `iptables`, jedna zła zależność i system sypał się jak domek z kart. Myślałem wtedy, że konteneryzacja to czarna magia zarezerwowana dla gości z Doliny Krzemowej. Dziś? Dziś patrzę na te wspomnienia z uśmiechem politowania.

Właśnie domknąłem projekt **Docker Migration**. To nie była tylko zmiana sposobu uruchamiania aplikacji. To była totalna demonstracja siły i kontroli nad własnym homelabem.

## Koniec z "Mutable Infrastructure"

Do tej pory mój blog działał na solidnym LXC, ale nadal był więźniem systemu operacyjnego. Każda zmiana wersji Node.js czy konfiguracji Nginxa wymagała dłubania w "żywym organizmie" serwera.

Dziś wdrożyłem **Immutable Infrastructure**. Moja aplikacja jest zamknięta w pancernej bańce kontenera. Nieważne, czy odpalam ją na moim Lenovo ThinkCentre, na laptopie, czy w chmurze – wstaje w ułamku sekundy, dokładnie w takiej samej konfiguracji. Żadnych niespodzianek. Żadnych "u mnie działa".

## Multi-Stage Build: Odchudzanie o 90%

Zamiast wrzucać do kontenera cały śmietnik deweloperski, zastosowałem **Multi-Stage Build**. To technika, którą musisz znać, jeśli chcesz profesjonalnie konteneryzować aplikacje.

Spójrz na mój `Dockerfile`. Dzielę proces na dwa etapy:
1.  **Etap 1: Budowanie (Builder)** – tu instaluję zależności i kompiluję aplikację.
2.  **Etap 2: Serwowanie (Produkcja)** – kopiuję TYLKO gotowe pliki do czystego obrazu Nginxa.

```dockerfile
# Etap 1: Budowanie aplikacji
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etap 2: Serwowanie aplikacji przez Nginx
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Dzięki temu obraz produkcyjny nie zawiera kodu źródłowego ani narzędzi kompilacji. Jest bezpieczniejszy i waży kilkanaście MB zamiast kilkuset.

## Inteligentne Cache'owanie: 15 sekund do zwycięstwa

Wdrożyłem w moim pipeline CI/CD zaawansowany mechanizm cache'owania warstw (`type=gha`, `mode=max`).

Wynik?
*   Build od zera: 2 minuty.
*   Kolejny build (zmiana w kodzie): **15 SEKUND.**

Oto jak to wygląda w YAML-u. Zwróć uwagę na `cache-from` i `cache-to`. To one robią robotę.

```yaml
      - name: Build and Push Docker Image
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ghcr.io/${{ github.repository_owner }}/${{ env.IMAGE_NAME }}:latest
          # To jest ten mechanizm cache:
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

Docker inteligentnie wyciąga warstwy z cache'u mojego własnego Runnera. Nie marnuję czasu na pobieranie paczek, które już mam.

## Self-Hosted Runner: Moja szafa, moja moc

Nie polegam na darmowych zasobach GitHuba. Mój blog buduje się u mnie, na moich zasadach. Postawiłem dedykowany **Self-Hosted Runner** na Debianie 12 wewnątrz mojego klastra Proxmox.

Dzięki temu:
1.  Mam nielimitowaną moc obliczeniową pod buildy.
2.  Sekrety i klucze API nie opuszczają mojej sieci domowej.
3.  Deployment to czysta poezja – obraz ląduje w GHCR, a mój Runner automatycznie go zaciąga.

Tak wygląda mój `docker-compose.yml`. Zauważ dynamiczne nazewnictwo obrazów – jeden plik obsługuje różne branche (dev/prod) dzięki zmiennym środowiskowym wstrzykiwanym przez CI/CD.

```yaml
services:
  vibe-blog:
    # Dynamiczna nazwa obrazu zależna od brancha (np. 'docker-migration' lub 'main')
    image: ghcr.io/${GITHUB_REPOSITORY_OWNER}/${IMAGE_NAME}:latest
    container_name: vibe-blog-prod
    ports:
      - "8080:80"
    restart: unless-stopped
```

## Strategia migracji: Obraz to dopiero początek

Nie bawię się w półśrodki. Docker Compose na osobnym hostingu to dla mnie tylko poligon doświadczalny. Używam wzorca **Strangler Fig**, żeby bezpiecznie przygotować się do wielkiego skoku.

Moja automatyzacja w GitHub Actions pilnuje dwóch światów:
1.  **Legacy (Branch `main`):** Stary, stabilny deployment plików na serwer LXC. To działa, dopóki nie będziemy gotowi.
2.  **Staging (Branch `docker-migration`):** Tu dzieje się magia kontenera. Buduję, optymalizuję i testuję obraz.

```yaml
jobs:
  # STARY ŚWIAT: Pliki na LXC
  deploy-legacy:
    if: github.ref == 'refs/heads/main'
    runs-on: [self-hosted, linux, homelab]
    steps:
       - run: sudo cp -r dist/. /var/www/html/

  # NOWY ŚWIAT: Testowanie obrazu
  deploy-test-image:
    if: github.ref == 'refs/heads/docker-migration'
    runs-on: [self-hosted, linux, docker]
    steps:
       - run: docker compose up -d --pull always
```

![GitHub Actions: Build & Deploy Success](/github-actions-success.png)

Plan jest prosty: jak tylko upewnię się, że obraz jest **produkcyjny** i przechodzi wszystkie testy na Dockerze, nie będę go wdrażał na stałe przez Compose. **Przepinamy się od razu na Kubernetesa.** Docker to dla nas tylko standard opakowania aplikacji, który otwiera drzwi do prawdziwej orkiestracji.

## Kubernetes, nadchodzę

To był ostatni przystanek. Mój blog jest teraz w pełni skonteneryzowany, odizolowany i zautomatyzowany. Jest "Cloud Native" w każdym calu. 

Kubernetes? K3s? Po dzisiejszej sesji czuję, że to już tylko kolejna cegiełka do dołożenia. Moje kontenery są gotowe na orkiestrację. Moja infrastruktura jest gotowa na skalowanie. 

Wiem, że wciąż jestem na początku drogi i Kubernetes jeszcze nieraz sprowadzi mnie do parteru. Ale różnicę między "uruchomieniem skryptu" a "budowaniem produkcyjnego pipeline'u" już poczułem na własnej skórze. I szczerze? To uczucie uzależnia.

Następny cel: 3-węzłowy klaster K3s. Bo jeden kontener to dopiero rozgrzewka przed prawdziwą orkiestracją.

![Dowód zbrodni: Docker na produkcji](/docker-god-mode-proof.png)