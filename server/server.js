import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import userRoutes from '../Controllers/userRoutes.js';
import recipeRoutes from '../Controllers/recipeRoutes.js';
import contactRoutes from '../Controllers/contactRoutes.js';
import passwordRoutes from '../Controllers/passwordRoutes.js';
import favoritesRoutes from '../Controllers/favoritesRoutes.js';

// Cargar variables de entorno
dotenv.config();

const server = express();
server.use(bodyParser.json({ limit: '50mb' }));
server.use(bodyParser.urlencoded({ limit: '50mb', extended: true })); 
server.use(cors()); 

// Rutas de la API
server.use('/api/users', userRoutes);
server.use('/api/recipes', recipeRoutes);
server.use('/api/contact', contactRoutes);
server.use('/api/pass', passwordRoutes);
 server.use('/api/favorites', favoritesRoutes);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});