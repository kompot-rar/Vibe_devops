---
id: '18'
title: 'Monitoring z Piekła Rodem: Grafana + Prometheus w moim klastrze Proxmox (GitOps Style!)'
date: '2026-02-21'
tags: ['Kubernetes', 'Grafana', 'Prometheus', 'ArgoCD', 'GitOps', 'Proxmox', 'LenovoTiny']
readTime: '6 min'
imageUrl: '/monitoring-banner.png'
excerpt: 'Wdrożenie kube-prometheus-stack przez ArgoCD. Bitwa o CRD, wyzwania z mDNS na Archu i Server-Side Apply w praktyce. Koniec ze zgadywaniem, czas na twarde metryki.'
---


Pamiętacie mój post o budowie **Homelaba 2.0**? Ten specyficzny projekt złożony z pasji i sprzętu ze śmietnika, który nazywałem "generatorem entropii"? No więc, nadal żyje i ma się świetnie, ale nadszedł czas, żeby przestać zgadywać, czy wszystko działa poprawnie, czy tylko stwarza takie pozory.

Dzisiaj wdrożyłem fundament, bez którego żaden klaster nie ma racji bytu w środowisku produkcyjnym. Bo co z tego, że Twój blog wyświetla się w przeglądarce, skoro nie mam pojęcia, czy moje nody Lenovo nie zbliżają się do limitu zasobów przy większym ruchu?

## 1. Co właściwie postawiłem?

Wybrałem **kube-prometheus-stack** – to absolutny standard rynkowy. To kompletne rozwiązanie, które dostarcza:
*   **Prometheus:** Silnik zbierający i przechowujący metryki (baza danych szeregów czasowych).
*   **Grafana:** Potężne narzędzie do wizualizacji danych, które zamienia suche liczby w czytelne dashboardy.
*   **Node Exporter:** Agent, który wyciąga dane bezpośrednio z "żelaza" moich maszyn Lenovo (CPU, RAM, temperatura, dyski).

## 2. Techniczne wyzwania

Całość została zdefiniowana jako aplikacja w ArgoCD. Chciałem, aby to system GitOps zarządzał cyklem życia całego stosu monitoringu. Oto fragment mojej konfiguracji (a reszta jak zwykle w publicznym repo na githubie):

```yaml
# argocd/apps/monitoring-app.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: monitoring
  namespace: argocd
spec:
  project: default
  source:
    # Wykorzystujemy oficjalne repozytorium Helm społeczności Prometheus
    repoURL: https://prometheus-community.github.io/helm-charts
    targetRevision: 69.1.1
    chart: kube-prometheus-stack
    helm:
      values: |
        grafana:
          enabled: true
          ingress:
            enabled: true
            ingressClassName: traefik
            hosts:
              - grafana.k3s
        # Kluczowa konfiguracja: retencja danych na 10 dni, 
        # aby nie zapchać dysków SSD w moich Lenovo Tiny.
        prometheus:
          prometheusSpec:
            retention: 10d
            storageSpec:
              volumeClaimTemplate:
                spec:
                  accessModes: ["ReadWriteOnce"]
                  resources:
                    requests:
                      storage: 10Gi
  destination:
    server: https://kubernetes.default.svc
    namespace: monitoring
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
      - ServerSideApply=true # <--- Kluczowy parametr dla dużych manifestów!
```

## 3. Dlaczego to nie było takie proste?

W DevOpsie rzadko kiedy "po prostu działa". Podczas wdrożenia napotkałem trzy konkretne problemy, których rozwiązanie czegoś mnie nauczyło:

### 3.1. Limit adnotacji
Prometheus Operator korzysta z bardzo rozbudowanych definicji Custom Resource Definitions (CRD). Kubernetes domyślnie próbuje zapisać cały stan zasobu w adnotacji `kubectl.kubernetes.io/last-applied-configuration`, która ma limit **256KB**. CRD Prometheusa są po prostu za duże na ten mechanizm.

**Rozwiązanie:** Włączenie `Server-Side Apply (SSA)` w ArgoCD. Dzięki temu Kubernetes zarządza zmianami bezpośrednio na serwerze API, bez konieczności upychania wszystkiego do adnotacji. To podejście pomaga przy pracy z dużymi operatorami.

### 3.2. Specyfika mDNS na Linuxie (.local vs .k3s)
Mój system bazowy to Arch Linux. Napotkałem problem z rozwiązywaniem nazw w sieci lokalnej. System uparcie ignorował wpisy w `/etc/hosts` dla domen kończących się na `.local`, zakładając, że powinien obsłużyć je protokół mDNS (Avahi).

Zamiast walczyć z konfiguracją OS na każdym urządzeniu, zmieniłem domenę Ingressa na `grafana.k3s`.

### 3.3. Konflikty uprawnień RBAC
Podczas czyszczenia poprzednich prób instalacji pozostały stare definicje `ValidatingWebhookConfiguration`. ArgoCD nie mogło poprawnie zsynchronizować nowych wersji ze względu na konflikty własności. Musiałem ręcznie usunąć pozostałości, aby GitOps mógł w pełni przejąć kontrolę nad spójnością środowiska.

