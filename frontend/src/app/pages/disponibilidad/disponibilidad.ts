import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { HttpErrorResponse } from '@angular/common/http';

import { Router } from '@angular/router';

import {
  BloqueDisponibilidad,
  CanchaDisponibilidad,
  DisponibilidadResponse
} from '../../core/models/disponibilidad.model';

import { SedeResponse } from '../../core/models/sede.model';

import { TipoJuegoCancha } from '../../core/models/enums';

import { SedeService } from '../../core/services/sede';

import { DisponibilidadService } from '../../core/services/disponibilidad';


interface DiaTab {
  iso: string;
  diaSemana: string;
  dia: string;
  mes: string;
  esHoy: boolean;
}


interface Seleccion {
  cancha: CanchaDisponibilidad;
  bloque: BloqueDisponibilidad;
}


export type EstadoBloque =
  'disponible'
  | 'seleccionado'
  | 'reservado'
  | 'pasado';


@Component({

  selector: 'app-disponibilidad',

  imports: [
    CommonModule,
    ReactiveFormsModule
  ],

  templateUrl: './disponibilidad.html',

  styleUrl: './disponibilidad.scss'

})
export class Disponibilidad implements OnInit {

  private readonly fb = inject(FormBuilder);

  private readonly sedeService = inject(SedeService);

  private readonly disponibilidadService = inject(DisponibilidadService);

  private readonly router = inject(Router);

  private readonly cdr = inject(ChangeDetectorRef);


  sedes: SedeResponse[] = [];

  resultado: DisponibilidadResponse | null = null;

  horas: string[] = [];

  diasSemana: DiaTab[] = [];

  seleccion: Seleccion | null = null;

  cargandoSedes = false;

  consultando = false;

  errorMensaje = '';

  ultimaActualizacion: Date | null = null;

  sedeDropdownAbierto = false;

  /** Cancha visible en la vista móvil */
  canchaActivaId: number | null = null;

  readonly esqueleto = [1, 2, 3, 4, 5, 6];

  readonly tiposJuego: TipoJuegoCancha[] = [
    'FUTBOL',
    'VOLEY',
    'BASKET'
  ];

  readonly fechaMin = this.formatearFecha(new Date());

  readonly fechaMax = this.calcularFechaMaxima();


  form = this.fb.nonNullable.group({

    sedeId: [
      0,
      [
        Validators.required,
        Validators.min(1)
      ]
    ],

    tipoJuego: this.fb.nonNullable.control<TipoJuegoCancha>(
      'FUTBOL',
      [Validators.required]
    ),

    fecha: [
      this.fechaMin,
      [Validators.required]
    ]

  });


  // =========================================================
  // INICIO
  // =========================================================

  ngOnInit(): void {

    this.diasSemana = this.generarDiasSemana();

    this.cargarSedes();

  }


  // =========================================================
  // CARGAR SEDES
  // =========================================================

  cargarSedes(): void {

    this.cargandoSedes = true;

    this.errorMensaje = '';

    this.sedeService
      .listarActivas()
      .subscribe({

        next: (sedes: SedeResponse[]) => {

          this.sedes = sedes;

          this.cargandoSedes = false;

          // Autoselecciona la primera sede (borrar este bloque si no se desea)
          if (
            sedes.length > 0
            && this.form.controls.sedeId.value === 0
          ) {
            this.seleccionarSede(sedes[0].idSede);
          }

          this.cdr.markForCheck();

        },

        error: (error: HttpErrorResponse) => {

          this.cargandoSedes = false;

          this.errorMensaje =
            error.error?.message
            ?? 'No se pudo cargar la lista de sedes.';

          this.cdr.markForCheck();

        }

      });

  }


  // =========================================================
  // SEDE
  // =========================================================

  toggleSedeDropdown(): void {
    this.sedeDropdownAbierto = !this.sedeDropdownAbierto;
  }


  seleccionarSede(idSede: number): void {

    this.form.controls.sedeId.setValue(idSede);

    this.sedeDropdownAbierto = false;

    this.resultado = null;

    this.seleccion = null;

    this.consultar();

  }


  obtenerNombreSedeSeleccionada(): string {

    const idSede = this.form.controls.sedeId.value;

    if (idSede === 0) {
      return 'Selecciona una sede';
    }

    const sede = this.sedes.find(item => item.idSede === idSede);

    return sede ? sede.nombre : 'Selecciona una sede';

  }


