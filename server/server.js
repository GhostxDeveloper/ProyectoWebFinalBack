import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import userRoutes from '../Controllers/userRoutes.js';
import recipeRoutes from '../Controllers/recipeRoutes.js';
import contactRoutes from '../Controllers/contactRoutes.js';

const server = express();
server.use(bodyParser.json({ limit: '50mb' })); // Aumentar el límite de tamaño de carga útil
server.use(bodyParser.urlencoded({ limit: '50mb', extended: true })); // Aumentar el límite de tamaño de carga útil para datos codificados en URL
server.use(cors()); // Usar el middleware de CORS

// Rutas de la API de usuarios
server.use('/api/users', userRoutes);

// Rutas de la API de recetas
server.use('/api/recipes', recipeRoutes);

// Rutas de Contacto
server.use('/api/contact', contactRoutes);


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});