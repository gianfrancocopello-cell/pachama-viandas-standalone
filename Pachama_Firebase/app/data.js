// Datos del menú del día — Pachama Viandas

window.MENU_DATA = {
  fecha: { dia: 'viernes', numero: 15, mes: 'mayo' },
  home: {
    titleL1: 'Comida hecha',
    titleL2: 'en casa,',
    titleL3: 'entregada hoy.',
    desc: 'Elegí el menú del día. Pedís hasta las 12:30.',
    delivery: 'Zona Industrial – Barrio Sur, Comodoro Rivadavia.',
    hours: 'Entrega 12:00 – 13:30',
    whatsapp: '+54 9 2974 27-9849',
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
  },
  categorias: {
    arma: { nombre: 'Arma tu ensalada', short: 'Arma' },
    ensaladas: { nombre: 'Ensaladas', short: 'Ensaladas' },
    comidas: { nombre: 'Comidas', short: 'Comidas' },
  },
  platos: {
    // OPCIÓN 1 — abundante
    ensaladas: {
      1: [
        { id: 'e1-1', nombre: 'Bowl Pachama', desc: 'Quinoa, palta, pollo grillado, vegetales asados, semillas tostadas.', precio: 9800, tags: ['Sin TACC', 'Alta proteína'] },
        { id: 'e1-2', nombre: 'César del campo', desc: 'Pollo grillado, mix de hojas, parmesano en escamas, croutones de masa madre.', precio: 9200, tags: ['Clásica'] },
        { id: 'e1-3', nombre: 'Mediterránea XL', desc: 'Hojas verdes, tomates cherry confitados, aceitunas, huevo, atún, papas rústicas.', precio: 9500, tags: ['Abundante'] },
        { id: 'e1-4', nombre: 'Caprese de la huerta', desc: 'Tomates de estación, mozzarella fior di latte, albahaca fresca, pan tostado.', precio: 8900, tags: ['Vegetariana'] },
      ],
      2: [
        { id: 'e2-1', nombre: 'Verde simple', desc: 'Mix de hojas, zanahoria, tomate, pepino, vinagreta de la casa.', precio: 6400, tags: ['Liviana'] },
        { id: 'e2-2', nombre: 'Quinoa básica', desc: 'Quinoa, palta, tomate cherry, semillas, limón.', precio: 6900, tags: ['Vegana'] },
        { id: 'e2-3', nombre: 'Caprese chica', desc: 'Tomate, mozzarella, albahaca, oliva.', precio: 6800, tags: ['Vegetariana'] },
      ],
    },
    comidas: {
      1: [
        { id: 'c1-1', nombre: 'Pollo al limón con puré rústico', desc: 'Suprema de pollo marinada al limón y romero, puré de papa con manteca y tomillo.', precio: 9400, tags: ['Sin TACC'] },
        { id: 'c1-2', nombre: 'Lasagna de la abuela', desc: 'Pasta fresca, ragú de ternera cocido a fuego lento, bechamel y parmesano.', precio: 9900, tags: ['Casera'] },
        { id: 'c1-3', nombre: 'Wok de ternera y vegetales', desc: 'Tiras de bife de chorizo, brócoli, morrón, zanahoria, salsa de soja y jengibre.', precio: 9600, tags: ['Picante leve'] },
        { id: 'c1-4', nombre: 'Tarta de zapallo y cabra', desc: 'Masa de hojaldre casero, zapallo asado, queso de cabra, nueces y miel.', precio: 8900, tags: ['Vegetariana'] },
      ],
      2: [
        { id: 'c2-1', nombre: 'Pollo grillado y vegetales', desc: 'Suprema de pollo grillada, vegetales asados de estación.', precio: 6900, tags: ['Sin TACC'] },
        { id: 'c2-2', nombre: 'Tarta del día', desc: 'Tarta de verduras de estación con masa casera.', precio: 6400, tags: ['Vegetariana'] },
        { id: 'c2-3', nombre: 'Bowl liviano', desc: 'Arroz integral, vegetales salteados, huevo poché.', precio: 6800, tags: ['Liviana'] },
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
};

window.formatPrecio = (n) => {
  return '$' + n.toLocaleString('es-AR');
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
    });
  });
});
