import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Empleado, EmpleadoFiltros } from '../models/empleado.model';

@Injectable({
  providedIn: 'root'
})
export class EmpleadosService {
  private apiUrl = 'http://localhost:3001/empleados';
  // BehaviorSubject sirve para almacenar los empleados y cuando se actualizan, notificar a los componentes que estén suscritos.
  private empleadosSubject = new BehaviorSubject<Empleado[]>([]);
  //la variable que cambia, el dolar significa que es un observable.
  public empleados$ = this.empleadosSubject.asObservable();

  constructor(private http: HttpClient) {
    this.cargarEmpleados();
  }

  /**
   * Carga todos los empleados desde la API
   */
  cargarEmpleados(): void {
    this.obtenerEmpleados().subscribe(
      empleados => this.empleadosSubject.next(empleados),
      error => console.error('Error al cargar empleados:', error)
    );
  }

  /**
   * Obtiene todos los empleados
   */
  obtenerEmpleados(): Observable<Empleado[]> {
    return this.http.get<Empleado[]>(this.apiUrl)
    //Se puede decir que .pipe hace funcion de try catch.
      .pipe(
        //Avisa que se ha cargado los empleados, para que se pueda ver en consola.
        tap(empleados => console.log('Empleados cargados:', empleados)),
        catchError(error => {
          console.error('Error en obtenerEmpleados:', error);
          return of([]);
        })
      );
  }

