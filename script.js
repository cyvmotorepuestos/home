const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyulddw1uLNlkw5O8_AQoIqbbtPENMWy_jnlkNMq-bOJ8UgT53dJC0QtSe2E2P2_AyRkA/exec';

let productsData = [];
let cart = [];
let currentCategory = 'Todos';
let displayedCount = 8; // Límite inicial de productos visibles

// Elementos del DOM
const productsGrid = document.getElementById('productsGrid');
const featuredGrid = document.getElementById('featuredGrid');
const searchInput = document.getElementById('searchInput');
const categoryFilters = document.getElementById('categoryFilters');
const cartToggleBtn = document.getElementById('cartToggleBtn');
const cartModal = document.getElementById('cartModal');
const closeCartBtn = document.getElementById('closeCartBtn');
const cartItemsList = document.getElementById('cartItemsList');
const cartTotalPrice = document.getElementById('cartTotalPrice');
const cartBadge = document.getElementById('cartBadge');
const whatsappCheckoutBtn = document.getElementById('whatsappCheckoutBtn');
const menuHamburger = document.getElementById('menuHamburger');
const navLinks = document.getElementById('navLinks');
const catalogSection = document.getElementById('catalogo');
const loadMoreContainer = document.getElementById('loadMoreContainer');
const loadMoreBtn = document.getElementById('loadMoreBtn');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    initCarousel();
    initNavigation();
    
    loadMoreBtn.addEventListener('click', () => {
        displayedCount += 8;
        filterProducts();
    });
});

function formatARS(amount) {
    return '$' + Number(amount).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// 1 & 5. CARGAR PRODUCTOS CON CACHÉ DE 15 MINUTOS Y STOCK ACTUALIZADO
async function fetchProducts(forceRefresh = false) {
    const cacheKey = 'cyv_products_cache';
    const cacheTimeKey = 'cyv_products_time';
    const now = new Date().getTime();
    const cachedData = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(cacheTimeKey);

    // Si existe caché y no han pasado 15 minutos (900000 ms), lo usamos
    if (!forceRefresh && cachedData && cachedTime && (now - cachedTime < 900000)) {
        productsData = JSON.parse(cachedData);
        renderCategories();
        filterProducts();
        renderFeaturedProducts();
        return;
    }

    try {
        const response = await fetch(WEB_APP_URL);
        const data = await response.json();
        productsData = data;

        // Guardar en caché local
        localStorage.setItem(cacheKey, JSON.stringify(productsData));
        localStorage.setItem(cacheTimeKey, now);

        renderCategories();
        filterProducts();
        renderFeaturedProducts();
    } catch (error) {
        console.error('Error al cargar productos de Google Sheets:', error);
        if (cachedData) {
            productsData = JSON.parse(cachedData);
        } else {
            // Datos de respaldo actualizados con la estructura correcta (incluyendo 'details')
            productsData = [
                { id: 1, name: 'Bujia 110', details: '', category_name: 'Electricidad', price: 1550, stock: 70, image: '', link_drive: 'https://lh3.googleusercontent.com/d/1w6iuWaGLgRY4Yd84BmU4lVyio6OXQdeI' },
                { id: 4, name: 'Kit de Distribución Smash 110', details: '', category_name: 'Motor', price: 4500, stock: 15, image: '', link_drive: 'https://lh3.googleusercontent.com/d/1enScfoHNn1Dh5ujcVYb1lO9C0XxkTVVf' },
                { id: 5, name: 'CDI 4pin', details: '', category_name: 'Electricidad', price: 8800, stock: 10, image: '', link_drive: 'https://lh3.googleusercontent.com/d/1uGp4GuhHL5JkzFLi1jwFvAcRDnvXd7Wf' },
                { id: 10, name: 'Cable de Embrague CG 150', details: '', category_name: 'Cables', price: 3200, stock: 25, image: '', link_drive: 'https://lh3.googleusercontent.com/d/1XyjEaCbbBbcODXB5krT6ypnyG6Hx74WF' }
            ];
        }
        renderCategories();
        filterProducts();
        renderFeaturedProducts();
    }
}

// 2. RENDERIZAR CATEGORÍAS
function renderCategories() {
    const categories = ['Todos', ...new Set(productsData.map(p => p.category_name))];
    categoryFilters.innerHTML = categories.map(cat => `
        <button class="filter-chip ${cat === currentCategory ? 'active' : ''}" data-category="${cat}">${cat}</button>
    `).join('');

    document.querySelectorAll('.filter-chip').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentCategory = e.target.getAttribute('data-category');
            displayedCount = 8; // Resetear contador al cambiar categoría
            filterProducts();
        });
    });
}

