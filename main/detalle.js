document.addEventListener('DOMContentLoaded', () => {
    const producto = JSON.parse(localStorage.getItem('productoSeleccionado'));
    let cantidad = 1;

    if (!producto) {
        window.location.href = '../index.html';
        return;
    }

    // 1. Cargar datos básicos
    document.getElementById('titulo-detalle').textContent = producto.nombre;
    document.getElementById('precio-detalle').textContent = `${producto.precio} ARG`;
    document.getElementById('img-detalle').src = producto.imagen;
    document.getElementById('descripcion-detalle').textContent = producto.descripcion || "Sin descripción.";

    // 2. Selector de Cantidad
    const btnMenos = document.getElementById('btn-menos');
    const btnMas = document.getElementById('btn-mas');
    const cantidadTxt = document.getElementById('cantidad-numero');

    btnMenos.onclick = () => { 
        if(cantidad > 1) { 
            cantidad--; 
            cantidadTxt.textContent = cantidad; 
        } 
    };
    btnMas.onclick = () => { 
        cantidad++; 
        cantidadTxt.textContent = cantidad; 
    };

    // 3. Agregar al Carrito (Incluyendo categoría)
    document.getElementById('agregar-carrito').onclick = () => {
        let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

        carrito.push({
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: cantidad,
            imagen: producto.imagen,
            categoria: producto.categoria || "General" // Se agrega la categoría aquí
        });

        localStorage.setItem('carrito', JSON.stringify(carrito));
        mostrarToast(`¡${producto.nombre} agregado al carrito!`);

        cantidad = 1;
        cantidadTxt.textContent = "1";
    };

    // 4. Botón Directo WhatsApp (Un solo producto)
    document.getElementById('comprar-producto').onclick = () => {
        const numero = "5492617028044";
        const precioBase = parseFloat(producto.precio.replace(/[^\d.]/g, '')) || 0;
        const precioTotal = precioBase * cantidad;

        const msg = `¡Hola! Quiero: *(${cantidad}x) ${producto.nombre}*\nCategoría: ${producto.categoria}\nPrecio Total: $${precioTotal.toLocaleString('es-AR')} ARG`;
        window.open(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    cargarSugeridos();
});

function mostrarToast(mensaje) {
    const toast = document.createElement('div');
    toast.textContent = mensaje;
    Object.assign(toast.style, {
        position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
        backgroundColor: '#333', color: '#fff', padding: '12px 24px', borderRadius: '8px', zIndex: '1000', fontSize: '14px'
    });
    document.body.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 2500);
}

async function cargarSugeridos() {
    const actual = JSON.parse(localStorage.getItem('productoSeleccionado'));
    const contenedor = document.getElementById('contenedor-otros-productos');
    const tituloSugeridos = document.querySelector('.sugeridos h2');
    
    if (!contenedor || !actual) return;

    if (tituloSugeridos) tituloSugeridos.textContent = "También te puede gustar";

    let todos = JSON.parse(localStorage.getItem('todosLosProductos')) || [];
    if (todos.length === 0) return;

    let filtrados = todos.filter(p => p.nombre !== actual.nombre);
    const sugeridosAzar = filtrados.sort(() => 0.5 - Math.random()).slice(0, 10);

    contenedor.innerHTML = "";
    
    sugeridosAzar.forEach(prod => {
        const item = document.createElement('div');
        item.className = 'item-sugerido';
        item.innerHTML = `
            <img src="${prod.imagen}">
            <div class="info-sugerido">
                <p>${prod.nombre}</p>
                <b>${prod.precio}</b>
            </div>`;
        item.onclick = () => { 
            localStorage.setItem('productoSeleccionado', JSON.stringify(prod)); 
            window.location.reload(); 
        };
        contenedor.appendChild(item);
    });
}
