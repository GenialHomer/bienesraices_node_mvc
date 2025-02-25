// const express = require('express'); //CommonJS
import express from 'express'
import csrf from 'csurf'
import cookieParser from 'cookie-parser';
import usuarioRoutes from './routes/usuarioRoutes.js'
import propiedadesRoutes from './routes/propiedadesRoutes.js'
import appRoutes from './routes/appRoutes.js'
import apiRoutes from './routes/apiRoutes.js'
import db from "./config/db.js";

// crear la application
const app = express();

// habilitar lectura de datos del formulario
app.use(express.urlencoded({extended:true}))

// habilitar cookie Parser
app.use(cookieParser())

//habilitar el CSRF
app.use(csrf({ cookie:true }))

// conexion a la base de datos
try{
    await db.authenticate();
    db.sync()
    console.log('Conexion Correcta a la base de datos')
}catch(error){
    console.log(error)
}

// habilitar PUG
app.set('view engine', 'pug');
app.set('views', './views')

//Carpeta Pública
app.use( express.static('public') );

//routing
/*app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
});
*/
app.use('/', appRoutes)
app.use('/auth', usuarioRoutes)
app.use('/', propiedadesRoutes)
app.use('/api', apiRoutes)


// definir un puerto y arrancar el proyecto
const port = process.env.PORT || 3000;

app.listen(port, ()=>{
    console.log(`El Servidor esta funcionando en el puerto caca ${port}`)
});