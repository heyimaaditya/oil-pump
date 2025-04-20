import { Component, OnInit, OnDestroy, signal, computed, effect, WritableSignal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts'; 
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import { Subject } from 'rxjs';
import { takeUntil, catchError, finalize, tap } from 'rxjs/operators';


import { ApiService } from '../../core/services/api.service';
import { PressureData } from '../../core/models/equipment-data.model';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-pressure',
  standalone: true,
  imports: [
    CommonModule, 
    BaseChartDirective ,
    FormsModule
  ],
  templateUrl: './pressure.component.html',
  styleUrls: ['./pressure.component.scss'],
 
})
export class PressureComponent implements OnInit, OnDestroy {

  // --- State Signals ---
  data: WritableSignal<PressureData[]> = signal([]);
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
             if (i - l === 2) {
                 rangeWithDots.push(l + 1);
             } else if (i - l > 2) {
                 rangeWithDots.push(-1); 
             }
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
        ticks: {
             autoSkip: true,
             maxTicksLimit: 15,
             maxRotation: 45,
             minRotation: 0
         }
      },
      ySuction: { 
          position: 'left',
          display: true,
          title: { display: true, text: 'Suction Pressure (units)' },
          grid: { drawOnChartArea: true }
      },
      yDischarge: { 
          position: 'right',
          display: true,
          title: { display: true, text: 'Discharge Pressure (units)' },
          grid: { drawOnChartArea: false } 
      },
      yNpsh: { // Dedicated Y-axis for NPSH
           display: false,
           position: 'right',
           title: { display: true, text: 'NPSH (units)' },
           grid: { drawOnChartArea: false }
       }
    },
    plugins: {
      legend: { display: true, position: 'top' },
      tooltip: { mode: 'index', intersect: false }
    },
     animation: {
        duration: 500 
    }
  };
  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [], 
    datasets: [
      {
        data: [],
        label: 'Suction Pressure',
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        pointBackgroundColor: 'rgba(75, 192, 192, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(75, 192, 192, 0.8)',
        fill: 'origin',
        tension: 0.1,
        yAxisID: 'ySuction' 
      },
      {
        data: [],
        label: 'Discharge Pressure',
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        pointBackgroundColor: 'rgba(255, 99, 132, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(255, 99, 132, 0.8)',
        fill: 'origin',
        tension: 0.1,
        yAxisID: 'yDischarge' 
      },
       {
        data: [],
        label: 'NPSH',
        borderColor: 'rgba(255, 159, 64, 1)',
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        pointBackgroundColor: 'rgba(255, 159, 64, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(255, 159, 64, 0.8)',
        fill: false, 
        tension: 0.1,
        yAxisID: 'yNpsh',
        hidden: true 
      }
    ]
  };
  public lineChartType= 'line';
  public lineChartLegend = true;


  // --- Lifecycle and Data Fetching ---
  private destroy$ = new Subject<void>(); 

  constructor(private apiService: ApiService) {
     // Effect to react to page or itemsPerPage changes
     effect(() => {
         const page = this.currentPage();
         const limit = this.itemsPerPage(); 
         console.log(`Effect triggered: Loading data for page ${page}, limit ${limit}`);
         this.loadData(page, limit);
     }, { allowSignalWrites: true }); 
  }

  ngOnInit(): void {
    // Initial data load is triggered by the effect
    console.log('PressureComponent initialized.');
  }

  loadData(page: number, limit: number): void {
    this.isLoading.set(true);
    this.error.set(null);
    console.log(`Fetching pressure data: page=${page}, limit=${limit}`);

    this.apiService.getPressureData(page, limit)
      .pipe(
        takeUntil(this.destroy$), 
        tap(response => console.log("Received API response:", response)),
        catchError(err => {
          console.error('Error fetching pressure data:', err);
          const errorMsg = err.error?.message || err.message || 'Failed to load data. Please check the API connection and key.';
          this.error.set(errorMsg);
          this.data.set([]);
          this.totalItems.set(0);
          throw err; 
        }),
        finalize(() => {
          this.isLoading.set(false);
          console.log('Finished loading data attempt.');
        })
      )
      .subscribe(response => {
        console.log(`Data received for page ${page}:`, response.data.length, "items");
        // Update state signals
        this.data.set(response.data);
        this.totalItems.set(response.total);
       

        
        this.updateChartData(response.data);
      });
  }

  updateChartData(apiData: PressureData[]): void {
    
     const sortedData = [...apiData].reverse();

     const labels = sortedData.map(d => new Date(d.timestamp).toLocaleTimeString()); 
     const suctionData = sortedData.map(d => d.suction_pressure);
     const dischargeData = sortedData.map(d => d.discharge_pressure);
     const npshData = sortedData.map(d => d.npsh);

     
     this.lineChartData = {
        ...this.lineChartData, 
        labels: labels,
        datasets: [
            { ...this.lineChartData.datasets[0], data: suctionData }, 
            { ...this.lineChartData.datasets[1], data: dischargeData }, 
            { ...this.lineChartData.datasets[2], data: npshData } 
        ]
     };
     console.log("Chart data updated.");
  }


  // --- Pagination Methods ---
  goToPage(pageNumber: number): void {
    if (pageNumber >= 1 && pageNumber <= this.totalPages() && pageNumber !== this.currentPage()) {
      this.currentPage.set(pageNumber); 
    }
  }

  nextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }

  previousPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

   changeItemsPerPage(event: Event): void {
      const selectElement = event.target as HTMLSelectElement;
      const limit = parseInt(selectElement.value, 10);
      if (!isNaN(limit) && limit > 0) {
          this.itemsPerPage.set(limit);
          this.currentPage.set(1); 
      }
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    console.log('PressureComponent destroyed.');
  }
}