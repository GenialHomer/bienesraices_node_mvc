import { check, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';

import Usuario from '../models/Usuario.js';
import { generarJWT, generarId } from '../helpers/tokens.js';
import { emailRegistro, emailOlvidePassword } from '../helpers/emails.js';

const formularioLogin = (req, res) => {
	res.render('auth/login', {
		// autenticado: true
		pagina: 'Iniciar Sesión',
		csrfToken: req.csrfToken(),
	});
};

const autenticar = async (req, res) => {
	//validacion
	await check('email').isEmail().withMessage('El email es obligatorio').run(req);
	await check('password').notEmpty().withMessage('EL password es obligatorio').run(req);

	let resultado = validationResult(req);

	// verificar que el resultado este vacio
	if (!resultado.isEmpty()) {
		// errores
		return res.render('auth/login', {
			pagina: 'Iniciar Sesión',
			csrfToken: req.csrfToken(),
			errores: resultado.array(),
		});
	}

	//comprobar si el usuario existe
	const { email, password } = req.body;

	const usuario = await Usuario.findOne({ where: { email } });
	if (!usuario) {
		return res.render('auth/login', {
			pagina: 'Iniciar Sesión',
			csrfToken: req.csrfToken(),
			errores: [{ msg: 'El usuario no existe' }],
		});
	}

	//comprobar si el usuario esta confirmado
	if (!usuario.confirmado) {
		return res.render('auth/login', {
			pagina: 'Iniciar Sesión',
			csrfToken: req.csrfToken(),
			errores: [{ msg: 'Tu cuenta no ha sido confirmada' }],
		});
	}

	//comprobar si el usuario esta confirmado
	if (!usuario.verificarPassword(password)) {
		return res.render('auth/login', {
			pagina: 'Iniciar Sesión',
			csrfToken: req.csrfToken(),
			errores: [{ msg: 'El password es incorrecto' }],
		});
	}

	//autenticar el usuario
    const token = generarJWT({id: usuario.id, nombre: usuario.nombre})
    //console.log(`🚀 => file: usuarioController.js:71 => autenticar => token:`, token);

    //almacenar en un cookie
    return res.cookie('_token', token,{
        httpOnly: true,
        //secure:true
    }).redirect('/mis-propiedades')

	// res.render('auth/login',{
	// autenticado: true
	//     pagina: 'Iniciar Sesión'
	//})

	//console.log(`Autenticando`);
};

const cerrarSesion = (req, res) => {
    return res.clearCookie('_token').status(200).redirect('/auth/login')
}

const formularioRegistro = (req, res) => {
	//console.log(req.csrfToken());

	res.render('auth/registro', {
		pagina: 'Crear Cuenta',
		csrfToken: req.csrfToken(),
	});
};
const registrar = async (req, res) => {
	// console.log(req.body)
	// validación
	await check('nombre').notEmpty().withMessage('El nombre no puede ir vacio..').run(req);
	await check('email').isEmail().withMessage('eso no parece un email..').run(req);
	await check('password').isLength({ min: 1 }).withMessage('EL password es de al menos 1 caracteres..').run(req);
	await check('repetir_password')
		.equals(req.body.password)
		.withMessage('El password debe ser igual al anterior')
		.run(req);

	let resultado = validationResult(req);

	// return res.json(resultado.array())

	// verificar que el resultado este vacio
	if (!resultado.isEmpty()) {
		// errores
		return res.render('auth/registro', {
			pagina: 'Crear Cuenta',
			csrfToken: req.csrfToken(),
			errores: resultado.array(),
			usuario: {
				nombre: req.body.nombre,
				email: req.body.email,
			},
		});
	}

	// extraer los datos
	const { nombre, email, password } = req.body;

	// verificar que el usuario no este duplicado
	const existeUsuario = await Usuario.findOne({ where: { email } });

	//console.log(`🚀 => file: usuarioController.js:46 => registrar => existeUsuario`, existeUsuario);
	if (existeUsuario) {
		return res.render('auth/registro', {
			pagina: 'Crear Cuenta',
			csrfToken: req.csrfToken(),
			errores: [{ msg: 'El usuario ya existe' }],
			usuario: {
				nombre: req.body.nombre,
				email: req.body.email,
			},
		});
	}

	// almacenar un usuario
	const usuario = await Usuario.create({
		nombre,
		email,
		password,
		token: generarId(),
	});

	// envia email de confirmacion
	emailRegistro({
		nombre: usuario.nombre,
		email: usuario.email,
		token: usuario.token,
	});

	// const usuario = await Usuario.create(req.body)
	// res.json(usuario)
	res.render('templates/mensaje', {
		pagina: 'Cuenta Creada Correctamente',
		mensaje: 'Hemos enviado un email de confirmación, presiona en el enlace',
	});
};

// funcion que comprueba una cuenta
const confirmar = async (req, res) => {
	// console.log('comprobando')
	const { token } = req.params;
	//console.log(`🚀 => file: usuarioController.js:94 => confirmar => token`, token);
	// next()

	// verificar si el token es válido
	const usuario = await Usuario.findOne({ where: { token } });
	//console.log(`🚀 => file: usuarioController.js:98 => confirmar => usuario:`, usuario);

	if (!usuario) {
		return res.render('auth/confirmar-cuenta', {
			pagina: 'Error al confirmar tu cuenta',
			mensaje: 'Hubo un error al confirmar tu cuenta, intenta de nuevo',
			error: true,
		});
	}

	// confirmar la cuenta
	usuario.token = null;
	usuario.confirmado = true;
	await usuario.save();

	res.render('auth/confirmar-cuenta', {
		pagina: 'Cuenta Confirmada',
		mensaje: 'La cuenta se confirmó Correctamente',
	});

	//console.log(`🚀 => file: usuarioController.js:98 => confirmar => usuario:`, usuario);
};

const formularioOlvidePassword = (req, res) => {
	res.render('auth/olvide-password', {
		pagina: 'Recupera tu acceso a Bienes Raices',
		csrfToken: req.csrfToken(),
	});
};

const resetPassword = async (req, res) => {
	// validación
	await check('email').isEmail().withMessage('eso no parece un email..').run(req);

	let resultado = validationResult(req);

	// verificar que el resultado este vacio
	if (!resultado.isEmpty()) {
		// errores
		return res.render('auth/olvide-password', {
			pagina: 'Recupera tu acceso a Bienes Raices',
			csrfToken: req.csrfToken(),
			errores: resultado.array(),
		});
	}

	//buscar el usuario
	const { email } = req.body;

	const usuario = await Usuario.findOne({ where: { email } });
	//console.log(`🚀 => file: usuarioController.js:155 => resetPassword => usuario:`, usuario);

	if (!usuario) {
		// errores
		return res.render('auth/olvide-password', {
			pagina: 'Recupera tu acceso a Bienes Raices',
			csrfToken: req.csrfToken(),
			errores: [{ msg: 'El Email no pertenece a ningún usuario' }],
		});
	}
	//generar un token y enviar al email
	usuario.token = generarId();
	await usuario.save();

	//enviar un email
	emailOlvidePassword({
		email: usuario.email,
		nombre: usuario.nombre,
		token: usuario.token,
	});

	//renderizar un mensaje
	res.render('templates/mensaje', {
		pagina: 'Reestablece tu Password',
		mensaje: 'Hemos enviado un email con las instrucciones',
	});
};

const comprobarToken = async (req, res) => {
	const { token } = req.params;

	const usuario = await Usuario.findOne({ where: { token } });
	//console.log(`🚀 => file: usuarioController.js:187 => comprobarToken => usuario:`, usuario);

	if (!usuario) {
		return res.render('auth/confirmar-cuenta', {
			pagina: 'Reestablece tu Password',
			mensaje: 'Hubo un error al validar tu información, intenta de nuevo',
			error: true,
		});
	}

	//mostrar formulario para modificar el password
	res.render('auth/reset-password', {
		pagina: 'Reestablece tu Password',
		csrfToken: req.csrfToken(),
	});
};
const nuevoPassword = async (req, res) => {
	//console.log('guardando password');
	//validar el password
	await check('password').isLength({ min: 1 }).withMessage('EL password es de al menos 1 caracteres..').run(req);

	let resultado = validationResult(req);

	// return res.json(resultado.array())

	// verificar que el resultado este vacio
	if (!resultado.isEmpty()) {
		// errores
		return res.render('auth/reset-password', {
			pagina: 'Reestablece tu password',
			csrfToken: req.csrfToken(),
			errores: resultado.array(),
		});
	}

	const { token } = req.params;
	const { password } = req.body;

	// identificar quien hace el cambio
	const usuario = await Usuario.findOne({ where: { token } });

	// hashear el nuevo password
	const salt = await bcrypt.genSalt(10);
	usuario.password = await bcrypt.hash(password, salt);
	usuario.token = null;

	await usuario.save();

	res.render('auth/confirmar-cuenta', {
		pagina: 'Password Reestablecido',
		mensaje: 'El Password se guardo correctamente',
	});
};

export {
	formularioLogin,
	autenticar,
	cerrarSesion,
	formularioRegistro,
	registrar,
	confirmar,
	formularioOlvidePassword,
	resetPassword,
	comprobarToken,
	nuevoPassword,
};