## 4. Wyjście na zewnątrz: Bare Metal Metrics

Szybko odkryłem, że monitoring wewnątrz wirtualek to tylko połowa sukcesu. Kiedy zobaczyłem w Grafanie model dysku `QEMU HARDDISK`, wiedziałem, że zostałem oszukiwany. Moje fizyczne nody Lenovo Tiny mają realne problemy, których maszyna wirtualna po prostu nie widzi.

Musiałem "wyjść na zewnątrz" klastra i podpiąć pod monitoring fizyczne hosty Proxmox.

### 4.1. Ansible: Walka o repozytoria i agenty
Nie będę przecież latał po trzech maszynach i klepał `apt install`. Od czego jest Ansible? Stworzyłem playbooka, który przygotował hosty Proxmox (VLAN 10) do raportowania.

Oczywiście i tutaj nie obyło się bez przygód. Proxmox domyślnie zwraca błędy `401 Unauthorized` przy próbie aktualizacji, bo odwołuje się do płatnych repozytoriów Enterprise. Musiałem użyć "nuklearnego" rozwiązania w Ansible, żeby wyciąć te wpisy i dodać darmowe repozytorium `no-subscription`.

Mój Ansible "Clean Sweep":

```yaml
- hosts: proxmox_nodes
  tasks:
    - name: FORCE - Kill enterprise repos
      shell: "find /etc/apt/ -type f -exec grep -l 'enterprise.proxmox.com' {} + | xargs rm -f || true"

    - name: Install Hardware Spies
      apt:
        name: [prometheus-node-exporter, smartmontools]
        state: present
```

### 4.2. Sieć: Routing między światami (VLAN 10 vs 20)
Tu zaczęły się schody. Klaster K3s siedzi w VLAN 20, a fizyczne hosty Proxmox w VLAN 10. Mój router na Alpine Linux musiał dostać wyraźny rozkaz: "Pozwól Prometheusowi pukać do hostów na portach 9100 i 9633".

Bez odpowiedniej reguły `iptables` w łańcuchu `FORWARD`, Prometheus widziałby tylko `Connection Timeout`. Dopiero po odblokowaniu ruchu, dane zaczęły płynąć.

### 4.3. ArgoCD: Prometheus patrzy na zewnątrz
Jak powiedzieć Prometheusowi, który żyje wewnątrz klastra, żeby sprawdził IP maszyn poza nim? Użyłem `additionalScrapeConfigs`. To taki "backdoor" w definicji Helm Chartu, który pozwala dodawać cele spoza standardowych ServiceMonitorów.

Mój manifest ArgoCD dla Prometheusa:

```yaml
        prometheus:
          prometheusSpec:
            additionalScrapeConfigs:
              - job_name: 'proxmox-nodes'
                scrape_interval: 180s # Nie męczymy dysków bez potrzeby
                static_configs:
                  - targets: ['10.0.10.11:9100', '10.0.10.12:9100', '10.0.10.13:9100']
```

### 4.4. Diagnoza: Sekcja zwłok dysku na żywo
Po przepchnięciu synca w ArgoCD i restartach, w końcu zobaczyłem prawdę. Nie szukałem już w ciemno. Użyłem zapytania `smartmon_reallocated_event_count_raw_value` dla instancji `10.0.10.13`.

**Wynik: 4.**

![Dying Disk Logs](/dying-disk-logs.png)

Ten dysk na trzecim nodzie nie jest "zmęczony". On oficjalnie umiera. 4 relokowane sektory to fizyczne uszkodzenia komórek pamięci. Prometheus właśnie uratował mój klaster przed nagłą awarią, dając mi czas na wymianę sprzętu (choć ja zostawię go jeszcze chwilę dla celów edukacyjnych).

## 5. Wynik końcowy?

Teraz po wejściu na `http://grafana.k3s` widzę wszystko jak na dłoni:
*   **Obciążenie CPU:** Wiem dokładnie, ile zasobów zużywa mój blog na nodzie z procesorem i5.
*   **Stan sprzętu:** Widzę, czy Ryzen 2200GE nie nudzi się zbytnio przy aktualnych zadaniach.
*   **Storage NFS:** Monitoruję zajętość miejsca na moich udziałach sieciowych w czasie rzeczywistym.

## 6. Wniosek

Monitoring to nie jest "ładny dodatek" dla fanów wykresów. To fundament stabilnej infrastruktury. Teraz nie muszę zgadywać, dlaczego aplikacja działa wolniej – ja to po prostu **widzę w metrykach**.

**Następny krok?** Alertmanager. Bo skoro mam już dane, to chcę, aby system automatycznie powiadomił mnie, gdy parametry wyjdą poza bezpieczne ramy.

![Final Grafana Dashboard](/grafana-dashboard-final.png)

