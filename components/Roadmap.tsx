import React from 'react';
import { RoadmapItem } from '../types';
import { CheckCircle2, Circle, ArrowDown, Construction, Lock, HelpCircle } from 'lucide-react';

const ROADMAP_DATA: RoadmapItem[] = [
  {
    id: '1',
    title: 'Fundamenty Systemu',
    description: 'Zrozumienie jak działa system operacyjny, zarządzanie procesami, sieć.',
    tools: ['Linux', 'Bash', 'Networking (DNS, HTTP, TCP/IP)'],
    status: 'completed'
  },
  {
    id: '2',
    title: 'Programowanie',
    description: 'Automatyzacja nudnych zadań. Nauka języka skryptowego.',
    tools: ['Python', 'Go', 'Git'],
    status: 'completed'
  },
  {
    id: '3',
    title: 'Konteneryzacja',
    description: 'Pakowanie aplikacji w przenośne jednostki.',
    tools: ['Docker', 'Docker Compose'],
    status: 'in-progress'
  },
  {
    id: '4',
    title: 'CI/CD',
    description: 'Automatyczne testowanie i wdrażanie kodu.',
    tools: ['GitHub Actions', 'Jenkins', 'GitLab CI'],
    status: 'pending'
  },
  {
    id: '5',
    title: 'Orkiestracja',
    description: 'Zarządzanie setkami kontenerów na produkcji.',
    tools: ['Kubernetes', 'Helm'],
    status: 'pending'
  },
  {
    id: '6',
    title: 'IaC (Infrastruktura jako Kod)',
    description: 'Tworzenie infrastruktury za pomocą kodu.',
    tools: ['Terraform', 'Ansible', 'Cloud (AWS/Azure)'],
    status: 'pending'
  }
];

const Roadmap: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-white mb-4">Moja Roadmapa DevOps</h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          To ścieżka, którą podążam. DevOps to nie cel, to ciągła podróż. Zielone elementy są już opanowane, niebieskie w trakcie nauki.
        </p>
      </div>

      <div className="relative pb-20">
        {/* Vertical Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-800 md:left-1/2 md:-ml-0.5 bg-gradient-to-b from-slate-800 via-slate-800 to-transparent"></div>

        <div className="space-y-12">
          {ROADMAP_DATA.map((item, index) => {
            const isLeft = index % 2 === 0;
            const statusColor = 
              item.status === 'completed' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/50' :
              item.status === 'in-progress' ? 'text-blue-500 bg-blue-500/10 border-blue-500/50' :
              'text-slate-500 bg-slate-800/50 border-slate-700';
            
            const Icon = 
              item.status === 'completed' ? CheckCircle2 :
              item.status === 'in-progress' ? Construction :
              Circle;

            return (
              <div key={item.id} className={`relative flex items-center md:justify-between ${isLeft ? 'md:flex-row-reverse' : ''}`}>
                
                {/* Icon Wrapper */}
                <div className="absolute left-0 md:static md:left-auto flex-shrink-0 w-16 flex justify-center z-10 bg-slate-950 py-2">
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 bg-slate-950 ${
                     item.status === 'completed' ? 'border-emerald-500 text-emerald-500' :
                     item.status === 'in-progress' ? 'border-blue-500 text-blue-500' :
                     'border-slate-700 text-slate-700'
                   }`}>
                     <Icon size={20} />
                   </div>
                </div>

                {/* Content Card */}
                <div className={`ml-16 md:ml-0 w-full md:w-5/12 ${isLeft ? 'md:text-right' : ''}`}>
                  <div className={`p-6 rounded-xl border ${statusColor} backdrop-blur-sm transition-all hover:scale-[1.02]`}>
                    <h3 className={`text-xl font-bold mb-2 ${item.status === 'pending' ? 'text-slate-400' : 'text-white'}`}>
                      {item.title}
                    </h3>
                    <p className="text-slate-400 text-sm mb-4">
                      {item.description}
                    </p>
                    <div className={`flex flex-wrap gap-2 ${isLeft ? 'md:justify-end' : ''}`}>
                      {item.tools.map(tool => (
                        <span key={tool} className="px-2 py-1 text-xs font-mono rounded bg-slate-900 border border-slate-700 text-slate-300">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Spacer for the other side */}
                <div className="hidden md:block w-5/12"></div>
              </div>
            );
          })}

          {/* Placeholder / Future Tiles */}
          {[1, 2, 3].map((_, i) => {
            const index = ROADMAP_DATA.length + i;
            const isLeft = index % 2 === 0;
            
            // Fading logic
            const styles = i === 0 
              ? { opacity: 'opacity-50', text: 'Monitoring & Observability', icon: Lock } 
              : i === 1 
                ? { opacity: 'opacity-25 blur-sm', text: '???', icon: HelpCircle } 
                : { opacity: 'opacity-10 blur-md', text: 'Artificial Intelligence?', icon: Circle };

            return (
              <div key={`placeholder-${i}`} className={`relative flex items-center md:justify-between ${isLeft ? 'md:flex-row-reverse' : ''} ${styles.opacity} pointer-events-none select-none`}>
                 {/* Icon Wrapper */}
                 <div className="absolute left-0 md:static md:left-auto flex-shrink-0 w-16 flex justify-center z-10 bg-slate-950 py-2">
                   <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-slate-800 text-slate-700 bg-slate-950">
                     <styles.icon size={20} />
                   </div>
                </div>

                 {/* Content Card */}
                 <div className={`ml-16 md:ml-0 w-full md:w-5/12 ${isLeft ? 'md:text-right' : ''}`}>
                  <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 border-dashed">
                    <h3 className="text-xl font-bold mb-2 text-slate-600">
                      {styles.text}
                    </h3>
                    <p className="text-slate-700 text-sm mb-4">
                      Przyszłość jest jeszcze nieznana...
                    </p>
                    <div className={`flex flex-wrap gap-2 ${isLeft ? 'md:justify-end' : ''}`}>
                        <span className="w-16 h-6 rounded bg-slate-800/50"></span>
                        <span className="w-12 h-6 rounded bg-slate-800/50"></span>
                    </div>
                  </div>
                </div>

                <div className="hidden md:block w-5/12"></div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
};

export default Roadmap;