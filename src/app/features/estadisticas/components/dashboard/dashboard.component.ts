import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Empleado } from '../../../../core/models/empleado.model';
import { Empresa } from '../../../../core/models/empresa.model';
import { EmpleadosService } from '../../../../core/services/empleado.service';
import { EmpresaService } from '../../../../core/services/empresa.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  empleados: Empleado[] = [];
  empresa: Empresa | null = null;
  loading = false;
  error = '';

  // Estadísticas
  totalEmpleados = 0;
  salarioPromedio = 0;
  salarioMax = 0;
  salarioMin = 0;

  // Gráfico de empleados por departamento
  chartDepartamentos!: ChartConfiguration<'bar'>;

  // Gráfico de salarios por departamento
  chartSalarios!: ChartConfiguration<'doughnut'>;

  // Gráfico de estado de empleados
  chartEstados!: ChartConfiguration<'pie'>;

  // Gráfico de salarios (línea)
  chartTendencia!: ChartConfiguration<'line'>;

  private destroy$ = new Subject<void>();

  constructor(
    private empleadosService: EmpleadosService,
    private empresaService: EmpresaService
  ) {}

  ngOnInit(): void {
    //Se ejecuta cuando el componente se inicializa.
    //Carga los datos de empleados y empresa para mostrar en los gráficos.
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
        }
      });

    //Carga todos los empleados y genera los gráficos.
    this.empleadosService.obtenerEmpleados()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (empleados) => {
          this.empleados = empleados;
          //Una vez cargados los empleados, calcula las estadísticas.
          this.calcularEstadisticas();
          //Con las estadísticas, genera todos los gráficos.
          this.generarGraficos();
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Error al cargar datos';
          this.loading = false;
          console.error(err);
        }
      });
  }

  calcularEstadisticas(): void {
    //Calcula todas las estadísticas del dashboard.
    this.totalEmpleados = this.empleados.length;

    //Extrae solo los salarios.
    const salarios = this.empleados.map(e => e.salario);
    //Sumar todos los salarios y dividir entre la cantidad con reduce().
    this.salarioPromedio = Math.round(
      salarios.reduce((a, b) => a + b, 0) / this.totalEmpleados
    );
    //Math.max encuentra el salario más alto.
    this.salarioMax = Math.max(...salarios);
    //Math.min encuentra el salario más bajo.
    this.salarioMin = Math.min(...salarios);
  }

  generarGraficos(): void {
    //Genera todos los gráficos (barras, rosca, pastel, línea) en paralelo.
    this.generarGraficoDepartamentos();
    this.generarGraficoSalarios();
    this.generarGraficoEstados();
    this.generarGraficoTendencia();
  }

  generarGraficoDepartamentos(): void {
    //Genera un gráfico de BARRAS mostrando cuántos empleados hay en cada departamento.
    const departamentos = this.obtenerDepartamentos();
    //map() crea un array con la cantidad de empleados por cada departamento.
    const cantidades = departamentos.map(dept =>
      this.empleados.filter(e => e.departamento === dept).length
    );

    //Configura el gráfico con tipos Chart.js.
    this.chartDepartamentos = {
      type: 'bar',  //Tipo: gráfico de barras
      data: {
        labels: departamentos,  //Nombres de los departamentos en el eje X
        datasets: [
          {
            label: 'Empleados por Departamento',
            data: cantidades,  //Cantidad de empleados en cada departamento
            //Colores del fondo de cada barra (gradientes)
            backgroundColor: [
              '#667eea',
              '#764ba2',
              '#607eaa',
              '#f093fb',
              '#4facfe',
              '#00f2fe',
              '#43e97b'
            ],
            borderColor: [
              '#667eea',
              '#764ba2',
              '#607eaa',
              '#f093fb',
              '#4facfe',
              '#00f2fe',
              '#43e97b'
            ],
            borderWidth: 1
          }
        ]
      },
      //Opciones del gráfico
      options: {
        responsive: true,  //Se adapta al tamaño de la pantalla
        maintainAspectRatio: true,  //Mantiene la proporción ancho/alto
        plugins: {
          legend: {
            display: true  //Muestra la leyenda
          }
        },
        scales: {
          y: {
            beginAtZero: true,  //Comienza en 0
            max: Math.max(...cantidades) + 2  //Máximo del eje Y
          }
        }
      }
    };
  }

  generarGraficoSalarios(): void {
    //Genera un gráfico de ROSCA mostrando el salario promedio por departamento.
    const departamentos = this.obtenerDepartamentos();
    //map() calcula el salario promedio en cada departamento.
    const salariosProm = departamentos.map(dept => {
      //Filtra empleados del departamento actual.
      const emps = this.empleados.filter(e => e.departamento === dept);
      //reduce() suma todos los salarios de ese departamento.
      const totalSalarios = emps.reduce((a, b) => a + b.salario, 0);
      //Divide entre la cantidad de empleados para obtener el promedio.
      return Math.round(totalSalarios / emps.length);
    });

    //Configura el gráfico de rosca.
    this.chartSalarios = {
      type: 'doughnut',  //Tipo: gráfico de rosca
      data: {
        labels: departamentos,  //Nombres de departamentos en la leyenda
        datasets: [
          {
            data: salariosProm,  //Salarios promedio de cada departamento
            //Colores para cada sección de la rosca
            backgroundColor: [
              '#667eea',
              '#607eaa',
              '#764ba2',
              '#f093fb',
              '#4facfe',
              '#00f2fe',
              '#43e97b'
            ],
            borderColor: '#fff',  //Borde blanco entre secciones
            borderWidth: 2
          }
        ]
      },
      //Opciones del gráfico
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'right'  //Leyenda a la derecha
          }
        }
      }
    };
  }

  generarGraficoEstados(): void {
    //Genera un gráfico de PASTEL mostrando la distribución de estados de empleados.
    const estados = this.obtenerEstados();
    //Cuenta cuántos empleados hay en cada estado.
    const cantidades = estados.map(estado =>
      this.empleados.filter(e => e.estado === estado).length
    );

    //Define los colores para cada estado.
    const coloresEstados: { [key: string]: string } = {
      activo: '#43e97b',      //Verde para activos
      inactivo: '#f8476c',    //Rojo para inactivos
      licencia: '#ffa502'     //Naranja para en licencia
    };

    //Configura el gráfico de pastel.
    this.chartEstados = {
      type: 'pie',  //Tipo: gráfico de pastel
      data: {
        labels: estados,  //Nombres de los estados
        datasets: [
          {
            data: cantidades,  //Cantidad de empleados por estado
            //map() asigna el color correspondiente a cada estado.
            backgroundColor: estados.map(e => coloresEstados[e]),
            borderColor: '#fff',  //Borde blanco entre secciones
            borderWidth: 2
          }
        ]
      },
      //Opciones del gráfico
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom'  //Leyenda en la parte inferior
          }
        }
      }
    };
  }

  generarGraficoTendencia(): void {
    //Genera un gráfico de LÍNEA mostrando la tendencia de salarios en el tiempo.
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    //Simula datos de salario promedio variando desde el mes 1 al mes 6.
    const dataSalarios = [
      this.salarioPromedio - 5000,
      this.salarioPromedio - 3000,
      this.salarioPromedio - 1000,
      this.salarioPromedio,
      this.salarioPromedio + 2000,
      this.salarioPromedio + 3000
    ];

    //Configura el gráfico de línea.
    this.chartTendencia = {
      type: 'line',  //Tipo: gráfico de línea
      data: {
        labels: meses,  //Meses en el eje X
        datasets: [
          {
            label: 'Tendencia de Salario Promedio',
            data: dataSalarios,  //Datos de salarios
            borderColor: '#667eea',  //Color de la línea
            backgroundColor: 'rgba(102, 126, 234, 0.1)',  //Color de relleno bajo la línea
            borderWidth: 3,  //Grosor de la línea
            fill: true,  //Rellena el área bajo la línea
            tension: 0.4,  //Suavidad de la curva (0-1)
            pointBackgroundColor: '#667eea',  //Color de los puntos
            pointBorderColor: '#fff',  //Borde de los puntos
            pointBorderWidth: 2,
            pointRadius: 5  //Tamaño de los puntos
          }
        ]
      },
      //Opciones del gráfico
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true  //Muestra la leyenda
          }
        },
        scales: {
          y: {
            beginAtZero: false  //No comienza en 0, se adapta a los datos
          }
        }
      }
    };
  }

  obtenerDepartamentos(): string[] {
    //Extrae todos los departamentos únicos de los empleados.
    //map() obtiene solo el nombre del departamento de cada empleado.
    const depts = [...new Set(this.empleados.map(e => e.departamento))];
    //Set elimina duplicados automáticamente, el spread [...] lo convierte en array.
    //sort() ordena los departamentos alfabéticamente.
    return depts.sort();
  }

  obtenerEstados(): string[] {
    //Extrae todos los estados únicos de los empleados.
    //map() obtiene solo el estado de cada empleado.
    const estados = [...new Set(this.empleados.map(e => e.estado))];
    //Set elimina duplicados, el spread [...] lo convierte en array.
    //sort() ordena los estados alfabéticamente.
    return estados.sort();
  }

  obtenerEmpleadosPorEstado(estado: string): number {
    //Cuenta cuántos empleados tienen un estado específico.
    //filter() crea un array solo con los empleados que coinciden con el estado.
    //length devuelve la cantidad.
    return this.empleados.filter(e => e.estado === estado).length;
  }
}
