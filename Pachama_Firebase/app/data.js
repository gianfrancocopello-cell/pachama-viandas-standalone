// Datos del menú del día — Pachama Viandas

window.MENU_DATA = {
  get fecha() {
    const d = new Date();
    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return { dia: dias[d.getDay()], numero: d.getDate(), mes: meses[d.getMonth()] };
  },
  home: {
    titleL1: 'Comida hecha',
    titleL2: 'en casa,',
    titleL3: 'entregada hoy.',
    desc: 'Elegí el menú del día. Pedís hasta las 12:30.',
    delivery: 'Zona Industrial – Barrio Sur, Comodoro Rivadavia.',
    hours: 'Entrega 12:00 – 13:30',
    whatsapp: '+54 9 2974 27-9849',
    logoOffset: { x: 0, y: 0 },
    cerrado: false,
    cerradoMensaje: 'Muchas gracias por su compra',
    cerradoColor: '#c46a3c',
    cerradoFont: 'Instrument Serif',
    cerradoFontSize: 48,
    comboTitulo: 'Comidas y Ensaladas',
    comboBajada: 'El menú del día',
    comboDescripcion: 'Elegí entre nuestras ensaladas y comidas preparadas hoy.',
    comboPrecioDesde: 6400,
    descuentoActivo: false,
    descuentoPorcentaje: 10,
    descuentoDesde: '',
    descuentoHasta: '',
    descuentoEnsalada: true,
    descuentoComida: true,
    descuentoPlatos: true,
  },
  opciones: {
    1: {
      titulo: 'Opción 1',
      bajada: 'Más abundante',
      descripcion: 'Porciones generosas, pensadas para almuerzos completos.',
      precioDesde: 8900,
      categorias: ['ensaladas', 'comidas'],
    },
    2: {
      titulo: 'Opción 2',
      bajada: 'Más liviana',
      descripcion: 'Porciones medianas a un mejor precio, ideales para el día a día.',
      precioDesde: 6400,
      categorias: ['ensaladas', 'comidas'],
    },
    3: {
      titulo: 'Arma tu ensalada',
      bajada: 'A tu gusto',
      descripcion: 'Elegí base, proteína, toppings y aderezo. Una ensalada hecha por vos.',
      precioDesde: 9200,
      categorias: ['arma'],
    },
    4: {
      titulo: 'Arma tu comida',
      bajada: 'A tu gusto',
      descripcion: 'Elegí guarnición, proteína, vegetales y salsa. Una comida hecha por vos.',
      precioDesde: 9600,
      categorias: ['armaComida'],
    },
  },
  categorias: {
    arma: { nombre: 'Arma tu ensalada', short: 'Arma' },
    armaComida: { nombre: 'Arma tu comida', short: 'Arma' },
    ensaladas: { nombre: 'Ensaladas', short: 'Ensaladas' },
    comidas: { nombre: 'Comidas', short: 'Comidas' },
  },
  platos: {
    // OPCIÓN 1 — abundante
    ensaladas: {
      1: [
        { id: 'e1-1', nombre: 'Bowl Pachama', desc: 'Quinoa, palta, pollo grillado, vegetales asados, semillas tostadas.', precio: 9800, tags: [] },
        { id: 'e1-2', nombre: 'César del campo', desc: 'Pollo grillado, mix de hojas, parmesano en escamas, croutones de masa madre.', precio: 9200, tags: [] },
        { id: 'e1-3', nombre: 'Mediterránea XL', desc: 'Hojas verdes, tomates cherry confitados, aceitunas, huevo, atún, papas rústicas.', precio: 9500, tags: [] },
        { id: 'e1-4', nombre: 'Caprese de la huerta', desc: 'Tomates de estación, mozzarella fior di latte, albahaca fresca, pan tostado.', precio: 8900, tags: [] },
      ],
      2: [
        { id: 'e2-1', nombre: 'Verde simple', desc: 'Mix de hojas, zanahoria, tomate, pepino, vinagreta de la casa.', precio: 6400, tags: [] },
        { id: 'e2-2', nombre: 'Quinoa básica', desc: 'Quinoa, palta, tomate cherry, semillas, limón.', precio: 6900, tags: [] },
        { id: 'e2-3', nombre: 'Caprese chica', desc: 'Tomate, mozzarella, albahaca, oliva.', precio: 6800, tags: [] },
      ],
    },
    comidas: {
      1: [
        { id: 'c1-1', nombre: 'Pollo al limón con puré rústico', desc: 'Suprema de pollo marinada al limón y romero, puré de papa con manteca y tomillo.', precio: 9400, tags: [] },
        { id: 'c1-2', nombre: 'Lasagna de la abuela', desc: 'Pasta fresca, ragú de ternera cocido a fuego lento, bechamel y parmesano.', precio: 9900, tags: [] },
        { id: 'c1-3', nombre: 'Wok de ternera y vegetales', desc: 'Tiras de bife de chorizo, brócoli, morrón, zanahoria, salsa de soja y jengibre.', precio: 9600, tags: [] },
        { id: 'c1-4', nombre: 'Tarta de zapallo y cabra', desc: 'Masa de hojaldre casero, zapallo asado, queso de cabra, nueces y miel.', precio: 8900, tags: [] },
      ],
      2: [
        { id: 'c2-1', nombre: 'Pollo grillado y vegetales', desc: 'Suprema de pollo grillada, vegetales asados de estación.', precio: 6900, tags: [] },
        { id: 'c2-2', nombre: 'Tarta del día', desc: 'Tarta de verduras de estación con masa casera.', precio: 6400, tags: [] },
        { id: 'c2-3', nombre: 'Bowl liviano', desc: 'Arroz integral, vegetales salteados, huevo poché.', precio: 6800, tags: [] },
      ],
    },
  },
  // Arma tu ensalada — solo en Opción 1
  arma: {
    base: 9200, // precio base
    pasos: [
      {
        id: 'base',
        titulo: 'Base',
        sub: 'Elegí una',
        max: 1,
        opciones: [
          { id: 'rucula', nombre: 'Rúcula' },
          { id: 'lechuga', nombre: 'Lechuga' },
          { id: 'zanahoria', nombre: 'Zanahoria' },
        ],
      },
      {
        id: 'proteina',
        titulo: 'Proteína',
        sub: 'Hasta 2',
        max: 2,
        opciones: [
          { id: 'pollo', nombre: 'Pollo grillado' },
          { id: 'atun', nombre: 'Atún' },
          { id: 'camarones', nombre: 'Camarones' },
        ],
      },
      {
        id: 'toppings',
        titulo: 'Toppings',
        sub: 'Hasta 5',
        max: 5,
        opciones: [
          { id: 'palta', nombre: 'Palta' },
          { id: 'cherry', nombre: 'Tomate cherry' },
          { id: 'zanahoria', nombre: 'Zanahoria' },
          { id: 'pepino', nombre: 'Pepino' },
          { id: 'cebolla', nombre: 'Cebolla morada' },
          { id: 'maiz', nombre: 'Choclo' },
          { id: 'queso', nombre: 'Queso feta' },
          { id: 'semillas', nombre: 'Semillas tostadas' },
          { id: 'nueces', nombre: 'Nueces' },
          { id: 'arandanos', nombre: 'Arándanos' },
        ],
      },
      {
        id: 'aderezo',
        titulo: 'Aderezo',
        sub: 'Elegí uno',
        max: 1,
        opciones: [
          { id: 'cesar', nombre: 'César de la casa' },
          { id: 'mostaza', nombre: 'Mostaza y miel' },
          { id: 'oliva', nombre: 'Oliva y limón' },
          { id: 'balsamico', nombre: 'Balsámica' },
          { id: 'yogur', nombre: 'Yogur y hierbas' },
        ],
      },
    ],
  },
  // Arma tu comida — opción 4
  armaComida: {
    base: 9600,
    pasos: [
      {
        id: 'guarnicion',
        titulo: 'Guarnición',
        sub: 'Elegí una',
        max: 1,
        opciones: [
          { id: 'pure', nombre: 'Puré rústico' },
          { id: 'papas', nombre: 'Papas asadas' },
          { id: 'arroz', nombre: 'Arroz integral' },
          { id: 'batata', nombre: 'Batata al horno' },
        ],
      },
      {
        id: 'proteina',
        titulo: 'Proteína',
        sub: 'Hasta 2',
        max: 2,
        opciones: [
          { id: 'pollo', nombre: 'Pollo grillado' },
          { id: 'ternera', nombre: 'Ternera al horno' },
          { id: 'cerdo', nombre: 'Cerdo a las hierbas' },
          { id: 'pescado', nombre: 'Pescado del día' },
        ],
      },
      {
        id: 'vegetales',
        titulo: 'Vegetales',
        sub: 'Hasta 4',
        max: 4,
        opciones: [
          { id: 'brocoli', nombre: 'Brócoli salteado' },
          { id: 'zapallo', nombre: 'Zapallo asado' },
          { id: 'zanahoria', nombre: 'Zanahoria glaseada' },
          { id: 'morron', nombre: 'Morrones asados' },
          { id: 'champi', nombre: 'Champiñones salteados' },
          { id: 'chauchas', nombre: 'Chauchas al ajillo' },
        ],
      },
      {
        id: 'salsa',
        titulo: 'Salsa',
        sub: 'Elegí una',
        max: 1,
        opciones: [
          { id: 'limon', nombre: 'Limón y hierbas' },
          { id: 'bbq', nombre: 'BBQ casera' },
          { id: 'champi', nombre: 'Crema de champiñones' },
          { id: 'mostaza', nombre: 'Mostaza y miel' },
          { id: 'natural', nombre: 'Jugo natural' },
        ],
      },
    ],
  },
};

