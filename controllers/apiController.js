import { Precio, Categoria, Propiedad } from '../models/index.js';


const propiedades = async (req, res) => {

    const propiedades = await Propiedad.findAll({
        where: {
            publicado: true,  // Solo propiedades que están publicadas (publicado = true)
        },
        include: [
            { model: Categoria, as: 'categoria'},
            { model: Precio, as: 'precio'},
            
        ]
    })


    res.json({
        propiedades
    })
};


export { propiedades };
