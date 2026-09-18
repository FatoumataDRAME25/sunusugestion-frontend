// features/dashboard/pages/dashboard/dashboard.ts
import { Component, computed, inject, OnInit } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DatePipe } from '@angular/common';
import { DashboardService } from '../../../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  imports: [ChartModule, TableModule, TagModule, DatePipe],
  templateUrl: './dashboard.html'
})
export class Dashboard implements OnInit{
  protected dashboardService = inject(DashboardService);

  lineChartData = computed(() => {
  const evolution = this.dashboardService.evolution();

  return {
    labels: evolution.map(e => e.mois),
    datasets: [
      {
        data: evolution.map(e => e.total),
        borderColor: '#1A3C5E',
        backgroundColor: 'rgba(26, 60, 94, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };
});

  lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } }
  };

 donutChartData = computed(() => ({
  labels: this.dashboardService.repartitionSecteurs().map(
    (s) => `${s.secteur} (${s.pourcentage}%)`
  ),
  datasets: [
    {
      data: this.dashboardService.repartitionSecteurs().map(
        (s) => s.pourcentage
      ),
      backgroundColor: [
        '#1A3C5E',
        '#2E8B57',
        '#5B9BD5',
        '#8FC1E8',
        '#D4E8F5',
        '#E8E8E8'
      ],
      borderWidth: 0
    }
  ]
}));

  donutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: { legend: { display: false } }
  };

  ngOnInit(): void {
    this.dashboardService.chargerStatistiques();
    this.dashboardService.chargerGies();
    this.dashboardService.chargerEvolution()
    this.dashboardService.chargerRepartitionSecteurs();
  }

}
