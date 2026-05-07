---
id: '28'
title: 'Prometheus na małym dysku? Było wiadomo, że kiedyś wybuchnie'
date: '2026-05-07'
tags: ['Kubernetes', 'Prometheus', 'NFS', 'Storage', 'Migration']
readTime: '5 min'
imageUrl: '/nfs-migration-banner.png'
excerpt: 'Jak przenieść TSDB Prometheusa na NFS i nie oszaleć – od walki z uprawnieniami po rozwiązywanie problemów z WAL i mmap.'
---

# Prometheus na małym dysku? Było wiadomo, że kiedyś wybuchnie

Podczas stawiania monitoringu celowo zostawiłem Prometheusa na małym local-path 10GB na węźle k3s-master-1, żeby zobaczyć, co stanie się w praktyce, kiedy skończy się miejsce. No i w końcu się stało - zaczęły wywalać się logi SLA, bo storage po prostu dobił do ściany. Eksperyment zaliczony, czas na właściwe rozwiązanie.

Plan był prosty: przenieść Prometheus TSDB z lokalnego storage na nfs-client-ssd - czyli na macierz pod 10.0.10.11. Przy okazji nie chodziło już tylko o większy dysk, ale też o sensowniejszą architekturę. Startowa konfiguracja miała kilka oczywistych wad: brak HA, ryzyko utraty danych przy awarii konkretnego węzła i tylko 10GB miejsca. Docelowo chciałem mieć 40GB na NFS SSD, łatwiejszy backup i możliwość podniesienia poda na dowolnym nodzie.

## Co zmieniłem
Najpierw sprawdziłem, gdzie dokładnie leży obecny PV i gdzie fizycznie są dane na masterze, czyli pod `/var/lib/rancher/k3s/storage/...`. Potem poszła zmiana w GitOpsie - edycja `argocd/apps/monitoring-app.yaml`, konkretnie `storageSpec`, żeby Prometheus dostał nowy storage class i większy wolumen: 40Gi na nfs-client-ssd.

Po stronie klastra nowy storage wystawiłem przez `nfs-client-ssd`, czyli StorageClass oparty o `nfs-subdir-external-provisioner` z `kubernetes-sigs`. To ważny detal, bo Prometheus nie migrował po prostu „na większy dysk”, tylko z `local-path` na dynamicznie provisionowany storage sieciowy, co od razu zmienia sposób myślenia o trwałości danych, dostępności poda i zachowaniu aplikacji na NFS.

Zanim cokolwiek ruszyłem, zrobiłem jedną ważną rzecz: ustawiłem `reclaimPolicy` starego PV na `Retain`. To był ten moment, który odróżnia spokojną migrację od „oops, gdzie są moje dane?”. Dzięki temu po usunięciu PVC Kubernetes nie skasował fizycznych danych z dysku na masterze.

## Migracja danych
Żeby zatrzymać zapis do TSDB, zeskalowałem StatefulSet Prometheusa do zera:

```bash
kubectl scale statefulset ... --replicas=0
```

Potem postawiłem tymczasowego poda migracyjnego, który jednocześnie montował:
- stary hostPath z danymi jako `/old-data`
- nowe PVC na NFS jako `/new-data`

Sam transfer zrobiłem klasycznie:

```bash
cp -rv /old-data/. /new-data/.
```

Brzmi banalnie, ale przy bazie TSDB z tysiącami małych plików to chwilę trwa. Sama kopia była najprostszą częścią całej operacji. Schody zaczęły się dopiero przy odpalaniu Prometheusa na nowym storage.

## Cztery problemy, które zatrzymały start
Pierwszy problem to klasyk przy NFS: **permission denied**. Prometheus próbował pisać na volume, ale NFS zamontował się z domyślnymi uprawnieniami roota, a sam proces działał jako użytkownik 1000. Skończyło się na tymczasowym podzie i ręcznym:

```bash
chown -R 1000:2000 /data
```

Drugi problem był bardziej podstępny. Prometheus startował, ale wyglądał tak, jakby nie miał żadnej historii. Powód: **subPath**. W specyfikacji StatefulSeta dane były oczekiwane pod katalogiem `prometheus-db`, a ja skopiowałem je do roota nowego wolumenu. Sam storage był poprawny, ale struktura katalogów już nie. Po przeniesieniu plików TSDB do `prometheus-db/` historia wróciła na właściwe miejsce.

Trzecia blokada dotyczyła **WAL**. Przy starcie TSDB dostałem błąd `segments are not sequential`. W katalogu `wal/` pojawił się plik `00000000`, mimo że realna sekwencja po checkpointach zaczynała się od `00002115`. Prometheus 3.x bardzo pilnuje spójności segmentów WAL, więc taki jeden zły plik wystarczył, żeby całość się wyłożyła. Finalnie pomogło ręczne usunięcie błędnego segmentu `00000000`.

Czwarty problem był najbardziej „nfsowy” z całej listy. Prometheus kończył start panicem:

`Unable to create mmap-ed active query log`

Chodziło o plik `queries.active`. Prometheus próbuje używać `mmap`, a NFS nie zawsze dobrze sobie z tym radzi. Testowałem parametry typu `no-lockfile` i `additionalArgs`, ale w praktyce skuteczne okazało się wyczyszczenie tego pliku i agresywne `chmod 777` na katalogu roboczym, żeby silnik mógł się poprawnie zainicjalizować.

## Jak sprawdziłem, że wszystko działa
Po naprawieniu tych czterech rzeczy Prometheus wstał już poprawnie i załadował bazę. Najważniejsze było dla mnie to, że historia SLA nie zniknęła. Zweryfikowałem to zapytaniem:

```promql
count_over_time(sla:availability:daily[30d])
```

Wynik pokazał 14,705 punktów danych, więc historia została odzyskana. Dodatkowo status-proxy po restarcie znowu zaczął poprawnie serwować dane SLA na frontend. Na koniec `df -h` potwierdziło, że pod widzi pełną macierz NFS - łącznie około 1.8T dostępnego storage pod zamontowanym PVC.

## Co z tego wyniosłem
1. **Monitoring nie jest stateless.** Prometheus to nie jest kolejny deployment, któremu tylko podmieniasz YAML i liczysz, że reszta zrobi się sama. TSDB ma stan, ma strukturę, ma WAL i ma konkretne wymagania przy starcie.
2. **NFS potrafi być bardzo wygodny, ale ma swoje pułapki.** Uprawnienia, UID/GID, blokowanie plików, mmap - to nie są detale, które można ignorować. W praktyce widać, dlaczego w bardziej dopracowanych setupach pliki tymczasowe, takie jak `queries.active`, często lądują na `emptyDir`, zamiast siedzieć bezpośrednio na storage sieciowym.
3. **Logi naprawdę prowadzą za rękę.** Każda blokada była opisana wprost - permission denied, problem z subPath, niespójność WAL, panic przy mmap. W tej migracji największą robotę zrobiło nie zgadywanie, tylko spokojne czytanie logów do końca i poprawianie jednej warstwy naraz.

Ta akcja zaczęła się od kontrolowanego braku miejsca na storage dla Prometheusa, a skończyła na pełnej migracji TSDB na NFS SSD z zachowaniem historii SLA.
