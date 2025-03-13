const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config(); 

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({  host: process.env.DB_HOST || 'localhost',
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

const multer = require('multer');

// Configurar Multer para almacenar archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/submitTask', upload.single('file'), (req, res) => {
  const { taskId, employeeId, submissionText } = req.body;
  const file = req.file;

  if (!taskId || !employeeId) {
      return res.status(400).json({ error: 'El id de tarea y el id del empleado son obligatorios' });
  }

  const query = 'INSERT INTO envio_tarea (id_tarea, id_empleado, texto_envio, archivo, nombre_archivo, tipo_mime) VALUES (?, ?, ?, ?, ?, ?)';
  const values = [
      taskId,
      employeeId,
      submissionText || null,
      file ? file.buffer : null,
      file ? file.originalname : null,
      file ? file.mimetype : null
  ];

  pool.query(query, values, (err, result) => {
      if (err) {
          console.error('Error al guardar la tarea enviada:', err);
          return res.status(500).json({ error: 'Error al guardar la tarea' });
      }
      res.json({ message: 'Tarea enviada correctamente', id_envio: result.insertId });
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

app.get("/cumpleanos", (req, res) => {
  const sql = `
        SELECT id_empleado, nombre, apellido, fecha_nacimiento 
        FROM empleado 
        WHERE DATE_FORMAT(fecha_nacimiento, '%m-%d') >= DATE_FORMAT(NOW(), '%m-%d')
        ORDER BY DATE_FORMAT(fecha_nacimiento, '%m-%d') ASC
        LIMIT 5;
    `;

  pool.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Error en la consulta", details: err.message });
    }
    res.json(results);
  });
});
app.get("/tareas-pendientes", (req, res) => {
  const sql = `
        SELECT id_tarea, nombre_tarea, prioridad, fecha_limite 
        FROM tarea 
        WHERE estado = 'Pendiente'
        ORDER BY fecha_limite ASC;
    `;

  pool.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Error en la consulta", details: err.message });
    }
    res.json(results);
  });
});
app.get("/tareas-atrasadas", (req, res) => {
  const sql = `
        SELECT id_tarea, nombre_tarea, prioridad, fecha_limite 
        FROM tarea 
        WHERE estado = 'Atrasada'
        ORDER BY fecha_limite ASC;
    `;

  pool.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Error en la consulta", details: err.message });
    }
    res.json(results);
  });
});

app.get("/estadisticas-tareas", (req, res) => {
  const sql = `
      SELECT 
          SUM(CASE WHEN estado = 'Pendiente' THEN 1 ELSE 0 END) AS pendientes,
          SUM(CASE WHEN estado = 'Atrasada' THEN 1 ELSE 0 END) AS atrasadas,
          SUM(CASE WHEN estado = 'Realizada' THEN 1 ELSE 0 END) AS realizadas,
          COUNT(*) AS total
      FROM tarea;
  `;

  pool.query(sql, (err, results) => {
      if (err) {
          return res.status(500).json({ error: "Error en la consulta", details: err.message });
      }

      const { pendientes, atrasadas, realizadas, total } = results[0];

      const data = {
          pendientes: ((pendientes / total) * 100).toFixed(2),
          atrasadas: ((atrasadas / total) * 100).toFixed(2),
          realizadas: ((realizadas / total) * 100).toFixed(2)
      };

      res.json(data);
  });
});

function actualizarTareasAtrasadas() {
  const sql = `
        UPDATE tarea 
        SET estado = 'Atrasado' 
        WHERE estado = 'Pendiente' AND fecha_limite < CURDATE();
    `;

  pool.query(sql, (err, result) => {
    if (err) {
      console.error("❌ Error al actualizar tareas atrasadas:", err);
    } else if (result.affectedRows > 0) {
      console.log(`✅ ${result.affectedRows} tareas actualizadas a 'Atrasado'.`);
    }
  });
}
setInterval(actualizarTareasAtrasadas, 300000); 
// Registro de usuario
app.post('/usuario', async (req, res) => {
  let { nombre_usuario, contraseña, confirmar_contraseña, rol } = req.body;

  if (!nombre_usuario || !contraseña || !confirmar_contraseña) {
    return res.status(400).json({ error: 'Los campos nombre de usuario, contraseña y confirmar contraseña son obligatorios' });
  }

  if (contraseña !== confirmar_contraseña) {
    return res.status(400).json({ error: 'Las contraseñas no coinciden' });
  }

  rol = rol || 'Empleado';

  // Encriptar la contraseña
  const hashedPassword = await bcrypt.hash(contraseña, 10);

  const sql = 'INSERT INTO usuario (nombre_usuario, contraseña, rol) VALUES (?, ?, ?)';
  const values = [nombre_usuario, hashedPassword, rol];

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error al insertar usuario:', err.message);
      return res.status(500).json({ error: 'Error al insertar usuario', details: err.message });
    }
    res.status(201).json({ id: result.insertId, nombre_usuario, rol });
  });
});

// Autenticación de usuario (login)
app.post('/login', (req, res) => {
  const { nombre_usuario, contraseña } = req.body;

  if (!nombre_usuario || !contraseña) {
    return res.status(400).json({ error: 'Los campos nombre de usuario y contraseña son obligatorios' });
  }

  const sql = 'SELECT * FROM usuario WHERE nombre_usuario = ?';
  pool.query(sql, [nombre_usuario], async (err, results) => {
    if (err) {
      console.error('Error en la consulta:', err.message);
      return res.status(500).json({ error: 'Error en la consulta', details: err.message });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const user = results[0];

    // Comparar la contraseña
    const isMatch = await bcrypt.compare(contraseña, user.contraseña);
    if (!isMatch) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Generar un token JWT
    const token = jwt.sign({ id: user.id_usuario, nombre_usuario: user.nombre_usuario, rol: user.rol }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
  });
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
