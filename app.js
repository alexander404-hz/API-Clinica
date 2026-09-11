const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { PrismaClient } = require("./generated/prisma");
const prisma = new PrismaClient();

const LoggerMiddleware = require("./middlewares/logger");
const errorHandler = require("./middlewares/errorHandler");
const authenticateToken = require("./middlewares/auth");
const validateUser = require("./validators/userValidator");

const PORT = process.env.PORT || 3005;

const fs = require("fs");
const path = require("path");
const usersFilePath = path.join(__dirname, "users.json");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(LoggerMiddleware);

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

    const errors = validateUser(users, newUser, ["id", "name", "email"]);

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

function updateUser(req, res, requiredFields, replaceUser) {
  const userId = Number(req.params.id);
  const updatedUser = req.body;

  if (
    !/^\d+$/.test(req.params.id) ||
    !Number.isInteger(userId) ||
    userId <= 0
  ) {
    return res
      .status(400)
      .json({ error: "El id debe ser un numero entero positivo" });
  }

  if (!updatedUser || Object.keys(updatedUser).length === 0) {
    return res.status(400).json({ error: "No se recibieron datos" });
  }

  if (Object.prototype.hasOwnProperty.call(updatedUser, "id")) {
    return res.status(400).json({ error: "El id no se puede modificar" });
  }

  fs.readFile(usersFilePath, "utf-8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error con conexion de datos." });
    }

    let users;
    try {
      users = JSON.parse(data);
    } catch (parseError) {
      return res
        .status(500)
        .json({ error: "El archivo de usuarios no es valido" });
    }

    const userIndex = users.findIndex((user) => user.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({ error: "El usuario no existe" });
    }

    const currentUser = users[userIndex];
    const errors = validateUser(users, updatedUser, requiredFields, userId);

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const updatedUserData = replaceUser
      ? { id: userId, ...updatedUser }
      : { ...currentUser, ...updatedUser };

    users = users.map((user) =>
      user.id === userId ? { ...user, ...updatedUserData } : user,
    );

    users[userIndex] = updatedUserData;

    const usersJSON = JSON.stringify(users, null, 2);

    fs.writeFile(usersFilePath, usersJSON, (err) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Error al actualizar el usuario" });
      }

      res.status(200).json({
        message: "Usuario actualizado correctamente",
        updatedUser: updatedUserData,
      });
    });
  });
}

app.put("/users/:id", (req, res) => {
  updateUser(
    req,
    res,
    ["name", "username", "email", "role", "is_active", "created_at"],
    true,
  );
});

app.patch("/users/:id", (req, res) => {
  updateUser(req, res, [], false);
});

// DELETE

app.delete("/users/:id", (req, res) => {
  const userId = Number(req.params.id);

  if (
    !/^\d+$/.test(req.params.id) ||
    !Number.isInteger(userId) ||
    userId <= 0
  ) {
    return res
      .status(400)
      .json({ error: "El id debe ser un numero entero positivo" });
  }

  fs.readFile(usersFilePath, (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error con conexion de datos." });
    }

    let users;
    try {
      users = JSON.parse(data);
    } catch (parseError) {
      return res
        .status(500)
        .json({ error: "El archivo de usuarios no es valido" });
    }

    const userIndex = users.findIndex((user) => user.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({ error: "El usuario no existe" });
    }

    users = users.filter((user) => user.id !== userId);

    const usersJSON = JSON.stringify(users, null, 2);

    fs.writeFile(usersFilePath, usersJSON, (err) => {
      if (err) {
        return res.status(500).json({ error: "Error al eliminar el usuario" });
      }

      res.status(204).send();
    });
  });
});

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

app.get("/error", (req, res, next) => {
  next(new Error("Error Intencional"));
});

app.get("/db-users", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Error al comunicarse con la DB." });
  }
});

// Protected

app.get("/protected-route", authenticateToken, (req, res) => {
  res.send("Esta es una ruta protegida");
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "USER",
    },
  });

  res.status(201).json({ message: "User Registered Successfully" });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "4h" },
  );

  res.json({ token });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log("Mi app esta funcionando en el puerto: ", PORT);
});
