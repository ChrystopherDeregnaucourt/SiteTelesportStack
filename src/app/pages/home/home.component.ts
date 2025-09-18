import { Component, OnInit } from '@angular/core';
import { filter, map, Observable, of } from 'rxjs';
import { OlympicService } from 'src/app/core/services/olympic.service';
import { Router } from '@angular/router';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import {
  ChartConfiguration,
  ChartData,
  Chart,
  Plugin,
  TooltipItem,
  ArcElement,
} from 'chart.js';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: false
})
export class HomeComponent implements OnInit {
  public olympics$: Observable<OlympicCountry[]> = of([]);

  public viewModel$: Observable<HomeViewModel> = of({
    countriesCount: 0,
    olympicsCount: 0,
    chartData: { labels: [], datasets: [] },
  });

  public pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
        labels: {
          usePointStyle: true,
          color: '#1f2937',
          padding: 20,
          font: {
            family: '"Poppins", "Segoe UI", Arial, sans-serif',
            size: 13,
            weight: 500,
          },
        },
      },
      datalabels: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'pie'>) => {
            const label = context.label ?? '';
            return `${label}: ${context.raw} medals`;
          },
        },
      },
    },
  };

  private readonly calloutLabelsPlugin: Plugin<'pie'> = {
    id: 'pieCalloutLabels',
    afterDatasetsDraw: (chart) => {
      const { ctx, data, chartArea, canvas } = chart;
      
      if (!data.datasets[0] || !chartArea) {
        return;
      }

      const meta = chart.getDatasetMeta(0);
      const dataset = data.datasets[0];

      ctx.save();
      
      // Style des lignes
      ctx.fillStyle = '#1f2937';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.font = "500 12px 'Poppins', sans-serif";

      meta.data.forEach((element, index) => {
        const model = element as ArcElement;
        const centerX = model.x;
        const centerY = model.y;
        const radius = model.outerRadius;
        const startAngle = model.startAngle;
        const endAngle = model.endAngle;

        // Calculer l'angle du milieu de la section
        const angle = (startAngle + endAngle) / 2;

        // Point de départ sur le bord du camembert
        const lineStartX = centerX + Math.cos(angle) * radius;
        const lineStartY = centerY + Math.sin(angle) * radius;

        // Point final de la ligne diagonale
        const diagonalLength = 40;
        const diagonalEndX = lineStartX + Math.cos(angle) * diagonalLength;
        const diagonalEndY = lineStartY + Math.sin(angle) * diagonalLength;

        // Déterminer si on est à droite ou à gauche
        const isRightSide = Math.cos(angle) >= 0;

        // Point final de la ligne horizontale
        const horizontalLength = 30;
        const finalX = isRightSide ? 
          diagonalEndX + horizontalLength : 
          diagonalEndX - horizontalLength;
        const finalY = diagonalEndY;

        // Dessiner la ligne diagonale
        ctx.beginPath();
        ctx.moveTo(lineStartX, lineStartY);
        ctx.lineTo(diagonalEndX, diagonalEndY);
        ctx.stroke();

        // Dessiner la ligne horizontale
        ctx.beginPath();
        ctx.moveTo(diagonalEndX, diagonalEndY);
        ctx.lineTo(finalX, finalY);
        ctx.stroke();

        // Dessiner le label
        const label = data.labels?.[index] || '';
        const labelText = String(label);

        ctx.textBaseline = 'middle';
        ctx.textAlign = isRightSide ? 'left' : 'right';

        const textX = isRightSide ? finalX + 5 : finalX - 5;
        ctx.fillText(labelText, textX, finalY);
      });

      ctx.restore();
    },
  };

  constructor(
    private readonly olympicService: OlympicService,
    private readonly router: Router
  ) {}

  ngOnInit(): void
  {
    // Enregistrer le plugin personnalisé
    Chart.register(this.calloutLabelsPlugin);

    this.olympics$ = this.olympicService.getOlympics().pipe
    (
      filter((olympics): olympics is OlympicCountry[] => olympics != null)
    );

    this.viewModel$ = this.olympics$.pipe(
      filter((olympics): olympics is OlympicCountry[] => Array.isArray(olympics)),
      map((olympics) => {
        const countriesCount = olympics.length;
        const olympicsCount = olympics.reduce(
          (total, country) => total + country.participations.length,
          0
        );
        const chartLabels = olympics.map((country) => country.country);
        const chartData = olympics.map((country) =>
          country.participations.reduce(
            (medalSum, participation) => medalSum + participation.medalsCount,
            0
          )
        );
        return {
          countriesCount,
          olympicsCount,
          chartData: {
            labels: chartLabels,
            datasets: [
              {
                data: chartData,
                backgroundColor: chartLabels.map(() => this.getRandomColor()),
                borderColor: '#ffffff',
                borderWidth: 2,
                hoverOffset: 12,
              },
            ],
          } as ChartData<'pie', number[], string | string[]>,
        };
      })
    );
  }

  public goToCountry(countryId: number): void 
  {
    this.router.navigate(['/country', countryId]);
  }
  
  public getRandomColor() 
  {
    // Génère une couleur hexadécimale aléatoire
    return '#' + Math.floor(Math.random()*16777215).toString(16);
  }
}

interface OlympicParticipation {
  id: number;
  year: number;
  city: string;
  medalsCount: number;
  athleteCount: number;
}

interface OlympicCountry {
  id: number;
  country: string;
  participations: OlympicParticipation[];
}

interface HomeViewModel {
  countriesCount: number;
  olympicsCount: number;
  chartData: ChartData<'pie', number[], string | string[]>;
}
