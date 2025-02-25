import express from 'express';
import { formularioLogin, autenticar, cerrarSesion, formularioRegistro, registrar, confirmar, formularioOlvidePassword,resetPassword, comprobarToken, nuevoPassword } from '../controllers/usuarioController.js';

const router = express.Router();

// router.get('/', (req,res) => {
    // res.json({msg:'Respuesta GET'})
// })
// 
// router.post('/', (req,res) => {
    // res.json({msg:'Respuesta post'})
// })

router.get('/login', formularioLogin)
router.post('/login', autenticar)

// Cerrar sesión
router.post('/cerrar-sesion', cerrarSesion)


router.get('/registro', formularioRegistro)
router.post('/registro', registrar)
router.get('/confirmar/:token', confirmar)
router.get('/olvide-password', formularioOlvidePassword)
router.post('/olvide-password', resetPassword)

// almacena el nuevo password
router.get('/olvide-password/:token', comprobarToken)
router.post('/olvide-password/:token', nuevoPassword)

// router.get('/nosotros', function(req,res){
//     res.send('hola Mundo en nosotros')
// })

export default router;