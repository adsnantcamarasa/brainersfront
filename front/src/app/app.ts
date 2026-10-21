import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

/**
 * Le composant racine : la "coquille" affichée sur toutes les pages
 * (l'en-tête), avec un emplacement <router-outlet /> où le routeur
 * insère la page correspondant à l'URL.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
})
export class App {}
