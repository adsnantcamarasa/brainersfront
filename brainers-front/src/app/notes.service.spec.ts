import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { NotesService } from './notes.service';

describe('NotesService', () => {
  let service: NotesService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NotesService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(NotesService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('calls each notes controller endpoint with the expected method and payload', () => {
    const note = { id: 12, title: 'Courses', content: 'Acheter du café' };
    const request = { title: note.title, content: note.content };

    service.getAll('Courses').subscribe((notes) => expect(notes).toEqual([note]));
    const listRequest = httpTestingController.expectOne(
      (req) => req.url === '/api/notes' && req.params.get('title') === 'Courses',
    );
    expect(listRequest.request.method).toBe('GET');
    listRequest.flush([note]);

    service.getById(note.id).subscribe((result) => expect(result).toEqual(note));
    const detailRequest = httpTestingController.expectOne('/api/notes/12');
    expect(detailRequest.request.method).toBe('GET');
    detailRequest.flush(note);

    service.create(request).subscribe((result) => expect(result).toEqual(note));
    const createRequest = httpTestingController.expectOne('/api/notes');
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual(request);
    createRequest.flush(note);

    service.update(note.id, request).subscribe((result) => expect(result).toEqual(note));
    const updateRequest = httpTestingController.expectOne('/api/notes/12');
    expect(updateRequest.request.method).toBe('PUT');
    expect(updateRequest.request.body).toEqual(request);
    updateRequest.flush(note);

    service.delete(note.id).subscribe();
    const deleteRequest = httpTestingController.expectOne('/api/notes/12');
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null);
  });
});
