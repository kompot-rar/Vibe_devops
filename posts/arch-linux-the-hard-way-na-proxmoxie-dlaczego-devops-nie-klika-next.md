---
id: '5'
title: 'Arch Linux "The Hard Way" na Proxmoxie. Dlaczego DevOps nie klika "Next"?'
date: '2026-01-01'
tags: ['ArchLinux', 'Proxmox', 'DevOps', 'LearnByDoing']
readTime: '4 min'
imageUrl: '/serwerownia4.png'
excerpt: 'Instalacja Linuxa przez klikanie "Dalej" nie uczy niczego. Zobacz, jak manualna instalacja Archa na Proxmoxie stała się moim kursem architektury systemów i fundamentem pod automatyzację.'
---

Instalacja Linuxa w 2026 roku jest prosta. Wkładasz pendrive, klikasz "Dalej", wybierasz strefę czasową i gotowe. Masz system, ale nie masz pojęcia, jak działa.

Jako aspirujący DevOps Engineer, postanowiłem pójść pod prąd. Zamiast gotowego obrazu cloud-init, wybrałem manualną instalację **Arch Linuxa** na wirtualizatorze Proxmox. Dlaczego? Bo **Arch wymusza zrozumienie**. Nie ukrywa niczego pod maską GUI. Jeśli nie wiesz, czym jest partycja EFI albo jak działa `fstab`, system po prostu nie wstanie.

### Co dokładnie zrobiłem?

Środowisko to maszyna wirtualna na moim domowym klastrze (ThinkCentre):
- **Hypervisor:** Proxmox VE 8.
- **VM Config:** UEFI (OVMF), VirtIO SCSI, CPU type: Host.
- **OS:** Arch Linux (Rolling Release).

### Czego się nauczyłem?

### 1. Storage to nie magia

Musiałem ręcznie podzielić wirtualny dysk przy użyciu `sgdisk`/`cfdisk`. Zrozumiałem dzięki temu, dlaczego **UEFI** wymaga partycji FAT32 i że **Swap** to nie tylko plik, ale może być dedykowaną partycją ratującą życie przy małej ilości RAM.

> **Lekcja bolesna:** Źle wpisany rozmiar partycji (1M zamiast 1G) nauczył mnie weryfikacji (`lsblk` vs `fdisk`) i tego, że kernel nie zawsze odświeża tablicę partycji od razu (`partprobe`).

### 2. Chroot = Prehistoria Kontenerów

Moment przejścia z LiveISO do systemu na dysku za pomocą `arch-chroot` to świetna lekcja izolacji procesów. To fundament, na którym później zbudowano Dockera. Zmieniasz "root" (korzeń) systemu plików i działasz wewnątrz nowej struktury.

### 3. Bootloader musi wiedzieć, co robić

System sam z siebie nie wie, gdzie jest kernel. Ręczna konfiguracja **systemd-boot** pozwoliła mi zrozumieć proces startu systemu:



**Przebieg:** UEFI -> Partycja EFI -> Loader -> Kernel -> Initramfs -> Root Filesystem.

**Bash Automagic:**
Konfigurowanie wpisu bootloadera wymaga podania `PARTUUID` partycji root. Zamiast przepisywać ręcznie 36 znaków, użyłem *command substitution*:

```bash
echo "options root=PARTUUID=$(blkid -s PARTUUID -o value /dev/vda3) rw" >> /boot/loader/entries/arch.conf
```

Dzięki temu Bash sam "wyciągnął" ID partycji. **Automatyzacja > Ręczne klepanie.**

### 4. Git & Stow od pierwszej minuty

Gdy tylko postawiłem SSH, nie konfigurowałem maszyny ręcznie. Wykorzystałem swoje dotfiles:

```bash
git clone git@github.com:kompot-rar/dotfiles.git
cd dotfiles && stow bash vim
```

Dzięki **GNU Stow** moja konfiguracja (`.bashrc`, `.vimrc`) wjechała na serwer w 30 sekund. To małe wdrożenie **Infrastructure as Code** na poziomie użytkownika.

### Podsumowanie

Następny krok? Zamienienie tej manualnej męczarni w kod **Terraforma**. Ale żeby coś zautomatyzować, najpierw trzeba to zrozumieć. Ten proces dał mi pewność siebie w debugowaniu systemów, której nie kupisz żadnym kursem na Udemy.