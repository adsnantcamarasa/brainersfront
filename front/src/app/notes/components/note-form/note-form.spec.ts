import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Note } from '../../data/note.model';
import { NoteForm } from './note-form';

describe('NoteForm', () => {
  let fixture: ComponentFixture<NoteForm>;
  let http: HttpTestingController;
  let page: HTMLElement;

  const titleInput = () => page.querySelector<HTMLInputElement>('#note-title')!;
  const contentInput = () => page.querySelector<HTMLTextAreaElement>('#note-content')!;
  const submitButton = () => page.querySelector<HTMLButtonElement>('button[type="submit"]')!;

  /** Simule une saisie puis la sortie du champ (blur = champ "touched"). */
  const fill = (field: HTMLInputElement | HTMLTextAreaElement, value: string) => {
    field.value = value;
    field.dispatchEvent(new Event('input'));
    field.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  };

  /** Crée le formulaire. Avec une note : mode modification. */
  const createForm = (note: Note | null = null) => {
    TestBed.configureTestingModule({
      imports: [NoteForm],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(NoteForm);
    // Équivaut à <app-note-form [note]="note" /> dans le template d'un parent.
    fixture.componentRef.setInput('note', note);
    fixture.detectChanges();
    page = fixture.nativeElement;
  };

  afterEach(() => http.verify());

  describe('en création', () => {
    beforeEach(() => createForm());

    it('désactive "Enregistrer" tant que le formulaire est invalide', () => {
      expect(submitButton().disabled).toBe(true);

      fill(titleInput(), 'Stream java');
      expect(submitButton().disabled).toBe(true);

      fill(contentInput(), 'Traiter des collections.');
      expect(submitButton().disabled).toBe(false);
    });

    it('affiche le message adapté quand le titre ne contient que des espaces', () => {
      fill(titleInput(), '   ');
      expect(page.textContent).toContain('Le titre ne peut pas contenir uniquement des espaces.');
    });

    it('envoie le titre nettoyé et prévient le parent avec la note créée', () => {
      let emitted: Note | undefined;
      fixture.componentInstance.saved.subscribe((note) => (emitted = note));

      fill(titleInput(), '  Stream java  ');
      fill(contentInput(), 'Traiter des collections.');
      submitButton().click();

      const req = http.expectOne('/api/notes');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        title: 'Stream java',
        content: 'Traiter des collections.',
      });

      const created: Note = {
        id: 21,
        title: 'Stream java',
        content: 'Traiter des collections.',
        createdAt: '2026-10-17T10:00:00',
        lastUpdateAt: '2026-10-17T10:00:00',
      };
      req.flush(created, { status: 201, statusText: 'Created' });

      expect(emitted).toEqual(created);
    });

    it('affiche "Une note porte déjà ce titre." quand le back répond 409', () => {
      fill(titleInput(), 'Maven');
      fill(contentInput(), 'Doublon.');
      submitButton().click();

      http
        .expectOne('/api/notes')
        .flush('Note already exist', { status: 409, statusText: 'Conflict' });
      fixture.detectChanges();

      expect(page.textContent).toContain('Une note porte déjà ce titre.');
      expect(submitButton().disabled).toBe(true);
    });

    it('affiche une alerte quand le serveur est en erreur', () => {
      fill(titleInput(), 'Une note');
      fill(contentInput(), 'Un contenu.');
      submitButton().click();

      http.expectOne('/api/notes').flush('Erreur', { status: 500, statusText: 'Server Error' });
      fixture.detectChanges();

      expect(page.textContent).toContain("La note n'a pas été enregistrée.");
    });

    it('affiche une alerte dédiée quand le back répond 400', () => {
      fill(titleInput(), 'Une note');
      fill(contentInput(), 'Un contenu.');
      submitButton().click();

      http.expectOne('/api/notes').flush('Bad Request', { status: 400, statusText: 'Bad Request' });
      fixture.detectChanges();

      expect(page.textContent).toContain('Le serveur a refusé la note.');
    });

    it('ne contacte pas le back si on soumet un formulaire invalide (touche Entrée)', () => {
      page.querySelector('form')!.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      http.expectNone('/api/notes');
      expect(page.textContent).toContain('Le titre est obligatoire.');
      expect(page.textContent).toContain('Le contenu est obligatoire.');
    });

    it('"Annuler" prévient le parent sans rien envoyer', () => {
      let cancelled = false;
      fixture.componentInstance.cancelled.subscribe(() => (cancelled = true));

      fill(titleInput(), 'Brouillon');
      page.querySelector<HTMLButtonElement>('button[type="button"]')!.click();

      expect(cancelled).toBe(true);
      http.expectNone(() => true);
    });
  });

  describe('en modification', () => {
    const note: Note = {
      id: 12,
      title: 'Maven',
      content: 'Un outil de build.',
      createdAt: '2026-10-16T09:49:25',
      lastUpdateAt: '2026-10-16T09:49:25',
    };

    beforeEach(() => createForm(note));

    it('est pré-rempli avec la note', () => {
      expect(titleInput().value).toBe('Maven');
      expect(contentInput().value).toBe('Un outil de build.');
      expect(submitButton().disabled).toBe(false);
    });

    it('envoie un PUT et prévient le parent avec la note modifiée', () => {
      let emitted: Note | undefined;
      fixture.componentInstance.saved.subscribe((saved) => (emitted = saved));

      fill(contentInput(), 'Un outil de build pour Java.');
      submitButton().click();

      const req = http.expectOne('/api/notes/12');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ title: 'Maven', content: 'Un outil de build pour Java.' });

      const updated = { ...note, content: 'Un outil de build pour Java.' };
      req.flush(updated);

      expect(emitted).toEqual(updated);
    });

    it('affiche une alerte quand la note n’existe plus (404)', () => {
      submitButton().click();

      http
        .expectOne('/api/notes/12')
        .flush('Note not found', { status: 404, statusText: 'Not Found' });
      fixture.detectChanges();

      expect(page.textContent).toContain("Cette note n'existe plus.");
    });
  });
});
