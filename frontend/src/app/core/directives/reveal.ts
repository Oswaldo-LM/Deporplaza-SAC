import {
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  inject,
  input,
  numberAttribute
} from '@angular/core';

@Directive({
  selector: '[dpReveal]',
  host: { class: 'dp-reveal' }
})
export class Reveal implements OnInit, OnDestroy {

  /** Retraso en ms (ej: [dpReveal]="120") */
  readonly delay = input(0, {
    alias: 'dpReveal',
    transform: numberAttribute
  });

  private readonly el: HTMLElement =
    inject(ElementRef).nativeElement;

  private observer?: IntersectionObserver;

  ngOnInit(): void {

    if (typeof IntersectionObserver === 'undefined') {
      this.el.classList.add('is-visible');
      return;
    }

    this.el.style.transitionDelay = `${this.delay()}ms`;

    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some(e => e.isIntersecting)) {
          this.el.classList.add('is-visible');
          this.observer?.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    this.observer.observe(this.el);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}