  // =========================================================
  // TIPO DE JUEGO
  // =========================================================

  seleccionarTipoJuego(tipoJuego: TipoJuegoCancha): void {

    this.form.controls.tipoJuego.setValue(tipoJuego);

    this.resultado = null;

    this.seleccion = null;

    if (this.form.controls.sedeId.valid) {
      this.consultar();
    }

  }


  tipoJuegoTexto(tipoJuego: TipoJuegoCancha): string {

    switch (tipoJuego) {

      case 'FUTBOL':
        return 'Fútbol';

      case 'VOLEY':
        return 'Vóley';

      case 'BASKET':
        return 'Básquet';

      default:
        return tipoJuego;

    }

  }


  // =========================================================
  // FECHAS
  // =========================================================

  seleccionarFecha(iso: string): void {

    this.form.controls.fecha.setValue(iso);

    this.resultado = null;

    this.seleccion = null;

    if (this.form.controls.sedeId.valid) {
      this.consultar();
    }

  }


  onFechaManualCambiada(event: Event): void {

    const input = event.currentTarget;

    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    const fecha = input.value;

    if (fecha) {
      this.seleccionarFecha(fecha);
    }

  }


  get fechaMinSemana(): string {
    return this.diasSemana[0]?.iso ?? this.fechaMin;
  }


  get fechaMaxSemana(): string {
    return this.diasSemana[this.diasSemana.length - 1]?.iso
      ?? this.fechaMax;
  }


  /** "lunes, 9 de noviembre" a partir de "2026-11-09" */
  fechaLarga(iso: string): string {

    const [y, m, d] = iso.split('-').map(Number);

    if (!y || !m || !d) {
      return iso;
    }

    return new Intl.DateTimeFormat('es-PE', {
      day: 'numeric',
      month: 'long'
    }).format(new Date(y, m - 1, d));

  }


  // =========================================================
  // CONSULTAR DISPONIBILIDAD
  // =========================================================

  consultar(): void {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.consultando = true;

    this.errorMensaje = '';

    this.resultado = null;

    this.horas = [];

    this.seleccion = null;

    const datos = this.form.getRawValue();

    this.disponibilidadService
      .consultar(
        datos.sedeId,
        datos.fecha,
        datos.tipoJuego
      )
      .subscribe({

        next: (resultado: DisponibilidadResponse) => {

          this.resultado = resultado;

          this.horas = this.obtenerHoras(resultado);

          this.canchaActivaId =
            resultado.canchas[0]?.idCancha ?? null;

          this.consultando = false;

          this.ultimaActualizacion = new Date();

          this.cdr.markForCheck();

        },

        error: (error: HttpErrorResponse) => {

          this.consultando = false;

          this.errorMensaje =
            error.error?.message
            ?? 'No se pudo consultar la disponibilidad.';

          this.cdr.markForCheck();

        }

      });

  }


  // =========================================================
  // CANCHA ACTIVA (MÓVIL)
  // =========================================================

  seleccionarCanchaActiva(idCancha: number): void {
    this.canchaActivaId = idCancha;
  }


  get canchaActiva(): CanchaDisponibilidad | null {

    if (!this.resultado) {
      return null;
    }

    return this.resultado.canchas.find(
      c => c.idCancha === this.canchaActivaId
    ) ?? this.resultado.canchas[0] ?? null;

  }


  contarDisponibles(cancha: CanchaDisponibilidad): number {
    return cancha.bloques.filter(b => b.disponible).length;
  }


  // =========================================================
  // BLOQUES
  // =========================================================

  obtenerBloque(
    cancha: CanchaDisponibilidad,
    hora: string
  ): BloqueDisponibilidad | null {

    return cancha.bloques.find(
      bloque => bloque.horaInicio === hora
    ) ?? null;

  }


  obtenerHoras(resultado: DisponibilidadResponse): string[] {

    const horas = resultado.canchas.flatMap(
      cancha => cancha.bloques.map(bloque => bloque.horaInicio)
    );

    return [...new Set(horas)].sort();

  }


  /** True si la fecha elegida es hoy y la hora ya comenzó (solo visual) */
  esPasado(hora: string): boolean {

    const ahora = new Date();

    if (this.form.controls.fecha.value !== this.formatearFecha(ahora)) {
      return false;
    }

    const actual =
      String(ahora.getHours()).padStart(2, '0')
      + ':'
      + String(ahora.getMinutes()).padStart(2, '0');

    return this.formatearHora(hora) < actual;

  }


