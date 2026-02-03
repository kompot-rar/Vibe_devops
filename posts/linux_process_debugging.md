--- 
title: "Podróż do Wnętrza Linuxa: strace, procesy i zawołania"
date: "2026-02-02"
excerpt: "Miało być prosto: chciałem tylko lepiej zrozumieć, jak działa Linux."
tags: ["Linux", "Strace", "Debugging", "DevOps", "Homelab"]
readTime: "5 min"
imageUrl: "/linux-process-debugging.png"
---

Miao być prosto: chciałem tylko lepiej zrozumieć, jak działa Linux. Skończyło się na podróży w głąb jądra systemu, gdzie Python przestaje być Pythonem, a staje się serią "rozmów" z Kernelem. W świecie DevOps, gdzie chmurujemy wszystko co się rusza i ukrywamy pod warstwami abstrakcji, łatwo zapomnieć, że pod spodem wciąż bije to samo serce.

Pamiętacie, jak w poprzednim wpisie rozbieraliśmy Dockera na części pierwsze i ręcznie izolowaliśmy procesy? Dzisiaj idziemy o krok głębiej. To zapis mojej pierwszej wyprawy z latarką w ręku (czyli narzędziem `strace`) do piwnic systemu operacyjnego. Zamiast czarnej magii, znalazłem tam konkrety: futexy, rury i desperackie prośby o zasoby.

### **Zaczynamy od Podstaw: Włączamy latarkę**

Zamiast zgadywać, co robi program, użyłem narzędzia `strace`. Aby podglądnąć każdą "prośbę", jaką program wysyła do kernela.

1.  **Generowanie obciążenia (`cpu_hog.py`):**
    Stworzyłem skrypt w Pythonie, który wykorzystuje wszystkie rdzenie mojego procesora. Dzięki narzędziom takim jak `btop`, mogłem zobaczyć, które procesy najbardziej obciążają system.
    Żeby te eksperymenty były łatwiejsze, stworzyłem skrypt Bashowy (`trace_cpu_hog_worker.sh`). On sam:
    *   Uruchamia program do testowania.
    *   Podpina do niego `strace`.
    *   Zbiera logi.
    *   A potem grzecznie wszystko sprząta

