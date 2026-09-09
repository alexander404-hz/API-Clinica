const { log } = require("console");
const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");
const { json } = require("stream/consumers");

const PORT = process.env.PORT || 3005;
const usersFilePath = path.join(__dirname, "users.json");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send(`<h1>Curso Express</h1>
    <p>Esto es un aplicacion node.js con express.js</p>
    <p>Corre en el puerto: ${PORT}</p>`);
});

// READ

app.get("/users", (req, res) => {
  fs.readFile(usersFilePath, "utf-8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error con conexion de datos." });
    }

    const users = JSON.parse(data);
    res.json(users);
  });
});

app.get("/users/:id", (req, res) => {
  const userId = req.params.id;
  res.send(`Mostrar informacion del usuario con ID: ${userId}`);
});

//CREATE

app.post("/users", (req, res) => {
  const newUser = req.body;

  fs.readFile(usersFilePath, "utf-8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error con conexion de datos." });
    }

    if (!newUser || Object.keys(newUser).length === 0) {
      return res.status(400).json({ error: "No se recibieron datos" });
    }

    let users;
    try {
      users = JSON.parse(data);
    } catch (parseError) {
      return res
        .status(500)
        .json({ error: "El archivo de usuarios no es valido" });
    }

    const errors = [];
    const requiredFields = ["id", "name", "email"];

    for (const field of requiredFields) {
      if (newUser[field] === undefined || newUser[field] === null) {
        errors.push(`El campo ${field} es obligatorio`);
      }
    }

    if (
      newUser.id !== undefined &&
      newUser.id !== null &&
      (!Number.isInteger(newUser.id) || newUser.id <= 0)
    ) {
      errors.push("El id debe ser un numero entero positivo");
    } else if (
      newUser.id !== undefined &&
      newUser.id !== null &&
      users.some((user) => user.id === newUser.id)
    ) {
      errors.push("El id ya existe");
    }

    if (
      newUser.name !== undefined &&
      newUser.name !== null &&
      (typeof newUser.name !== "string" || newUser.name.trim().length < 2)
    ) {
      errors.push("El name debe ser un texto de al menos 2 caracteres");
    }

    if (
      newUser.username !== undefined &&
      (typeof newUser.username !== "string" ||
        !/^[a-zA-Z0-9_]{3,20}$/.test(newUser.username))
    ) {
      errors.push(
        "El username debe tener entre 3 y 20 caracteres alfanumericos o guion bajo",
      );
    } else if (
      newUser.username !== undefined &&
      users.some((user) => user.username === newUser.username)
    ) {
      errors.push("El username ya existe");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (
      newUser.email !== undefined &&
      newUser.email !== null &&
      (typeof newUser.email !== "string" || !emailRegex.test(newUser.email))
    ) {
      errors.push("El email no tiene un formato valido");
    } else if (
      newUser.email !== undefined &&
      newUser.email !== null &&
      users.some(
        (user) => user.email.toLowerCase() === newUser.email.toLowerCase(),
      )
    ) {
      errors.push("El email ya existe");
    }

    if (
      newUser.role !== undefined &&
      !["admin", "editor", "user", "viewer"].includes(newUser.role)
    ) {
      errors.push("El role debe ser admin, editor, user o viewer");
    }

    if (
      newUser.is_active !== undefined &&
      typeof newUser.is_active !== "boolean"
    ) {
      errors.push("El is_active debe ser true o false");
    }

    if (
      newUser.created_at !== undefined &&
      Number.isNaN(Date.parse(newUser.created_at))
    ) {
      errors.push("El created_at debe ser una fecha valida");
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    users.push(newUser);

    const usersJSON = JSON.stringify(users, null, 2);

    fs.writeFile(usersFilePath, usersJSON, (err) => {
      if (err) {
        return res.status(500).json({ error: "Error al guardar el usuario" });
      }

      res
        .status(201)
        .json({ message: "Usuario creado correctamente", newUser });
    });
  });
});

// UPDATE

app.put("/users/:id", (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const updatedUSer = req.body;

  fs.readFile(usersFilePath, "utf-8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error con conexion de datos." });
    }

    if (!updatedUSer || Object.keys(updatedUSer).length === 0) {
      return res.status(400).json({ error: "No se recibieron datos" });
    }

    let users;
    try {
      users = JSON.parse(data);
    } catch (parseError) {
      return res
        .status(500)
        .json({ error: "El archivo de usuarios no es valido" });
    }

    console.log(users);

    users = users.map((user) =>
      user.id === userId ? { ...user, ...updatedUSer } : user,
    );

    console.log(users);

    const usersJSON = JSON.stringify(users, null, 2);

    fs.writeFile(usersFilePath, usersJSON, (err) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Error al actualizar el usuario" });
      }

      res
        .status(201)
        .json({ message: "Usuario actualizado correctamente", updatedUSer });
    });
  });
});

// ELIMNATE

// OTROS...

app.get("/search", (req, res) => {
  const terms = req.query.termino || "No especificado";
  const category = req.query.categoria || "Todas";

  res.send(`
    <h2>Resultados de busqueda</h2>
    <p>Termino: ${terms}</p>
    <p>Categoria: ${category}</p>`);
});

app.post("/form", (req, res) => {
  const name = req.body.nombre || "Anonimo";
  const email = req.body.email || "No proporcionado";

  res.json({ message: "Datos recibidos", data: { name, email } });
});

app.post("/api/data", (req, res) => {
  const data = req.body;

  if (!data || Object.keys(data).length === 0) {
    return res.status(400).json({ error: "No se recibieron datos" });
  }

  res.status(201).json({ message: "Datos JSON recibidos", data });
});

app.listen(PORT, () => {
  console.log("Mi app esta funcionando en el puerto: ", PORT);
});
