export interface Ubicacion {
  id: number;
  nombre: string;
  latitud: number;
  longitud: number;
  pais: string;
  ciudad: string;
  tipo: 'oficina' | 'almacen' | 'centro-distribucion';
  activa: boolean;
}

export interface CoordenadaPais {
  nombre: string;
  latitud: number;
  longitud: number;
  zoom: number;
}

export const PAISES_COORDENADAS: { [key: string]: CoordenadaPais } = {
  'Canada': {
    nombre: 'Canadá',
    latitud: 56.1304,
    longitud: -106.3468,
    zoom: 4
  },
  'Toronto': {
    nombre: 'Toronto, Canadá',
    latitud: 43.6629,
    longitud: -79.3957,
    zoom: 13
  },
  'Vancouver': {
    nombre: 'Vancouver, Canadá',
    latitud: 49.2827,
    longitud: -123.1207,
    zoom: 13
  },
  'Mexico': {
    nombre: 'México',
    latitud: 23.6345,
    longitud: -102.5528,
    zoom: 4
  },
  'Colombia': {
    nombre: 'Colombia',
    latitud: 4.5709,
    longitud: -74.2973,
    zoom: 4
  },
  'USA': {
    nombre: 'Estados Unidos',
    latitud: 37.0902,
    longitud: -95.7129,
    zoom: 4
  },
  'España': {
  nombre: 'España',
  latitud: 40.4637,
  longitud: -3.7492,
  zoom: 5
},
'Portugal': {
  nombre: 'Portugal',
  latitud: 39.3999,
  longitud: -8.2245,
  zoom: 6
},
'Italia': {
  nombre: 'Italia',
  latitud: 41.8719,
  longitud: 12.5674,
  zoom: 5
}
};