```text
.", 94) = 94 <0.000019>
10034 21:14:40.891733 <... write resumed>) = 98 <0.000020>
10028 21:14:40.891747 futex(0x7f9c3b64e000, FUTEX_WAKE, 1 <unfinished ...>
10034 21:14:40.891761 futex(0x7f9c39bc89f0, FUTEX_WAIT_BITSET_PRIVATE|FUTEX_CLOCK_REALTIME, 0, NULL, FUTEX_BITSET_MATCH_ANY <unfinished ...>
10029 21:14:40.891779 <... futex resumed>) = 0 <0.009524>
10028 21:14:40.891791 <... futex resumed>) = 1 <0.000033>
10029 21:14:40.891851 read(3, "\0\0\0^", 4) = 4 <0.000010>
10029 21:14:40.891931 read(3, "\200\4\225S\0\0\0\0\0\0\0(K\0K\4\214\24multiprocessing.pool\224\214\7mapstar\224\223\224\214\10__main__\224\214\17worker_function\224\223\224N\205\224\206\224\205\224}\224t\224.", 94) = 94 <0.000010>
10029 21:14:40.891982 futex(0x7f9c3b64e000, FUTEX_WAKE, 1 <unfinished ...>
10030 21:14:40.892015 <... futex resumed>) = 0 <0.008119>
10029 21:14:40.892032 <... futex resumed>) = 1 <0.000036>
10030 21:14:40.892094 read(3, "\0\0\0^", 4) = 4 <0.000013>
10030 21:14:40.892196 read(3, "\200\4\225S\0\0\0\0\0\0\0(K\0K\5\214\24multiprocessing.pool\224\214\7mapstar\224\223\224\214\10__main__\224\214\17worker_function\224\223\224N\205\224\206\224\205\224}\224t\224.", 94) = 94 <0.000010>
10030 21:14:40.892274 futex(0x7f9c3b64e000, FUTEX_WAKE, 1) = 1 <0.000018>
10031 21:14:40.892340 <... futex resumed>) = 0 <0.006796>
10031 21:14:40.892415 read(3, "\0\0\0^", 4) = 4 <0.000010>
10031 21:14:40.892492 read(3, "\200\4\225S\0\0\0\0\0\0\0(K\0K\6\214\24multiprocessing.pool\224\214\7mapstar\224\223\224\214\10__main__\224\214\17worker_function\224\223\224N\205\224\206\224\205\224}\224t\224.", 94) = 94 <0.000010>
10031 21:14:40.892545 futex(0x7f9c3b64e000, FUTEX_WAKE, 1 <unfinished ...>
10032 21:14:40.892888 <... futex resumed>) = 0 <0.005640>
10031 21:14:40.892908 <... futex resumed>) = 1 <0.000351>
10032 21:14:40.893401 read(3, "\0\0\0^", 4) = 4 <0.000030>
10032 21:14:40.893503 read(3, "\200\4\225S\0\0\0\0\0\0\0(K\0K\7\214\24multiprocessing.pool\224\214\7mapstar\224\223\224\214\10__main__\224\214\17worker_function\224\223\224N\205\224\206\224\205\224}\224t\224.", 94) = 94 <0.000026>
10032 21:14:55.794399 --- SIGTERM {si_signo=SIGTERM, si_code=SI_USER, si_pid=10021, si_uid=1000} ---
10024 21:14:55.794512 <... futex resumed>) = ? ERESTARTSYS (To be restarted if SA_RESTART is set) <14.904649>
10031 21:14:55.794578 --- SIGTERM {si_signo=SIGTERM, si_code=SI_USER, si_pid=10021, si_uid=1000} ---
10030 21:14:55.794630 --- SIGTERM {si_signo=SIGTERM, si_code=SI_USER, si_pid=10021, si_uid=1000} ---
10029 21:14:55.794683 --- SIGTERM {si_signo=SIGTERM, si_code=SI_USER, si_pid=10021, si_uid=1000} ---
10028 21:14:55.794730 --- SIGTERM {si_signo=SIGTERM, si_code=SI_USER, si_pid=10021, si_uid=1000} ---
10027 21:14:55.794765 --- SIGTERM {si_signo=SIGTERM, si_code=SI_USER, si_pid=10021, si_uid=1000} ---
10026 21:14:55.794819 --- SIGTERM {si_signo=SIGTERM, si_code=SI_USER, si_pid=10021, si_uid=1000} ---
10025 21:14:55.794853 --- SIGTERM {si_signo=SIGTERM, si_code=SI_USER, si_pid=10021, si_uid=1000} ---
10024 21:14:55.794894 --- SIGTERM {si_signo=SIGTERM, si_code=SI_USER, si_pid=10021, si_uid=1000} ---
10035 21:14:55.794998 <... read resumed> <unfinished ...>) = ?
10034 21:14:55.795029 <... futex resumed>) = ?
10033 21:14:55.795047 <... poll resumed> <unfinished ...>) = ?
10031 21:14:55.795950 +++ killed by SIGTERM +++
10027 21:14:55.795978 +++ killed by SIGTERM +++
```

2.  **Różne wywołania systemowe (`sys_call_demo.py`)**

    Stworzyłem drugi skrypt, który wykonuje proste rzeczy: zapisuje coś do pliku, czyta z niego, a potem próbuje pobrać stronę z internetu. `strace` pokazał, że nawet tak proste operacje to dziesiątki "rozmów" z kernelem – otwieranie i zamykanie plików, łączenie się z siecią, czekanie.

