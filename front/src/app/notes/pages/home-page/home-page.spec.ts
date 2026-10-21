import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { HomePage } from './home-page';

describe('HomePage', () => {
  it('affiche la recherche, avec le bouton "Créer" qui mène à /notes/new', () => {
    TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;

    expect(page.querySelector('input[type="search"]')).not.toBeNull();
    expect(page.querySelector('button[type="submit"]')?.textContent).toContain('Rechercher');

    // Le lien "Créer", placé par la page dans NoteSearch, est bien affiché à côté.
    const create = page.querySelector<HTMLAnchorElement>('app-note-search a')!;
    expect(create.textContent).toContain('Créer');
    expect(create.getAttribute('href')).toBe('/notes/new');
  });
});
