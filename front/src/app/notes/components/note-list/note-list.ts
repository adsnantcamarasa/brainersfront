import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmItemImports } from '@spartan-ng/helm/item';

import { Note } from '../../data/note.model';

/**
 * Composant de PRÉSENTATION : il affiche la liste qu'on lui donne, rien de plus.
 *
 * Il ne connaît pas le back et ne fait aucun appel HTTP. Les données arrivent
 * par son entrée `notes`, fournie par le composant parent (NoteSearch) :
 *
 *   <app-note-list [notes]="mesNotes" />
 */
@Component({
  selector: 'app-note-list',
  imports: [RouterLink, HlmItemImports],
  templateUrl: './note-list.html',
})
export class NoteList {
  /** Les notes à afficher. `input.required` : le parent DOIT la fournir. */
  readonly notes = input.required<Note[]>();
}
