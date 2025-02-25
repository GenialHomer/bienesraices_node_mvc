import { Sequelize } from 'sequelize';
import { Precio, Categoria, Propiedad } from '../models/index.js';



const inicio = async (req, res) => {

    const [categorias, precios, casas, departamentos ] = await Promise.all([
        Categoria.findAll({
            raw:true
        }),
        Precio.findAll({
            raw:true
        }),
        Propiedad.findAll({
            limits: 3,
            where: {
                categoriaId: 1,
                publicado: true,
            },
            include: [
                {
                    model: Precio,
                    as: 'precio'
                }
            ],
            order: [['createdAt', 'DESC']]
        }),
        Propiedad.findAll({
            limits: 3,
            where: {
                categoriaId: 2,
                publicado: true,
            },
            include: [
                {
                    model: Precio,
                    as: 'precio'
                }
            ],
            order: [['createdAt', 'DESC']]
        })
    ])
    //console.log(categorias)

    res.render('inicio',{
        categorias,
        precios,
        casas,
        departamentos,
        csrfToken: req.csrfToken()
    })
};

const categoria = async (req, res) => {
    //-res.send('funciona categoria')
    const {id} = req.params
    
    const categoria = await Categoria.findByPk(id)
    if (!categoria) {
        return res.redirect('/404')
    }
    
    //obtener las propiedades de la categoria
    const propiedades = await Propiedad.findAll({
        where:{
            categoriaId: id,
            publicado: true,
        },
        include:[
            {model:Precio,as: 'precio'}
        ]
    })
    
    res.render('categoria',{
        pagina: `${categoria.nombre}s en venta`,
        propiedades,
        csrfToken: req.csrfToken()
    })
    
    //console.log(`🚀 => categoria => id:`, id);
};

const noEncontrado = (req, res) => {
    //res.send('funciona 404')
    res.render('404',{
        pagina: 'No encontrada',
        csrfToken: req.csrfToken()
    })
};

const buscador = async (req, res) => {
    //- res.send('funciona buscador')

    const {termino} = req.body

    //validar que termino no este vacio
    if(!termino.trim()){
        return res.redirect('back')
    }

    //consultar las propiedades 
    const propiedades = await Propiedad.findAll({
        where: {
            titulo:{
                [Sequelize.Op.like] :  `%${termino}%` 
            }
        },
        include:[
            { model: Precio, as: 'precio' }
        ]
    })

    //console.log(`🚀 caca`, propiedades);

    //res.send('funciona 404')
    res.render('busqueda',{
        pagina: 'Resultados de la Búsqueda',
        propiedades,
        csrfToken: req.csrfToken()
    })
};

export { inicio, categoria, noEncontrado, buscador };
