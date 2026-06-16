import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/agent/agent-chat').then((m) => m.AgentChat),
  },
  {
    path: 'debug',
    loadComponent: () => import('./features/debug/connection-debug').then((m) => m.ConnectionDebug),
  },
];