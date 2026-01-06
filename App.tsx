import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import BlogList from './components/BlogList';
import Roadmap from './components/Roadmap';
import AdminPanel from './components/AdminPanel';
import { BlogPost } from './types';
import { Github, Linkedin, Server } from 'lucide-react';

const INITIAL_POSTS: BlogPost[] = [
  {
    id: '1',
    title: 'Od serwisów *Arr na starym TV do własnej chmury. Mój Homelab.',
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
    content: "Zarządzanie domowym serwerem przez GUI (Proxmox) jest wygodne, ale mało rozwojowe. Chcąc wejść w świat DevOps na poważnie, musiałem zmienić paradygmat: **traktować infrastrukturę jak kod (IaC)**.\n\nPostanowiłem zasymulować środowisko produkcyjne, gdzie mój laptop jest jedynie stacją kontrolną (Control Node), a fizyczny serwer (Infrastructure Node) wykonawcą, którego stanu nigdy nie modyfikuję ręcznie.\n\nOto architektura mojego rozwiązania i – co ważniejsze – problemy, które rozwiązałem po drodze.\n\n## Faza 1: Fundamenty (Terraform & IaC)\n\nPierwszym krokiem było odcięcie się od \"klikania\" w panelu Proxmoxa. Wykorzystałem **Terraform** z providerem `telmate/proxmox`, aby zdefiniować zasoby w plikach `.tf`.\n\n### Schemat Architektury CI/CD\n\n![Diagram Architektury](/diagram_architektury.png)\n\n### Architektura:\n- **Control Node:** ThinkPad (Arch Linux + Hyprland). Tu piszę kod.\n- **Target:** ThinkCentre (Proxmox VE). Tu żyją kontenery LXC.\n- **Bezpieczeństwo:** Wrażliwe dane (tokeny API, klucze SSH) wyniosłem do `variables.tf` i zmiennych środowiskowych, dbając o to, by nie trafiły do repozytorium (GitOps hygiene).\n\n**Lekcja:** Zrozumiałem, czym jest **State Management**. Terraform to nie skrypt bashowy – on pamięta stan infrastruktury. Jeśli usunę zasób z kodu, zniknie on z serwera. To daje pewność, że środowisko jest dokładnie takie, jak w dokumentacji.\n\n## Faza 2: Configuration Management (Ansible)\n\nPowołanie \"gołego\" kontenera to dopiero początek. Musiałem go skonfigurować w sposób powtarzalny (Idempotency). Do tego użyłem **Ansible**.\n\nGłówne wyzwania w Playbookach:\n\n1. **Webserver:** Instalacja Nginx i (co kluczowe) konfiguracja pod **React SPA** (obsługa `try_files`, aby routing działał po stronie klienta, a nie serwera).\n2. **Self-Hosted Runner:** Automatyczna rejestracja agenta GitHub Actions.\n\n```yaml\n# Snippet: Dynamiczne pobieranie tokena w Ansible\n- name: Pobierz token rejestracyjny z GitHub API\n  uri:\n    url: \"[https://api.github.com/repos/](https://api.github.com/repos/){{ github_account }}/{{ github_repo }}/actions/runners/registration-token\"\n    method: POST\n    headers:\n      Authorization: \"token {{ github_pat }}\"\n```\n\n## Faza 3: CI/CD Pipeline (GitHub Actions)\n\nCelem był pełny automat: `git push` ma skutkować nową wersją strony na produkcji. Ze względu na to, że serwer stoi w sieci domowej (za NAT-em/CGNAT), nie mogłem użyć standardowych webhooków z chmury.\n\n**Rozwiązanie: Self-Hosted Runner.**\nRunner zainstalowany na moim kontenerze nawiązuje połączenie wychodzące (long-polling) do GitHuba.\n\n**Zaleta Security:** Zero otwartych portów na routerze. Zero VPN-ów. Pełna izolacja sieci domowej.\n\nMój Workflow (`deploy.yml`):\n- **Environment Check:** Weryfikacja wersji Node.js (wymuszona v20+ dla Vite).\n- **Build:** Wstrzyknięcie sekretów (API Keys) i budowanie aplikacji (`npm run build`).\n- **Deploy:** Atomowa podmiana plików w `/var/www/html` i restart usług.\n\n## 4. War Stories (Troubleshooting) 🐛\n\nTo tutaj nauczyłem się najwięcej. Teoria to jedno, ale \"produkcja\" (nawet domowa) weryfikuje wszystko.\n\n### 1. \"Biały Ekran Śmierci\" i Zmienne Środowiskowe\nAplikacja działała lokalnie, ale na produkcji widziałem pusty ekran.\n- **Diagnoza:** React/Vite \"wypala\" zmienne środowiskowe (`VITE_API_KEY`) w kodzie JS podczas budowania (Build Time), a nie podczas działania. GitHub Actions Runner nie miał dostępu do moich sekretów API Gemini.\n- **Fix:** Skonfigurowanie `secrets` w GitHub i przekazanie ich jawnym argumentem do procesu `npm run build` w pipeline.\n\n### 2. Routing w SPA (404 Not Found)\nPo wejściu na podstronę `/admin` i odświeżeniu, Nginx zwracał 404.\n- **Przyczyna:** Nginx szukał fizycznego katalogu `/admin`, który w React Routerze jest wirtualny.\n- **Fix:** Implementacja dyrektywy `try_files $uri $uri/ /index.html;` w konfiguracji Nginxa (wdrożona przez Ansible, aby była trwała).\n\n### 3. Permissions Hell\nRunner działa jako użytkownik `runner`, ale Nginx serwuje pliki z katalogu należącego do `root` (`www-data`).\n- **Rozwiązanie:** Zamiast dawać Runnerowi pełnego roota (niebezpieczne), skonfigurowałem precyzyjne reguły `sudoers` w Ansible, pozwalając mu tylko na `cp` i `systemctl restart nginx` bez hasła.\n\n## 5. Podsumowanie\n\nTen projekt to coś więcej niż blog. To żywy dowód na to, że potrafię zbudować **kompletny ekosystem**: od Provisioningu (Terraform), przez Konfigurację (Ansible), aż po Wdrożenie Aplikacji (CI/CD, React, Nginx).\n\nKażdy element tej strony, którą czytasz, został wdrożony automatycznie w ciągu 35 sekund od mojego commitu.\n\n**Next Steps:**\n- Wdrożenie monitoringu (Prometheus/Grafana) dla kontenerów LXC.\n- Automatyzacja certyfikatów SSL (Let's Encrypt + DNS Challenge).",
    date: '2026-01-07',
    tags: ['Terraform', 'Ansible', 'CI/CD', 'WarStories'],
    readTime: '8 min',
    imageUrl: '/serwerownia3.png'
  },
  {
    id: '3',
    title: 'Pierwsze kroki z Linuxem',
    excerpt: 'Terminal to Twój najlepszy przyjaciel. Poznaj podstawowe komendy, które uratują Ci życie na serwerze.',
    content: "## Nie bój się czarnego ekranu\n\nTerminal w systemie Linux to potężne narzędzie. Graficzny interfejs zużywa zasoby, których na serwerach produkcyjnych często brakuje.\n\n### Podstawowe komendy\n\n- `ls`: Listuje pliki\n- `cd`: Zmienia katalog\n- `grep`: Szuka tekstu w plikach\n\nOpanowanie potoków (pipes `|`) pozwoli Ci łączyć te proste narzędzia w skomplikowane systemy przetwarzania danych.",
    date: '2026-01-05',
    tags: ['Linux', 'Terminal', 'Basics'],
    readTime: '1 min',
    imageUrl: 'https://picsum.photos/800/401?grayscale'
  }
];

