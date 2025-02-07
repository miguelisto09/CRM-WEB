const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());  
app.use(express.json());  


const conexion = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Marianny19',  
    database: 'ManejadorTareas'
});

conexion.connect((err) => {
    if (err) {
        console.error('❌ Error al conectar MySQL:', err);
        return;
    }
    console.log('✅ Conectado a MySQL');
});

app.get('/tareas', (req, res) => {
    conexion.query('SELECT * FROM Tarea', (err, resultados) => {
        if (err) {
            res.status(500).json({ error: 'Error en la consulta' });
            return;
        }
        res.json(resultados);  
    });
});

app.listen(3000, () => {
    console.log('🚀 Servidor corriendo en http://localhost:3000');
});
