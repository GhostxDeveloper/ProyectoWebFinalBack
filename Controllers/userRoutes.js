import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getFirestore, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { initializeApp } from "firebase/app";
import firebaseConfig from '../bd/db.js';

const router = express.Router();
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const saltRounds = 10;
const secretKey = 'hcnjnkjncen19'; // Cambia esto por una clave secreta segura

router.post('/register', async (req, res) => {
    try {
        const { nombre_usuario, apellidos, correo_electronico, contrasena } = req.body;
        const hashedPassword = await bcrypt.hash(contrasena, saltRounds);
        const docRef = await addDoc(collection(db, "usuarios"), {
            nombre_usuario,
            apellidos,
            correo_electronico,
            contrasena: hashedPassword,
        });
        res.status(200).json({ id: docRef.id });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Error al registrar usuario" });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { correo_electronico, contrasena } = req.body;

        console.log('Contraseña recibida:', contrasena);  // Verifica la contraseña que se recibe en el login

        const q = query(collection(db, 'usuarios'), where('correo_electronico', '==', correo_electronico));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            res.status(404).json({ error: "Usuario no encontrado" });
        } else {
            const userDoc = querySnapshot.docs[0];
            const user = userDoc.data();

            console.log('Contraseña hasheada en la base de datos:', user.contrasena);  // Verifica la contraseña hasheada en la base de datos

            const passwordMatch = await bcrypt.compare(contrasena, user.contrasena);
            if (passwordMatch) {
                const token = jwt.sign({ id: userDoc.id, email: user.correo_electronico }, secretKey, { expiresIn: '1h' });
                res.status(200).json({
                    message: "Inicio de sesión exitoso",
                    token,
                    user: {
                        id: userDoc.id,
                        email: user.correo_electronico,
                        name: user.nombre_usuario,
                        lastname: user.apellidos,
                    }
                });
            } else {
                res.status(401).json({ error: "Credenciales incorrectas" });
            }
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Error al iniciar sesión" });
    }
});


export default router;