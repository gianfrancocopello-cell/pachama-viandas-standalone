// Pachama Viandas — app principal
const { useState, useEffect, useMemo, useRef } = React;
// Reference admin module via getters — resolved at call time after all babel scripts load.
const getAdmin = () => window.useAdmin();
const Img = (props) => React.createElement(window.EditableImg, props);

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "layout": "list",
  "density": "regular",
  "anim": true,
  "saladVariant": "lista"
} /*EDITMODE-END*/;

// ───────── Iconos ─────────
const Icon = {
  back: (c = 'currentColor') =>
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M15 6l-6 6 6 6" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>,

  bag: (c = 'currentColor') =>
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M5 8h14l-1.2 11.2a2 2 0 01-2 1.8H8.2a2 2 0 01-2-1.8L5 8z" stroke={c} strokeWidth="1.8" />
      <path d="M9 8V6a3 3 0 016 0v2" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </svg>,

  check: (c = 'currentColor') =>
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
      <path d="M5 12.5l4.5 4.5L19 7.5" stroke={c} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>,

  spark: (c = 'currentColor') =>
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" fill={c} />
    </svg>,

  pin: (c = 'currentColor') =>
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M12 22s7-7.5 7-13a7 7 0 10-14 0c0 5.5 7 13 7 13z" stroke={c} strokeWidth="1.6" />
      <circle cx="12" cy="9" r="2.4" stroke={c} strokeWidth="1.6" />
    </svg>,

  clock: (c = 'currentColor') =>
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.6" />
      <path d="M12 7v5l3 2" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
    </svg>

};

// ───────── Header reutilizable ─────────
function Header({ onBack, title, right }) {
  return (
    <div className="pv-header">
      <div className="pv-header-inner">
        <div className="pv-header-bar">
          {onBack ?
          <button className="pv-back" onClick={onBack} aria-label="Volver">{Icon.back('var(--tierra)')}</button> :
          <div style={{ width: 40 }} />}
          <div className="pv-header-title">{title}</div>
          <div style={{ width: 40, display: 'flex', justifyContent: 'flex-end' }}>{right}</div>
        </div>
      </div>
    </div>);

}

// ───────── Cart bar ─────────
function CartBar({ cart, onTap, label = 'Ver carrito' }) {
  const total = cart.reduce((a, i) => a + i.precio * i.cantidad, 0);
  const count = cart.reduce((a, i) => a + i.cantidad, 0);
  if (count === 0) return null;
  return (
    <div className="pv-cart-bar" onClick={onTap} style={{ cursor: 'pointer' }}>
      <div>
        <small>{count} {count === 1 ? 'plato' : 'platos'} · {window.formatPrecio(total)}</small>
        <div style={{ fontWeight: 600, fontSize: 15, marginTop: 2 }}>{label}</div>
      </div>
      <div style={{
        width: 40, height: 40, borderRadius: 999,
        background: 'var(--terracota)', display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>{Icon.bag('var(--hueso)')}</div>
    </div>);

}

// ════════════════ SCREENS ════════════════

function DraggableLogo({ A, D }) {
  const isAdmin = A.isAdmin();
  const saved = D.home.logoOffset || { x: 0, y: 0 };
  const [offset, setOffset] = useState(saved);
  const [dragging, setDragging] = useState(false);
  const startRef = useRef(null);
  const offsetRef = useRef(saved);

  // Re-sync when admin persists a new value (e.g. via "Reset")
  useEffect(() => {
    setOffset(saved);
    offsetRef.current = saved;
  }, [saved.x, saved.y]);

  const onDown = (e) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.stopPropagation();
    startRef.current = { x: e.clientX - offsetRef.current.x, y: e.clientY - offsetRef.current.y };
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      const newOff = { x: e.clientX - startRef.current.x, y: e.clientY - startRef.current.y };
      offsetRef.current = newOff;
      setOffset(newOff);
    };
    const onUp = () => {
      setDragging(false);
      A.setOverride('home.logoOffset', offsetRef.current);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragging]);

  return (
    <img
      className={`pv-home-hero-logo ${isAdmin ? 'pv-logo-editable' : ''} ${dragging ? 'pv-logo-dragging' : ''}`}
      src={A.images[`logo.${window.__pvViewport}`] || A.images['logo'] || 'app/assets/logo.png'}
      alt="Pachamama Viandas"
      onPointerDown={onDown}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        cursor: isAdmin ? dragging ? 'grabbing' : 'grab' : 'default',
        touchAction: isAdmin ? 'none' : 'auto'
      }}
      draggable={false} />);


}

