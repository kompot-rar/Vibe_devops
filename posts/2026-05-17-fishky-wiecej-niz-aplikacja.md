---
id: '29'
title: 'Fishky: Więcej niż aplikacja do fiszek'
date: '2026-05-17'
tags: ['Kubernetes', 'Homelab', 'DevOps', 'Mobile', 'Learning']
readTime: '5 min'
imageUrl: '/fishky-banner.png'
excerpt: 'Jak prosta aplikacja mobilna stała się poligonem doświadczalnym dla Kubernetesa, zarządzania bazami danych i bezpieczeństwa w homelabie.'
---

## Fishky nie miało być tylko apką do fiszek

Chciałem zrobić prostą aplikację do fiszek na Androida, bo miałem konkretny problem do rozwiązania i wiedziałem, że najwięcej nauczę się wtedy, kiedy zbuduję coś swojego od początku do końca. Ale z mojej perspektywy sama aplikacja nie jest tutaj najważniejsza. Dużo cenniejsze okazało się to, że ten projekt stworzył mi prawdziwą przestrzeń do nauki rzeczy, których nie da się dobrze ogarnąć na demo.

Fishky dało mi coś, czego nie daje klepanie projektów, które trafią tylko do githuba. **Prawdziwą aplikację z prawdziwymi użytkownikami.** W momencie, kiedy ktoś faktycznie instaluje apkę, zakłada konto i wrzuca tam swoje dane, wszystko przestaje być zabawą. Dopóki robi się coś lokalnie dla siebie, łatwo podejść do tego lekko. Przy Fishky już się tak nie da. Mamy dostęp do zewnętrznych usług, mamy konfigurację środowisk, mamy rzeczy związane z płatnościami i mamy też sekrety do API Gemini, które napędza część logiki generowania treści. Tutaj pomyłka nie kończy się na małym warningu w logach. Może skończyć się kosztownie.

## Infrastruktura: Kubernetes w Homelabie

U mnie backend stoi w homelabie na Kubernetesie - dzięki temu Fishky nie jest tylko appką mobilną, a stało się realnym środowiskiem do nauki. Mam prawdziwe rollouty, prawdziwe wdrożenia i prawdziwe sytuacje, w których trzeba myśleć o tym, co się stanie po wrzuceniu nowej wersji. 

*   **Czy deployment przejdzie czysto?** 
*   **Czy coś nie rozjedzie się po stronie API?** 
*   **Czy da się to bezboleśnie cofnąć?** 
*   **Czy zmiana w konfiguracji nie rozwali czegoś, co wcześniej działało stabilnie?**

## Baza danych: Lekcja pokory i LXC

Baza danych też bardzo szybko sprowadziła mnie na ziemię. Dopóki robi się małe projekty, łatwo myśleć o niej jak o czymś oczywistym. W praktyce to jeden z najważniejszych elementów całego systemu. Trzeba pilnować migracji, spójności danych, backupów, dostępu i tego, żeby rozwój aplikacji nie rozwalał rzeczy już zapisanych. 

Zacząłem to traktować dużo poważniej i między innymi dlatego zdecydowałem się zostawić ją w **LXC**, czyli wydzielenia bazy poza sam klaster aplikacyjny. Chciałem mieć nad tym większą kontrolę, lepiej zarządzać zasobami i zbudować sobie sensowną podstawę pod dalsze eksperymenty.

## Więcej niż backend: Cloud i Architektura

Bo Fishky bardzo szybko stało się dla mnie miejscem do nauki rzeczy wykraczających poza samo „mam backend i apkę”. To jest środowisko, na którym mogę zacząć pracować nad tematami chmurowymi, sprawdzać różne kierunki architektury i uczyć się tego w praktyce. Interesuje mnie **Google Cloud Console** nie jako zbiór ikonek, tylko jako realne narzędzie do budowania kolejnych warstw projektu. Patrzę na cloud bursting, na to jak łączyć homelabową infrastrukturę z chmurą, jak przygotować system pod bardziej rozproszony model działania i jak myśleć o synchronizacji wielu baz danych bez opowiadania sobie bajek, że to „jakoś się zrobi”.

## Bezpieczeństwo i Sekrety

Tak samo z sekretami. Przy prostych projektach ten temat łatwo bagatelizować, ale przy aplikacji, która ma backend na domowym serwerze a do tego użytkowników, płatności i zewnętrzne integracje - sekrety stają się ważniejsze, niż wcześniej. Klucze do usług, dane dostępowe, konfiguracja środowisk, tokeny, rzeczy związane z Google Cloud, płatnościami i bazą. To jest fundament bezpieczeństwa i utrzymania całego systemu.

## Płatności i realny produkt

Płatności to zresztą kolejny moment, w którym projekt dojrzewa bardzo szybko. Dopóki aplikacja jest tylko prywatnym eksperymentem, temat można odkładać. Kiedy zaczynasz myśleć o realnym produkcie, wchodzą integracje, walidacja, edge case’y, obsługa błędów i cała logika, której użytkownik nie widzi, ale która decyduje o tym, czy system jest wiarygodny. To uczy pokory lepiej niż cokolwiek innego, bo każdy szczegół ma znaczenie.

## Poligon doświadczalny: Testy A/B

Do tego dochodzą testy A/B, które chcę rozwijać choćby przy silniku ekstrakcji danych. To jest świetny przykład miejsca, gdzie technologia spotyka się z produktem. Można mieć kilka podejść do parsowania, różne pipeline’y albo różne prompty, ale dopiero ruch i zachowanie użytkowników pokazują, co działa naprawdę dobrze. I właśnie o to mi chodzi w tym projekcie - nie tylko o teorię, tylko o system, który pozwala sprawdzać decyzje na żywym organizmie.

## Podsumowanie

Im dłużej rozwijam Fishky, tym mocniej widzę, że zbudowałem sobie coś więcej niż aplikację do nauki. Zbudowałem przestrzeń, w której mogę uczyć się backendu, Kubernetesa, zarządzania bazą, sekretami, rolloutami, integracjami i architekturą pod chmurę w sposób, który ma sens. Każda funkcja na froncie pcha mnie głębiej w infrastrukturę. Każdy nowy użytkownik podnosi poprzeczkę. Każda decyzja zostawia ślad.

Właśnie dlatego ten projekt jest dla mnie ważny - przez drogę, którą wymusił. Od aplikacji, która miała pomagać robić fiszki, do projektu, na którym uczę się budować i utrzymywać coś prawdziwego.

*Aplikacja Fishky jest dostępna w Google Play:* [Pobierz z Play Store](https://play.google.com/store/apps/details?id=fishky.mrozy)
