import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as L from 'leaflet';
import { Ubicacion } from '../../../../core/models/ubicacion.model';
import { UbicacionService } from '../../../../core/services/ubicacion.service';
import { EmpresaService } from '../../../../core/services/empresa.service';
import { Empresa } from '../../../../core/models/empresa.model';

@Component({
  selector: 'app-mapa-ubicacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mapa-ubicacion.component.html',
  styleUrl: './mapa-ubicacion.component.css'
})
export class MapaUbicacionComponent implements OnInit, OnDestroy {
  //@ViewChild accede al div del template con #mapContainer para renderizar Leaflet.
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  //Instancia del mapa de Leaflet (null hasta que se inicializa).
  map: L.Map | null = null;
  //Array con todas las ubicaciones de oficinas, almacenes, etc.
  ubicaciones: Ubicacion[] = [];
  //Datos de la empresa principal.
  empresa: Empresa | null = null;
  loading = false;
  error = '';

  //País seleccionado actualmente para mostrar en el mapa.
  paisSeleccionado = 'Canada';
  //Array de países disponibles para el selector.
  paises: string[] = [];
  //Propiedad auxiliar para manipular marcadores.
  marker: L.Marker | null = null;

  //Subject para desuscribirse automáticamente al destruir el componente.
  private destroy$ = new Subject<void>();

  constructor(
    private ubicacionService: UbicacionService,
    private empresaService: EmpresaService
  ) {}

  ngOnInit(): void {
    //Se ejecuta cuando el componente se inicializa.
    //Carga los datos de ubicaciones y empresa.
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    //Se ejecuta cuando el componente se destruye.
    //Limpia el mapa de Leaflet si existe para evitar memory leaks.
    if (this.map) {
      this.map.remove();
    }
    //Emite en el Subject para desuscribirse de todos los observables.
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarDatos(): void {
    //Carga la empresa y las ubicaciones de forma paralela.
    this.loading = true;

    //Carga la empresa con ID 1 (principal).
    this.empresaService.obtenerEmpresa(1)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (empresa) => {
          this.empresa = empresa;
        }
      });

    //Carga todas las ubicaciones de oficinas, almacenes y centros de distribución.
    this.ubicacionService.obtenerUbicaciones()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ubicaciones) => {
          this.ubicaciones = ubicaciones;
          //Obtiene el listado de países disponibles.
          this.paises = this.ubicacionService.obtenerTodosPaises();
          //Inicializa el mapa de Leaflet con las ubicaciones.
          this.inicializarMapa();
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Error al cargar ubicaciones';
          this.loading = false;
          console.error(err);
        }
      });
  }

  inicializarMapa(): void {
    // setTimeout espera a que el DOM esté completamente renderizado antes de crear el mapa.
    // Sin esto Leaflet no puede acceder al elemento del DOM.
    setTimeout(() => {
      if (!this.mapContainer) return;

      //Obtiene las coordenadas (latitud, longitud, zoom) del país seleccionado.
      const coordenadas = this.ubicacionService.obtenerCoordenadas(this.paisSeleccionado);
      if (!coordenadas) return;

      // Crear mapa de Leaflet en el elemento del DOM con las coordenadas iniciales.
      this.map = L.map(this.mapContainer.nativeElement).setView(
        [coordenadas.latitud, coordenadas.longitud],
        coordenadas.zoom
      );

      // Agregar capa base de OpenStreetMap (mapa del mundo).
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(this.map);

      // Agregar marcadores de todas las ubicaciones en el mapa.
      this.agregarMarcadores();
    }, 100);
  }

  agregarMarcadores(): void {
    //Agrega marcadores de todas las ubicaciones en el mapa.
    if (!this.map) return;

    // Limpia los marcadores anteriores para evitar duplicados.
    // eachLayer() itera sobre todas las capas del mapa.
    this.map.eachLayer((layer) => {
      // instanceof verifica si la capa es un marcador de Leaflet.
      if (layer instanceof L.Marker) {
        this.map!.removeLayer(layer);
      }
    });

    // Agrega nuevos marcadores para cada ubicación.
    this.ubicaciones.forEach((ubicacion) => {
      //Crea un marcador en las coordenadas de la ubicación.
      const marcador = L.marker([ubicacion.latitud, ubicacion.longitud], {
        //obtenerIcono() define el ícono visual según el tipo de ubicación.
        icon: this.obtenerIcono(ubicacion.tipo)
      }).bindPopup(`
        <div class="popup-content">
          <h4>${ubicacion.nombre}</h4>
          <p><strong>Ciudad:</strong> ${ubicacion.ciudad}</p>
          <p><strong>País:</strong> ${ubicacion.pais}</p>
          <p><strong>Tipo:</strong> ${ubicacion.tipo}</p>
          <p><strong>Estado:</strong> ${ubicacion.activa ? 'Activa' : 'Inactiva'}</p>
        </div>
      `);

      //Agrega el marcador al mapa.
      marcador.addTo(this.map!);
    });
  }

  obtenerIcono(tipo: string): L.Icon {
    const iconos: { [key: string]: { url: string; color: string } } = {
      'oficina': {
        url: '🏢',
        color: '#007bff'
      },
      'almacen': {
        url: '🏭',
        color: '#6c757d'
      },
      'centro-distribucion': {
        url: '🚛',
        color: '#28a745'
      }
    };

    const config = iconos[tipo] || iconos['oficina'];

    return L.icon({
      iconUrl: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${encodeURIComponent(config.color)}"><path d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 16 8 16s8-10.75 8-16c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/></svg>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  }

  cambiarPais(): void {
    //Cambia el país mostrado en el mapa y reinicializa.
    //Destruye el mapa anterior para crear uno nuevo.
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    //Inicializa el mapa con el nuevo país seleccionado.
    this.inicializarMapa();
  }

  obtenerPaisActual(): string {
    //Devuelve el nombre completo del país actualmente seleccionado.
    //Busca las coordenadas del país para obtener su nombre completo.
    const coordenadas = this.ubicacionService.obtenerCoordenadas(this.paisSeleccionado);
    //Usa el operador ?. (optional chaining) para acceder a la propiedad nombre de forma segura.
    return coordenadas?.nombre || this.paisSeleccionado;
  }

  obtenerUbicacionesPorPais(): Ubicacion[] {
    //Devuelve las ubicaciones que coinciden con el país actualmente seleccionado.
    return this.ubicaciones.filter(u => {
      //Convierte a minúsculas para comparación insensible a mayúsculas.
      const pais = this.paisSeleccionado.toLowerCase();
      //Verifica si el nombre del país o ciudad contiene el texto del filtro.
      return u.pais.toLowerCase().includes(pais) ||
             u.ciudad.toLowerCase().includes(pais);
    });
  }
}
