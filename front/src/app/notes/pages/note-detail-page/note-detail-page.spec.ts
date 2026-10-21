import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { Note } from '../../data/note.model';
import { NoteDetailPage } from './note-detail-page';

describe('NoteDetailPage', () => {
  const maven: Note = {
    id: 12,
    title: 'Maven',
    content: 'Un outil de build.',
    createdAt: '2026-10-16T09:49:25',
    lastUpdateAt: '2026-10-16T09:49:25',
  };

  /** Crée la page comme si l'URL était /notes/{id}. */
  const openPage = (id: string) => {
    TestBed.configureTestingModule({
      imports: [NoteDetailPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        // On remplace la route active par une fausse, avec l'id voulu.
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id })) } },
      ],
    });
    const fixture = TestBed.createComponent(NoteDetailPage);
    fixture.detectChanges();
    return { fixture, http: TestBed.inject(HttpTestingController) };
  };

  /** Ouvre la page de Maven, avec la note déjà renvoyée par le back. */
  const openMaven = () => {
    const opened = openPage('12');
    opened.http.expectOne('/api/notes/12').flush(maven);
    opened.fixture.detectChanges();
    const page: HTMLElement = opened.fixture.nativeElement;

    /** Clique sur le bouton dont le texte est `label`, puis redessine. */
    const click = (label: string) => {
      const button = [...page.querySelectorAll('button')].find(
        (b) => b.textContent?.trim() === label,
      );
      button!.click();
      opened.fixture.detectChanges();
    };
    return { ...opened, page, click };
  };

  it('affiche la note renvoyée par le back, avec "Modifier" et "Supprimer"', () => {
    const { page, http } = openMaven();

    expect(page.querySelector('h1')?.textContent).toContain('Maven');
    expect(page.textContent).toContain('Un outil de build.');
    expect(page.textContent).toContain('Modifier');
    expect(page.textContent).toContain('Supprimer');
    http.verify();
  });

  it('affiche "Note introuvable" quand le back répond 404', () => {
    const { fixture, http } = openPage('999');

    http
      .expectOne('/api/notes/999')
      .flush('Note not found', { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Note introuvable');
    http.verify();
  });

  it('n’appelle pas le back si l’id n’est pas un nombre', () => {
    const { fixture, http } = openPage('abc');

    http.expectNone(() => true);
    expect(fixture.nativeElement.textContent).toContain('Note introuvable');
  });

  it('affiche une erreur générique quand le back est en panne', () => {
    const { fixture, http } = openPage('12');

    http.expectOne('/api/notes/12').flush('Erreur', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Impossible de charger la note.');
    http.verify();
  });

  describe('Modifier', () => {
    it('ouvre le formulaire pré-rempli, puis affiche la note modifiée', () => {
      const { page, http, click, fixture } = openMaven();

      click('Modifier');
      expect(page.querySelector<HTMLInputElement>('#note-title')!.value).toBe('Maven');

      click('Enregistrer');
      const updated = { ...maven, content: 'Un outil de build pour Java.' };
      http.expectOne({ url: '/api/notes/12', method: 'PUT' }).flush(updated);
      fixture.detectChanges();

      // Retour à la lecture, avec le contenu renvoyé par le back (sans recharger la note).
      expect(page.querySelector('#note-title')).toBeNull();
      expect(page.textContent).toContain('Un outil de build pour Java.');
      http.verify();
    });

    it('"Annuler" referme le formulaire sans rien envoyer', () => {
      const { page, http, click } = openMaven();

      click('Modifier');
      click('Annuler');

      expect(page.querySelector('#note-title')).toBeNull();
      expect(page.textContent).toContain('Un outil de build.');
      http.verify();
    });
  });

  describe('Supprimer', () => {
    it('demande une confirmation avant d’envoyer quoi que ce soit', () => {
      const { page, http, click } = openMaven();

      click('Supprimer');

      expect(page.textContent).toContain('Supprimer définitivement cette note ?');
      http.verify();
    });

    it('supprime la note après confirmation, puis revient à l’accueil', () => {
      const { http, click } = openMaven();
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

      click('Supprimer');
      click('Supprimer');

      http
        .expectOne({ url: '/api/notes/12', method: 'DELETE' })
        .flush(null, { status: 204, statusText: 'No Content' });
      expect(navigate).toHaveBeenCalledWith(['/']);
      http.verify();
    });

    it('"Annuler" dans la confirmation ne supprime rien', () => {
      const { page, http, click } = openMaven();

      click('Supprimer');
      click('Annuler');

      expect(page.textContent).not.toContain('Supprimer définitivement cette note ?');
      http.verify();
    });

    it('affiche une alerte si la suppression échoue', () => {
      const { page, http, click, fixture } = openMaven();

      click('Supprimer');
      click('Supprimer');
      http
        .expectOne({ url: '/api/notes/12', method: 'DELETE' })
        .flush('Erreur', { status: 500, statusText: 'Server Error' });
      fixture.detectChanges();

      expect(page.textContent).toContain("La note n'a pas été supprimée.");
      // La note est toujours affichée : on peut réessayer.
      expect(page.textContent).toContain('Un outil de build.');
      http.verify();
    });
  });
});