const About: React.FC = () => (
  <div className="max-w-2xl mx-auto bg-slate-900 p-8 rounded-xl border border-slate-800 text-center animate-fade-in">
    <div className="w-24 h-24 bg-emerald-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg shadow-emerald-500/20">
        <Server className="h-12 w-12 text-white" />
    </div>
    <h2 className="text-2xl font-bold text-white mb-4">O Projekcie</h2>
    <p className="text-slate-300 mb-6 leading-relaxed">
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
        className="text-slate-400 transform transition-all duration-300 hover:scale-125 hover:-translate-y-1 hover:text-white hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]"
        aria-label="GitHub Profile"
      >
        <Github size={32} />
      </a>
      
      <a 
        href="https://www.linkedin.com/in/%C5%82ukasz-mr%C3%B3z-b4980039a/" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-slate-400 transform transition-all duration-300 hover:scale-125 hover:-translate-y-1 hover:text-[#0A66C2] hover:drop-shadow-[0_0_15px_rgba(10,102,194,0.6)]"
        aria-label="LinkedIn Profile"
      >
        <Linkedin size={32} />
      </a>
    </div>
  </div>
);

const App: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>(INITIAL_POSTS);

  const handleAddPost = (newPost: BlogPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const handleUpdatePost = (updatedPost: BlogPost) => {
    setPosts(prev => prev.map(post => post.id === updatedPost.id ? updatedPost : post));
  };

  const handleDeletePost = (id: string) => {
    setPosts(prev => prev.filter(post => post.id !== id));
  };

  return (
    <Router>
      <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
        <Navbar />
        
        <main className="flex-grow">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={
                <>
                  <div className="text-center mb-16">
                    <h1 className="text-4xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500 mb-6">
                      DevOps Adventure
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                      Dokumentacja podróży w głąb infrastruktury. Od pojedynczego skryptu do orkiestracji klastrów.
                    </p>
                  </div>
                  <BlogList posts={posts} />
                </>
              } />
              <Route path="/roadmap" element={<Roadmap />} />
              <Route path="/admin" element={
                <AdminPanel 
                  posts={posts} 
                  onAdd={handleAddPost} 
                  onUpdate={handleUpdatePost}
                  onDelete={handleDeletePost} 
                />
              } />
              <Route path="/about" element={<About />} />
            </Routes>
          </div>
        </main>

        <footer className="bg-slate-900 border-t border-slate-800">
          <div className="max-w-7xl mx-auto py-8 px-4 text-center text-slate-500 text-sm">
            <p>&copy; {new Date().getFullYear()} DevOps Starter Hub. Code is Law.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