// ── HOME ──
function HomeScreen({ go, cart, onTapCart }) {
  const A = getAdmin();
  const D = window.MENU_DATA;
  const cerrado = !!D.home.cerrado;
  return (
    <>
      <Header title="Pachamama Viandas" right={
      <button onClick={() => go({ screen: A.isAdmin() ? 'admin' : 'login' })} aria-label="Admin" style={{
        appearance: 'none', border: '1px solid var(--crema-line)', background: 'var(--hueso)',
        width: 38, height: 38, borderRadius: 999, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
      }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="var(--tierra-soft)" strokeWidth="1.6" />
            <path d="M4 21c1-4 4-6 8-6s7 2 8 6" stroke="var(--tierra-soft)" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      } />
      {cerrado ? (
        <div className="pv-body" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: '70vh', padding: '40px 24px', textAlign: 'center',
        }}>
          <div style={{
            fontFamily: D.home.cerradoFont || 'Instrument Serif',
            fontSize: (D.home.cerradoFontSize || 48) + 'px',
            color: D.home.cerradoColor || 'var(--terracota)',
            lineHeight: 1.15,
            maxWidth: 720,
          }}>
            {D.home.cerradoMensaje || 'Cerrado por hoy'}
          </div>
        </div>
      ) : (
      <>
      <div className="pv-body pv-body-with-cart">
        <div className="pv-home-hero" style={{ margin: "0px 0px 14px 0px", gap: "12px" }}>
          <div className="pv-home-hero-text">
            <div className="pv-eyebrow">Hoy · {D.fecha.dia} {D.fecha.numero} de {D.fecha.mes}</div>
            <div className="pv-h1" style={{ marginTop: 8 }}>
              {D.home.titleL1}<br /><em style={{ fontStyle: 'italic', color: 'var(--terracota)' }}>{D.home.titleL2}</em><br />
              {D.home.titleL3}
            </div>
            <div className="pv-body-text" style={{ marginTop: 12, maxWidth: 320 }}>
              {D.home.desc}
            </div>
          </div>
        </div>

        {/* Opciones */}
        <div className="pv-options-grid">
          {[0, 3, 4].filter((n) => {
            if (n === 3 && D.opciones[3]?.oculto) return false;
            if (n === 4 && D.opciones[4]?.oculto) return false;
            return true;
          }).map((n) => {
            const isCombo = n === 0;
            const op = isCombo ? {
              titulo: D.home.comboTitulo || 'Comidas y Ensaladas',
              bajada: D.home.comboBajada || 'El menú del día',
              descripcion: D.home.comboDescripcion || 'Elegí entre nuestras ensaladas y comidas preparadas hoy.',
              precioDesde: D.home.comboPrecioDesde ?? 6400,
              categorias: ['ensaladas', 'comidas'],
            } : D.opciones[n];
            const isOne = isCombo;
            const isArma = n === 3;
            const isArmaComida = n === 4;
            const onTap = isArma ?
            () => go({ screen: 'arma', opcion: 1, categoria: 'arma' }) :
            isArmaComida ?
            () => go({ screen: 'armaComida', opcion: 1, categoria: 'armaComida' }) :
            () => go({ screen: 'menu', opcion: 'all', categoria: op.categorias[0] });
            return (
              <div
                key={n}
                className="pv-card pv-card-tap"
                onClick={onTap}
                style={{
                  background: isOne ? 'var(--tierra)' : isArma ? 'var(--verde-soft)' : isArmaComida ? 'var(--terracota-soft)' : 'var(--hueso)',
                  color: isOne ? 'var(--hueso)' : isArma ? 'oklch(0.28 0.08 130)' : isArmaComida ? 'oklch(0.32 0.08 40)' : 'var(--tierra)',
                  borderColor: isOne ? 'var(--tierra)' : (isArma || isArmaComida) ? 'transparent' : 'var(--crema-line)',
                  position: 'relative', overflow: 'hidden', padding: 22, borderWidth: "1px"
                }}>
                
                <div style={{
                  position: 'absolute', right: -30, top: -30, width: 160, height: 160,
                  borderRadius: '50%',
                  background: isOne ?
                  'oklch(0.36 0.05 50)' :
                  isArma ?
                  'radial-gradient(circle at 30% 30%, oklch(0.95 0.04 130) 0%, oklch(0.78 0.08 130) 100%)' :
                  isArmaComida ?
                  'radial-gradient(circle at 30% 30%, oklch(0.94 0.06 50) 0%, oklch(0.78 0.1 40) 100%)' :
                  'var(--crema-deep)',
                  opacity: isOne ? 0.6 : 1
                }} />
                <div style={{ position: 'relative' }}>
                  <div style={{
                    fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.16em',
                    opacity: 0.65, fontWeight: 500
                  }}>{op.bajada}</div>
                  <div className="pv-serif" style={{
                    fontSize: 38, lineHeight: 1, marginTop: 8, letterSpacing: '-0.01em'
                  }}>{op.titulo}</div>
                  <div style={{ fontSize: 13, marginTop: 10, opacity: 0.75, maxWidth: 240, lineHeight: 1.4 }}>
                    {op.descripcion}
                  </div>
                  {isArma && (
                  <div style={{
                    display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 18
                  }}>
                    <span style={{ fontSize: 11, opacity: 0.7 }}>Desde</span>
                    <span style={{ fontSize: 22, fontWeight: 600 }}>{window.formatPrecio(D.arma.base)}</span>
                  </div>
                  )}
                  <div style={{
                    marginTop: 14, display: 'flex', gap: 6, flexWrap: 'wrap'
                  }}>
                    {!isArma && !isArmaComida && op.categorias.map((c) =>
                    <span key={c} className="pv-tag" style={{
                      background: isOne ? 'oklch(0.36 0.05 50)' : 'var(--crema-deep)',
                      color: isOne ? 'var(--hueso)' : 'var(--tierra)'
                    }}>
                        {D.categorias[c].nombre}
                      </span>
                    )}
                    {isArma &&
                    <span className="pv-tag" style={{
                      background: 'oklch(0.32 0.08 130)', color: 'var(--hueso)'
                    }}>
                        Empezar →
                      </span>
                    }
                    {isArmaComida &&
                    <span className="pv-tag" style={{
                      background: 'oklch(0.42 0.13 40)', color: 'var(--hueso)'
                    }}>
                        Empezar →
                      </span>
                    }
                  </div>
                </div>
              </div>);

          })}
        </div>

        <div style={{ marginTop: 26, padding: 16, borderRadius: 16, background: 'var(--terracota-soft)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'oklch(0.36 0.08 40)' }}>
            {Icon.clock('oklch(0.36 0.08 40)')}
            <span style={{ fontSize: 12, fontWeight: 500 }}>{D.home.hours}</span>
          </div>
          <div style={{ fontSize: 12, color: 'oklch(0.36 0.08 40)', marginTop: 6, opacity: 0.85 }}>
            {D.home.delivery}
          </div>
        </div>
      </div>
      <CartBar cart={cart} onTap={onTapCart} />
      </>
      )}
    </>);

}

// ── MENU LIST ──
function MenuScreen({ state, go, cart, onTapCart }) {
  getAdmin();
  const D = window.MENU_DATA;
  const isAll = state.opcion === 'all';
  const op = isAll ? {
    titulo: D.home.comboTitulo || 'Comidas y Ensaladas',
    bajada: D.home.comboBajada || 'El menú del día',
    categorias: ['ensaladas', 'comidas'],
  } : D.opciones[state.opcion];
  const cats = op.categorias;
  const cat = state.categoria;

  // Cuando es "all", combinar platos de opción 1 + 2
  const getPlatos = (c) => {
    if (!isAll) return D.platos[c][state.opcion] || [];
    return [
      ...(D.platos[c][1] || []),
      ...(D.platos[c][2] || []),
    ];
  };

  return (
    <>
      <Header
        onBack={() => go({ screen: 'home' })}
        title={op.titulo} />
      
      <div className="pv-body pv-body-with-cart">
        <div style={{ marginBottom: 16 }}>
          <div className="pv-eyebrow">{op.bajada}</div>
          <div className="pv-h2" style={{ marginTop: 4 }}>Hoy en el menú</div>
        </div>

        {/* Tabs Ensaladas / Comidas */}
        <div className="pv-tabs" style={{ marginBottom: 18 }}>
          {cats.map((c) =>
          <div
            key={c}
            className="pv-tab"
            aria-selected={cat === c}
            onClick={() => go({ ...state, categoria: c })}>
            
              {D.categorias[c].short}
            </div>
          )}
        </div>

        {/* Contenido */}
        {cat === 'arma' &&
        <ArmaCallout onTap={() => go({ ...state, screen: 'arma' })} />
        }

        {cat !== 'arma' &&
        <DishList
          platos={getPlatos(cat)}
          onTap={(p) => go({ ...state, screen: 'detalle', plato: p })} />

        }
      </div>
      <CartBar cart={cart} onTap={onTapCart} />
    </>);

}

function ArmaCallout({ onTap }) {
  return (
    <div className="pv-card pv-card-tap" onClick={onTap} style={{
      background: 'var(--verde-soft)', borderColor: 'transparent', padding: 22, position: 'relative', overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', right: -40, bottom: -40, width: 180, height: 180,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 30% 30%, oklch(0.95 0.04 130) 0%, oklch(0.78 0.08 130) 100%)'
      }} />
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'oklch(0.32 0.08 130)' }}>
          {Icon.spark('oklch(0.32 0.08 130)')}
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Personalizá</span>
        </div>
        <div className="pv-serif" style={{ fontSize: 32, lineHeight: 1, marginTop: 8, color: 'oklch(0.28 0.08 130)' }}>
          Arma tu<br />ensalada.
        </div>
        <div style={{ fontSize: 13, marginTop: 10, color: 'oklch(0.32 0.05 125)', maxWidth: 220 }}>
          Base, proteína, toppings y aderezo. A tu gusto.
        </div>
        <button className="pv-btn pv-btn-sm" style={{
          marginTop: 16, background: 'oklch(0.32 0.08 130)', boxShadow: 'none'
        }}>
          Empezar
        </button>
      </div>
    </div>);

}

