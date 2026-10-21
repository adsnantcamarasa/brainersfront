import { Routes } from '@angular/router';

import { HomePage } from './notes/pages/home-page/home-page';
import { NoteDetailPage } from './notes/pages/note-detail-page/note-detail-page';

/**
 * La table des routes : quelle URL affiche quelle page.
 * Le routeur parcourt cette liste dans l'ordre et prend la première qui correspond.
 *
 *   /           → HomePage        (recherche + création)
 *   /notes/12   → NoteDetailPage  (`:id` est un paramètre lu dans l'URL)
 *   /n'importe  → redirection vers /
 */
export const routes: Routes = [
  { path: '', component: HomePage, title: 'Brainers' },
  { path: 'notes/:id', component: NoteDetailPage, title: 'Note · Brainers' },
  { path: '**', redirectTo: '' },
];
