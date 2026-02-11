---
id: '16'
title: 'Migracja na K3s: Zamieniłem prostego Dockera w DevOpsową Gwiazdę Śmierci'
date: '2026-02-11'
tags: ['K3s', 'Kubernetes', 'Terraform', 'Ansible', 'CI/CD', 'Homelab']
readTime: '5 min'
imageUrl: '/k3s-migration-v2-1770824382.png'
excerpt: 'Od Terraformowania LXC, przez Ansible, aż po hybrydowe CI/CD z lokalnym rejestrem. Pełny zapis walki o idealną infrastrukturę.'
---

Dzisiaj wjechał temat, który od dawna wisiał na mojej **ROADMAPIE DO CKA**: Migracja bloga na klaster Kubernetes (K3s). Ale nie byle jaka. Zrobiłem to w stylu "Overkill is Underrated".

Zamiast po prostu wrzucić to na klaster, zbudowałem **"Kuźnię" (The Forge)** – dedykowany, lokalny system CI/CD, który mieli buildy szybciej, niż zdążysz powiedzieć "kubectl apply".

Oto jak to wygląda pod maską.

## 1. Architektura: The Forge ("Kuźnia")

Mój klaster K3s potrzebował wsparcia. Potrzebowałem miejsca, gdzie:
1. Budują się obrazy (bez zapychania CPU na masterze).
2. Obrazy są trzymane lokalnie (po co pchać GB danych do GHCR, skoro serwer stoi metr dalej?).

Rozwiązanie? **LXC Container na Proxmoxie**, postawiony oczywiście jako IaC.

### Terraform: Powstanie Kuźni
Nie klikamy w GUI Proxmoxa. Definiujemy stan. Oto fragment mojego `kuznia.tf`:

```hcl
resource "proxmox_virtual_environment_container" "kuznia" {
  node_name = "proxmox-worker" 
  vm_id     = 200

  initialization {
    hostname = "kuznia"
    ip_config {
      ipv4 {
        address = "10.0.20.50/24" # VLAN 20 - szybka ścieżka do K3s
        gateway = "10.0.20.1"
      }
    }
  }

  # KLUCZOWE: Nesting włączony, żeby Docker działał w LXC
  features {
    nesting = true
  }
  
  unprivileged = true # Security first!
}
```

## 2. Ansible: Konfiguracja "Bez Dotykania"

Jak już Terraform wypluł kontener, wjechał Ansible. Zadania?
1. Zainstalować Dockera.
2. Postawić lokalny rejestr obrazów (`registry:2` na porcie 5000).
3. Zarejestrować **GitHub Self-Hosted Runnera**.

Największy flex? **Automatyczna rejestracja runnera**. Ansible sam gada z API GitHuba, pobiera token rejestracyjny i wpina maszynę do repo. Zero wklejania tokenów do terminala.

Fragment `setup_kuznia.yml`:

```yaml
    - name: Skonfiguruj i zarejestruj runnera (Unattended)
      command: >
        ./config.sh --url https://github.com/kompot-rar/Vibe_devops
        --token {{ registration_response.json.token }}
        --name "Kuznia-LXC"
        --labels "k3s-dev"
        --unattended
```

## 3. Pipeline: Hybrydowe CI/CD (Lokalnie + Chmura)

Pipeline działa tak:
1. **GitHub** widzi pusha.
2. **Kuźnia** (mój lokalny runner) wstaje.
3. **Build:** Docker buduje obraz na dysku NVMe (cache działa błyskawicznie).
4. **Push:** 
    *   Główny strzał leci do `localhost:5000` (Lokalny Rejestr). Transfer? Gigabit LAN. Czas? Sekundy.
    *   Backup leci do GHCR (Cloud), żeby mieć kopię zapasową.

Mój `.github/workflows/deploy.yml` po tuningu:

```yaml
  build-k8s:
    runs-on: k3s-dev # Celujemy w Kuźnię po etykiecie
    steps:
      - name: Build & Push (Local & GHCR)
        env:
          GHCR_IMAGE: ghcr.io/${{ github.repository_owner }}/vibe-devops:dev
          LOCAL_IMAGE: localhost:5000/vibe-devops:dev
        run: |
          echo "Building image on The Forge..."
          docker build -t $GHCR_IMAGE -t $LOCAL_IMAGE .
          
          echo "Pushing to local registry (Speed: 🚀)..."
          docker push $LOCAL_IMAGE
          
          echo "Pushing to GHCR (Backup)..."
          docker push $GHCR_IMAGE
```

## 4. Kubernetes & GitOps: Finał

Na końcu K3s pobiera obraz z lokalnego rejestru (`10.0.20.50:5000`). Musiałem przekonać K3s, żeby ufał rejestrowi HTTP (insecure), ale Ansiblem podmieniłem `registries.yaml` na wszystkich nodach w 3 sekundy.

Aplikacja jest wystawiona na świat przez **Cloudflare Tunnel**. Zero otwartych portów na routerze, pełny SSL, zero stresu.

Manifest `deployment.yaml` (czysta poezja):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: blog-dev
  namespace: dev
spec:
  replicas: 2 # High Availability w domu? Czemu nie.
  template:
    spec:
      containers:
      - name: blog
        image: 10.0.20.50:5000/vibe-devops:dev # <--- Tu jest magia!
        imagePullPolicy: Always
```

## Finał!

Ostateczny test przyszedł 10 lutego, kiedy branch `main` oficjalnie wjechał na klaster. Po drodze musiałem jeszcze powalczyć z KUBECONFIG-iem dla zewnętrznego runnera (wskazanie na VIP klastra 10.0.20.10 było kluczowe) i odświeżyć tunel Cloudflare, ale efekt końcowy jest wart każdej minuty debugowania. Blog pod adresem [devops.mrozy.org](https://devops.mrozy.org) działa teraz jako pełnoprawna usługa klastrowa, a każde `git push` wyzwala lokalny build w "Kuźni" i automatyczny deployment przez ArgoCD.

To nie jest już tylko labowa zabawa – to produkcyjna architektura, gdzie GitOps pilnuje stanu aplikacji, a Cloudflare Tunnel dba o to, by świat widział moje postępy bez wystawiania infrastruktury na strzał. Zamiast prostych kontenerów, mam teraz skalowalny ekosystem, który jest gotowy na kolejne moduły. Następny przystanek? Pełny stos Observability, bo to, co działa na produkcji, musi być przede wszystkim widoczne. 

---
*Repozytorium projektu: [GitHub](https://github.com/kompot-rar/Vibe_devops)*
