---
id: '27'
title: 'Omarchy Power Tools: pierwszy PR'
date: '2026-04-24'
tags: ['Arch Linux', 'Bash', 'Open Source']
readTime: '2 min'
imageUrl: '/screenshot-2026-04-24_11-29-44.png'
excerpt: 'Jak proste skrypty do oszczędzania energii na Archu stały się projektem Open Source.'
---

# Archy Power Tools: Optymalizacja baterii i pierwszy PR

Omarchy-power-tools zaczął się od bardzo prostego problemu: Linux na laptopie potrafi topić baterię w absurdalnym tempie, szczególnie kiedy na co dzień używam czegoś cięższego, jak Hyprland.

Z tego wyszedł zestaw skryptów, które robią systemowi mały audyt energetyczny za każdym razem, gdy odpinam zasilacz. Po przejściu na baterię zasilacza ten skrypt nie bawi się w półśrodki. Tnie limity mocy CPU i GPU, wyłącza turbo, odstawia połowę wątków, zbija ekran do 60 Hz i czyści Hyprlanda z całego wizualnego balastu. Do tego ogranicza polling Waybara, próbuje uspokoić SSD i audio, przykręca sieć i peryferia, a na koniec gasi nawet LED-y w ThinkPadzie i robi z Ghostty czarną dziurę bez przezroczystości. Nie jest to subtelne, ale właśnie o to chodzi: po przejściu na baterię laptop ma pracować dłużej, a nie wyglądać ładniej. Cel jest prosty: wyciągnąć z baterii trochę więcej życia.

## Od lokalnego hacka do uniwersalnego rozwiązania

Przez długi czas był to projekt szyty praktycznie tylko pod mój sprzęt. W kodzie siedziały na sztywno nazwy interfejsów sieciowych, konkretne identyfikatory wątków i kilka założeń, które działały u mnie, ale niekoniecznie gdziekolwiek indziej.

## Pierwszy PR: Marcos wkracza do akcji

To zmieniło się w momencie, gdy do repo wpadł pierwszy konkretny pull request. Marcos przebudował część logiki tak, żeby skrypt lepiej radził sobie na różnych Ryzenach. Zamiast opierać się na ręcznie wpisanych numerach rdzeni, skrypt sprawdza teraz zasoby maszyny przez nproc i dopiero na tej podstawie ogranicza CPU. Podobnie ogarnięte zostało wykrywanie GPU i nazw interfejsów sieciowych.

To była dla mnie bardzo dobra lekcja basha i pisania kodu, który nie rozsypuje się przy pierwszej zmianie konfiguracji sprzętowej. Łatwo zrobić lokalny hack, dużo trudniej napisać coś, co ma sens także poza własnym laptopem.

## Największa lekcja: Open Source to nie tylko kod

Największą satysfakcję daje mi to, że komuś chciało się wejść w ten kod, zrozumieć go i jeszcze go ulepszyć. W nauce DevOps dużo mówi się o automatyzacji, narzędziach i infrastrukturze, ale takie momenty najlepiej pokazują, po co w ogóle wrzucać rzeczy publicznie. Ktoś trafia na twój projekt, uznaje go za użyteczny i dokłada coś od siebie, żeby działał lepiej nie tylko u ciebie.

Zmiany są już na masterze, a dokumentacja została zaktualizowana tak, żeby nadążała za nową wersją projektu. Lubię takie momenty, bo przypominają, że nawet małe repo może przestać być prywatnym skryptem i zamienić się w coś, przy czym zaczyna się prawdziwa współpraca.


Repozytorium projektu: [omarchy-power-tools](https://github.com/kompot-rar/omarchy-power-tools)


## Status optymalizacji w praktyce

![Wynik działania skryptów optymalizujących baterię](/screenshot-2026-04-24_11-23-30.png)
