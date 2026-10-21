/**
 * Configuration utilisée par `ng build` (build de production).
 *
 * En production, le front et le back seraient servis derrière le même domaine
 * (un reverse proxy redirige /api vers Spring). L'URL reste donc relative.
 */
export const environment = {
  /** Préfixe de tous les appels HTTP vers le back. */
  apiUrl: '/api',
};
