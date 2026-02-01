---
id: '7'
title: 'Jak odciąłem sobie internet i zbudowałem Fortecę'
date: '2026-02-01'
tags: ['Networking', 'Security', 'LXC', 'iptables']
readTime: '15 min'
imageUrl: '/network.png'
excerpt: 'Moja podróż przez meandry sieci komputerowych: od totalnego chaosu do bezpiecznej, posegmentowanej infrastruktury opartej na VLANach i Alpine Linux jako routerze.'
---

## 1. Konfrontacja z Przeszłością: Dlaczego Płaska Sieć Musiała Zostać Zaorana?
Pierwsze co chciałem zrobić w **Homelab 2.0** to porządek z sieciami. Zanim na poważnie zabiorę się za Kubernetesa, chcę mieć pełną konfigurację i jej całkowite zrozumienie. Do nauki wykorzystałem posiadane już usługi **\*Arr**, których zależności znam na wylot, dzięki czemu mogłem skupić się wyłącznie na samej architekturze. 

Wiedziałem, że poleje się krew. Sieci były do tej pory moim kryptonitem. To właśnie przez błędy w konfiguracji interfejsów sieciowych reinstalowałem system **kilkukrotnie**, gdy po raz pierwszy stawiałem Dockera bare-metal. Ta frustracja pchnęła mnie ostatecznie w ramiona **Proxmoxa**. Ale tym razem nie szukałem drogi na skróty. Postanowiłem wejść prosto w paszczę lwa i zbudować sieć **The Hard Way**. Żadnych wizardów, czysty routing. Czas wyrównać rachunki.

## 2. Architektura: The Great Wall
Zamiast kupować drogi router albo stawiać ciężkie VM z OPNsense, postanowiłem zrobić to **The Hard Way** – używając czystego Linuxa.

- **Hardware:** Netgear GS108T v2
- **Router:** Kontener LXC Alpine Linux

**Segmentacja:**
- **VLAN 1 (Untrusted):** Sieć domowa i WiFi z routera ISP. Stąd chińskie żarówki wifi mogą dzwonić do Pekinu.
    - **VLAN 10 (MGMT):** Proxmox, Switch, Router. Dostęp tylko dla wybranych.
    - **VLAN 20 (APPS):** Jellyfin, *Arr, kontenery. Dostępny dla domowników, ale odizolowany od MGMT.
    - **VLAN 30 (SECURE):** Vault, SSH CA, wrażliwe dane. Odcięty od świata.

## 3. Implementacja: Linux to najlepszy router
Dlaczego LXC? Bo startuje w 2 sekundy i zużywa tyle zasobów co nic.
Co pod maską?
  - **dnsmasq:** DHCP i DNS dla każdego VLANu osobno.
  - **iptables:** Stara szkoła. Polityka `DROP FORWARD`. Wszystko co nie jest dozwolone, jest zabronione.
  - **Interfejsy:** Proxmox Bridge jako `VLAN-aware`, w środku kontenera `eth1` (vlan 10), `eth2` (vlan 20)...

### 3.1. Techniczne Judo: Tagowanie i Stan
Zamiast stawiać osobną instancję DHCP dla każdego VLANu, użyłem **DHCP Tagging** w dnsmasq. Dzięki temu jeden plik config obsługuje całą sieć, a pakiety nie "wyciekają" między strefami:

```bash
# VLAN 20 (APPS) - Tagowanie interfejsu eth2
interface=eth2
dhcp-range=set:apps,10.0.20.100,10.0.20.200,255.255.255.0,12h
dhcp-option=tag:apps,option:router,10.0.20.1
```

W iptables kluczowym elementem był **Stateful Inspection**. Bez tej jednej linijki ruch byłby jednokierunkowy (pakiety by wychodziły, ale odpowiedzi byłyby blokowane):
```bash
iptables -A FORWARD -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
```
To sprawia, że firewall "pamięta" nawiązane połączenia i automatycznie wpuszcza ruch powrotny. Proste, eleganckie, skuteczne.

