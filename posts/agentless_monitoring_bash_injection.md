---
id: '3'
title: 'Monitoring "Zero-Dependency" wstrzykiwany przez SSH'
date: '2026-02-03'
tags: ['Bash', 'DevOps', 'Monitoring', 'Linux', 'Automation', 'Proxmox']
readTime: '8 min'
imageUrl: '/agentless-monitoring-banner.png'
excerpt: 'Zanim wdrożymy "Święty Graal" każdego DevOpsa, czyli stack Prometheus + Grafana, zrobimy krok wstecz. Zobacz jak monitorować serwery bez agentów, używając tylko SSH i Basha.'
---

##  Rozgrzewka przed Prometheusem

Zanim wdrożymy "Święty Graal" każdego DevOpsa, czyli stack **Prometheus + Grafana** (co jest w planach na Q3), zrobimy krok wstecz. Albo raczej – krok w głąb.
Nie chce czytać gotowych wykresów, ale wykładać się na prostym pytaniu: *"Skąd właściwie Linux wie, jakie jest zużycie CPU?"*.

Traktuj ten projekt jako **trening interwałowy z Basha**.
Moim celem nie jest budowanie konkurencji dla Datadoga. Celem jest "Muscle Memory" w obszarach basha:
1.  **Nested Commands:** Jak łączyć potoki, warunki i strumienie w sposób, który przetrwa na produkcji.
2.  **SSH Streams:** Jak wstrzyknąć kod na zdalną maszynę bez kopiowania plików (`scp`).
3.  **Linux Internals:** Wyciąganie surowych danych z `/proc/loadavg` czy `/sys/class/thermal` przy pomocy `awk`.


##  Metoda: Bash Injection "Zero-Dependency"

Zamiast instalować pakiety i otwierać porty, użyłem starej szkoły Unixa. Nie musisz kopiować skryptu na serwer, nadawać mu uprawnień i go uruchamiać. Możesz **wstrzyknąć** kod prosto do procesu powłoki na zdalnej maszynie.

```bash
ssh user@remote-server 'bash -s' < my_local_script.sh
```

To jedno polecenie robi wszystko:
1.  Nawiązuje sesję.
2.  Uruchamia Basha w trybie czytania ze strumienia (`-s`).
3.  Przekazuje lokalny plik jako stdin.
4.  Wykonuje się w pamięci RAM zdalnego serwera.
5.  Zwraca wynik na Twój terminal.
6.  Nie zostawia śladu na dysku (poza logami SSH).

##  The Overseer V5: Anatomia Skryptu

To nie jest "magia". To czysta znajomość systemu plików `/proc` i `/sys`.
Oto co siedzi pod maską mojego skryptu `healthcheck.sh`. Każda funkcja to oddzielna lekcja z Linux Internals.

### 1. Hardware ID (DMI)
Skąd system wie, że jest uruchomiony na Lenovo M710q?
Z **DMI** (Desktop Management Interface).
```bash
cat /sys/class/dmi/id/product_name
```
Używam tego, żeby od razu wiedzieć, na który węzeł patrzę.

### 2. CPU Load & RAM (Matematyka w Awk)
Nie używamy `top` ani `htop`, czytamy surowe pliki.

*   **Load Average:** `/proc/loadavg` (pierwsza kolumna).
*   **RAM:** Polecenie `free` (bo parsowanie `/proc/meminfo` jest bolesne w czystym Bashu).
*   **Obliczenia:** Bash nie obsługuje liczb zmiennoprzecinkowych. Do dzielenia używamy `awk`.
    ```bash
    # Oblicz % użycia CPU na podstawie LoadAvg i liczby rdzeni
    local cpu_pct=$(awk -v l="$load" -v c="$cores" 'BEGIN { printf "%.0f", (l/c)*100 }')
    ```

### 3. Temperatura CPU (Intel vs Ryzen)
To był ból. Każdy producent trzyma temperaturę gdzie indziej.
Mój skrypt skanuje w poszukiwaniu prawdy:
1.  Szuka w `/sys/class/thermal/thermal_zone*` (Standard Linuxa).
2.  Jeśli wynik to 0, szuka w `/sys/class/hwmon/hwmon*` (Sensory sprzętowe - Ryzen k10temp / Intel coretemp).
3.  Czyta plik `temp1_input`, dzieli przez 1000 (bo wynik jest w milistopniach) i ma wynik w Celsjuszach.

