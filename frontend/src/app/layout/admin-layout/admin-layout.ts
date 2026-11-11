import {
  Component,
  HostListener,
  inject,
  signal
} from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

import { filter } from 'rxjs';

import {
  AuthService
} from '../../core/services/auth';


@Component({
  selector: 'app-admin-layout',

  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet
  ],

  templateUrl: './admin-layout.html',

  styleUrl: './admin-layout.scss'
})
export class AdminLayout {

  private readonly authService =
    inject(AuthService);

  private readonly router =
    inject(Router);


  usuario =
    this.authService.obtenerUsuario();

  readonly menuAbierto = signal(false);


  constructor() {
    // Cierra el menú móvil al navegar
    this.router.events
      .pipe(
        filter(e => e instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => this.menuAbierto.set(false));
  }


  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth >= 992) {
      this.menuAbierto.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.menuAbierto.set(false);
  }


  alternarMenu(): void {
    this.menuAbierto.update(v => !v);
  }

  cerrarMenu(): void {
    this.menuAbierto.set(false);
  }


  cerrarSesion(): void {

    this.authService.logout();

    this.router.navigate([
      '/admin/login'
    ]);

  }

}