### Fragment konfiguracji ("The Code"):
```bash
# Magic Door - wpuszczaj mój laptop po MAC adresie do strefy śmierci
iptables -A FORWARD -i eth0 -o eth3 -m mac --mac-source xx:xx:xx:xx:xx:xx -j ACCEPT
```

## 4. Lekcja Pokory: Protokół Próby Ognia
To nie poszło gładko. To była 4-dniowa wojna z warstwą drugą i trzecią modelu OSI.

 ![Lekcja Pokory](/network_warzone0.jpg) 

### A. Port Ratunkowy (The Airlock)
Pierwsza zasada VLANów: Jak zmieniasz PVID na porcie, do którego jesteś wpięty – tracisz dostęp. Zrobiłem to trzy razy.
**Rozwiązanie:** Port 8 na switchu skonfigurowany jako **Emergency Port** (Untagged VLAN 10). Fizyczny kabel, który ratuje życie, gdy WiFi milczy. A mimo to, kilkukrotnie i tak musiałem zapinać **HDMI** bezpośrednio do nodów, bo poziom "całkowitej anihilacji", który serwowałem interfejsom sieciowym, wykraczał poza możliwości jakiegokolwiek portu ratunkowego.

### B. Routing Asymetryczny i "The Masquerade Hack"
To był boss tej lokacji. Moja trasa wyglądała tak:
1. Laptop wysyła pakiet do `10.0.20.107` (Jellyfin) przez Router LXC (Brama .123).
2. Pakiet dociera do Jellyfina.
3. Jellyfin widzi IP laptopa (`192.168.1.15`). Ponieważ to inna podsieć, wysyła odpowiedź do swojej bramy domyślnej... którą był router domowy (ISP).
4. Router ISP patrzy na pakiet do `10.0.20.x` i mówi: "Nie znam gościa". **DROP.**

**Fix:** Zastosowałem `MASQUERADE` na interfejsach wewnętrznych routera LXC. Dla Jellyfina pakiet wygląda teraz tak, jakby przyszedł od Routera LXC (`10.0.20.1`), więc odpowiedź wraca do Routera, a ten przesyła ją do laptopa. To podręcznikowy przykład, jak rozwiązywać problemy z routingiem w sieciach, nad którymi nie masz pełnej kontroli (brak możliwości dodania tras na routerze ISP).

### C. The Reboot of Death (Persistence)
Kiedy w końcu wszystko działało, dumnie zrobiłem `reboot`. I... ciemność. Cluster padł, sieć zniknęła.
**Lekcja:** Alpine LXC jest ultra-lekki, ale "zapominalski". Zapomniał załadować `ip_forward=1` i reguły `iptables`.
**Rozwiązanie:** Musiałem ręcznie wymusić start serwisu `sysctl` w boot-loopie i zapisać reguły do `/etc/iptables/rules-save`. Od teraz każda zmiana musi być poprzedzona `/etc/init.d/iptables save`.

### D. Proxmox VLAN-aware Bridge
Zanim w ogóle zacząłem, musiałem przygotować samo podwozie sieciowe. Standardowy bridge w Proxmoxie to "ślepy" switch. Musiałem go przełączyć w tryb **VLAN-aware**. To pozwoliło mi na podpinanie kontenerów do konkretnych VLANów bezpośrednio w konfiguracji noda, bez uprawiania partyzantki z sub-interfejsami wewnątrz każdego kontenera.

## 5. Wnioski
Moja sieć domowa jest teraz bezpieczniejsza niż większość małych firm. Fundamenty są wylane, beton związał. Klęczenie o 3 rano przed klastrem z kablem HDMI w ręku, patrząc na martwe diody switcha i próbując zrozumieć, dlaczego routing asymetryczny właśnie zabił mój dostęp po SSH, nauczyło mnie więcej niż jakikolwiek certyfikat. Teraz wiem dokładnie, co dzieje się z każdym bitem w moim klastrze.

**Status:**
*   **Networking:** READY.
*   **Kubernetes:** READY FOR DEPLOYMENT.
*   **The Hidden Fortress (Vault SSH CA):** INITIALIZING...

Następny przystanek: Efemeryczne certyfikaty SSH i orkiestracja.