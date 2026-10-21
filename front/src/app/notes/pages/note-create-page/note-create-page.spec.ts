import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';

import { NoteForm } from '../../components/note-form/note-form';
import { Note } from '../../data/note.model';
import { NoteCreatePage } from './note-create-page';

describe('NoteCreatePage', () => {
  /** Crée la page et renvoie le formulaire enfant + un espion sur la navigation. */
  const openPage = () => {
    TestBed.configureTestingModule({
      imports: [NoteCreatePage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const fixture = TestBed.createComponent(NoteCreatePage);
    fixture.detectChanges();

    // On récupère le composant enfant pour simuler ses événements.
    const form = fixture.debugElement.query(By.directive(NoteForm)).componentInstance as NoteForm;
    return { form, navigate };
  };

  it('ouvre la page de la note quand le formulaire annonce une création', () => {
    const { form, navigate } = openPage();
    const note: Note = {
      id: 21,
      title: 'Signals Angular',
      content: 'Une valeur réactive.',
      createdAt: '2026-10-17T10:00:00',
      lastUpdateAt: '2026-10-17T10:00:00',
    };

    form.saved.emit(note);

    expect(navigate).toHaveBeenCalledWith(['/notes', 21]);
  });

  it('revient à l’accueil quand on annule', () => {
    const { form, navigate } = openPage();

    form.cancelled.emit();

    expect(navigate).toHaveBeenCalledWith(['/']);
  });
});
