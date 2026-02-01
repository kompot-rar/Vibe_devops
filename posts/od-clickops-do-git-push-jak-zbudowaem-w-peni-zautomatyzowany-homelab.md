---
id: '2'
title: 'Od ClickOps do Git Push. Jak zbudowałem w pełni zautomatyzowany Homelab.'
date: '2026-01-07'
tags: ['Terraform', 'Ansible', 'CI/CD', 'WarStories']
readTime: '10 min'
imageUrl: '/serwerownia3.png'
excerpt: 'Zarządzanie serwerem przez GUI jest wygodne, ale mało rozwojowe. Zobacz, jak przeszedłem na Infrastructure as Code, używając Terraform, Ansible i GitHub Actions na sprzęcie ThinkCentre.'
---

Zarządzanie domowym serwerem przez GUI (Proxmox) jest wygodne, ale mało rozwojowe. Chcąc wejść w świat DevOps na poważnie, musiałem zmienić paradygmat: **traktować infrastrukturę jak kod (IaC)**.

Postanowiłem zasymulować środowisko produkcyjne, gdzie mój laptop jest jedynie stacją kontrolną (Control Node), a fizyczny serwer (Infrastructure Node) wykonawcą, którego stanu nigdy nie modyfikuję ręcznie.

## Faza 1: Fundamenty (Terraform & IaC)

Pierwszym krokiem było odcięcie się od "klikania" w panelu Proxmoxa. Wykorzystałem **Terraform**, aby zdefiniować zasoby w plikach `.tf`.

### 1. Przygotowanie narzędzi i dostępów

* **Na ThinkPadzie (Arch Linux):** Instalacja była błyskawiczna: `sudo pacman -S terraform`. To stąd zarządzam całym labem.
* **Na Proxmoxie:** Nie instalowałem żadnych binarek. Zamiast tego przygotowałem „wejście” dla Terraforma – stworzyłem dedykowanego użytkownika i wygenerowałem **API Token**. Dzięki temu Terraform łączy się z serwerem bezpiecznie, bez podawania mojego głównego hasła roota.

### 2. Konfiguracja i definicja zasobów

Zdefiniowałem infrastrukturę w plikach `.tf`. Zamiast klikać w GUI, opisałem stan pożądany:

* Wykorzystałem providera `telmate/proxmox`.
* Stworzyłem zasób `proxmox_lxc`, w którym zadeklarowałem liczbę rdzeni, RAM-u i ścieżkę do szablonu Ubuntu.

> **Lekcja DevOps:** Oddzieliłem wrażliwe dane (tokeny API) od głównego kodu. Sekrety trafiły do pliku `.tfvars`, a plik stanu `.tfstate` (który zawiera pełną mapę mojej sieci) został wykluczony z Gita przez `.gitignore`.

### Schemat Architektury CI/CD

![Diagram Architektury](/diagram_architektury.png)

### Architektura:
- **Control Node:** ThinkPad (Arch Linux + Hyprland). Tu piszę kod.
- **Target:** ThinkCentre (Proxmox VE). Tu żyją kontenery LXC.
- **Bezpieczeństwo:** Wrażliwe dane (tokeny API, klucze SSH) wyniosłem do `variables.tf` i zmiennych środowiskowych, dbając o to, by nie trafiły do repozytorium (GitOps hygiene).

**Lekcja:** Zrozumiałem, czym jest **State Management**. Terraform to nie skrypt bashowy – on pamięta stan infrastruktury. Jeśli usunę zasób z kodu, zniknie on z serwera. To daje pewność, że środowisko jest dokładnie takie, jak w dokumentacji.

## Faza 2: Configuration Management (Ansible)

Powołanie "gołego" kontenera to dopiero początek. Musiałem go skonfigurować w sposób powtarzalny (Idempotency). Do tego użyłem **Ansible**.

Główne wyzwania w Playbookach:

1. **Webserver:** Instalacja Nginx i (co kluczowe) konfiguracja pod **React SPA** (obsługa `try_files`, aby routing działał po stronie klienta, a nie serwera).
2. **Self-Hosted Runner:** Automatyczna rejestracja agenta GitHub Actions.

```yaml
# Snippet: Dynamiczne pobieranie tokena w Ansible
- name: Pobierz token rejestracyjny z GitHub API
  uri:
    url: "https://api.github.com/repos/{{ github_account }}/{{ github_repo }}/actions/runners/registration-token"
    method: POST
    headers:
      Authorization: "token {{ github_pat }}"
```

## Faza 3: CI/CD Pipeline (GitHub Actions)

Celem był pełny automat: `git push` ma skutkować nową wersją strony na produkcji. Ze względu na to, że serwer stoi w sieci domowej (za NAT-em/CGNAT), nie mogłem użyć standardowych webhooków z chmury.

**Rozwiązanie: Self-Hosted Runner.**
Runner zainstalowany na moim kontenerze nawiązuje połączenie wychodzące (long-polling) do GitHuba.

**Zaleta Security:** Zero otwartych portów na routerze. Zero VPN-ów. Pełna izolacja sieci domowej.

Mój Workflow (`deploy.yml`):
- **Environment Check:** Weryfikacja wersji Node.js (wymuszona v20+ dla Vite).
- **Build:** Wstrzyknięcie sekretów (API Keys) i budowanie aplikacji (`npm run build`).
- **Deploy:** Atomowa podmiana plików w `/var/www/html` i restart usług.

## 4. War Stories (Troubleshooting) 🐛

To tutaj nauczyłem się najwięcej. Teoria to jedno, ale "produkcja" (nawet domowa) weryfikuje wszystko.

### 1. "Biały Ekran Śmierci" i Zmienne Środowiskowe
Aplikacja działała lokalnie, ale na produkcji widziałem pusty ekran.
- **Diagnoza:** React/Vite "wypala" zmienne środowiskowe (`VITE_API_KEY`) w kodzie JS podczas budowania (Build Time), a nie podczas działania.
- **Fix:** Skonfigurowanie `secrets` w GitHub i przekazanie ich jawnym argumentem do procesu `npm run build` w pipeline.

### 2. Routing w SPA (404 Not Found)
Po wejściu na podstronę `/admin` i odświeżeniu, Nginx zwracał 404.
- **Fix:** Implementacja dyrektywy `try_files $uri $uri/ /index.html;` w konfiguracji Nginxa (wdrożona przez Ansible, aby była trwała).

### 3. Permissions Hell
Runner działa jako użytkownik `runner`, ale Nginx serwuje pliki z katalogu należącego do `root` (`www-data`).
- **Rozwiązanie:** Zamiast dawać Runnerowi pełnego roota (niebezpieczne), skonfigurowałem precyzyjne reguły `sudoers` w Ansible, pozwalając mu tylko na `cp` i `systemctl restart nginx` bez hasła.

## 5. Podsumowanie

Ten projekt to coś więcej niż blog. To żywy dowód na to, że potrafię zbudować **kompletny ekosystem**: od Provisioningu (Terraform), przez Konfigurację (Ansible), aż po Wdrożenie Aplikacji (CI/CD, React, Nginx).

Każdy element tej strony, którą czytasz, został wdrożony automatycznie w ciągu 35 sekund od mojego commitu.

**Next Steps:**
- Wdrożenie monitoringu (Prometheus/Grafana).
- Konteneryzacja (Kubernetes).