```text
21:13:08.276253 write(1, "\n--- [PID 9658] FILE I/O: Create, Write, Read, Delete ---", 57) = 57 <0.000040>
21:13:08.276411 write(1, "\n", 1)       = 1 <0.000023>
21:13:08.276506 write(1, "-> Writing data to strace_demo_artifact.txt...\n", 47) = 47 <0.000017>
21:13:08.276583 openat(AT_FDCWD, "strace_demo_artifact.txt", O_WRONLY|O_CREAT|O_TRUNC|O_CLOEXEC, 0666) = 3 <0.000144>
21:13:08.276777 fstat(3, {st_mode=S_IFREG|0644, st_size=0, ...}) = 0 <0.000012>
21:13:08.276841 ioctl(3, TCGETS2, 0x7fffc7433d70) = -1 ENOTTY (Inappropriate ioctl for device) <0.000013>
21:13:08.276906 lseek(3, 0, SEEK_CUR)   = 0 <0.000013>
21:13:08.276980 lseek(3, 0, SEEK_CUR)   = 0 <0.000012>
21:13:08.277043 write(3, "This is a test entry for strace.\nThis is a test entry for strace.\nThis is a test entry for strace.\nThis is a test entry for strace.\nThis is a test entry for strace.\nThis is a test entry for strace.\nTh"..., 330) = 330 <0.000023>
21:13:08.277099 close(3)                = 0 <0.000010>
21:13:08.277138 write(1, "-> Reading data from strace_demo_artifact.txt...\n", 49) = 49 <0.000011>
21:13:08.277183 openat(AT_FDCWD, "strace_demo_artifact.txt", O_RDONLY|O_CLOEXEC) = 3 <0.000012>
21:13:08.277223 fstat(3, {st_mode=S_IFREG|0644, st_size=330, ...}) = 0 <0.000008>
21:13:08.277259 ioctl(3, TCGETS2, 0x7fffc7433d70) = -1 ENOTTY (Inappropriate ioctl for device) <0.000008>
21:13:08.277295 lseek(3, 0, SEEK_CUR)   = 0 <0.000007>
21:13:08.277355 lseek(3, 0, SEEK_CUR)   = 0 <0.000008>
21:13:08.277388 fstat(3, {st_mode=S_IFREG|0644, st_size=330, ...}) = 0 <0.000007>
21:13:08.277423 read(3, "This is a test entry for strace.\nThis is a test entry for strace.\nThis is a test entry for strace.\nThis is a test entry for strace.\nThis is a test entry for strace.\nThis is a test entry for strace.\nTh"..., 331) = 330 <0.000013>
21:13:08.277464 read(3, "", 1)          = 0 <0.000008>
21:13:08.277504 close(3)                = 0 <0.000008>
21:13:08.277540 write(1, "-> Deleting file strace_demo_artifact.txt...\n", 45) = 45 <0.000011>
21:13:08.277584 unlink("strace_demo_artifact.txt") = 0 <0.000058>
21:13:08.277676 clock_nanosleep(CLOCK_MONOTONIC, TIMER_ABSTIME, {tv_sec=2078, tv_nsec=732343680}, NULL) = 0 <0.500088>
21:13:08.777863 getpid()                = 9658 <0.000014>
21:13:08.778005 write(1, "\n--- [PID 9658] NETWORK: Socket, Connect, Send ---", 50) = 50 <0.000024>
21:13:08.778101 write(1, "\n", 1)       = 1 <0.000020>
21:13:08.778171 write(1, "-> Opening UDP socket...\n", 25) = 25 <0.000012>
21:13:08.778246 socket(AF_INET, SOCK_DGRAM|SOCK_CLOEXEC, IPPROTO_IP) = 3 <0.000030>
21:13:08.778319 write(1, "-> Connecting to 8.8.8.8:53...\n", 31) = 31 <0.000012>
21:13:08.778410 connect(3, {sa_family=AF_INET, sin_port=htons(53), sin_addr=inet_addr("8.8.8.8")}, 16) = 0 <0.000026>
21:13:08.778484 write(1, "-> Sending empty packet...\n", 27) = 27 <0.000011>
21:13:08.778534 sendto(3, "\0", 1, 0, NULL, 0) = 1 <0.000037>
21:13:08.778711 write(1, "-> Closing socket.\n", 19) = 19 <0.000012>
21:13:08.778762 close(3)                = 0 <0.000014>
21:13:08.778809 write(1, "\nEnd of demonstration.", 22) = 22 <0.000011>
21:13:08.778856 write(1, "\n", 1)       = 1 <0.000010>
21:13:08.778934 rt_sigaction(SIGINT, {sa_handler=SIG_DFL, sa_mask=[], sa_flags=SA_RESTORER|SA_ONSTACK, sa_restorer=0x7fca6d83e4d0}, {sa_handler=0x7fca6dce5aa8, sa_mask=[], sa_flags=SA_RESTORER|SA_ONSTACK, sa_restorer=0x7fca6d83e4d0}, 8) = 0 <0.000009>
21:13:08.781522 munmap(0x7fca6e3b0000, 16384) = 0 <0.000036>
21:13:08.781626 exit_group(0)
```

### **Analiza Logów: Co tu się właściwie dzieje?**

Patrząc na surowe wyniki z `strace` (te fragmenty powyżej), można poczuć się jak w Matrixie. Ale rozbijmy to na czynniki pierwsze. Oto co tak naprawdę "mówi" nasz proces:

1.  **Rozmowa przez rurę (`read(3, ...)`):**
    ```text
    read(3, "\200\4\225S\0\0\0\0\0\0\0(K\0K\4\214\24multiprocessing.pool\224..."
    ```
    Widzisz te dziwne znaki i tekst `multiprocessing.pool`? To **Pythonowy `pickle`** w akcji! Główny proces (szef) pakuje (serializuje) zadanie – w tym nazwę funkcji (`worker_function`) i jej argumenty – i wysyła je do procesu potomnego (pracownika) przez deskryptor pliku nr 3 (zazwyczaj pipe lub socket). To dowód na to, że w Linuxie "wszystko jest plikiem" – nawet komunikacja między procesami.

