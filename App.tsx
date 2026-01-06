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
    excerpt: 'Historia o tym, jak lenistwo i stary telewizor zaprowadziły mnie do świata DevOps, Proxmoxa i Terraform.',    content: "Cześć! 👋 Witajcie w **DevOps Starter Hub**.\n\n Moja fascynacja Linuxem i DevOpsem nie zaczęła się w serwerowni. Zaczęła się w dużym pokoju, od prostego, ludzkiego **lenistwa**.\n\n### Wszystko zaczęło się od \"Arr\" 🏴‍☠️\n\nJakiś czas temu chciałem stworzyć domowe centrum rozrywki. Miałem stary telewizor (a właściwie podpięty do niego ledwo żywy TV Box/terminal) i dość ręcznego kopiowania plików na pendrive'y. Odkryłem świat serwisów **Arr** (Radarr, Sonarr itp.) i Home Assistanta.\n\nChciałem tylko, żeby \"samo się robiło\".\n\nAle żeby to \"samo się robiło\", musiałem wejść pod maskę.\n- Nagle musiałem zrozumieć, czym są **porty**, żeby dostać się do panelu.\n- Musiałem nauczyć się **Linuxowych uprawnień** (`chmod 777` to nie jest rozwiązanie!), bo serwisy nie mogły zapisywać plików na dysku.\n- Odkryłem **Dockera**, bo instalowanie zależności ręcznie doprowadzało mnie do szału.\n\nWtedy zrozumiałem: to \"dłubanie\" w konfiguracji kręci mnie bardziej niż filmy, które potem oglądam. Zrozumiałem, że to, co robię w domu na małą skalę, na świecie nazywa się **DevOps**.\n\n### Ewolucja: Od TV do ThinkCentre 🖥️\n\nTamten stary sprzęt poszedł w odstawkę. Dziś moje podejście jest bardziej dojrzałe, ale zasada ta sama: **pełna kontrola i automatyzacja**.\n\nMój obecny arsenał to nie przypadkowy złom, ale przemyślany, cichy i energooszczędny setup:\n\n**1. Serce Operacji: Lenovo ThinkCentre Tiny**\nKupiłem poleasingowego \"malucha\", który mieści się w dłoni, ale ma w sobie moc prawdziwego serwera.\n- **CPU:** AMD Ryzen 2200GE (Wydajny, ale chłodny)\n- **RAM:** 16GB (Idealne pod wirtualizację)\n- **OS:** Proxmox VE\n\nTo tutaj Terraform stawia kontenery LXC, a Ansible konfiguruje Nginxa, który serwuje Wam tę stronę. Już nie \"na pałę\", ale zgodnie ze sztuką.\n\n**2. Centrum Dowodzenia: Lenovo ThinkPad**\nMój daily driver. Klasyka gatunku, ale bez Windowsa.\n- **System:** Omari Linux (Arch Linux na sterydach)\n- **Environment:** Hyprland\n- **Vibe:** \"I use Arch, btw\" 😉\n\nPraca na kafelkowym menedżerze okien (Hyprland) to dla mnie esencja produktywności. Terminal stał się moim domem.\n\n### Co tu się będzie działo?\n\nTen blog to żywy dowód moich umiejętności. Ta strona, którą czytasz, nie wisi na gotowym hostingu. Stoi na moim ThinkCentre w Krakowie. Została zbudowana automatycznie przez **GitHub Actions**, wdrożona przez **Self-Hosted Runnera**, a wszystko zdefiniowane jako **Infrastructure as Code**.\n\nBędę tu dokumentował moją podróż:\n- Od prostych skryptów Bashowych,\n- Przez konteneryzację aplikacji,\n- Aż po orkiestrację klastrów (kiedyś).\n\nJeśli szukasz inżyniera, który uczył się na błędach produkcyjnych we własnym domu, a nie tylko z podręcznika – jesteś w dobrym miejscu.\n\n**Code is Law. Terminal is Home.** 🚀",    date: '2026-01-06',
    tags: ['Story', 'Wstęp', 'Omnie'],
    readTime: '6 min',
    imageUrl: 'https://picsum.photos/800/400?grayscale&blur=2'
  },
  {
    id: '2',
    title: 'Dlaczego DevOps to więcej niż narzędzia?',
    excerpt: 'Zrozumienie kultury DevOps jest kluczowe zanim zaczniesz pisać pierwsze pipeline\'y w Jenkinsie czy GitHub Actions.',
    content: "## Kultura ponad narzędziami\n\nWielu początkujących uważa, że DevOps to po prostu znajomość Dockera i Kubernetesa. To błąd. DevOps to metodologia łącząca rozwój oprogramowania (Dev) i utrzymanie infrastruktury (Ops).\n\n### Komunikacja to podstawa\n\nBez dobrej komunikacji między zespołami, nawet najlepsze skrypty Terraform nie pomogą. Celem jest skrócenie cyklu wytwarzania oprogramowania przy zachowaniu wysokiej jakości.\n\n### Automatyzacja\n\nOczywiście, automatyzacja jest ważna. Ale automatyzuj to, co ma sens. Zacznij od prostych skryptów w Bashu lub Pythonie.",
    date: '2023-10-24',
    tags: ['Kultura', 'Wstęp', 'Teoria'],
    readTime: '4 min',
    imageUrl: 'https://picsum.photos/800/400?grayscale&blur=2'
  },
  {
    id: '3',
    title: 'Pierwsze kroki z Linuxem',
    excerpt: 'Terminal to Twój najlepszy przyjaciel. Poznaj podstawowe komendy, które uratują Ci życie na serwerze.',
    content: "## Nie bój się czarnego ekranu\n\nTerminal w systemie Linux to potężne narzędzie. Graficzny interfejs zużywa zasoby, których na serwerach produkcyjnych często brakuje.\n\n### Podstawowe komendy\n\n- `ls`: Listuje pliki\n- `cd`: Zmienia katalog\n- `grep`: Szuka tekstu w plikach\n\nOpanowanie potoków (pipes `|`) pozwoli Ci łączyć te proste narzędzia w skomplikowane systemy przetwarzania danych.",
    date: '2023-10-26',
    tags: ['Linux', 'Terminal', 'Basics'],
    readTime: '6 min',
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
      Witaj na moim blogu! Nazywam się Łukasz i jestem początkującym inżynierem DevOps. 
      Stworzyłem tę stronę, aby dokumentować moją naukę i dzielić się wiedzą z innymi.
      Korzystam z pomocy sztucznej inteligencji, aby szybciej zrozumieć trudne koncepty.
    </p>
    <div className="flex justify-center gap-4">
      <a href="#" className="text-slate-400 hover:text-white transition-colors"><Github /></a>
      <a href="#" className="text-slate-400 hover:text-white transition-colors"><Linkedin /></a>
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
