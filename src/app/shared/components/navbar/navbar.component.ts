import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  //@Output() permite emitir eventos hacia el componente padre.
  //EventEmitter<void> significa que emite un evento sin parámetros.
  @Output() toggleSidebar = new EventEmitter<void>();

  onToggleSidebar(): void {
    //Emite el evento toggleSidebar hacia el componente padre.
    //El padre lo captura con (toggleSidebar)="..." en el template.
    this.toggleSidebar.emit();
  }
}
