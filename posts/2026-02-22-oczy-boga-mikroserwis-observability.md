---
id: '19'
title: 'Oczy Boga: Jak przekułem agonię dysku w projekt Observability'
date: '2026-02-22'
tags: ['Kubernetes', 'Prometheus', 'Chaos Engineering', 'SRE', 'GitOps']
readTime: '5 min'
imageUrl: '/observability-banner.png'
excerpt: 'Jak zamienić agonię sprzętu w interaktywny projekt Observability? Dowiedz się, jak monitoruję umierający dysk SSD w moim klastrze.'
---

# 🚀 Tętno Homelaba: Gdy hardware zdycha

Większość ludzi panikuje, gdy ich serwer zaczyna sypać błędami I/O. Ja poczułem ekscytację. Gdy mój trzeci node (Lenovo Tiny) zaczął "krzyczeć" błędami w logach, wiedziałem jedno: **Mamy idealnego ochotnika do Chaos Monkey.**

Mając już postawiony pełny stack **Observability (Grafana + Prometheus)**, który monitoruje każdy oddech klastra, uznałem, że czas na odrobinę zabawy. Skoro i tak widzę wszystko wewnątrz, dlaczego nie stworzyć małego projektu – **Playgroundu na blogu**, który pokaże "na żywo", jak hardware walczy o przetrwanie? Tak powstał **Status-Proxy** – mikroserwis, który zamienia śmierć krzemu w publiczny dowód odporności systemu.

## 🏗️ Geneza: "Dysk ze śmietnika" jako Generator Entropii

W moim klastrze nic się nie marnuje. Trzeci węzeł dostał dysk SSD Crucial MX300, który już dawno powinien być zutylizowany. To był świadomy wybór: **wprowadzenie kontrolowanego chaosu do klastra.**

*   **Problem:** Dysk raportuje ponad **12,000 błędów ECC**. To nie jest awaria, to powolne gnicie danych (bit-rot).
*   **Możliwość:** Zamiast to naprawiać, wystawiłem te "bebechy" na bloga. Nie po to, żeby pokazać nudne statystyki, ale żeby stworzyć interaktywny dashboard agonii sprzętu.

---

## 🛠️ Architektura: Most nad przepaścią

Zasada **Zero Trust** jest u mnie święta. Nie wystawiam Prometheusa na świat.  Zastosowałem wzorzec **Internal API Proxy**:

1.  **Backend (Node.js/Express):** Moje Observability. Mikroserwis siedzi wewnątrz klastra, odpytuje Prometheusa i filtruje dane.
2.  **Filtracja:** Wyciągam tylko to, co istotne – temperatury, błędy I/O, latencję zapisu. Reszta kopalni wiedzy zostaje bezpiecznie za firewall-em.
3.  **Transport:** **Cloudflare Tunnel**. Zero otwartych portów. Blog pyta o endpoint `/api/status`, a Cloudflare przekierowuje to bezpośrednio do klastra przez bezpieczny tunel.

---

## ☢️ Chaos Engineering w praktyce 

Dzięki temu, że dysk w Node 3 faktycznie zdycha, mój blogowy playground nie jest statycznym obrazkiem. To jest **Live Forensic**:

*   **Write Latency Monitor:** Gdy dysk zaczyna mulić próbując zapisać dane w uszkodzonych komórkach, mikroserwis wykrywa skok opóźnienia.
*   **Radioactive Mode:** Napisałem logikę, która przyznaje node'owi status `Radioactive`. Jeśli błędy ECC rosną, API automatycznie raportuje: *"Chaos Monkey engaged: Node 3 hardware degradation detected"*.

### Co się dzieje w Kubernetesie?
Dzięki temu widzę na żywo, jak Scheduler reaguje na błędy. Czy pody zostaną przeniesione? Czy `livenessProbe` zabije kontener, który nie może zapisać logów na umierającym SSD? To jest prawdziwe **SRE (Site Reliability Engineering)**.

---

## 🧠 Logika

Każdy potrafi wystawić `Hello World`. Ja wystawiam **Stan Świadomości Klastra**:

*   **Self-Healing Tracking:** Mikroserwis analizuje restarty podów. Jeśli system sam się podniósł po błędzie I/O dysku, API dumnie raportuje: *"Automated recovery successful"*.
*   **Golden Signals:** Monitoruję nie tylko błędy, ale i nasycenie zasobów.

### Przykładowy Payload:
```json
{
  "cluster": {
    "status": "Chaos Mode",
    "alerts": ["Critical: Disk ECC Failure on Node 3"],
    "message": "Node 3 is screaming, but Kubernetes is holding the line. Automated recovery active.",
    "chaos_score": "9/10",
    "lastUpdate": "2026-02-22T15:00:00Z"
  }
}
```

---

## 💡 Czego mnie to nauczyło?

Ten projekt to nie tylko kod. To zmiana myślenia:
1.  **Awaria to dane.** Nie naprawiaj od razu – najpierw ometrykuj, żeby zrozumieć mechanizm upadku.
2.  **GitOps jest fundamentem.** Cały ten stack (Proxy, Prometheus, Ingress) wstaje z kodu dzięki **ArgoCD**. 
3.  **Security przez warstwy.** Nigdy nie ufaj sieci publicznej.

**Ryzen pozdrawia, Intel czuwa, a SSD z Node 3 powoli odchodzi do Valhalli, raportując każdy swój błąd do mojego bloga.** 

To jest właśnie potęga Observability i frajda z posiadania własnego **Playgroundu**.
