import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Empleado } from '../../../../core/models/empleado.model';
import { Empresa } from '../../../../core/models/empresa.model';
import { EmpleadosService } from '../../../../core/services/empleado.service';
import { EmpresaService } from '../../../../core/services/empresa.service';
import { ReporteService } from '../../../../core/services/reporte.service';

@Component({
  selector: 'app-reporte-export',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reporte-export.component.html',
  styleUrl: './reporte-export.component.css'
})
export class ReporteExportComponent implements OnInit, OnDestroy {
  //Array con todos los empleados cargados del servicio.
  empleados: Empleado[] = [];
  //Array con los empleados filtrados según los criterios seleccionados.
  empleadosFiltrados: Empleado[] = [];
  //Datos de la empresa principal.
  empresa: Empresa | null = null;
  loading = false;
  error = '';
  success = '';  //Mensaje de éxito al exportar.

  // Filtros para los reportes
  departamentoFiltro = '';  //Filtro por departamento seleccionado.
  estadoFiltro = '';  //Filtro por estado (activo, inactivo, licencia).
  departamentos: string[] = [];  //Array único de departamentos disponibles.
  estados = ['activo', 'inactivo', 'licencia'];  //Estados disponibles.

  // Opciones de reporte
  tipoReporte = 'completo';  //Tipo de reporte (completo, resumido, etc).
  formato = 'pdf';  //Formato de exportación (pdf o excel).

  // Estadísticas calculadas de los empleados.
  estadisticas: any = null;

  //Subject para desuscribirse automáticamente al destruir el componente.
  private destroy$ = new Subject<void>();

  constructor(
    private empleadosService: EmpleadosService,
    private empresaService: EmpresaService,
    private reporteService: ReporteService
  ) {}

  ngOnInit(): void {
    //Se ejecuta cuando el componente se inicializa.
    //Carga los datos de empleados y empresa para los reportes.
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    //Se ejecuta cuando el componente se destruye.
    //Emite en el Subject para desuscribirse de todos los observables.
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarDatos(): void {
    //Carga la empresa y los empleados de forma paralela.
    this.loading = true;

    //Carga la empresa con ID 1 (principal).
    this.empresaService.obtenerEmpresa(1)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (empresa) => {
          this.empresa = empresa;
        },
        error: (err) => {
          console.error('Error al cargar empresa:', err);
        }
      });

    //Carga todos los empleados.
    this.empleadosService.obtenerEmpleados()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (empleados) => {
          this.empleados = empleados;
          //Inicialmente muestra todos los empleados.
          this.empleadosFiltrados = empleados;
          //Extrae los departamentos únicos.
          this.extraerDepartamentos();
          //Calcula las estadísticas iniciales.
          this.calcularEstadisticas();
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Error al cargar empleados';
          this.loading = false;
          console.error(err);
        }
      });
  }

  extraerDepartamentos(): void {
    //Extrae los departamentos únicos de todos los empleados.
    //map() obtiene solo el departamento de cada empleado.
    const depts = [...new Set(this.empleados.map(e => e.departamento))];
    //Set elimina duplicados automáticamente, el spread [...] lo convierte en array.
    //sort() ordena los departamentos alfabéticamente.
    this.departamentos = depts.sort();
  }

  calcularEstadisticas(): void {
    //Calcula las estadísticas usando el servicio de reportes.
    //Pasa los empleados filtrados para calcular sobre los datos mostrados.
    this.estadisticas = this.reporteService.generarEstadisticasEmpleados(
      this.empleadosFiltrados
    );
  }

  aplicarFiltros(): void {
    //Aplica los filtros de departamento y estado a la lista de empleados.
    let filtrados = this.empleados;

    //Si hay departamento seleccionado, filtra por él.
    if (this.departamentoFiltro) {
      filtrados = filtrados.filter(e => e.departamento === this.departamentoFiltro);
    }

    //Si hay estado seleccionado, filtra por él.
    if (this.estadoFiltro) {
      filtrados = filtrados.filter(e => e.estado === this.estadoFiltro);
    }

    //Actualiza la lista filtrada.
    this.empleadosFiltrados = filtrados;
    //Recalcula las estadísticas con los datos filtrados.
    this.calcularEstadisticas();
  }

  limpiarFiltros(): void {
    //Limpia todos los filtros y muestra todos los empleados nuevamente.
    this.departamentoFiltro = '';  //Borra el filtro de departamento.
    this.estadoFiltro = '';  //Borra el filtro de estado.
    this.empleadosFiltrados = this.empleados;  //Muestra la lista completa.
    //Recalcula las estadísticas con todos los empleados.
    this.calcularEstadisticas();
  }

  exportarReporte(): void {
    //Exporta el reporte en el formato seleccionado (PDF o Excel).
    //Valida que hay datos a exportar.
    if (this.empleadosFiltrados.length === 0) {
      this.error = 'No hay datos para exportar';
      return;
    }

    this.loading = true;
    //setTimeout da tiempo para que se actualice la UI.
    setTimeout(() => {
      try {
        //Decide el formato de exportación.
        if (this.formato === 'pdf') {
          //Exporta a PDF usando el servicio de reportes.
          this.reporteService.exportarEmpleadosAPDF(
            this.empleadosFiltrados,
            this.empresa || undefined
          );
        } else if (this.formato === 'excel') {
          //Exporta a Excel usando el servicio de reportes.
          this.reporteService.exportarEmpleadosAExcel(
            this.empleadosFiltrados,
            this.empresa || undefined
          );
        }

        //Muestra mensaje de éxito.
        this.success = `Reporte exportado a ${this.formato.toUpperCase()} correctamente`;
        //Limpia el mensaje después de 3 segundos.
        setTimeout(() => {
          this.success = '';
        }, 3000);
      } catch (err) {
        //Si hay error, muestra mensaje de error.
        this.error = 'Error al exportar reporte';
        console.error(err);
      } finally {
        //Siempre detiene el loading.
        this.loading = false;
      }
    }, 500);
  }

  obtenerCantidadEmpleados(): number {
    //Devuelve la cantidad total de empleados en la lista filtrada.
    return this.empleadosFiltrados.length;
  }

  obtenerEmpleadosPorEstado(estado: string): number {
    //Cuenta cuántos empleados tienen un estado específico.
    //filter() crea un array solo con los empleados que coinciden con el estado.
    //length devuelve la cantidad.
    return this.empleadosFiltrados.filter(e => e.estado === estado).length;
  }

  obtenerEmpleadosPorDepartamento(departamento: string): number {
    //Cuenta cuántos empleados trabajan en un departamento específico.
    //filter() crea un array solo con los empleados que coinciden con el departamento.
    //length devuelve la cantidad.
    return this.empleadosFiltrados.filter(e => e.departamento === departamento).length;
  }
}
