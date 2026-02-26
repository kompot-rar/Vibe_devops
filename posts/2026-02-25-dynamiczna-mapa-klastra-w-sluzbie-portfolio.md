---
id: '20'
title: 'Gdzie ja właściwie jestem? Dynamiczna mapa klastra w służbie portfolio'
date: '2026-02-25'
tags: ['Kubernetes', 'K3s', 'Observability', 'Homelab', 'RBAC', 'DevOps']
readTime: '6 min'
imageUrl: '/dynamic-map-k3s-banner.png'
excerpt: 'Zabawa z Prometheusem przerodziła się w dynamiczny dashboard monitoringu klastra. Zobacz jak zaimplementowałem wzorzec BFF, RBAC i Downward API w K8s.'
---

Zabawa z Prometheusem i rzeźbienie własnych modułów observability hostowanych prosto na blogu wciągnęło mnie na ładnych parę dni. Zaczęło się niewinnie – prosty projekt, który miał tylko na żywo monitorować powolną agonię mojego starego SSD wyciągniętego ze śmietnika. Zgadnijcie co? Zamiast prostego skryptu, wyewoluowało to w pełnoprawny, dynamiczny dashboard monitoringu całego klastra. Bo w świecie homelabów  słowo *overkill* po prostu nie istnieje. 😉

Tym sposobem mój blog przestał być zwykłą "czarną skrzynką". Postawiłem sobie cel: chcę widzieć na żywo topologię mojego k3s i wiedzieć dokładnie, z którego fizycznego węzła i konkretnego poda aktualnie serwowany jest ruch.


## 1. Problem: Ograniczona widoczność (Cloudflare & Tunnels)

Mój blog wystawiony jest na świat przez Cloudflare Tunnel. Ze względów bezpieczeństwa mam otwartą tylko jedną, wąską ścieżkę do API w klastrze: `/api/status`. Nie uśmiechało mi się rekonfigurować całej sieci i dziurawić tunelu nowymi endpointami tylko po to, by dodać nowy moduł z metrykami.

**Decyzja:** Zastosowałem wzorzec **BFF (Backend For Frontend)**. 
Zamiast stawiać od zera nową aplikację i przepychać ją przez reguły sieciowe Ingressa, po prostu "doładowałem" moje istniejące `status-proxy`. Teraz jeden strzał do `/api/status` ściąga i agreguje absolutnie wszystko: od temperatury procesorów z Prometheusa, przez logi Cloudflare, aż po pełną topologię klastra Kubernetes. Czysto, bezpiecznie i optymalnie.

## 2. Bezpieczeństwo przede wszystkim (RBAC)

Proxy potrzebowało uprawnień, żeby móc zapytać API serwer Kubernetesa: *"Hej, jakie masz nody i pody?"*. 
Oczywiście nie ma mowy o pójściu na łatwiznę i podpinaniu domyślnego tokena z uprawnieniami admina.

Stworzyłem dedykowany `ServiceAccount` i restrykcyjną `ClusterRole`.
Proxy może wyłącznie listować i oglądać (`get`, `list`, `watch`) obiekty typu `pods` i `nodes`. Nic więcej. Zero uprawnień do modyfikacji, zero dostępu do sekretów innych aplikacji. Zasada **Least Privilege** w czystej, inżynieryjnej postaci.

## 3. Tożsamość Poda (Downward API + InitContainers)

To był chyba najciekawszy element układanki tego projektu. Obraz mojego bloga to aplikacja **immutable**. Buduję ją raz w CI/CD GitHub Actions, wypycham do rejestru GHCR i gotowe. Ale żeby dynamiczna mapa działała, każdy utworzony Pod tuż po wystartowaniu musi wiedzieć, jak się nazywa, by móc z dumą ogłosić frontendowi: *"To ja Cię obsługuję!"*.

Rozwiązałem to bez łamania koncepcji immutable image:

*   **Downward API:** Wstrzyknąłem nazwę poda bezpośrednio do zmiennych środowiskowych, wyciągając ją prosto z metadanych Kubernetesa.
*   **InitContainer & emptyDir:** Przy starcie poda odpala się malutki kontener poboczny (`busybox`). Jego jedynym zadaniem jest chwycić tę zmienną i zapisać ją do pliku `env.js` na tymczasowym wolumenie w pamięci RAM (`emptyDir`).
*   Ten wolumen jest następnie współdzielony z głównym kontenerem aplikacji. Frontend na starcie po prostu wczytuje skrypt `<script src="/config/env.js">`.

**Efekt?** Aplikacja w przeglądarce od razu wie, że jej tożsamość to na przykład `blog-prod-5c6d99`. Zero zbędnych, dodatkowych zapytań do API Kubernetesa z poziomu klienta!

### 3.5. Zderzenie ze ścianą: Cloudflare Cache vs Dynamiczny Pod

Zanim jednak otworzyłem szampana, brutalnie zderzyłem się z rzeczywistością. Cała moja genialna idea przekazywania nazwy poda do strony wywaliła się na plecy w momencie, gdy Cloudflare ochoczo zacache'ował pierwszy wygenerowany plik `env.js` (oraz odpowiedzi z proxy). W efekcie, niezależnie na który węzeł fizycznie trafiałem, przeglądarka uparcie serwowała mi stare, zamrożone na brzegu sieci (Edge) dane. 

To była bolesna, ale super przydatna lekcja zarządzania ruchem. Musiałem głębiej wejść w ustawienia *Cache Rules* na Cloudflare, żeby chirurgicznie wyłączyć cachowanie dla ścieżki `/config/env.js` oraz moich endpointów API. Teraz statyczny build bloga nadal leci z CDN-a z prędkością światła, ale topologia na żywo faktycznie jest... na żywo.

## 4. Kształt danych JSON z myślą o frontendzie

Na koniec dopracowałem strukturę JSON-a ze status-proxy, żeby była maksymalnie strawna i gotowa do użycia przez frontend (React/TypeScript). Pody są od razu strukturalnie pogrupowane wewnątrz węzłów, a na samym końcu dorzucam obiekt `whoami` (dane poda, który fizycznie obsługuje aktualny request).

```json
{
  "topology": {
    "nodes": [
      {
        "name": "m83-worker",
        "status": "True",
        "pods": [
          { "name": "blog-devops-prod-abc123", "status": "Running" }
        ]
      }
    ]
  },
  "whoami": { 
    "pod": "status-proxy-xyz", 
    "node": "m710-master" 
  }
}
```

## Co z tego mam?

Szczerze? Miało być proste wrzucenie wskaźnika dysku na stronę, a skończyło się na dłubaniu w RBAC-u, kombinowaniu z cachem CDN i wstrzykiwaniem zmiennych do podów. 

Dostałem tonę frajdy i nauczyłem się w praktyce rzeczy, o których wcześniej tylko oglądałem na youtube. O to przecież chodzi – żeby coś zepsuć, spędzić pół nocy na debugowaniu logów, a na koniec poczuć satysfakcję, że jednak działa. 

Teraz jak robię *Rolling Update* z poziomu terminala, mogę na żywo patrzeć, jak klocki w klastrze przeskakują między nodami Lenovo. Czysta radocha.


![Dynamiczna mapa klastra w akcji](/dynamic-map-k3s-banner.png)
