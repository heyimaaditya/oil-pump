import { Component, OnInit, OnDestroy, signal, computed, effect, WritableSignal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import { Subject } from 'rxjs';
import { takeUntil, catchError, finalize, tap } from 'rxjs/operators';

import { ApiService } from '../../core/services/api.service';
import { FluidData } from '../../core/models/equipment-data.model'; 
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-fluid', 
  standalone: true,
  imports: [
    CommonModule,
    BaseChartDirective,
    FormsModule
  ],
  templateUrl: './fluid.component.html',
  styleUrls: ['./fluid.component.scss']
})
export class FluidComponent implements OnInit, OnDestroy { 

  // --- State Signals ---
  data: WritableSignal<FluidData[]> = signal([]); 
  currentPage: WritableSignal<number> = signal(1);
  itemsPerPage: WritableSignal<number> = signal(25);
  totalItems: WritableSignal<number> = signal(0);
  isLoading: WritableSignal<boolean> = signal(true);
  error: WritableSignal<string | null> = signal(null);

  // --- Computed Signals ---
  totalPages: Signal<number> = computed(() => Math.ceil(this.totalItems() / this.itemsPerPage()));
  paginationRange: Signal<number[]> = computed(() => { 
    const current = this.currentPage(); const last = this.totalPages(); const delta = 2; const left = current - delta; const right = current + delta + 1; const range = []; const rangeWithDots: number[] = [];
    for (let i = 1; i <= last; i++) { if (i === 1 || i === last || (i >= left && i < right)) { range.push(i); } }
     let l: number | null = null; for (let i of range) { if (l !== null) { if (i - l === 2) { rangeWithDots.push(l + 1); } else if (i - l > 2) { rangeWithDots.push(-1); } } rangeWithDots.push(i); l = i; } return rangeWithDots;
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
      // Define Y-axes for fluid properties
      yFlowRate: {
          position: 'left',
          display: true,
          title: { display: true, text: 'Flow Rate (units)' }, // e.g., GPM
          grid: { drawOnChartArea: true }
      },
      yFluidTemp: {
          position: 'right',
          display: true,
          title: { display: true, text: 'Fluid Temp (°C)' },
          grid: { drawOnChartArea: false }
      },
      yOilLevel: {
           position: 'right',
           display: false, 
           title: { display: true, text: 'Oil Level (%)' },
           grid: { drawOnChartArea: false },
           offset: true,
           suggestedMin: 0, 
           suggestedMax: 1 
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
      // Dataset for Flow Rate
      {
        data: [],
        label: 'Flow Rate',
        borderColor: 'rgba(75, 192, 192, 1)', 
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        pointBackgroundColor: 'rgba(75, 192, 192, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(75, 192, 192, 0.8)',
        fill: 'origin',
        tension: 0.1,
        yAxisID: 'yFlowRate'
      },
      // Dataset for Fluid Temperature
      {
        data: [],
        label: 'Fluid Temperature',
        borderColor: 'rgba(255, 99, 132, 1)', 
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        pointBackgroundColor: 'rgba(255, 99, 132, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(255, 99, 132, 0.8)',
        fill: 'origin',
        tension: 0.1,
        yAxisID: 'yFluidTemp'
      },
       // Dataset for Lubrication Oil Level
       {
        data: [],
        label: 'Oil Level',
        borderColor: 'rgba(201, 203, 207, 1)', 
        backgroundColor: 'rgba(201, 203, 207, 0.2)',
        pointBackgroundColor: 'rgba(201, 203, 207, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(201, 203, 207, 0.8)',
        fill: false,
        tension: 0.1,
        yAxisID: 'yOilLevel',
        hidden: true
      }
    ]
  };
  public lineChartType = 'line';
  public lineChartLegend = true;


  // --- Lifecycle and Data Fetching ---
  private destroy$ = new Subject<void>();

  constructor(private apiService: ApiService) {
     effect(() => {
         const page = this.currentPage();
         const limit = this.itemsPerPage();
         console.log(`FluidComponent Effect: Loading data page ${page}, limit ${limit}`);
         this.loadData(page, limit);
     }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    console.log('FluidComponent initialized.');
     // Initial load triggered by effect
  }

  loadData(page: number, limit: number): void {
    this.isLoading.set(true);
    this.error.set(null);
    console.log(`Fetching fluid data: page=${page}, limit=${limit}`);

    this.apiService.getFluidData(page, limit) 
      .pipe(
        takeUntil(this.destroy$),
        tap(response => console.log("Received Fluid API response:", response)),
        catchError(err => {
          console.error('Error fetching fluid data:', err);
          const errorMsg = err.error?.message || err.message || 'Failed to load fluid data.';
          this.error.set(errorMsg);
          this.data.set([]);
          this.totalItems.set(0);
          throw err;
        }),
        finalize(() => {
          this.isLoading.set(false);
          console.log('Finished loading fluid data attempt.');
        })
      )
      .subscribe(response => {
        console.log(`Fluid data received for page ${page}:`, response.data.length, "items");
        this.data.set(response.data);
        this.totalItems.set(response.total);
        this.updateChartData(response.data);
      });
  }

  updateChartData(apiData: FluidData[]): void { 
     const sortedData = [...apiData].reverse();
     const labels = sortedData.map(d => new Date(d.timestamp).toLocaleTimeString());
     // Extract fluid-specific data points
     const flowData = sortedData.map(d => d.flow_rate);
     const fluidTempData = sortedData.map(d => d.fluid_temperature);
     const oilLevelData = sortedData.map(d => d.lubrication_oil_level);

     this.lineChartData = {
        ...this.lineChartData,
        labels: labels,
        datasets: [
            { ...this.lineChartData.datasets[0], data: flowData },
            { ...this.lineChartData.datasets[1], data: fluidTempData },
            { ...this.lineChartData.datasets[2], data: oilLevelData }
        ]
     };
     console.log("Fluid Chart data updated.");
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
    console.log('FluidComponent destroyed.');
  }
}