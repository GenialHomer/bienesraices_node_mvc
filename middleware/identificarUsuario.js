import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js'

const identificarUsuario = async (req, res, next) =>{
    // identificar si hay un token

    //verificar si hay un token
    const {_token } = req.cookies
    if(!_token){
        req.usuario = null
        return next()
    }

    // comprobar el token
    try {
        const decoded = jwt.verify(_token, process.env.JWT_SECRET)
        const usuario = await Usuario.scope('eliminarPassword').findByPk(decoded.id)
        //console.log("identificarUsuario.js - Usuario Identificado:", usuario);  // Verifica el usuario aquí
        //console.log(`🚀 => IdentificarUSuario => usuario:`, usuario);
        //console.log(`🚀 => IdentificarUSuario => decoded:`, decoded);

        //almacenar el usuario al Req
        if(usuario) {
            req.usuario = usuario
        }

        return next()
        
    } catch (error) {
        return res.clearCookie('_token').redirect('/auth/login')
    }
}

export default identificarUsuario