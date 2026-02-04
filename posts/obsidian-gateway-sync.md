---
id: '8'
title: 'Obsidian Gateway: Jak spiąć ThinkPada, Homelab i Androida bez wystawiania serwera na świat.'
date: '2026-01-25'
tags: ['Obsidian', 'Syncthing', 'rclone', 'systemd', 'DevOps']
readTime: '6 min'
imageUrl: '/obsidian_gateway.png'
excerpt: 'Mój setup Obsidian 2.0. Używam Syncthinga do pracy lokalnej i rclone jako bramy do Google Cloud, by mieć dostęp do notatek na telefonie. Wszystko automatyzowane przez systemd timers.'
---

## Problem: Homelab za NAT-em a mobilność

Chciałem mieć dostęp do swoich notatek na ThinkPadzie i na telefonie. 
ThinkPad i Homelab siedzą bezpiecznie w sieci lokalnej, ale telefon jest "w dziczy".

Mój problem: **Mój Homelab jest za NAT-em.** Nie chcę wystawiać Syncthinga na świat, ani bawić się w ciągłe włączanie VPN-a na telefonie tylko po to, żeby zapisać listę zakupów. Potrzebowałem rozwiązania, które działa "w tle" i wykorzystuje cloud storage jako neutralny grunt.

## Rozwiązanie: Architektura "Gateway"

Zbudowałem system trójwarstwowy, używając Google Drive jako bufora wymiany danych:

1.  **Fast Lane (ThinkPad <-> Homelab):** Synchronizacja przez **Syncthing** w sieci lokalnej. Jak siedzę w domu, notatki lecą z laptopa na serwer w milisekundy.
2.  **The Bridge (Homelab <-> Google Drive):** Kilka razy dziennie serwer pcha zmiany do chmury używając `rclone`.
3.  **Mobile Access (Android <-> Google Drive):** Telefon łączy się bezpośrednio z Google Drive 

**Efekt:** Mam wygodę Google Drive na telefonie i prywatność/szybkość Syncthinga na komputerze. Rclone jest klejem, który to spina.

## Implementacja

### 1. Most Rclone 

Na serwerze mam skrypt `obsidian_gateway_sync.sh`, który robi "bi-directional sync". Najpierw ściąga to, co dopisałem na telefonie, a potem wysyła to, co napisałem na ThinkPadzie.

```bash
#!/bin/bash
set -euo pipefail
rclone sync gdrive:OBSIDIAN_VAULT ~/obsidian_vault --update
rclone sync ~/obsidian_vault gdrive:OBSIDIAN_VAULT --update
```

### 2. Automatyzacja (Systemd > Cron)

Zamiast starego poczciwego Crona, użyłem **systemd timers**. Dlaczego? Bo mam lepszą kontrolę nad logami (`journalctl`) i pewność, że serwis nie wystartuje, jeśli sieć leży.

Konfiguracja `~/.config/systemd/user/obsidian-sync.timer`:
```ini
[Unit]
Description=Run Obsidian Gateway Sync at 00:00, 12:00 and 20:05

[Timer]
OnCalendar=*-*-* 00,12:00:00
OnCalendar=*-*-* 20:05:00
Persistent=true
RandomizedDelaySec=5min

[Install]
WantedBy=timers.target
```

## Organizacja

Skoro już mamy techniczną synchronizację, warto wspomnieć o strukturze. Podpatrzyłem u **Mischa van den Burg** (którego mocno polecam każdemu DevOpsowi) świetne połączenie dwóch metod. Zacznijmy od **PARA** aby nie utonąć w morzu plików markdown:

*   **P**rojects (Projekty): Aktywne zadania z terminem (np. "Migracja klastra na nowe node'y").
*   **A**reas (Obszary): Stałe odpowiedzialności (np. "Dom", "Zdrowie", "Finanse").
*   **R**esources (Zasoby): Baza wiedzy i materiały (np. "Linux cheatsheet", "Notatki z książek").
*   **A**rchives (Archiwum): Skończone projekty i nieaktywne zasoby.

