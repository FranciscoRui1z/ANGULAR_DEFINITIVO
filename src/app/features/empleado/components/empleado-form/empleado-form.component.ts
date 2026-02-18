import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Empleado } from '../../../../core/models/empleado.model';
import { Empresa } from '../../../../core/models/empresa.model';
import { EmpleadosService } from '../../../../core/services/empleado.service';
import { EmpresaService } from '../../../../core/services/empresa.service';

@Component({
  selector: 'app-empleado-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './empleado-form.component.html',
  styleUrl: './empleado-form.component.css'
})
export class EmpleadoFormComponent implements OnInit, OnDestroy {
  //Objeto empleado vacío con valores por defecto. Se llena al crear o editar.
  empleado: Empleado = {
    id: 0,
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    departamento: '',
    puesto: '',
    salario: 0,
    //toISOString().split('T')[0] devuelve la fecha de hoy en formato YYYY-MM-DD.
    fechaContratacion: new Date().toISOString().split('T')[0],
    estado: 'activo',
    empresaId: 1
  };

  //Array de empresas obtenido del servicio.
  empresas: Empresa[] = [];
  //Array de departamentos disponibles en la empresa.
  departamentos = [
    'Desarrollo',
    'Recursos Humanos',
    'Ventas',
    'Finanzas',
    'Marketing',
    'Operaciones'
  ];
  //Array de estados posibles para un empleado.
  estados = ['activo', 'inactivo', 'licencia'];
  //Indica si se está editando un empleado existente o creando uno nuevo.
  isEditando = false;
  loading = false;
  error = '';
  //Subject para desuscribirse automáticamente al destruir el componente.
  private destroy$ = new Subject<void>();

  constructor(
    private empleadosService: EmpleadosService,
    private empresaService: EmpresaService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    //Se ejecuta cuando el componente se inicializa.
    //Carga las empresas disponibles y verifica si se está editando.
    this.cargarEmpresas();
    this.verificarEdicion();
  }

  ngOnDestroy(): void {
    //Se ejecuta cuando el componente se destruye.
    //Emite en el Subject para desuscribirse de todos los observables.
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarEmpresas(): void {
    //Obtiene todas las empresas del servicio para mostrarlas en el formulario.
    this.empresaService.obtenerEmpresas()
      //takeUntil(this.destroy$) desuscribe automáticamente cuando el componente se destruye.
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (empresas) => {
          //Si la petición es exitosa, guarda las empresas.
          this.empresas = empresas;
        },
        error: (err) => console.error('Error al cargar empresas:', err)
      });
  }

  verificarEdicion(): void {
    //Obtiene el ID del empleado de la URL usando ActivatedRoute.
    //Si hay ID significa que se está editando, si no se está creando.
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditando = true;  //Marca que se está editando.
      this.cargarEmpleado(Number(id));  //Carga los datos del empleado.
    }
  }

  cargarEmpleado(id: number): void {
    //Carga los datos de un empleado específ ico por su ID desde el servicio.
    this.loading = true;
    this.empleadosService.obtenerEmpleado(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (empleado) => {
          //Si se carga exitosamente, llena el formulario con los datos.
          this.empleado = empleado;
          this.loading = false;
        },
        error: (err) => {
          //Si hay error, muestra mensaje y detiene la carga.
          this.error = 'Error al cargar empleado';
          this.loading = false;
          console.error(err);
        }
      });
  }

  guardar(): void {
    //Valida el formulario antes de guardar.
    if (!this.validarFormulario()) {
      return;  //Si la validación falla, no continua.
    }

    this.loading = true;
    //Decide si actualizar (si isEditando) o crear (si es nuevo).
    const operacion = this.isEditando
      ? this.empleadosService.actualizarEmpleado(this.empleado.id, this.empleado)
      : this.empleadosService.crearEmpleado(this.empleado);

    operacion
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          //Si se guarda exitosamente, navega a la lista de empleados.
          this.router.navigate(['/empleados']);
        },
        error: (err) => {
          //Si hay error, muestra mensaje y mantiene el formulario.
          this.error = 'Error al guardar empleado';
          this.loading = false;
          console.error(err);
        }
      });
  }

  validarFormulario(): boolean {
    //Realiza validaciones en todos los campos del formulario.
    //Devuelve true si todos son válidos, false si hay algún error.

    //Valida que el nombre no esté vacío (trim elimina espacios en blanco).
    if (!this.empleado.nombre.trim()) {
      this.error = 'El nombre es requerido';
      return false;
    }
    //Valida que el apellido no esté vacío.
    if (!this.empleado.apellido.trim()) {
      this.error = 'El apellido es requerido';
      return false;
    }
    //Valida que el email no esté vacío.
    if (!this.empleado.email.trim()) {
      this.error = 'El email es requerido';
      return false;
    }
    //Valida que el email tenga formato correcto.
    if (!this.validarEmail(this.empleado.email)) {
      this.error = 'El email no es válido';
      return false;
    }
    //Valida que se seleccione un departamento.
    if (!this.empleado.departamento) {
      this.error = 'El departamento es requerido';
      return false;
    }
    //Valida que el puesto no esté vacío.
    if (!this.empleado.puesto.trim()) {
      this.error = 'El puesto es requerido';
      return false;
    }
    //Valida que el salario sea mayor a 0.
    if (this.empleado.salario <= 0) {
      this.error = 'El salario debe ser mayor a 0';
      return false;
    }

    //Si todas las validaciones pasaron, limpia el error y devuelve true.
    this.error = '';
    return true;
  }

  validarEmail(email: string): boolean {
    //Usa expresión regular para validar el formato del email.
    //^ = inicio, $ = fin, \S = no espacios, @ = arroba obligatoria, \. = punto obligatorio.
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    //test() devuelve true si el email coincide con el patrón, false si no.
    return regex.test(email);
  }

  cancelar(): void {
    //Navega de vuelta a la lista de empleados sin guardar cambios.
    this.router.navigate(['/empleados']);
  }
}
