import { Component } from '@angular/core';
import { OlympicService } from 'src/app/core/services/olympic.service';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Participation } from 'src/app/core/models/Participation';
import { CommonModule } from '@angular/common';

interface CountryDetailsViewModel {
  status: 'loading' | 'error' | 'not-found' | 'ready';
  countryName: string;
  metrics: {
    entries: number;
    medals: number;
    athletes: number;
  };
}



@Component({
    selector: 'app-country-details',
    imports: [CommonModule],
    templateUrl: './country-details.component.html',
    styleUrl: './country-details.component.scss'
})
export class CountryDetailsComponent 
{
  
public readonly viewModel$: Observable<CountryDetailsViewModel> = combineLatest([
    this.route.paramMap.pipe(
      // On extrait et on valide l'identifiant fourni dans l'URL.
      map((params) => {
        const rawId = params.get('id');
        if (rawId === null) {
          return null;
        }

        const parsed = Number(rawId);
        return Number.isNaN(parsed) ? null : parsed;
      })
    ),
    // Flux principal des données olympiques récupérées par le service.
    this.olympicService.getOlympics(),
  ]).pipe(
    map(([countryId, olympics]): CountryDetailsViewModel => {
      if (olympics === null) {
        return {
          status: 'error' as const,
          countryName: '',
          metrics: { entries: 0, medals: 0, athletes: 0 },
        };
      }

      if (!olympics) {
        return {
          status: 'loading' as const,
          countryName: '',
          metrics: { entries: 0, medals: 0, athletes: 0 },
        };
      }

      if (countryId === null) {
        return {
          status: 'not-found' as const,
          countryName: '',
          metrics: { entries: 0, medals: 0, athletes: 0 },
        };
      }

      const country = olympics.find((olympic) => olympic.id === countryId);

      if (!country) {
        return {
          status: 'not-found' as const,
          countryName: '',
          metrics: { entries: 0, medals: 0, athletes: 0 },
        };
      }

      // Copie triée chronologiquement des participations pour garantir l'ordre d'affichage.
      const participations: Participation[] = [...country.participations].sort(
        (a, b) => a.year - b.year
      );

      // Agrégats utilisés pour alimenter les cartes de métriques dans la vue.
      const medals = participations.reduce(
        (total, participation) => total + participation.medalsCount,
        0
      );
      const athletes = participations.reduce(
        (total, participation) => total + participation.athleteCount,
        0
      );

      return {
        status: 'ready' as const,
        countryName: country.country,
        metrics: {
          entries: participations.length,
          medals,
          athletes,
        },
      };
    })
  );

  constructor(
    private readonly olympicService: OlympicService,
    private readonly route: ActivatedRoute
  ) 
  {
  }

}