function DishList({ platos, onTap }) {
  const visibles = platos.filter((p) => !p.oculto);
  return (
    <div className="pv-list-grid">
      {visibles.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--tierra-soft)', fontSize: 13 }}>
          No hay platos disponibles en esta categoría.
        </div>
      ) : visibles.map((p) => <DishCard key={p.id} plato={p} onTap={() => onTap(p)} />)}
    </div>);

}

function DishCard({ plato, onTap }) {
  const layout = document.body.dataset.layout;
  const agotado = !!plato.agotado;
  const handleTap = agotado ? undefined : onTap;
  const wrapCls = `pv-card pv-card-tap${agotado ? ' pv-card-agotado' : ''}`;

  const op1 = plato.precioOp1 ?? plato.precio;
  const op2 = plato.precioOp2 ?? plato.precio;
  const precioMenor = Math.min(op1, op2);
  const hayDesc = window.descuentoPlatosVigente ? window.descuentoPlatosVigente() : false;
  const precioMenorFinal = window.aplicarDescuento ? window.aplicarDescuento(precioMenor) : precioMenor;
  const mostrarPrecio = agotado ? 'No disponible' : null;

  const badge = agotado ?
  <div className="pv-agotado-badge"><span>Agotado</span></div> :
  (hayDesc ?
  <div style={{
    position: 'absolute', top: 8, left: 8, zIndex: 2,
    background: 'oklch(0.55 0.2 28)', color: 'var(--hueso)',
    fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999,
    boxShadow: '0 2px 6px oklch(0.4 0.1 28 / 0.4)',
  }}>−{Number(window.MENU_DATA.home.descuentoPorcentaje) || 0}%</div> :
  null);

  if (layout === 'grid') {
    return (
      <div className={`${wrapCls} pv-dish-grid`} onClick={handleTap}>
        <div className="pv-img-wrap">
          <Img id={`plato.${plato.id}`} veg={true} />
          {badge}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}>{plato.nombre}</div>
          <div style={{ fontSize: 11, color: 'var(--tierra-soft)', marginTop: 4, lineHeight: 1.3,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
          }}>{plato.desc}</div>
          <div style={{ marginTop: 8, fontSize: 14, fontWeight: 600, color: agotado ? 'var(--tierra-soft)' : 'var(--terracota)' }}>
            {mostrarPrecio}
          </div>
        </div>
      </div>);

  }
  return (
    <div className={wrapCls} onClick={handleTap}>
      <div className="pv-dish-list">
        <div className="pv-img-wrap">
          <Img id={`plato.${plato.id}`} veg={true} />
          {badge}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.2 }}>{plato.nombre}</div>
          <div style={{ fontSize: 12, color: 'var(--tierra-soft)', marginTop: 4, lineHeight: 1.35,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
          }}>{plato.desc}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: agotado ? 'var(--tierra-soft)' : 'var(--terracota)' }}>
              {mostrarPrecio}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {!agotado && plato.tags.slice(0, 1).map((t) => <span key={t} className="pv-tag pv-tag-veg">{t}</span>)}
            </div>
          </div>
        </div>
      </div>
    </div>);

}

// Devuelve un nuevo carrito con las bebidas seleccionadas agregadas
// Devuelve un nuevo carrito con las bebidas seleccionadas agregadas
// seleccion: { [bebidaId]: [variante1, variante2, ...] | [true] | undefined }
function agregarBebidas(prev, seleccion) {
  let c = [...prev];
  (window.MENU_DATA.bebidas || []).forEach((b) => {
    const elegidos = seleccion[b.id];
    if (!Array.isArray(elegidos) || elegidos.length === 0) return;
    elegidos.forEach((elegido) => {
      const variante = typeof elegido === 'string' ? elegido : null;
      const id = 'bebida-' + b.id + (variante ? '-' + variante : '');
      const nombre = variante ? `${b.nombre} · ${variante}` : b.nombre;
      const ex = c.find((it) => it.id === id);
      if (ex) c = c.map((it) => it.id === id ? { ...it, cantidad: it.cantidad + 1 } : it);
      else c = [...c, { id, nombre, precio: b.precio, cantidad: 1 }];
    });
  });
  return c;
}

// Fila de opción con stepper de cantidad (dentro de la pantalla de bebidas)
function BebidaOptRow({ label, qty, onMinus, onPlus, agotada }) {
  const activa = qty > 0;
  if (agotada) {
    return (
      <div className="pv-sheet-opt pv-sheet-opt-agotada" aria-disabled="true" style={{ cursor: 'not-allowed' }}>
        <span style={{ fontWeight: 600, fontSize: 15, flex: 1, minWidth: 0, textDecoration: 'line-through', color: 'var(--tierra-soft)' }}>{label}</span>
        <span className="pv-agotado-tag">Agotado</span>
      </div>
    );
  }
  return (
    <div className="pv-sheet-opt" aria-selected={activa} style={{ cursor: 'default' }}>
      <span style={{ fontWeight: 600, fontSize: 15, flex: 1, minWidth: 0 }}>{label}</span>
      <div className="pv-stepper" style={{ padding: 3, gap: 4, flexShrink: 0 }}>
        <button style={{ width: 30, height: 30 }} onClick={onMinus} disabled={qty === 0} aria-label="Quitar">−</button>
        <span className="pv-stepper-val" style={{ fontSize: 14, minWidth: 20, textAlign: 'center' }}>{qty}</span>
        <button style={{ width: 30, height: 30 }} onClick={onPlus} aria-label="Sumar">+</button>
      </div>
    </div>
  );
}

// ¿Está agotada esta opción? (b.agotado = toda la bebida; b.agotados = opciones puntuales)
function bebidaOpcionAgotada(b, key) {
  if (b.agotado) return true;
  if (key === true) return false;
  return (b.agotados || []).includes(key);
}

