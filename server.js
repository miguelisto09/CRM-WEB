const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config(); 

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Marianny19',
  database: process.env.DB_NAME || 'manejadortareas',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Error en la conexión a MySQL:', err.message);
  } else {
    console.log('✅ Conectado a MySQL');
    connection.release();
  }
});

app.get('/empleado', (req, res) => {
  pool.query('SELECT * FROM empleado', (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error en la consulta', details: err.message });
    }
    res.json(results);
  });
});

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

app.get('/tarea', (req, res) => {
    const sql = `
        SELECT 
            t.id_tarea, 
            t.nombre_tarea, 
            t.descripcion, 
            e.nombre AS nombre_encargado,  
            t.prioridad, 
            t.estado, 
            t.fecha_limite
        FROM tarea t
        LEFT JOIN empleado e ON t.persona_asignada = e.id_empleado;
    `;

    pool.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error en la consulta', details: err.message });
        }
        res.json(results);
    });
});

app.get('/tarea/:id', (req, res) => {
  const { id } = req.params;
  pool.query('SELECT * FROM tarea WHERE id_tarea = ?', [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error en la consulta', details: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    res.json(results[0]);
  });
});

app.put('/tarea/:id', (req, res) => {
  const { id } = req.params;
  if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
  }
  if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Debe proporcionar al menos un campo para actualizar' });
  }
  const query = 'UPDATE tarea SET ? WHERE id_tarea = ?';

  pool.query(query, [req.body, id], (err, result) => {
      if (err) {
          console.error("❌ Error al actualizar tarea:", err);
          return res.status(500).json({ error: 'Error al actualizar tarea', details: err.message });
      }
      if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Tarea no encontrada' });
      }
      res.json({ message: 'Tarea actualizada correctamente' });
  });
});
app.delete('/tarea/:id', (req, res) => {
  const { id } = req.params;
  pool.query('DELETE FROM tarea WHERE id_tarea = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Error al eliminar tarea', details: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    res.json({ message: 'Tarea eliminada correctamente' });
  });
});
app.post('/tarea', (req, res) => {
  const { Nombre_tarea, Prioridad, Persona_asignada } = req.body;
  if (!Nombre_tarea || !Prioridad || !Persona_asignada) {
    return res.status(400).json({ error: 'Los campos nombre, prioridad y persona asignada son obligatorios' });
  }
  
  pool.query('INSERT INTO tarea SET ?', req.body, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Error al insertar tarea', details: err.message });
    }
    res.status(201).json({ id: result.insertId, ...req.body });
  });
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
