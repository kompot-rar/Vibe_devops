---
id: '22'
title: 'Git we własnej "Kuźni" – Dlaczego postawiłem Forgejo na K3s?'
date: '2026-03-15'
tags: ['Git', 'Forgejo', 'K3s', 'Self-hosting', 'DevOps', 'ArgoCD']
readTime: '4 min'
imageUrl: '/forgejo-banner.png'
excerpt: 'Postawiłem na swoim domowym klastrze K3s własny serwer Git – Forgejo. Dlaczego nie GitHub? Chodziło o pełną kontrolę nad cyklem życia kodu, niezależność i rynkowe standardy.'
---

Cześć! Dzisiaj kolejny krok na mojej drodze do certyfikatu CKA i bycia pełnoprawnym DevOps Engineerem. Zdecydowałem się postawić na moim domowym klastrze K3s własny serwer Git – wybór padł na Forgejo.

Pewnie zapytasz: "Po co się w to bawić, skoro mamy GitHuba, na którym wszystko działa od strzała?". To prawda, GitHub jest świetny i wygodny, ale dla mnie ten projekt miał inny cel. Chodziło o naukę rynkowych standardów, zrobienie czegoś po swojemu i przede wszystkim – wzięcie pełnej odpowiedzialności za własną infrastrukturę.

### 1. Chcę zarządzać całym cyklem życia kodu

To był główny motor napędowy. Nie chodziło mi tylko o kolejne miejsce do trzymania plików. Chciałem na własnej skórze poczuć, jak to jest być administratorem całego łańcucha dostarczania oprogramowania. Od momentu zrobienia `git push`, przez wyzwalanie webhooków, aż po procesy CI/CD i wreszcie automatyczny deployment za pomocą ArgoCD. 

Zrozumienie, jak te wszystkie klocki do siebie pasują, gdy sam musisz je poskładać, utrzymywać i diagnozować, daje zupełnie inną perspektywę niż korzystanie z gotowego rozwiązania SaaS. Jak u mnie coś padnie, to nie siedzę z założonymi rękami czekając na aktualizację status page'a GitHuba – muszę sam wejść na serwer, przejrzeć logi klastra i znaleźć winowajcę. I to jest właśnie ta bezcenna nauka, której szukam.

### 2. Niezależność i moja własna "Kuźnia"

Nie oszukujmy się, GitHub to Microsoft. W świecie open-source i DevOps ceni się niezależność. Posiadanie pełnej kopii (mirrorów) moich projektów infrastrukturalnych na własnym żelazie to coś więcej niż zwykły backup. To po prostu gwarancja, że mój kod jest u mnie.

Dodatkowo, w dobie wszechobecnych asystentów AI, dobrze mieć to poczucie, że nikt nie mieli moich manifestów YAML jako darmowego materiału do trenowania swoich modeli bez mojej wiedzy. Moja "Kuźnia" – moje zasady. Wstęp tylko z zaproszeniem.

### 3. Standardy rynkowe – on-premise i air-gapped

Jako Junior DevOps nie zawsze będę pracował w idealnym, cloud-native świecie. Wiele poważnych firm, chociażby z sektora bankowego czy medycznego, ze względów bezpieczeństwa trzyma swoje repozytoria we własnych, często całkowicie odciętych od internetu sieciach (środowiska on-premise / air-gapped). 

Stawiając własną instancję na K3s, symuluję takie środowisko i uczę się rzeczy, które w chmurze klika się jednym przyciskiem:
* Jak poprawnie skonfigurować Ingress i wystawić usługę na zewnątrz (u mnie przez Traefika na domenie `git.kuznia.k3s`).
* Jak zarządzać Persistent Volumes (PV/PVC), żeby po restarcie poda nie stracić całej historii commitów i repozytoriów.
* Jak wdrażać nowoczesne aplikacje bezpośrednio z rejestrów OCI.

### 4. Dlaczego akurat Forgejo, a nie potężny GitLab?

Mój klaster domowy to na ten moment flotyllia mini komputerów Lenovo Tiny (głównie modele M710 i M83). GitLab to fantastyczne, kompleksowe narzędzie, ale to też prawdziwy kombajn – pożera zasoby i wymagałby ode mnie dedykowania mu przynajmniej 8GB RAM-u na sam start. 

Forgejo (będące lekkim, społecznościowym forkiem Gitea) zużywa zaledwie ułamek tego, a dostarcza dokładnie to, na czym mi zależało: wydajny hosting kodu, obsługę pull requestów, organizacje i wbudowane mechanizmy do robienia mirrorów. 

Jako DevOps musisz umieć optymalizować i dobierać narzędzia proporcjonalnie do posiadanych zasobów. Szkoda marnować cenny RAM i CPU na zaawansowane funkcje GitLaba, z których w jednoosobowym homelabie i tak bym nie skorzystał. Te zasoby przydadzą mi się do odpalenia kolejnych mikroserwisów!

### Jak to wygląda pod maską? (The Tech Stack)

Całość wdrożyłem w 100% z wykorzystaniem podejścia GitOps przy użyciu ArgoCD. Żadnego ręcznego nakładania manifestów.
1. **Repozytorium:** Skorzystałem z oficjalnego dystrybuowanego przez OCI Helm chartu dla Forgejo.
2. **Sieć:** Ruch z zewnątrz trafia na adres IP `10.0.20.20` zarządzany przez Load Balancer (Kube-VIP), a stamtąd Ingress kieruje go pod odpowiednią domenę.
3. **Storage:** Na początek zadeklarowałem skromne 5GB wolumenu z wykorzystaniem `local-path-provisioner`.

Własny serwer Git w homelabie to nie jest tylko sztuka dla sztuki. To świetny poligon doświadczalny, który uczy pokory i uświadamia, jak wiele inżynieryjnej magii dzieje się pod spodem w narzędziach, które na co dzień przyjmujemy za pewnik.

![Forgejo w mojej Kuźni](/forgejo-banner.png)
