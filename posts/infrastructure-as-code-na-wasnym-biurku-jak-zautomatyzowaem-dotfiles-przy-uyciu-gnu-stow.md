---
id: '3'
title: 'Infrastructure as Code na własnym biurku. Jak zautomatyzowałem dotfiles przy użyciu GNU Stow.'
date: '2026-01-18'
tags: ['Linux', 'IaC', 'Dotfiles', 'DevOps']
readTime: '7 min'
imageUrl: '/linux_config.png'
excerpt: 'Przeniesienie konfiguracji Linuxa do modelu IaC to milowy krok dla każdego inżyniera. Zobacz, jak wykorzystałem GNU Stow i Git do stworzenia powtarzalnego środowiska pracy (Dotfiles as Code).'
---

### Od ricing-u do Inżynierii Systemowej

Nie oszukujmy się. Każdy, kto zaczynał przygodę z Linuxem, przechodził przez fazę "ricing". Spędzasz 48 godzin dobierając idealny odcień fioletu do paska **Waybar**, a Twoja konfiguracja **Hyprlanda** to dzieło sztuki, nad którym pracowałeś godzinami.

Postanowiłem jednak podejść do tematu profesjonalnie, jako aspirujący Inżynier DevOps – tutaj **wszystko musi być kodem**. Wdrożyłem paradygmat **Dotfiles as Code** przy użyciu narzędzia **GNU Stow**.

### Problem: Brak Kontroli Wersji i Stanu

Mój stack oparty na **Arch Linux**, **Hyprland** i **Kitty** bez odpowiedniego zarządzania był tykającą bombą. Trzymanie konfiguracji bezpośrednio w `~/.config` bez kontroli wersji uniemożliwiało szybki rollback i odtworzenie środowiska na innej maszynie.

### Moje cele:

- **Wersjonowanie:** Każda zmiana musi być commitem w Gicie.
- **Powtarzalność (Provisioning):** Możliwość postawienia całego środowiska jedną komendą na nowym sprzęcie.
- **Modularność:** Łatwe włączanie i wyłączanie konfiguracji poszczególnych aplikacji.

### Rozwiązanie: GNU Stow i Symlinki

Zamiast kopiować pliki, użyłem **symlinków** (dowiązań symbolicznych). Narzędzie **GNU Stow** pozwala trzymać pliki w jednym centralnym repozytorium, a systemowi "wstrzykiwać" jedynie odnośniki do nich w odpowiednie miejsca.

### Architektura repozytorium dotfiles:

```text
~/dotfiles/
├── hypr/
│   └── .config/hypr/hyprland.conf
├── waybar/
│   └── .config/waybar/config
└── starship/
    └── .config/starship.toml
```

> **Lekcja DevOps:** Traktuj swoje pliki konfiguracyjne jak kod źródłowy aplikacji. Struktura katalogów w repozytorium powinna odzwierciedlać strukturę docelową w systemie, co ułatwia zarządzanie stanem.

### Operacja "Atomic Switch" (&&)

Największym wyzwaniem była migracja na "żywym organizmie". Musiałem usunąć aktywną konfigurację menedżera okien i zastąpić ją linkiem do repozytorium bez przerywania sesji graficznej.

Zastosowałem technikę **atomowego przełączenia** przy użyciu operatora logicznego `&&`:

```bash
rm -rf ~/.config/hypr && stow -t ~ hypr
```

Dzięki temu polecenie `stow` wykonuje się **natychmiast** po udanym usunięciu starego katalogu. System nie ma szansy zauważyć braku pliku konfiguracyjnego, co zapewnia ciągłość działania usługi (w tym przypadku Twojego GUI).

### Wynik i Korzyści

Dzięki podejściu **IaC (Infrastructure as Code)** na poziomie desktopu, zyskałem:

1. **Backup:** Pełna historia zmian i możliwość powrotu do dowolnej wersji konfiguracji.
2. **Security:** Świadome zarządzanie sekretami – wrażliwe dane są wykluczone przez `.gitignore`.
3. **Portability:** `git clone` + `stow` = gotowe środowisko pracy w mniej niż 5 minut na nowym systemie.

### Next Steps: Automatyzacja 2.0 (Ansible i Chezmoi)

GNU Stow to świetny początek, ale dążę do pełnej **idempotentności**. Kolejnym krokiem będzie migracja na **Ansible**. Dlaczego? Ansible pozwoli nie tylko zarządzać linkami, ale również automatycznie instalować niezbędne pakiety i konfigurować system od zera, bez względu na dystrybucję.

Warto też wspomnieć o **chezmoi** – to potężne narzędzie dedykowane stricte pod dotfiles, które świetnie radzi sobie z zarządzaniem sekretami (np. integracja z Bitwardenem czy 1Password) oraz różnicami w konfiguracji między wieloma maszynami. Jeśli Stow przestanie wystarczać, chezmoi będzie moim następnym przystankiem.