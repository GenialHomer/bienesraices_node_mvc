import { unlink } from 'node:fs/promises';
import { validationResult } from 'express-validator';
//import Precio from '../models/Precio.js'
//import Categoria from '../models/Categoria.js';
import { Precio, Categoria, Propiedad, Mensaje, Usuario } from '../models/index.js';
import { esVendedor, formatearFecha  } from '../helpers/index.js';

const admin = async (req, res) =>{

    //leer el queryString
    const {pagina: paginaActual } = req.query
    const expresion = /^[1-9]$/

    if(!expresion.test(paginaActual)){
        return res.redirect('/mis-propiedades?pagina=1')
    }

    try {
    
        // Limites y offset para el paginador
        const limit = 3
        const offset = ((paginaActual * limit) - limit)

        //3*10 - 10 = 20


        const {id} = req.usuario
        //console.log(`🚀 => admin => id:`, id);

        const [propiedades, total] = await Promise.all([
            Propiedad.findAll({
                limit, 
                offset,
                where: {
                    usuarioId : id
                },
                include: [
                    { model: Categoria, as: 'categoria'},
                    { model: Precio, as: 'precio'},
                    { model: Mensaje, as: 'mensajes'},
                    
                ]
            }),
            Propiedad.count({
                where: {
                    usuarioId: id
                }
            })

        ])
        ////console.log(`🚀 => admin => total:`, total);
        


        res.render('propiedades/admin', {
            pagina: 'Mis Propiedades',
            propiedades,
            csrfToken: req.csrfToken(),
            barra: true,
            paginas:Math.ceil(total / limit),
            paginaActual: Number(paginaActual),
            total,
            offset,
            limit
        })
        } catch (error) {
            console.log(`🚀 => admin => error:`, error);
            
        }

}

//formulario para crear una nueva propiedad
const crear = async (req, res) =>{

    //consultar model de Precio y Categorias
    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ])

    res.render('propiedades/crear', {
        pagina: 'crear Propiedades',
        csrfToken: req.csrfToken(),
        categorias,
        precios,
        datos: {}
    })
}

const guardar = async (req, res) => {
    // validacion
    let resultado = validationResult(req)

    if(!resultado.isEmpty()){

        const [categorias, precios] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll()
        ])

        return res.render('propiedades/crear', {
            pagina: 'crear Propiedades',
            csrfToken: req.csrfToken(),
            categorias,
            precios,
            errores: resultado.array(),
            datos: req.body
        })
    }

    //crear un registro
    //console.log(`🚀 => guardar => request.body:`, req.body);

    const { titulo, descripcion, habitaciones, estacionamiento, wc, calle, lat, lng, precio: precioId,categoria:categoriaId} = req.body
    const { id:usuarioId} = req.usuario

    //console.log(req.usuario)

    try {
        const propiedadGuardada = await Propiedad.create({
            titulo,
            descripcion,      
            habitaciones,
            estacionamiento,
            wc,
            calle,
            lat,
            lng,
            precioId,
            categoriaId,
            usuarioId,
            imagen:''

        })
        const {id} = propiedadGuardada
        res.redirect(`/propiedades/agregar-imagen/${id}`)
    } catch (error) {
        console.log(`🚀 => guardar => error:`, error);
        
    }

}

const agregarImagen = async (req,res) => {

    const { id } = req.params
    //validar la propiedad exista
    const propiedad = await Propiedad.findByPk(id)

    if(!propiedad){
        return res.redirect('/mis-propiedades')
    }

    //validar que la propiedad no este publicada
    if(propiedad.publicado){
        return res.redirect('/mis-propiedades')
    }

    //validar que la propiedad pertenece a quien visita esa pagina
    if(req.usuario.id.toString() !== propiedad.usuarioId.toString()){
        return res.redirect('/mis-propiedades')
    }

    //console.log(req.usuario)


    res.render('propiedades/agregar-imagen',{
        pagina: `Agregar Imagen: ${propiedad.titulo}`,
        csrfToken: req.csrfToken(),
        propiedad,
    })
}

