import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import BlogList from './components/BlogList';
import BlogPostView from './components/BlogPostView';
import Roadmap from './components/Roadmap';
import { BlogPost } from './types';
import { Github, Linkedin, Server } from 'lucide-react';

const INITIAL_POSTS: BlogPost[] = [
  {
    id: '1',
    title: 'TEST *Arr na starym TV do własnej chmury. Mój Homelab.',
    excerpt: 'Historia o tym, jak lenistwo i stary telewizor zaprowadziły mnie do świata DevOps, Proxmoxa i Terraform.',   
    content: "Cześć! 👋 Witajcie w **DevOps Starter Hub**.\n\n Moja fascynacja Linuxem i DevOpsem nie zaczęła się w serwerowni. Zaczęła się w dużym pokoju, od prostego, ludzkiego **lenistwa**.\n\n### Wszystko zaczęło się od \"Arr\" 🏴‍☠️\n\nJakiś czas temu chciałem stworzyć domowe centrum rozrywki. Miałem stary telewizor i dość ręcznego kopiowania plików na pendrive'y. Odkryłem świat serwisów **Arr** (Radarr, Sonarr itp.) i Home Assistanta.\n\nChciałem tylko, żeby \"samo się robiło\".\n\nAle żeby to \"samo się robiło\", musiałem wejść głębiej.\n- Nagle musiałem zrozumieć, czym są **porty**, żeby dostać się do panelu.\n- Musiałem nauczyć się **Linuxowych uprawnień** (`chmod 777` to nie jest rozwiązanie!), bo serwisy nie mogły zapisywać plików na dysku.\n- Odkryłem **Dockera**, bo instalowanie zależności ręcznie doprowadzało mnie do szału.\n\nWtedy zrozumiałem: to \"dłubanie\" w konfiguracji kręci mnie bardziej niż filmy, które potem oglądam. Zrozumiałem, że to, co robię w domu na małą skalę, na świecie nazywa się **DevOps**.\n\n### Ewolucja: Od TV do ThinkCentre 🖥️\n\nTamten stary sprzęt poszedł w odstawkę. Dziś moje podejście jest bardziej dojrzałe, ale zasada ta sama: **pełna kontrola i automatyzacja**.\n\nMój obecny arsenał to nie przypadkowy złom, ale przemyślany, cichy i energooszczędny setup:\n\n**1. Serce Operacji: Lenovo ThinkCentre Tiny**\nKupiłem poleasingowego \"malucha\", który mieści się w dłoni, ale ma w sobie moc prawdziwego serwera.\n- **CPU:** AMD Ryzen 2200GE \n- **RAM:** 16GB DDR4\n- **OS:** Proxmox VE\n\nTo tutaj Terraform stawia kontenery LXC, a Ansible konfiguruje Nginxa, który serwuje Wam tę stronę. Już nie \"na pałę\", ale zgodnie ze sztuką.\n\n**2. Centrum Dowodzenia: Lenovo ThinkPad T14 g2**\nMój daily driver. Klasyka gatunku.\n- **System:** Omarchy Linux (Arch Linux na sterydach)\n- **Environment:** Hyprland\n- **Vibe:** \"I use Arch, btw\" 😉\n\nPraca na kafelkowym menedżerze okien (Hyprland) to dla mnie esencja produktywności. Terminal stał się moim domem.\n\n### Co tu się będzie działo?\n\nTen blog to żywy dowód moich umiejętności. Ta strona, którą czytasz, nie wisi na gotowym hostingu. Stoi na moim ThinkCentre w Krakowie. Została zbudowana automatycznie przez **GitHub Actions**, wdrożona przez **Self-Hosted Runnera**, a wszystko zdefiniowane jako **Infrastructure as Code**.\n\nBędę tu dokumentował moją podróż:\n- Od prostych skryptów Bashowych,\n- Przez konteneryzację aplikacji,\n- Aż po orkiestrację klastrów (kiedyś).\n\nJeśli szukasz inżyniera, który uczył się na błędach produkcyjnych we własnym domu, a nie tylko z podręcznika – jesteś w dobrym miejscu.\n\n**Code is Law. Terminal is Home.** 🚀",    
    date: '2026-01-06',
    tags: ['Story', 'Wstęp', 'Omnie'],
    readTime: '6 min',
    imageUrl: '/serwerownia2.jpg'
  },
 {
    id: '2',
    title: 'Od ClickOps do Git Push. Jak zbudowałem w pełni zautomatyzowany Homelab.',
    excerpt: 'Zarządzanie serwerem przez GUI jest wygodne, ale mało rozwojowe. Zobacz, jak przeszedłem na Infrastructure as Code, używając Terraform, Ansible i GitHub Actions na sprzęcie ThinkCentre.',
content: "Zarządzanie domowym serwerem przez GUI (Proxmox) jest wygodne, ale mało rozwojowe. Chcąc wejść w świat DevOps na poważnie, musiałem zmienić paradygmat: **traktować infrastrukturę jak kod (IaC)**.\n\nPostanowiłem zasymulować środowisko produkcyjne, gdzie mój laptop jest jedynie stacją kontrolną (Control Node), a fizyczny serwer (Infrastructure Node) wykonawcą, którego stanu nigdy nie modyfikuję ręcznie.\n\n## Faza 1: Fundamenty (Terraform & IaC)\n\nPierwszym krokiem było odcięcie się od \"klikania\" w panelu Proxmoxa. Wykorzystałem **Terraform**, aby zdefiniować zasoby w plikach `.tf`.\n\n### 1. Przygotowanie narzędzi i dostępów\n\n* **Na ThinkPadzie (Arch Linux):** Instalacja była błyskawiczna: `sudo pacman -S terraform`. To stąd zarządzam całym labem.\n* **Na Proxmoxie:** Nie instalowałem żadnych binarek. Zamiast tego przygotowałem „wejście” dla Terraforma – stworzyłem dedykowanego użytkownika i wygenerowałem **API Token**. Dzięki temu Terraform łączy się z serwerem bezpiecznie, bez podawania mojego głównego hasła roota.\n\n### 2. Konfiguracja i definicja zasobów\n\nZdefiniowałem infrastrukturę w plikach `.tf`. Zamiast klikać w GUI, opisałem stan pożądany:\n\n* Wykorzystałem providera `telmate/proxmox`.\n* Stworzyłem zasób `proxmox_lxc`, w którym zadeklarowałem liczbę rdzeni, RAM-u i ścieżkę do szablonu Ubuntu.\n\n> **Lekcja DevOps:** Oddzieliłem wrażliwe dane (tokeny API) od głównego kodu. Sekrety trafiły do pliku `.tfvars`, a plik stanu `.tfstate` (który zawiera pełną mapę mojej sieci) został wykluczony z Gita przez `.gitignore`.\n\n### Schemat Architektury CI/CD\n\n![Diagram Architektury](/diagram_architektury.png)\n\n### Architektura:\n- **Control Node:** ThinkPad (Arch Linux + Hyprland). Tu piszę kod.\n- **Target:** ThinkCentre (Proxmox VE). Tu żyją kontenery LXC.\n- **Bezpieczeństwo:** Wrażliwe dane (tokeny API, klucze SSH) wyniosłem do `variables.tf` i zmiennych środowiskowych, dbając o to, by nie trafiły do repozytorium (GitOps hygiene).\n\n**Lekcja:** Zrozumiałem, czym jest **State Management**. Terraform to nie skrypt bashowy – on pamięta stan infrastruktury. Jeśli usunę zasób z kodu, zniknie on z serwera. To daje pewność, że środowisko jest dokładnie takie, jak w dokumentacji.\n\n## Faza 2: Configuration Management (Ansible)\n\nPowołanie \"gołego\" kontenera to dopiero początek. Musiałem go skonfigurować w sposób powtarzalny (Idempotency). Do tego użyłem **Ansible**.\n\nGłówne wyzwania w Playbookach:\n\n1. **Webserver:** Instalacja Nginx i (co kluczowe) konfiguracja pod **React SPA** (obsługa `try_files`, aby routing działał po stronie klienta, a nie serwera).\n2. **Self-Hosted Runner:** Automatyczna rejestracja agenta GitHub Actions.\n\n```yaml\n# Snippet: Dynamiczne pobieranie tokena w Ansible\n- name: Pobierz token rejestracyjny z GitHub API\n  uri:\n    url: \"[https://api.github.com/repos/](https://api.github.com/repos/){{ github_account }}/{{ github_repo }}/actions/runners/registration-token\"\n    method: POST\n    headers:\n      Authorization: \"token {{ github_pat }}\"\n```\n\n## Faza 3: CI/CD Pipeline (GitHub Actions)\n\nCelem był pełny automat: `git push` ma skutkować nową wersją strony na produkcji. Ze względu na to, że serwer stoi w sieci domowej (za NAT-em/CGNAT), nie mogłem użyć standardowych webhooków z chmury.\n\n**Rozwiązanie: Self-Hosted Runner.**\nRunner zainstalowany na moim kontenerze nawiązuje połączenie wychodzące (long-polling) do GitHuba.\n\n**Zaleta Security:** Zero otwartych portów na routerze. Zero VPN-ów. Pełna izolacja sieci domowej.\n\nMój Workflow (`deploy.yml`):\n- **Environment Check:** Weryfikacja wersji Node.js (wymuszona v20+ dla Vite).\n- **Build:** Wstrzyknięcie sekretów (API Keys) i budowanie aplikacji (`npm run build`).\n- **Deploy:** Atomowa podmiana plików w `/var/www/html` i restart usług.\n\n## 4. War Stories (Troubleshooting) 🐛\n\nTo tutaj nauczyłem się najwięcej. Teoria to jedno, ale \"produkcja\" (nawet domowa) weryfikuje wszystko.\n\n### 1. \"Biały Ekran Śmierci\" i Zmienne Środowiskowe\nAplikacja działała lokalnie, ale na produkcji widziałem pusty ekran.\n- **Diagnoza:** React/Vite \"wypala\" zmienne środowiskowe (`VITE_API_KEY`) w kodzie JS podczas budowania (Build Time), a nie podczas działania.\n- **Fix:** Skonfigurowanie `secrets` w GitHub i przekazanie ich jawnym argumentem do procesu `npm run build` w pipeline.\n\n### 2. Routing w SPA (404 Not Found)\nPo wejściu na podstronę `/admin` i odświeżeniu, Nginx zwracał 404.\n- **Fix:** Implementacja dyrektywy `try_files $uri $uri/ /index.html;` w konfiguracji Nginxa (wdrożona przez Ansible, aby była trwała).\n\n### 3. Permissions Hell\nRunner działa jako użytkownik `runner`, ale Nginx serwuje pliki z katalogu należącego do `root` (`www-data`).\n- **Rozwiązanie:** Zamiast dawać Runnerowi pełnego roota (niebezpieczne), skonfigurowałem precyzyjne reguły `sudoers` w Ansible, pozwalając mu tylko na `cp` i `systemctl restart nginx` bez hasła.\n\n## 5. Podsumowanie\n\nTen projekt to coś więcej niż blog. To żywy dowód na to, że potrafię zbudować **kompletny ekosystem**: od Provisioningu (Terraform), przez Konfigurację (Ansible), aż po Wdrożenie Aplikacji (CI/CD, React, Nginx).\n\nKażdy element tej strony, którą czytasz, został wdrożony automatycznie w ciągu 35 sekund od mojego commitu.\n\n**Next Steps:**\n- Wdrożenie monitoringu (Prometheus/Grafana).\n- Konteneryzacja (Kubernetes).",    
    date: '2026-01-07',
    tags: ['Terraform', 'Ansible', 'CI/CD', 'WarStories'],
    readTime: '10 min',
    imageUrl: '/serwerownia3.png'
},
{
    id: '3',
    title: 'Infrastructure as Code na własnym biurku. Jak zautomatyzowałem dotfiles przy użyciu GNU Stow.',
    excerpt: 'Przeniesienie konfiguracji Linuxa do modelu IaC to milowy krok dla każdego inżyniera. Zobacz, jak wykorzystałem GNU Stow i Git do stworzenia powtarzalnego środowiska pracy (Dotfiles as Code).',
    content: "### Od ricing-u do Inżynierii Systemowej\n\nNie oszukujmy się. Każdy, kto zaczynał przygodę z Linuxem, przechodził przez fazę \"ricing\". Spędzasz 48 godzin dobierając idealny odcień fioletu do paska **Waybar**, a Twoja konfiguracja **Hyprlanda** to dzieło sztuki, nad którym pracowałeś godzinami.\n\nPostanowiłem jednak podejść do tematu profesjonalnie, jako aspirujący Inżynier DevOps – tutaj **wszystko musi być kodem**. Wdrożyłem paradygmat **Dotfiles as Code** przy użyciu narzędzia **GNU Stow**.\n\n### Problem: Brak Kontroli Wersji i Stanu\n\nMój stack oparty na **Arch Linux**, **Hyprland** i **Kitty** bez odpowiedniego zarządzania był tykającą bombą. Trzymanie konfiguracji bezpośrednio w `~/.config` bez kontroli wersji uniemożliwiało szybki rollback i odtworzenie środowiska na innej maszynie.\n\n### Moje cele:\n\n- **Wersjonowanie:** Każda zmiana musi być commitem w Gicie.\n- **Powtarzalność (Provisioning):** Możliwość postawienia całego środowiska jedną komendą na nowym sprzęcie.\n- **Modularność:** Łatwe włączanie i wyłączanie konfiguracji poszczególnych aplikacji.\n\n### Rozwiązanie: GNU Stow i Symlinki\n\nZamiast kopiować pliki, użyłem **symlinków** (dowiązań symbolicznych). Narzędzie **GNU Stow** pozwala trzymać pliki w jednym centralnym repozytorium, a systemowi \"wstrzykiwać\" jedynie odnośniki do nich w odpowiednie miejsca.\n\n### Architektura repozytorium dotfiles:\n\n```text\n~/dotfiles/\n├── hypr/\n│   └── .config/hypr/hyprland.conf\n├── waybar/\n│   └── .config/waybar/config\n└── starship/\n    └── .config/starship.toml\n```\n\n> **Lekcja DevOps:** Traktuj swoje pliki konfiguracyjne jak kod źródłowy aplikacji. Struktura katalogów w repozytorium powinna odzwierciedlać strukturę docelową w systemie, co ułatwia zarządzanie stanem.\n\n### Operacja \"Atomic Switch\" (&&)\n\nNajwiększym wyzwaniem była migracja na \"żywym organizmie\". Musiałem usunąć aktywną konfigurację menedżera okien i zastąpić ją linkiem do repozytorium bez przerywania sesji graficznej.\n\nZastosowałem technikę **atomowego przełączenia** przy użyciu operatora logicznego `&&`:\n\n```bash\nrm -rf ~/.config/hypr && stow -t ~ hypr\n```\n\nDzięki temu polecenie `stow` wykonuje się **natychmiast** po udanym usunięciu starego katalogu. System nie ma szansy zauważyć braku pliku konfiguracyjnego, co zapewnia ciągłość działania usługi (w tym przypadku Twojego GUI).\n\n### Wynik i Korzyści\n\nDzięki podejściu **IaC (Infrastructure as Code)** na poziomie desktopu, zyskałem:\n\n1. **Backup:** Pełna historia zmian i możliwość powrotu do dowolnej wersji konfiguracji.\n2. **Security:** Świadome zarządzanie sekretami – wrażliwe dane są wykluczone przez `.gitignore`.\n3. **Portability:** `git clone` + `stow` = gotowe środowisko pracy w mniej niż 5 minut na nowym systemie.\n\n### Next Steps: Automatyzacja 2.0 (Ansible)\n\nGNU Stow to świetny początek, ale dążę do pełnej **idempotentności**. Kolejnym krokiem będzie migracja na **Ansible**. Dlaczego? Ansible pozwoli nie tylko zarządzać linkami, ale również automatycznie instalować niezbędne pakiety i konfigurować system od zera, bez względu na dystrybucję.",
    date: '2026-01-18',
    tags: ['Linux', 'IaC', 'Dotfiles', 'DevOps'],
    readTime: '7 min',
    imageUrl: '/linux_config.png'
},
  {
    
    id: '4',
    title: 'Kontenery to kłamstwo. Zbudowałem własny runtime w Bashu.',
    excerpt: 'Docker to tylko wygodny interfejs. Prawdziwa izolacja dzieje się w Kernelu. Zobacz jak zrozumieć co naprawdę dzieje się w Podzie Kubernetesa.',
    content: "### Od użytkownika do inżyniera\n\nJeszcze niedawno moja przygoda z Dockerem wyglądała tak: znajdowałem `docker-compose.yml` w internecie, kopiowałem go, robiłem `up` i cieszyłem się, że działa. Miałem tylko mgliste domysły co do tego, co dzieje się pod spodem, ale póki ikonka wieloryba była zielona, byłem zadowolony. Czułem się jak ekspert, a byłem tylko operatorem cudzego kodu.\n\nŻeby to zmienić postawiłem rozebrać tę technologię do rosołu - zbudowałem własny runtime w czystym **Bashu**. Zero Dockera, zero Containerd. Tylko ja, terminal i kernel.\n\nTo nie jest wpis o tym, jak zastąpić Dockera. To wpis o tym, jak przestać klikać „z nadzieją, że zadziała” i zacząć rozumieć inżynierię, która trzyma Internet w kupie.\n\n---\n\n### 1. Warstwy (OverlayFS): Magia \"Copy-on-Write\"\n\n**Docker** nie kopiuje całego systemu plików za każdym razem. Używa **OverlayFS**, żeby nałożyć warstwę \"zapisu\" na warstwę \"odczytu\" (obrazu).  \n\n\n```bash\n# Łączymy bazowy system (lower), folder na zmiany (upper) i folder roboczy (work)\nmount -t overlay overlay -o lowerdir=./alpine_rootfs,upperdir=./container_changes,workdir=./work ./merged_vault\n```\n\n> **Lekcja:** To jest fundament **Image Layers**. Dzięki temu 10 kontenerów opartych na tym samym obrazie zajmuje na dysku miejsce tylko raz. Reszta to tylko lekka warstwa zmian (**Copy-on-Write**). Ja postanowiłem zbudować swój system plików od zera, tak jak robi się to instalując Arch Linuxa – używając pacstrap. \n\n### 2. Sieć (Network Namespaces): Ręczne rzeźbienie rur\n\nTo jest moment, w którym **Docker** automatycznie tworzy mosty sieciowe, ale ja zrobiłem to ręcznie przy użyciu **veth**.\n\n```bash\n# 0. informujemy o kontenerze\nsudo ip netns add moj_kontener\n\n# 1. Tworzymy parę wirtualnych rur\nip link add veth0 type veth peer name veth1\n\n# 2. Jedną rurę wpychamy do \"kontenera\" (namespace)\nip link set veth1 netns moj_kontener\n\n# 3. Nadajemy IP i podnosimy interfejsy\nip netns exec moj_kontener ip addr add 10.0.0.2/24 dev veth1\nip netns exec moj_kontener ip link set veth1 up\n```\n\n> ![ping](docker1.png) **Lekcja:** To co tu widzisz, to manualna robota wtyczki **CNI (Calico/Flannel)**. Każdy Pod w klastrze ma taką swoją rurę podpiętą do wirtualnego switcha hosta. Zrozumienie tego to koniec problemów z \"Network Unreachable\".\n\n### 3. Izolacja (Namespaces): PID 1 i \"Zombie Apocalypse\"\n\nUżywając mechanizmu **Namespaces**, odciąłem proces od reszty systemu. Ale tu pojawia się kluczowy problem: **PID 1**. Jeśli Twój proces zostanie PID-em 1, **Kernel** wymaga od niego sprzątania \"procesów sierot\". Jeśli tego nie robi, Twój kontener zapycha się procesami-widmami `[defunct]`.\n\n ![Widok ps aux - nasz shell jako król wszechświata PID 1](docker2.png)\n*Rys 2. Izolacja PID Namespace - bash widzi tylko siebie.*\n\n### 4. Limity (Cgroups v2): Brutalne kajdanki\n\nW K8s piszesz `limits.memory: \"50Mi\"`. Pod maską **Kernel** używa **Cgroups**. Możesz to kontrolować ręcznie w systemie plików. Ale zamiast ustalać twardy limit odpalam kontener z flagą:\n\n```bash\nsudo systemd-nspawn -D /var/lib/machines/moj-kontener --property=MemoryMax=50M --property=MemorySwapMax=0\n```\n\n![OOM Killer w akcji - twardy limit 50MB](docker4.png)\n*Rys 3. Moment, w którym Cgroup mówi \"dość\" i wysyła sygnał SIGKILL.*\n\n---\n\n### Podsumowanie\n\nDocker to nie jest jedna, monolityczna technologia. To nakładka na konkretne funkcje kernela Linuxa. Celem tego ćwiczenia było zbudowanie \"kontenera\" ręcznie, używając tylko narzędzi systemowych, bez zainstalowanego Dockera - udało się a podejście \"Hard Way\" pomoże zrozumieć, jak naprawdę działa izolacja podów w Kubernetesie.\n\n### Aktualizacja: Projekt BCR\n\nAby udowodnić, że to nie tylko teoria, całą tę wiedzę spisałem w formie jednego skryptu Bash. Tak powstał **Bash Container Runtime (BCR)** – edukacyjne narzędzie, które automatyzuje tworzenie namespaces i cgroups bez użycia Dockera.\n\n**👉 Kod źródłowy na moim GitHub** ![BCR](bcr.png)",
    date: '2026-01-25',
    tags: ['Linux', 'Containers', 'Namespaces', 'Cgroups', 'DevOps', 'HardWay'],
    readTime: '8 min',
    imageUrl: '/docker.png'
},
  
  {
    id: '5',
   title: 'Arch Linux \"The Hard Way\" na Proxmoxie. Dlaczego DevOps nie klika \"Next\"?',
    excerpt: 'Instalacja Linuxa przez klikanie \"Dalej\" nie uczy niczego. Zobacz, jak manualna instalacja Archa na Proxmoxie stała się moim kursem architektury systemów i fundamentem pod automatyzację.',
    content: "Instalacja Linuxa w 2026 roku jest prosta. Wkładasz pendrive, klikasz \"Dalej\", wybierasz strefę czasową i gotowe. Masz system, ale nie masz pojęcia, jak działa.\n\nJako aspirujący DevOps Engineer, postanowiłem pójść pod prąd. Zamiast gotowego obrazu cloud-init, wybrałem manualną instalację **Arch Linuxa** na wirtualizatorze Proxmox. Dlaczego? Bo **Arch wymusza zrozumienie**. Nie ukrywa niczego pod maską GUI. Jeśli nie wiesz, czym jest partycja EFI albo jak działa `fstab`, system po prostu nie wstanie.\n\n### Co dokładnie zrobiłem?\n\nŚrodowisko to maszyna wirtualna na moim domowym klastrze (ThinkCentre):\n- **Hypervisor:** Proxmox VE 8.\n- **VM Config:** UEFI (OVMF), VirtIO SCSI, CPU type: Host.\n- **OS:** Arch Linux (Rolling Release).\n\n### Czego się nauczyłem?\n\n### 1. Storage to nie magia\n\nMusiałem ręcznie podzielić wirtualny dysk przy użyciu `sgdisk`/`cfdisk`. Zrozumiałem dzięki temu, dlaczego **UEFI** wymaga partycji FAT32 i że **Swap** to nie tylko plik, ale może być dedykowaną partycją ratującą życie przy małej ilości RAM.\n\n> **Lekcja bolesna:** Źle wpisany rozmiar partycji (1M zamiast 1G) nauczył mnie weryfikacji (`lsblk` vs `fdisk`) i tego, że kernel nie zawsze odświeża tablicę partycji od razu (`partprobe`).\n\n### 2. Chroot = Prehistoria Kontenerów\n\nMoment przejścia z LiveISO do systemu na dysku za pomocą `arch-chroot` to świetna lekcja izolacji procesów. To fundament, na którym później zbudowano Dockera. Zmieniasz \"root\" (korzeń) systemu plików i działasz wewnątrz nowej struktury.\n\n### 3. Bootloader musi wiedzieć, co robić\n\nSystem sam z siebie nie wie, gdzie jest kernel. Ręczna konfiguracja **systemd-boot** pozwoliła mi zrozumieć proces startu systemu:\n\n\n\n**Przebieg:** UEFI -> Partycja EFI -> Loader -> Kernel -> Initramfs -> Root Filesystem.\n\n**Bash Automagic:**\nKonfigurowanie wpisu bootloadera wymaga podania `PARTUUID` partycji root. Zamiast przepisywać ręcznie 36 znaków, użyłem *command substitution*:\n\n```bash\necho \"options root=PARTUUID=$(blkid -s PARTUUID -o value /dev/vda3) rw\" >> /boot/loader/entries/arch.conf\n```\n\nDzięki temu Bash sam \"wyciągnął\" ID partycji. **Automatyzacja > Ręczne klepanie.**\n\n### 4. Git & Stow od pierwszej minuty\n\nGdy tylko postawiłem SSH, nie konfigurowałem maszyny ręcznie. Wykorzystałem swoje dotfiles:\n\n```bash\ngit clone git@github.com:kompot-rar/dotfiles.git\ncd dotfiles && stow bash vim\n```\n\nDzięki **GNU Stow** moja konfiguracja (`.bashrc`, `.vimrc`) wjechała na serwer w 30 sekund. To małe wdrożenie **Infrastructure as Code** na poziomie użytkownika.\n\n### Podsumowanie\n\nNastępny krok? Zamienienie tej manualnej męczarni w kod **Terraforma**. Ale żeby coś zautomatyzować, najpierw trzeba to zrozumieć. Ten proces dał mi pewność siebie w debugowaniu systemów, której nie kupisz żadnym kursem na Udemy.\n",
    date: '2026-01-01',
    tags: ['ArchLinux', 'Proxmox', 'DevOps', 'LearnByDoing'],
    readTime: '4 min',
    imageUrl: '/serwerownia4.png'
  },
  {
    id: '6',
    title: 'HOMELAB 2.0: Architektura Totalna. Od Druku 3D po Kubernetes.',
    excerpt: 'Zbudowałem własne Data Center w szafie 10 cali – od druku 3D mocowań, przez walkę z umierającym dyskiem, aż po klaster HA.',
    content: `### Prolog: Dar od Boga Chaosu

Znalazłem go, przy kontenerach na odpady - roztrzaskany laptop gamingowy.
Wyjąłem z niego dysk SSD, wsadziłem do klastra i odpaliłem \`smartctl -a\`.
Wynik?
Czerwona ściana tekstu.
- **Reallocated Sector Count:** Wyczerpane.
- **Available Spare Areas:** 0%.
- **Life Remaining:** 20%.

Każdy "racjonalny" człowiek wyrzuciłby go z powrotem do kosza.

**Ja się uśmiechnąłem.**

Uczyniłem z niego Generator Entropii. Zamiast symulować awarie w chmurze (jak Netflixowy Chaos Monkey), zostwiłem ten dysk w klastrze. Teraz Kubernetes musi radzić sobie z fizyczną degradacją sprzętu w czasie rzeczywistym. To najlepszy poligon testowy dla mechanizmów Self-Healing, jaki mogłem sobie wymarzyć.

### Akt 1: The Monolith (Szafa 10" 6U) 
Mój dotychczasowy homelab – tylko jeden terminal i router generował już wystarczający nieporządek. Skalowanie tego bałaganu razy trzy nie wchodziło w grę, jeśli chciałem zachować spokój w domu. Rozwiązaniem stała się czarna, 10-calowa szafa Rack 6U. Sięgnąłem teź po **Open Source Hardware**.
Znalazłem idealne modele 3D do moich terminali, przetopiłem trochę plastiku i uzyskałem dopasowane panele frontowe ukrywając haos i zmieniając stertę starej elektroniki w monolit.

### Akt 2: Żelazna Trójca 

**"Jeden serwer to hobby a trzy to klaster."**

Chciałbym napisać, że z premedytacją postawiłem na infrastrukturę heterogeniczną, by sprawdzić, jak
scheduler Kubernetesa poradzi sobie z żonglowaniem workloadem między maszynami o drastycznie różnej wydajności. Ale bądźmy szczerzy – to czysty przypadek (i okazje na Allegro).

 - **Node 01 (Overlord):** AMD Ryzen 2200GE.
 - **Node 02 (Workhorse):** Intel i5. 
 - **Node 03 (Arbiter):** Legacy i3.

### Akt 3: Sieć to Prawo (VLANs & Firewall) 
Netgear GS108T nie jest najseksowniejszym sprzętem na świecie. Jego interfejs WWW pamięta czasy
Windowsa XP. Ale **robi robotę**. Jest stabilny i uczy jak panować nad ruchem sieciowym na poziomie warstwy drugiej (L2). W świecie chmury koncepcje są te same, tylko kable są wirtualne. Zrozumienie tego na fizycznym sprzęcie to fundament, którego nie da się pominąć.

![Homelab Setup](/homelab2-0.jpg)`,
    date: '2026-02-01',
    tags: ['Bare Metal', '3D Printing', 'Chaos Engineering', 'Homelab', 'Hardware'],
    readTime: '15 min',
    imageUrl: '/homelab_cluster_rack.jpg'
  },

  
{
    id: '7',
    title: 'Jak odciąłem sobie internet i zbudowałem Fortecę',
    excerpt: 'Moja podróż przez meandry sieci komputerowych: od totalnego chaosu do bezpiecznej, posegmentowanej infrastruktury opartej na VLANach i Alpine Linux jako routerze.',   
    content: "## 1. Konfrontacja z Przeszłością: Dlaczego Płaska Sieć Musiała Zostać Zaorana?\nPierwsze co chciałem zrobić w **Homelab 2.0** to porządek z sieciami. Zanim na poważnie zabiorę się za Kubernetesa, chcę mieć pełną konfigurację i jej całkowite zrozumienie. Do nauki wykorzystałem posiadane już usługi **\\*Arr**, których zależności znam na wylot, dzięki czemu mogłem skupić się wyłącznie na samej architekturze. \n\nWiedziałem, że poleje się krew. Sieci były do tej pory moim kryptonitem. To właśnie przez błędy w konfiguracji interfejsów sieciowych reinstalowałem system **kilkukrotnie**, gdy po raz pierwszy stawiałem Dockera bare-metal. Ta frustracja pchnęła mnie ostatecznie w ramiona **Proxmoxa**. Ale tym razem nie szukałem drogi na skróty. Postanowiłem wejść prosto w paszczę lwa i zbudować sieć **The Hard Way**. Żadnych wizardów, czysty routing. Czas wyrównać rachunki.\n\n## 2. Architektura: The Great Wall\nZamiast kupować drogi router albo stawiać ciężkie VM z OPNsense, postanowiłem zrobić to **The Hard Way** – używając czystego Linuxa.\n\n\n   - **Hardware:** Netgear GS108T v2\n   - **Router:** Kontener LXC Alpine Linux\n \n \n   **Segmentacja:**\n - **VLAN 1 (Untrusted):**  Sieć domowa i WiFi z routera ISP. Stąd chińskie żarówki wifi mogą dzwonić do Pekinu. \n      - **VLAN 10 (MGMT):** Proxmox, Switch, Router. Dostęp tylko dla wybranych.\n       - **VLAN 20 (APPS):**  Jellyfin, *Arr, kontenery. Dostępny dla domowników, ale odizolowany od MGMT.\n      - **VLAN 30 (SECURE):** Valut, SSH CA, wrażliwe dane. Odcięty od świata.\n\n## 3. Implementacja: Linux to najlepszy router\nDlaczego LXC? Bo startuje w 2 sekundy i zużywa tyle zasobów co nic.\nCo pod maską?\n  - **dnsmasq:** DHCP i DNS dla każdego VLANu osobno.\n  - **iptables:** Stara szkoła. Polityka `DROP FORWARD`. Wszystko co nie jest dozwolone, jest zabronione.\n  - **Interfejsy:** Proxmox Bridge jako `VLAN-aware`, w środku kontenera `eth1` (vlan 10), `eth2` (vlan 20)...\n\n### 3.1. Techniczne Judo: Tagowanie i Stan\nZamiast stawiać osobną instancję DHCP dla każdego VLANu, użyłem **DHCP Tagging** w dnsmasq. Dzięki temu jeden plik config obsługuje całą sieć, a pakiety nie \"wyciekają\" między strefami:\n\n```bash\n# VLAN 20 (APPS) - Tagowanie interfejsu eth2\ninterface=eth2\ndhcp-range=set:apps,10.0.20.100,10.0.20.200,255.255.255.0,12h\ndhcp-option=tag:apps,option:router,10.0.20.1\n```\n\nW iptables kluczowym elementem był **Stateful Inspection**. Bez tej jednej linijki ruch byłby jednokierunkowy (pakiety by wychodziły, ale odpowiedzi byłyby blokowane):\n```bash\niptables -A FORWARD -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT\n```\nTo sprawia, że firewall \"pamięta\" nawiązane połączenia i automatycznie wpuszcza ruch powrotny. Proste, eleganckie, skuteczne.\n\n### Fragment konfiguracji (\"The Code\"):\n```bash\n# Magic Door - wpuszczaj mój laptop po MAC adresie do strefy śmierci\niptables -A FORWARD -i eth0 -o eth3 -m mac --mac-source xx:xx:xx:xx:xx:xx -j ACCEPT\n```\n\n## 4. Lekcja Pokory: Protokół Próby Ognia\nTo nie poszło gładko. To była 4-dniowa wojna z warstwą drugą i trzecią modelu OSI.\n\n ![Lekcja Pokory](/network_warzone0.jpg) \n\n### A. Port Ratunkowy (The Airlock)\nPierwsza zasada VLANów: Jak zmieniasz PVID na porcie, do którego jesteś wpięty – tracisz dostęp. Zrobiłem to trzy razy.\n**Rozwiązanie:** Port 8 na switchu skonfigurowany jako **Emergency Port** (Untagged VLAN 10). Fizyczny kabel, który ratuje życie, gdy WiFi milczy. A mimo to, kilkukrotnie i tak musiałem zapinać **HDMI** bezpośrednio do nodów, bo poziom \"całkowitej anihilacji\", który serwowałem interfejsom sieciowym, wykraczał poza możliwości jakiegokolwiek portu ratunkowego.\n\n### B. Routing Asymetryczny i \"The Masquerade Hack\"\nTo był boss tej lokacji. Moja trasa wyglądała tak:\n1. Laptop wysyła pakiet do `10.0.20.107` (Jellyfin) przez Router LXC (Brama .123).\n2. Pakiet dociera do Jellyfina.\n3. Jellyfin widzi IP laptopa (`192.168.1.15`). Ponieważ to inna podsieć, wysyła odpowiedź do swojej bramy domyślnej... którą był router domowy (ISP).\n4. Router ISP patrzy na pakiet do `10.0.20.x` i mówi: \"Nie znam gościa\". **DROP.**\n\n**Fix:** Zastosowałem `MASQUERADE` na interfejsach wewnętrznych routera LXC. Dla Jellyfina pakiet wygląda teraz tak, jakby przyszedł od Routera LXC (`10.0.20.1`), więc odpowiedź wraca do Routera, a ten przesyła ją do laptopa. To podręcznikowy przykład, jak rozwiązywać problemy z routingiem w sieciach, nad którymi nie masz pełnej kontroli (brak możliwości dodania tras na routerze ISP).\n\n### C. The Reboot of Death (Persistence)\nKiedy w końcu wszystko działało, dumnie zrobiłem `reboot`. I... ciemność. Cluster padł, sieć zniknęła.\n**Lekcja:** Alpine LXC jest ultra-lekki, ale \"zapominalski\". Zapomniał załadować `ip_forward=1` i reguły `iptables`.\n**Rozwiązanie:** Musiałem ręcznie wymusić start serwisu `sysctl` w boot-loopie i zapisać reguły do `/etc/iptables/rules-save`. Od teraz każda zmiana musi być poprzedzona `/etc/init.d/iptables save`.\n\n### D. Proxmox VLAN-aware Bridge\nZanim w ogóle zacząłem, musiałem przygotować samo podwozie sieciowe. Standardowy bridge w Proxmoxie to \"ślepy\" switch. Musiałem go przełączyć w tryb **VLAN-aware**. To pozwoliło mi na podpinanie kontenerów do konkretnych VLANów bezpośrednio w konfiguracji noda, bez uprawiania partyzantki z sub-interfejsami wewnątrz każdego kontenera.\n\n## 5. Wnioski\nMoja sieć domowa jest teraz bezpieczniejsza niż większość małych firm. Fundamenty są wylane, beton związał. Klęczenie o 3 rano przed klastrem z kablem HDMI w ręku, patrząc na martwe diody switcha i próbując zrozumieć, dlaczego routing asymetryczny właśnie zabił mój dostęp po SSH, nauczyło mnie więcej niż jakikolwiek certyfikat. Teraz wiem dokładnie, co dzieje się z każdym bitem w moim klastrze.\n\n**Status:**\n*   **Networking:** READY.\n*   **Kubernetes:** READY FOR DEPLOYMENT.\n*   **The Hidden Fortress (Vault SSH CA):** INITIALIZING...\n\nNastępny przystanek: Efemeryczne certyfikaty SSH i orkiestracja.",    
    date: '2026-02-01',
    tags: ['Networking', 'Security', 'LXC', 'iptables'],
    readTime: '15 min',
    imageUrl: '/network.png'
  },
  ];