// 3 & 4. RENDERIZAR PRODUCTOS CON PAGINACIÓN DE 8 EN 8
function renderProducts(products) {
    if (products.length === 0) {
        productsGrid.innerHTML = `<p class="empty-cart-msg">No se encontraron productos.</p>`;
        loadMoreContainer.style.display = 'none';
        return;
    }

    const paginatedProducts = products.slice(0, displayedCount);

    productsGrid.innerHTML = paginatedProducts.map(p => {
        const inStock = p.stock > 0;
        return `
            <div class="product-card">
                <div class="product-img-wrapper">
                    <span class="product-tag">${p.category_name}</span>
                    <img src="${p.link_drive}" alt="${p.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=300&q=80'">
                </div>
                <div class="product-info">
                    <h3 class="product-title" title="${p.name}">${p.name}</h3>
                    <div class="product-meta">
                        <span class="product-price">${formatARS(p.price)}</span>
                        <span class="product-stock ${inStock ? 'in-stock' : 'out-stock'}" id="stock-text-${p.id}">
                            ${inStock ? `Stock: ${p.stock}` : 'Sin Stock'}
                        </span>
                    </div>
                    <button class="add-to-cart-btn" id="btn-cart-${p.id}" onclick="addToCart(${p.id})" ${!inStock ? 'disabled' : ''}>
                        <i class="fa-solid fa-cart-plus"></i> ${inStock ? 'Agregar al Carrito' : 'Agotado'}
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Mostrar u ocultar botón "Cargar más"
    if (displayedCount < products.length) {
        loadMoreContainer.style.display = 'block';
    } else {
        loadMoreContainer.style.display = 'none';
    }
}

// DESTACADOS
function renderFeaturedProducts() {
    const featured = productsData.filter(p => p.stock > 0).slice(0, 4);
    featuredGrid.innerHTML = featured.map(p => `
        <div class="product-card">
            <div class="product-img-wrapper">
                <span class="product-tag">Destacado</span>
                <img src="${p.link_drive}" alt="${p.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=300&q=80'">
            </div>
            <div class="product-info">
                <h3 class="product-title" title="${p.name}">${p.name}</h3>
                <div class="product-meta">
                    <span class="product-price">${formatARS(p.price)}</span>
                    <span class="product-stock in-stock">Stock: ${p.stock}</span>
                </div>
                <button class="add-to-cart-btn" onclick="addToCart(${p.id})">
                    <i class="fa-solid fa-cart-plus"></i> Agregar al Carrito
                </button>
            </div>
        </div>
    `).join('');
}

// BUSCADOR Y FILTROS
searchInput.addEventListener('input', () => {
    displayedCount = 8;
    filterProducts();
});

function filterProducts() {
    const query = searchInput.value.toLowerCase();
    const filtered = productsData.filter(p => {
        const matchesCategory = currentCategory === 'Todos' || p.category_name === currentCategory;
        const matchesQuery = p.name.toLowerCase().includes(query);
        return matchesCategory && matchesQuery;
    });
    renderProducts(filtered);
}

// CARRUSEL
function initCarousel() {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.dot');
    let currentSlide = 0;

    function showSlide(index) {
        slides.forEach(s => s.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));
        slides[index].classList.add('active');
        dots[index].classList.add('active');
    }

    setInterval(() => {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }, 5000);

    dots.forEach((dot, idx) => {
        dot.addEventListener('click', () => {
            currentSlide = idx;
            showSlide(currentSlide);
        });
    });
}

// CARRITO Y DESCUENTO INSTANTÁNEO DE STOCK
cartToggleBtn.addEventListener('click', () => cartModal.classList.add('open'));
closeCartBtn.addEventListener('click', () => cartModal.classList.remove('open'));

function addToCart(productId) {
    const product = productsData.find(p => p.id == productId);
    if (!product || product.stock <= 0) return;

    product.stock--;

    const existingItem = cart.find(item => item.id == productId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    updateStockUI(productId, product.stock);
    updateCartUI();
    updateFeaturedStock();
}

function updateCartQuantity(productId, change) {
    const item = cart.find(i => i.id == productId);
    const product = productsData.find(p => p.id == productId);
    if (!item) return;

    if (change > 0) {
        if (product.stock > 0) {
            product.stock--;
            item.quantity++;
        } else {
            alert('Stock máximo alcanzado.');
            return;
        }
    } else if (change < 0) {
        item.quantity--;
        product.stock++;
        if (item.quantity <= 0) {
            removeFromCart(productId);
            return;
        }
    }

    updateStockUI(productId, product.stock);
    updateCartUI();
    updateFeaturedStock();
}

function removeFromCart(productId) {
    const item = cart.find(i => i.id == productId);
    const product = productsData.find(p => p.id == productId);
    if (item && product) {
        product.stock += item.quantity;
    }
    cart = cart.filter(item => item.id != productId);
    updateStockUI(productId, product.stock);
    updateCartUI();
    updateFeaturedStock();
}

function updateStockUI(productId, newStock) {
    const stockEl = document.getElementById(`stock-text-${productId}`);
    const btnEl = document.getElementById(`btn-cart-${productId}`);
    if (stockEl && btnEl) {
        if (newStock > 0) {
            stockEl.textContent = `Stock: ${newStock}`;
            stockEl.className = 'product-stock in-stock';
            btnEl.disabled = false;
            btnEl.innerHTML = `<i class="fa-solid fa-cart-plus"></i> Agregar al Carrito`;
        } else {
            stockEl.textContent = 'Sin Stock';
            stockEl.className = 'product-stock out-stock';
            btnEl.disabled = true;
            btnEl.innerHTML = `<i class="fa-solid fa-cart-plus"></i> Agotado`;
        }
    }
}

function updateFeaturedStock() {
    renderFeaturedProducts();
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartBadge.textContent = totalItems;

    if (cart.length === 0) {
        cartItemsList.innerHTML = `<p class="empty-cart-msg">El carrito está vacío</p>`;
        cartTotalPrice.textContent = '$0.00';
        whatsappCheckoutBtn.disabled = true;
        return;
    }

    let total = 0;
    cartItemsList.innerHTML = cart.map(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        return `
            <div class="cart-item-card">
                <img src="${item.link_drive}" class="cart-item-img" alt="${item.name}">
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${item.name}</h4>
                    <span class="cart-item-price">${formatARS(item.price)} c/u</span>
                    <div class="cart-item-controls">
                        <button onclick="updateCartQuantity(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateCartQuantity(${item.id}, 1)">+</button>
                    </div>
                </div>
                <button class="remove-item-btn" onclick="removeFromCart(${item.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
    }).join('');

    cartTotalPrice.textContent = formatARS(total);
    whatsappCheckoutBtn.disabled = false;
}

