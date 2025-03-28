
import express from 'express';
import { getFirestore, collection, query, where, getDocs, addDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { initializeApp } from "firebase/app";

import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const app = initializeApp({
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
});
const db = getFirestore(app);

// Añadir una receta a favoritos
router.post('/add', async (req, res) => {
  try {
    const { userId, recipeId } = req.body;

    if (!userId) return res.status(400).json({ error: "El campo 'userId' es obligatorio" });
    if (!recipeId) return res.status(400).json({ error: "El campo 'recipeId' es obligatorio" });

    // Verificar si la receta existe
    const recipeRef = doc(db, "recipes", recipeId);
    const recipeSnap = await getDoc(recipeRef);
    
    if (!recipeSnap.exists()) {
      return res.status(404).json({ error: "La receta no existe" });
    }

    // Verificar si ya existe en favoritos para evitar duplicados
    const favoritesRef = collection(db, 'favorites');
    const q = query(
      favoritesRef, 
      where('userId', '==', userId),
      where('recipeId', '==', recipeId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return res.status(400).json({ error: "Esta receta ya está en favoritos" });
    }

    // Guardar en favoritos
    const docRef = await addDoc(collection(db, "favorites"), { 
      userId, 
      recipeId,
      createdAt: new Date().toISOString()
    });

    res.status(200).json({ id: docRef.id, message: "Receta añadida a favoritos" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al añadir a favoritos" });
  }
});

// Eliminar una receta de favoritos
router.delete('/remove', async (req, res) => {
  try {
    const { userId, recipeId } = req.body;

    // Validar que todos los campos estén definidos
    if (!userId) return res.status(400).json({ error: "El campo 'userId' es obligatorio" });
    if (!recipeId) return res.status(400).json({ error: "El campo 'recipeId' es obligatorio" });

    // Buscar el favorito específico
    const favoritesRef = collection(db, 'favorites');
    const q = query(
      favoritesRef, 
      where('userId', '==', userId),
      where('recipeId', '==', recipeId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return res.status(404).json({ error: "Favorito no encontrado" });
    }

    // Eliminar el documento de favoritos
    const favoriteId = querySnapshot.docs[0].id;
    await deleteDoc(doc(db, "favorites", favoriteId));

    res.status(200).json({ message: "Receta eliminada de favoritos" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar de favoritos" });
  }
});

// Obtener todos los favoritos de un usuario
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "userId es requerido" });
    }

    const favoritesRef = collection(db, 'favorites');
    const q = query(favoritesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    const favorites = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log("Favoritos encontrados:", favorites); // Log para depurar
    res.status(200).json(favorites);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ error: "Error al obtener favoritos" });
  }
});


export default router;