package com.deporplaza.reservas.service;



import com.deporplaza.reservas.dto.BloqueDisponibilidadDTO;

import com.deporplaza.reservas.dto.CanchaDisponibilidadDTO;

import com.deporplaza.reservas.dto.DisponibilidadResponseDTO;



import com.deporplaza.reservas.entity.Cancha;

import com.deporplaza.reservas.entity.HorarioCancha;

import com.deporplaza.reservas.entity.ReservaCancha;

import com.deporplaza.reservas.entity.Sede;



import com.deporplaza.reservas.enums.*;



import com.deporplaza.reservas.exception.BusinessRuleException;

import com.deporplaza.reservas.exception.ResourceConflictException;

import com.deporplaza.reservas.exception.ResourceNotFoundException;



import com.deporplaza.reservas.repository.CanchaRepository;

import com.deporplaza.reservas.repository.HorarioCanchaRepository;

import com.deporplaza.reservas.repository.ReservaCanchaRepository;

import com.deporplaza.reservas.repository.SedeRepository;



import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;



import java.time.LocalDate;

import java.time.LocalDateTime;

import java.time.LocalTime;



import java.util.*;

import java.util.function.Function;

import java.util.stream.Collectors;





@Service

public class DisponibilidadService {





    // =========================================================

    // RANGO GENERAL PARA RESERVAS

    // =========================================================



    /*

     * El complejo permite reservas

     * desde las 06:00.

     */

    private static final LocalTime HORA_MINIMA_RESERVA =

            LocalTime.of(6, 0);





    /*

     * La reserva debe terminar como máximo

     * a las 22:00.

     *

     * Por eso, para una reserva mínima

     * de una hora, el último inicio

     * posible será 21:00.

     */

    private static final LocalTime HORA_MAXIMA_CIERRE =

            LocalTime.of(22, 0);





    private final SedeRepository sedeRepository;



    private final CanchaRepository canchaRepository;



    private final HorarioCanchaRepository horarioRepository;



    private final ReservaCanchaRepository reservaCanchaRepository;





    public DisponibilidadService(



            SedeRepository sedeRepository,



            CanchaRepository canchaRepository,



            HorarioCanchaRepository horarioRepository,



            ReservaCanchaRepository reservaCanchaRepository



    ) {



        this.sedeRepository =

                sedeRepository;



        this.canchaRepository =

                canchaRepository;



        this.horarioRepository =

                horarioRepository;



        this.reservaCanchaRepository =

                reservaCanchaRepository;

    }





    // =========================================================

    // CONSULTAR DISPONIBILIDAD

    // =========================================================



    @Transactional(readOnly = true)

