export interface Empresa {
  id: number;
  nombre: string;
  ciudad: string;
  pais: string;
  provincia: string;
  codigoPostal: string;
  direccion: string;
  latitud: number;
  longitud: number;
  empleadosTotal: number;
  fechaFundacion: string;
  descripcion: string;
}

export interface EmpresaDTO extends Empresa {}