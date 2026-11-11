import {
  EstadoPago,
  EstadoReserva,
  MetodoPago,
  TipoJuegoCancha
} from './enums';


export interface ReporteReserva {

  idReserva: number;

  fechaRegistro: string;

  fechaTurno: string;

  horaInicio: string;

  horaFin: string;

  cliente: string;

  tipoDocumento: string;

  numDocumento: string;

  sede: string;

  cancha: string;

  tipoJuego: TipoJuegoCancha;

  superficie: string;

  origen: string;

  estadoReserva: EstadoReserva;

  metodoPago: MetodoPago | null;

  estadoPago: EstadoPago | null;

  total: number;

}


export interface ReporteReservaFiltros {

  desde?: string;

  hasta?: string;

  idSede?: number;

  estado?: EstadoReserva;

}