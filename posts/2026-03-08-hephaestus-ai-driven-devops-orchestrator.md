---
id: '21'
title: 'Hephaestus: Mój autorski AI-Driven Orchestrator i walka z Context Bloat'
date: '2026-03-08'
tags: ['AI', 'MCP', 'FastAPI', 'Docker', 'DevOps', 'Orchestration']
readTime: '6 min'
imageUrl: '/hephaestus-banner.png'
excerpt: 'Hephaestus: Mój autorski orkiestrator AI oparty o standard MCP, walczący z Context Bloat przy pracy z dużymi repozytoriami.'
---

Cześć! Dzisiejszy wpis na blogu to lekkie zboczenie z mojej głównej roadmapy do zostania Junior DevOps Engineerem. Choć projekt, o którym dziś opowiem, to czysty backend połączony z architekturą LLM – był on dla mnie absolutnie krytyczny do stworzenia. Kontekstem powstania tego narzędzia są wieczorne szponty z moim przyjacielem, **Sową**. Sowa jest doświadczonym Tech Leadem – nie dość, że wkręca mnie w świat IT i mentoruje w moich postępach, to regularnie podrzuca wyzwania. Zrozumieliśmy, że aby kiedykolwiek spiąć duży projet z kodem generowanym w większości przez AI nie możemy robić wszystkiego ręcznie. Potrzebujemy narzędzia.

Wszyscy wiemy, że wrzucenie do AI całego kodu potężnego repozytorium to gwarantowany problem - zjawisko to fachowo nazywa się Context Bloat albo Context Rot. Model AI traci wątek, zużywa tony tokenów, halucynuje API, którego nie ma, albo gubi się w zależnościach. Wyobraź sobie pracodawcę, który płaci rachunek za takie operacje. 

Z takich wieczornych, przemyśleń nad architekturą i automatyzacją, narodził się **Hephaestus**  – orkiestrator dla mojego ekosystemu kodu, oparty o specyfikację MCP, relacyjną bazę danych, skrypty Pythona agregujące zależności z nagłówków plików i wykorzystanie API GitHuba - Issues do rozdzielania zadań.

## Aplikacja Hephaestus w Pigułce

Hephaestus to Orchestrator - mózg operacyjny sterujący dedykowanymi agentami. Jego podstawowym zadaniem jest zarządzanie wieloma repozytoriami kodu na raz (Control Plane/Multi-Repo Supervision) bez wysadzania w kosmos okna kontekstowego.

Główna zasada działania to moja autorska strategia **Tiered Context Engineering**:
1. **Core (Konstytucja)**: AI dostaje nienaruszalne reguły projektu, np. jak nazywać pliki, jakie technologie stosować. Agent "Dev" nie wymyśla architektury od nowa - trzyma się mojej
2. **Task-Specific (JIT - Just-In-Time)**: AI nie czyta całego repozytorium! Dostaje tylko mały wycinek kodu i dokumentacji (`task payload`), niezbędny do ulepienia konkretnej funkcjonalności lub zadania. Zero Context Bloat.
3. **Dynamic Feedback**: Asynchroniczna wymiana zdarzeń (np. Webhooki z GitHuba). Real-time synchronizacja sprawia, że Hephaestus wie, co poszło nie tak i może reagować.

## Architektura "Trzech Pętli"

Praca nad kodem jest zorganizowana wokół trzech izolowanych pętli odpalanych prosto z IDE lub CLI z określonymi funkcjami biznesowymi (architektura Triple-Loop). Jak to wygląda w praktyce?

- **Loop 0 (Roadmap Manager)**: Architekt wizji. Pobiera wysokopoziomowe założenia projektowe z pliku markdown i strukturyzuje je w realne fazy (epics). Następnie wykorzystuje API GitHuba do zautomatyzowanego tworzenia precyzyjnych i wyodrębnionych Issue w docelowych repozytoriach. Ten krok nie jest wymagany.

- **Loop 1 (Project Manager / Strategist)**: Utworzone Issue natychmiast synchronizuje się z panelem Hephaestusa. Bezpośrednio ze swojego IDE/CLI, wykorzystując rozszerzenia MCP komendą `session_init`, uruchamiam Loop 1. Uprzednio zbudowany agent **Hephaestus: Strategist (PM + Architect)** dostaje pełnię praw na samodzielną weryfikację i czytanie kodu źródłowego. Po szybkim researchu "odlewa matrycę" pod docelowy kod – typuje niezbędne moduły do modyfikacji i kompresuje wytyczne do sztywnego *initial prompt*, służącego za jedyny drogowskaz w kolejnej pętli.

- **Loop 2 (Programmer / Coder)**: Skoro po Loop 1 w systemie czeka perfekcyjnie przygotowana "forma", twardo resetuje sesję. Odpalam z czystym kontestem komendę mcp get_next_task. Na arenę wkracza Hephaestus: Coder. Dostaje na tacę wyłącznie niezbędne moduły i instrukcje. Jego cel to chirurgiczne cięcie kodu i pchnięcie zmian do pull-requesta. Ten model ma absolutny zakaz wędrowania po repozytorium! Robi swoje, melduje sukces i czeka na kolejne zlecenie.

Taki Orkiestrator rozbija jedno potężne repo na tysiące małych paczek. Ale dlaczego organizować to w ogóle przez pętle na serwerze MCP, zamiast po prostu odpytywać API na backendzie? Kluczem są tutaj koszty. Tokeny klasycznego API AI pochłaniałyby fortunę przy tak zaawansowanych projektach. Przenoszenie głównego procesu analitycznego i generacji kodu do IDE przez protokół MCP pozwala wykorzystać płatne wersje subskrypcyjne – jak chociażby **Google AI Pro**  czy **Claude Pro plan**. Uwalnia to od ogromnych bilingów "pay-as-you-go", radykalnie rzucając koszty na kolana, a przy okazji niebotycznie podnosząc skuteczność.

