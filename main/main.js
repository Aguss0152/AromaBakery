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
        
        const leerCeldaG = (indiceFila) => {
            if (filas[indiceFila]) {
                const columnas = filas[indiceFila].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/"/g, "").trim());
                return columnas[4] || "";
            }
            return "";
        };
        
        // --- LÓGICA DE TEXTOS DINÁMICOS CON EFECTO ---
        const txtEncabezado = leerCeldaG(1); // Lee: "Mesa dulce/Catering/Eventos..."
        const txtParrafo = leerCeldaG(14);
        const txtCinta = leerCeldaG(25);
        
        const elEncabezado = document.getElementById('encabezado-dinamico');
        if (elEncabezado && txtEncabezado) {
            // Dividimos el texto por la barra "/" para crear el array de palabras
            const palabrasParaEfecto = txtEncabezado.split('/').map(p => p.trim());
            iniciarEfectoEscritura(elEncabezado, palabrasParaEfecto);
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
            const columnas = fila.split(/,(?=(?:(?:[^\"]*\"){2})*[^\"]*$)/).map(c => c.replace(/"/g, "").trim());
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

// --- FUNCIÓN DEL EFECTO MÁQUINA DE ESCRIBIR ---
function iniciarEfectoEscritura(elemento, palabras) {
    let palabraIndex = 0;
    let charIndex = 0;
    let estaBorrando = false;
    let velocidad = 150;

    function animar() {
        const palabraActual = palabras[palabraIndex];
        
        if (estaBorrando) {
            elemento.textContent = palabraActual.substring(0, charIndex - 1);
            charIndex--;
            velocidad = 50; 
        } else {
            elemento.textContent = palabraActual.substring(0, charIndex + 1);
            charIndex++;
            velocidad = 150;
        }

        if (!estaBorrando && charIndex === palabraActual.length) {
            estaBorrando = true;
            velocidad = 2000; // Tiempo que queda la palabra escrita
        } else if (estaBorrando && charIndex === 0) {
            estaBorrando = false;
            palabraIndex = (palabraIndex + 1) % palabras.length;
            velocidad = 500; 
        }

        setTimeout(animar, velocidad);
    }
    animar();
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

function finalizarCompra() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const listaItems = document.querySelector('.lista-items');

    if (carrito.length === 0) {
        listaItems.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #fff; font-family: 'Hammersmith One', sans-serif;">
                <p style="font-size: 1.2rem; margin-bottom: 10px;">¡Ups! Tu bolsa está vacía.</p>
                <span style="font-size: 2rem;">🧁</span>
                <p style="font-size: 0.9rem; margin-top: 10px; opacity: 0.8;">Agregá algo rico para continuar.</p>
            </div>
        `;
        return;
    }
    
    if (typeof enviarPedidoWhatsApp === "function") {
        enviarPedidoWhatsApp();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const btnHamburguesa = document.getElementById('btn-menu');
    if (btnHamburguesa) btnHamburguesa.onclick = toggleMenu;

    const btnCarrito = document.querySelector('.icono-carrito');
    if (btnCarrito) {
        btnCarrito.onclick = () => {
            if (typeof toggleCarrito === "function") toggleCarrito();
        };
    }

    const btnFinalizar = document.querySelector('.btn-finalizar');
    if (btnFinalizar) btnFinalizar.onclick = finalizarCompra;

    const btnInstagram = document.getElementById('instagram');
    const btnFacebook = document.getElementById('facebook');
    const btnTelar = document.getElementById('telarweb');
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
    if (btnTelar) {
        btnTelar.addEventListener('click', () => 
            {
                window.open('https://telarhub.vercel.app/')
        });
    }
});

obtenerDatos();
