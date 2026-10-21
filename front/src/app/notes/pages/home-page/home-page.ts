import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';

import { NoteSearch } from '../../components/note-search/note-search';

/**
 * La page d'accueil (route "/") : une barre de recherche, avec "Rechercher" et "Créer".
 *
 * Une PAGE assemble des composants et orchestre la navigation.
 * Elle ne contient pas de logique métier : la recherche vit dans NoteSearch.
 * Le bouton "Créer" est un simple lien vers la page de création (/notes/new).
 */
@Component({
  selector: 'app-home-page',
  imports: [RouterLink, HlmButtonImports, NoteSearch],
  templateUrl: './home-page.html',
})
export class HomePage {}
