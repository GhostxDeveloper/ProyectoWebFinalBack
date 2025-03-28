import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import dotenv from 'dotenv';
import { initializeApp } from "firebase/app"; 
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, getDocs, addDoc} from "firebase/firestore"; 

dotenv.config();

const app = initializeApp({
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
});
const db = getFirestore(app);

const router = express.Router();
const saltRounds = 10;
const secretKey = process.env.JWT_SECRET_KEY || 'keysalvador2505';


const prepareUserData = (userDoc, userData) => ({
    id: userDoc.id,
    email: userData.correo_electronico,
    name: userData.nombre_usuario || "Usuario",
    phone: userData.telefono || "",
    avatar: userData.avatar || "https://i.pravatar.cc/150?img=5",
    lastname: userData.apellidos || ""
});

router.post('/register', async (req, res) => {
    try {
        const { nombre_usuario, telefono, correo_electronico, contrasena, avatar } = req.body;
        const userQuery = query(collection(db, 'usuarios'), where('correo_electronico', '==', correo_electronico));
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
            return res.status(400).json({ error: "El correo electrónico ya está registrado" });
        }
        const secret = speakeasy.generateSecret({ length: 20 });
        const hashedPassword = await bcrypt.hash(contrasena, saltRounds);
        const docRef = await addDoc(collection(db, "usuarios"), {
            nombre_usuario,
            telefono, 
            correo_electronico,
            contrasena: hashedPassword,
            avatar, 
            secret_2fa: secret.base32,
            mfa_enabled: true
        });
        const otpauthUrl = secret.otpauth_url;
        
        res.status(200).json({ 
            id: docRef.id,
            secret: otpauthUrl
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Error al registrar usuario" });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { correo_electronico, contrasena } = req.body;
        
        const q = query(collection(db, 'usuarios'), where('correo_electronico', '==', correo_electronico));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            return res.status(404).json({ error: "Usuario no encontrado. Por favor verifica tu correo electrónico." });
        } else {
            const userDoc = querySnapshot.docs[0];
            const user = userDoc.data();
            
            const passwordMatch = await bcrypt.compare(contrasena, user.contrasena);
            
            if (passwordMatch) {
                if (user.mfa_enabled) {
                    res.status(200).json({
                        requiresMFA: true,
                        email: correo_electronico,
                        message: "Se requiere autenticación de dos factores."
                    });
                } else {
                    const token = jwt.sign({ 
                        id: userDoc.id, 
                        email: user.correo_electronico 
                    }, secretKey, { expiresIn: '1h' });
                    
                    res.status(200).json({
                        message: "Inicio de sesión exitoso.",
                        token,
                        requiresMFA: false,
                        user: prepareUserData(userDoc, user)
                    });
                }
            } else {
                res.status(401).json({ error: "Contraseña incorrecta. Por favor intenta nuevamente." });
            }
        }
    } catch (error) {
        console.error("Error en el login:", error);
        res.status(500).json({ error: "Error interno del servidor. Por favor intenta más tarde." });
    }
});

router.post('/verify-otp', async (req, res) => {
    try {
        const { correo_electronico, token } = req.body;
        
        const userQuery = query(collection(db, 'usuarios'), where('correo_electronico', '==', correo_electronico));
        const querySnapshot = await getDocs(userQuery);
        
        if (querySnapshot.empty) {
            return res.status(404).json({ error: "Usuario no encontrado. Por favor verifica tu correo electrónico." });
        }
        
        const userDoc = querySnapshot.docs[0];
        const user = userDoc.data();
        
        const verified = speakeasy.totp.verify({
            secret: user.secret_2fa,
            encoding: 'base32',
            token,
            window: 1
        });
        
        if (verified) {
            const token = jwt.sign({ 
                id: userDoc.id, 
                email: user.correo_electronico 
            }, secretKey, { expiresIn: '1h' });
            
            res.status(200).json({
                message: "Autenticación completada con éxito.",
                token,
                user: prepareUserData(userDoc, user)
            });
        } else {
            res.status(401).json({ error: "Código OTP inválido. Por favor verifica e intenta nuevamente." });
        }
    } catch (error) {
        console.error("Error al verificar OTP:", error);
        res.status(500).json({ error: "Error interno del servidor. Por favor intenta más tarde." });
    }
});
router.put('/update/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, phone, avatar } = req.body;
      if (!name || !email || !phone || !avatar) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
      }
      const userRef = doc(db, 'usuarios', id);
      await updateDoc(userRef, {
        nombre_usuario: name,
        correo_electronico: email,
        telefono: phone,
        avatar
      });
  
      res.status(200).json({ message: 'Perfil actualizado correctamente' });
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      res.status(500).json({ error: 'Error al actualizar el perfil.' });
    }
  });
  

export default router;