    public DisponibilidadResponseDTO consultar(



            Integer idSede,



            LocalDate fecha,



            TipoJuegoCancha tipoJuego



    ) {



        LocalDateTime ahora =

                LocalDateTime.now();





        // =====================================================

        // VALIDAR FECHA

        // =====================================================



        validarFecha(



                fecha,



                ahora.toLocalDate()

        );





        // =====================================================

        // VALIDAR SEDE

        // =====================================================



        Sede sede =

                sedeRepository

                        .findById(idSede)

                        .orElseThrow(() ->



                                new ResourceNotFoundException(



                                        "No existe una sede con id "

                                                + idSede

                                )

                        );





        if (

                sede.getEstado()

                        != EstadoSede.ACTIVA

        ) {



            throw new ResourceConflictException(

                    "La sede no está disponible"

            );

        }





        // =====================================================

        // CANCHAS ACTIVAS

        // =====================================================



        List<Cancha> canchas =

                canchaRepository

                        .findBySedeIdSedeAndEstado(



                                idSede,



                                EstadoCancha.ACTIVA

                        )

                        .stream()

                        /*
                         * Solo devolvemos canchas activas
                         * correspondientes al tipo de juego
                         * solicitado por el cliente.
                         */
                        .filter(
                                cancha ->
                                        tipoJuego == null
                                        ||
                                        cancha.getTipoJuego()
                                                == tipoJuego
                        )

                        .sorted(



                                Comparator.comparing(

                                        Cancha::getNombre

                                )

                        )

                        .toList();





        if (

                canchas.isEmpty()

        ) {



            return new DisponibilidadResponseDTO(



                    sede.getIdSede(),



                    sede.getNombre(),



                    fecha,



                    convertirDiaSemana(

                            fecha

                    ),



                    List.of()

            );

        }





        List<Integer> idsCancha =

                canchas.stream()

                        .map(

                                Cancha::getIdCancha

                        )

                        .toList();





        DiaSemana diaSemana =

                convertirDiaSemana(

                        fecha

                );





        // =====================================================

        // HORARIOS ACTIVOS

        // =====================================================



        Map<Integer, HorarioCancha> horarios =

                horarioRepository

                        .findByCanchaIdCanchaInAndDiaSemanaAndEstado(



                                idsCancha,



                                diaSemana,



                                EstadoHorario.ACTIVO

                        )

                        .stream()

                        .collect(



                                Collectors.toMap(



                                        horario ->

                                                horario

                                                        .getCancha()

                                                        .getIdCancha(),



                                        Function.identity()

                                )

                        );





        // =====================================================

        // RESERVAS QUE BLOQUEAN

        // =====================================================



        List<EstadoReserva> estadosQueBloquean =

                List.of(



                        EstadoReserva.PENDIENTE_PAGO,



                        EstadoReserva.PENDIENTE_CONFIRMACION,



                        EstadoReserva.CONFIRMADA

                );





        List<ReservaCancha> reservas =

                reservaCanchaRepository

                        .buscarBloqueosPorFecha(



                                idsCancha,



                                fecha,



                                estadosQueBloquean

                        );





        Map<Integer, List<ReservaCancha>>

                reservasPorCancha =



                reservas.stream()

                        .collect(



                                Collectors.groupingBy(



                                        rc ->

                                                rc

                                                        .getCancha()

                                                        .getIdCancha()

                                )

                        );





        // =====================================================

        // CREAR RESPUESTA

        // =====================================================



        List<CanchaDisponibilidadDTO>

                disponibilidadCanchas =



                canchas.stream()

                        .map(cancha ->



                                construirDisponibilidadCancha(



                                        cancha,



                                        horarios.get(

                                                cancha.getIdCancha()

                                        ),



                                        reservasPorCancha

                                                .getOrDefault(



                                                        cancha.getIdCancha(),



                                                        List.of()

                                                ),



                                        fecha,



                                        ahora

                                )

                        )

                        .toList();





        return new DisponibilidadResponseDTO(



                sede.getIdSede(),



                sede.getNombre(),



                fecha,



                diaSemana,



                disponibilidadCanchas

        );

    }





    // =========================================================

    // DISPONIBILIDAD DE UNA CANCHA

    // =========================================================



    private CanchaDisponibilidadDTO

    construirDisponibilidadCancha(



            Cancha cancha,



            HorarioCancha horario,



            List<ReservaCancha> reservas,



            LocalDate fecha,



            LocalDateTime ahora



    ) {



        /*

         * La cancha existe y está ACTIVA,

         * pero ese día no tiene horario activo.

         */

        if (

                horario == null

        ) {



            return new CanchaDisponibilidadDTO(



                    cancha.getIdCancha(),



                    cancha.getNombre(),



                    cancha.getSuperficie(),



                    cancha.getPrecioHora(),



                    false,



                    null,



                    null,



                    List.of()

            );

        }





        List<BloqueDisponibilidadDTO> bloques =

                generarBloques(



                        horario,



                        reservas,



                        fecha,



                        ahora

                );





        return new CanchaDisponibilidadDTO(



                cancha.getIdCancha(),



                cancha.getNombre(),



                cancha.getSuperficie(),



                cancha.getPrecioHora(),



                true,



                horario.getHoraApertura(),



                horario.getHoraCierre(),



                bloques

        );

    }





