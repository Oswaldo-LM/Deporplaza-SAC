import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  HttpErrorResponse
} from '@angular/common/http';

import {
  SedeResponse
} from '../../../core/models/sede.model';

import {
  BloqueDisponibilidad,
  CanchaDisponibilidad,
  DisponibilidadResponse
} from '../../../core/models/disponibilidad.model';

import {
  MetodoPago,
  TipoDocumento,
  TipoJuegoCancha
} from '../../../core/models/enums';

import {
  ReservaPresencialRequest,
  ReservaResponse
} from '../../../core/models/reserva.model';

import {
  SedeService
} from '../../../core/services/sede';

import {
  DisponibilidadService
} from '../../../core/services/disponibilidad';

import {
  ReservaService
} from '../../../core/services/reserva';


@Component({
  selector: 'app-reserva-presencial',

  imports: [
    ReactiveFormsModule
  ],

  templateUrl: './reserva-presencial.html',

  styleUrl: './reserva-presencial.scss'
})
export class ReservaPresencial
  implements OnInit {


  private readonly fb =
    inject(FormBuilder);


  private readonly sedeService =
    inject(SedeService);


  private readonly disponibilidadService =
    inject(DisponibilidadService);


  private readonly reservaService =
    inject(ReservaService);


  private readonly cdr =
    inject(ChangeDetectorRef);


  sedes:
    SedeResponse[] = [];


  disponibilidad:
    DisponibilidadResponse | null = null;


  canchaSeleccionada:
    CanchaDisponibilidad | null = null;


  bloqueSeleccionado:
    BloqueDisponibilidad | null = null;


  reservaCreada:
    ReservaResponse | null = null;


  cargandoSedes =
    false;


  consultando =
    false;


  guardando =
    false;


  errorMensaje =
    '';


  exitoMensaje =
    '';


  readonly tiposDocumento:
    TipoDocumento[] = [
      'DNI',
      'CE',
      'PASAPORTE'
    ];


  readonly metodosPago:
    MetodoPago[] = [
      'EFECTIVO',
      'TARJETA',
      'YAPE',
      'PLIN',
      'TRANSFERENCIA'
    ];


  readonly tiposJuego:
    TipoJuegoCancha[] = [
      'FUTBOL',
      'VOLEY',
      'BASKET'
    ];


  readonly fechaMin =
    this.formatearFecha(
      new Date()
    );


  readonly fechaMax =
    this.calcularFechaMaxima();


  // =========================================================
  // FORMULARIO DE BÚSQUEDA
  // =========================================================

  filtroForm =
    this.fb.nonNullable.group({

      sedeId: [
        0,
        [
          Validators.required,
          Validators.min(1)
        ]
      ],

      tipoJuego:
        this.fb.nonNullable.control<TipoJuegoCancha>(
          'FUTBOL',
          [
            Validators.required
          ]
        ),

      fecha: [
        this.fechaMin,
        [
          Validators.required
        ]
      ]

    });


  // =========================================================
  // FORMULARIO DE RESERVA
  // =========================================================

  reservaForm =
    this.fb.nonNullable.group({

      nombreCompleto: [
        '',
        [
          Validators.required,
          Validators.maxLength(150)
        ]
      ],

      tipoDocumento: [
        'DNI' as TipoDocumento,
        [
          Validators.required
        ]
      ],

      numDocumento: [
        '',
        [
          Validators.required,
          Validators.maxLength(20)
        ]
      ],

      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.maxLength(150)
        ]
      ],

      telefono: [
        '',
        [
          Validators.required,
          Validators.maxLength(20)
        ]
      ],

      cantidadExtras: [
        0,
        [
          Validators.required,
          Validators.min(0),
          Validators.max(4)
        ]
      ],

      metodoPago: [
        'EFECTIVO' as MetodoPago,
        [
          Validators.required
        ]
      ],

      numOperacion: [
        '',
        [
          Validators.maxLength(50)
        ]
      ]

    });


  // =========================================================
  // INICIO
  // =========================================================

  ngOnInit(): void {

    this.cargarSedes();
  }


  // =========================================================
  // CARGAR SEDES
  // =========================================================

  cargarSedes(): void {

    this.cargandoSedes =
      true;


    this.sedeService
      .listarActivas()
      .subscribe({

        next: (
          sedes: SedeResponse[]
        ) => {

          this.sedes =
            sedes;


          this.cargandoSedes =
            false;


          this.cdr
            .markForCheck();
        },


        error: () => {

          this.cargandoSedes =
            false;


          this.errorMensaje =
            'No se pudieron cargar las sedes.';


          this.cdr
            .markForCheck();
        }

      });
  }


  // =========================================================
  // CONSULTAR DISPONIBILIDAD
  // =========================================================

  consultarDisponibilidad(): void {

    if (
      this.filtroForm.invalid
    ) {

      this.filtroForm
        .markAllAsTouched();


      return;
    }


    this.consultando =
      true;


    this.errorMensaje =
      '';


    this.exitoMensaje =
      '';


    this.disponibilidad =
      null;


    this.canchaSeleccionada =
      null;


    this.bloqueSeleccionado =
      null;


    const datos =
      this.filtroForm
        .getRawValue();


    this.disponibilidadService
      .consultar(

        datos.sedeId,

        datos.fecha,

        datos.tipoJuego

      )
      .subscribe({

        next: (
          resultado: DisponibilidadResponse
        ) => {

          this.disponibilidad =
            resultado;


          this.consultando =
            false;


          this.cdr
            .markForCheck();
        },


        error: (
          error: HttpErrorResponse
        ) => {

          this.consultando =
            false;


          this.errorMensaje =
            error.error?.message
            ?? 'No se pudo consultar la disponibilidad.';


          this.cdr
            .markForCheck();
        }

      });
  }


  // =========================================================
  // TIPO DE JUEGO
  // =========================================================

  tipoJuegoTexto(
    tipoJuego: TipoJuegoCancha
  ): string {

    switch (
      tipoJuego
    ) {

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
  // SELECCIONAR HORARIO
  // =========================================================

  seleccionarBloque(

    cancha: CanchaDisponibilidad,

    bloque: BloqueDisponibilidad

  ): void {

    if (
      !bloque.disponible
      ||
      bloque.maxExtrasDisponibles === null
    ) {

      return;
    }


    this.canchaSeleccionada =
      cancha;


    this.bloqueSeleccionado =
      bloque;


    this.reservaForm.controls
      .cantidadExtras
      .setValue(
        0
      );


    this.errorMensaje =
      '';


    this.exitoMensaje =
      '';
  }


  quitarSeleccion(): void {

    this.canchaSeleccionada =
      null;


    this.bloqueSeleccionado =
      null;
  }


  // =========================================================
  // OPCIONES DE DURACIÓN
  // =========================================================

  obtenerOpcionesExtras():
    number[] {

    const maxExtras =
      this.bloqueSeleccionado
        ?.maxExtrasDisponibles
      ?? 0;


    return Array.from(

      {
        length:
          maxExtras + 1
      },

      (
        _,
        index
      ) =>
        index

    );
  }


  obtenerDuracionTexto(
    extras: number
  ): string {

    const minutos =
      60
      +
      extras * 30;


    const horas =
      Math.floor(
        minutos / 60
      );


    const minutosRestantes =
      minutos % 60;


    if (
      minutosRestantes === 0
    ) {

      return `${horas} h`;
    }


    return `${horas} h ${minutosRestantes} min`;
  }


  // =========================================================
  // TOTAL
  // =========================================================

  calcularTotal(): number {

    if (
      !this.canchaSeleccionada
    ) {

      return 0;
    }


    const extras =
      this.reservaForm.controls
        .cantidadExtras
        .value;


    return (

      this.canchaSeleccionada
        .precioHora

      +

      extras
      *
      (
        this.canchaSeleccionada
          .precioHora
        /
        2
      )

    );
  }


  // =========================================================
  // REGISTRAR RESERVA
  // =========================================================

  registrarReserva(): void {

    if (
      !this.canchaSeleccionada
      ||
      !this.bloqueSeleccionado
    ) {

      this.errorMensaje =
        'Selecciona una cancha y un horario.';


      return;
    }


    if (
      this.reservaForm.invalid
    ) {

      this.reservaForm
        .markAllAsTouched();


      return;
    }


    const filtro =
      this.filtroForm
        .getRawValue();


    const datos =
      this.reservaForm
        .getRawValue();


    const request:
      ReservaPresencialRequest = {

      nombreCompleto:
        datos.nombreCompleto
          .trim(),

      tipoDocumento:
        datos.tipoDocumento,

      numDocumento:
        datos.numDocumento
          .trim(),

      email:
        datos.email
          .trim(),

      telefono:
        datos.telefono
          .trim(),

      idCancha:
        this.canchaSeleccionada
          .idCancha,

      fechaTurno:
        filtro.fecha,

      horaInicio:
        this.bloqueSeleccionado
          .horaInicio,

      cantidadExtras:
        datos.cantidadExtras,

      metodoPago:
        datos.metodoPago,

      numOperacion:
        datos.numOperacion
          .trim()
          || null

    };


    this.guardando =
      true;


    this.errorMensaje =
      '';


    this.exitoMensaje =
      '';


    this.reservaService
      .crearPresencial(
        request
      )
      .subscribe({

        next: (
          reserva: ReservaResponse
        ) => {

          this.guardando =
            false;


          this.reservaCreada =
            reserva;


          this.exitoMensaje =
            `Reserva #${reserva.idReserva} registrada correctamente.`;


          this.cdr
            .markForCheck();
        },


        error: (
          error: HttpErrorResponse
        ) => {

          this.guardando =
            false;


          this.errorMensaje =
            error.error?.message
            ?? 'No se pudo registrar la reserva presencial.';


          this.cdr
            .markForCheck();
        }

      });
  }


  // =========================================================
  // NUEVA RESERVA
  // =========================================================

  nuevaReserva(): void {

    this.reservaCreada =
      null;


    this.canchaSeleccionada =
      null;


    this.bloqueSeleccionado =
      null;


    this.errorMensaje =
      '';


    this.exitoMensaje =
      '';


    this.reservaForm.reset({

      nombreCompleto:
        '',

      tipoDocumento:
        'DNI',

      numDocumento:
        '',

      email:
        '',

      telefono:
        '',

      cantidadExtras:
        0,

      metodoPago:
        'EFECTIVO',

      numOperacion:
        ''

    });


    this.consultarDisponibilidad();
  }


  // =========================================================
  // FORMATO DE HORA
  // =========================================================

  formatearHora(
    hora: string
  ): string {

    return hora.substring(
      0,
      5
    );
  }


  // =========================================================
  // FECHA LOCAL
  // =========================================================

  private formatearFecha(
    fecha: Date
  ): string {

    const year =
      fecha.getFullYear();


    const month =
      String(
        fecha.getMonth()
        + 1
      )
        .padStart(
          2,
          '0'
        );


    const day =
      String(
        fecha.getDate()
      )
        .padStart(
          2,
          '0'
        );


    return `${year}-${month}-${day}`;
  }


  // =========================================================
  // FECHA MÁXIMA
  // =========================================================

  private calcularFechaMaxima():
    string {

    const hoy =
      new Date();


    const fecha =
      new Date(

        hoy.getFullYear(),

        hoy.getMonth()
        + 1,

        1

      );


    const ultimoDia =
      new Date(

        fecha.getFullYear(),

        fecha.getMonth()
        + 1,

        0

      ).getDate();


    const dia =
      Math.min(

        hoy.getDate(),

        ultimoDia

      );


    fecha.setDate(
      dia
    );


    return this.formatearFecha(
      fecha
    );
  }

}