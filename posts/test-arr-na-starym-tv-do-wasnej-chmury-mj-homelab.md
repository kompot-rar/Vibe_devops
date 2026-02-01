---
id: '1'
title: 'TEST *Arr na starym TV do własnej chmury. Mój Homelab.'
date: '2026-01-06'
tags: ['Story', 'Wstęp', 'Omnie']
readTime: '6 min'
imageUrl: '/serwerownia2.jpg'
excerpt: 'Historia o tym, jak lenistwo i stary telewizor zaprowadziły mnie do świata DevOps, Proxmoxa i Terraform.'
---

Cześć! 👋 Witajcie w **DevOps Starter Hub**.

Moja fascynacja Linuxem i DevOpsem nie zaczęła się w serwerowni. Zaczęła się w dużym pokoju, od prostego, ludzkiego **lenistwa**.

### Wszystko zaczęło się od "Arr" 🏴‍☠️

Jakiś czas temu chciałem stworzyć domowe centrum rozrywki. Miałem stary telewizor i dość ręcznego kopiowania plików na pendrive'y. Odkryłem świat serwisów **Arr** (Radarr, Sonarr itp.) i Home Assistanta.

Chciałem tylko, żeby "samo się robiło".

Ale żeby to "samo się robiło", musiałem wejść głębiej.
- Nagle musiałem zrozumieć, czym są **porty**, żeby dostać się do panelu.
- Musiałem nauczyć się **Linuxowych uprawnień** (`chmod 777` to nie jest rozwiązanie!), bo serwisy nie mogły zapisywać plików na dysku.
- Odkryłem **Dockera**, bo instalowanie zależności ręcznie doprowadzało mnie do szału.

Wtedy zrozumiałem: to "dłubanie" w konfiguracji kręci mnie bardziej niż filmy, które potem oglądam. Zrozumiałem, że to, co robię w domu na małą skalę, na świecie nazywa się **DevOps**.

### Ewolucja: Od TV do ThinkCentre 🖥️

Tamten stary sprzęt poszedł w odstawkę. Dziś moje podejście jest bardziej dojrzałe, ale zasada ta sama: **pełna kontrola i automatyzacja**.

Mój obecny arsenał to nie przypadkowy złom, ale przemyślany, cichy i energooszczędny setup:

**1. Serce Operacji: Lenovo ThinkCentre Tiny**
Kupiłem poleasingowego "malucha", który mieści się w dłoni, ale ma w sobie moc prawdziwego serwera.
- **CPU:** AMD Ryzen 2200GE 
- **RAM:** 16GB DDR4
- **OS:** Proxmox VE

To tutaj Terraform stawia kontenery LXC, a Ansible konfiguruje Nginxa, który serwuje Wam tę stronę. Już nie "na pałę", ale zgodnie ze sztuką.

**2. Centrum Dowodzenia: Lenovo ThinkPad T14 g2**
Mój daily driver. Klasyka gatunku.
- **System:** Omarchy Linux (Arch Linux na sterydach)
- **Environment:** Hyprland
- **Vibe:** "I use Arch, btw" 😉

Praca na kafelkowym menedżerze okien (Hyprland) to dla mnie esencja produktywności. Terminal stał się moim domem.

### Co tu się będzie działo?

Ten blog to żywy dowód moich umiejętności. Ta strona, którą czytasz, nie wisi na gotowym hostingu. Stoi na moim ThinkCentre w Krakowie. Została zbudowana automatycznie przez **GitHub Actions**, wdrożona przez **Self-Hosted Runnera**, a wszystko zdefiniowane jako **Infrastructure as Code**.

Będę tu dokumentował moją podróż:
- Od prostych skryptów Bashowych,
- Przez konteneryzację aplikacji,
- Aż po orkiestrację klastrów (kiedyś).

Jeśli szukasz inżyniera, który uczył się na błędach produkcyjnych we własnym domu, a nie tylko z podręcznika – jesteś w dobrym miejscu.

**Code is Law. Terminal is Home.** 🚀