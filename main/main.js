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
        
        const elEncabezado = document.getElementById('encabezado-dinamico');
        if (elEncabezado) {
            if (txtEncabezado) {
                elEncabezado.textContent = txtEncabezado;
                elEncabezado.style.display = ""; 
            } else {
                elEncabezado.style.display = "none";
            }
        }

        const elParrafo = document.getElementById('parrafo-dinamico');
        if (elParrafo) {
            if (txtParrafo) {
                elParrafo.textContent = txtParrafo;
                elParrafo.style.display = ""; 
            } else {
                elParrafo.style.display = "none";
            }
        }

        // --- MANEJO DE CINTA DE PROMOCIÓN ---
        const contenedorCinta = document.querySelector('.oferta-container');
        const elCinta1 = document.getElementById('cinta-dinamica');
        const elCinta2 = document.getElementById('cinta-dinamica-2');
        
        if (txtCinta && txtCinta.trim() !== "") {
            if (contenedorCinta) contenedorCinta.style.display = "block";
            if (elCinta1) elCinta1.textContent = txtCinta;
            if (elCinta2) elCinta2.textContent = txtCinta;
        } else {
            if (contenedorCinta) contenedorCinta.style.display = "none";
        }
        
        const todosLosProductosParaSugerir = [];
        let categoriaActual = '';
        
        function esFilaCategoria(columnas) {
            const nombreCol = (columnas[0] || '').trim();
            const precioCol = (columnas[1] || '').trim();
            const resto = columnas.slice(2).map(c => (c || '').trim()).join('');
            return nombreCol !== '' && precioCol === '' && resto === '';
        }
        
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
                li.onclick = () => toggleMenu(); // Cierra el menú al clickear categoría
                menuUl.appendChild(li);
                return;
            }
            
            if (precioRaw && !isNaN(precioRaw.replace(/[$. ,]/g, ''))) {
                const imagenURL = formatearLinkImagen((columnas[3] || '').trim());
                
                const productoData = {
                    nombre: nombre,
                    precio: precioRaw,
                    imagen: imagenURL,
                    descripcion: columnas[2] || "",
                    categoria: categoriaActual
                };
                
                todosLosProductosParaSugerir.push(productoData);

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

// FUNCIÓN TOGGLE (Se encarga de abrir y cerrar)
function toggleMenu() {
    const btn = document.getElementById('btn-menu');
    const menu = document.getElementById('menu-lat');
    if (btn) btn.classList.toggle('abierto');
    if (menu) menu.classList.toggle('activo');
}

// ASIGNACIÓN DE EVENTOS (Aquí es donde se activa el botón hamburguesa)
document.addEventListener('DOMContentLoaded', () => {
    const btnHamburguesa = document.getElementById('btn-menu');
    if (btnHamburguesa) {
        btnHamburguesa.onclick = toggleMenu;
    }

    // Redes Sociales
    const btnInstagram = document.getElementById('instagram');
    const btnFacebook = document.getElementById('facebook');

    if (btnInstagram) {
        btnInstagram.addEventListener('click', () => {
            window.open('https://www.instagram.com/aromaabakery?igsh=ZWczb3drZTdpdnpn', '_blank');
        });
    }

    if (btnFacebook) {
        btnFacebook.addEventListener('click', () => {
            window.open('https://www.facebook.com/share/1AcyaVy2wN/', '_blank');
        });
    }
});

obtenerDatos();
