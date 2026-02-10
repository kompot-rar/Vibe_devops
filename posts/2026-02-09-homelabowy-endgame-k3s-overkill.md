---
title: "Homelabowy Endgame: Terraform, Vault i FQDN Hell – czyli jak zbudowałem Kuźnię CI/CD 💀🚀"
date: 2026-02-09
description: "Pełny zapis walki: od wycieku tokenów (oops), przez walkę z wcięciami w YAML, aż po hybrydowy pipeline na K3s. To nie był łatwy dzień."
tags: ["kubernetes", "k3s", "terraform", "ansible", "vault", "ci-cd", "gitops", "fail-stories"]
coverImage: "/og/posts/k3s-migration-battle.png"
---

Miał być szybki deploy. Wyszła epopeja.
Dzisiaj zmigrowałem bloga na klaster **K3s**, ale droga do tego celu była wybrukowana błędami, które (mam nadzieję) uczynią mnie lepszym inżynierem.

Jeśli myślisz, że DevOps to tylko klepanie gotowych komend – ten post wyprowadzi Cię z błędu. Oto kronika wypadków i zwycięstw z budowy **"Kuźni" (The Forge)**.

## Akt 1: Security First (i chwila grozy 🚨)

Zaczęliśmy niewinnie – od audytu repozytorium. Okazało się, że mój `.gitignore` był dziurawy jak ser szwajcarski. Brakowało blokad dla `.env` czy `tfvars`. Szybki fix, `chore: security hardening` i czujemy się bezpiecznie.

A potem... **wkleiłem token PAT do czatu.**
Dwa razy.

> **Lekcja #1:** Nigdy nie ufaj schowkowi.
> **Lekcja #2:** Sekrety trzymamy w **Ansible Vault**, a nie w zmiennych środowiskowych "na brudno".

Zamiast płakać, wdrożyłem `ansible-vault`. Stworzyłem zaszyfrowany plik `secrets.yml`, a playbook czyta go w locie. Zero plain-textu na ekranie. Profesjonalnie.

## Akt 2: Terraform i walka z "Driftem"

Kuźnia (LXC na Proxmoxie) powstała z kodu. Użyłem providera `bpg/proxmox`. Ale Terraform szybko pokazał mi, kto tu rządzi.
Okazało się, że stan rzeczywisty serwera (ustawienia VGA dla VM-ek K3s) rozjechał się z kodem. Terraform chciał niszczyć konfigurację grafiki.

Rozwiązanie? **Targeted Apply**.
```bash
terraform apply -target=proxmox_virtual_environment_container.kuznia
```
Czasem trzeba chirurgicznego skalpela, a nie młota. Kuźnia wstała na Debianie 13 (Trixie). I tu zaczęły się schody.

## Akt 3: Ansible vs. Debian 13 vs. YAML

Debian Trixie to "bleeding edge". Stare metody dodawania kluczy GPG (`apt-key add`) już nie działają. Musiałem przepisać playbooka na nowoczesne `signed-by` w `/etc/apt/keyrings`.

Ale prawdziwym bossem poziomu był **plik Inventory**.
```text
YAML parsing failed: Colons in unquoted values must be followed by a non-space character.
```
Spędziłem 15 minut, walcząc z wcięciami (indentation hell) w definicji grup `children`. Jedna spacja za mało i Ansible jest ślepy. W końcu `pong`. Mamy połączenie.

Efekt? Pełna automatyzacja. Ansible sam pobiera **dynamiczny token rejestracyjny** z API GitHuba i wpina runnera. Zero klikania w GUI.

## Akt 4: Hybrydowy Pipeline (To co tygrysy lubią najbardziej 🐅)

Mój pipeline w GitHub Actions to teraz majstersztyk optymalizacji:
1.  **Runner:** Lokalny LXC (Ryzen 2200GE).
2.  **Build:** Docker buduje obraz lokalnie.
3.  **Registry:** Obraz leci do `localhost:5000` (po LAN-ie, 1Gbps).
4.  **K3s:** Pobiera obraz z lokalnego IP `10.0.20.50`.

Zero czekania na upload do chmury. Zero opłat za transfer. Czysta prędkość.

## Akt 5: FQDN Hell i Błąd 503

Na koniec wjechał **Cloudflare Tunnel**. Aplikacja wstała, pody `Running`, a w przeglądarce... `503 Service Unavailable`.

Dlaczego? Bo w Kubernetesie nazwy są ważne.
Mój tunel próbował uderzyć do serwisu `http://blog-service`. Ale tunel był w innym Namespace niż aplikacja! Dla niego taki serwis nie istniał.

Musiałem użyć pełnej nazwy domeny klastrowej (FQDN):
`http://blog-service.dev.svc.cluster.local:80`

To jest ten moment, w którym rozumiesz, jak działa DNS w K8s.

## Podsumowanie

Dzisiejsza sesja to był rollercoaster.
*   Zbudowałem infrastrukturę jako kod (Terraform).
*   Zabezpieczyłem sekrety (Vault).
*   Zrozumiałem DNS w K8s (FQDN).
*   Mam własną chmurę CI/CD.

To jest właśnie **Endgame**. Nie idealny kod z tutoriala, ale działający, bezpieczny i (po wielu bólach) stabilny system, który znam na wylot.

W następnym odcinku? Może w końcu ten Prometheus, bo latanie po logach `kubectl` zaczyna męczyć. 😉

---
*Repozytorium: [GitHub](https://github.com/kompot-rar/Vibe_devops)*