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
    afterDraw: (chart) => {
      const { ctx, data, chartArea, canvas } = chart;
      const dataset = data.datasets[0];
      const meta = chart.getDatasetMeta(0);

      if (!dataset || !meta?.data.length || !chartArea) {
        return;
      }

      ctx.save();
      ctx.font = "500 14px 'Poppins', 'Segoe UI', Arial, sans-serif";
      ctx.fillStyle = '#1f2937';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;

      meta.data.forEach((element, index) => {
        const props = element.getProps(['x', 'y', 'startAngle', 'endAngle', 'outerRadius'], true);
        const { x, y, startAngle, endAngle, outerRadius } = props;

        // Angle du milieu de la section
        const angle = (startAngle + endAngle) / 2;

        // Point de départ sur le bord du camembert
        const lineStartX = x + Math.cos(angle) * outerRadius;
        const lineStartY = y + Math.sin(angle) * outerRadius;

        // Point intermédiaire (ligne diagonale)
        const lineLength = 30;
        const midX = lineStartX + Math.cos(angle) * lineLength;
        const midY = lineStartY + Math.sin(angle) * lineLength;

        // Déterminer le côté (droite ou gauche)
        const isRightSide = Math.cos(angle) >= 0;
        
        // Point final (ligne horizontale)
        const horizontalLength = 40;
        const endX = isRightSide ? midX + horizontalLength : midX - horizontalLength;
        const endY = midY;

        // Dessiner la ligne diagonale
        ctx.beginPath();
        ctx.moveTo(lineStartX, lineStartY);
        ctx.lineTo(midX, midY);
        ctx.stroke();

        // Dessiner la ligne horizontale
        ctx.beginPath();
        ctx.moveTo(midX, midY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Afficher le label
        const label = data.labels?.[index] ?? 'Unknown';
        const labelText = Array.isArray(label) ? label.join(' ') : String(label || '');
        
        ctx.textBaseline = 'middle';
        ctx.textAlign = isRightSide ? 'left' : 'right';
        
        const textX = isRightSide ? endX + 8 : endX - 8;
        ctx.fillText(labelText, textX, endY);
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
    Chart.register(ChartDataLabels, this.calloutLabelsPlugin);

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
