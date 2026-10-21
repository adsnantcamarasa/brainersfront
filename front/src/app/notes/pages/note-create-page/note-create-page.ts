import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';

import { NoteForm } from '../../components/note-form/note-form';
import { Note } from '../../data/note.model';

/**
 * La page de création (route "/notes/new") : le formulaire vide (US-01).
 *
 * Le formulaire enregistre la note ; la page décide de la suite :
 * ouvrir la note créée, ou revenir à l'accueil si on annule.
 */
@Component({
  selector: 'app-note-create-page',
  imports: [RouterLink, NgIcon, HlmButtonImports, NoteForm],
  providers: [provideIcons({ lucideArrowLeft })],
  templateUrl: './note-create-page.html',
})
export class NoteCreatePage {
  private readonly router = inject(Router);

  /** Appelé quand le formulaire émet `saved` : on ouvre la note créée (US-01). */
  protected openNote(note: Note): void {
    this.router.navigate(['/notes', note.id]);
  }

  /** Appelé quand le formulaire émet `cancelled` : retour à l'accueil. */
  protected goHome(): void {
    this.router.navigate(['/']);
  }
}
