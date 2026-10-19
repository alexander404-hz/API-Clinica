module.exports = Object.freeze({
  // Solo letras (con tildes y ñ); permite varias palabras separadas por espacio, apóstrofo o guion
  NAME_PATTERN: /^[\p{L}\p{M}]+(?:[ '’-][\p{L}\p{M}]+)*$/u,

  // Correo básico: algo@dominio.ext, sin espacios, sin segundo @ ni puntos vacíos en el dominio
  EMAIL_PATTERN: /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/,

  // Como NAME_PATTERN, pero también permite números (ej. apodos como "Anita2")
  PREFERRED_NAME_PATTERN: /^[\p{L}0-9]+(?:[ '-][\p{L}0-9]+)*$/u,

  // Número de seguro: "INS-" seguido de exactamente 4 dígitos (ej. INS-0001)
  INSURANCE_NUMBER_PATTERN: /^INS-\d{4}$/,

  // Hora en formato 24 h: HH:mm, de 00:00 a 23:59
  TIME_PATTERN: /^([01]\d|2[0-3]):[0-5]\d$/,

  // Fecha YYYY-MM-DD (el día real del calendario se valida aparte)
  DATE_PATTERN: /^(\d{4})-(\d{2})-(\d{2})$/,

  // Fecha YYYY-MM-DD, o fecha y hora ISO 8601 con zona (Z o ±HH:mm); segundos y milisegundos opcionales
  ISO_DATE_PATTERN:
    /^(\d{4})-(\d{2})-(\d{2})(?:T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d))?$/,

  // Fecha y hora ISO 8601 obligatorias: YYYY-MM-DDTHH:mm:ss, milisegundos opcionales y zona obligatoria (Z o ±HH:mm)
  ISO_DATE_TIME_PATTERN:
    /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:\.\d{1,3})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/,
});
