# Strategia Rozwoju: Operacja "Deep Link"

## Cel
Umożliwić bezpośrednie linkowanie do poszczególnych postów (np. `devops.mrozy.org/blog/9` lub `devops.mrozy.org/blog/moj-post`), aby wspierać SEO i udostępnianie w mediach społecznościowych. Obecnie aplikacja działa jako SPA bez routingu dla postów, co uniemożliwia linkowanie zewnętrzne.

## Faza 1: Frontend Refactoring (React)

1.  **Ekstrakcja Widoku Posta:**
    *   Wydzielić logikę wyświetlania pojedynczego posta z `components/BlogList.tsx` do dedykowanego komponentu (np. `components/BlogPostView.tsx` lub użyć istniejącego `ArticleView.tsx`).
    *   Komponent ten musi pobierać ID/Slug z parametru URL (hook `useParams` z `react-router-dom`).
    *   Obsłużyć przypadek, gdy post o danym ID nie istnieje (strona 404 lub przekierowanie).

2.  **Zmiana Logiki Listy (`BlogList.tsx`):**
    *   Usunąć lokalny stan `useState` (`selectedPost`) odpowiedzialny za renderowanie "modala" z postem.
    *   Zastąpić obsługę `onClick` komponentem `<Link to={'/blog/' + post.id}>` (lub slug).

3.  **Aktualizacja Routera (`App.tsx`):**
    *   Dodać nową definicję trasy (Route).
    *   Schemat: `<Route path="/blog/:id" element={<BlogPostView posts={INITIAL_POSTS} />} />`.

## Faza 2: SEO & UX (Slugi)

4.  **Human-Readable URLs (Slugs):**
    *   Zamiast ID (`/blog/9`), używać przyjaznych nazw (`/blog/bastion-architektura-totalna`).
    *   Dodać pole `slug` do struktury danych `INITIAL_POSTS`.
    *   Dostosować routing do obsługi slugów.

## Faza 3: Infrastruktura (Homelab / Nginx) - KRYTYCZNE

5.  **Konfiguracja Serwera (SPA Fallback):**
    *   **Problem:** Odświeżenie strony na podstronie (np. `/blog/9`) powoduje błąd 404, ponieważ serwer szuka fizycznego katalogu/pliku na dysku serwera.
    *   **Rozwiązanie:** Skonfigurować Nginx (lub inny serwer WWW), aby przekierowywał wszystkie zapytania niebędące plikami statycznymi do `index.html`.
    *   Przykład konfiguracji Nginx:
        ```nginx
        location / {
            try_files $uri $uri/ /index.html;
        }
        ```
    *   To pozwala React Routerowi przejąć kontrolę nad ścieżką po załadowaniu aplikacji w przeglądarce.

---

## Strategia Rozwoju: Operacja "Markdown Migration" [COMPLETED]

### Cel
Przeniesienie treści postów z kodu źródłowego (`App.tsx`) do osobnych plików `.md` w katalogu `/posts/`. Ułatwi to zarządzanie treścią, pozwoli na pisanie postów w zewnętrznych edytorach i zautomatyzuje proces publikacji w homelabie.

### Faza 1: Przygotowanie Treści i Struktury [DONE]
1. **Utworzenie katalogu `/posts/`**: Miejsce na wszystkie notatki w formacie Markdown.
2. **Konwersja postów**: Przeniesienie obecnych wpisów do plików `.md` z sekcją Frontmatter (tytuł, data, tagi, obrazek).

### Faza 2: Implementacja Logiki Ładowania (Vite) [DONE]
1. **Dynamiczny Import**: Wykorzystanie `import.meta.glob` do automatycznego skanowania katalogu `/posts/`.
2. **Parser Markdown**: Implementacja `postService.ts`, który przetworzy surowe pliki `.md` na obiekty TypeScript zgodne z interfejsem `BlogPost`.
3. **Zastosowanie `gray-matter`**: Do profesjonalnego wyciągania metadanych z plików.

### Faza 3: Refaktoryzacja Komponentów [DONE]
1. **Użycie `react-markdown`**: Zastąpienie autorskiego parsera w `BlogPostView.tsx` standardową biblioteką dla lepszego wsparcia składni.
2. **Async Loading**: Dostosowanie aplikacji do ładowania postów (użycie `useMemo` w `App.tsx`).

### Zalety dla Homelaba
- **GitOps**: Dodanie nowego posta to po prostu `git push`.
- **Prostota**: Brak konieczności utrzymywania bazy danych SQL/NoSQL.
- **Wydajność**: Vite zbuforuje i zoptymalizuje posty podczas budowania aplikacji.