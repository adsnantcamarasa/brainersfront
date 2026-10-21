import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';

describe('Notes routes', () => {
  let httpTestingController: HttpTestingController;
  let router: Router;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    httpTestingController = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  async function openNotePage() {
    harness = await RouterTestingHarness.create('/notes/1');
    const note = { id: 1, title: 'Courses', content: 'Acheter du café' };
    httpTestingController.expectOne('/api/notes/1').flush(note);
    await settle();
    return { harness, note };
  }

  async function settle() {
    await harness.fixture.whenStable();
    harness.detectChanges();
  }

  function query<T extends Element>(selector: string): T {
    return harness.routeNativeElement?.querySelector(selector) as T;
  }

  function button(label: string): HTMLButtonElement {
    const buttons = harness.routeNativeElement?.querySelectorAll('button') ?? [];
    return Array.from(buttons).find((b) => b.textContent?.trim() === label) as HTMLButtonElement;
  }

  function type(field: HTMLInputElement | HTMLTextAreaElement, value: string) {
    field.value = value;
    field.dispatchEvent(new Event('input'));
  }

  it('opens /notes/:id with the note and its update and delete actions', async () => {
    const { note } = await openNotePage();
    const detail = query<HTMLElement>('.note-detail-page');

    expect(router.url).toBe('/notes/1');
    expect(detail.querySelector('h2')?.textContent).toContain(note.title);
    expect(detail.querySelector('.detail-content')?.textContent).toContain(note.content);
    expect(detail.querySelector('[aria-label="Modifier cette note"]')?.textContent?.trim()).toBe(
      'Modifier',
    );
    expect(detail.querySelector('[aria-label="Supprimer cette note"]')?.textContent?.trim()).toBe(
      'Supprimer',
    );
  });

  it('prefills title and content in the edit form on the detail route', async () => {
    const { note } = await openNotePage();
    query<HTMLButtonElement>('[aria-label="Modifier cette note"]').click();
    await settle();

    expect(query<HTMLInputElement>('#edit-note-title').value).toBe(note.title);
    expect(query<HTMLTextAreaElement>('#edit-note-content').value).toBe(note.content);
  });

  it('updates the note from its detail page', async () => {
    await openNotePage();
    query<HTMLButtonElement>('[aria-label="Modifier cette note"]').click();
    await settle();

    type(query('#edit-note-title'), '  Courses modifiées ');
    type(query('#edit-note-content'), 'Acheter du thé');
    button('Enregistrer les modifications').click();

    const updateRequest = httpTestingController.expectOne('/api/notes/1');
    expect(updateRequest.request.method).toBe('PUT');
    expect(updateRequest.request.body).toEqual({
      title: 'Courses modifiées',
      content: 'Acheter du thé',
    });
    updateRequest.flush({ id: 1, title: 'Courses modifiées', content: 'Acheter du thé' });
    await settle();

    expect(query('#edit-note-title')).toBeNull();
    expect(query('h2')?.textContent).toContain('Courses modifiées');
    expect(query('.detail-content')?.textContent).toContain('Acheter du thé');
    expect(query('[role="status"]')?.textContent).toContain('Note modifiée.');
  });

  it('does not send the update when a field is blank', async () => {
    await openNotePage();
    query<HTMLButtonElement>('[aria-label="Modifier cette note"]').click();
    await settle();

    type(query('#edit-note-title'), '   ');
    button('Enregistrer les modifications').click();
    await settle();

    httpTestingController.expectNone('/api/notes/1');
    expect(query('.field-error')?.textContent).toContain('Le titre est obligatoire');
  });

  it('asks for confirmation and does nothing when the deletion is cancelled', async () => {
    await openNotePage();
    query<HTMLButtonElement>('[aria-label="Supprimer cette note"]').click();
    await settle();

    expect(query('.confirm-text')?.textContent).toContain('Supprimer définitivement ?');
    button('Annuler').click();
    await settle();

    httpTestingController.expectNone('/api/notes/1');
    expect(query('[aria-label="Supprimer cette note"]')).toBeTruthy();
  });

  it('deletes the note from its detail page and returns to the list', async () => {
    await openNotePage();
    query<HTMLButtonElement>('[aria-label="Supprimer cette note"]').click();
    await settle();
    button('Confirmer la suppression').click();

    const deleteRequest = httpTestingController.expectOne('/api/notes/1');
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null);
    await settle();

    expect(router.url).toBe('/');
    httpTestingController.expectOne('/api/notes').flush([]);
    await settle();
    expect(query('#notes-heading')).toBeTruthy();
  });
});
