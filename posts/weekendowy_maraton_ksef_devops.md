---
id: '14'
title: 'Weekendowy Hackathon: Od "postaw mi Proxmoxa" do KSeF API 2.0'
date: '2026-02-09'
tags: ['DevOps', 'Proxmox', 'CI/CD', 'KSeF', 'RealWorld']
readTime: '5 min'
imageUrl: '/ksefpreview.png'
excerpt: 'Miał być luźny sobotni wieczór z Kumplem, a skończyło się na 3-dniowym hackathonie i budowie MVP do obsługi KSeF.'
---

Miał być luźny sobotni wieczór. Kumpel (Lead od systemów ERP) wpadł z fizycznym serwerem pod pachą:
*"Zainstalujesz mi Proxmoxa? Bo chcę się pobawić, a Ty w tym ostatnio siedzisz".*

Jasne. Godzinka roboty, konfiguracja sieci, może jakieś piwko – standard.
Skończyliśmy trzy dni później, w niedzielę w nocy, z działającym MVP systemu do obsługi Krajowego Systemu e-Faktur.

![tak powstają startupy :D](/startupy.png)
*tak powstają startupy :D*

##  Geneza: "Potrzymaj mi klawiaturę"

Zamiast skończyć na gołym hypervisorze, zaczęliśmy projektować. On potrzebował środowiska pod testy integracji z nowym API KSeF 2.0. Ja potrzebowałem poligonu, żeby sprawdzić swoją wiedzę w boju, a nie tylko na suchych labach.

Podział ról wyklarował się naturalnie w 5 minut:
*   **On (Dev):** Logika biznesowa, schematy faktur, backend i bazy danych.
*   **Ja (Ops):** Frontend i wszystko to, co sprawia, że nasz kod działa, jest bezpieczny i dostępny.

##  Stack: Solidny fundament

Nie bawiliśmy się w Kubernetesy (na to przyjdice czas). Liczył się *Time to Market* i stabilność.
1.  **Proxmox:** Baza. Trzy maszyny wirtualne (Postgres DB, Frontend/Node.js, Sandbox).
2.  **PostgreSQL:** Z tuningiem pod przyszłą replikację i automatycznymi backupami przez API Proxmoxa.
3.  **GitHub Actions:** Serce operacji.

##  Moment "Aha!": Czym właściwie jest DevOps?

Przez ten weekend zrozumiałem więcej niż wszytko to co wyczytałem z kursów do tej pory. DevOps to nie "pisanie skryptów w Bashu". To **usuwanie przeszkód**.

Stworzyłem pipeline, dzięki któremu kolega nie musiał ani razu logować się na serwer.
Kiedy pushował kod do repozytorium, GitHub Actions automatycznie:
1.  Odpalał testy jednostkowe i lintery.
2.  Budował aplikację.
3.  Wrzucały migracje na bazę danych.
4.  Deployowały całość na odpowiednią VM-kę.

Nie musiał pytać *"jak to wrzucić?"*. On po prostu pisał kod, a ten kod *"się dział"*. Widziałem ten błysk w oku, gdy 2 minuty po commicie, jego zmiana była live, spięta z API.

##  Rzeczywistość weryfikuje teorię

Oczywiście, że nie było różowo.
*   Pierwsze próby łączenia backendu z frontendem
*   Certyfikaty SSL i walka z chainami.
*   Firewall blokujący wychodzący ruch do API MF.
*   Dziwne zwrotki z KSeF, których nie było w dokumentacji.

Ale zamiast paniki *"serwer nie działa"*, była inżynierska diagnostyka. Logi, metryki, szybki fix, deploy. Pętla zwrotna skrócona do minimum. Działaliśmy jak zgrany, dwuosobowy zespół produktowy.


##  Wnioski Juniora

Ten weekend wyglądał z zewnątrz jak zalążek projektu z komercyjnym potencjałem, ale prawda jest prostsza: nie chcieliśmy budować „14. SaaS-a do KSeF”. Chodziło nam o sprawdzian w boju — czy potrafimy dowieźć działający przepływ end‑to‑end w warunkach presji czasu, błędów i ciągłych zmian, a nie o tworzenie kolejnego produktu „pod rynek”.


Ten "szybki projekt" dał mi potężnego kopa motywacyjnego i kilka lekcji:
1.  **Narzędzia to tylko narzędzia.** Nabierają sensu dopiero, gdy rozwiązują realny problem biznesowy.
2.  **DevOps to gra zespołowa.** Moja infrastruktura jest bezużyteczna bez jego kodu. Jego kod jest martwy bez mojej infrastruktury.
3.  **Satysfakcja.** Zobaczyć działający przepływ: `Faktura -> KSeF -> DB -> Frontend` w niedzielę w nocy – bezcenne.

To był mały hackathon, ale duży krok dla mojej ścieżki i — co ważniejsze — moja pierwsza prawdziwa, zespołowa praktyka. KSeF API 2.0 pewnie będziemy dalej dłubać hobbystycznie, ale ja już wróciłem z tego weekendu z czymś cenniejszym niż kolejny „projekt na GitHubie”: z doświadczeniem pracy jak w realnym zespole - nawet jeśli jego częścią byli agenci AI :)

Repozytorium na GitHubie zostaje prywatne, ale podgląd możliwy na https://ksefpreview.mrozy.org/ i https://backend.mrozy.org/docs

![Homelab 2.0](/ksefpreview.png)