// FACTURACIÓN PDF Y CHECKOUT DE WHATSAPP
whatsappCheckoutBtn.addEventListener('click', async () => {
    if (cart.length === 0) return alert('El carrito está vacío');

    try {
        const payload = {
            items: cart.map(item => ({ id: item.id, quantity: item.quantity }))
        };

        await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(payload)
        });
        
        localStorage.removeItem('cyv_products_cache');
        localStorage.removeItem('cyv_products_time');
    } catch (err) {
        console.error("Error al actualizar el stock en Google Sheets:", err);
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const orderNum = Math.floor(100000 + Math.random() * 900000);
    const dateStr = new Date().toLocaleDateString('es-AR');

    const logoImg = document.getElementById('brandLogoImg');
    try {
        const canvas = document.createElement('canvas');
        canvas.width = logoImg.naturalWidth || 200;
        canvas.height = logoImg.naturalHeight || 80;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(logoImg, 0, 0, canvas.width, canvas.height);
        const logoBase64 = canvas.toDataURL('image/jpeg');
        doc.addImage(logoBase64, 'JPEG', 14, 12, 35, 15);
    } catch (e) {
        console.log("Continuando sin logo por restricciones de origen:", e);
    }

    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("CyV DISTRIBUIDORA", 14, 32);
    
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Moto Repuestos por Mayor y Menor", 14, 37);
    doc.text("La Rioja Capital, Argentina | Tel: +54 9 380 4722571", 14, 41);

    doc.setFillColor(30, 41, 59);
    doc.rect(125, 14, 71, 24, 'F');
    doc.setFontSize(10);
    doc.setTextColor(220, 38, 38);
    doc.text("PRESUPUESTO DE PEDIDO", 129, 21);
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`Comprobante N°: #${orderNum}`, 129, 27);
    doc.text(`Fecha: ${dateStr}`, 129, 32);

    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(0.8);
    doc.line(14, 46, 196, 46);

    const tableData = [];
    let totalAmount = 0;

    cart.forEach(item => {
        const subtotal = item.price * item.quantity;
        totalAmount += subtotal;
        tableData.push([
            item.id || '-',
            item.name,
            item.quantity.toString(),
            formatARS(item.price),
            formatARS(subtotal)
        ]);
    });

    doc.autoTable({
        startY: 52,
        head: [['Código', 'Descripción del Repuesto', 'Cant.', 'Precio Unit.', 'Subtotal']],
        body: tableData,
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 8, cellPadding: 4 },
        columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 92 },
            2: { cellWidth: 16, halign: 'center' },
            3: { cellWidth: 30, halign: 'right' },
            4: { cellWidth: 34, halign: 'right' }
        }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    
    doc.setFillColor(220, 38, 38);
    doc.rect(120, finalY, 76, 12, 'F');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text("TOTAL ESTIMADO:", 124, finalY + 8);
    doc.text(formatARS(totalAmount), 193, finalY + 8, { align: 'right' });

    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("Gracias por elegir CyV Distribuidora. Conserve este comprobante para su pedido por WhatsApp.", 14, finalY + 25);

    const fileName = `Presupuesto_CV_${orderNum}.pdf`;
    doc.save(fileName);

    alert(`✅ La factura digital #${orderNum} se ha descargado correctamente.\n\nA continuación se abrirá WhatsApp. Adjunta el PDF descargado para confirmar tu pedido.`);

    cart = [];
    updateCartUI();
    cartModal.classList.remove('open');
    fetchProducts(true);

    const waText = `Hola CyV Distribuidora, acabo de generar mi presupuesto (Pedido #${orderNum}) por un total de ${formatARS(totalAmount)}.\n\nAdjunto el archivo PDF con la factura detallada.`;
    window.open(`https://wa.me/5493804722571?text=${encodeURIComponent(waText)}`, '_blank');
});

// NAVEGACIÓN
function initNavigation() {
    menuHamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    const navButtons = document.querySelectorAll('.nav-links .nav-btn');

    navButtons.forEach(link => {
        link.addEventListener('click', (e) => {
            navLinks.classList.remove('active');
            
            navButtons.forEach(b => b.classList.remove('active'));
            link.classList.add('active');

            const targetId = link.getAttribute('href');
            if (targetId === '#catalogo') {
                catalogSection.style.display = 'block';
            } else if (targetId === '#inicio') {
                catalogSection.style.display = 'none';
            }
        });
    });

    ['ctaCatalogoBtn', 'ctaCatalogoBtn2', 'ctaCatalogoBtn3'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', () => {
                catalogSection.style.display = 'block';
                navButtons.forEach(b => b.classList.remove('active'));
                document.querySelector('.nav-links a[href="#catalogo"]').classList.add('active');
            });
        }
    });
}