### 4. Proxmox Awareness (API CLI)
Skrypt sprawdza: *"Czy mam zainstalowane komendy `pct` i `qm`?"*
Jeśli tak -> Uruchamia je, zlicza linie (`grep -c running`) i wyświetla statystyki kontenerów i maszyn wirtualnych.
Jeśli nie -> Pomija sekcję (działa też na zwykłym Debianie/Archu).

### 5. ZFS & Storage (Krytyczne!)
*   **ZFS:** `zpool status -x`. Jeśli wynik to cokolwiek innego niż "all pools are healthy" -> **CZERWONY ALERT**.
*   **Disk Usage:** `df -h`. Ale uwaga – filtruję pętle (`/loop`), które tworzy `snapd`, żeby nie zaśmiecać widoku.

### 6. Systemd Sentinel
Czy coś "umarło"?
```bash
systemctl --failed --no-legend --plain | wc -l
```
To komenda, którą powinien znać każdy admin. Pokazuje serwisy w stanie `failed`. Jeśli wynik > 0, skrypt wypisuje ich nazwy na czerwono.

### 7. Unicode Bar Charts (Bajer)
Najtrudniejsza część? Rysowanie pasków postępu w terminalu:
`[■■■■■·····] 50%`
Funkcja `get_bar` to pętla `for`, która dokleja odpowiednią ilość kwadracików w zależności od procentów. Czysta estetyka, ale jak cieszy oko.

###  Ciekawostka: Efekt Obserwatora (Heisenbug)

Podczas testów na starym Lenovo M83 (i3-4130T) zauważyłem dziwne zjawisko. Skrypt pokazywał, że proces `systemd-timedated` zużywa 40% CPU.
Okazało się, że mój własny skrypt był przyczyną!
1.  Funkcja sprawdzająca NTP wołała `timedatectl`.
2.  To budziło demona `systemd-timedated`.
3.  Milisekundę później funkcja sprawdzająca procesy (`ps`) robiła "zdjęcie" i łapała ten moment wybudzenia.

**Fix:** Musiałem dodać filtrowanie "szumu obserwatora" (`grep -v systemd-timedated`), aby nie fałszować wyników. To ważna lekcja: **Monitoring zawsze kosztuje zasoby.**

##  Skalowanie - Dynamic Discovery

Początkowo do skanowania wszystkich maszyn z klastra używałem pliku `inventory.txt`, ale po co hardcodować adresy IP, skoro klaster sam wie, z kogo się składa?
Oto one-liner, który łączy się z Masterem, pobiera adresy IP wszystkich nodów z konfiguracji Corosync (`/etc/pve/corosync.conf`) i natychmiast je skanuje.

```bash
ssh -q root@10.0.10.11 "grep -oP 'ring0_addr:\s*\K.*' /etc/pve/corosync.conf" | while read ip; do 
  echo -e "\n--- SCAN $ip ---"; 
  ssh -o ConnectTimeout=2 root@$ip 'bash -s' < scripts/healthcheck.sh;

done
```

### Wynik 

