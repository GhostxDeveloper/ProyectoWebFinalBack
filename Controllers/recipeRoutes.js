import express from 'express';
import { getFirestore, collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
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

// Crear una nueva receta
router.post('/agregar', async (req, res) => {
  try {
    const { title, description, image, macros, preparationTime, ingredients, userId, steps } = req.body;

    // Validar que todos los campos estén definidos
    if (!title) return res.status(400).json({ error: "El campo 'title' es obligatorio" });
    if (!description) return res.status(400).json({ error: "El campo 'description' es obligatorio" });
    if (!image) return res.status(400).json({ error: "El campo 'image' es obligatorio" });
    if (!macros) return res.status(400).json({ error: "El campo 'macros' es obligatorio" });
    if (!preparationTime) return res.status(400).json({ error: "El campo 'preparationTime' es obligatorio" });
    if (!ingredients) return res.status(400).json({ error: "El campo 'ingredients' es obligatorio" });
    if (!userId) return res.status(400).json({ error: "El campo 'userId' es obligatorio" });
    if (!steps) return res.status(400).json({ error: "El campo 'steps' es obligatorio" }); // Validación para steps

    // Guardar la receta con los pasos
    const docRef = await addDoc(collection(db, "recipes"), { 
      title, 
      description, 
      image, 
      macros, 
      preparationTime, 
      ingredients, 
      userId, 
      steps  
    });

    res.status(200).json({ id: docRef.id });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error al crear receta" });
  }
});


// Obtener todas las recetas filtradas por userId
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query; // Obtener el userId de los parámetros de consulta
    if (!userId) {
      return res.status(400).json({ error: "userId es requerido" });
    }
    console.log(`Fetching recipes for userId: ${userId}`); // Agregar registro para depuración
    const q = query(collection(db, 'recipes'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const recipes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(recipes);
  } catch (error) {
    console.error("Error fetching recipes:", error);
    res.status(500).json({ error: "Error fetching recipes" });
  }
});

// Actualizar una receta
router.put('/actualizar/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, image, macros, preparationTime, ingredients, userId, steps } = req.body;

    // Validar que todos los campos estén definidos
    if (!title) return res.status(400).json({ error: "El campo 'title' es obligatorio" });
    if (!description) return res.status(400).json({ error: "El campo 'description' es obligatorio" });
    if (!image) return res.status(400).json({ error: "El campo 'image' es obligatorio" });
    if (!macros) return res.status(400).json({ error: "El campo 'macros' es obligatorio" });
    if (!preparationTime) return res.status(400).json({ error: "El campo 'preparationTime' es obligatorio" });
    if (!ingredients) return res.status(400).json({ error: "El campo 'ingredients' es obligatorio" });
    if (!userId) return res.status(400).json({ error: "El campo 'userId' es obligatorio" });
    if (!steps) return res.status(400).json({ error: "El campo 'steps' es obligatorio" }); // Validación para

    const recipeRef = doc(db, "recipes", id);
    await updateDoc(recipeRef, { title, description, image, macros, preparationTime, ingredients, userId, steps });
    res.status(200).json({ message: "Receta actualizada" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error al actualizar receta" });
  }
});

// Eliminar una receta
router.delete('/eliminar/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const recipeRef = doc(db, "recipes", id);
    await deleteDoc(recipeRef);
    res.status(200).json({ message: "Receta eliminada" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error al eliminar receta" });
  }
});



// En tu archivo de rutas donde tienes definido el otro endpoint
router.get('/all', async (req, res) => {
  try {
    console.log('Fetching all recipes'); // Registro para depuración
    const recipesRef = collection(db, 'recipes');
    const querySnapshot = await getDocs(recipesRef);
    const recipes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(recipes);
  } catch (error) {
    console.error("Error fetching all recipes:", error);
    res.status(500).json({ error: "Error fetching all recipes" });
  }
});



export default router;