const almacenarImagen = async (req, res, next) =>{

    const { id } = req.params
    //validar la propiedad exista
    const propiedad = await Propiedad.findByPk(id)

    if(!propiedad){
        return res.redirect('/mis-propiedades')
    }

    //validar que la propiedad no este publicada
    if(propiedad.publicado){
        return res.redirect('/mis-propiedades')
    }

    //validar que la propiedad pertenece a quien visita esa pagina
    if(req.usuario.id.toString() !== propiedad.usuarioId.toString()){
        return res.redirect('/mis-propiedades')
    }

    try {
        //console.log(`🚀 => reqFile => error:`, req.file);
        
        propiedad.imagen = req.file.filename
        propiedad.publicado = 1

        await propiedad.save()
        
        next()


        //almacenar la imagen y publicar la propiedad

    } catch (error) {
        //console.log(`🚀 => almacenarImagen => error:`, error);
        
    }

}

const editar = async (req, res) =>{

    const { id } = req.params
    //validar la propiedad exista
    const propiedad = await Propiedad.findByPk(id)

    if(!propiedad){
        return res.redirect('/mis-propiedades')
    }

    //validar que la propiedad no este publicada
    /*if(propiedad.publicado){
        return res.redirect('/mis-propiedades')
    }
        */

    //validar que la propiedad pertenece a quien visita esa pagina
    if(req.usuario.id.toString() !== propiedad.usuarioId.toString()){
        return res.redirect('/mis-propiedades')
    }

    //console.log(req.usuario)



    //consultar model de Precio y Categorias
    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ])
    

    res.render('propiedades/editar', {
        pagina: `Editar Propiedad: ${propiedad.titulo}`,
        csrfToken: req.csrfToken(),
        categorias,
        precios,
        datos: propiedad
    })
}
const guardarCambios = async (req, res) =>{
    //console.log('guardando cambios')
    //return

    // validacion
    let resultado = validationResult(req)

    if(!resultado.isEmpty()){

        const [categorias, precios] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll()
        ])

        return res.render('propiedades/editar', {
            pagina: 'Editar Propiedad',
            csrfToken: req.csrfToken(),
            categorias,
            precios,
            errores: resultado.array(),
            datos: req.body
        })
    }

    const { id } = req.params
    //validar la propiedad exista
    const propiedad = await Propiedad.findByPk(id)

    if(!propiedad){
        return res.redirect('/mis-propiedades')
    }

    //validar que la propiedad no este publicada
    /*if(propiedad.publicado){
        return res.redirect('/mis-propiedades')
    }
        */

    //validar que la propiedad pertenece a quien visita esa pagina
    if(req.usuario.id.toString() !== propiedad.usuarioId.toString()){
        return res.redirect('/mis-propiedades')
    }

    //reescribir el objeto

    try {
        //console.log(`🚀 => guardarCambios => propiedad:`, propiedad);

        const { titulo, descripcion, habitaciones, estacionamiento, wc, calle, lat, lng, precio: precioId,categoria:categoriaId} = req.body

        propiedad.set({
            titulo, 
            descripcion, 
            habitaciones, 
            estacionamiento, 
            wc, 
            calle, 
            lat, 
            lng, 
            precioId,
            categoriaId
        })

        propiedad.save()

        res.redirect('/mis-propiedades')
        
    } catch (error) {
        console.log(`🚀 => guardarCambios => error:`, error);
        
    }
}

const eliminar = async (req, res) =>{
    //console.log(`eliminando`);

    //return 

    const { id } = req.params

    //validar la propiedad exista
    const propiedad = await Propiedad.findByPk(id)

    if(!propiedad){
        return res.redirect('/mis-propiedades')
    }

    //validar que la propiedad pertenece a quien visita esa pagina
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString()){
        return res.redirect('/mis-propiedades')
    }
    
    //return
    //eliminar la imagen
    await unlink(`public/uploads/${propiedad.imagen}`)

    //console.log(`SE ELIMINO LA IMAGEN ${propiedad.imagen}`);
    //eliminar la propiedad
    await propiedad.destroy()
    res.redirect('/mis-propiedades')
    
}

