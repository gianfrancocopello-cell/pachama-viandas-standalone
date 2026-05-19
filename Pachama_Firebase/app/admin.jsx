// Admin module: auth + overrides (texts/numbers/images) persisted en localStorage.

const ADMIN_EMAILS = ['gianfrancocopello@gmail.com', 'gracielaaideegarcia@gmail.com', 'copellopujol@gmail.com'];
const LS_OVERRIDES = 'pv_overrides_v1';
const LS_IMAGES = 'pv_images_v1';
const LS_SESSION = 'pv_admin_session_v1';

// ---------- Storage ----------
function loadJSON(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function saveJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ---------- Apply overrides to MENU_DATA (mutates) ----------
function applyOverrides(overrides) {
  const D = window.MENU_DATA;
  if (!D || !D.__base) {
    // Save a deep clone of original so we can reset
    D.__base = JSON.parse(JSON.stringify({
      home: D.home, opciones: D.opciones, platos: D.platos, arma: D.arma,
    }));
  }
  // Reset from base, then re-apply overrides
  const base = D.__base;
  D.home = JSON.parse(JSON.stringify(base.home));
  D.opciones = JSON.parse(JSON.stringify(base.opciones));
  D.platos = JSON.parse(JSON.stringify(base.platos));
  D.arma = JSON.parse(JSON.stringify(base.arma));

  for (const path in overrides) {
    setByPath(D, path, overrides[path]);
  }
}
function setByPath(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (cur[parts[i]] == null) return;
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}
function getByPath(obj, path) {
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

// ---------- Firestore helpers ----------
const FS_DOC = 'menu/overrides';
const FS_IMAGES_DOC = 'menu/images';

function saveOverridesToFirestore(overrides) {
  if (!window.__db) return;
  window.__db.doc(FS_DOC).set({ data: overrides }).catch(console.error);
}
function saveImagesToFirestore(images) {
  if (!window.__db) return;
  window.__db.doc(FS_IMAGES_DOC).set({ data: images }).catch(console.error);
}

// ---------- Admin store (singleton) ----------
window.__pvAdmin = window.__pvAdmin || {
  overrides: loadJSON(LS_OVERRIDES, {}),
  images: loadJSON(LS_IMAGES, {}),
  session: loadJSON(LS_SESSION, null),
  listeners: new Set(),
  _fsUnsub: null,
  _fsImgUnsub: null,
  notify() { this.listeners.forEach(fn => fn()); },

  // Conectar Firestore — llamado una vez al iniciar
  connectFirestore() {
    if (this._fsUnsub || !window.__db) return;
    // Escuchar cambios en overrides en tiempo real
    this._fsUnsub = window.__db.doc(FS_DOC).onSnapshot((snap) => {
      const remote = snap.exists ? (snap.data().data || {}) : {};
      this.overrides = remote;
      saveJSON(LS_OVERRIDES, remote);
      applyOverrides(remote);
      this.notify();
    }, console.error);
    // Escuchar cambios en imágenes en tiempo real
    this._fsImgUnsub = window.__db.doc(FS_IMAGES_DOC).onSnapshot((snap) => {
      const remote = snap.exists ? (snap.data().data || {}) : {};
      this.images = remote;
      saveJSON(LS_IMAGES, remote);
      this.notify();
    }, console.error);
  },

  setOverride(path, value) {
    this.overrides = { ...this.overrides, [path]: value };
    saveJSON(LS_OVERRIDES, this.overrides);
    saveOverridesToFirestore(this.overrides);
    applyOverrides(this.overrides);
    this.notify();
  },
  clearOverride(path) {
    const next = { ...this.overrides };
    delete next[path];
    this.overrides = next;
    saveJSON(LS_OVERRIDES, next);
    saveOverridesToFirestore(next);
    applyOverrides(next);
    this.notify();
  },
  setImage(id, dataUrl) {
    this.images = { ...this.images, [id]: dataUrl };
    saveJSON(LS_IMAGES, this.images);
    saveImagesToFirestore(this.images);
    this.notify();
  },
  clearImage(id) {
    const next = { ...this.images };
    delete next[id];
    this.images = next;
    saveJSON(LS_IMAGES, next);
    saveImagesToFirestore(next);
    this.notify();
  },
  resetAll() {
    this.overrides = {};
    this.images = {};
    saveJSON(LS_OVERRIDES, {});
    saveJSON(LS_IMAGES, {});
    saveOverridesToFirestore({});
    saveImagesToFirestore({});
    applyOverrides({});
    this.notify();
  },
  login(email) {
    const normalized = email.trim().toLowerCase();
    if (ADMIN_EMAILS.includes(normalized)) {
      this.session = { email: normalized };
      saveJSON(LS_SESSION, this.session);
      this.notify();
      return true;
    }
    return false;
  },
  logout() {
    this.session = null;
    saveJSON(LS_SESSION, null);
    this.notify();
  },
  isAdmin() { return !!this.session; },
};

// Aplicar overrides locales al iniciar (mientras carga Firestore)
applyOverrides(window.__pvAdmin.overrides);

// Conectar Firestore para sincronización en tiempo real
window.__pvAdmin.connectFirestore();

// ---------- React hook ----------
function useAdmin() {
  const A = window.__pvAdmin;
  const [, setT] = React.useState(0);
  React.useEffect(() => {
    const fn = () => setT((x) => x + 1);
    A.listeners.add(fn);
    return () => A.listeners.delete(fn);
  }, []);
  return A;
}

// ---------- EditableImg ----------
function EditableImg({ id, veg = false, className = '', style = {}, placeholder = 'foto' }) {
  const A = useAdmin();
  const src = A.images[id];
  const baseCls = `pv-img ${veg ? 'pv-img-veg' : ''} ${className}`.trim();
  if (src) {
    return (
      <div className={baseCls} style={{ ...style, backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <span style={{ display: 'none' }}>{placeholder}</span>
      </div>
    );
  }
  return <div className={baseCls} style={style}>{placeholder}</div>;
}

// ════════════ LOGIN SCREEN ════════════
function LoginScreen({ go }) {
  const A = useAdmin();
  const [email, setEmail] = React.useState('');
  const [err, setErr] = React.useState('');

  const submit = (e) => {
    if (e) e.preventDefault();
    if (A.login(email)) {
      setErr('');
      go({ screen: 'admin' });
    } else {
      setErr('Email no autorizado.');
    }
  };

  return (
    <>
      <div className="pv-header">
        <div className="pv-header-bar">
          <button className="pv-back" onClick={() => go({ screen: 'home' })} aria-label="Volver">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M15 6l-6 6 6 6" stroke="var(--tierra)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="pv-header-title">Administrador</div>
          <div style={{ width: 38 }} />
        </div>
      </div>
      <div className="pv-body" style={{ paddingTop: 30 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 999,
          background: 'var(--terracota-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '20px auto 18px',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="10" width="16" height="11" rx="2" stroke="var(--terracota)" strokeWidth="2"/>
            <path d="M8 10V7a4 4 0 018 0v3" stroke="var(--terracota)" strokeWidth="2"/>
          </svg>
        </div>
        <div className="pv-h2" style={{ textAlign: 'center' }}>Iniciar sesión</div>
        <div className="pv-meta" style={{ textAlign: 'center', marginTop: 8, padding: '0 20px' }}>
          Acceso restringido. Solo el administrador autorizado puede editar el menú.
        </div>

        <form onSubmit={submit} style={{ marginTop: 28 }}>
          <div className="pv-field">
            <label className="pv-label">Email</label>
            <input
              className="pv-input"
              type="email"
              autoComplete="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErr(''); }}
              style={err ? { borderColor: 'var(--warn)' } : {}}
            />
            {err && (
              <div style={{ fontSize: 12, color: 'var(--warn)', marginTop: 6 }}>
                {err}
              </div>
            )}
          </div>
          <button type="submit" className="pv-btn pv-btn-full" style={{ marginTop: 8 }}>
            Ingresar
          </button>
        </form>
      </div>
    </>
  );
}

// ════════════ ADMIN DASHBOARD ════════════
function AdminScreen({ go }) {
  const A = useAdmin();
  const [tab, setTab] = React.useState('general');
  const D = window.MENU_DATA;

  if (!A.isAdmin()) {
    React.useEffect(() => { go({ screen: 'login' }); }, []);
    return null;
  }

  const handleLogout = () => {
    A.logout();
    go({ screen: 'home' });
  };

  return (
    <>
      <div className="pv-header">
        <div className="pv-header-bar">
          <button className="pv-back" onClick={() => go({ screen: 'home' })} aria-label="Volver">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M15 6l-6 6 6 6" stroke="var(--tierra)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="pv-header-title">Editor</div>
          <button onClick={handleLogout} style={{
            appearance: 'none', border: 0, background: 'transparent',
            color: 'var(--tierra-soft)', fontSize: 12, cursor: 'pointer',
            padding: 8, fontFamily: 'inherit',
          }}>Salir</button>
        </div>
      </div>
      <div className="pv-body" style={{ paddingBottom: 100 }}>
        <div style={{ marginBottom: 14 }}>
          <div className="pv-eyebrow">Conectado como</div>
          <div style={{ fontSize: 13, color: 'var(--tierra)', marginTop: 2 }}>{A.session.email}</div>
        </div>

        <div className="pv-tabs" style={{ marginBottom: 18 }}>
          {[
            { id: 'general', label: 'General' },
            { id: 'opciones', label: 'Opciones' },
            { id: 'platos', label: 'Platos' },
            { id: 'arma', label: 'Arma' },
          ].map((t) => (
            <div
              key={t.id}
              className="pv-tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              style={{ fontSize: 12 }}
            >{t.label}</div>
          ))}
        </div>

        {tab === 'general' && <GeneralEditor />}
        {tab === 'opciones' && <OpcionesEditor />}
        {tab === 'platos' && <PlatosEditor />}
        {tab === 'arma' && <ArmaEditor />}

        <div style={{ marginTop: 30, padding: 16, background: 'oklch(0.96 0.02 30)', borderRadius: 14, border: '1px dashed oklch(0.7 0.1 30)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'oklch(0.45 0.12 30)' }}>Zona de peligro</div>
          <div style={{ fontSize: 11, color: 'oklch(0.45 0.12 30)', marginTop: 4, lineHeight: 1.4 }}>
            Restablece todos los textos, precios e imágenes a los valores originales.
          </div>
          <button
            onClick={() => { if (confirm('¿Restablecer todo? Se perderán los cambios.')) A.resetAll(); }}
            style={{
              marginTop: 10, appearance: 'none', border: '1px solid oklch(0.6 0.15 30)',
              background: 'transparent', color: 'oklch(0.45 0.15 30)',
              padding: '8px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >Restablecer todo</button>
        </div>
      </div>
    </>
  );
}

// ─── Editor blocks ───

function TextField({ label, path, multi = false }) {
  const A = useAdmin();
  const val = getByPath(window.MENU_DATA, path) ?? '';
  const isOverridden = path in A.overrides;
  return (
    <div className="pv-field">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <label className="pv-label" style={{ margin: 0 }}>{label}</label>
        {isOverridden && (
          <button onClick={() => A.clearOverride(path)} style={{
            appearance: 'none', border: 0, background: 'transparent', color: 'var(--terracota)',
            fontSize: 10, fontWeight: 600, cursor: 'pointer', padding: 0,
          }}>Restablecer</button>
        )}
      </div>
      {multi ? (
        <textarea
          className="pv-input"
          style={{ height: 60, padding: 12, resize: 'none', lineHeight: 1.4 }}
          value={val}
          onChange={(e) => A.setOverride(path, e.target.value)}
        />
      ) : (
        <input
          className="pv-input"
          value={val}
          onChange={(e) => A.setOverride(path, e.target.value)}
        />
      )}
    </div>
  );
}

function NumberField({ label, path, prefix = '$' }) {
  const A = useAdmin();
  const val = getByPath(window.MENU_DATA, path) ?? 0;
  const isOverridden = path in A.overrides;
  return (
    <div className="pv-field">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <label className="pv-label" style={{ margin: 0 }}>{label}</label>
        {isOverridden && (
          <button onClick={() => A.clearOverride(path)} style={{
            appearance: 'none', border: 0, background: 'transparent', color: 'var(--terracota)',
            fontSize: 10, fontWeight: 600, cursor: 'pointer', padding: 0,
          }}>Restablecer</button>
        )}
      </div>
      <div style={{ position: 'relative' }}>
        {prefix && (
          <span style={{
            position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--tierra-soft)', fontSize: 15,
          }}>{prefix}</span>
        )}
        <input
          className="pv-input"
          type="number"
          inputMode="numeric"
          style={prefix ? { paddingLeft: 30 } : {}}
          value={val}
          onChange={(e) => A.setOverride(path, parseInt(e.target.value, 10) || 0)}
        />
      </div>
    </div>
  );
}

function ImageField({ label, id }) {
  const A = useAdmin();
  const src = A.images[id];
  const inputRef = React.useRef(null);

  const onPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => A.setImage(id, reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="pv-field">
      <label className="pv-label">{label}</label>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div className="pv-img pv-img-veg" style={{
          width: 70, height: 70, borderRadius: 12, flexShrink: 0, fontSize: 9,
          ...(src ? { backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}),
        }}>
          {!src && 'foto'}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button onClick={() => inputRef.current.click()} style={{
            appearance: 'none', border: '1px solid var(--crema-line)', background: 'var(--hueso)',
            padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit', color: 'var(--tierra)',
          }}>{src ? 'Cambiar imagen' : 'Subir imagen'}</button>
          {src && (
            <button onClick={() => A.clearImage(id)} style={{
              appearance: 'none', border: 0, background: 'transparent',
              fontSize: 11, color: 'var(--terracota)', cursor: 'pointer',
              padding: 0, textAlign: 'left', fontFamily: 'inherit',
            }}>Quitar imagen</button>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" onChange={onPick} style={{ display: 'none' }} />
      </div>
    </div>
  );
}

function ToggleField({ label, path }) {
  const A = useAdmin();
  const val = !!getByPath(window.MENU_DATA, path);
  const isOverridden = path in A.overrides;
  return (
    <div className="pv-field" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <label className="pv-label" style={{ margin: 0 }}>{label}</label>
        {isOverridden && (
          <button onClick={() => A.clearOverride(path)} style={{
            appearance: 'none', border: 0, background: 'transparent', color: 'var(--terracota)',
            fontSize: 10, fontWeight: 600, cursor: 'pointer', padding: 0, marginTop: 2,
          }}>Restablecer</button>
        )}
      </div>
      <button
        onClick={() => A.setOverride(path, !val)}
        role="switch"
        aria-checked={val}
        style={{
          appearance: 'none', border: 0, width: 42, height: 24, borderRadius: 999,
          background: val ? 'var(--terracota)' : 'var(--crema-line)',
          position: 'relative', cursor: 'pointer', padding: 0, flexShrink: 0,
          transition: 'background .15s',
        }}>
        <span style={{
          position: 'absolute', top: 2, left: val ? 20 : 2,
          width: 20, height: 20, borderRadius: 999, background: 'var(--hueso)',
          transition: 'left .15s',
          boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
        }} />
      </button>
    </div>
  );
}

function ListField({ label, path, addPlaceholder = 'Nuevo' }) {
  const A = useAdmin();
  const items = getByPath(window.MENU_DATA, path) || [];
  const isOverridden = path in A.overrides;
  const update = (newItems) => A.setOverride(path, newItems);
  const rename = (i, val) => update(items.map((x, j) => j === i ? val : x));
  const remove = (i) => update(items.filter((_, j) => j !== i));
  const add = () => update([...items, addPlaceholder]);
  return (
    <div className="pv-field">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <label className="pv-label" style={{ margin: 0 }}>{label} · {items.length}</label>
        {isOverridden && (
          <button onClick={() => A.clearOverride(path)} style={{
            appearance: 'none', border: 0, background: 'transparent', color: 'var(--terracota)',
            fontSize: 10, fontWeight: 600, cursor: 'pointer', padding: 0,
          }}>Restablecer</button>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item, j) => (
          <div key={j} style={{
            display: 'flex', gap: 8, alignItems: 'center',
            background: 'var(--crema)', borderRadius: 12, padding: 6, paddingLeft: 12,
            border: '1px solid var(--crema-line)',
          }}>
            <input
              className="pv-input"
              value={item}
              onChange={(e) => rename(j, e.target.value)}
              style={{
                height: 36, fontSize: 13, padding: '0 10px',
                background: 'transparent', border: 0, borderRadius: 0,
              }}
            />
            <button
              onClick={() => remove(j)}
              aria-label="Eliminar"
              style={{
                appearance: 'none', border: 0, background: 'transparent',
                color: 'var(--tierra-soft)', cursor: 'pointer',
                width: 32, height: 32, borderRadius: 999, fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 7h14M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m1 0v12a2 2 0 01-2 2H9a2 2 0 01-2-2V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={add}
        style={{
          marginTop: 10, appearance: 'none',
          border: '1px dashed var(--terracota)', background: 'transparent',
          color: 'var(--terracota)', padding: '10px 14px', borderRadius: 12,
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'inherit', width: '100%',
        }}>+ Agregar</button>
    </div>
  );
}

function Group({ title, children }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div className="pv-h3" style={{ fontSize: 18, marginBottom: 12 }}>{title}</div>
      <div className="pv-card" style={{ background: 'var(--hueso)' }}>
        {children}
      </div>
    </div>
  );
}

function GeneralEditor() {
  return (
    <div>
      <Group title="Pantalla principal">
        <TextField label="Título — línea 1" path="home.titleL1" />
        <TextField label="Título — línea 2 (cursiva)" path="home.titleL2" />
        <TextField label="Título — línea 3" path="home.titleL3" />
        <TextField label="Descripción" path="home.desc" multi />
      </Group>
      <Group title="Información de entrega">
        <TextField label="Zona" path="home.delivery" multi />
        <TextField label="Horario" path="home.hours" />
      </Group>
      <Group title="WhatsApp del local">
        <div style={{ fontSize: 11, color: 'var(--tierra-soft)', lineHeight: 1.4, marginBottom: 10 }}>
          Número al que se envía el pedido cuando el cliente confirma. Incluí código de país (ej: +54 9 297 …).
        </div>
        <TextField label="Número de WhatsApp" path="home.whatsapp" />
      </Group>
    </div>
  );
}

function OpcionesEditor() {
  const D = window.MENU_DATA;
  return (
    <div>
      {[1, 2, 3].map((n) => {
        const op = D.opciones[n];
        return (
          <Group key={n} title={op.titulo}>
            <TextField label="Título" path={`opciones.${n}.titulo`} />
            <TextField label="Bajada" path={`opciones.${n}.bajada`} />
            <TextField label="Descripción" path={`opciones.${n}.descripcion`} multi />
            <NumberField label="Precio desde" path={`opciones.${n}.precioDesde`} />
          </Group>
        );
      })}
    </div>
  );
}

function PlatosEditor() {
  const A = useAdmin();
  const D = window.MENU_DATA;
  const groups = [
    { titulo: 'Ensaladas · Opción 1', cat: 'ensaladas', op: 1 },
    { titulo: 'Comidas · Opción 1', cat: 'comidas', op: 1 },
    { titulo: 'Ensaladas · Opción 2', cat: 'ensaladas', op: 2 },
    { titulo: 'Comidas · Opción 2', cat: 'comidas', op: 2 },
  ];

  const addPlato = (cat, op) => {
    const id = `${cat[0]}${op}-new-${Date.now().toString(36).slice(-5)}`;
    const nuevo = {
      id,
      nombre: 'Nuevo plato',
      desc: 'Descripción del plato.',
      precio: 0,
      tags: [],
      complementarios: ['Salsa César', 'Sobrecito de limón', 'Tostaditas'],
      complementarioVisible: true,
      agotado: false,
    };
    A.setOverride(`platos.${cat}.${op}`, [...D.platos[cat][op], nuevo]);
  };

  const removePlato = (cat, op, id) => {
    if (!confirm('¿Eliminar este plato? Se perderán sus textos e imagen.')) return;
    const next = D.platos[cat][op].filter((p) => p.id !== id);
    A.setOverride(`platos.${cat}.${op}`, next);
    A.clearImage(`plato.${id}`);
  };

  return (
    <div>
      {groups.map((g) => (
        <div key={g.titulo} style={{ marginBottom: 26 }}>
          <div className="pv-h3" style={{ fontSize: 18, marginBottom: 12 }}>{g.titulo}</div>
          {D.platos[g.cat][g.op].map((p) => {
            const idx = getIdx(D, g.cat, g.op, p.id);
            const base = `platos.${g.cat}.${g.op}.${idx}`;
            return (
              <div key={p.id} className="pv-card" style={{ background: 'var(--hueso)', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--tierra-soft)', fontWeight: 600, letterSpacing: '0.05em' }}>
                    {p.id.toUpperCase()}
                  </div>
                  <button
                    onClick={() => removePlato(g.cat, g.op, p.id)}
                    aria-label="Eliminar plato"
                    title="Eliminar plato"
                    style={{
                      appearance: 'none', border: 0, background: 'transparent',
                      color: 'oklch(0.55 0.15 30)', cursor: 'pointer',
                      width: 32, height: 32, borderRadius: 999,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M5 7h14M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m1 0v12a2 2 0 01-2 2H9a2 2 0 01-2-2V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
                <ImageField label="Imagen del plato" id={`plato.${p.id}`} />
                <TextField label="Nombre" path={`${base}.nombre`} />
                <TextField label="Descripción" path={`${base}.desc`} multi />
                <NumberField label="Precio" path={`${base}.precio`} />
                <ToggleField label="Marcar como agotado" path={`${base}.agotado`} />

                <div style={{ height: 1, background: 'var(--crema-line)', margin: '14px -16px' }} />
                <ToggleField label="Mostrar complementarios" path={`${base}.complementarioVisible`} />
                <ListField label="Complementarios" path={`${base}.complementarios`} addPlaceholder="Nuevo complementario" />
              </div>
            );
          })}
          <button
            onClick={() => addPlato(g.cat, g.op)}
            style={{
              appearance: 'none',
              border: '1px dashed var(--terracota)', background: 'transparent',
              color: 'var(--terracota)', padding: '14px', borderRadius: 14,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', width: '100%',
            }}>+ Agregar plato a {g.titulo}</button>
        </div>
      ))}
    </div>
  );
}
function getIdx(D, cat, op, id) {
  return D.platos[cat][op].findIndex((x) => x.id === id);
}

// ─── Arma tu ensalada editor ───
function ArmaEditor() {
  const A = useAdmin();
  const D = window.MENU_DATA;
  const pasos = D.arma.pasos;

  const setOpciones = (pasoIdx, nuevas) => {
    A.setOverride(`arma.pasos.${pasoIdx}.opciones`, nuevas);
  };

  const renameOpcion = (pasoIdx, opIdx, nombre) => {
    const nuevas = pasos[pasoIdx].opciones.map((o, i) => i === opIdx ? { ...o, nombre } : o);
    setOpciones(pasoIdx, nuevas);
  };

  const removeOpcion = (pasoIdx, opIdx) => {
    const nuevas = pasos[pasoIdx].opciones.filter((_, i) => i !== opIdx);
    setOpciones(pasoIdx, nuevas);
  };

  const addOpcion = (pasoIdx) => {
    const id = 'opt-' + Date.now();
    const nuevas = [...pasos[pasoIdx].opciones, { id, nombre: 'Nueva opción' }];
    setOpciones(pasoIdx, nuevas);
  };

  return (
    <div>
      <div style={{
        fontSize: 11, color: 'var(--tierra-soft)', lineHeight: 1.5, marginBottom: 16,
        padding: 12, background: 'var(--terracota-soft)', borderRadius: 12,
      }}>
        Podés editar los pasos del configurador “Arma tu ensalada”: cambiar el título, la cantidad máxima a elegir, el subtítulo y la lista de opciones.
      </div>
      <div style={{ marginBottom: 26 }}>
        <div className="pv-h3" style={{ fontSize: 18, marginBottom: 12 }}>Precio base</div>
        <div className="pv-card" style={{ background: 'var(--hueso)' }}>
          <NumberField label="Precio de la ensalada armada" path="arma.base" />
        </div>
      </div>

      {pasos.map((paso, i) => (
        <div key={paso.id} style={{ marginBottom: 26 }}>
          <div className="pv-h3" style={{ fontSize: 18, marginBottom: 12 }}>
            Paso {i + 1} — <span style={{ color: 'var(--tierra-soft)', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500 }}>{paso.titulo}</span>
          </div>
          <div className="pv-card" style={{ background: 'var(--hueso)' }}>
            <TextField label="Título" path={`arma.pasos.${i}.titulo`} />
            <TextField label="Subtítulo (texto bajo el título)" path={`arma.pasos.${i}.sub`} />
            <NumberField label="Cantidad máxima a elegir" path={`arma.pasos.${i}.max`} prefix="" />

            <div style={{ marginTop: 6 }}>
              <div className="pv-label" style={{ marginBottom: 10 }}>
                Opciones · {paso.opciones.length}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {paso.opciones.map((op, j) => (
                  <div key={op.id} style={{
                    display: 'flex', gap: 8, alignItems: 'center',
                    background: 'var(--crema)', borderRadius: 12, padding: 6, paddingLeft: 12,
                    border: '1px solid var(--crema-line)',
                  }}>
                    <input
                      className="pv-input"
                      value={op.nombre}
                      onChange={(e) => renameOpcion(i, j, e.target.value)}
                      style={{
                        height: 36, fontSize: 13, padding: '0 10px',
                        background: 'transparent', border: 0, borderRadius: 0,
                      }}
                    />
                    <button
                      onClick={() => removeOpcion(i, j)}
                      aria-label="Eliminar"
                      style={{
                        appearance: 'none', border: 0, background: 'transparent',
                        color: 'var(--tierra-soft)', cursor: 'pointer',
                        width: 32, height: 32, borderRadius: 999, fontSize: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M5 7h14M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m1 0v12a2 2 0 01-2 2H9a2 2 0 01-2-2V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => addOpcion(i)}
                style={{
                  marginTop: 10, appearance: 'none',
                  border: '1px dashed var(--terracota)', background: 'transparent',
                  color: 'var(--terracota)', padding: '10px 14px', borderRadius: 12,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', width: '100%',
                }}
              >+ Agregar opción</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { useAdmin, EditableImg, LoginScreen, AdminScreen });