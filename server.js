require("dotenv").config();
const { v4: uuidv4 } = require('uuid');
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const path = require("path");

const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(express.static("public"));
app.use(express.json());

// HTML
app.get("dbcloudcrud-production.up.railway.app/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

//Conexion a la base de datos CockroachDB
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  application_name: "web_app",
});

// ruta select todas las cuentas
app.get("dbcloudcrud-production.up.railway.app/accounts", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM accounts;");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener las cuentas" });
  }
});

//ruta crear nuevas cuenta
app.post("dbcloudcrud-production.up.railway.app/accounts", async (req, res) => {
    const { nombre, balance, telefono } = req.body;
    const id = uuidv4(); //Generar un nuevo ID aleatorio

    try {
        await pool.query("INSERT INTO accounts (id, nombre, balance, telefono) VALUES ($1, $2, $3, $4);", [id, nombre, balance, telefono]);
        res.status(201).json({ message: "Cuenta creada.", id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al crear la cuenta." });
    }
});

//ruta actualizar account
app.put("dbcloudcrud-production.up.railway.app/accounts/:id", async (req, res) => {
    const { id } = req.params;
    const { nombre, balance, telefono } = req.body;

    try {
        await pool.query("UPDATE accounts SET nombre = $1, balance = $2, telefono = $3 WHERE id = $4;", [nombre, balance, telefono, id]);
        res.status(200).json({ message: "Cuenta actualizada." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al actualizar la cuenta." });
    }
});

//ruta eliminar cuenta
app.delete("dbcloudcrud-production.up.railway.app/accounts/:id", async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query("DELETE FROM accounts WHERE id = $1;", [id]);
        res.status(200).json({ message: "Cuenta eliminada." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al eliminar la cuenta." });
    }
});

// Iniciar servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});