const About: React.FC = () => (
  <div className="max-w-2xl mx-auto bg-thinkpad-surface p-8 rounded-none border border-neutral-800 text-center animate-fade-in shadow-2xl shadow-black/50">
    <div className="w-24 h-24 bg-thinkpad-red rounded-none mx-auto mb-6 flex items-center justify-center shadow-lg shadow-thinkpad-red/20 transform rotate-3 hover:rotate-0 transition-all duration-300">
        <Server className="h-12 w-12 text-white" />
    </div>
    <h2 className="text-2xl font-bold text-white mb-4 font-mono tracking-tighter uppercase">O Projekcie</h2>
    <p className="text-thinkpad-muted mb-6 leading-relaxed font-mono text-sm">
      Witaj na moim blogu! Nazywam się Łukasz Mróz i jestem zafascynowany DevOps. 
      Stworzyłem tę stronę, aby dokumentować moją naukę i dzielić się wiedzą z innymi.
      Korzystam z pomocy sztucznej inteligencji, aby szybciej zrozumieć trudne koncepty.
    </p>
    
    {/* Sekcja ikonek z animacją */}
    <div className="flex justify-center gap-8 mt-8">
      <a 
        href="https://github.com/kompot-rar" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-neutral-500 transform transition-all duration-300 hover:scale-125 hover:-translate-y-1 hover:text-white hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]"
        aria-label="GitHub Profile"
      >
        <Github size={32} />
      </a>
      
      <a 
        href="https://www.linkedin.com/in/%C5%82ukasz-mr%C3%B3z-b4980039a/" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-neutral-500 transform transition-all duration-300 hover:scale-125 hover:-translate-y-1 hover:text-[#0A66C2] hover:drop-shadow-[0_0_15px_rgba(10,102,194,0.6)]"
        aria-label="LinkedIn Profile"
      >
        <Linkedin size={32} />
      </a>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-thinkpad-base flex flex-col font-sans selection:bg-thinkpad-red selection:text-white">
        <Navbar />
        
        <main className="flex-grow">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={
                <>
                  <div className="text-center mb-16">
                    <h1 className="text-4xl sm:text-6xl font-extrabold text-white mb-6 tracking-tight font-mono">
                      DevOps <span className="text-thinkpad-red">Adventure</span>
                    </h1>
                    <p className="text-lg text-thinkpad-muted max-w-2xl mx-auto font-mono border-l-2 border-thinkpad-red pl-4">
                      Dokumentacja podróży w głąb infrastruktury. Od pojedynczego skryptu do orkiestracji klastrów.
                    </p>
                  </div>
                  <BlogList posts={INITIAL_POSTS} />
                </>
              } />
              <Route path="/blog/:slug" element={<BlogPostView posts={INITIAL_POSTS} />} />
              <Route path="/roadmap" element={<Roadmap />} />

              <Route path="/about" element={<About />} />
            </Routes>
          </div>
        </main>

        <footer className="bg-thinkpad-surface border-t border-neutral-800">
          <div className="max-w-7xl mx-auto py-8 px-4 text-center text-neutral-600 text-sm font-mono">
            <p>&copy; {new Date().getFullYear()} DevOps Starter Hub. <span className="text-thinkpad-red">Code is Law.</span></p>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
