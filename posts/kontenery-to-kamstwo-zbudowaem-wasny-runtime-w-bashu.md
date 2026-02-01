---
id: '4'
title: 'Kontenery to kłamstwo. Zbudowałem własny runtime w Bashu.'
date: '2026-01-25'
tags: ['Linux', 'Containers', 'Namespaces', 'Cgroups', 'DevOps', 'HardWay']
readTime: '8 min'
imageUrl: '/docker.png'
excerpt: 'Docker to tylko wygodny interfejs. Prawdziwa izolacja dzieje się w Kernelu. Zobacz jak zrozumieć co naprawdę dzieje się w Podzie Kubernetesa.'
---

### Od użytkownika do inżyniera

Jeszcze niedawno moja przygoda z Dockerem wyglądała tak: znajdowałem `docker-compose.yml` w internecie, kopiowałem go, robiłem `up` i cieszyłem się, że działa. Miałem tylko mgliste domysły co do tego, co dzieje się pod spodem, ale póki ikonka wieloryba była zielona, byłem zadowolony. Czułem się jak ekspert, a byłem tylko operatorem cudzego kodu.

Żeby to zmienić postawiłem rozebrać tę technologię do rosołu - zbudowałem własny runtime w czystym **Bashu**. Zero Dockera, zero Containerd. Tylko ja, terminal i kernel.

To nie jest wpis o tym, jak zastąpić Dockera. To wpis o tym, jak przestać klikać „z nadzieją, że zadziała” i zacząć rozumieć inżynierię, która trzyma Internet w kupie.

---

### 1. Warstwy (OverlayFS): Magia "Copy-on-Write"

**Docker** nie kopiuje całego systemu plików za każdym razem. Używa **OverlayFS**, żeby nałożyć warstwę "zapisu" na warstwę "odczytu" (obrazu).  


```bash
# Łączymy bazowy system (lower), folder na zmiany (upper) i folder roboczy (work)
mount -t overlay overlay -o lowerdir=./alpine_rootfs,upperdir=./container_changes,workdir=./work ./merged_vault
```

> **Lekcja:** To jest fundament **Image Layers**. Dzięki temu 10 kontenerów opartych na tym samym obrazie zajmuje na dysku miejsce tylko raz. Reszta to tylko lekka warstwa zmian (**Copy-on-Write**). Ja postanowiłem zbudować swój system plików od zera, tak jak robi się to instalując Arch Linuxa – używając pacstrap. 

### 2. Sieć (Network Namespaces): Ręczne rzeźbienie rur

To jest moment, w którym **Docker** automatycznie tworzy mosty sieciowe, ale ja zrobiłem to ręcznie przy użyciu **veth**.

```bash
# 0. informujemy o kontenerze
sudo ip netns add moj_kontener

# 1. Tworzymy parę wirtualnych rur
ip link add veth0 type veth peer name veth1

# 2. Jedną rurę wpychamy do "kontenera" (namespace)
ip link set veth1 netns moj_kontener

# 3. Nadajemy IP i podnosimy interfejsy
ip netns exec moj_kontener ip addr add 10.0.0.2/24 dev veth1
ip netns exec moj_kontener ip link set veth1 up
```

> ![ping](docker1.png) **Lekcja:** To co tu widzisz, to manualna robota wtyczki **CNI (Calico/Flannel)**. Każdy Pod w klastrze ma taką swoją rurę podpiętą do wirtualnego switcha hosta. Zrozumienie tego to koniec problemów z "Network Unreachable".

### 3. Izolacja (Namespaces): PID 1 i "Zombie Apocalypse"

Używając mechanizmu **Namespaces**, odciąłem proces od reszty systemu. Ale tu pojawia się kluczowy problem: **PID 1**. Jeśli Twój proces zostanie PID-em 1, **Kernel** wymaga od niego sprzątania "procesów sierot". Jeśli tego nie robi, Twój kontener zapycha się procesami-widmami `[defunct]`.

 ![Widok ps aux - nasz shell jako król wszechświata PID 1](docker2.png)
*Rys 2. Izolacja PID Namespace - bash widzi tylko siebie.*

### 4. Limity (Cgroups v2): Brutalne kajdanki

W K8s piszesz `limits.memory: "50Mi"`. Pod maską **Kernel** używa **Cgroups**. Możesz to kontrolować ręcznie w systemie plików. Ale zamiast ustalać twardy limit odpalam kontener z flagą:

```bash
sudo systemd-nspawn -D /var/lib/machines/moj-kontener --property=MemoryMax=50M --property=MemorySwapMax=0
```

![OOM Killer w akcji - twardy limit 50MB](docker4.png)
*Rys 3. Moment, w którym Cgroup mówi "dość" i wysyła sygnał SIGKILL.*

---

### Podsumowanie

Docker to nie jest jedna, monolityczna technologia. To nakładka na konkretne funkcje kernela Linuxa. Celem tego ćwiczenia było zbudowanie "kontenera" ręcznie, używając tylko narzędzi systemowych, bez zainstalowanego Dockera - udało się a podejście "Hard Way" pomoże zrozumieć, jak naprawdę działa izolacja podów w Kubernetesie.

### Aktualizacja: Projekt BCR

Aby udowodnić, że to nie tylko teoria, całą tę wiedzę spisałem w formie jednego skryptu Bash. Tak powstał **Bash Container Runtime (BCR)** – edukacyjne narzędzie, które automatyzuje tworzenie namespaces i cgroups bez użycia Dockera.

**👉 Kod źródłowy na moim GitHub** ![BCR](bcr.png)