// Modifica el estado de la propiedad
const cambiarEstado = async (req, res) => {

    const {id} = req.params

    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)
    if(!propiedad) {
        return res.redirect('/mis-propiedades')
    }

    // Revisar que quien visita la URl, es quien creo la propiedad
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString() ) {
        return res.redirect('/mis-propiedades')
    }

    // Actualizar
    propiedad.publicado = !propiedad.publicado

    await propiedad.save()

    res.json({
        resultado: true
    })
}

//muestra una propiedad 
const mostrarPropiedad = async (req, res) =>{
    //res.send('mostrando')
    const {id} = req.params

    console.log(req.usuario)

    //comprobar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id,{
        where: {
            propiedadId : id
        },
        include: [
            { model: Categoria, as: 'categoria'},
            { model: Precio, as: 'precio'},
            
        ]
    })

    if(!propiedad || !propiedad.publicado){
        return res.redirect('/404')
    }

    //console.log('ID del Usuario:', req.usuario?.id);
    //console.log('ID del Vendedor (Propiedad):', propiedad.usuarioId);
    //console.log('Es vendedor:', esVendedor(req.usuario?.id, propiedad.usuarioId));
    


    res.render('propiedades/mostrar',{
        propiedad, 
        pagina: propiedad.titulo,
        csrfToken: req.csrfToken(),
        usuario: req.usuario,
        esvendedor: esVendedor(req.usuario?.id, propiedad.usuarioId)
    })
}
//muestra una propiedad 
const enviarMensaje = async (req, res) =>{
    //res.send('mostrando')
    const {id} = req.params

    console.log(req.usuario)

    //comprobar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id,{
        where: {
            propiedadId : id
        },
        include: [
            { model: Categoria, as: 'categoria'},
            { model: Precio, as: 'precio'},
            
        ]
    })

    if(!propiedad){
        return res.redirect('/404')
    }

    //renderiza los errores
    // validacion
    let resultado = validationResult(req)

    if(!resultado.isEmpty()){

        const [categorias, precios] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll()
        ])

        return res.render('propiedades/mostrar',{
            propiedad, 
            pagina: propiedad.titulo,
            csrfToken: req.csrfToken(),
            usuario: req.usuario,
            esvendedor: esVendedor(req.usuario?.id, propiedad.usuarioId),
            errores: resultado.array(),
            //-datos: req.body
        })
    }

    //console.log('ID del Usuario:', req.usuario?.id);
    //console.log('ID del Vendedor (Propiedad):', propiedad.usuarioId);
    //console.log('Es vendedor:', esVendedor(req.usuario?.id, propiedad.usuarioId));
    
    //console.log(req.body)
    //console.log(req.params)
    //console.log(req.usuario)
    

    //return
    const {mensaje} = req.body
    const {id: propiedadId } = req.params
    const {id: usuarioId} = req.usuario
    
    //almacenar el mensaje
    await Mensaje.create({
        mensaje,
        propiedadId,
        usuarioId
    })
    res.redirect('/')
 /*
    res.render('propiedades/mostrar',{
        propiedad, 
        pagina: propiedad.titulo,
        csrfToken: req.csrfToken(),
        usuario: req.usuario,
        esvendedor: esVendedor(req.usuario?.id, propiedad.usuarioId),
        enviado:true
    })
        */

    }
    const verMensajes = async (req,res)=>{

        const { id } = req.params

        // Validar que la propiedad exista
        const propiedad = await Propiedad.findByPk(id, {
            include: [
                { model: Mensaje, as: 'mensajes', 
                    include: [
                        {model: Usuario.scope('eliminarPassword'), as: 'usuario'}
                    ]
                },
            ],
        })
    
        if(!propiedad){
            return res.redirect('/mis-propiedades')
        }
    
        //validar que la propiedad pertenece a quien visita esa pagina
        if(propiedad.usuarioId.toString() !== req.usuario.id.toString()){
            return res.redirect('/mis-propiedades')
        }

        //res.send('mensajes aqui')
        res.render('propiedades/mensajes', {
            pagina: 'Mensajes',
            mensajes: propiedad.mensajes,
            formatearFecha

        })
    }

export{
    admin,
    crear,
    guardar,
    agregarImagen,
    almacenarImagen,
    editar,
    guardarCambios,
    eliminar,
    cambiarEstado,
    mostrarPropiedad,
    enviarMensaje,
    verMensajes
}