import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';

import { NoteCreateForm } from '../../components/note-create-form/note-create-form';
import { Note } from '../../data/note.model';
import { HomePage } from './home-page';

describe('HomePage', () => {
  it('ouvre la page de la note quand le formulaire annonce une création', () => {
    TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    // On récupère le composant enfant et on simule son événement `created`.
    const form = fixture.debugElement.query(By.directive(NoteCreateForm))
      .componentInstance as NoteCreateForm;
    const note: Note = {
      id: 21,
      title: 'Signals Angular',
      content: 'Une valeur réactive.',
      createdAt: '2026-10-17T10:00:00',
      lastUpDateTime: '2026-10-17T10:00:00',
    };
    form.created.emit(note);

    expect(navigate).toHaveBeenCalledWith(['/notes', 21]);
  });
});