    // =========================================================

    // GENERAR HORAS DE INICIO

    // =========================================================



    private List<BloqueDisponibilidadDTO>

    generarBloques(



            HorarioCancha horario,



            List<ReservaCancha> reservas,



            LocalDate fecha,



            LocalDateTime ahora



    ) {



        List<BloqueDisponibilidadDTO> bloques =

                new ArrayList<>();





        /*

         * =====================================================

         * APERTURA EFECTIVA

         * =====================================================

         *

         * Nunca mostramos una hora anterior

         * a las 06:00.

         */

        LocalTime aperturaEfectiva =



                horario

                        .getHoraApertura()

                        .isBefore(

                                HORA_MINIMA_RESERVA

                        )



                        ? HORA_MINIMA_RESERVA



                        : horario.getHoraApertura();





        /*

         * =====================================================

         * CIERRE EFECTIVO

         * =====================================================

         *

         * Aunque el horario configurado sea

         * posterior a las 22:00, ninguna reserva

         * podrá terminar después de las 22:00.

         */

        LocalTime cierreEfectivo =



                horario

                        .getHoraCierre()

                        .isAfter(

                                HORA_MAXIMA_CIERRE

                        )



                        ? HORA_MAXIMA_CIERRE



                        : horario.getHoraCierre();





        /*

         * Ajustamos el inicio a una hora completa.

         *

         * Ejemplos:

         *

         * 06:00 -> 06:00

         * 06:30 -> 07:00

         * 08:15 -> 09:00

         */

        LocalTime inicio =

                obtenerSiguienteHoraCompleta(

                        aperturaEfectiva

                );





        /*

         * La duración mínima es 1 hora.

         *

         * Si el cierre es 22:00:

         *

         * 20:00 -> válido

         * 21:00 -> válido

         * 22:00 -> NO válido como inicio

         *

         * Ahora avanzamos únicamente

         * en intervalos de 1 hora.

         */

        while (



                !inicio

                        .plusHours(1)

                        .isAfter(

                                cierreEfectivo

                        )

        ) {



            BloqueDisponibilidadDTO bloque =

                    evaluarBloque(



                            inicio,



                            cierreEfectivo,



                            reservas,



                            fecha,



                            ahora

                    );





            bloques.add(

                    bloque

            );





            /*

             * Antes era:

             *

             * inicio.plusMinutes(30)

             *

             * Ahora solamente:

             *

             * 06:00

             * 07:00

             * 08:00

             * ...

             */

            inicio =

                    inicio.plusHours(1);

        }





        return bloques;

    }





    // =========================================================

    // OBTENER SIGUIENTE HORA COMPLETA

    // =========================================================



    private LocalTime obtenerSiguienteHoraCompleta(

            LocalTime hora

    ) {



        LocalTime horaBase =

                hora

                        .withMinute(0)

                        .withSecond(0)

                        .withNano(0);





        /*

         * Si ya es una hora completa:

         *

         * 08:00 -> 08:00

         */

        if (

                hora.equals(

                        horaBase

                )

        ) {



            return horaBase;

        }





        /*

         * Si tiene minutos:

         *

         * 08:15 -> 09:00

         * 08:30 -> 09:00

         * 08:45 -> 09:00

         */

        return horaBase

                .plusHours(1);

    }





    // =========================================================

    // EVALUAR UN INICIO

    // =========================================================



    private BloqueDisponibilidadDTO

