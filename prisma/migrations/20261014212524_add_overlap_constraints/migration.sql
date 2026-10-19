-- Citas: no pueden solaparse (las canceladas liberan el bloque)
ALTER TABLE "Appointment"
ADD CONSTRAINT appointment_valid_range CHECK ("endsAt" > "startsAt");

ALTER TABLE "Appointment"
ADD CONSTRAINT appointment_no_overlap
EXCLUDE USING gist (
  tstzrange("startsAt", "endsAt") WITH &&
) WHERE (status <> 'CANCELLED');

-- Bloques: no pueden solaparse
ALTER TABLE "TimeBlock"
ADD CONSTRAINT time_block_valid_range CHECK ("endTime" > "startTime");

ALTER TABLE "TimeBlock"
ADD CONSTRAINT time_block_no_overlap
EXCLUDE USING gist (
  tsrange(
    ('1970-01-01'::date + "startTime"),
    ('1970-01-01'::date + "endTime")
  ) WITH &&
);