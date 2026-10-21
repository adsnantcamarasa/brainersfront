import { Routes } from '@angular/router';
import { NoteDetailPage } from './note-detail';
import { NotesListPage } from './notes-list';

export const routes: Routes = [
  { path: '', component: NotesListPage },
  { path: 'notes/:id', component: NoteDetailPage },
  { path: '**', redirectTo: '' },
];
