---
id: '15'
title: 'Wdrożenie Świętej Trójcy: Terraform, Ansible i ArgoCD'
date: '2026-02-10'
tags: ['Kubernetes', 'GitOps', 'IaC', 'Homelab', 'DevOps']
readTime: '6 min'
imageUrl: '/holy-trinity-banner.png'
excerpt: 'Wdrożyłem "God Mode" Cluster – środowisko K3s HA w pełni zautomatyzowane za pomocą Terraform, Ansible i ArgoCD.'
---

## Architektura: Święta Trójca DevOps

Chęć traktowania mojego klastra jak zasobu w chmurze doprowadziła do pierwszych niepowodzeń. Popularny provider **Telmate**, który z powodzeniem radził sobie z LXC, nie dawał się skonfigurować pod VM z "Golden Image" na trzech niezależnych węzłach. Rozwiązałem to zmianą na provider **bpg**. Mój stack technologiczny:

1.  **Terraform (Provisioning):** Twórca światów. Definiuje maszyny wirtualne w kodzie.
2.  **Ansible (Configuration):** Zarządca. Instaluje, konfiguruje i hartuje systemy operacyjne oraz klaster K3s.
3.  **ArgoCD (Deployment):** Autopilot. Pilnuje, by to, co jest w Gitcie, zawsze działało na klastrze.

Wybrałem K3s, bo to genialny przykład inżynierskiego odchudzania – dostaję pełną certyfikację CNCF i wszystkie mechanizmy, których muszę się nauczyć do CKA, ale bez zbędnego balastu. Na moich ThinkCentre każda setka megabajtów RAMu jest na wagę złota, a K3s traktuje zasoby z ogromnym szacunkiem, pozwalając mi budować gęstą sieć usług zamiast karmić samą infrastrukturę klastra.

## Faza 1: Terraform & Ansible (Nuke & Pave)

Zacząłem od czystej karty. Terraform w kilka sekund powołał do życia trzy nody na moim klastrze Proxmox. Przejście na provider `bpg` pozwoliło mi na elegancką obsługę obrazów Cloud-Init:

```hcl
resource "proxmox_virtual_machine" "k3s_node" {
  count       = 3
  name        = "k3s-node-${count.index}"
  target_node = var.proxmox_nodes[count.index]
  # ... konfiguracja bpg ...
}
```

Chwilę później do akcji wkroczył Ansible.

Moja rola Ansible nie tylko instaluje binarkę K3s. Robi "brudną robotę", o której wielu zapomina:
*   Wyłącza SWAP i tuninguje kernel (moduły `br_netfilter`, `overlay`).
*   Inicjalizuje pierwszy węzeł z embedded etcd (baza danych klastra).
*   Automatycznie dołącza kolejne węzły, tworząc pełne High Availability.

Wynik? **Zero manualnych kroków.** Od "pustego żelastwa" do działającego klastra w mniej niż 10 minut.

![Pierwszy przebieg Ansible - Configuration klastra](/ansible-deployment-v1.png)

## Faza 2: Incydent "The ARP War" (War Story)

Nie ma dobrego projektu bez kryzysu. Podczas wdrażania warstwy sieciowej, klaster nagle zamilkł.

**Objawy:**
*   API Server przestał odpowiadać.
*   Split-brain na bazie etcd.
*   Błędy `no route to host`.

**Diagnoza:** Konflikt w warstwie 2 (L2). Okazało się, że wbudowany w K3s loadbalancer (Klipper) zaczął walczyć z moim rozwiązaniem HA – **Kube-VIP**. Obydwa systemy próbowały rozgłaszać te same adresy MAC/IP przez protokół ARP. To była sieciowa wojna domowa.

**Rozwiązanie (The Fix):**
Zamiast doraźnych poprawek i łatania dziur ręcznie, postawiłem na chłodną analizę i systemowe rozwiązanie problemu:
1.  **Analiza:** Zidentyfikowałem konflikt i zdecydowałem się na migrację Kube-VIP z prostego *Static Pod* do pełnoprawnego *DaemonSet* z RBAC.
2.  **Refaktor Kodu:** Zmodyfikowałem rolę Ansible, wyłączając `servicelb` w K3s i nadając Kube-VIP uprawnienia administratora sieci (`NET_ADMIN`), aby mógł legalnie zarządzać ruchem.
3.  **Nuke & Pave:** Zamiast naprawiać uszkodzony klaster, po prostu go zniszczyłem. Jedna komenda Ansible (`ansible-playbook reset.yml`) wyczyściła wszystko do zera, a kolejna postawiła poprawioną wersję.

W 8 minut byłem z powrotem online. To jest właśnie potęga IaC.

## Faza 3: GitOps z ArgoCD

Gdy klaster wstał, nie dotknąłem już `kubectl apply`. Zainstalowałem ArgoCD i wskazałem mu moje repozytorium Git.

Zastosowałem wzorzec **"App of Apps"**. Jedna główna aplikacja ArgoCD zarządza wszystkimi innymi. Oto definicja mojego głównego Root-App:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: root-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/kompot-rar/kubernetes.git
    targetRevision: HEAD
    path: infrastructure/apps
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

Chcę dodać Ingress? Commit do Gita. Chcę zmienić monitoring? Commit do Gita. ArgoCD wykrywa zmianę i synchronizuje stan klastra.

Jeśli ktoś wejdzie na serwer i ręcznie coś zmieni, ArgoCD to wykryje i automatycznie cofnie te zmiany. To jest właśnie **Self-Healing Infrastructure**.

![Widok synchronizacji i mechanizmu Self-Healing w ArgoCD](/argocd-self-healing.png)

## Podsumowanie

W ramach tej intensywnej iteracji przeszedłem drogę od pustych maszyn do w pełni zautomatyzowanej platformy konteneryzacji, która jest odporna na awarie (HA) i błędy ludzkie (GitOps).

Mam jednak małą refleksję – nie wiem, czy nie rozpędziłem się za bardzo z tym ArgoCD. W końcu moim  celem jest zdanie egzaminu Certified Kubernetes Administrator, gdzie GitOps nie jest głównym tematem, a liczy się "mięso" klastra i biegłość w `kubectl`. Mimo to sama idea automatyzacji i to, jak ArgoCD pilnuje porządku, jest imponujące i daje ogromną satysfakcję.

![Wszystkie węzły klastra w stanie Ready po automatycznej konfiguracji](/k3s-nodes-ready-status.png)

---
*Repozytorium projektu: [github.com/kompot-rar/kubernetes](https://github.com/kompot-rar/kubernetes)*