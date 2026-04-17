let metodoPagoSeleccionado = "";
const ALIAS_CVU = "stephanieledda.bna";

function renderizarCarrito() {
    const lista = document.getElementById('lista-carrito');
    const totalElement = document.getElementById('total-carrito');
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    
    lista.innerHTML = "";
    let totalAcumulado = 0;
    
    carrito.forEach((item, index) => {
        let precioLimpio = item.precio.replace('$', '').replace(/\s/g, '').replace(/,/g, '').trim();
        let precioBase = parseFloat(precioLimpio);
        let valorIndividualTotal = precioBase * (item.cantidad || 1);
        
        if (!isNaN(valorIndividualTotal)) {
            totalAcumulado += valorIndividualTotal;
        }
        
        const div = document.createElement('div');
        div.className = 'item-carrito';
        div.innerHTML = `
            <img src="${item.imagen}" width="50" style="border-radius: 5px; object-fit: cover;">
            <div class="item-info">
                <p><strong>(${item.cantidad || 1}x) ${item.nombre}</strong></p>
                <p><small>${item.categoria}</small></p>
                <p><strong>$${valorIndividualTotal.toLocaleString('es-AR')}</strong></p>
            </div>
            <button class="btn-eliminar" onclick="eliminarDelCarrito(${index})" style="color:#d4d4d4;">✕</button>
        `;
        lista.appendChild(div);
    });
    
    totalElement.textContent = totalAcumulado.toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function calcularTotalCarrito() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    return carrito.reduce((acum, item) => {
        const precioLimpio = item.precio.replace('$', '').replace(/\s/g, '').replace(/,/g, '').trim();
        const precioBase = parseFloat(precioLimpio) || 0;
        return acum + (precioBase * (item.cantidad || 1));
    }, 0);
}

function enviarPedidoWhatsApp() {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    if (carrito.length === 0) {
        alert("El carrito está vacío");
        return;
    }
    const modal = document.getElementById('modal-pago');
    if (modal) modal.style.display = 'flex';
}

document.addEventListener('click', (e) => {
    if (e.target.id === 'pago-efectivo') {
        metodoPagoSeleccionado = "Efectivo";
        irAFecha();
    }
    if (e.target.id === 'pago-transferencia') {
        metodoPagoSeleccionado = "Transferencia";
        document.getElementById('bloque-alias').style.display = 'block';
        document.getElementById('finalizar-con-pago').style.display = 'block';
        document.getElementById('alias-texto').textContent = ALIAS_CVU;
    }
    if (e.target.id === 'btn-copiar-alias') {
        navigator.clipboard.writeText(ALIAS_CVU);
        alert("Alias copiado al portapapeles");
    }
    if (e.target.id === 'finalizar-con-pago') { 
        irAFecha(); 
    }
});

// Nuevo paso: Mostrar calendario
function irAFecha() {
    const nombreCliente = document.getElementById('nombre-cliente').value.trim();
    if (!nombreCliente) {
        alert("Por favor, ingresa tu nombre");
        return;
    }
    
    // Ocultar modal de pago y mostrar el de fecha (Debes tener un modal con id 'modal-fecha')
    document.getElementById('modal-pago').style.display = 'none';
    const modalFecha = document.getElementById('modal-fecha');
    if(modalFecha) {
        modalFecha.style.display = 'flex';
        // Configurar fecha mínima como hoy
        const inputFecha = document.getElementById('fecha-entrega');
        if(inputFecha) {
            const hoy = new Date().toISOString().split('T')[0];
            inputFecha.min = hoy;
        }
    } else {
        // Si no tienes el modal creado, salta directo a entrega (emergencia)
        ejecutarEnvioFinal();
    }
}

// Botón de confirmar fecha en el modal
if(document.getElementById('confirmar-fecha')) {
    document.getElementById('confirmar-fecha').onclick = () => {
        const fecha = document.getElementById('fecha-entrega').value;
        if(!fecha) {
            alert("Por favor, selecciona una fecha");
            return;
        }
        document.getElementById('modal-fecha').style.display = 'none';
        document.getElementById('modal-entrega').style.display = 'flex';
    };
}

function ejecutarEnvioFinal() {
    document.getElementById('modal-pago').style.display = 'none';
    document.getElementById('modal-entrega').style.display = 'flex';
}

function eliminarDelCarrito(index) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    carrito.splice(index, 1);
    localStorage.setItem('carrito', JSON.stringify(carrito));
    renderizarCarrito();
    actualizarContador();
}

function actualizarContador() {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const contador = document.getElementById('carrito-count');
    if (contador) contador.textContent = carrito.length;
}

function toggleCarrito() {
    const cart = document.getElementById('modal-carrito');
    if (cart) { 
        cart.classList.toggle('activo');
        renderizarCarrito(); 
    }
}

function enviarPedidoWhatsAppFinal(tipoEntrega) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const num = "5492617028044";
    const nombreCliente = document.getElementById('nombre-cliente').value.trim();
    const fechaEntrega = document.getElementById('fecha-entrega').value;
    
    // Formatear fecha para el mensaje
    const [year, month, day] = fechaEntrega.split('-');
    const fechaFormateada = `${day}/${month}/${year}`;

    let mensaje = "¡Hola! Quisiera realizar este pedido de Aróma Bakery:%0A%0A";
    
    carrito.forEach(item => {
        let precioLimpio = item.precio.replace('$', '').replace(/\s/g, '').replace(/,/g, '').trim();
        let precioBase = parseFloat(precioLimpio);
        let subtotal = precioBase * (item.cantidad || 1);
        
        mensaje += `*${item.categoria.toUpperCase()}*%0A`;
        mensaje += `• *(${item.cantidad || 1}x) ${item.nombre}*%0A`;
        mensaje += `  Subtotal: $${subtotal.toLocaleString('es-AR')}%0A%0A`;
    });
    
    mensaje += `*Fecha Solicitada:* ${fechaFormateada}%0A`; // Agregado a WhatsApp
    mensaje += `*Método de Pago:* ${metodoPagoSeleccionado}%0A`;
    mensaje += `*Tipo de Entrega:* ${tipoEntrega}%0A`;
    
    if (tipoEntrega === 'Coordinar entrega') {
        mensaje += `_(Acordar punto medio por este chat)_%0A`;
    }
    
    const totalFinal = calcularTotalCarrito();
    mensaje += `*TOTAL:* $${totalFinal.toLocaleString('es-AR')} ARG%0A%0A`;
    mensaje += `*Mi nombre es:* ${nombreCliente}`;
    
    window.open(`https://wa.me/${num}?text=${mensaje}`, '_blank');
    localStorage.setItem('carrito', JSON.stringify([]));
    actualizarContador();
    document.getElementById('modal-entrega').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', actualizarContador);

document.getElementById('entrega-local').addEventListener('click', () => {
    enviarPedidoWhatsAppFinal('Retiro en local');
});

document.getElementById('entrega-domicilio').addEventListener('click', () => {
    enviarPedidoWhatsAppFinal('Coordinar entrega');
});
