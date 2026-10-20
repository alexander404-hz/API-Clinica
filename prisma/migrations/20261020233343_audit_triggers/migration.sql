-- This is an empty migration.-- This is an empty migration.-- Función genérica de auditoría
CREATE OR REPLACE FUNCTION audit_row_change() RETURNS trigger AS $$
DECLARE
  actor    text  := NULLIF(current_setting('app.user_id', true), '');
  actor_ip text  := NULLIF(current_setting('app.ip', true), '');
  old_row  jsonb;
  new_row  jsonb;
  diff     jsonb;
BEGIN
  -- Nunca se guarda el hash de la contraseña
  IF TG_OP IN ('UPDATE', 'DELETE') THEN old_row := to_jsonb(OLD) - 'password'; END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') THEN new_row := to_jsonb(NEW) - 'password'; END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Ignora el ruido: login y fecha de actualización automática
    old_row := old_row - 'lastLoginAt' - 'updatedAt';
    new_row := new_row - 'lastLoginAt' - 'updatedAt';

    IF old_row = new_row THEN
      RETURN NULL; -- no cambió nada relevante
    END IF;

    -- Solo los campos que cambiaron: { campo: { from, to } }
    SELECT jsonb_object_agg(n.key, jsonb_build_object('from', old_row -> n.key, 'to', n.value))
      INTO diff
      FROM jsonb_each(new_row) AS n
      WHERE old_row -> n.key IS DISTINCT FROM n.value;
  ELSIF TG_OP = 'INSERT' THEN
    diff := new_row;
  ELSE
    diff := old_row;
  END IF;

  INSERT INTO "AuditLog" ("actorId", "action", "entity", "entityId", "changes", "ip")
  VALUES (
    actor,
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(new_row, old_row) ->> 'id',
    diff,
    actor_ip
  );

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Un trigger por tabla auditada (ajusta los nombres a tus tablas)
CREATE TRIGGER audit_user
AFTER INSERT OR UPDATE OR DELETE ON "User"
FOR EACH ROW EXECUTE FUNCTION audit_row_change();

CREATE TRIGGER audit_patient
AFTER INSERT OR UPDATE OR DELETE ON "Patient"
FOR EACH ROW EXECUTE FUNCTION audit_row_change();

CREATE TRIGGER audit_appointment
AFTER INSERT OR UPDATE OR DELETE ON "Appointment"
FOR EACH ROW EXECUTE FUNCTION audit_row_change();

-- Repite el CREATE TRIGGER para "Admin", "TimeBlock", etc.

-- El log es append-only: nadie puede editar ni borrar filas
CREATE OR REPLACE FUNCTION log_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION '% es append-only', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_no_modify
BEFORE UPDATE OR DELETE ON "AuditLog"
FOR EACH ROW EXECUTE FUNCTION log_immutable();

CREATE TRIGGER access_log_no_modify
BEFORE UPDATE OR DELETE ON "AccessLog"
FOR EACH ROW EXECUTE FUNCTION log_immutable();
