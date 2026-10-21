import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import localeFr from '@angular/common/locales/fr';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

// Charge les règles de formatage françaises (dates, nombres) pour le pipe `date`.
registerLocaleData(localeFr);

/**
 * La configuration globale de l'application : ce qui est "branché" au démarrage.
 * Chaque `provide...()` active une brique d'Angular pour toute l'application.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Remonte dans la console les erreurs non interceptées.
    provideBrowserGlobalErrorListeners(),
    // Le routeur, avec la table des routes (app.routes.ts).
    provideRouter(routes),
    // HttpClient, utilisé par NoteApi pour parler au back.
    provideHttpClient(),
    // Langue par défaut des pipes (dates en français : "16 oct. 2026").
    { provide: LOCALE_ID, useValue: 'fr' },
  ],
};
