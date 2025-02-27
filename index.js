require("dotenv").config();
const { Pool } = require("pg");
const { v4: uuidv4 } = require("uuid");

var accountValues = Array(3);

async function retryTxn(n, max, client, operation) {
  const backoffInterval = 100;
  const maxTries = 5;
  let tries = 0;

  while (tries < maxTries) {
    await client.query("BEGIN;");
    tries++;

    try {
      const result = await operation(client);
      await client.query("COMMIT;");
      return result;
    } catch (err) {
      await client.query("ROLLBACK;");

      if (err.code !== "40001" || tries === maxTries) {
        throw err;
      } else {
        console.log("Transacción fallida. Reintentando...");
        console.log(err.message);
        await new Promise((r) => setTimeout(r, tries * backoffInterval));
      }
    }
  }
}

async function initTable(client) {
  const insertStatement = `
    INSERT INTO accounts (id, nombre, balance, telefono) VALUES 
    ($1, 'Juan Perez', 1000, '1234567890'), 
    ($2, 'Maria Gomez', 250, '0987654321'), 
    ($3, 'Carlos Ruiz', 0, '1122334455');
  `;
  
  accountValues = [uuidv4(), uuidv4(), uuidv4()]; //Generar nuevos UUIDs
  await client.query(insertStatement, accountValues);
  console.log("Cuentas inicializadas.");

  const result = await client.query("SELECT id, nombre, balance, telefono FROM accounts;");
  console.table(result.rows);
}

async function deleteAccounts(client) {
  await client.query("DELETE FROM accounts WHERE id = $1;", [accountValues[2]]);
  console.log("Cuenta eliminada.");

  const result = await client.query("SELECT id, nombre, balance, telefono FROM accounts;");
  console.table(result.rows);
}

(async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    application_name: "docs_simplecrud_node-postgres",
  });

  const client = await pool.connect();

  try {
    console.log("Inicializando cuentas...");
    await retryTxn(0, 15, client, initTable);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    client.release();
    process.exit();
  }
})();