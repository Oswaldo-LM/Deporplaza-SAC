import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Carousel } from 'bootstrap';
import { Reveal } from '../../core/directives/reveal';

@Component({
  selector: 'app-home',
  imports: [RouterLink, Reveal],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements AfterViewInit, OnDestroy {
  @ViewChild('heroCarousel') heroCarouselRef!: ElementRef;

  private carousel?: Carousel;

  readonly whatsappNumero = '51922310832';
  readonly whatsappTexto = '+51 922 310 832';

  readonly whatsappUrl =
    `https://wa.me/${this.whatsappNumero}?text=` +
    encodeURIComponent('Hola DeporPlaza, quiero consultar por turnos fijos o torneos.');

  ngAfterViewInit(): void {
    this.carousel = new Carousel(this.heroCarouselRef.nativeElement, {
      interval: 4000,
      ride: 'carousel',
      pause: false
    });
  }

  ngOnDestroy(): void {
    this.carousel?.dispose();
  }
}