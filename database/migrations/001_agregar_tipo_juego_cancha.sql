-- ==========================================================
-- MIGRACIÓN 001
-- Agregar tipo de juego a las canchas existentes
--
-- Reglas:
-- FUTBOL  -> GRASS
-- VOLEY   -> LOSA
-- BASKET  -> LOSA
--
-- IMPORTANTE:
-- Esta migración está pensada para ejecutarse UNA SOLA VEZ
-- en bases de datos creadas antes de agregar tipo_juego.
-- ==========================================================


-- ==========================================================
-- 1. AGREGAR COLUMNA TEMPORALMENTE NULL
-- ==========================================================

ALTER TABLE tb_cancha
ADD COLUMN tipo_juego
ENUM(
    'FUTBOL',
    'VOLEY',
    'BASKET'
)
NULL
AFTER nombre;


-- ==========================================================
-- 2. MIGRAR CANCHAS GRASS EXISTENTES
-- ==========================================================
-- Todas las canchas GRASS existentes serán FUTBOL.

UPDATE tb_cancha
SET tipo_juego = 'FUTBOL'
WHERE id_cancha > 0
  AND superficie = 'GRASS';


-- ==========================================================
-- 3. MIGRAR CANCHAS LOSA EXISTENTES
-- ==========================================================
-- No podemos saber automáticamente si una LOSA antigua
-- era para VOLEY o BASKET.
--
-- Por compatibilidad, las existentes se asignan a VOLEY.
-- Luego el administrador puede cambiarla a BASKET desde
-- el módulo de Canchas si corresponde.
-- ==========================================================

UPDATE tb_cancha
SET tipo_juego = 'VOLEY'
WHERE id_cancha > 0
  AND superficie = 'LOSA';


-- ==========================================================
-- 4. VALIDAR QUE NO QUEDEN CANCHAS SIN TIPO DE JUEGO
-- ==========================================================

SELECT
    id_cancha,
    nombre,
    superficie,
    tipo_juego
FROM tb_cancha
WHERE tipo_juego IS NULL;


-- ==========================================================
-- 5. HACER EL CAMPO OBLIGATORIO
-- ==========================================================

ALTER TABLE tb_cancha
MODIFY COLUMN tipo_juego
ENUM(
    'FUTBOL',
    'VOLEY',
    'BASKET'
)
NOT NULL;


-- ==========================================================
-- 6. VERIFICACIÓN FINAL
-- ==========================================================

SELECT
    id_cancha,
    sede_id,
    nombre,
    tipo_juego,
    superficie,
    precio_hora,
    estado
FROM tb_cancha
ORDER BY id_cancha;