---
id: '6'
title: 'HOMELAB 2.0: Architektura Totalna. Od Druku 3D po Kubernetes.'
date: '2026-02-01'
tags: ['Bare Metal', '3D Printing', 'Chaos Engineering', 'Homelab', 'Hardware']
readTime: '15 min'
imageUrl: '/homelab_cluster_rack.jpg'
excerpt: 'Zbudowałem własne Data Center w szafie 10 cali – od druku 3D mocowań, przez walkę z umierającym dyskiem, aż po klaster HA.'
---

### Prolog: Dar od Boga Chaosu

Znalazłem go, przy kontenerach na odpady - roztrzaskany laptop gamingowy.
Wyjąłem z niego dysk SSD, wsadziłem do klastra i odpaliłem `smartctl -a`.
Wynik?
Czerwona ściana tekstu.
- **Reallocated Sector Count:** Wyczerpane.
- **Available Spare Areas:** 0%.
- **Life Remaining:** 20%.

Każdy "racjonalny" człowiek wyrzuciłby go z powrotem do kosza.

**Ja się uśmiechnąłem.**

Uczyniłem z niego Generator Entropii. Zamiast symulować awarie w chmurze (jak Netflixowy Chaos Monkey), zostwiłem ten dysk w klastrze. Teraz Kubernetes musi radzić sobie z fizyczną degradacją sprzętu w czasie rzeczywistym. To najlepszy poligon testowy dla mechanizmów Self-Healing, jaki mogłem sobie wymarzyć.

### Akt 1: The Monolith (Szafa 10" 6U) 
Mój dotychczasowy homelab – tylko jeden terminal i router generował już wystarczający nieporządek. Skalowanie tego bałaganu razy trzy nie wchodziło w grę, jeśli chciałem zachować spokój w domu. Rozwiązaniem stała się czarna, 10-calowa szafa Rack 6U. Sięgnąłem teź po **Open Source Hardware**.
Znalazłem idealne modele 3D do moich terminali, przetopiłem trochę plastiku i uzyskałem dopasowane panele frontowe ukrywając chaos i zmieniając stertę starej elektroniki w monolit.

### Akt 2: Żelazna Trójca 

**"Jeden serwer to hobby a trzy to klaster."**

Chciałbym napisać, że z premedytacją postawiłem na infrastrukturę heterogeniczną, by sprawdzić, jak
scheduler Kubernetesa poradzi sobie z żonglowaniem workloadem między maszynami o drastycznie różnej wydajności. Ale bądźmy szczerzy – to czysty przypadek (i okazje na Allegro).

- **Node 01 (Overlord):** AMD Ryzen 2200GE.
- **Node 02 (Workhorse):** Intel i5.
- **Node 03 (Arbiter):** Legacy i3.

### Akt 3: Sieć to Prawo (VLANs & Firewall) 
Netgear GS108T nie jest najseksowniejszym sprzętem na świecie. Jego interfejs WWW pamięta czasy
Windowsa XP. Ale **robi robotę**. Jest stabilny i uczy jak panować nad ruchem sieciowym na poziomie warstwy drugiej (L2). W świecie chmury koncepcje są te same, tylko kable są wirtualne. Zrozumienie tego na fizycznym sprzęcie to fundament, którego nie da się pominąć.

![Homelab Setup](/homelab2-0.jpg)