import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';

import { NoteCreateForm } from '../../components/note-create-form/note-create-form';
import { NoteSearch } from '../../components/note-search/note-search';
import { Note } from '../../data/note.model';

/**
 * La page d'accueil (route "/") : deux onglets, rechercher OU créer une note.
 *
 * Une PAGE assemble des composants et orchestre la navigation.
 * Elle ne contient pas de logique métier : la recherche vit dans NoteSearch,
 * la création dans NoteCreateForm.
 */
@Component({
  selector: 'app-home-page',
  imports: [HlmTabsImports, NoteSearch, NoteCreateForm],
  templateUrl: './home-page.html',
})
export class HomePage {
  private readonly router = inject(Router);

  /** Appelé quand le formulaire émet `created` : on ouvre la note créée (US-01). */
  protected openNote(note: Note): void {
    this.router.navigate(['/notes', note.id]);
  }
}