    evaluarBloque(



            LocalTime horaInicio,



            LocalTime horaCierre,



            List<ReservaCancha> reservas,



            LocalDate fecha,



            LocalDateTime ahora



    ) {



        /*

         * Si estamos consultando hoy,

         * no permitimos horarios que ya pasaron.

         */

        if (



                fecha.equals(

                        ahora.toLocalDate()

                )



                &&



                !horaInicio.isAfter(

                        ahora.toLocalTime()

                )

        ) {



            return new BloqueDisponibilidadDTO(



                    horaInicio,



                    false,



                    null,



                    null

            );

        }





        int maxExtras =

                -1;





        /*

         * Probamos todas las duraciones:

         *

         * extras 0 -> 1 hora

         * extras 1 -> 1 h 30 min

         * extras 2 -> 2 horas

         * extras 3 -> 2 h 30 min

         * extras 4 -> 3 horas

         */

        for (

                int extras = 0;

                extras <= 4;

                extras++

        ) {



            int duracionMinutos =

                    60

                            + (

                            extras * 30

                    );





            LocalTime horaFin =

                    horaInicio

                            .plusMinutes(

                                    duracionMinutos

                            );





            /*

             * Evitamos:

             *

             * - cruzar medianoche

             * - exceder la hora de cierre

             */

            if (



                    !horaFin.isAfter(

                            horaInicio

                    )



                    ||



                    horaFin.isAfter(

                            horaCierre

                    )

            ) {



                break;

            }





            /*

             * Si alguna reserva existente

             * ocupa parte del intervalo,

             * no podemos seguir aumentando

             * la duración.

             */

            if (

                    haySolapamiento(



                            horaInicio,



                            horaFin,



                            reservas

                    )

            ) {



                break;

            }





            maxExtras =

                    extras;

        }





        /*

         * Ni siquiera fue posible reservar

         * la hora mínima.

         */

        if (

                maxExtras < 0

        ) {



            return new BloqueDisponibilidadDTO(



                    horaInicio,



                    false,



                    null,



                    null

            );

        }





        int duracionMaxima =

                60

                        + (

                        maxExtras * 30

                );





        return new BloqueDisponibilidadDTO(



                horaInicio,



                true,



                maxExtras,



                duracionMaxima

        );

    }





    // =========================================================

    // SOLAPAMIENTO

    // =========================================================



    private boolean haySolapamiento(



            LocalTime nuevoInicio,



            LocalTime nuevoFin,



            List<ReservaCancha> reservas



    ) {



        return reservas

                .stream()

                .anyMatch(



                        reserva ->



                                nuevoInicio.isBefore(

                                        reserva.getHoraFin()

                                )



                                        &&



                                nuevoFin.isAfter(

                                        reserva.getHoraInicio()

                                )

                );

    }





    // =========================================================

    // VALIDAR FECHA

    // =========================================================



    private void validarFecha(



            LocalDate fecha,



            LocalDate hoy



    ) {



        if (

                fecha == null

        ) {



            throw new BusinessRuleException(

                    "La fecha es obligatoria"

            );

        }





        if (

                fecha.isBefore(

                        hoy

                )

        ) {



            throw new BusinessRuleException(

                    "No se puede consultar disponibilidad para una fecha pasada"

            );

        }





        if (

                fecha.isAfter(

                        hoy.plusMonths(1)

                )

        ) {



            throw new BusinessRuleException(

                    "Solo se puede consultar hasta un mes de anticipación"

            );

        }

    }





    // =========================================================

    // CONVERTIR DÍA

    // =========================================================



    private DiaSemana convertirDiaSemana(

            LocalDate fecha

    ) {



        return switch (

                fecha.getDayOfWeek()

        ) {



            case MONDAY ->

                    DiaSemana.LUNES;



            case TUESDAY ->

                    DiaSemana.MARTES;



            case WEDNESDAY ->

                    DiaSemana.MIERCOLES;



            case THURSDAY ->

                    DiaSemana.JUEVES;



            case FRIDAY ->

                    DiaSemana.VIERNES;



            case SATURDAY ->

                    DiaSemana.SABADO;



            case SUNDAY ->

                    DiaSemana.DOMINGO;

        };

    }



}