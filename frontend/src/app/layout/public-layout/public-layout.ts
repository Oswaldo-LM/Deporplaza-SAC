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

import { AuthService } from '../../core/services/auth';


@Component({
  selector: 'app-public-layout',

  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet
  ],

  templateUrl: './public-layout.html',

  styleUrl: './public-layout.scss'
})
export class PublicLayout {

  readonly authService = inject(AuthService);

  private readonly router = inject(Router);

  readonly scrolled = signal(false);

  readonly menuAbierto = signal(false);

  readonly anio = new Date().getFullYear();


  constructor() {
    // Cierra el menú móvil al navegar
    this.router.events
      .pipe(
        filter(e => e instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => this.menuAbierto.set(false));
  }


  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 8);
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


  cerrarSesionCliente(): void {

    this.authService.logout();

    this.menuAbierto.set(false);

    this.router.navigate(['/']);
  }

}