import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { PressureComponent } from './components/pressure/pressure.component';
import { MaterialComponent } from './components/material/material.component';
import { FluidComponent } from './components/fluid/fluid.component';

export const routes: Routes = [
    { path: '', component: HomeComponent, title: 'Home - Oil Pump Monitor' },
    { path: 'pressure', component: PressureComponent, title: 'Pressure Data' },
    { path: 'material', component: MaterialComponent, title: 'Material Data' },
    { path: 'fluid', component: FluidComponent, title: 'Fluid Data' },
    { path: '**', redirectTo: '', pathMatch: 'full' }
];