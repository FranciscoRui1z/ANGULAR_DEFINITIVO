import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Empleado } from '../../../../core/models/empleado.model';
import { Empresa } from '../../../../core/models/empresa.model';
import { EmpleadosService } from '../../../../core/services/empleado.service';
import { EmpresaService } from '../../../../core/services/empresa.service';

@Component({
  selector: 'app-empresa-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './empresa-detail.component.html',
  styleUrl: './empresa-detail.component.css'
})
export class EmpresaDetailComponent implements OnInit, OnDestroy {
  //Objeto empresa con los datos de la empresa (null si aún no se cargó).
  empresa: Empresa | null = null;
  //Array de empleados de la empresa.
  empleados: Empleado[] = [];
  loading = false;
  error = '';
  //Bandera que indica si se está editando la empresa.
  editando = false;
  //Copia de la empresa original para poder revertir cambios si se cancela la edición.
  empresaOriginal: Empresa | null = null;
  //Subject para desuscribirse automáticamente al destruir el componente.
  private destroy$ = new Subject<void>();

  constructor(
    private empresaService: EmpresaService,
    private empleadosService: EmpleadosService,
    private router: Router
  ) {}

  ngOnInit(): void {
    //Se ejecuta cuando el componente se inicializa.
    //Carga los datos de la empresa.
    this.cargarEmpresa();
  }

  ngOnDestroy(): void {
    //Se ejecuta cuando el componente se destruye.
    //Emite en el Subject para desuscribirse de todos los observables.
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarEmpresa(): void {
    //Carga la empresa con ID 1 (la principal) del servicio.
    this.loading = true;
    this.empresaService.obtenerEmpresa(1)
      //takeUntil desuscribe automáticamente cuando el componente se destruye.
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (empresa) => {
          //Guarda la empresa en la propiedad.
          this.empresa = empresa;
          //Crea una copia de la empresa original para poder revertir cambios.
          this.empresaOriginal = { ...empresa };
          //Carga los empleados de la empresa.
          this.cargarEmpleados();
        },
        error: (err) => {
          this.error = 'Error al cargar empresa: ' + err.message;
          this.loading = false;
        }
      });
  }

  cargarEmpleados(): void {
    //Carga los empleados de la empresa con ID 1.
    this.empleadosService.obtenerEmpleadosPorEmpresa(1)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (empleados) => {
          //Guarda los empleados en el array.
          this.empleados = empleados;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar empleados:', err);
          this.loading = false;
        }
      });
  }

  editarEmpresa(): void {
    //Activa el modo de edición y guarda una copia de la empresa actual.
    this.editando = true;
    //Haz una copia profunda para poder revertir si se cancela.
    this.empresaOriginal = { ...this.empresa! };
  }

  guardarCambios(): void {
    //Guarda los cambios realizados en la empresa.
    if (!this.empresa) return;  //Verifica que la empresa exista.

    this.loading = true;
    //Llama al servicio para actualizar la empresa.
    this.empresaService.actualizarEmpresa(this.empresa.id, this.empresa)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          //Si se guarda exitosamente, desecha el modo de edición.
          this.editando = false;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Error al actualizar empresa';
          this.loading = false;
          console.error(err);
        }
      });
  }

  cancelarEdicion(): void {
    //Cancela la edición y revierte los cambios usando la copia original.
    //Si empresaOriginal existe, hace una copia, si no pone null.
    this.empresa = this.empresaOriginal ? { ...this.empresaOriginal } : null;
    this.editando = false;
  }

  irAEmpleados(): void {
    //Navega a la lista de empleados.
    this.router.navigate(['/empleados']);
  }

  obtenerEstadisticas() {
    //Calcula estadísticas sobre los empleados de la empresa.
    if (!this.empleados.length) return null;  //Si no hay empleados devuelve null.

    //map() extrae solo los salarios.
    const salarios = this.empleados.map(e => e.salario);
    //reduce() suma todos los salarios y divide entre la cantidad para obtener promedio.
    const salarioPromedio = salarios.reduce((a, b) => a + b, 0) / salarios.length;

    //Devuelve un objeto con las estadísticas.
    return {
      totalEmpleados: this.empleados.length,
      //Math.round redondea el promedio a número entero.
      salarioPromedio: Math.round(salarioPromedio),
      //Math.max encuentra el salario más alto.
      salarioMax: Math.max(...salarios),
      //Math.min encuentra el salario más bajo.
      salarioMin: Math.min(...salarios)
    };
  }
}
