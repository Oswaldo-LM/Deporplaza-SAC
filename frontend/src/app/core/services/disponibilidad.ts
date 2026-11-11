import {
  Injectable,
  inject
} from '@angular/core';

import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';

import {
  environment
} from '../../../environments/environment';

import {
  DisponibilidadResponse
} from '../models/disponibilidad.model';

import {
  TipoJuegoCancha
} from '../models/enums';


@Injectable({
  providedIn: 'root'
})
export class DisponibilidadService {

  private readonly http =
    inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiUrl}/disponibilidad`;


  consultar(
    sedeId: number,
    fecha: string,
    tipoJuego: TipoJuegoCancha
  ): Observable<DisponibilidadResponse> {

    const params =
      new HttpParams()
        .set(
          'sedeId',
          sedeId.toString()
        )
        .set(
          'fecha',
          fecha
        )
        .set(
          'tipoJuego',
          tipoJuego
        );


    return this.http.get<DisponibilidadResponse>(
      this.apiUrl,
      {
        params
      }
    );
  }

}