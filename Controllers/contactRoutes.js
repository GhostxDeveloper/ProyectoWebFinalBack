import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

router.post('/send-email', async (req, res) => {
  const { name, email, message } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'crissalvador175@gmail.com', 
        pass: 'hlhlgjhhyfxruxnr'
      },
    });

    await transporter.sendMail({
      from: '"Cook With Love" <crissalvador175@gmail.com>',
      to: 'crissalvador175@gmail.com',
      subject: 'Nuevo Mensaje de Contacto',
      text: `Nombre: ${name}\nCorreo: ${email}\nMensaje: ${message}`,
    });

    res.status(200).json({ success: true, message: 'Correo enviado con éxito' });
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    res.status(500).json({ success: false, error: 'Error al enviar el correo' });
  }
});

export default router;
