/**
 * Configuration utilisée par `ng serve` (développement).
 * Angular remplace environment.ts par ce fichier (voir "fileReplacements" dans angular.json).
 *
 * Le front appelle /api/... sur son propre serveur (localhost:4200).
 * Le proxy de développement (proxy.conf.json) transfère ces appels à Spring
 * sur localhost:8080, en retirant le préfixe /api.
 */
export const environment = {
  /** Préfixe de tous les appels HTTP vers le back. */
  apiUrl: '/api',
};
