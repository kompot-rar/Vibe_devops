# ⚔️ K3s Migration Battle Plan & Current State Snapshot
**Data:** 2026-02-05
**Status:** Docker Migration Complete (Phase 1)
**Target:** 3-Node K3s Cluster (Phase 2)

---

## 1. Inventory: Obecna Architektura (Docker Host)
*To są fundamenty, które musimy przenieść 1:1 do Kubernetesa.*

### A. Dockerfile (Immutable Build)
Kluczowa jest strategia Multi-Stage. W K8s użyjemy dokładnie tego samego obrazu.
```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### B. CI/CD "God Mode" (GitHub Actions)
To musimy zachować w nowym pipeline. Cache'owanie warstw to nasz wyróżnik.
```yaml
- name: Build and Push
  uses: docker/build-push-action@v6
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
    # W K8s tagowanie będzie musiało uwzględniać SHA commita (rolling updates)
    tags: ghcr.io/${{ github.repository_owner }}/vibe-blog:${{ github.sha }}
```

### C. Strangler Fig Logic
Obecnie rozdzielamy ruch na poziomie Jobs w GHA.
*   `refs/heads/main` -> Legacy LXC
*   `refs/heads/docker-migration` -> Docker Host

W fazie K3s:
*   `docker-migration` -> K3s Dev Namespace
*   `main` -> K3s Prod Namespace (po finalnym merge'u)

---

## 2. Action Plan: Wdrożenie K3s (Roadmap)

### Faza 1: Infrastruktura (Hardcore Mode)
**Cel:** 3 węzły fizyczne/VM (M710, M83, M710q).
1.  **Decyzja OS:**
    *   *Opcja Standard:* Debian 12 + K3s Ansible.
    *   *Opcja "Rozkurwiacz":* **Talos Linux**. (Brak SSH, API-first, Immutable OS).
2.  **Cluster Init:**
    *   1x Server (Control Plane).
    *   2x Agents (Workers).
3.  **Storage:** Konfiguracja `Longhorn` lub `NFS Client Provisioner` (korzystając z NAS-a na Proxmoxie) dla persistent volumes (jeśli potrzebne).

### Faza 2: Translacja na Manifesty K8s
Musimy zamienić `docker-compose.yml` na obiekty Kubernetes.

| Docker Compose | Kubernetes Kind | Uwagi |
| :--- | :--- | :--- |
| `services: vibe-blog` | `Deployment` | Ustawimy `replicas: 2` lub `3` dla HA. |
| `ports: 8080:80` | `Service` (ClusterIP) | Nie wystawiamy portów węzła, ruch idzie przez Ingress. |
| - | `Ingress` | Routing ruchu (np. Traefik lub Nginx Ingress) + Cert-Manager (SSL). |

### Faza 3: GitOps (Dominacja)
1.  Instalacja ArgoCD na klastrze.
2.  GitHub Actions: Tylko buduje obraz i aktualizuje plik `k8s/deployment.yaml` (zmienia tag obrazu).
3.  ArgoCD: Widzi zmianę w repozytorium i sam synchronizuje klaster.

### Faza 4: The Great Switch (Merge to Main)
1.  Potwierdzenie stabilności na `docker-migration` (namespace: `dev`).
2.  Merge `docker-migration` -> `main`.
3.  Zmiana trasy w Cloudflare Tunnel / Routerze na Ingress K3s.
4.  Wyłączenie starego LXC (Legacy) i Docker Hosta (CT114).
5.  **Pełne zwycięstwo.**

---

## 3. Ryzyka i Notes
*   **Networking:** Podsieć K3s (CNI - Flannel/Cilium) nie może gryźć się z VLANami domowymi.
*   **Load Balancing:** Potrzebujemy VIP (Virtual IP) dla klastra (Kube-VIP), żeby High Availability miało sens.

**Next Step:** Provisioning maszyn pod K3s.
