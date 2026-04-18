let metodoPagoSeleccionado = "";
const ALIAS_CVU = "Stephanieledda.bna";

// --- 1. ALERTAS PERSONALIZADAS (ESTILO ARÓMA) ---
function notificarAroma(mensaje) {
    const aviso = document.createElement('div');
    aviso.textContent = mensaje;
    
    Object.assign(aviso.style, {
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#190f1b',
        color: '#f9a1a9',
        padding: '15px 30px',
        borderRadius: '8px',
        border: '2px solid black',
        boxShadow: '-4px 4px 0px rgba(0,0,0,0.25)',
        zIndex: '10000',
        fontFamily: '"Hammersmith One", sans-serif',
        fontSize: '15px',
        textAlign: 'center',
        minWidth: '280px'
    });

    document.body.appendChild(aviso);

    setTimeout(() => {
        aviso.style.transition = "opacity 0.5s ease";
        aviso.style.opacity = "0";
        setTimeout(() => aviso.remove(), 500);
    }, 2500);
}

// --- 2. NAVEGACIÓN ENTRE PASOS (BACK-BUTTON LOGIC) ---
function volverAPago() {
    document.getElementById('modal-fecha').style.display = 'none';
    document.getElementById('modal-pago').style.display = 'flex';
}

function volverAFecha() {
    document.getElementById('modal-entrega').style.display = 'none';
    document.getElementById('modal-fecha').style.display = 'flex';
}

// --- 3. LÓGICA DEL CARRITO (RENDER Y CÁLCULOS) ---
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
            <button class="btn-eliminar" onclick="eliminarDelCarrito(${index})">✕</button>
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

function toggleCarrito() {
    const cart = document.getElementById('modal-carrito');
    if (cart) { 
        cart.classList.toggle('activo');
        renderizarCarrito(); 
    }
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

// --- 4. FLUJO DE COMPRA (MODALES) ---
function enviarPedidoWhatsApp() {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    if (carrito.length === 0) {
        notificarAroma("¡Ups! Tu bolsa está vacía 🧁");
        return;
    }
    // Resetear el método de pago al abrir el modal por primera vez
    metodoPagoSeleccionado = "";
    document.getElementById('bloque-alias').style.display = 'none';
    document.getElementById('finalizar-con-pago').style.display = 'none';
    
    document.getElementById('modal-pago').style.display = 'flex';
}

function irAFecha() {
    const nombreCliente = document.getElementById('nombre-cliente').value.trim();
    
    // VALIDACIÓN DOBLE: Nombre y Método de Pago
    if (!metodoPagoSeleccionado) {
        notificarAroma("Seleccioná un método de pago 💳");
        return;
    }
    if (!nombreCliente) {
        notificarAroma("Por favor, ingresá tu nombre 📝");
        return;
    }
    
    document.getElementById('modal-pago').style.display = 'none';
    const modalFecha = document.getElementById('modal-fecha');
    if(modalFecha) {
        modalFecha.style.display = 'flex';
        const inputFecha = document.getElementById('fecha-entrega');
        if(inputFecha) {
            const hoy = new Date().toISOString().split('T')[0];
            inputFecha.min = hoy;
        }
    }
}

// --- 5. EVENTOS DE CLICK (DELEGACIÓN) ---
document.addEventListener('click', (e) => {
    if (e.target.id === 'pago-efectivo') {
        metodoPagoSeleccionado = "Efectivo";
        // Ocultamos el alias por si antes habían tocado transferencia
        document.getElementById('bloque-alias').style.display = 'none';
        // Mostramos el botón siguiente para confirmar nombre y avanzar
        document.getElementById('finalizar-con-pago').style.display = 'block';
    }
    if (e.target.id === 'pago-transferencia') {
        metodoPagoSeleccionado = "Transferencia";
        document.getElementById('bloque-alias').style.display = 'block';
        document.getElementById('finalizar-con-pago').style.display = 'block';
        document.getElementById('alias-texto').textContent = ALIAS_CVU;
    }
    if (e.target.id === 'btn-copiar-alias') {
        navigator.clipboard.writeText(ALIAS_CVU);
        notificarAroma("Alias copiado al portapapeles ✅");
    }
    if (e.target.id === 'finalizar-con-pago') { 
        irAFecha(); 
    }
    if (e.target.id === 'confirmar-fecha') {
        const fecha = document.getElementById('fecha-entrega').value;
        if(!fecha) {
            notificarAroma("Por favor, selecciona una fecha 📅");
            return;
        }
        document.getElementById('modal-fecha').style.display = 'none';
        document.getElementById('modal-entrega').style.display = 'flex';
    }
    if (e.target.id === 'entrega-local') {
        enviarPedidoWhatsAppFinal('Retiro en local');
    }
    if (e.target.id === 'entrega-domicilio') {
        enviarPedidoWhatsAppFinal('Coordinar entrega');
    }
});

// --- 6. ENVÍO FINAL A WHATSAPP ---
function enviarPedidoWhatsAppFinal(tipoEntrega) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const num = "5492617028044";
    const nombreCliente = document.getElementById('nombre-cliente').value.trim();
    const fechaEntrega = document.getElementById('fecha-entrega').value;
    
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
    
    mensaje += `*Fecha Solicitada:* ${fechaFormateada}%0A`;
    mensaje += `*Método de Pago:* ${metodoPagoSeleccionado}%0A`;
    mensaje += `*Tipo de Entrega:* ${tipoEntrega}%0A`;
    
    if (tipoEntrega === 'Coordinar entrega') {
        mensaje += `_(Acordar punto medio por este chat)_%0A`;
    }
    
    const totalFinal = calcularTotalCarrito();
    mensaje += `*TOTAL:* $${totalFinal.toLocaleString('es-AR')} ARG%0A%0A`;
    mensaje += `*Mi nombre es:* ${nombreCliente}`;
    
    window.open(`https://wa.me/${num}?text=${mensaje}`, '_blank');
    
    // Limpieza de datos
    localStorage.setItem('carrito', JSON.stringify([]));
    actualizarContador();
    document.getElementById('modal-entrega').style.display = 'none';
    if(document.getElementById('modal-carrito')) {
        document.getElementById('modal-carrito').classList.remove('activo');
    }
}

// Inicializar contador al cargar
document.addEventListener('DOMContentLoaded', actualizarContador);
