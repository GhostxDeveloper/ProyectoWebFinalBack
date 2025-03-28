


import express from 'express';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import { getFirestore, collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
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
const saltRounds = 10;

const resetCodes = [];

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'crissalvador175@gmail.com',
      pass: 'hlhlgjhhyfxruxnr' 
    }
  });


  
router.post('/request-reset', async (req, res) => {
    try {
      const { correo_electronico } = req.body;
      
      // Verificar si el usuario existe
      const q = query(collection(db, 'usuarios'), where('correo_electronico', '==', correo_electronico));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return res.status(404).json({ error: "Usuario no encontrado, por favor verifica tu correo electrónico" });
      }
      
      // Generar código aleatorio de 6 dígitos
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Guardar el código con timestamp (expira después de 15 minutos)
      resetCodes[correo_electronico] = {
        code: resetCode,
        expiresAt: Date.now() + 15 * 60 * 1000
      };
      
      // Enviar correo con el código
      const mailOptions = {
        from: 'crissalvador175@gmail.com',
        to: correo_electronico,
        subject: 'Código de recuperación de contraseña',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Recuperación de contraseña</h2>
            <p>Has solicitado restablecer tu contraseña. Usa el siguiente código para continuar:</p>
            <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
              ${resetCode}
            </div>
            <p>Este código expirará en 15 minutos.</p>
            <p>Si no solicitaste un restablecimiento de contraseña, puedes ignorar este correo.</p>
          </div>
        `
      };
      
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          return res.status(500).json({ error: "Error al enviar el correo" });
        }
        console.log('Código enviado: ' + info.response);
        res.status(200).json({ success: true, message: "Código enviado al correo" });
      });
      
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Error al procesar la solicitud" });
    }
  });
  
  
  router.post('/verify-code', async (req, res) => {
    try {
      const { correo_electronico, codigo } = req.body;
      
      // Verificar si el código existe y no ha expirado
      if (!resetCodes[correo_electronico] || resetCodes[correo_electronico].expiresAt < Date.now()) {
        return res.status(404).json({ error: "Código de restablecimiento no encontrado o expirado" });
      }
      
      // Verificar si el código es correcto
      if (resetCodes[correo_electronico].code !== codigo) {
        return res.status(401).json({ error: "Código de restablecimiento incorrecto" });
      }
      
      // Eliminar el código de restablecimiento
      delete resetCodes[correo_electronico];
      
      res.status(200).json({ success: true, message: "Código verificado correctamente" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Error al procesar la solicitud" });
    }
  });
  
  
  router.post('/reset-password', async (req, res) => {
    try {
      const { correo_electronico, nueva_contrasena } = req.body;
  
      const q = query(collection(db, 'usuarios'), where('correo_electronico', '==', correo_electronico));
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
  
      const hashedPassword = await bcrypt.hash(nueva_contrasena, saltRounds);
  
      const userDoc = querySnapshot.docs[0];
      const userRef = doc(db, 'usuarios', userDoc.id);
      await updateDoc(userRef, { contrasena: hashedPassword });

  
      res.status(200).json({ success: true, message: "Contraseña restablecida correctamente" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Error al restablecer la contraseña" });
    }
  });

    

export default router;