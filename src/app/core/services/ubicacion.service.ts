import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { Ubicacion, CoordenadaPais, PAISES_COORDENADAS } from '../models/ubicacion.model';

@Injectable({
  providedIn: 'root'
})
export class UbicacionService {
  //BehaviorSubject que almacena todas las ubicaciones con datos iniciales hardcodeados.
  private ubicacionesSubject = new BehaviorSubject<Ubicacion[]>([
    {
      id: 1,
      nombre: 'TechCorp Toronto',
      latitud: 43.6426,
      longitud: -79.3871,
      pais: 'Canadá',
      ciudad: 'Toronto',
      tipo: 'oficina',
      activa: true
    },
    {
      id: 2,
      nombre: 'TechCorp Vancouver',
      latitud: 49.2827,
      longitud: -123.1207,
      pais: 'Canadá',
      ciudad: 'Vancouver',
      tipo: 'centro-distribucion',
      activa: true
    },
    {
      id: 3,
      nombre: 'TechCorp Almacén Toronto',
      latitud: 43.7315,
      longitud: -79.7624,
      pais: 'Canadá',
      ciudad: 'Toronto',
      tipo: 'almacen',
      activa: true
    }
  ]);

  //Observable público que se suscribe a los cambios de ubicaciones.
  public ubicaciones$ = this.ubicacionesSubject.asObservable();

  constructor() {}

  /**
   * Obtiene todas las ubicaciones
   */
  obtenerUbicaciones(): Observable<Ubicacion[]> {
    //Devuelve el observable de ubicaciones para que los componentes se suscriban.
    return this.ubicaciones$;
  }

  /**
   * Obtiene las coordenadas de un país o ciudad
   */
  obtenerCoordenadas(pais: string): CoordenadaPais | null {
    //Busca las coordenadas (latitud, longitud, zoom) de un país en el objeto constante.
    //Devuelve null si el país no existe.
    return PAISES_COORDENADAS[pais] || null;
  }

  /**
   * Obtiene todos los países disponibles
   */
  obtenerTodosPaises(): string[] {
    //Object.keys extrae todas las claves (países) del objeto PAISES_COORDENADAS.
    //Devuelve un array con los nombres de los países disponibles.
    return Object.keys(PAISES_COORDENADAS);
  }

  /**
   * Agrega una nueva ubicación
   */
  agregarUbicacion(ubicacion: Omit<Ubicacion, 'id'>): void {
    //Agrega una nueva ubicación sin ID (Omit lo excluye), la función genera un ID automático.
    const ubicaciones = this.ubicacionesSubject.value;  //Obtiene el array actual.
    //Math.max encuentra el ID más alto existente, suma 1 para crear el nuevo ID. Si está vacío devuelve 0.
    const newId = Math.max(...ubicaciones.map(u => u.id), 0) + 1;
    //push agrega la nueva ubicación con el ID generado.
    ubicaciones.push({ ...ubicacion, id: newId } as Ubicacion);
    //Notifica a los suscriptores que cambió el array (spread operator crea uno nuevo).
    this.ubicacionesSubject.next([...ubicaciones]);
    console.log('Ubicación agregada:', ubicacion);
  }

  /**
   * Actualiza una ubicación existente
   */
  actualizarUbicacion(id: number, ubicacion: Partial<Ubicacion>): void {
    //Actualiza una ubicación existente. Partial permite actualizar solo algunos campos.
    const ubicaciones = this.ubicacionesSubject.value.map(u =>
      //Si el ID coincide, mezcla los nuevos datos con los existentes. Si no, devuelve sin cambios.
      u.id === id ? { ...u, ...ubicacion } : u
    );
    //Notifica a los suscriptores del cambio.
    this.ubicacionesSubject.next(ubicaciones);
    console.log('Ubicación actualizada:', id);
  }

  /**
   * Elimina una ubicación
   */
  eliminarUbicacion(id: number): void {
    //Elimina una ubicación. Filter crea un nuevo array sin la ubicación con el ID especificado.
    const ubicaciones = this.ubicacionesSubject.value.filter(u => u.id !== id);
    //Notifica a los suscriptores del cambio.
    this.ubicacionesSubject.next(ubicaciones);
    console.log('Ubicación eliminada:', id);
  }

  /**
   * Obtiene ubicaciones por país
   */
  obtenerUbicacionesPorPais(pais: string): Ubicacion[] {
    //Filtra las ubicaciones que coincidan con el país especificado.
    //Devuelve un array con solo las ubicaciones de ese país.
    return this.ubicacionesSubject.value.filter(u => u.pais === pais);
  }

  /**
   * Obtiene ubicaciones por tipo
   */
  obtenerUbicacionesPorTipo(tipo: 'oficina' | 'almacen' | 'centro-distribucion'): Ubicacion[] {
    //Filtra las ubicaciones por tipo de local (oficina, almacén o centro de distribución).
    //Solo acepta esos tres tipos (type union).
    return this.ubicacionesSubject.value.filter(u => u.tipo === tipo);
  }

  /**
   * Obtiene ubicaciones activas
   */
  obtenerUbicacionesActivas(): Ubicacion[] {
    //Filtra solo las ubicaciones que estén activas (activa === true).
    return this.ubicacionesSubject.value.filter(u => u.activa);
  }

  /**
   * Obtiene las ubicaciones actuales sin necesidad de suscribirse
   */
  obtenerUbicacionesActuales(): Ubicacion[] {
    //.value obtiene el valor actual del BehaviorSubject sin necesidad de suscribirse.
    //Útil cuando necesitas acceso immediato en lugar de usar subscribe().
    return this.ubicacionesSubject.value;
  }
}