To pozwala mi utrzymać porządek w tym zsynchronizowanym chaosie. Ale sama struktura folderów to nie wszystko — tutaj wchodzi druga część workflow, którą również zaadaptowałem od Mischa:

## Zettelkasten: Moja sieć neuronowa wiedzy

O ile PARA służy do zarządzania *akcją* i *folderami*, o tyle **Zettelkasten** to system do budowania *wiedzy*. Każda notatka w sekcji "Resources" dąży do bycia:

1.  **Atomową:** Jedna myśl, jeden plik. Nie piszę elaboratów, tylko konkretne "cegiełki" wiedzy.
2.  **Połączoną:** Linkuję notatki między sobą. To tworzy graf powiązań, a nie tylko listę plików.
3.  **Własną:** Piszę ją swoimi słowami. Jeśli nie potrafię czegoś wyjaśnić w trzech zdaniach, znaczy, że tego nie rozumiem.

Dzięki Obsidianowi i linkom dwukierunkowym, widzę jak Docker łączy się z systemd, a networking z bezpieczeństwem. To nie jest tylko archiwum - to mój zewnętrzny mózg, który rośnie razem z moimi umiejętnościami DevOps.

## Narzędzia Power Usera: Vim & Canvas

Na koniec dwa "game changery", bez których nie wyobrażam sobie pracy:

1.  **Vim Mode:** Jako użytkownik Archa i ThinkPada, każda sekunda z ręką na myszce to sekunda stracona. Obsidian ma wbudowany tryb Vima. Nawigacja po notatkach `H/J/K/L` to czysta przyjemność i pamięć mięśniowa z terminala.
2.  **Obsidian Canvas:** Nieskończona tablica, na której łączę notatki, schematy i PDF-y. Tutaj mogę na przykład rozrysować sobie architekturę klastrów pod egzamin **CKA**. Widok zależności między Podami, Serwisami a Ingressami na jednym "płótnie" pozwala lepiej zrozumieć flow ruchu sieciowego.

## Architektura Synchronizacji

Oto jak w praktyce krążą moje notatki między urządzeniami:

```text
    +-----------------------+              +-----------------------+
    |   THINKPAD (Arch)     |              |   HOMELAB (Gateway)   |
    |   Syncthing (LAN)     | <==========> |   Syncthing + rclone  |
    |   (Notatki Lokalnie)  |  Local Mesh  |   (/media/ssd/vault)  |
    +-----------------------+              +-----------+-----------+
                                                       |
                                                       | rclone sync
                                                       | (00:00, 12:00, 20:05)
                                                       v
    +-----------------------+              +-----------------------+
    |   ANDROID (Mobile)    |              |     GOOGLE DRIVE      |
    |   FolderSync App      | <==========> |    (Neutral Ground)   |
    |   (Dostęp z terenu)   |  Cloud Sync  |    (Folder: NOTES)    |
    +-----------------------+              +-----------------------+
```

### Bulletproofing

1.  **Odporność na brak Internetu:** Jeśli zniknie sieć, laptop i serwer nadal synchronizują się po LAN przez Syncthing.
2.  **Brak otwartych portów:** Serwer nie jest wystawiony na świat. To on łączy się z chmurą jako klient.
3.  **Wydajność (I/O Tuning):** Dzięki `ionice -c 3` (klasa IDLE), synchronizacja nie zabija wydajności klastra NFS, nawet gdy dysk SSD jest mocno obciążony.
4.  **Wersjonowanie (Time Machine):** Na serwerze włączyłem "Staggered File Versioning". Jeśli coś skasuję przez pomyłkę na laptopie, serwer zachowa kopię w ukrytym folderze `.stversions`. 
5.  **Ewentualna spójność:** Zmiany z telefonu trafiają na laptopa 3 razy dziennie, co idealnie balansuje świeżość danych i bezpieczeństwo przed konfliktami.

## Podsumowanie

Ten setup to idealny balans między prywatnością a wygodą. Koszt? 0 zł. Satysfakcja z posiadania własnego "Data Bridge"? Bezcenna. 

**Lekcja na dziś:** Twój homelab nie musi być wystawiony na świat, żeby był użyteczny poza domem. Wystarczy dobra brama i odrobina automatyzacji. 🚀
