import { Component, OnInit, OnDestroy, signal, computed, effect, WritableSignal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import { Subject } from 'rxjs';
import { takeUntil, catchError, finalize, tap } from 'rxjs/operators';

import { ApiService } from '../../core/services/api.service';
import { MaterialData } from '../../core/models/equipment-data.model'; 
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-material', 
  standalone: true,
  imports: [
    CommonModule,
    BaseChartDirective,
    FormsModule
  ],
  templateUrl: './material.component.html',
  styleUrls: ['./material.component.scss']
})
export class MaterialComponent implements OnInit, OnDestroy { 

  // --- State Signals ---
  data: WritableSignal<MaterialData[]> = signal([]); 
  currentPage: WritableSignal<number> = signal(1);
  itemsPerPage: WritableSignal<number> = signal(25);
  totalItems: WritableSignal<number> = signal(0);
  isLoading: WritableSignal<boolean> = signal(true);
  error: WritableSignal<string | null> = signal(null);

  // --- Computed Signals ---
  totalPages: Signal<number> = computed(() => Math.ceil(this.totalItems() / this.itemsPerPage()));
  paginationRange: Signal<number[]> = computed(() => { 
    const current = this.currentPage();
    const last = this.totalPages();
    const delta = 2;
    const left = current - delta;
    const right = current + delta + 1;
    const range = [];
    const rangeWithDots: number[] = [];
    for (let i = 1; i <= last; i++) {
      if (i === 1 || i === last || (i >= left && i < right)) {
        range.push(i);
      }
    }
     let l: number | null = null;
     for (let i of range) {
         if (l !== null) {
             if (i - l === 2) { rangeWithDots.push(l + 1); }
             else if (i - l > 2) { rangeWithDots.push(-1); }
         }
         rangeWithDots.push(i);
         l = i;
     }
     return rangeWithDots;
  });

  // --- Chart Configuration ---
  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        display: true,
        title: { display: true, text: 'Timestamp' },
        ticks: { autoSkip: true, maxTicksLimit: 15, maxRotation: 45, minRotation: 0 }
      },
      // Define Y-axes for material properties
      yVibration: {
          position: 'left',
          display: true,
          title: { display: true, text: 'Vibration (mm/s)' }, 
          grid: { drawOnChartArea: true }
      },
      yBearingTemp: {
          position: 'right',
          display: true,
          title: { display: true, text: 'Bearing Temp (°C)' }, 
          grid: { drawOnChartArea: false }
      },
      ySpeed: {
           position: 'right',
           display: false, 
           title: { display: true, text: 'Impeller Speed (RPM)' },
           grid: { drawOnChartArea: false },
           offset: true 
       }
    },
    plugins: {
      legend: { display: true, position: 'top' },
      tooltip: { mode: 'index', intersect: false }
    },
     animation: { duration: 500 }
  };
  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      // Dataset for Vibration
      {
        data: [],
        label: 'Vibration',
        borderColor: 'rgba(255, 159, 64, 1)', 
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        pointBackgroundColor: 'rgba(255, 159, 64, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(255, 159, 64, 0.8)',
        fill: 'origin',
        tension: 0.1,
        yAxisID: 'yVibration'
      },
      // Dataset for Bearing Temperature
      {
        data: [],
        label: 'Bearing Temperature',
        borderColor: 'rgba(153, 102, 255, 1)', 
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        pointBackgroundColor: 'rgba(153, 102, 255, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(153, 102, 255, 0.8)',
        fill: 'origin',
        tension: 0.1,
        yAxisID: 'yBearingTemp' 
      },
      // Dataset for Impeller Speed
       {
        data: [],
        label: 'Impeller Speed',
        borderColor: 'rgba(54, 162, 235, 1)', 
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(54, 162, 235, 0.8)',
        fill: false,
        tension: 0.1,
        yAxisID: 'ySpeed',
        hidden: true 
      }
    ]
  };
  public lineChartType= 'line';
  public lineChartLegend = true;

  // --- Lifecycle and Data Fetching ---
  private destroy$ = new Subject<void>();

  constructor(private apiService: ApiService) { 
     effect(() => {
         const page = this.currentPage();
         const limit = this.itemsPerPage();
         console.log(`MaterialComponent Effect: Loading data page ${page}, limit ${limit}`);
         this.loadData(page, limit);
     }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    console.log('MaterialComponent initialized.');
    // Initial load triggered by effect
  }

  loadData(page: number, limit: number): void {
    this.isLoading.set(true);
    this.error.set(null);
    console.log(`Fetching material data: page=${page}, limit=${limit}`);

    this.apiService.getMaterialData(page, limit) 
      .pipe(
        takeUntil(this.destroy$),
        tap(response => console.log("Received Material API response:", response)),
        catchError(err => {
          console.error('Error fetching material data:', err);
          const errorMsg = err.error?.message || err.message || 'Failed to load material data.';
          this.error.set(errorMsg);
          this.data.set([]);
          this.totalItems.set(0);
          throw err;
        }),
        finalize(() => {
          this.isLoading.set(false);
          console.log('Finished loading material data attempt.');
        })
      )
      .subscribe(response => {
        console.log(`Material data received for page ${page}:`, response.data.length, "items");
        this.data.set(response.data);
        this.totalItems.set(response.total);
        this.updateChartData(response.data);
      });
  }

  updateChartData(apiData: MaterialData[]): void { 
     const sortedData = [...apiData].reverse();
     const labels = sortedData.map(d => new Date(d.timestamp).toLocaleTimeString());
     // Extract material-specific data points
     const vibrationData = sortedData.map(d => d.vibration);
     const bearingTempData = sortedData.map(d => d.bearing_temperature);
     const speedData = sortedData.map(d => d.impeller_speed);

     this.lineChartData = {
        ...this.lineChartData,
        labels: labels,
        datasets: [
            { ...this.lineChartData.datasets[0], data: vibrationData },
            { ...this.lineChartData.datasets[1], data: bearingTempData },
            { ...this.lineChartData.datasets[2], data: speedData }
        ]
     };
     console.log("Material Chart data updated.");
  }

  // --- Pagination Methods ---
  goToPage(pageNumber: number): void {
    if (pageNumber >= 1 && pageNumber <= this.totalPages() && pageNumber !== this.currentPage()) {
      this.currentPage.set(pageNumber);
    }
  }
  nextPage(): void { this.goToPage(this.currentPage() + 1); }
  previousPage(): void { this.goToPage(this.currentPage() - 1); }
   changeItemsPerPage(event: Event): void {
      const limit = parseInt((event.target as HTMLSelectElement).value, 10);
      if (!isNaN(limit) && limit > 0) {
          this.itemsPerPage.set(limit);
          this.currentPage.set(1);
      }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    console.log('MaterialComponent destroyed.');
  }
}