import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

//Interfaz que define la estructura de un elemento del menú del sidebar.
interface MenuItem {
  icon: string;  //Emoji o icono que se muestra.
  label: string;  //Texto del elemento del menú.
  route: string;  //Ruta a la que navega al hacer clic.
  children?: MenuItem[];  //Submenús opcionales (para expandir/contraer).
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  //@Input() recibe un valor del componente padre.
  //isOpen indica si el sidebar está abierto o cerrado.
  @Input() isOpen = true;

  //Array con todos los elementos del menú de navegación.
  //Cada elemento tiene icono, etiqueta, ruta y submenús opcionales.
  menuItems: MenuItem[] = [
    {
      icon: '🏠',
      label: 'Inicio',
      route: '/'  //Ruta raíz
    },
    {
      icon: '👥',
      label: 'Empleados',
      route: '/empleados',
      //children permite que este menú se expanda/contraiga.
      children: [
        { icon: '📋', label: 'Listado', route: '/empleados' },
        { icon: '➕', label: 'Nuevo Empleado', route: '/empleados/nuevo' }
      ]
    },
    {
      icon: '🏢',
      label: 'Empresa',
      route: '/empresa'
    },
    {
      icon: '📊',
      label: 'Estadísticas',
      route: '/estadisticas'
    },
    {
      icon: '🗺️',
      label: 'Mapa',
      route: '/mapa'
    },
    {
      icon: '📄',
      label: 'Reportes',
      route: '/reportes'
    }
  ];

  //Set que guarda los labels de los menús expandidos.
  //Set garantiza que no haya duplicados.
  expandedItems: Set<string> = new Set();

  toggleExpand(label: string): void {
    //Alterna (activa/desactiva) la expansión de un menú.
    //Si el menú ya está expandido (en el Set), lo elimina (contrae).
    if (this.expandedItems.has(label)) {
      this.expandedItems.delete(label);
    } else {
      //Si no está expandido, lo agrega (expande).
      this.expandedItems.add(label);
    }
  }

  isExpanded(label: string): boolean {
    //Verifica si un menú específico está expandido.
    //has() devuelve true si el label está en el Set, false si no.
    return this.expandedItems.has(label);
  }
}
