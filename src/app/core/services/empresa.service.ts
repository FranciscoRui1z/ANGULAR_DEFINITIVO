import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Empresa } from '../models/empresa.model';

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {
  private apiUrl = 'http://localhost:3001/empresas';
  //BehaviorSubject guarda la empresa actual, puede ser null si no hay empresa.
  private empresaSubject = new BehaviorSubject<Empresa | null>(null);
  //La variable observable que se suscribe a los cambios de empresa.
  public empresa$ = this.empresaSubject.asObservable();

  constructor(private http: HttpClient) {
    this.cargarEmpresa();
  }

  /**
   * Carga la empresa principal
   */
  cargarEmpresa(): void {
    //Obtiene la empresa con ID 1 (la principal) y la guarda en el BehaviorSubject.
    this.obtenerEmpresa(1).subscribe(
      empresa => this.empresaSubject.next(empresa),
      error => console.error('Error al cargar empresa:', error)
    );
  }

  /**
   * Obtiene todas las empresas
   */
  obtenerEmpresas(): Observable<Empresa[]> {
    //Obtiene todas las empresas de la API, usa pipe para procesar y manejar errores.
    return this.http.get<Empresa[]>(this.apiUrl)
      .pipe(
        //tap registra en consola que se cargaron las empresas.
        tap(empresas => console.log('Empresas cargadas:', empresas)),
        //catchError devuelve un array vacío si hay error.
        catchError(error => {
          console.error('Error en obtenerEmpresas:', error);
          return of([]);
        })
      );
  }

  /**
   * Obtiene una empresa por ID
   */
  obtenerEmpresa(id: number): Observable<Empresa> {
    //Obtiene una empresa específ ica por su ID, usa template literal para construir la URL.
    return this.http.get<Empresa>(`${this.apiUrl}/${id}`)
      .pipe(
        //tap registra la empresa cargada. El error se propaga (throw error).
        tap(empresa => console.log('Empresa cargada:', empresa)),
        catchError(error => {
          console.error('Error en obtenerEmpresa:', error);
          throw error;
        })
      );
  }

  /**
   * Crea una nueva empresa
   */
  crearEmpresa(empresa: Omit<Empresa, 'id'>): Observable<Empresa> {
    //POST crea una nueva empresa, Omit<Empresa, 'id'> significa que NO incluye el ID (lo asigna el servidor).
    return this.http.post<Empresa>(this.apiUrl, empresa)
      .pipe(
        //tap registra que la empresa se creó correctamente.
        tap(nuevaEmpresa => {
          console.log('Empresa creada:', nuevaEmpresa);
        }),
        //catchError propaga el error para que el componente lo maneje.
        catchError(error => {
          console.error('Error en crearEmpresa:', error);
          throw error;
        })
      );
  }

  /**
   * Actualiza una empresa
   */
  actualizarEmpresa(id: number, empresa: Partial<Empresa>): Observable<Empresa> {
    //PATCH actualiza solo algunos campos de la empresa, tap actualiza el BehaviorSubject.
    return this.http.patch<Empresa>(`${this.apiUrl}/${id}`, empresa)
      .pipe(
        //tap guarda la empresa actualizada en el BehaviorSubject para notificar a los componentes.
        tap(empresaActualizada => {
          this.empresaSubject.next(empresaActualizada);
          console.log('Empresa actualizada:', empresaActualizada);
        }),
        //catchError propaga el error.
        catchError(error => {
          console.error('Error en actualizarEmpresa:', error);
          throw error;
        })
      );
  }

  /**
   * Elimina una empresa
   */
  eliminarEmpresa(id: number): Observable<void> {
    //DELETE elimina la empresa, tap establece empresaSubject a null.
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        //tap limpia el BehaviorSubject poniendo null cuando se elimina la empresa.
        tap(() => {
          this.empresaSubject.next(null);
          console.log('Empresa eliminada:', id);
        }),
        //catchError propaga el error.
        catchError(error => {
          console.error('Error en eliminarEmpresa:', error);
          throw error;
        })
      );
  }

  /**
   * Obtiene la empresa actual sin necesidad de suscribirse
   */
  //Devuelve la empresa actual (o null) sin necesidad de suscribirse.
  obtenerEmpresaActual(): Empresa | null {
    //.value obtiene el valor actual del BehaviorSubject al instante.
    return this.empresaSubject.value;
  }
}
