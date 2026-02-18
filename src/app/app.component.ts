import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  //Título de la aplicación.
  title = 'ANGULAR_DEFINITIVO';
  //Bandera que indica si el sidebar está abierto o cerrado.
  sidebarOpen = true;
  //Bandera que indica si el dispositivo es móvil (pantalla < 768px).
  isMobile = false;

  ngOnInit(): void {
    //Se ejecuta cuando el componente se inicializa.
    //Verifica si el dispositivo es móvil al cargar.
    this.checkIfMobile();
    //Agrega un listener al evento resize para detectar cuando se redimensiona la ventana.
    //Lambda () => this.checkIfMobile() mantiene el contexto 'this' correcto.
    window.addEventListener('resize', () => this.checkIfMobile());
  }

  checkIfMobile(): void {
    //Verifica si el ancho de la ventana es menor a 768px (típicamente móvil).
    //window.innerWidth devuelve el ancho en píxeles del viewport.
    this.isMobile = window.innerWidth < 768;
    //Si es móvil, cierra el sidebar automáticamente para ahorrar espacio.
    if (this.isMobile) {
      this.sidebarOpen = false;
    }
  }

  toggleSidebar(): void {
    //Alterna el estado del sidebar (abierto/cerrado).
    //! es el operador NOT de JavaScript que invierte el booleano.
    this.sidebarOpen = !this.sidebarOpen;
  }
}