window.formatPrecio = (n) => {
  return '$' + n.toLocaleString('es-AR');
};

// ¿Está vigente el descuento hoy? Considera fechas opcionales (YYYY-MM-DD).
window.descuentoVigente = () => {
  const h = window.MENU_DATA.home;
  const pct = Number(h.descuentoPorcentaje) || 0;
  if (pct <= 0) return false;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  if (h.descuentoDesde) {
    const d = new Date(h.descuentoDesde + 'T00:00:00');
    if (!isNaN(d) && hoy < d) return false;
  }
  if (h.descuentoHasta) {
    const d = new Date(h.descuentoHasta + 'T00:00:00');
    if (!isNaN(d) && hoy > d) return false;
  }
  return true;
};

// Aplica el descuento a un precio si está vigente.
window.aplicarDescuento = (precio) => {
  if (!window.descuentoVigente()) return precio;
  if (!window.MENU_DATA.home.descuentoPlatos) return precio;
  const pct = Number(window.MENU_DATA.home.descuentoPorcentaje) || 0;
  return Math.round(precio * (1 - pct / 100));
};

// ¿Aplica descuento a los platos (Comidas y Ensaladas)?
window.descuentoPlatosVigente = () => {
  return window.descuentoVigente() && !!window.MENU_DATA.home.descuentoPlatos;
};

