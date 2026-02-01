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
        <h2 className="text-3xl font-bold text-white mb-4 font-mono uppercase tracking-tight">Moja Ścieżka Inżyniera</h2>
        <p className="text-neutral-500 max-w-2xl mx-auto font-mono text-sm">
          To nie jest teoria z bootcampu. To dokumentacja tego, co faktycznie działa na moim serwerze.
          <span className="text-thinkpad-red font-bold"> Czerwone</span> to produkcja (Done), 
          <span className="text-white font-bold"> Białe</span> to obecny warsztat (WIP).
        </p>
      </div>

      <div className="relative pb-20">
        {/* Vertical Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-neutral-800 md:left-1/2 md:-ml-0.5 bg-gradient-to-b from-thinkpad-red via-neutral-800 to-transparent"></div>

        <div className="space-y-12">
          {ROADMAP_DATA.map((item, index) => {
            const isLeft = index % 2 === 0;
            const statusColor = 
              item.status === 'completed' ? 'text-thinkpad-red border-thinkpad-red shadow-[0_0_15px_-3px_rgba(224,6,19,0.2)]' :
              item.status === 'in-progress' ? 'text-white border-white shadow-[0_0_15px_-3px_rgba(255,255,255,0.2)]' :
              'text-neutral-500 bg-neutral-900/30 border-neutral-800';
            
            const Icon = 
              item.status === 'completed' ? CheckCircle2 :
              item.status === 'in-progress' ? Activity :
              Circle;

            return (
              <div key={item.id} className={`relative flex items-center md:justify-between ${isLeft ? 'md:flex-row-reverse' : ''}`}>
                
                {/* Icon Wrapper */}
                <div className="absolute left-0 md:static md:left-auto flex-shrink-0 w-16 flex justify-center z-10 bg-thinkpad-base py-2">
                   <div className={`w-10 h-10 rounded-none flex items-center justify-center border-2 bg-thinkpad-base transition-colors duration-300 ${
                     item.status === 'completed' ? 'border-thinkpad-red text-thinkpad-red bg-thinkpad-red/10' :
                     item.status === 'in-progress' ? 'border-white text-white bg-white/10 animate-pulse' :
                     'border-neutral-800 text-neutral-700'
                   }`}>
                     <Icon size={20} />
                   </div>
                </div>

                {/* Content Card */}
                <div className={`ml-16 md:ml-0 w-full md:w-5/12 ${isLeft ? 'md:text-right' : ''}`}>
                  <div className={`p-6 rounded-none border ${statusColor} bg-thinkpad-surface transition-all hover:bg-neutral-900`}>
                    <h3 className={`text-xl font-bold mb-2 font-mono uppercase tracking-tighter ${item.status === 'pending' ? 'text-neutral-600' : 'text-white'}`}>
                      {item.title}
                    </h3>
                    <p className="text-thinkpad-text text-sm mb-4 leading-relaxed font-light">
                      {item.description}
                    </p>
                    <div className={`flex flex-wrap gap-2 ${isLeft ? 'md:justify-end' : ''}`}>
                      {item.tools.map(tool => (
                        <span key={tool} className={`px-2 py-1 text-xs font-mono rounded-none border ${
                            item.status === 'completed' ? 'bg-thinkpad-red/10 border-thinkpad-red text-thinkpad-red' :
                            item.status === 'in-progress' ? 'bg-white/10 border-white text-white' :
                            'bg-neutral-900 border-neutral-800 text-neutral-600'
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
            
            // Increased opacity for better readability, removed blur which hurts text
            const styles = i === 0 
              ? { opacity: 'opacity-70', text: 'Security Hardening', icon: ShieldCheck } 
              : { opacity: 'opacity-50', text: 'High Availability', icon: Cpu };

            return (
              <div key={`placeholder-${i}`} className={`relative flex items-center md:justify-between ${isLeft ? 'md:flex-row-reverse' : ''} ${styles.opacity} select-none grayscale`}>
                 {/* Icon Wrapper */}
                 <div className="absolute left-0 md:static md:left-auto flex-shrink-0 w-16 flex justify-center z-10 bg-thinkpad-base py-2">
                   <div className="w-10 h-10 rounded-none flex items-center justify-center border-2 border-neutral-700 text-neutral-500 bg-thinkpad-base">
                     <styles.icon size={20} />
                   </div>
                </div>

                 {/* Content Card */}
                 <div className={`ml-16 md:ml-0 w-full md:w-5/12 ${isLeft ? 'md:text-right' : ''}`}>
                  <div className="p-6 rounded-none border border-neutral-700 bg-neutral-900/50 border-dashed">
                    <h3 className="text-xl font-bold mb-2 text-neutral-400 font-mono uppercase">
                      {styles.text}
                    </h3>
                    <p className="text-neutral-500 text-sm mb-4">
                      Planned
                    </p>
                    <div className={`flex flex-wrap gap-2 ${isLeft ? 'md:justify-end' : ''}`}>
                        <span className="w-16 h-6 rounded-none bg-neutral-800"></span>
                        <span className="w-12 h-6 rounded-none bg-neutral-800"></span>
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
