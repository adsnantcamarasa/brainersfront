import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCircleAlert } from '@ng-icons/lucide';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';

import { notBlankValidator } from '../../../shared/validators/not-blank.validator';
import { Note, NoteRequest } from '../../data/note.model';
import { NOTE_RULES } from '../../data/note.rules';
import { NoteApi } from '../../data/note-api';

/**
 * Le formulaire d'une note : création (US-01) ou modification (US-04).
 *
 * - Sans entrée `note` : il crée une nouvelle note (POST).
 * - Avec `[note]="uneNote"` : il est pré-rempli et modifie cette note (PUT).
 *
 * Il valide la saisie, envoie la note au back, gère les erreurs,
 * puis PRÉVIENT son parent via les événements `saved` et `cancelled`.
 * Ce n'est pas lui qui décide de la suite (navigation) : c'est le parent.
 */
@Component({
  selector: 'app-note-form',
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    NgIcon,
    HlmFieldImports,
    HlmInputImports,
    HlmTextareaImports,
    HlmButtonImports,
    HlmSpinnerImports,
    HlmAlertImports,
  ],
  providers: [provideIcons({ lucideCircleAlert })],
  templateUrl: './note-form.html',
})
export class NoteForm implements OnInit {
  private readonly noteApi = inject(NoteApi);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  /** La note à modifier. Absente (null) : le formulaire crée une nouvelle note. */
  readonly note = input<Note | null>(null);

  /** Émis avec la note enregistrée (créée ou modifiée). Le parent écoute : (saved)="..." */
  readonly saved = output<Note>();

  /** Émis au clic sur "Annuler". Le parent décide où revenir. */
  readonly cancelled = output<void>();

  protected readonly rules = NOTE_RULES;

  /**
   * Le modèle du formulaire : un contrôle par champ, avec ses validateurs.
   * La clé d'erreur de chaque validateur sert dans le template :
   *   Validators.required   → "required"
   *   notBlankValidator     → "blank"
   *   Validators.maxLength  → "maxlength"
   */
  protected readonly form = this.formBuilder.group({
    title: [
      '',
      [Validators.required, notBlankValidator, Validators.maxLength(NOTE_RULES.titleMaxLength)],
    ],
    content: [
      '',
      [Validators.required, notBlankValidator, Validators.maxLength(NOTE_RULES.contentMaxLength)],
    ],
  });

  /** Vrai pendant l'envoi : bloque le bouton et affiche un spinner. */
  protected readonly submitting = signal(false);

  /** Message d'erreur global (serveur injoignable, erreur 500...). */
  protected readonly serverError = signal<string | null>(null);

  /**
   * Les entrées (`input()`) ne sont pas encore connues dans le constructeur :
   * on pré-remplit le formulaire dans ngOnInit, appelé juste après.
   */
  ngOnInit(): void {
    const note = this.note();
    if (note) {
      this.form.setValue({ title: note.title, content: note.content });
    }
  }

  protected submit(): void {
    // Garde-fou : le bouton est déjà désactivé si le formulaire est invalide.
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const { title, content } = this.form.getRawValue();
    // Seul le titre est nettoyé : le contenu peut commencer par une indentation voulue (du code).
    const request: NoteRequest = { title: title.trim(), content };

    // Même formulaire, deux requêtes possibles : modifier si on a une note, sinon créer.
    const note = this.note();
    const save = note ? this.noteApi.update(note.id, request) : this.noteApi.create(request);

    this.submitting.set(true);
    this.serverError.set(null);

    // HttpClient : la requête ne part qu'au subscribe(), et l'Observable
    // se termine tout seul après la réponse (pas de désabonnement à gérer).
    save.subscribe({
      next: (savedNote) => {
        this.submitting.set(false);
        this.saved.emit(savedNote);
      },
      error: (error: HttpErrorResponse) => {
        this.submitting.set(false);
        this.handleError(error);
      },
    });
  }

  /** Bouton "Annuler" : on prévient le parent, sans rien envoyer au back. */
  protected cancel(): void {
    this.cancelled.emit();
  }

  /** Traduit une erreur HTTP en message compréhensible. */
  private handleError(error: HttpErrorResponse): void {
    // 409 Conflict : le back refuse un titre déjà pris (NoteAlreadyExistsException).
    // On place l'erreur SUR le champ titre, pour l'afficher juste en dessous.
    if (error.status === 409) {
      const title = this.form.controls.title;
      title.setErrors({ duplicate: true });
      title.markAsTouched();
      return;
    }

    if (error.status === 400) {
      this.serverError.set('Le serveur a refusé la note. Vérifie le titre et le contenu.');
      return;
    }

    // 404 : en modification, la note a été supprimée entre-temps.
    if (error.status === 404) {
      this.serverError.set("Cette note n'existe plus. Elle a peut-être été supprimée.");
      return;
    }

    // 0 = aucune réponse, 5xx = erreur côté serveur (ou back arrêté derrière le proxy).
    this.serverError.set(
      'Le serveur est injoignable ou a rencontré une erreur. Vérifie que le back Spring est démarré (port 8080).',
    );
  }
}