  estadoBloque(
    cancha: CanchaDisponibilidad,
    bloque: BloqueDisponibilidad
  ): EstadoBloque {

    if (bloque.disponible) {
      return this.esSeleccionado(cancha, bloque)
        ? 'seleccionado'
        : 'disponible';
    }

    return this.esPasado(bloque.horaInicio)
      ? 'pasado'
      : 'reservado';

  }


  textoEstado(estado: EstadoBloque): string {

    switch (estado) {
      case 'seleccionado':
        return 'Seleccionado';
      case 'disponible':
        return 'Disponible';
      case 'pasado':
        return 'Pasado';
      default:
        return 'Reservado';
    }

  }


  // =========================================================
  // FORMATO
  // =========================================================

  formatearHora(hora: string): string {
    return hora.substring(0, 5);
  }


  formatearDuracion(minutos: number | null): string {

    if (minutos === null) {
      return '';
    }

    const horas = Math.floor(minutos / 60);

    const minutosRestantes = minutos % 60;

    if (minutosRestantes === 0) {
      return `${horas} h`;
    }

    return `${horas} h ${minutosRestantes} min`;

  }


  // =========================================================
  // SELECCIONAR HORARIO
  // =========================================================

  seleccionarHorario(
    cancha: CanchaDisponibilidad,
    bloque: BloqueDisponibilidad
  ): void {

    if (
      !bloque.disponible
      || bloque.maxExtrasDisponibles === null
    ) {
      return;
    }

    this.seleccion = { cancha, bloque };

    this.cdr.markForCheck();

  }


  esSeleccionado(
    cancha: CanchaDisponibilidad,
    bloque: BloqueDisponibilidad
  ): boolean {

    if (!this.seleccion) {
      return false;
    }

    return (
      this.seleccion.cancha.idCancha === cancha.idCancha
      && this.seleccion.bloque.horaInicio === bloque.horaInicio
    );

  }


  cambiarSeleccion(): void {
    this.seleccion = null;
  }


  // =========================================================
  // TOTAL
  // =========================================================

  obtenerTotalSeleccion(): number {

    if (!this.seleccion) {
      return 0;
    }

    return this.seleccion.cancha.precioHora;

  }


  // =========================================================
  // CONTINUAR A RESERVA
  // =========================================================

  continuarConReserva(): void {

    if (!this.seleccion) {
      return;
    }

    const cancha = this.seleccion.cancha;

    const bloque = this.seleccion.bloque;

    const fecha = this.form.controls.fecha.value;

    this.router.navigate(
      ['/reserva'],
      {
        queryParams: {
          idCancha: cancha.idCancha,
          fecha: fecha,
          horaInicio: bloque.horaInicio,
          maxExtras: bloque.maxExtrasDisponibles
        }
      }
    );

  }


  // =========================================================
  // GENERAR 7 DÍAS
  // =========================================================

  private generarDiasSemana(): DiaTab[] {

    const dias: DiaTab[] = [];

    const hoy = new Date();

    const formatoDia = new Intl.DateTimeFormat('es-PE', { weekday: 'short' });

    const formatoMes = new Intl.DateTimeFormat('es-PE', { month: 'short' });

    for (let i = 0; i < 7; i++) {

      const fecha = new Date(hoy);

      fecha.setDate(hoy.getDate() + i);

      dias.push({

        iso: this.formatearFecha(fecha),

        diaSemana: formatoDia
          .format(fecha)
          .replace('.', '')
          .toUpperCase(),

        dia: String(fecha.getDate()),

        mes: formatoMes
          .format(fecha)
          .replace('.', ''),

        esHoy: i === 0

      });

    }

    return dias;

  }


  // =========================================================
  // FORMATEAR FECHA LOCAL
  // =========================================================

  private formatearFecha(fecha: Date): string {

    const year = fecha.getFullYear();

    const month = String(fecha.getMonth() + 1).padStart(2, '0');

    const day = String(fecha.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;

  }


  // =========================================================
  // FECHA MÁXIMA
  // =========================================================

  private calcularFechaMaxima(): string {

    const hoy = new Date();

    const fechaMaxima = new Date(
      hoy.getFullYear(),
      hoy.getMonth() + 1,
      hoy.getDate()
    );

    return this.formatearFecha(fechaMaxima);

  }

}