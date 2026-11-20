const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'jonyarturin.2',
    database: process.env.DB_NAME || 'concretos_a',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    waitForConnections: true,
    connectionLimit: 10
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('Error conectando a MySQL:', err.message);
        return;
    }
    console.log('Conectado a la base de datos correctamente');

    const createPedidosDetalle = `
        CREATE TABLE IF NOT EXISTS pedidos_detalle (
            id_pedidos_detalle INT NOT NULL AUTO_INCREMENT,
            id_pedidos INT NOT NULL,
            id_articulos INT NOT NULL,
            precio_unit DECIMAL(10,2) NOT NULL,
            cantidad DECIMAL(10,2) NOT NULL,
            subtotal DECIMAL(10,2) NOT NULL,
            PRIMARY KEY (id_pedidos_detalle),
            FOREIGN KEY (id_pedidos) REFERENCES pedidos(id_pedidos),
            FOREIGN KEY (id_articulos) REFERENCES articulos(id_articulos)
        )
    `;
    connection.query(createPedidosDetalle, () => connection.release());
});

app.get('/api/articulos', (req, res) => {
    const query = `
        SELECT 
            a.id_articulos,
            a.desc1,
            a.desc2,
            a.tipo,
            a.stock,
            a.precio_base,
            a.estatus,
            COALESCE(c.descripcion, a.tipo, 'General') AS categoria,
            COALESCE(u.abreviatura, 'pza') AS unidad,
            COALESCE(p.razon_comercio, p.razon_social, 'Arciniega') AS proveedor
        FROM articulos a
        LEFT JOIN categoria c ON a.id_categoria = c.id_categoria
        LEFT JOIN unidades_medida u ON a.id_unidad_medida = u.id_unidad_medida
        LEFT JOIN proveedor p ON a.id_proveedor = p.id_proveedor
        WHERE a.estatus IN ('1', 'Activo', 'activo')
        ORDER BY a.id_articulos ASC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/resistencias', (req, res) => {
    db.query("SELECT * FROM resistencias WHERE estatus IN ('1', 'Activo', 'activo') ORDER BY id_resistencia ASC", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/proveedores', (req, res) => {
    db.query('SELECT * FROM proveedor ORDER BY id_proveedor ASC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/clientes', (req, res) => {
    db.query('SELECT * FROM cliente ORDER BY id_cliente ASC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/ventas', (req, res) => {
    const query = `
        SELECT v.*, CONCAT(c.nombre, ' ', c.ap_pat) AS cliente_nombre
        FROM ventas v
        LEFT JOIN cliente c ON v.id_cliente = c.id_cliente
        ORDER BY v.id_ventas ASC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/vehiculos', (req, res) => {
    db.query('SELECT * FROM vehiculos ORDER BY id_vehiculos ASC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/personal', (req, res) => {
    const query = `
        SELECT pe.*, pu.descripcion AS puesto_nombre
        FROM personal pe
        LEFT JOIN puestos pu ON pe.id_puestos = pu.id_puestos
        ORDER BY pe.id_personal ASC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/login', (req, res) => {
    const { usuario, clave, rol } = req.body;

    if (rol === 'admin') {
        const queryAdmin = "SELECT * FROM usuarios WHERE usuario = ? AND contrasena = ? AND estatus IN ('1', 'Activo', 'activo')";
        db.query(queryAdmin, [usuario, clave], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length === 0) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
            const admin = results[0];
            db.query('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id_usuario = ?', [admin.id_usuario]);
            res.json({ rol: 'admin', id_usuario: admin.id_usuario, nombre: admin.usuario });
        });
    } else {
        const queryCliente = "SELECT * FROM cliente WHERE email1 = ? AND tel1 = ? AND estatus IN ('1', 'Activo', 'activo')";
        db.query(queryCliente, [usuario, clave], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length === 0) return res.status(401).json({ error: 'Correo o teléfono no encontrados' });
            const c = results[0];
            const direccion = `${c.calle} ${c.no_int || ''}, Col. ${c.colonia}, CP ${c.cp}, ${c.municipio}, ${c.estado}`.trim();
            res.json({
                rol: 'cliente',
                id_cliente: c.id_cliente,
                nombre: `${c.nombre} ${c.ap_pat}`,
                email: c.email1,
                telefono: c.tel1,
                direccion
            });
        });
    }
});

app.post('/api/clientes/registro', (req, res) => {
    const { nombre, ap_pat, ap_mat, tel1, email1, calle, colonia, cp, municipio, estado } = req.body;
    const query = `
        INSERT INTO cliente 
        (nombre, ap_pat, ap_mat, tel1, email1, calle, colonia, cp, municipio, estado, fecha_registro, fecha_actualizacion, estatus)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), '1')
    `;
    db.query(query, [nombre, ap_pat, ap_mat || '', tel1, email1, calle, colonia, cp, municipio, estado], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Ese correo ya está registrado' });
            return res.status(500).json({ error: err.message });
        }
        const direccion = `${calle}, Col. ${colonia}, CP ${cp}, ${municipio}, ${estado}`;
        res.json({
            rol: 'cliente',
            id_cliente: result.insertId,
            nombre: `${nombre} ${ap_pat}`,
            email: email1,
            telefono: tel1,
            direccion
        });
    });
});

app.post('/api/pedidos', (req, res) => {
    const { id_cliente, id_articulos, cantidad, precio_unit, f_e_s, direccion_entrega, especificaciones } = req.body;
    if (!id_cliente) return res.status(401).json({ error: 'Debes iniciar sesión para realizar un pedido' });

    const folio = `PED-${Date.now().toString().slice(-6)}`;
    const subtotal = parseFloat(cantidad) * parseFloat(precio_unit);

    const insertPedido = `
        INSERT INTO pedidos (id_cliente, f_e_s, estatus, fecha_pedido, especificaciones, direccion_entrega, folio)
        VALUES (?, ?, '1', CURDATE(), ?, ?, ?)
    `;
    db.query(insertPedido, [id_cliente, f_e_s, especificaciones || 'Sin especificaciones', direccion_entrega, folio], (err, resultPedido) => {
        if (err) return res.status(500).json({ error: err.message });

        const idPedidos = resultPedido.insertId;
        const insertDetalle = `
            INSERT INTO pedidos_detalle (id_pedidos, id_articulos, precio_unit, cantidad, subtotal)
            VALUES (?, ?, ?, ?, ?)
        `;
        db.query(insertDetalle, [idPedidos, id_articulos, precio_unit, cantidad, subtotal], (errDetalle) => {
            if (errDetalle) return res.status(500).json({ error: errDetalle.message });
            res.json({ mensaje: 'Pedido guardado', id_pedidos: idPedidos, folio, subtotal });
        });
    });
});

app.post('/api/contacto', (req, res) => {
    const { nombre, telefono, email, asunto, mensaje } = req.body;
    const createTabla = `
        CREATE TABLE IF NOT EXISTS mensajes_contacto (
            id_mensaje INT NOT NULL AUTO_INCREMENT,
            nombre VARCHAR(120) NOT NULL,
            telefono VARCHAR(20) NOT NULL,
            email VARCHAR(100) DEFAULT NULL,
            asunto VARCHAR(100) NOT NULL,
            mensaje TEXT NOT NULL,
            fecha_envio DATETIME NOT NULL,
            PRIMARY KEY (id_mensaje)
        )
    `;
    db.query(createTabla, (errCreate) => {
        if (errCreate) return res.status(500).json({ error: errCreate.message });
        const insertMsg = `
            INSERT INTO mensajes_contacto (nombre, telefono, email, asunto, mensaje, fecha_envio)
            VALUES (?, ?, ?, ?, ?, NOW())
        `;
        db.query(insertMsg, [nombre, telefono, email || null, asunto, mensaje], (errInsert) => {
            if (errInsert) return res.status(500).json({ error: errInsert.message });
            res.json({ mensaje: 'Mensaje guardado correctamente' });
        });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});