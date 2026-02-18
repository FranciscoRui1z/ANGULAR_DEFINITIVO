import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Empleado } from '../../../../core/models/empleado.model';
import { EmpleadosService } from '../../../../core/services/empleado.service';


@Component({
  selector: 'app-empleado-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './empleado-list.component.html',
  styleUrl: './empleado-list.component.css'
})
export class EmpleadoListComponent implements OnInit, OnDestroy {
  //Array con todos los empleados obtenidos del servicio.
  empleados: Empleado[] = [];
  //Array con los empleados filtrados según los criterios de búsqueda.
  empleadosFiltrados: Empleado[] = [];
  loading = false;
  error = '';
  //Filtro de búsqueda por nombre o apellido.
  filtro = '';
  //Filtro por departamento seleccionado.
  departamentoFiltro = '';
  //Array único de departamentos (sin repeticiones) para mostrar en el select.
  departamentos: string[] = [];
  //Subject para desuscribirse automáticamente al destruir el componente.
  private destroy$ = new Subject<void>();

  constructor(
    private empleadosService: EmpleadosService,
    private router: Router
  ) {}

  ngOnInit(): void {
    //Se ejecuta cuando el componente se inicializa.
    //Carga la lista de empleados desde el servicio.
    this.cargarEmpleados();
  }

  ngOnDestroy(): void {
    //Se ejecuta cuando el componente se destruye.
    //Emite en el Subject para desuscribirse de todos los observables.
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarEmpleados(): void {
    //Obtiene todos los empleados del servicio.
    this.loading = true;
    this.empleadosService.obtenerEmpleados()
      //takeUntil desuscribe automáticamente cuando el componente se destruye.
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (empleados) => {
          //Si la petición es exitosa, guarda los empleados.
          this.empleados = empleados;
          //Inicialmente muestra todos, luego se filtran.
          this.empleadosFiltrados = empleados;
          //Extrae los departamentos únicos de los empleados.
          this.extraerDepartamentos();
          this.loading = false;
        },
        error: (err) => {
          //Si hay error, muestra el mensaje.
          this.error = 'Error al cargar empleados: ' + err.message;
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

  aplicarFiltros(): void {
    //Filtra los empleados según el nombre/apellido y el departamento seleccionado.
    this.empleadosFiltrados = this.empleados.filter(empleado => {
      //Busca coincidencia en nombre o apellido (case-insensitive).
      const coincideNombre = empleado.nombre.toLowerCase().includes(this.filtro.toLowerCase()) ||
                            empleado.apellido.toLowerCase().includes(this.filtro.toLowerCase());
      //Si no hay filtro de departamento (!this.departamentoFiltro) devuelve true, si hay compara.
      const coincideDepartamento = !this.departamentoFiltro || empleado.departamento === this.departamentoFiltro;
      //Retorna true solo si coinciden AMBOS criterios (AND lógico).
      return coincideNombre && coincideDepartamento;
    });
  }

  eliminarEmpleado(id: number): void {
    //Elimina un empleado después de pedir confirmación.
    //confirm() muestra un diálogo del navegador con sí/no y retorna boolean.
    if (confirm('¿Está seguro de que desea eliminar este empleado?')) {
      this.empleadosService.eliminarEmpleado(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            //Si se elimina exitosamente, recarga la lista.
            this.cargarEmpleados();
          },
          error: (err) => {
            this.error = 'Error al eliminar empleado';
            console.error(err);
          }
        });
    }
  }

  editarEmpleado(id: number): void {
    //Navega al formulario de edición pasando el ID del empleado como parámetro en la URL.
    //La ruta /empleados/:id es capturada por el formulario.
    this.router.navigate(['/empleados', id]);
  }

  nuevoEmpleado(): void {
    //Navega al formulario de creación de un nuevo empleado.
    this.router.navigate(['/empleados/nuevo']);
  }

  limpiarFiltros(): void {
    //Limpia todos los filtros y muestra todos los empleados nuevamente.
    this.filtro = '';  //Borra la búsqueda por nombre/apellido.
    this.departamentoFiltro = '';  //Borra la selección de departamento.
    this.empleadosFiltrados = this.empleados;  //Muestra la lista completa.
  }
}