## Modularyzacja plików i Kontrola Zależności

Żeby Orchestrator zadziałał i LLM nie wygenerował spaghetti code, sam kod źródłowy projektu musiał zostać poddany wdrożeniu surowych restrykcji:
- **Mikro-chunki (do ~300 linii)**: Każdy plik jest celowo i restrykcyjnie fragmentowany do rozmiaru nieprzekraczającego trzystu linii. Małe, atomowe jednostki kodu gwarantują szybsze i bardziej trafne ładowanie odpowiedniego kontekstu przez AI (zamiast gigantycznych plików main.py) minimalizując szum.
- **Specyficzne Nagłówki Modułów**: Stworzyłem standard konwencji opisywania każdego z plików informujący o jego przeznaczeniu. Coś na kształt poniższego nagłówka, od razu instruującego model o zawartym kontekście:

```python
# ============================================================
# Hephaestus — Header Parser
# @module: header_parser
# @provides: parse_header, has_module_header, ParsedHeader
# ============================================================
```

- **Dynamiczna Mapa Zależności**: Użycie tych nagłówków buduje graf relacji wewnątrz repozytorium. AI przed napisaniem nowej warstwy logiki najpierw poznaje "drzewo importów" i dokładnie wie, z czego może skorzystać, a z czego nie - jest to absolutnie kluczowe dla redukcji halucynacji w zewnętrznych bibliotekach lub funkcjach, które w danym module fizycznie nie istnieją.

![Dynamiczna mapa zależności modulów w Hephaestus](/hephaestus-graph.png)

## Technikalia – Jak to zbudowałem?

Jako przyszły inżynier DevOps uwielbiam operować infrastrukturą jako kod. Całość musiała być spakowana tak, aby wrzucić to na sprzęt w mojej prywatnej serwerowni.

- **Backend**: Cały silnik to **FastAPI**.  Dba o uwierzytelnianie, zarządza projektami w dedykowanym widoku (dashboardzie z szablonami Jinja2) i wystawia asynchroniczne endpointy chwytające Webhooki.
- **Relacyjna Baza Danych**: Użyłem bazy **SQLite** sterowanej za pomocą **SQLAlchemy** (ORM). Wszystko zautomatyzowane dzięki migracjom bazy robionym z udziałem **Alembica**.
- **Komunikacja Obustronna z GitHubem**: System intensywnie korzysta z asynchronicznie odpytywanego asystenta **GitHub REST API** (przez bibliotekę `httpx`). Pozwala to nam na uderzanie bezpośrednio z kodem w logikę zakotwiczoną w Issues oraz zaciąganie i pchanie kodu. Dodatkowo system słucha zdefiniowanych GitHub Webhooków.
- **Model Context Protocol**: Nowoczesny standard integracji. Pozwala mojemu IDE oraz CLI łączyć się płynnie z API Hephaestusa poprzez strumieniowanie Server-Sent Events. 
- **Konteneryzacja**: Wiadomo - apkę wdrożył **Docker & Docker Compose**. Infrastruktura wstaje u mnie w domu kilkoma klawiszami.

## Perspektywa DevOps: Co to daje w praktyce?

Wdrażając Hephaestusa, budujemy zamknięty workflow dostarczania kodu. Z punktu widienia infrastruktury i zarządzania procesem, rozwiązuje to kilka konkretnych problemów:

1. **Centralny Dashboard**: Mamy jeden panel, który integruje się z API GitHuba, dając bezpośredni podgląd i dostęp do zdefiniowanych tam Issues. Wszystko w jednym miejscu, bez skakania po zakładkach.

![Panel sterowania Hephaestusa z przygotowanym zadaniem](/hephaestus-dashboard-v2.png)

2. **Pełna widoczność procesu (Loop 1)**: Dashboard daje bezpośredni wgląd w decyzje architektoniczne podjęte w pierwszej pętli. Widzimy dokładnie wynik pracy "Architekta" – mamy wylistowany *initial prompt*, który powędruje do agenta-programisty, oraz precyzyjną listę wytypowanych modułów i zależności.
3. **Nadzór (Human-in-the-loop)**: Zanim agent "Coder" w ogóle dotknie kodu, możemy zweryfikować wygenerowany *initial prompt* i listę plików w dashboardzie. Same propozycje zadań (Issues) możemy dowolnie edytować i dostosować do aktualnego stanu projektu.
4. **Skalowanie pracy**: Mając zablokowaną architekturę i podzielony, zatwierdzony w dashboardzie kontekst, możemy uruchomić wielu agentów-programistów na raz. Skalujemy pracę całego projektu – w tym samym czasie kilku agentów realizuje odrębne, wyizolowane taski, np. łatka błędu, refaktor i nowy feature. Wszystko idzie równolegle.

## DevOpsowe Lekcje

Technicznie, największym wyzwaniem była inżynieria ruchu sieciowego. Przepychanie strumieni SSE z lokalnego środowiska przez Cloudflare wymagało odpowiedniej konfiguracji Nginx i wyłączenia buforowania (`proxy_buffering off;`). Do tego doszło zarządzanie bezpieczeństwem – m.in. bezpieczna obsługa tokenów GitHub PAT i Webhooków bez wpisywania ich na sztywno w kod.

Ten projekt to świetny poligon doświadczalny. Pokazuje, jak w praktyce wygląda budowanie narzędzi optymalizujących pracę i jak spinać integrację z zewnętrznymi API w jeden, skalowalny workflow.
