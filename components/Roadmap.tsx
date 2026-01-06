import React from 'react';
import { RoadmapItem } from '../types';
import { CheckCircle2, Circle, Activity, Server, ShieldCheck, Cpu } from 'lucide-react';

const ROADMAP_DATA: RoadmapItem[] = [
  {
    id: '1',
    title: 'Linux & Workstation',
    description: 'Baza wszystkiego. Codzienna praca na Arch Linux z Hyprlandem. Zrozumienie terminala, SSH i uprawnień plików.',
    tools: ['Arch Linux', 'Bash', 'SSH Keys', 'Hyprland'],
    status: 'completed'
  },
  {
    id: '2',
    title: 'Wirtualizacja On-Premise',
    description: 'Budowa własnej chmury na ThinkCentre. Rezygnacja z AWS na rzecz Proxmoxa i kontenerów systemowych.',
    tools: ['Proxmox VE', 'LXC Containers', 'Hardware', 'Networking'],
    status: 'completed'
  },
  {
    id: '3',
    title: 'Infrastructure as Code',
    description: 'Koniec z ręcznym klikaniem. Infrastruktura (LXC) i konfiguracja (Nginx) definiowana w kodzie.',
    tools: ['Terraform', 'Ansible', 'HCL', 'YAML'],
    status: 'completed'
  },
  {
    id: '4',
    title: 'Nowoczesny Frontend & CI/CD',
    description: 'Automatyzacja wdrożeń na Self-Hosted Runnerze. React + Vite serwowany przez Nginx.',
    tools: ['GitHub Actions', 'React', 'Vite', 'Nginx Config'],
    status: 'completed'
  },
  {
    id: '5',
    title: 'Monitoring & Observability',
    description: 'Muszę wiedzieć, co dzieje się z serwerem, zanim padnie. Metryki i logi.',
    tools: ['Prometheus', 'Grafana', 'Node Exporter'],
    status: 'in-progress'
  },
  {
    id: '6',
    title: 'Orkiestracja Kontenerów',
    description: 'Wejście w świat Kubernetesa, gdy pojedyncze kontenery przestaną wystarczać.',
    tools: ['K3s', 'Helm', 'ArgoCD'],
    status: 'pending'
  }
];

const Roadmap: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-white mb-4">Moja Ścieżka Inżyniera</h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          To nie jest teoria z bootcampu. To dokumentacja tego, co faktycznie działa na moim serwerze.
          <span className="text-emerald-400 font-semibold"> Zielone</span> to produkcja, 
          <span className="text-blue-400 font-semibold"> Niebieskie</span> to obecny warsztat.
        </p>
      </div>

      <div className="relative pb-20">
        {/* Vertical Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-800 md:left-1/2 md:-ml-0.5 bg-gradient-to-b from-emerald-500/50 via-slate-800 to-transparent"></div>

        <div className="space-y-12">
          {ROADMAP_DATA.map((item, index) => {
            const isLeft = index % 2 === 0;
            const statusColor = 
              item.status === 'completed' ? 'text-emerald-400 bg-emerald-500/5 border-emerald-500/30 shadow-[0_0_15px_-3px_rgba(16,185,129,0.1)]' :
              item.status === 'in-progress' ? 'text-blue-400 bg-blue-500/5 border-blue-500/30 shadow-[0_0_15px_-3px_rgba(59,130,246,0.1)]' :
              'text-slate-500 bg-slate-800/30 border-slate-700/50';
            
            const Icon = 
              item.status === 'completed' ? CheckCircle2 :
              item.status === 'in-progress' ? Activity :
              Circle;

            return (
              <div key={item.id} className={`relative flex items-center md:justify-between ${isLeft ? 'md:flex-row-reverse' : ''}`}>
                
                {/* Icon Wrapper */}
                <div className="absolute left-0 md:static md:left-auto flex-shrink-0 w-16 flex justify-center z-10 bg-slate-950 py-2">
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 bg-slate-950 transition-colors duration-300 ${
                     item.status === 'completed' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' :
                     item.status === 'in-progress' ? 'border-blue-500 text-blue-500 bg-blue-500/10 animate-pulse' :
                     'border-slate-700 text-slate-700'
                   }`}>
                     <Icon size={20} />
                   </div>
                </div>

                {/* Content Card */}
                <div className={`ml-16 md:ml-0 w-full md:w-5/12 ${isLeft ? 'md:text-right' : ''}`}>
                  <div className={`p-6 rounded-xl border ${statusColor} backdrop-blur-sm transition-all hover:scale-[1.02] hover:bg-opacity-20`}>
                    <h3 className={`text-xl font-bold mb-2 ${item.status === 'pending' ? 'text-slate-500' : 'text-slate-100'}`}>
                      {item.title}
                    </h3>
                    <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                      {item.description}
                    </p>
                    <div className={`flex flex-wrap gap-2 ${isLeft ? 'md:justify-end' : ''}`}>
                      {item.tools.map(tool => (
                        <span key={tool} className={`px-2 py-1 text-xs font-mono rounded border ${
                            item.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' :
                            item.status === 'in-progress' ? 'bg-blue-500/10 border-blue-500/20 text-blue-300' :
                            'bg-slate-800 border-slate-700 text-slate-500'
                        }`}>
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

          {/* Future Tiles */}
          {[1, 2].map((_, i) => {
            const index = ROADMAP_DATA.length + i;
            const isLeft = index % 2 === 0;
            
            const styles = i === 0 
              ? { opacity: 'opacity-40', text: 'Security Hardening', icon: ShieldCheck } 
              : { opacity: 'opacity-20 blur-[1px]', text: 'High Availability', icon: Cpu };

            return (
              <div key={`placeholder-${i}`} className={`relative flex items-center md:justify-between ${isLeft ? 'md:flex-row-reverse' : ''} ${styles.opacity} pointer-events-none select-none grayscale`}>
                 {/* Icon Wrapper */}
                 <div className="absolute left-0 md:static md:left-auto flex-shrink-0 w-16 flex justify-center z-10 bg-slate-950 py-2">
                   <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-slate-800 text-slate-700 bg-slate-950">
                     <styles.icon size={20} />
                   </div>
                </div>

                 {/* Content Card */}
                 <div className={`ml-16 md:ml-0 w-full md:w-5/12 ${isLeft ? 'md:text-right' : ''}`}>
                  <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/30 border-dashed">
                    <h3 className="text-xl font-bold mb-2 text-slate-600">
                      {styles.text}
                    </h3>
                    <p className="text-slate-700 text-sm mb-4">
                      Loading...
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
