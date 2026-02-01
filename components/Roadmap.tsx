import React from 'react';
import { RoadmapItem } from '../types';
import { CheckCircle2, Activity, ShieldCheck, Cpu, Code2, Database } from 'lucide-react';

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
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-20">
        <h2 className="text-4xl font-bold text-white mb-6 font-mono tracking-tighter">
          <span className="text-thinkpad-red">/</span> Roadmap
        </h2>
        <p className="text-neutral-400 max-w-2xl mx-auto font-mono text-sm leading-relaxed">
          Praktyczna ścieżka rozwoju. Zero teorii, 100% wdrażania na produkcję.
        </p>
      </div>

      <div className="relative">
        {/* Central Line */}
        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-thinkpad-red via-neutral-800 to-transparent md:-translate-x-1/2"></div>

        <div className="space-y-16">
          {ROADMAP_DATA.map((item, index) => {
            const isLeft = index % 2 === 0;
            const isCompleted = item.status === 'completed';
            const isInProgress = item.status === 'in-progress';
            
            return (
              <div key={item.id} className={`relative flex flex-col md:flex-row items-center justify-between group ${isLeft ? 'md:flex-row-reverse' : ''}`}>
                
                {/* Timeline Dot */}
                <div className={`
                  absolute left-4 md:left-1/2 w-3 h-3 -translate-x-[5px] md:-translate-x-[5px] rounded-full z-10 transition-all duration-500
                  ${isCompleted ? 'bg-thinkpad-red shadow-[0_0_10px_rgba(224,6,19,0.5)]' : isInProgress ? 'bg-white animate-pulse' : 'bg-neutral-800'}
                `}></div>

                {/* Spacer */}
                <div className="w-full md:w-1/2"></div>

                {/* Content Card */}
                <div className={`w-full md:w-[45%] pl-12 md:pl-0 ${isLeft ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                  <div className={`
                    relative p-6 bg-neutral-900/40 border-y border-neutral-900 transition-all duration-300 rounded-sm group-hover:bg-neutral-900/80
                    ${isCompleted ? 'border-l-2 border-l-thinkpad-red md:border-l-thinkpad-red md:border-r-0' : 'border-l-2 border-l-neutral-800'}
                    ${isLeft && isCompleted ? 'md:border-l-0 md:border-r-2 md:border-r-thinkpad-red' : ''}
                    ${isInProgress ? 'border-l-2 border-l-white md:border-l-white md:border-r-0' : ''}
                    ${isLeft && isInProgress ? 'md:border-l-0 md:border-r-2 md:border-r-white' : ''}
                  `}>
                    <div className={`flex items-center gap-3 mb-3 ${isLeft ? 'md:flex-row-reverse' : ''}`}>
                      <h3 className={`text-lg font-bold font-mono tracking-tight uppercase ${isCompleted ? 'text-white' : 'text-neutral-500'}`}>
                        {item.title}
                      </h3>
                      {isCompleted && <CheckCircle2 size={16} className="text-thinkpad-red" />}
                      {isInProgress && <Activity size={16} className="text-white animate-pulse" />}
                    </div>
                    
                    <p className="text-neutral-500 text-sm mb-6 font-light leading-relaxed">
                      {item.description}
                    </p>

                    <div className={`flex flex-wrap gap-2 ${isLeft ? 'md:justify-end' : ''}`}>
                      {item.tools.map(tool => (
                        <span key={tool} className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 bg-black border border-neutral-800 text-neutral-500 rounded-sm hover:text-white hover:border-neutral-600 transition-colors cursor-default">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Roadmap;