  /**
   * Obtiene un empleado por ID
   */
  obtenerEmpleado(id: number): Observable<Empleado> {
    // Es decir empleado/1, empleado/2, etc.
    return this.http.get<Empleado>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error('Error en obtenerEmpleado:', error);
          throw error;
        })
      );
  }

  /**
   * Obtiene empleados por departamento
   */
  obtenerEmpleadosPorDepartamento(departamento: string): Observable<Empleado[]> {
    //Filtra empleados por departamento usando ? en la URL, devuelve array vacío si falla.
    return this.http.get<Empleado[]>(`${this.apiUrl}?departamento=${departamento}`)
      .pipe(
        catchError(error => {
          console.error('Error en obtenerEmpleadosPorDepartamento:', error);
          return of([]);
        })
      );
  }

  /**
   * Obtiene empleados por empresa
   */
  obtenerEmpleadosPorEmpresa(empresaId: number): Observable<Empleado[]> {
    //Filtra empleados por empresa, si hay error devuelve array vacío.
    return this.http.get<Empleado[]>(`${this.apiUrl}?empresaId=${empresaId}`)
      .pipe(
        catchError(error => {
          console.error('Error en obtenerEmpleadosPorEmpresa:', error);
          return of([]);
        })
      );
  }

  /**
   * Obtiene empleados por estado
   */
  obtenerEmpleadosPorEstado(estado: string): Observable<Empleado[]> {
    //Filtra empleados por estado (activo, inactivo, etc).
    return this.http.get<Empleado[]>(`${this.apiUrl}?estado=${estado}`)
      .pipe(
        catchError(error => {
          console.error('Error en obtenerEmpleadosPorEstado:', error);
          return of([]);
        })
      );
  }

  /**
   * Crea un nuevo empleado
   */
  crearEmpleado(empleado: Omit<Empleado, 'id'>): Observable<Empleado> {
    //POST crea el empleado, tap agrega el nuevo empleado al BehaviorSubject para actualizar la lista.
    return this.http.post<Empleado>(this.apiUrl, empleado)
      .pipe(
        //Cuando se crea, agrega a la lista interna para que los componentes vean el cambio.
        tap(nuevoEmpleado => {
          const empleados = this.empleadosSubject.value;
          //Usa spread operator para crear un nuevo array con el empleado agregado.
          this.empleadosSubject.next([...empleados, nuevoEmpleado]);
          console.log('Empleado creado:', nuevoEmpleado);
        }),
        catchError(error => {
          console.error('Error en crearEmpleado:', error);
          throw error;
        })
      );
  }

  /**
   * Actualiza un empleado
   */
  actualizarEmpleado(id: number, empleado: Partial<Empleado>): Observable<Empleado> {
    //PATCH actualiza solo algunos campos del empleado, tap actualiza la lista interna.
    return this.http.patch<Empleado>(`${this.apiUrl}/${id}`, empleado)
      .pipe(
        //Busca el empleado en la lista y lo reemplaza con los datos actualizados.
        tap(empleadoActualizado => {
          const empleados = this.empleadosSubject.value;
          //findIndex() encuentra la posición del empleado a actualizar.
          const index = empleados.findIndex(e => e.id === id);
          if (index >= 0) {
            //Reemplaza el empleado en esa posición.
            empleados[index] = empleadoActualizado;
            this.empleadosSubject.next([...empleados]);
          }
          console.log('Empleado actualizado:', empleadoActualizado);
        }),
        catchError(error => {
          console.error('Error en actualizarEmpleado:', error);
          throw error;
        })
      );
  }

  /**
   * Elimina un empleado
   */
  eliminarEmpleado(id: number): Observable<void> {
    //DELETE elimina el empleado del servidor, filter lo quita de la lista interna.
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        //Cuando se elimina, lo quita de la lista interna usando filter().
        tap(() => {
          //filter crea un nuevo array sin el empleado eliminado.
          const empleados = this.empleadosSubject.value.filter(e => e.id !== id);
          this.empleadosSubject.next(empleados);
          console.log('Empleado eliminado:', id);
        }),
        catchError(error => {
          console.error('Error en eliminarEmpleado:', error);
          throw error;
        })
      );
  }

  /**
   * Obtiene estadísticas de empleados
   */
  obtenerEstadisticas(filtros?: EmpleadoFiltros): Observable<any> {
    //Calcula estadísticas como promedio de salario, máximo, mínimo y agrupaciones.
    return this.obtenerEmpleados()
      .pipe(
        tap(empleados => {
          let filtrados = empleados;

          //Aplica filtros si se proporcionan (departamento, estado, empresaId).
          if (filtros?.departamento) {
            filtrados = filtrados.filter(e => e.departamento === filtros.departamento);
          }
          if (filtros?.estado) {
            filtrados = filtrados.filter(e => e.estado === filtros.estado);
          }
          if (filtros?.empresaId) {
            filtrados = filtrados.filter(e => e.empresaId === filtros.empresaId);
          }

          //Extrae solo los salarios para los cálculos.
          const salarios = filtrados.map(e => e.salario);
          //Crea un objeto con todas las estadísticas necesarias.
          const estadisticas = {
            total: filtrados.length,
            //reduce suma todos los salarios, luego divide por la cantidad.
            salarioPromedio: salarios.length > 0 ? Math.round(salarios.reduce((a, b) => a + b) / salarios.length) : 0,
            //Math.max encuentra el salario más alto.
            salarioMax: salarios.length > 0 ? Math.max(...salarios) : 0,
            //Math.min encuentra el salario más bajo.
            salarioMin: salarios.length > 0 ? Math.min(...salarios) : 0,
            //Agrupa los empleados por departamento y estado.
            departamentos: this.agruparPorDepartamento(filtrados),
            estados: this.agruparPorEstado(filtrados)
          };

          console.log('Estadísticas calculadas:', estadisticas);
        }),
        catchError(error => {
          console.error('Error en obtenerEstadisticas:', error);
          return of(null);
        })
      );
  }

  /**
   * Agrupa empleados por departamento
   */
  //Cuenta cuántos empleados hay en cada departamento usando reduce().
  private agruparPorDepartamento(empleados: Empleado[]): { [key: string]: number } {
    //reduce() acumula un objeto con el nombre del departamento y la cantidad.
    return empleados.reduce((acc, emp) => {
      //Si el departamento ya existe suma 1, si no existe le asigna 1.
      acc[emp.departamento] = (acc[emp.departamento] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  }

  /**
   * Agrupa empleados por estado
   */
  //Cuenta cuántos empleados hay en cada estado (activo, inactivo, etc).
  private agruparPorEstado(empleados: Empleado[]): { [key: string]: number } {
    //Mismo principio que agruparPorDepartamento, pero por estado.
    return empleados.reduce((acc, emp) => {
      acc[emp.estado] = (acc[emp.estado] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  }

  /**
   * Obtiene los valores actuales de empleados sin necesidad de suscribirse
   */
  //Devuelve los empleados actuales sin necesidad de suscribirse con subscribe().
  obtenerEmpleadosActuales(): Empleado[] {
    //.value obtiene el valor actual del BehaviorSubject al instante.
    return this.empleadosSubject.value;
  }
}
