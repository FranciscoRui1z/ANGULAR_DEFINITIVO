import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EmpresaService } from '../core/services/empresa.service';
import { Empresa } from '../core/models/empresa.model';
import { EmpleadosService } from '../core/services/empleado.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  //Objeto empresa con los datos principales de la empresa.
  empresa: Empresa | null = null;
  //Total de empleados de la empresa.
  totalEmpleados = 0;
  loading = false;

  constructor(
    private empresaService: EmpresaService,
    private empleadosService: EmpleadosService
  ) {}

  ngOnInit(): void {
    //Se ejecuta cuando el componente se inicializa.
    //Carga los datos de la empresa y el total de empleados.
    this.cargarDatos();
  }

  cargarDatos(): void {
    //Carga los datos de la empresa y los empleados de forma paralela.
    this.loading = true;

    //Obtiene la empresa con ID 1 (principal) y la guarda en la propiedad.
    this.empresaService.obtenerEmpresa(1).subscribe({
      next: (empresa) => {
        this.empresa = empresa;
      }
    });

    //Obtiene todos los empleados y guarda la cantidad (length).
    this.empleadosService.obtenerEmpleados().subscribe({
      next: (empleados) => {
        //length devuelve la cantidad de empleados en el array.
        this.totalEmpleados = empleados.length;
        this.loading = false;
      }
    });
  }
}
