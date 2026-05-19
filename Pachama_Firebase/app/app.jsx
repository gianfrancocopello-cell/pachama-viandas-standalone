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

// ── HOME ──
function HomeScreen({ go, cart, onTapCart }) {
  const A = getAdmin();
  const D = window.MENU_DATA;
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
      <div className="pv-body pv-body-with-cart">
        <div className="pv-home-hero" style={{ margin: "0px 100px 32px 0px" }}>
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
          <img className="pv-home-hero-logo" src="app/assets/logo.png" alt="Pachamama Viandas" />
        </div>

        {/* Opciones */}
        <div className="pv-options-grid">
          {[1, 2, 3].map((n) => {
            const op = D.opciones[n];
            const isOne = n === 1;
            const isArma = n === 3;
            const onTap = isArma ?
            () => go({ screen: 'arma', opcion: 1, categoria: 'arma' }) :
            () => go({ screen: 'menu', opcion: n, categoria: op.categorias[0] });
            return (
              <div
                key={n}
                className="pv-card pv-card-tap"
                onClick={onTap}
                style={{
                  background: isOne ? 'var(--tierra)' : isArma ? 'var(--verde-soft)' : 'var(--hueso)',
                  color: isOne ? 'var(--hueso)' : isArma ? 'oklch(0.28 0.08 130)' : 'var(--tierra)',
                  borderColor: isOne ? 'var(--tierra)' : isArma ? 'transparent' : 'var(--crema-line)',
                  position: 'relative', overflow: 'hidden', padding: 22
                }}>
                
                <div style={{
                  position: 'absolute', right: -30, top: -30, width: 160, height: 160,
                  borderRadius: '50%',
                  background: isOne ?
                  'oklch(0.36 0.05 50)' :
                  isArma ?
                  'radial-gradient(circle at 30% 30%, oklch(0.95 0.04 130) 0%, oklch(0.78 0.08 130) 100%)' :
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
                  <div style={{
                    display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 18
                  }}>
                    <span style={{ fontSize: 11, opacity: 0.7 }}>Desde</span>
                    <span style={{ fontSize: 22, fontWeight: 600 }}>{window.formatPrecio(op.precioDesde)}</span>
                  </div>
                  <div style={{
                    marginTop: 14, display: 'flex', gap: 6, flexWrap: 'wrap'
                  }}>
                    {!isArma && op.categorias.map((c) =>
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
    </>);

}

// ── MENU LIST ──
function MenuScreen({ state, go, cart, onTapCart }) {
  getAdmin();
  const D = window.MENU_DATA;
  const op = D.opciones[state.opcion];
  const cats = op.categorias;
  const cat = state.categoria;

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

        {/* Tabs */}
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
          platos={D.platos[cat][state.opcion]}
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
  return (
    <div className="pv-list-grid">
      {platos.map((p) => <DishCard key={p.id} plato={p} onTap={() => onTap(p)} />)}
    </div>);

}

function DishCard({ plato, onTap }) {
  const layout = document.body.dataset.layout;
  const agotado = !!plato.agotado;
  const handleTap = agotado ? undefined : onTap;
  const wrapCls = `pv-card pv-card-tap${agotado ? ' pv-card-agotado' : ''}`;

  const badge = agotado ?
  <div className="pv-agotado-badge"><span>Agotado</span></div> :
  null;

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
            {agotado ? 'No disponible' : window.formatPrecio(plato.precio)}
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
              {agotado ? 'No disponible' : window.formatPrecio(plato.precio)}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {!agotado && plato.tags.slice(0, 1).map((t) => <span key={t} className="pv-tag pv-tag-veg">{t}</span>)}
            </div>
          </div>
        </div>
      </div>
    </div>);

}

// ── DETALLE ──
function DetalleScreen({ state, go, cart, setCart }) {
  const p = state.plato;
  const [qty, setQty] = useState(1);
  const compls = p.complementarios || [];
  const esEnsalada = !!p.complementarioVisible && compls.length > 0;

  const add = () => {
    setCart((c) => {
      const existing = c.find((it) => it.id === p.id && !it.custom);
      if (existing) {
        return c.map((it) => it.id === p.id && !it.custom ? { ...it, cantidad: it.cantidad + qty } : it);
      }
      return [...c, { id: p.id, nombre: p.nombre, precio: p.precio, cantidad: qty }];
    });
    go({ screen: 'menu', opcion: state.opcion, categoria: state.categoria });
  };

  return (
    <>
      <Header onBack={() => go({ screen: 'menu', opcion: state.opcion, categoria: state.categoria })} title="Detalle" />
      <div className="pv-body" style={{ paddingBottom: 120 }}>
        <Img id={`plato.${p.id}`} veg={true} style={{ height: 200, marginBottom: 18, fontSize: 11 }} />
        <div className="pv-h2">{p.nombre}</div>
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

        <div style={{ marginTop: 26, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="pv-stepper">
            <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
            <span className="pv-stepper-val">{qty}</span>
            <button onClick={() => setQty(qty + 1)}>+</button>
          </div>
          <div style={{ fontSize: 22, fontWeight: 600 }}>{window.formatPrecio(p.precio * qty)}</div>
        </div>
      </div>
      <div className="pv-cart-bar" onClick={add}>
        <div>
          <small>Agregar al pedido</small>
          <div style={{ fontWeight: 600, fontSize: 15, marginTop: 2 }}>Sumar {qty} {qty === 1 ? 'plato' : 'platos'}</div>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{window.formatPrecio(p.precio * qty)}</div>
      </div>
    </>);

}

// ── ARMA TU ENSALADA ──
function ArmaScreen({ state, go, cart, setCart, variant }) {
  const [sel, setSel] = useState({ base: [], proteina: [], toppings: [], aderezo: [] });
  const arma = window.MENU_DATA.arma;

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

  const completo = arma.pasos.every((p) => (sel[p.id] || []).length > 0);
  const totalSel = arma.pasos.reduce((a, p) => a + (sel[p.id] || []).length, 0);

  const add = () => {
    const resumen = arma.pasos.map((p) =>
    (sel[p.id] || []).map((id) => p.opciones.find((o) => o.id === id)?.nombre).join(', ')
    ).filter(Boolean).join(' · ');
    setCart((c) => [...c, {
      id: 'arma-' + Date.now(),
      nombre: 'Ensalada a tu gusto',
      precio: arma.base,
      cantidad: 1,
      custom: true,
      notas: resumen
    }]);
    go({ screen: 'home' });
  };

  return (
    <>
      <Header onBack={() => go({ screen: 'home' })} title="Arma tu ensalada" />
      <div className="pv-body" style={{ paddingBottom: 140 }}>
        <ArmaEnsalada variant={variant} selecciones={sel} onToggle={toggle} />
      </div>
      <div className="pv-cart-bar" onClick={completo ? add : null} style={{
        opacity: completo ? 1 : 0.6, cursor: completo ? 'pointer' : 'not-allowed',
        background: completo ? 'var(--terracota)' : 'var(--tierra)'
      }}>
        <div>
          <small style={{ opacity: 0.85 }}>{totalSel} ingredientes elegidos</small>
          <div style={{ fontWeight: 600, fontSize: 15, marginTop: 2 }}>
            {completo ? `Agregar · ${window.formatPrecio(arma.base)}` : 'Completá los pasos'}
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
  const envio = subtotal >= 9000 ? 0 : 900;
  const total = subtotal + envio;

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
                  <Img id={`plato.${it.id}`} veg={!it.custom} style={{ width: 64, height: 64, borderRadius: 12, flexShrink: 0, fontSize: 9 }} />
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
              <Row label={`Envío${envio === 0 ? ' (gratis)' : ''}`} value={envio === 0 ? 'Gratis' : window.formatPrecio(envio)} />
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
  const envio = subtotal >= 9000 ? 0 : 900;
  const total = subtotal + envio;

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
            style={errors.nombre ? { borderColor: 'oklch(0.55 0.2 28)' } : {}}
          />
          {errors.nombre && (
            <div style={{ fontSize: 12, color: 'oklch(0.5 0.2 28)', marginTop: 6 }}>
              Por favor, ingresá tu nombre.
            </div>
          )}
        </div>
        <div className="pv-field">
          <label className="pv-label">Dirección</label>
          <input
            className="pv-input"
            value={form.dir}
            onChange={(e) => setF('dir', e.target.value)}
            style={errors.dir ? { borderColor: 'oklch(0.55 0.2 28)' } : {}}
          />
          {errors.dir && (
            <div style={{ fontSize: 12, color: 'oklch(0.5 0.2 28)', marginTop: 6 }}>
              Por favor, ingresá la dirección de entrega.
            </div>
          )}
        </div>

        <div className="pv-eyebrow" style={{ marginTop: 24, marginBottom: 4 }}>Pago</div>
        <div className="pv-h3" style={{ marginBottom: 14 }}>Forma de pago</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
          { id: 'transferencia', label: 'Transferencia', sub: 'CBU / alias bancario' },
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
          <Row label={envio === 0 ? 'Envío (gratis)' : 'Envío'} value={envio === 0 ? 'Gratis' : window.formatPrecio(envio)} />
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
  useEffect(() => {
    return () => {};
  }, []);
  const codigo = useMemo(() => 'PV-' + Math.floor(Math.random() * 9000 + 1000), []);
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

        <div className="pv-card" style={{ marginTop: 28, textAlign: 'left' }}>
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

        <button className="pv-btn pv-btn-full" style={{ marginTop: 28 }} onClick={() => {setCart([]);go({ screen: 'home' });}}>
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
    arma: <ArmaScreen state={state} go={go} cart={cart} setCart={setCart} variant={t.saladVariant} />,
    carrito: <CarritoScreen go={go} cart={cart} setCart={setCart} />,
    checkout: <CheckoutScreen go={go} cart={cart} setCart={setCart} />,
    confirm: <ConfirmScreen state={state} go={go} setCart={setCart} />,
    login: <LoginScreen go={go} />,
    admin: <AdminScreen go={go} />
  };

  const labels = {
    home: '01 Home', menu: '02 Menú', detalle: '03 Detalle',
    arma: '04 Arma tu ensalada', carrito: '05 Carrito', checkout: '06 Checkout', confirm: '07 Confirmación',
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