// Aplica el descuento al configurador "Arma tu ..." solo si está habilitado para esa sección.
window.aplicarDescuentoArma = (precio, kind) => {
  if (!window.descuentoVigente()) return precio;
  const h = window.MENU_DATA.home;
  if (kind === 'comida' && !h.descuentoComida) return precio;
  if (kind !== 'comida' && !h.descuentoEnsalada) return precio;
  const pct = Number(h.descuentoPorcentaje) || 0;
  return Math.round(precio * (1 - pct / 100));
};

// Defaults de "Complementario" por plato.
// Todos los platos (ensaladas + comidas, op 1 y 2) llegan con los 3 items visibles.
// Excepción: nombres que mencionan "frutos secos" arrancan ocultos.
['ensaladas', 'comidas'].forEach((cat) => {
  [1, 2].forEach((op) => {
    window.MENU_DATA.platos[cat][op].forEach((p) => {
      const hideByDefault = p.nombre.toLowerCase().includes('frutos secos');
      p.complementarios = hideByDefault ? [] : ['Salsa César', 'Sobrecito de limón', 'Tostaditas'];
      p.complementarioVisible = !hideByDefault;
      p.agotado = false;
      // Cada plato tiene precios diferenciados por opción
      if (p.precioOp1 == null) p.precioOp1 = p.precio;
      if (p.precioOp2 == null) p.precioOp2 = Math.max(0, p.precio - 2000);
    });
  });
});