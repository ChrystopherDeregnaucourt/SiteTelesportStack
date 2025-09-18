/**
 * Décrit une participation d'un pays à une édition des Jeux olympiques.
 */
export interface Participation {
  id: number;
  year: number;
  city: string;
  medalsCount: number;
  athleteCount: number;
}
