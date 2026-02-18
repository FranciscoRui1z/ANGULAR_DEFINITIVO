export interface Empleado {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  departamento: string;
  puesto: string;
  salario: number;
  fechaContratacion: string;
  estado: 'activo' | 'inactivo' | 'licencia';
  empresaId: number;
}

export interface EmpleadoDTO extends Empleado {}

export interface EmpleadoFiltros {
  departamento?: string;
  estado?: string;
  empresaId?: number;
}