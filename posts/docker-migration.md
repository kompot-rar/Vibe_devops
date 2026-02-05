jobs:
  # STARY ŚWIAT: Pliki na LXC
  deploy-legacy:
    if: github.ref == 'refs/heads/main'
    runs-on: [self-hosted, linux, homelab]
    steps:
       - run: sudo cp -r dist/. /var/www/html/

  # NOWY ŚWIAT: Testowanie obrazu
  deploy-test-image:
    if: github.ref == 'refs/heads/docker-migration'
    runs-on: [self-hosted, linux, docker]
    steps:
       - run: docker compose up -d --pull always
```