// Pantalla extra (bottom sheet) — todas las bebidas y sus opciones en una sola pantalla.
// Modelo: local[bebidaId] = ['Coca-Cola', 'Coca-Cola', 'Sprite', ...] (repetir = cantidad)
function BebidaSheet({ bebidas, seleccion, onClose, onConfirm }) {
  const [local, setLocal] = useState(() => {
    const o = {};
    bebidas.forEach((b) => {
      const arr = Array.isArray(seleccion[b.id]) ? seleccion[b.id] : [];
      o[b.id] = arr.filter((x) => !bebidaOpcionAgotada(b, x)); // descartar opciones que quedaron agotadas
    });
    return o;
  });

  const qtyOf = (bid, key) => (local[bid] || []).filter((x) => x === key).length;
  const setQty = (bid, key, delta) => {
    setLocal((s) => {
      const cur = s[bid] || [];
      let next;
      if (delta > 0) next = [...cur, key];
      else {
        const i = cur.indexOf(key);
        next = i === -1 ? cur : [...cur.slice(0, i), ...cur.slice(i + 1)];
      }
      return { ...s, [bid]: next };
    });
  };

  const totalUnidades = bebidas.reduce((a, b) => a + (local[b.id] || []).length, 0);
  const totalPrecio = bebidas.reduce((a, b) => a + (local[b.id] || []).length * b.precio, 0);

  return (
    <div className="pv-sheet-overlay" onClick={onClose}>
      <div className="pv-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="pv-sheet-grip" />
        <div className="pv-sheet-head">
          <div style={{ minWidth: 0 }}>
            <div className="pv-eyebrow" style={{ color: 'oklch(0.42 0.08 130)' }}>Agregá lo que quieras</div>
            <div className="pv-h3" style={{ marginTop: 2 }}>Bebidas</div>
          </div>
          <button className="pv-sheet-close" onClick={onClose} aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="pv-sheet-body">
          <div style={{ fontSize: 12, color: 'var(--tierra-soft)', marginBottom: 14 }}>
            Elegí las que quieras y sumá la cantidad de cada una.
          </div>
          {bebidas.map((b, i) => {
            const variantes = (b.variantes || []).filter(Boolean);
            const tieneVar = variantes.length > 0;
            return (
              <div key={b.id} style={{ marginBottom: i === bebidas.length - 1 ? 0 : 22 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 9 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: b.agotado ? 'var(--tierra-soft)' : 'var(--tierra)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ textDecoration: b.agotado ? 'line-through' : 'none' }}>{b.nombre}</span>
                    {b.agotado && <span className="pv-agotado-tag">Agotado</span>}
                  </div>
                  {!b.agotado && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--terracota)' }}>+{window.formatPrecio(b.precio)} c/u</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {tieneVar ? variantes.map((v) => (
                    <BebidaOptRow
                      key={v}
                      label={v}
                      qty={qtyOf(b.id, v)}
                      agotada={bebidaOpcionAgotada(b, v)}
                      onMinus={() => setQty(b.id, v, -1)}
                      onPlus={() => setQty(b.id, v, 1)} />
                  )) : (
                    <BebidaOptRow
                      label={b.nombre}
                      qty={qtyOf(b.id, true)}
                      agotada={!!b.agotado}
                      onMinus={() => setQty(b.id, true, -1)}
                      onPlus={() => setQty(b.id, true, 1)} />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pv-sheet-foot">
          <button
            className="pv-btn pv-btn-full"
            onClick={() => onConfirm(local)}
            style={totalUnidades === 0 ? { background: 'var(--tierra)' } : {}}
          >
            {totalUnidades === 0
              ? 'Listo, sin bebidas'
              : `Agregar ${totalUnidades} ${totalUnidades === 1 ? 'bebida' : 'bebidas'} · ${window.formatPrecio(totalPrecio)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// Sección "¿Querés agregar una bebida?" — abre una sola pantalla con todas las opciones
function BebidasAddon({ seleccion, onSelect }) {
  const bebidas = (window.MENU_DATA.bebidas || []).filter((b) => b.activa);
  const [open, setOpen] = useState(false);
  if (bebidas.length === 0) return null;

  // Resumen de lo elegido (agrupado por opción, con cantidad)
  const resumen = [];
  let totalUnidades = 0;
  let totalPrecio = 0;
  bebidas.forEach((b) => {
    const els = Array.isArray(seleccion[b.id]) ? seleccion[b.id] : [];
    totalUnidades += els.length;
    totalPrecio += els.length * b.precio;
    const counts = {};
    els.forEach((x) => {
      const k = typeof x === 'string' ? x : b.nombre;
      counts[k] = (counts[k] || 0) + 1;
    });
    Object.entries(counts).forEach(([k, n]) => resumen.push(`${n}× ${k}`));
  });
  const hay = totalUnidades > 0;

  return (
    <div style={{ marginTop: 22 }}>
      <div className="pv-eyebrow" style={{ marginBottom: 8 }}>¿Querés agregar una bebida?</div>
      <button
        onClick={() => setOpen(true)}
        style={{
          appearance: 'none', cursor: 'pointer', fontFamily: 'inherit',
          width: '100%', padding: '14px 16px', textAlign: 'left',
          border: '1.5px solid', borderColor: hay ? 'var(--verde)' : 'var(--crema-line)',
          borderRadius: 14, background: hay ? 'var(--verde-soft)' : 'var(--hueso)',
          color: 'var(--tierra)', display: 'flex', alignItems: 'center', gap: 12,
        }}
      >
        <span style={{
          width: 38, height: 38, borderRadius: 999, flexShrink: 0,
          background: hay ? 'var(--verde)' : 'var(--crema-deep)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M7 8h10l-1 11a2 2 0 01-2 1.8H10a2 2 0 01-2-1.8L7 8z" stroke={hay ? 'var(--hueso)' : 'var(--tierra-soft)'} strokeWidth="1.6" />
            <path d="M9 8V6.5A1.5 1.5 0 0110.5 5h3A1.5 1.5 0 0115 6.5V8" stroke={hay ? 'var(--hueso)' : 'var(--tierra-soft)'} strokeWidth="1.6" />
            <path d="M8.5 12.5h7" stroke={hay ? 'var(--hueso)' : 'var(--tierra-soft)'} strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontWeight: 600, fontSize: 15 }}>
            {hay ? `${totalUnidades} ${totalUnidades === 1 ? 'bebida' : 'bebidas'} · ${window.formatPrecio(totalPrecio)}` : 'Agregá tus bebidas'}
          </span>
          <span style={{ display: 'block', fontWeight: 500, fontSize: 12.5, color: 'var(--tierra-soft)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {hay ? resumen.join(' · ') : 'Gaseosas, agua y más'}
          </span>
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--tierra-soft)', flexShrink: 0 }}>
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <BebidaSheet
          bebidas={bebidas}
          seleccion={seleccion}
          onClose={() => setOpen(false)}
          onConfirm={(local) => {
            bebidas.forEach((b) => {
              const arr = local[b.id] || [];
              onSelect(b.id, arr.length ? arr : undefined);
            });
            setOpen(false);
          }} />
      )}
    </div>
  );
}

// ── DETALLE ──
function DetalleScreen({ state, go, cart, setCart }) {
  const p = state.plato;
  const [qty, setQty] = useState(1);
  const [opcionElegida, setOpcionElegida] = useState(null); // 1 o 2
  const [errorOpcion, setErrorOpcion] = useState(false);
  const [bebidaSel, setBebidaSel] = useState({});
  const compls = p.complementarios || [];
  const esEnsalada = !!p.complementarioVisible && compls.length > 0;
  const ofrecerBebida = state.categoria === 'comidas' || state.categoria === 'ensaladas';

  const onSelectBebida = (id, val) => setBebidaSel((s) => ({ ...s, [id]: val }));

  const add = () => {
    if (!opcionElegida) {
      setErrorOpcion(true);
      return;
    }
    const precioBase = opcionElegida === 1 ? (p.precioOp1 ?? p.precio) : (p.precioOp2 ?? p.precio);
    const precioFinal = window.aplicarDescuento ? window.aplicarDescuento(precioBase) : precioBase;
    setCart((c) => {
      const cartId = `${p.id}-op${opcionElegida}`;
      const existing = c.find((it) => it.id === cartId && !it.custom);
      let next;
      if (existing) {
        next = c.map((it) => it.id === cartId && !it.custom ? { ...it, cantidad: it.cantidad + qty } : it);
      } else {
        next = [...c, {
          id: cartId,
          nombre: `${p.nombre} (${opcionElegida === 1 ? 'Porción Abundante' : 'Porción Liviana'})`,
          precio: precioFinal,
          cantidad: qty,
        }];
      }
      return ofrecerBebida ? agregarBebidas(next, bebidaSel) : next;
    });
    go({ screen: 'menu', opcion: state.opcion, categoria: state.categoria });
  };

  const hayDesc = window.descuentoPlatosVigente ? window.descuentoPlatosVigente() : false;
  const pctDesc = Number(window.MENU_DATA.home.descuentoPorcentaje) || 0;
  const precioOp1 = p.precioOp1 ?? p.precio;
  const precioOp2 = p.precioOp2 ?? p.precio;
  const precioBaseMostrar = opcionElegida === 1 ? precioOp1 :
    opcionElegida === 2 ? precioOp2 : null;
  const precioMostrar = precioBaseMostrar == null ? null : window.aplicarDescuento(precioBaseMostrar);

  return (
    <>
      <Header onBack={() => go({ screen: 'menu', opcion: state.opcion, categoria: state.categoria })} title="Detalle" />
      <div className="pv-body" style={{ paddingBottom: 120 }}>
        <div style={{
          maxWidth: 520, margin: '0 auto 18px',
          background: 'var(--crema-deep)', borderRadius: 18, overflow: 'hidden',
        }}>
          <Img
            id={`plato.${p.id}`}
            veg={true}
            style={{
              width: '100%', aspectRatio: '4 / 3',
              height: 'auto', borderRadius: 18, fontSize: 11,
              backgroundSize: 'cover', backgroundPosition: 'center',
            }}
          />
        </div>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <div className="pv-h2">{p.nombre}</div>
        {hayDesc && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10,
            background: 'oklch(0.55 0.2 28)', color: 'var(--hueso)',
            fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 999,
          }}>
            −{pctDesc}% OFF
          </div>
        )}
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          {p.tags.map((t) => <span key={t} className="pv-tag pv-tag-veg">{t}</span>)}
        </div>
        <div className="pv-body-text" style={{ marginTop: 14 }}>{p.desc}</div>

        {esEnsalada &&
        <div style={{ marginTop: 22, padding: 16, borderRadius: 16, background: 'var(--verde-soft)', border: '1px solid transparent' }}>
            <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'oklch(0.32 0.08 130)', marginBottom: 10
          }}>Complementario</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {compls.map((c) =>
            <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'oklch(0.28 0.08 130)' }}>
                  <span style={{
                width: 18, height: 18, borderRadius: 999, background: 'oklch(0.55 0.1 130)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12.5l4.5 4.5L19 7.5" stroke="var(--hueso)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span>{c}</span>
                </div>
            )}
            </div>
            <div style={{ fontSize: 11, color: 'oklch(0.36 0.06 130)', marginTop: 10, opacity: 0.85 }}>
              Incluido sin cargo con tu pedido.
            </div>
          </div>
        }

        {/* Selector Opción 1 / Opción 2 */}
        <div style={{ marginTop: 26 }}>
          <div className="pv-eyebrow" style={{ marginBottom: 8 }}>Elegí una opción</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[1, 2].map((n) => {
              const sel = opcionElegida === n;
              const precioN = n === 1 ? precioOp1 : precioOp2;
              return (
                <button
                  key={n}
                  onClick={() => { setOpcionElegida(n); setErrorOpcion(false); }}
                  style={{
                    appearance: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    padding: '14px 16px',
                    background: sel ? 'var(--terracota)' : 'var(--hueso)',
                    color: sel ? 'var(--hueso)' : 'var(--tierra)',
                    border: '1.5px solid',
                    borderColor: sel ? 'var(--terracota)' :
                      (errorOpcion ? 'oklch(0.55 0.2 28)' : 'var(--crema-line)'),
                    borderRadius: 14,
                    display: 'flex', alignItems: 'center', gap: 12,
                    textAlign: 'left',
                  }}
                >
                  <span style={{
                    width: 20, height: 20, borderRadius: 999,
                    border: '2px solid',
                    borderColor: sel ? 'var(--hueso)' : 'var(--crema-line)',
                    background: sel ? 'var(--hueso)' : 'transparent',
                    boxShadow: sel ? `inset 0 0 0 4px var(--terracota)` : 'none',
                    flexShrink: 0,
                  }} />
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{n === 1 ? 'Porción Abundante' : 'Porción Liviana'}</span>
                    {hayDesc ? (
                      <span style={{ fontSize: 13, fontWeight: 500, opacity: sel ? 0.95 : 0.8, display: 'flex', gap: 6, alignItems: 'baseline' }}>
                        <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>{window.formatPrecio(precioN)}</span>
                        <span style={{ fontWeight: 700 }}>{window.formatPrecio(window.aplicarDescuento ? window.aplicarDescuento(precioN) : precioN)}</span>
                      </span>
                    ) : (
                      <span style={{ fontSize: 13, fontWeight: 500, opacity: sel ? 0.9 : 0.7 }}>
                        {window.formatPrecio(precioN)}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          {errorOpcion && (
            <div style={{ fontSize: 12, color: 'oklch(0.5 0.2 28)', marginTop: 8 }}>
              Por favor, seleccioná Opción 1 u Opción 2 para continuar.
            </div>
          )}
        </div>

        {ofrecerBebida && <BebidasAddon seleccion={bebidaSel} onSelect={onSelectBebida} />}

        <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="pv-stepper">
            <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
            <span className="pv-stepper-val">{qty}</span>
            <button onClick={() => setQty(qty + 1)}>+</button>
          </div>
          <div style={{ fontSize: 22, fontWeight: 600 }}>{precioMostrar == null ? '' : window.formatPrecio(precioMostrar * qty)}</div>
        </div>
        </div>
      </div>
      <div className="pv-cart-bar" onClick={add}>
        <div>
          <small>Agregar al pedido</small>
          <div style={{ fontWeight: 600, fontSize: 15, marginTop: 2 }}>Sumar {qty} {qty === 1 ? 'plato' : 'platos'}</div>
        </div>
      </div>
    </>);

}

// ── ARMA TU ENSALADA / ARMA TU COMIDA ──
function ArmaScreen({ state, go, cart, setCart, variant, kind = 'ensalada' }) {
  const dataKey = kind === 'comida' ? 'armaComida' : 'arma';
  const arma = window.MENU_DATA[dataKey];
  const labelTitulo = kind === 'comida' ? 'Arma tu comida' : 'Arma tu ensalada';
  const labelCart = kind === 'comida' ? 'Comida a tu gusto' : 'Ensalada a tu gusto';

  // Inicializar sel con los IDs de los pasos del config
  const [sel, setSel] = useState(() => {
    const obj = {};
    arma.pasos.forEach((p) => { obj[p.id] = []; });
    return obj;
  });
  const [bebidaSel, setBebidaSel] = useState({});
  const ofrecerBebida = kind === 'comida' || kind === 'ensalada';
  const onSelectBebida = (id, val) => setBebidaSel((s) => ({ ...s, [id]: val }));

  const toggle = (pasoId, opId, max) => {
    setSel((s) => {
      const current = s[pasoId] || [];
      if (current.includes(opId)) {
        return { ...s, [pasoId]: current.filter((x) => x !== opId) };
      }
      if (current.length >= max) {
        if (max === 1) return { ...s, [pasoId]: [opId] };
        return s;
      }
      return { ...s, [pasoId]: [...current, opId] };
    });
  };

  const completo = (() => {
    const pasosConSeleccion = arma.pasos.filter((p) => (sel[p.id] || []).length > 0).length;
    const minimo = kind === 'comida' ? 1 : 3;
    return pasosConSeleccion >= minimo;
  })();
  const totalSel = arma.pasos.reduce((a, p) => a + (sel[p.id] || []).length, 0);

  // Suma de precios extras de las opciones elegidas
  const extras = arma.pasos.reduce((a, p) => {
    const ids = sel[p.id] || [];
    return a + ids.reduce((s, id) => {
      const op = p.opciones.find((o) => o.id === id);
      return s + (op?.precio || 0);
    }, 0);
  }, 0);
  // Para "comida" no se usa precio base — el precio = suma de extras seleccionados
  const baseAplicable = kind === 'comida' ? 0 : arma.base;
  const precioBruto = baseAplicable + extras;
  const precioTotal = window.aplicarDescuentoArma ? window.aplicarDescuentoArma(precioBruto, kind) : precioBruto;
  const hayDescArma = window.descuentoVigente ? window.descuentoVigente() : false && precioTotal < precioBruto;

  const add = () => {
    const resumen = arma.pasos.map((p) =>
    (sel[p.id] || []).map((id) => p.opciones.find((o) => o.id === id)?.nombre).join(', ')
    ).filter(Boolean).join(' · ');
    setCart((c) => {
      const conPlato = [...c, {
        id: dataKey + '-' + Date.now(),
        nombre: labelCart,
        precio: precioTotal,
        cantidad: 1,
        custom: true,
        notas: resumen
      }];
      return ofrecerBebida ? agregarBebidas(conPlato, bebidaSel) : conPlato;
    });
    go({ screen: 'home' });
  };

  return (
    <>
      <Header onBack={() => go({ screen: 'home' })} title={labelTitulo} />
      <div className="pv-body" style={{ paddingBottom: 140 }}>
        <div>
          {arma.pasos.map((paso, pi) => {
            const selPaso = sel[paso.id] || [];
            return (
              <div key={paso.id} style={{ marginTop: pi === 0 ? 0 : 22 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--terracota)' }}>0{pi + 1}</span>
                    <span className="pv-h3" style={{ fontSize: 18 }}>{paso.titulo}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--tierra-soft)' }}>{paso.sub} {selPaso.length}/{paso.max}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {paso.opciones.filter((op) => !op.inactivo).map((op) => {
                    const active = selPaso.includes(op.id);
                    const disabled = !active && selPaso.length >= paso.max;
                    return (
                      <button
                        key={op.id}
                        className="pv-chip"
                        aria-pressed={active}
                        disabled={disabled}
                        style={{ fontSize: 13, padding: '8px 14px', opacity: disabled ? 0.4 : 1 }}
                        onClick={() => !disabled && toggle(paso.id, op.id, paso.max)}
                      >
                        {op.nombre}
                        {op.precio > 0 && (
                          <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, opacity: active ? 0.85 : 0.65 }}>
                            +{window.formatPrecio(op.precio)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        {ofrecerBebida && <BebidasAddon seleccion={bebidaSel} onSelect={onSelectBebida} />}
      </div>
      <div className="pv-cart-bar" onClick={completo ? add : null} style={{
        opacity: completo ? 1 : 0.6, cursor: completo ? 'pointer' : 'not-allowed',
        background: completo ? 'var(--terracota)' : 'var(--tierra)'
      }}>
        <div>
          <small style={{ opacity: 0.85 }}>{totalSel} ingredientes elegidos</small>
          <div style={{ fontWeight: 600, fontSize: 15, marginTop: 2 }}>
            {completo ? (
              hayDescArma ? (
                <span style={{ display: 'inline-flex', gap: 6, alignItems: 'baseline' }}>
                  Agregar ·
                  <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>{window.formatPrecio(precioBruto)}</span>
                  <span>{window.formatPrecio(precioTotal)}</span>
                </span>
              ) : `Agregar · ${window.formatPrecio(precioTotal)}`
            ) : (kind === 'comida' ? 'Elegí al menos 1 paso' : 'Elegí al menos 3 pasos')}
          </div>
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 999,
          background: completo ? 'oklch(0.36 0.05 50)' : 'var(--crema-deep)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: completo ? 'var(--hueso)' : 'var(--tierra-soft)', fontSize: 20, fontWeight: 600
        }}>+</div>
      </div>
    </>);

}

// ── CARRITO ──
function CarritoScreen({ go, cart, setCart }) {
  const subtotal = cart.reduce((a, i) => a + i.precio * i.cantidad, 0);
  const total = subtotal;

  const upd = (idx, delta) => {
    setCart((c) => {
      const next = [...c];
      next[idx] = { ...next[idx], cantidad: next[idx].cantidad + delta };
      return next.filter((it) => it.cantidad > 0);
    });
  };

  return (
    <>
      <Header onBack={() => go({ screen: 'home' })} title="Tu pedido" />
      <div className="pv-body" style={{ paddingBottom: 140 }}>
        {cart.length === 0 ?
        <div style={{ textAlign: 'center', padding: '60px 30px' }}>
            <div className="pv-h3" style={{ marginBottom: 10 }}>Tu canasta está vacía</div>
            <div className="pv-meta">Volvé al menú y elegí lo de hoy.</div>
            <button className="pv-btn" style={{ marginTop: 24 }} onClick={() => go({ screen: 'home' })}>Ver menú</button>
          </div> :

        <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cart.map((it, i) =>
            <div key={i} className="pv-card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}>{it.nombre}</div>
                    {it.notas && <div style={{ fontSize: 11, color: 'var(--tierra-soft)', marginTop: 4, lineHeight: 1.35,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                }}>{it.notas}</div>}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--terracota)' }}>{window.formatPrecio(it.precio * it.cantidad)}</div>
                      <div className="pv-stepper" style={{ padding: 2, gap: 8 }}>
                        <button style={{ width: 28, height: 28 }} onClick={() => upd(i, -1)}>−</button>
                        <span className="pv-stepper-val" style={{ fontSize: 13 }}>{it.cantidad}</span>
                        <button style={{ width: 28, height: 28 }} onClick={() => upd(i, 1)}>+</button>
                      </div>
                    </div>
                  </div>
                </div>
            )}
            </div>

            <div style={{ marginTop: 22, padding: 18, background: 'var(--hueso)', border: '1px solid var(--crema-line)', borderRadius: 18 }}>
              <Row label="Subtotal" value={window.formatPrecio(subtotal)} />
              <div style={{ height: 1, background: 'var(--crema-line)', margin: '12px 0' }} />
              <Row label="Total" value={window.formatPrecio(total)} bold />
            </div>

            <div style={{ marginTop: 16, padding: 14, borderRadius: 14, background: 'var(--terracota-soft)', display: 'flex', gap: 8, alignItems: 'center' }}>
              {Icon.clock('oklch(0.36 0.08 40)')}
              <div style={{ fontSize: 12, color: 'oklch(0.36 0.08 40)' }}>Entrega estimada hoy de 12:00 a 13:00</div>
            </div>
          </>
        }
      </div>
      {cart.length > 0 &&
      <div className="pv-cart-bar" onClick={() => go({ screen: 'checkout' })}>
          <div>
            <small>Total {window.formatPrecio(total)}</small>
            <div style={{ fontWeight: 600, fontSize: 15, marginTop: 2 }}>Ir a pagar</div>
          </div>
          <div style={{ fontSize: 18 }}>→</div>
        </div>
      }
    </>);

}

function Row({ label, value, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
      <div style={{ fontSize: bold ? 16 : 13, color: bold ? 'var(--tierra)' : 'var(--tierra-soft)', fontWeight: bold ? 600 : 400 }}>{label}</div>
      <div style={{ fontSize: bold ? 18 : 13, fontWeight: bold ? 700 : 500, color: 'var(--tierra)' }}>{value}</div>
    </div>);

}

// ── CHECKOUT ──
function CheckoutScreen({ go, cart, setCart }) {
  const [form, setForm] = useState({
    nombre: '',
    dir: '',
    pago: 'transferencia'
  });
  const [errors, setErrors] = useState({ nombre: false, dir: false });
  const subtotal = cart.reduce((a, i) => a + i.precio * i.cantidad, 0);
  const total = subtotal;

  const setF = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: false }));
  };

  return (
    <>
      <Header onBack={() => go({ screen: 'carrito' })} title="Confirmar pedido" />
      <div className="pv-body" style={{ paddingBottom: 140 }}>
        <div className="pv-eyebrow" style={{ marginBottom: 4 }}>Entrega</div>
        <div className="pv-h3" style={{ marginBottom: 14 }}>¿Dónde la dejamos?</div>
        <div className="pv-field">
          <label className="pv-label">Nombre</label>
          <input
            className="pv-input"
            value={form.nombre}
            onChange={(e) => setF('nombre', e.target.value)}
            style={errors.nombre ? { borderColor: 'oklch(0.55 0.2 28)' } : {}} />
          
          {errors.nombre &&
          <div style={{ fontSize: 12, color: 'oklch(0.5 0.2 28)', marginTop: 6 }}>
              Por favor, ingresá tu nombre.
            </div>
          }
        </div>
        <div className="pv-field">
          <label className="pv-label">Dirección</label>
          <input
            className="pv-input"
            value={form.dir}
            onChange={(e) => setF('dir', e.target.value)}
            style={errors.dir ? { borderColor: 'oklch(0.55 0.2 28)' } : {}} />
          
          {errors.dir &&
          <div style={{ fontSize: 12, color: 'oklch(0.5 0.2 28)', marginTop: 6 }}>
              Por favor, ingresá la dirección de entrega.
            </div>
          }
        </div>

        <div className="pv-eyebrow" style={{ marginTop: 24, marginBottom: 4 }}>Pago</div>
        <div className="pv-h3" style={{ marginBottom: 14 }}>Forma de pago</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
          { id: 'transferencia', label: 'Transferencia', sub: '' },
          { id: 'efectivo', label: 'Efectivo al entregar', sub: '' }].
          map((o) => {
            const sel = form.pago === o.id;
            return (
              <div key={o.id} className="pv-card pv-card-tap" onClick={() => setF('pago', o.id)} style={{
                padding: 14, display: 'flex', alignItems: 'center', gap: 12,
                borderColor: sel ? 'var(--terracota)' : 'var(--crema-line)',
                background: sel ? 'var(--terracota-soft)' : 'var(--hueso)'
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 999, border: '2px solid',
                  borderColor: sel ? 'var(--terracota)' : 'var(--crema-line)',
                  background: sel ? 'var(--terracota)' : 'transparent',
                  boxShadow: sel ? 'inset 0 0 0 3px var(--hueso)' : 'none',
                  flexShrink: 0
                }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{o.label}</div>
                  {o.sub && <div style={{ fontSize: 12, color: 'var(--tierra-soft)' }}>{o.sub}</div>}
                </div>
              </div>);

          })}
        </div>

        <div style={{ marginTop: 22, padding: 16, background: 'var(--hueso)', border: '1px solid var(--crema-line)', borderRadius: 16 }}>
          <Row label="Subtotal" value={window.formatPrecio(subtotal)} />
          <div style={{ height: 1, background: 'var(--crema-line)', margin: '10px 0' }} />
          <Row label="Total a pagar" value={window.formatPrecio(total)} bold />
        </div>
      </div>
      <div className="pv-cart-bar" onClick={() => {
        const faltaNombre = !form.nombre.trim();
        const faltaDir = !form.dir.trim();
        if (faltaNombre || faltaDir) {
          setErrors({ nombre: faltaNombre, dir: faltaDir });
          return;
        }
        const D = window.MENU_DATA;
        const numero = (D.home.whatsapp || '').replace(/\D/g, '');
        const lineas = cart.map((it) =>
        `• ${it.cantidad}x ${it.nombre}${it.notas ? ` (${it.notas})` : ''} — ${window.formatPrecio(it.precio * it.cantidad)}`
        ).join('\n');
        const msg = [
        '*Nuevo pedido — Pachamama Viandas*',
        '',
        `*Cliente:* ${form.nombre}`,
        `*Dirección:* ${form.dir}`,
        `*Pago:* ${form.pago === 'transferencia' ? 'Transferencia' : 'Efectivo al entregar'}`,
        '',
        '*Pedido:*',
        lineas,
        '',
        `*Total:* ${window.formatPrecio(total)}`].
        join('\n');
        if (numero) {
          window.open(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`, '_blank');
        }
        go({ screen: 'confirm', form, total });
      }}>
        <div>
          <small>Total {window.formatPrecio(total)}</small>
          <div style={{ fontWeight: 600, fontSize: 15, marginTop: 2 }}>Confirmar pedido</div>
        </div>
        <div style={{ fontSize: 18 }}>→</div>
      </div>
    </>);

}

// ── CONFIRMACIÓN ──
function ConfirmScreen({ state, go, setCart }) {
  const [copiado, setCopiado] = useState('');
  const codigo = useMemo(() => 'PV-' + Math.floor(Math.random() * 9000 + 1000), []);
  const D = window.MENU_DATA;
  const esTransferencia = state.form?.pago === 'transferencia';
  const [soloRecibido, setSoloRecibido] = useState(false);
  const fueOculta = useRef(false);

  // Una vez que el cliente sale de la página (abre WhatsApp, cambia de app/pestaña)
  // y vuelve, dejamos solo el mensaje "Recibimos tu pedido" con el tilde verde —
  // sin los datos de transferencia ni el resto.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') fueOculta.current = true;
      else if (fueOculta.current) setSoloRecibido(true);
    };
    const onPageShow = (e) => { if (e.persisted) setSoloRecibido(true); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, []);

  const copiar = (texto, key) => {
    try {
      navigator.clipboard.writeText(texto);
      setCopiado(key);
      setTimeout(() => setCopiado(''), 1800);
    } catch (e) {}
  };

  return (
    <>
      <Header title="¡Listo!" />
      <div className="pv-body" style={{ textAlign: 'center', paddingTop: 20 }}>
        <div className="pv-checkmark">{Icon.check('var(--hueso)')}</div>
        <div className="pv-eyebrow">Pedido {codigo}</div>
        <div className="pv-h2" style={{ marginTop: 8 }}>
          Recibimos<br />tu pedido.
        </div>
        <div className="pv-body-text" style={{ marginTop: 12, padding: '0 24px' }}>
          Te llega hoy entre las <b>12:00 y 13:00</b>. Te avisamos por WhatsApp cuando salga del local.
        </div>

        {!soloRecibido && esTransferencia && (
          <div className="pv-card" style={{ marginTop: 24, textAlign: 'left', background: 'var(--terracota-soft)', borderColor: 'transparent' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'oklch(0.4 0.12 40)' }}>Transferí para confirmar</span>
            </div>
            <div style={{ fontSize: 13, color: 'oklch(0.36 0.08 40)', marginBottom: 14, lineHeight: 1.4 }}>
              Hacé la transferencia a este alias desde tu billetera o banco. Después mandanos el comprobante por WhatsApp.
            </div>

            {/* Alias */}
            <div style={{
              background: 'var(--hueso)', borderRadius: 12, padding: '12px 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8,
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10, color: 'var(--tierra-soft)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Alias {D.home.transferBanco ? `· ${D.home.transferBanco}` : ''}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--tierra)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{D.home.transferAlias}</div>
              </div>
              <button className="pv-btn pv-btn-sm" style={{ flexShrink: 0 }} onClick={() => copiar(D.home.transferAlias, 'alias')}>
                {copiado === 'alias' ? '¡Copiado!' : 'Copiar'}
              </button>
            </div>

            {/* Monto */}
            <div style={{
              background: 'var(--hueso)', borderRadius: 12, padding: '12px 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8,
            }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--tierra-soft)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Monto a transferir</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--tierra)' }}>{window.formatPrecio(state.total || 0)}</div>
              </div>
              <button className="pv-btn pv-btn-sm" style={{ flexShrink: 0 }} onClick={() => copiar(String(state.total || 0), 'monto')}>
                {copiado === 'monto' ? '¡Copiado!' : 'Copiar'}
              </button>
            </div>

            {D.home.transferTitular && (
              <div style={{ fontSize: 12, color: 'oklch(0.36 0.08 40)', marginTop: 6 }}>
                Titular: <b>{D.home.transferTitular}</b>
              </div>
            )}

            <button
              className="pv-btn pv-btn-full"
              style={{ marginTop: 14 }}
              onClick={() => {
                const numero = (D.home.whatsapp || '').replace(/\D/g, '');
                const msg = `Hola! Acabo de hacer una transferencia por ${window.formatPrecio(state.total || 0)} por mi pedido ${codigo}. Adjunto el comprobante.`;
                if (numero) window.open(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`, '_blank');
              }}
            >
              Enviar comprobante por WhatsApp
            </button>
          </div>
        )}

        {!soloRecibido && (
        <div className="pv-card" style={{ marginTop: esTransferencia ? 14 : 28, textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            {Icon.pin('var(--terracota)')}
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--terracota)' }}>Entrega</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{state.form?.nombre || 'Sofía Méndez'}</div>
          <div style={{ fontSize: 13, color: 'var(--tierra-soft)', marginTop: 4 }}>
            {state.form?.dir || 'Honduras 4850, 3°B'}
          </div>
          <div style={{ height: 1, background: 'var(--crema-line)', margin: '14px 0' }} />
          <Row label="Total cobrado" value={window.formatPrecio(state.total || 0)} bold />
        </div>
        )}

        <button className="pv-btn pv-btn-full pv-btn-ghost" style={{ marginTop: 16 }} onClick={() => {setCart([]);go({ screen: 'home' });}}>
          Volver al menú
        </button>
      </div>
    </>);

}

// ════════════════ APP ROOT ════════════════
function App() {
  const LoginScreen = window.LoginScreen;
  const AdminScreen = window.AdminScreen;
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [state, setState] = useState({ screen: 'home' });
  const [cart, setCart] = useState([]);

  const go = (next) => setState((s) => ({ ...s, ...next }));

  // Apply tweaks to body dataset
  useEffect(() => {
    document.body.dataset.layout = t.layout;
    document.body.dataset.density = t.density;
    document.body.dataset.anim = t.anim ? 'on' : 'off';
  }, [t.layout, t.density, t.anim]);

  const onTapCart = () => go({ screen: 'carrito' });

  const screens = {
    home: <HomeScreen go={go} cart={cart} onTapCart={onTapCart} />,
    menu: <MenuScreen state={state} go={go} cart={cart} onTapCart={onTapCart} />,
    detalle: <DetalleScreen state={state} go={go} cart={cart} setCart={setCart} />,
    arma: <ArmaScreen state={state} go={go} cart={cart} setCart={setCart} variant={t.saladVariant} kind="ensalada" />,
    armaComida: <ArmaScreen state={state} go={go} cart={cart} setCart={setCart} variant={t.saladVariant} kind="comida" />,
    carrito: <CarritoScreen go={go} cart={cart} setCart={setCart} />,
    checkout: <CheckoutScreen go={go} cart={cart} setCart={setCart} />,
    confirm: <ConfirmScreen state={state} go={go} setCart={setCart} />,
    login: <LoginScreen go={go} />,
    admin: <AdminScreen go={go} />
  };

  const labels = {
    home: '01 Home', menu: '02 Menú', detalle: '03 Detalle',
    arma: '04 Arma tu ensalada', armaComida: '05 Arma tu comida', carrito: '06 Carrito', checkout: '07 Checkout', confirm: '08 Confirmación',
    login: '08 Admin login', admin: '09 Admin editor'
  };

  return (
    <div className="pv-stage">
      <div className="pv-app" data-screen-label={labels[state.screen]}>
        {screens[state.screen]}
      </div>

      <TweaksPanel>
        <TweakSection label="Layout" />
        <TweakRadio label="Lista de platos" value={t.layout}
        options={['list', 'grid']}
        onChange={(v) => setTweak('layout', v)} />
        <TweakRadio label="Densidad" value={t.density}
        options={['compact', 'regular', 'comfy']}
        onChange={(v) => setTweak('density', v)} />
        <TweakToggle label="Animaciones" value={t.anim} onChange={(v) => setTweak('anim', v)} />

        <TweakSection label="Arma tu ensalada — Variación" />
        <TweakRadio label="Estilo" value={t.saladVariant}
        options={['lista', 'cards']}
        onChange={(v) => setTweak('saladVariant', v)} />
        <div style={{ fontSize: 10.5, color: 'rgba(41,38,27,.55)', lineHeight: 1.4, marginTop: -4 }}>
          <b>lista</b>: pasos numerados con resumen · <b>cards</b>: grid con fotos de cada ingrediente
        </div>

        <TweakSection label="Navegación" />
        <TweakButton label="Ir a Home" onClick={() => setState({ screen: 'home' })} />
        <TweakButton label="Opción 1 · Arma" onClick={() => setState({ screen: 'menu', opcion: 1, categoria: 'arma' })} />
        <TweakButton label="Opción 2 · Ensaladas" onClick={() => setState({ screen: 'menu', opcion: 2, categoria: 'ensaladas' })} />
        <TweakButton label="Arma tu ensalada" onClick={() => setState({ screen: 'arma' })} />
      </TweaksPanel>
    </div>);

}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);