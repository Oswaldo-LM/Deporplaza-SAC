package com.deporplaza.reservas.service;

import com.deporplaza.reservas.dto.CanchaRequestDTO;
import com.deporplaza.reservas.dto.CanchaResponseDTO;

import com.deporplaza.reservas.entity.Cancha;
import com.deporplaza.reservas.entity.Sede;

import com.deporplaza.reservas.enums.SuperficieCancha;
import com.deporplaza.reservas.enums.TipoJuegoCancha;

import com.deporplaza.reservas.exception.BusinessRuleException;
import com.deporplaza.reservas.exception.ResourceConflictException;
import com.deporplaza.reservas.exception.ResourceNotFoundException;

import com.deporplaza.reservas.repository.CanchaRepository;
import com.deporplaza.reservas.repository.SedeRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;


@Service
public class CanchaService {

    private final CanchaRepository
            canchaRepository;

    private final SedeRepository
            sedeRepository;


    public CanchaService(

            CanchaRepository canchaRepository,

            SedeRepository sedeRepository

    ) {

        this.canchaRepository =
                canchaRepository;

        this.sedeRepository =
                sedeRepository;
    }


    // =========================================================
    // LISTAR TODAS
    // =========================================================

    @Transactional(
            readOnly = true
    )
    public List<CanchaResponseDTO>
    listarTodas() {

        return canchaRepository
                .findAll()
                .stream()
                .map(
                        this::convertirADTO
                )
                .toList();
    }


    // =========================================================
    // OBTENER POR ID
    // =========================================================

    @Transactional(
            readOnly = true
    )
    public CanchaResponseDTO obtenerPorId(
            Integer id
    ) {

        Cancha cancha =
                buscarEntidadPorId(
                        id
                );


        return convertirADTO(
                cancha
        );
    }


    // =========================================================
    // LISTAR POR SEDE
    // =========================================================

    @Transactional(
            readOnly = true
    )
    public List<CanchaResponseDTO>
    listarPorSede(
            Integer idSede
    ) {

        buscarSedePorId(
                idSede
        );


        return canchaRepository
                .findBySedeIdSede(
                        idSede
                )
                .stream()
                .map(
                        this::convertirADTO
                )
                .toList();
    }


    // =========================================================
    // CREAR
    // =========================================================

    @Transactional
    public CanchaResponseDTO crear(
            CanchaRequestDTO request
    ) {

        Sede sede =
                buscarSedePorId(
                        request.idSede()
                );


        if (
                canchaRepository
                        .existsBySedeIdSedeAndNombreIgnoreCase(

                                request.idSede(),

                                request.nombre()
                        )
        ) {

            throw new ResourceConflictException(
                    "Ya existe una cancha con ese nombre en la sede"
            );
        }


        /*
         * Validamos la relación:
         *
         * FUTBOL -> GRASS
         * VOLEY  -> LOSA
         * BASKET -> LOSA
         */
        validarTipoJuegoSuperficie(

                request.tipoJuego(),

                request.superficie()
        );


        Cancha cancha =
                new Cancha();


        cancha.setSede(
                sede
        );


        cancha.setNombre(
                request.nombre()
                        .trim()
        );


        cancha.setTipoJuego(
                request.tipoJuego()
        );


        cancha.setSuperficie(
                request.superficie()
        );


        cancha.setPrecioHora(
                request.precioHora()
        );


        cancha.setEstado(
                request.estado()
        );


        Cancha canchaGuardada =
                canchaRepository.save(
                        cancha
                );


        return convertirADTO(
                canchaGuardada
        );
    }


    // =========================================================
    // ACTUALIZAR
    // =========================================================

    @Transactional
    public CanchaResponseDTO actualizar(

            Integer id,

            CanchaRequestDTO request

    ) {

        Cancha cancha =
                buscarEntidadPorId(
                        id
                );


        Sede sede =
                buscarSedePorId(
                        request.idSede()
                );


        /*
         * Validamos nuevamente porque alguien
         * podría intentar modificar una cancha
         * mediante Postman o directamente la API.
         */
        validarTipoJuegoSuperficie(

                request.tipoJuego(),

                request.superficie()
        );


        cancha.setSede(
                sede
        );


        cancha.setNombre(
                request.nombre()
                        .trim()
        );


        cancha.setTipoJuego(
                request.tipoJuego()
        );


        cancha.setSuperficie(
                request.superficie()
        );


        cancha.setPrecioHora(
                request.precioHora()
        );


        cancha.setEstado(
                request.estado()
        );


        Cancha canchaActualizada =
                canchaRepository.save(
                        cancha
                );


        return convertirADTO(
                canchaActualizada
        );
    }


    // =========================================================
    // VALIDAR TIPO DE JUEGO / SUPERFICIE
    // =========================================================

    private void validarTipoJuegoSuperficie(

            TipoJuegoCancha tipoJuego,

            SuperficieCancha superficie

    ) {

        /*
         * FUTBOL solamente puede jugarse
         * en cancha GRASS.
         */
        if (
                tipoJuego
                        == TipoJuegoCancha.FUTBOL

                &&

                superficie
                        != SuperficieCancha.GRASS
        ) {

            throw new BusinessRuleException(
                    "Las canchas de FUTBOL deben tener superficie GRASS"
            );
        }


        /*
         * VOLEY solamente puede jugarse
         * en cancha LOSA.
         */
        if (
                tipoJuego
                        == TipoJuegoCancha.VOLEY

                &&

                superficie
                        != SuperficieCancha.LOSA
        ) {

            throw new BusinessRuleException(
                    "Las canchas de VOLEY deben tener superficie LOSA"
            );
        }


        /*
         * BASKET solamente puede jugarse
         * en cancha LOSA.
         */
        if (
                tipoJuego
                        == TipoJuegoCancha.BASKET

                &&

                superficie
                        != SuperficieCancha.LOSA
        ) {

            throw new BusinessRuleException(
                    "Las canchas de BASKET deben tener superficie LOSA"
            );
        }
    }


    // =========================================================
    // BUSCAR CANCHA
    // =========================================================

    private Cancha buscarEntidadPorId(
            Integer id
    ) {

        return canchaRepository
                .findById(
                        id
                )
                .orElseThrow(() ->

                        new ResourceNotFoundException(

                                "No existe una cancha con id "
                                        + id
                        )
                );
    }


    // =========================================================
    // BUSCAR SEDE
    // =========================================================

    private Sede buscarSedePorId(
            Integer idSede
    ) {

        return sedeRepository
                .findById(
                        idSede
                )
                .orElseThrow(() ->

                        new ResourceNotFoundException(

                                "No existe una sede con id "
                                        + idSede
                        )
                );
    }


    // =========================================================
    // DTO
    // =========================================================

    private CanchaResponseDTO convertirADTO(
            Cancha cancha
    ) {

        return new CanchaResponseDTO(

                cancha.getIdCancha(),

                cancha.getSede()
                        .getIdSede(),

                cancha.getSede()
                        .getNombre(),

                cancha.getNombre(),

                cancha.getTipoJuego(),

                cancha.getSuperficie(),

                cancha.getPrecioHora(),

                cancha.getEstado()
        );
    }

}