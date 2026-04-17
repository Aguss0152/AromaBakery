async function obtenerDatos() {
    const URL_SPREADSHEET = window.APP_CONFIG?.SHEET_URL || '<REPLACE_WITH_GOOGLE_SHEETS_CSV_URL>';
    try {
        const respuesta = await fetch(URL_SPREADSHEET);
        const data = await respuesta.text();
        const lineasExcel = data.split(/\r?\n/);
        const filas = lineasExcel.map(f => f.trim()).filter(f => f.length > 0);
        
        const contenedor = document.getElementById('contenedor-productos');
        const plantilla = document.getElementById('plantilla-producto').content;
        const menuUl = document.getElementById('menu-categorias');
        
        contenedor.innerHTML = '';
        menuUl.innerHTML = '';
        
        // --- LÓGICA DE TEXTOS DINÁMICOS ---
        const leerCeldaG = (indiceFila) => {
            if (filas[indiceFila]) {
                const columnas = filas[indiceFila].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/"/g, "").trim());
                return columnas[4] || "";
            }
            return "";
        };
        
        const txtEncabezado = leerCeldaG(1);
        const txtParrafo = leerCeldaG(14);
        const txtCinta = leerCeldaG(25);
        
        if (txtEncabezado && document.getElementById('encabezado-dinamico'))
            document.getElementById('encabezado-dinamico').textContent = txtEncabezado;
        if (txtParrafo && document.getElementById('parrafo-dinamico'))
            document.getElementById('parrafo-dinamico').textContent = txtParrafo;
        if (txtCinta && document.getElementById('cinta-dinamica')) {
            document.getElementById('cinta-dinamica').textContent = txtCinta;
            if (document.getElementById('cinta-dinamica-2'))
                document.getElementById('cinta-dinamica-2').textContent = txtCinta;
        }
        
        const todosLosProductosParaSugerir = [];
        let categoriaActual = '';
        
        function esFilaCategoria(columnas) {
            const nombreCol = (columnas[0] || '').trim();
            const precioCol = (columnas[1] || '').trim();
            // Si tiene nombre pero no precio ni nada en las columnas siguientes, es categoría
            const resto = columnas.slice(2).map(c => (c || '').trim()).join('');
            return nombreCol !== '' && precioCol === '' && resto === '';
        }
        
        function extraerCatalogoPorRango(inicioFila, finFila) {
            const lista = [];
            for (let index = inicioFila - 1; index < finFila && index < lineasExcel.length; index++) {
                const fila = lineasExcel[index] || '';
                const columnas = fila.split(/,(?=(?:(?:[^\"]*\"){2})*[^\"]*$)/).map(c => c.replace(/\"/g, "").trim());
                const nombre = (columnas[0] || '').trim();
                const precioRaw = (columnas[1] || '').trim();
                if (!nombre || !precioRaw || isNaN(precioRaw.replace(/[$. ,]/g, ''))) continue;
                lista.push({
                    nombre: nombre,
                    precio: precioRaw,
                    imagen: formatearLinkImagen((columnas[3] || '').trim()), // Columna D
                    descripcion: columnas[2] || "",
                    categoria: 'Bebidas'
                });
            }
            return lista;
        }
        
        // Procesamiento de productos y categorías
        filas.forEach((fila, index) => {
            if (index === 0) return; 
            
            const columnas = fila.split(/,(?=(?:(?:[^\"]*\"){2})*[^"]*$)/).map(c => c.replace(/"/g, "").trim());
            const nombre = columnas[0];
            const precioRaw = columnas[1];
            
            if (esFilaCategoria(columnas)) {
                categoriaActual = nombre.trim();
                const titulo = document.createElement('h2');
                titulo.className = 'titulo-categoria-separador';
                titulo.id = `cat-${nombre.toLowerCase().replace(/\s+/g, '-')}`;
                titulo.textContent = nombre;
                contenedor.appendChild(titulo);
                
                const li = document.createElement('li');
                li.innerHTML = `<a href="#${titulo.id}">${nombre}</a>`;
                li.onclick = () => toggleMenu();
                menuUl.appendChild(li);
                return;
            }
            
            if (precioRaw && !isNaN(precioRaw.replace(/[$. ,]/g, ''))) {
                const imagenURL = formatearLinkImagen((columnas[3] || '').trim()); // Columna D
                
                const productoData = {
                    nombre: nombre,
                    precio: precioRaw,
                    imagen: imagenURL,
                    descripcion: columnas[2] || "",
                    categoria: categoriaActual
                };
                
                todosLosProductosParaSugerir.push(productoData);

                // Renderizado en el DOM
                const instancia = plantilla.cloneNode(true);
                instancia.querySelector('.producto-imagen').src = imagenURL;
                instancia.querySelector('.nombre').textContent = nombre;
                instancia.querySelector('.precio').textContent = `${precioRaw} ARG`;
                
                const tarjeta = instancia.querySelector('.tarjeta-producto');
                tarjeta.onclick = () => {
                    localStorage.setItem('productoSeleccionado', JSON.stringify(productoData));
                    window.location.href = 'html/detalle-producto.html';
                };
                contenedor.appendChild(instancia);
            }
        });
        
        localStorage.setItem('todosLosProductos', JSON.stringify(todosLosProductosParaSugerir));
        const bebidasCatalogo = extraerCatalogoPorRango(75, 90);
        localStorage.setItem('bebidasCatalogo', JSON.stringify(bebidasCatalogo));
        
    } catch (e) { console.error("Error cargando datos:", e); }
}

function formatearLinkImagen(link) {
    if (!link) return 'https://via.placeholder.com/300';
    link = link.trim();
    if (link.includes('drive.google.com')) {
        const match = link.match(/\/d\/(.+?)\//) || link.match(/id=(.+?)(&|$)/);
        return match ? `https://wsrv.nl/?url=https://drive.google.com/uc?id=${match[1]}` : link;
    }
    return link;
}

function toggleMenu() {
    const btn = document.getElementById('btn-menu');
    const menu = document.getElementById('menu-lat');
    if (btn) btn.classList.toggle('abierto');
    if (menu) menu.classList.toggle('activo');
}

if(document.getElementById('btn-menu')) {
    document.getElementById('btn-menu').onclick = toggleMenu;
}

obtenerDatos();
