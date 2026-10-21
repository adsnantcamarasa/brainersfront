import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, output, signal } from '@angular/core';
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
 * Le formulaire de création d'une note (US-01).
 *
 * Il valide la saisie, envoie la note au back, gère les erreurs,
 * puis PRÉVIENT son parent via l'événement `created`.
 * Ce n'est pas lui qui décide de la suite (navigation) : c'est le parent.
 */
@Component({
  selector: 'app-note-create-form',
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
  templateUrl: './note-create-form.html',
})
export class NoteCreateForm {
  private readonly noteApi = inject(NoteApi);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  /** Émis avec la note créée. Le parent écoute : (created)="..." */
  readonly created = output<Note>();

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

  protected submit(): void {
    // Garde-fou : le bouton est déjà désactivé si le formulaire est invalide.
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const { title, content } = this.form.getRawValue();
    // Seul le titre est nettoyé : le contenu peut commencer par une indentation voulue (du code).
    const request: NoteRequest = { title: title.trim(), content };

    this.submitting.set(true);
    this.serverError.set(null);

    // HttpClient : la requête ne part qu'au subscribe(), et l'Observable
    // se termine tout seul après la réponse (pas de désabonnement à gérer).
    this.noteApi.create(request).subscribe({
      next: (note) => {
        this.submitting.set(false);
        this.form.reset();
        this.created.emit(note);
      },
      error: (error: HttpErrorResponse) => {
        this.submitting.set(false);
        this.handleError(error);
      },
    });
  }

  /** Bouton "Effacer" : vide les champs et les erreurs. */
  protected clear(): void {
    this.form.reset();
    this.serverError.set(null);
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

    // 0 = aucune réponse, 5xx = erreur côté serveur (ou back arrêté derrière le proxy).
    this.serverError.set(
      'Le serveur est injoignable ou a rencontré une erreur. Vérifie que le back Spring est démarré (port 8080).',
    );
  }
}
