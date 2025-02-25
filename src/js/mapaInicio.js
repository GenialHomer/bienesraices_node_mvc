(function () {
    const lat = 20.67444163271174;
    const lng = -103.38739216304566;
    const mapa = L.map('mapa-inicio').setView([lat, lng], 16);

    let markers = new L.FeatureGroup().addTo(mapa);

    let propiedades = [];

    // Filtros
    const filtros = {
        categoria: '',
        precio: ''
    };

    const categoriaSelect = document.querySelector('#categorias');
    const preciosSelect = document.querySelector('#precios');

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapa);

    const obtenerPropiedades = async () => {
        try {
            const url = '/api/propiedades';
            const respuesta = await fetch(url);
            const resultado = await respuesta.json();

            // Validar que el resultado tenga la estructura esperada
            if (!resultado.propiedades || !Array.isArray(resultado.propiedades)) {
                throw new Error('La respuesta de la API no tiene el formato esperado');
            }

            propiedades = resultado.propiedades; // Ahora sí es un array

            mostrarPropiedades(propiedades);

            //console.log(`🚀 => obtenerPropiedades => respuesta:`, respuesta);
            //console.log(`🚀 => obtenerPropiedades => propiedades:`, propiedades);

        } catch (error) {
            console.log(`🚀 => obtenerPropiedades => error:`, error);
        }
    };

    const mostrarPropiedades = (propiedades) => {
        //console.log('funciona');

        // Limpiar los marcadores anteriores
        markers.clearLayers();

        propiedades.forEach(propiedad => {
            const marker = new L.marker([propiedad?.lat, propiedad?.lng], {
                autoPan: true
            })
            .addTo(mapa)
            .bindPopup(`
                <p class="text-indigo-600 font-bold">${propiedad.categoria.nombre}</p>  
                <h1 class="text-xl font-extrabold uppercase my-3">${propiedad?.titulo}</h1>    
                <img src="/uploads/${propiedad.imagen}" alt="Imagen de la propiedad: ${propiedad.titulo}">
                <p class="text-gray-600 font-bold">${propiedad.precio.nombre}</p>
                <a href="/propiedad/${propiedad.id}" class="bg-indigo-600 block p-2 text-center font-bold uppercase"> Ver propiedad </a>
            `);

            markers.addLayer(marker);
        });
    };

    const filtrarPropiedades = () => {
        //console.log(propiedades);

        let resultado = propiedades.filter(filtrarCategoria).filter(filtrarPrecio);

        // Mostrar las propiedades filtradas
        mostrarPropiedades(resultado);
    };

    const filtrarCategoria = (propiedad) => {
        if (filtros.categoria) {
            return propiedad.categoria.id === filtros.categoria;
        }
        return true;
    };

    const filtrarPrecio = (propiedad) => {
        if (filtros.precio) {
            return propiedad.precio.id === filtros.precio;
        }
        return true;
    };

    // Filtradores de categorías y precios
    categoriaSelect.addEventListener('change', e => {
        filtros.categoria = +e.target.value;
        filtrarPropiedades();
    });

    preciosSelect.addEventListener('change', e => {
        filtros.precio = +e.target.value;
        filtrarPropiedades();
    });

    obtenerPropiedades();
})();
