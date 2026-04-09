---
id: '25'
title: 'Po godzinach: żona nie chce konsoli w salonie, a ja mam swojego ThinkPada'
date: '2026-04-09'
tags: ['Homelab', 'Hardware', 'ThinkPad', 'Gaming', 'Remote Play', 'SFF']
readTime: '4 min'
imageUrl: '/po-godzinach-banner.jpg'
excerpt: 'Jak pogodzić miłość do technologii z estetyką salonu?'
---

Najbardziej gamingowy sprzęt w moim domu nie stoi ani przy telewizorze, ani na biurku. Stoi zamknięty w małej obudowie SFF gdzieś obok całej reszty mojego domowego bałaganu, a ja gram na starym ThinkPadzie.

## Paradoks gracza w dorosłym życiu

I to jest właśnie ten paradoks, od którego zaczął się cały temat. Żona nie chciała konsoli w salonie, ja nie chciałem kolejnego świecącego kloca pod TV, a na pewno nie chciałem gamingowego laptopa z Windowsa, który brzmi jak startujący odrzutowiec, kiedy tylko odpalisz coś cięższego niż przeglądarka. Pytanie było proste: jak mieć wydajny sprzęt do grania, renderowania i dłubania po godzinach, ale bez hałasu, bez kompromisu i bez rozwalania estetyki mieszkania?

Na początku, jak zwykle, próbowałem sobie wmówić, że może przesadzam. Że może laptop gamingowy "nie jest taki zły". Po czym odpaliłem jednego u znajomego i po trzech minutach słyszałem tylko wentylatory. Nie grę. Wentylatory. I wtedy stwierdziłem, że jeśli mam już robić coś po swojemu, to do końca.

## ThinkPad T14 Gen 2: Korpo-cegła z duszą gracza

Zostałem więc przy swoim ThinkPadzie T14 Gen 2, którego i tak uwielbiam za to, że jest nudny w najlepszy możliwy sposób. Żadnych agresywnych wlotów powietrza, żadnych RGB, żadnego "gamer design". Za to wymieniłem w nim ekran na panel 2K 120Hz z AliExpress i to był moment, kiedy ten laptop wszedł na dziwny poziom. Z zewnątrz korpo-cegła. W praktyce sprzęt, na którym mogę pracować, oglądać, grać i nie słuchać wycia turbiny.

A ciężką robotę przerzuciłem do homelabu.

## Serce systemu: Ryzen 7500F i Moonlight

Postawiłem sobie skrzynkę na Ryzenie 7500F, 32GB RAM-u i RX9070XT, zamkniętą w zgrabnej budzie SFF miniITX. Bez wystawiania tego na środek salonu, bez robienia z pokoju "strefy gracza". To pudełko siedzi sobie grzecznie tam, gdzie jego miejsce — headless, bez wpiętego monitora, budzone jednym pakietem WOL z telefonu albo ThinkPada, kiedy mam na nie ochotę. Łączę się z nim przez Moonlight i Apollo. Efekt? Na ThinkPadzie mam ciszę. Na telewizorze mam granie. Na telefonie mam granie. A opóźnienia, które finalnie udało mi się wyciągnąć w sieci lokalnej, kręcą się u mnie mniej więcej w okolicach 0.5 do 3ms, więc szczerze: szybciej zauważam własny refleks niż laga.

![Cyberpunk 2077 streamowany przez Moonlight — overlay pokazuje latencję poniżej 1ms](/po-godzinach-latency.png)

## DevOps po godzinach: To nie sprzęt, to rozwiązanie

I tu wchodzi ten fragment, który niby nie jest o DevOpsie, ale jednak trochę jest. Bo dla mnie to nie był zakup sprzętu. To było rozwiązywanie ograniczeń. Wymagania były konkretne: ma być cicho, ma być estetycznie, ma działać z kilku urządzeń, ma nie przywiązywać mnie do jednego miejsca i ma dawać zapas nie tylko do grania. Skoro ta skrzynka już stoi, to równie dobrze mogę z dala od salonu odpalić na niej render, puścić kompilację, przetestować coś cięższego, albo wystawić sobie lokalnie LLM-a na Ollamie czy pomęczyć ComfyUI. Komputer do grania robi się po prostu kolejnym węzłem do zadań specjalnych.

Najśmieszniejsze jest to, że wyszło mi coś, czego sam kiedyś bym nie kupił, bo brzmiałoby przekombinowanie. Gaming bez gamingowego laptopa. Konsola bez konsoli. Workstation bez siedzenia przy workstation. Brzmi jak sztuka dla sztuki, dopóki nie siadasz wieczorem na kanapie, odpalasz stream na TV i nie słyszysz absolutnie nic poza grą.

I chyba właśnie dlatego lubię takie projekty najbardziej. Nie dlatego, że są idealne, tylko dlatego, że rozwiązują realny problem trochę bokiem, trochę po inżyniersku, a trochę po domowemu.

## Co dalej?

Tylko już widzę, że następny etap będzie gorszy: skoro działa tak dobrze, to zaraz zacznę kombinować, jak to spiąć z klastrem K3S i budzić na żądanie pod cięższe joby.

![Pełny setup — skrzynka SFF na szafce obok reszty homelabu](/po-godzinach-setup.jpg)