```text
--- SCAN 10.0.10.11 ---
>> OVERSEER: proxmox << | 10VHS2BU02 | up 2 days, 13 hours, 32 minutes
─────────────────────────────────────────────────────────────────────
 CPU [■■········]  20%  |  RAM [■■■■■·····]  59%  |  TMP [■■■■■·····]  50°C
─────────────────────────────────────────────────────────────────────
 GUESTS:  CT: 14 RUN / 1 STOP   |   VM: 2 RUN / 0 STOP
─────────────────────────────────────────────────────────────────────
 [ZFS] NONE
 /            [■■■■■■■■■···]  77% (1.2T/1.7T)
 /boot/efi    [■···········]  10% (96M/1022M)
 /media/ssd   [■···········]  10% (171G/1.9T)
 /etc/pve     [············]   1% (48K/128M)
─────────────────────────────────────────────────────────────────────
 SYS: 1 FAIL | LOGS(1h): 4 ERR | USERS: 1 | NTP: YES
 FAILED UNITS:
  -> pve-container@108.service
 PORTS: 111 1900 2049 22 25 323 35988 37437 37625 38907 39527 41925 42307 42481 47686 5405 57009 603 60457 8200 85
─────────────────────────────────────────────────────────────────────
 CPU TOP 3:
  2252448   101%  /usr/bin/perl
   5504  12.9%  /usr/bin/kvm
   4077   4.2%  /usr/bin/qbittorrent-nox
 RAM TOP 3:
   1990  20.7%  /usr/bin/kvm
   5504  13.3%  /usr/bin/kvm
   4077   4.8%  /usr/bin/qbittorrent-nox


--- SCAN 10.0.10.12 ---
>> OVERSEER: proxmox-worker << | 10MQS2LQ00 | up 2 days, 13 hours, 32 minutes
─────────────────────────────────────────────────────────────────────
 CPU [··········]   2%  |  RAM [■·········]  10%  |  TMP [■■■■······]  44°C
─────────────────────────────────────────────────────────────────────
 GUESTS:  CT: 0 RUN / 0 STOP   |   VM: 1 RUN / 1 STOP
─────────────────────────────────────────────────────────────────────
 [ZFS] NONE
 /            [■···········]  14% (5.1G/39G)
 /boot/efi    [············]   1% (8.8M/1022M)
 /etc/pve     [············]   1% (48K/128M)
─────────────────────────────────────────────────────────────────────
 SYS: 2 FAIL | LOGS(1h): 1 ERR | USERS: 1 | NTP: YES
 FAILED UNITS:
  -> pve-guests.service
  -> pvescheduler.service
 PORTS: 111 22 25 323 5405 85
─────────────────────────────────────────────────────────────────────
 CPU TOP 3:
  198656   0.9%  /usr/sbin/corosync
   9918   0.3%  pvestatd
  362738   0.3%  pve-firewall
 RAM TOP 3:
  198656   1.1%  /usr/sbin/corosync
   9937   1.0%  pveproxy
  214014   0.9%  pveproxy


--- SCAN 10.0.10.13 ---
>> OVERSEER: proxmox-worker-2 << | 10E9S01Y00 | up 2 days, 13 hours, 32 minutes
─────────────────────────────────────────────────────────────────────
 CPU [··········]   2%  |  RAM [■·········]  10%  |  TMP [■■········]  27°C
─────────────────────────────────────────────────────────────────────
 GUESTS:  CT: 0 RUN / 0 STOP   |   VM: 1 RUN / 0 STOP
─────────────────────────────────────────────────────────────────────
 [ZFS] NONE
 /            [············]   6% (4.0G/73G)
 /boot/efi    [············]   1% (8.8M/1022M)
 /etc/pve     [············]   1% (48K/128M)
─────────────────────────────────────────────────────────────────────
 SYS: 0 FAIL | LOGS(1h): 11 ERR | USERS: 1 | NTP: YES
 PORTS: 111 22 25 323 5405 85
─────────────────────────────────────────────────────────────────────
 CPU TOP 3:
  377332   0.8%  /usr/sbin/corosync
   1049   0.3%  pvestatd
   1050   0.2%  pve-firewall
 RAM TOP 3:
  377332   1.1%  /usr/sbin/corosync
   1095   1.0%  pveproxy
  403709   0.9%  pveproxy
```

## 🎮 Bonus: Overseer UI

Kiedy już opanowałem surowe dane, nie mogłem się powstrzymać przed odrobiną zabawy. Skoro mamy agentless monitoring, to dlaczego by nie ubrać go w coś, co wygląda jak okno z demo sceny?

Stworzyłem `overseer_ui.py` – dashboard w Pythonie wykorzystujący bibliotekę `rich`. Skrypt w pętli odpytuje wszystkie nody klastra, wstrzykując im mikroskopijnego "agenta" w locie. Efekt? Dynamiczna tabela z animowanymi paskami postępu.

**Szczera prawda:** Użyteczność tego rozwiązania jest bliska zeru. W prawdziwej awarii patrzysz w logi lub dostajesz powiadomienie na telefon, a nie gapisz się w terminal. Ale jako projekt "for fun" i sposób na naukę biblioteki `rich` – sprawdza się idealnie. Czasem warto zrobić coś po prostu dlatego, że wygląda fajnie.


---

### 📂 Kod źródłowy
Wszystkie pliki skryptów, o których wspomniałem (Overseer V5, UI, Inventory Discovery), są dostępne na moim repozytorium na GitHubie.

![Agentless Monitoring Banner](/agentless-monitoring-banner.png)
