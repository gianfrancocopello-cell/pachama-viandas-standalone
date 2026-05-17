// Arma tu ensalada — 3 variaciones single-screen.
// Recibe: {selecciones, onToggle, onPriceChange} y renderiza según `variant`.

const { useMemo } = React;

function ArmaEnsalada({ variant = 'lista', selecciones, onToggle }) {
  const arma = window.MENU_DATA.arma;

  if (variant === 'cards') return <ArmaCards arma={arma} sel={selecciones} onToggle={onToggle} />;
  return <ArmaLista arma={arma} sel={selecciones} onToggle={onToggle} />;
}

// ---------- VARIACIÓN A: Bowl visual central ----------
function ArmaBowl({ arma, sel, onToggle }) {
  const allSelections = useMemo(() => {
    return arma.pasos.flatMap((p) =>
      (sel[p.id] || []).map((id) => ({ paso: p.id, id }))
    );
  }, [sel, arma.pasos]);

  // Genera puntos en el bowl, color por paso
  const colorFor = (paso) => ({
    base: 'oklch(0.6 0.1 130)',
    proteina: 'oklch(0.55 0.12 40)',
    toppings: 'oklch(0.7 0.13 70)',
    aderezo: 'oklch(0.85 0.08 90)',
  }[paso] || 'oklch(0.6 0.05 50)');

  return (
    <div>
      {/* Bowl visual */}
      <div className="pv-bowl-wrap">
        <div className="pv-bowl-bg" />
        {allSelections.length === 0 && (
          <div className="pv-bowl-empty"><div>Tu bowl vacío<br/>empezá eligiendo una base</div></div>
        )}
        <div className="pv-bowl-fill">
          {allSelections.map((s, i) => (
            <div
              key={s.paso + s.id}
              className="pv-bowl-dot"
              style={{
                background: colorFor(s.paso),
                width: s.paso === 'base' ? 28 : s.paso === 'proteina' ? 24 : 16,
                height: s.paso === 'base' ? 28 : s.paso === 'proteina' ? 24 : 16,
                transform: `rotate(${i * 23}deg)`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Pasos */}
      {arma.pasos.map((paso) => (
        <div key={paso.id} style={{ marginTop: 22 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div className="pv-h3" style={{ fontSize: 20 }}>{paso.titulo}</div>
              <div className="pv-meta">{paso.sub}</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--tierra-soft)' }}>
              {(sel[paso.id] || []).length}/{paso.max}
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {paso.opciones.map((op) => {
              const active = (sel[paso.id] || []).includes(op.id);
              return (
                <button
                  key={op.id}
                  className={`pv-chip ${paso.id === 'base' || paso.id === 'toppings' ? 'pv-chip-veg' : ''}`}
                  aria-pressed={active}
                  onClick={() => onToggle(paso.id, op.id, paso.max)}
                >
                  {op.nombre}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- VARIACIÓN B: Lista compacta con resumen sticky ----------
function ArmaLista({ arma, sel, onToggle }) {
  const totalSel = arma.pasos.reduce((a, p) => a + (sel[p.id] || []).length, 0);

  return (
    <div>
      {/* Resumen */}
      <div className="pv-card" style={{ background: 'var(--terracota-soft)', borderColor: 'transparent', marginBottom: 14 }}>
        <div className="pv-eyebrow" style={{ color: 'oklch(0.42 0.1 40)' }}>Tu ensalada</div>
        <div className="pv-h3" style={{ fontSize: 22, marginTop: 4, color: 'oklch(0.32 0.08 40)' }}>
          {totalSel === 0 ? 'Empezá a armarla' : `${totalSel} ${totalSel === 1 ? 'ingrediente' : 'ingredientes'}`}
        </div>
        {totalSel > 0 && (
          <div style={{ marginTop: 10, fontSize: 12, color: 'oklch(0.32 0.08 40)', lineHeight: 1.5 }}>
            {arma.pasos.map((p) => {
              const items = (sel[p.id] || []).map((id) => p.opciones.find((o) => o.id === id)?.nombre).join(' · ');
              return items ? <div key={p.id}><b style={{ fontWeight: 600 }}>{p.titulo}:</b> {items}</div> : null;
            })}
          </div>
        )}
      </div>

      {/* Pasos como filas compactas */}
      {arma.pasos.map((paso, i) => (
        <div key={paso.id} style={{ marginTop: i === 0 ? 0 : 18 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--terracota)' }}>0{i+1}</span>
              <span className="pv-h3" style={{ fontSize: 18 }}>{paso.titulo}</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--tierra-soft)' }}>{paso.sub}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {paso.opciones.map((op) => {
              const active = (sel[paso.id] || []).includes(op.id);
              return (
                <button
                  key={op.id}
                  className="pv-chip"
                  aria-pressed={active}
                  style={{ fontSize: 12, padding: '6px 12px' }}
                  onClick={() => onToggle(paso.id, op.id, paso.max)}
                >
                  {active && '✓ '}{op.nombre}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- VARIACIÓN C: Cards con imágenes ----------
function ArmaCards({ arma, sel, onToggle }) {
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div className="pv-eyebrow">Arma tu ensalada</div>
        <div className="pv-h2" style={{ marginTop: 4 }}>Cada<br/>ingrediente.</div>
      </div>

      {arma.pasos.map((paso) => {
        const count = (sel[paso.id] || []).length;
        return (
          <div key={paso.id} style={{ marginTop: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div className="pv-h3" style={{ fontSize: 19 }}>{paso.titulo}</div>
              <div className="pv-tag" style={{
                background: count > 0 ? 'var(--terracota)' : 'var(--crema-deep)',
                color: count > 0 ? 'var(--hueso)' : 'var(--tierra-soft)',
              }}>
                {count} de {paso.max}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {paso.opciones.map((op) => {
                const active = (sel[paso.id] || []).includes(op.id);
                return (
                  <button
                    key={op.id}
                    onClick={() => onToggle(paso.id, op.id, paso.max)}
                    style={{
                      appearance: 'none',
                      background: active ? 'var(--terracota)' : 'var(--hueso)',
                      color: active ? 'var(--hueso)' : 'var(--tierra)',
                      border: '1px solid',
                      borderColor: active ? 'var(--terracota)' : 'var(--crema-line)',
                      borderRadius: 16,
                      padding: 10,
                      display: 'flex', flexDirection: 'column', gap: 8,
                      textAlign: 'left', cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    <div className={`pv-img ${paso.id === 'base' || paso.id === 'toppings' ? 'pv-img-veg' : ''}`}
                      style={{ width: '100%', aspectRatio: '1.4/1', borderRadius: 10, fontSize: 9,
                              ...(active ? { opacity: 0.85 } : {})
                      }}>
                      foto
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.2 }}>{op.nombre}</div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { ArmaEnsalada });
