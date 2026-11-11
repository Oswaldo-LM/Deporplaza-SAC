import {

  EstadoCancha,

  SuperficieCancha,

  TipoJuegoCancha

} from './enums';


export interface CanchaRequest {

  idSede: number;

  nombre: string;

  tipoJuego: TipoJuegoCancha;

  superficie: SuperficieCancha;

  precioHora: number;

  estado: EstadoCancha;

}


export interface CanchaResponse {

  idCancha: number;

  idSede: number;

  nombreSede: string;

  nombre: string;

  tipoJuego: TipoJuegoCancha;

  superficie: SuperficieCancha;

  precioHora: number;

  estado: EstadoCancha;

}