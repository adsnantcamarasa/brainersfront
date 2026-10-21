import { Routes } from '@angular/router';

import { HomePage } from './notes/pages/home-page/home-page';
import { NoteCreatePage } from './notes/pages/note-create-page/note-create-page';
import { NoteDetailPage } from './notes/pages/note-detail-page/note-detail-page';

/**
 * La table des routes : quelle URL affiche quelle page.
 * Le routeur parcourt cette liste dans l'ordre et prend la première qui correspond.
 *
 *   /           → HomePage        (recherche)
 *   /notes/new  → NoteCreatePage  (création)
 *   /notes/12   → NoteDetailPage  (lecture, modification, suppression ;
 *                                  `:id` est un paramètre lu dans l'URL)
 *   /n'importe  → redirection vers /
 *
 * ⚠️ 'notes/new' doit être AVANT 'notes/:id' : sinon "new" serait lu comme un id.
 */
export const routes: Routes = [
  { path: '', component: HomePage, title: 'Brainers' },
  { path: 'notes/new', component: NoteCreatePage, title: 'Nouvelle note · Brainers' },
  { path: 'notes/:id', component: NoteDetailPage, title: 'Note · Brainers' },
  { path: '**', redirectTo: '' },
];
