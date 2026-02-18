import { Routes } from '@angular/router';

//Array de rutas de la aplicación.
//Cada ruta usa lazy-loading (carga dinámica) para cargar componentes solo cuando se necesitan.
//Esto reduce el tamaño inicial del bundle de la app.
export const routes: Routes = [
  {
    path: '',  //Ruta raíz '/'
    //loadComponent: carga el componente de forma lazy (solo cuando se accede a esta ruta).
    //import(): importa dinámicamente el archivo del componente.
    //.then(): espera a que el import termine y extrae el componente del módulo.
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'empleados',  //Ruta: /empleados
    //Carga el componente de lista de empleados de forma lazy.
    loadComponent: () => import('./features/empleado/components/empleado-list/empleado-list.component').then(m => m.EmpleadoListComponent)
  },
  {
    path: 'empleados/nuevo',  //Ruta: /empleados/nuevo
    //Carga el formulario de nuevo empleado. Es la misma ruta que edit pero sin :id.
    loadComponent: () => import('./features/empleado/components/empleado-form/empleado-form.component').then(m => m.EmpleadoFormComponent)
  },
  {
    path: 'empleados/:id',  //Ruta: /empleados/:id (debe usar el mismo componente que '/empleados/nuevo').
    //:id es un parámetro dinámico que captura el ID del empleado a editar.
    //ActivatedRoute captura este parámetro en el componente para saber si es crear o editar.
    loadComponent: () => import('./features/empleado/components/empleado-form/empleado-form.component').then(m => m.EmpleadoFormComponent)
  },
  {
    path: 'empresa',  //Ruta: /empresa
    //Carga el componente de detalle de empresa.
    loadComponent: () => import('./features/empresa/components/empresa-detail/empresa-detail.component').then(m => m.EmpresaDetailComponent)
  },
  {
    path: 'mapa',  //Ruta: /mapa
    //Carga el componente del mapa de ubicaciones.
    loadComponent: () => import('./features/mapa/components/mapa-ubicacion/mapa-ubicacion.component').then(m => m.MapaUbicacionComponent)
  },
  {
    path: 'estadisticas',  //Ruta: /estadisticas
    //Carga el dashboard con gráficos y estadísticas.
    loadComponent: () => import('./features/estadisticas/components/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'reportes',  //Ruta: /reportes
    //Carga el componente de exportación de reportes (PDF, Excel).
    loadComponent: () => import('./features/reportes/components/reporte-export/reporte-export.component').then(m => m.ReporteExportComponent)
  },
  {
    path: '**',  //Wildcard: cualquier otra ruta no especificada.
    //redirectTo redirige a la ruta raíz por defecto.
    redirectTo: ''
  }
];