2.  **Czekanie na zielone światło (`futex`):**
    ```text
    futex(0x7f9c3b64e000, FUTEX_WAKE, 1)
    futex(0x7f9c39bc89f0, FUTEX_WAIT_BITSET_PRIVATE...)
    ```
    `futex` (Fast Userspace Mutex) to mechanizm synchronizacji. Kiedy widzisz dużo `futex` w logach, oznacza to, że procesy próbują się dogadać: "Teraz ja piszę", "Czekam, aż skończysz". Jeśli Twoja aplikacja spędza większość czasu w `futex`, może to oznaczać problemy z wielowątkowością (np. deadlocki lub zbyt duża rywalizacja o zasoby).

3.  **Cisza w eterze**:
    Zauważyłem ciekawą rzecz: gdy skrypt faktycznie liczył (ciężka matematyka w `cpu_hog.py`), `strace` milczał. Dlaczego? Bo obliczenia dzieją się w **User Space** (przestrzeni użytkownika). `strace` widzi tylko momenty, gdy program prosi Kernel o pomoc (System Calls) – np. o pamięć, dostęp do pliku czy sieci.
    > **Ważne:** Jeśli Twój proces zużywa 100% CPU, a `strace` jest pusty – to dobra wiadomość! Oznacza to, że program faktycznie pracuje, a nie traci czasu na gadanie z systemem.

4.  **Anatomia prostoty (`sys_call_demo.py`)**:
    To, co w Pythonie jest jedną linijką `with open(...)`, dla Kernela jest serią precyzyjnych komend. W logach skryptu demo widać to jak na dłoni:
    *   `openat` – otwarcie pliku.
    *   `fstat` – sprawdzenie jego statusu (rozmiar, uprawnienia).
    *   `ioctl` – próba sterowania urządzeniem (często kończąca się błędem `ENOTTY`, co jest normalne przy zwykłych plikach).
    *   `write` / `read` – faktyczna robota.
    *   `close` – sprzątanie.
    To samo z siecią: `socket` tworzy gniazdo, `connect` nawiązuje połączenie, a `sendto` wysyła dane. `strace` pokazuje, że **nie ma "prostych" operacji** – każda interakcja ze światem zewnętrznym to sformalizowany protokół z Kernelem.

5.  **Strace w kontenerach (Level Pro)**:
    Warto pamiętać, że w świecie Dockera i Kubernetes `strace` nie działa "z pudełka". Ze względów bezpieczeństwa kontenery mają ograniczony dostęp do syscalli innych procesów. Żeby to zadziałało, kontener musi zostać uruchomiony z flagą `--cap-add=SYS_PTRACE`. To wiedza, która ratuje życie przy debugowaniu **CrashLoopBackOff** – kiedy kontener pada zaraz po starcie i logi aplikacji milczą, `strace` podpięty do procesu startowego pokaże dokładnie, na którym pliku lub uprawnieniu system wywalił proces.

### **Twarda Lekcja: multiprocessing i BrokenPipeError**

Najwięcej nauczyłem się, próbując zrozumieć, co dzieje się w tle w skrypcie `cpu_hog.py`, który używa wielu procesów Pythona (`multiprocessing.Pool`). `strace` pokazał, jak procesy rozmawiają ze sobą, używając skomplikowanych mechanizmów, takich jak `futex` (do synchronizacji) i plików w `/dev/shm` (do komunikacji).

Napotkałem też frustrujący błąd `BrokenPipeError`. To była lekcja, że zabicie procesu Pythona w niewłaściwym momencie może zepsuć komunikację między jego częściami. Zrozumiałem, że aby proces zakończył się "grzecznie", trzeba pozwolić mu posprzątać po sobie, a nie odcinać zasilanie.

> **Wniosek:** Debugowanie to sztuka cierpliwości. Zrozumienie błędu często wymaga zaglądania na niższy poziom, a nie tylko czytania ogólnych komunikatów.

## Podsumowanie

Na produkcji, gdzie liczy się każda milisekunda, `strace` bywa zbyt ciężki. Każde przechwycenie wywołania systemowego to kosztowne przełączenie kontekstu, które może odczuwalnie spowolnić aplikację. Tam standardem staje się **eBPF**, które pozwala podglądać kernel niemal bezkosztowo.

Ale żeby wiedzieć, o co pytać kernel przez eBPF, najpierw trzeba zrozumieć same syscalle. Ta sesja z `strace` była moim kolejnym "Hard Way". Teraz, gdy widzę błąd w logach, nie widzę już tylko suchego tekstu – widzę proces, który bezskutecznie dobija się do deskryptora pliku lub gniazda sieciowego. Fundament odfajkowany, idziemy dalej.

---

### **Kod i Narzędzia**

Wszystkie skrypty, których używałem do testowania `strace` (w tym `cpu_hog.py`, `sys_call_demo.py` i `ram_hog.py`), znajdziesz w moim publicznym repozytorium na GitHubie.

![Podgląd repozytorium](/strace-repo-preview.png)

