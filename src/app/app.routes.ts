import { Routes } from '@angular/router';
import { Start } from './features/wizard/start/start';
import { CreateOffer } from './features/wizard/create-offer/create-offer';
import { ScanOffer } from './features/wizard/scan-offer/scan-offer';
import { ScanAnswer } from './features/wizard/scan-answer/scan-answer';
import { CallRoom } from './features/wizard/call-room/call-room';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'start' },
  { path: 'start', component: Start },
  { path: 'create-offer', component: CreateOffer }, // Nutzer A
  { path: 'scan-offer', component: ScanOffer },     // Nutzer B
  { path: 'scan-answer', component: ScanAnswer },   // Nutzer A
  { path: 'call', component: CallRoom },
];
