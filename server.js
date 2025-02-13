const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config(); // Cargar variables de entorno desde .env

const app = express();
app.use(cors());
app.use(express.json());

// Crear un pool de conexiones para mejorar la escalabilidad
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Marianny19',
  database: process.env.DB_NAME || 'manejadortareas',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Verificar conexión a la base de datos
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Error en la conexión a MySQL:', err.message);
  } else {
    console.log('✅ Conectado a MySQL');
    connection.release();
  }
});

// Obtener todos los empleados
app.get('/empleado', (req, res) => {
  pool.query('SELECT * FROM empleado', (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error en la consulta', details: err.message });
    }
    res.json(results);
  });
});

// Obtener un empleado por ID
app.get('/empleado/:id', (req, res) => {
  const { id } = req.params;
  pool.query('SELECT * FROM empleado WHERE id_empleado = ?', [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error en la consulta', details: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }
    res.json(results[0]);
  });
});

// Crear un nuevo empleado
app.post('/empleado', (req, res) => {
  const { nombre, apellido, correo_electronico } = req.body;
  if (!nombre || !apellido || !correo_electronico) {
    return res.status(400).json({ error: 'Los campos nombre, apellido y correo_electronico son obligatorios' });
  }
  
  pool.query('INSERT INTO empleado SET ?', req.body, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Error al insertar empleado', details: err.message });
    }
    res.status(201).json({ id: result.insertId, ...req.body });
  });
});

// Actualizar un empleado por ID
app.put('/empleado/:id', (req, res) => {
  const { id } = req.params;
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'Debe proporcionar al menos un campo para actualizar' });
  }
  
  pool.query('UPDATE empleado SET ? WHERE id_empleado = ?', [req.body, id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Error al actualizar empleado', details: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }
    res.json({ message: 'Empleado actualizado correctamente' });
  });
});

// Eliminar un empleado por ID
app.delete('/empleado/:id', (req, res) => {
  const { id } = req.params;
  pool.query('DELETE FROM empleado WHERE id_empleado = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Error al eliminar empleado', details: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }
    res.json({ message: 'Empleado eliminado correctamente' });
  });
});

// Configuración del puerto
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
