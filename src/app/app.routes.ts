import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./main-view/main-view').then(m => m.MainView),
        loadChildren: () => import('./main-view/main-view.routes').then(m => m.routes)
    }
];
