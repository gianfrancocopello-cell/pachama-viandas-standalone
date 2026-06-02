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


// ---------- Firestore sync ----------
const FS_DOC = 'menu/overrides';
const FS_IMAGES_DOC = 'menu/images';

function saveOverridesToFirestore(overrides) {
  if (!window.__db) return;
  window.__db.doc(FS_DOC).set({ data: overrides }).catch(console.error);
}
function deleteImageFromFirestore(id) {
  if (!window.__db) return;
  const update = {};
  update[id] = firebase.firestore.FieldValue.delete();
  window.__db.doc(FS_IMAGES_DOC).update(update).catch(console.error);
}

// ---------- Apply overrides to MENU_DATA (mutates) ----------
function applyOverrides(overrides) {
  const D = window.MENU_DATA;
  if (!D || !D.__base) {
    // Save a deep clone of original so we can reset
    D.__base = JSON.parse(JSON.stringify({
      home: D.home, opciones: D.opciones, platos: D.platos, arma: D.arma, armaComida: D.armaComida,
    }));
  }
  // Reset from base, then re-apply overrides
  const base = D.__base;
  D.home = JSON.parse(JSON.stringify(base.home));
  D.opciones = JSON.parse(JSON.stringify(base.opciones));
  D.platos = JSON.parse(JSON.stringify(base.platos));
  D.arma = JSON.parse(JSON.stringify(base.arma));
  if (base.armaComida) D.armaComida = JSON.parse(JSON.stringify(base.armaComida));

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

// ---------- Viewport (mobile/tablet/desktop) ----------
function detectViewport() {
  const w = window.innerWidth;
  if (w >= 1100) return 'desktop';
  if (w >= 760) return 'tablet';
  return 'mobile';
}
window.__pvViewport = detectViewport();
window.addEventListener('resize', () => {
  const next = detectViewport();
  if (next !== window.__pvViewport) {
    window.__pvViewport = next;
    if (window.__pvAdmin) window.__pvAdmin.notify();
  }
});

function useViewport() {
  const [vp, setVp] = React.useState(window.__pvViewport);
  React.useEffect(() => {
    const fn = () => setVp(window.__pvViewport);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return vp;
}

// ---------- Admin store (singleton) ----------
window.__pvAdmin = window.__pvAdmin || {
  overrides: loadJSON(LS_OVERRIDES, {}),
  images: loadJSON(LS_IMAGES, {}),
  session: loadJSON(LS_SESSION, null), // { email }
  listeners: new Set(),
  _fsUnsub: null,
  _fsImgUnsub: null,
  notify() { this.listeners.forEach(fn => fn()); },

  // Conectar Firestore — tiempo real en todos los dispositivos
  connectFirestore() {
    if (this._fsUnsub || !window.__db) return;
    this._fsUnsub = window.__db.doc(FS_DOC).onSnapshot((snap) => {
      const remote = snap.exists ? (snap.data().data || {}) : {};
      this.overrides = remote;
      saveJSON(LS_OVERRIDES, remote);
      applyOverrides(remote);
      this.notify();
    }, console.error);
    this._fsImgUnsub = window.__db.doc(FS_IMAGES_DOC).onSnapshot((snap) => {
      const remote = snap.exists ? (snap.data() || {}) : {};
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
  // Cuando una opción se guarda como ARRAY completo (snapshot), conviene
  // limpiar overrides que apuntan a índices del array (ej: array.0.nombre),
  // porque después de agregar/eliminar items, esos índices ya no corresponden.
  setOverrideArray(path, value) {
    const next = { ...this.overrides };
    // Borrar cualquier override cuyo path empiece con `${path}.<digit>`
    const prefix = path + '.';
    for (const k of Object.keys(next)) {
      if (!k.startsWith(prefix)) continue;
      const rest = k.slice(prefix.length);
      if (/^\d/.test(rest)) delete next[k];
    }
    next[path] = value;
    this.overrides = next;
    saveJSON(LS_OVERRIDES, this.overrides);
    saveOverridesToFirestore(this.overrides);
    applyOverrides(this.overrides);
    this.notify();
  },
  clearOverride(path) {
    const next = { ...this.overrides };
    delete next[path];
    this.overrides = next;
    saveJSON(LS_OVERRIDES, this.overrides);
    saveOverridesToFirestore(this.overrides);
    applyOverrides(this.overrides);
    this.notify();
  },
  clearImage(id) {
    const next = { ...this.images };
    delete next[id];
    delete next[`${id}.mobile`];
    delete next[`${id}.tablet`];
    delete next[`${id}.desktop`];
    this.images = next;
    saveJSON(LS_IMAGES, this.images);
    deleteImageFromFirestore(id);
    this.notify();
  },
  async setImage(id, file) {
    if (!window.__storage) return;
    try {
      const ext = file.type.includes('png') ? 'png' : 'jpg';
      const ref = window.__storage.ref(`pv_images/${id}.${ext}`);
      await ref.put(file);
      const url = await ref.getDownloadURL();
      const next = { ...this.images, [id]: url };
      delete next[`${id}.mobile`];
      delete next[`${id}.tablet`];
      delete next[`${id}.desktop`];
      this.images = next;
      saveJSON(LS_IMAGES, this.images);
      // Guardar solo el campo nuevo en Firestore
      if (window.__db) {
        const update = {};
        update[id] = url;
        window.__db.doc(FS_IMAGES_DOC).set(update, { merge: true }).catch(console.error);
      }
      this.notify();
    } catch (err) {
      console.error('Error subiendo imagen:', err);
    }
  },
  resetAll() {
    this.overrides = {};
    this.images = {};
    saveJSON(LS_OVERRIDES, {});
    saveJSON(LS_IMAGES, {});
    saveOverridesToFirestore({});
    if (window.__db) window.__db.doc(FS_IMAGES_DOC).set({}).catch(console.error);
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

// Apply on load (once)
applyOverrides(window.__pvAdmin.overrides);

// Conectar Firestore para sync en tiempo real
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
      <div className={baseCls} style={{ backgroundSize: 'cover', backgroundPosition: 'center', ...style, backgroundImage: `url(${src})` }}>
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
            { id: 'ensalada', label: 'Ensalada' },
            { id: 'comida', label: 'Comida' },
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
        {tab === 'ensalada' && <ArmaEditor dataKey="arma" nombre="ensalada" showPrices={false} />}
        {tab === 'comida' && <ArmaEditor dataKey="armaComida" nombre="comida" showPrices={true} />}

        <div style={{ marginTop: 30, padding: 16, background: 'oklch(0.96 0.02 30)', borderRadius: 14, border: '1px dashed oklch(0.7 0.1 30)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'oklch(0.45 0.12 30)' }}>Zona de peligro</div>
          <div style={{ fontSize: 11, color: 'oklch(0.45 0.12 30)', marginTop: 4, lineHeight: 1.4 }}>
            Borra todos los cambios hechos por administradores y vuelve a los textos, precios e imágenes originales.
          </div>
          <button
            onClick={() => { if (confirm('¿Borrar todos los cambios? Se perderán todas las ediciones.')) A.resetAll(); }}
            style={{
              marginTop: 10, appearance: 'none', border: '1px solid oklch(0.6 0.15 30)',
              background: 'transparent', color: 'oklch(0.45 0.15 30)',
              padding: '8px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >Borrar todos los cambios</button>
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
  // Local state lets the user clear the input fully while typing
  const [draft, setDraft] = React.useState(String(val));
  const focusRef = React.useRef(false);
  React.useEffect(() => {
    if (!focusRef.current) setDraft(String(val));
  }, [val]);

  return (
    <div className="pv-field">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <label className="pv-label" style={{ margin: 0 }}>{label}</label>
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
          type="text"
          inputMode="numeric"
          style={prefix ? { paddingLeft: 30 } : {}}
          value={draft}
          onFocus={() => { focusRef.current = true; }}
          onBlur={() => {
            focusRef.current = false;
            const n = parseInt(draft, 10);
            const final = isNaN(n) ? 0 : n;
            setDraft(String(final));
            A.setOverride(path, final);
          }}
          onChange={(e) => {
            const v = e.target.value;
            // accept empty or digits (optional leading -)
            if (v === '' || /^-?\d*$/.test(v)) {
              setDraft(v);
              if (v !== '' && v !== '-') {
                A.setOverride(path, parseInt(v, 10));
              }
            }
          }}
        />
      </div>
    </div>
  );
}

function ImageField({ label, id }) {
  const A = useAdmin();
  const src = A.images[id];
  const inputRef = React.useRef(null);

  const [uploading, setUploading] = React.useState(false);
  const onPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    await A.setImage(id, file);
    setUploading(false);
  };

  return (
    <div className="pv-field">
      <label className="pv-label">{label}</label>
      <div style={{ fontSize: 10, color: 'var(--tierra-soft)', marginBottom: 8, lineHeight: 1.4 }}>
        Esta imagen se usa en todos los tamaños de pantalla (mobile, tablet y desktop).
      </div>
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
          }}>{uploading ? 'Subiendo...' : src ? 'Cambiar imagen' : 'Subir imagen'}</button>
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
        {isOverridden && false}
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

// Mini input used for option prices (kept editable while typing)
function PriceInput({ value, onCommit }) {
  const [draft, setDraft] = React.useState(String(value ?? 0));
  const focusRef = React.useRef(false);
  React.useEffect(() => {
    if (!focusRef.current) setDraft(String(value ?? 0));
  }, [value]);
  return (
    <input
      type="text"
      inputMode="numeric"
      value={draft}
      onFocus={() => { focusRef.current = true; }}
      onBlur={() => {
        focusRef.current = false;
        const n = parseInt(draft, 10);
        const final = isNaN(n) ? 0 : n;
        setDraft(String(final));
        onCommit(final);
      }}
      onChange={(e) => {
        const v = e.target.value;
        if (v === '' || /^-?\d*$/.test(v)) {
          setDraft(v);
          if (v !== '' && v !== '-') onCommit(parseInt(v, 10));
        }
      }}
      style={{
        height: 30, width: '100%', fontSize: 12,
        padding: '0 6px 0 22px',
        background: 'var(--hueso)',
        border: '1px solid var(--crema-line)',
        borderRadius: 8,
        fontFamily: 'inherit', color: 'var(--tierra)',
      }}
    />
  );
}

function ColorField({ label, path, options }) {
  const A = useAdmin();
  const val = getByPath(window.MENU_DATA, path) ?? '#000000';
  return (
    <div className="pv-field">
      <label className="pv-label" style={{ marginBottom: 8 }}>{label}</label>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <label style={{
          width: 44, height: 44, borderRadius: 12,
          border: '1px solid var(--crema-line)',
          background: val, cursor: 'pointer',
          flexShrink: 0, position: 'relative', overflow: 'hidden',
        }}>
          <input
            type="color"
            value={val}
            onChange={(e) => A.setOverride(path, e.target.value)}
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
          />
        </label>
        <input
          className="pv-input"
          value={val}
          onChange={(e) => A.setOverride(path, e.target.value)}
          style={{ flex: 1, fontFamily: 'JetBrains Mono, ui-monospace, monospace', fontSize: 13 }}
        />
        {options && options.length > 0 && (
          <div style={{ display: 'flex', gap: 4 }}>
            {options.map((c) => (
              <button
                key={c}
                onClick={() => A.setOverride(path, c)}
                aria-label={c}
                style={{
                  width: 24, height: 24, borderRadius: 999,
                  background: c, border: '2px solid var(--hueso)',
                  boxShadow: val.toLowerCase() === c.toLowerCase() ? `0 0 0 2px var(--terracota)` : '0 0 0 1px var(--crema-line)',
                  cursor: 'pointer', padding: 0,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SelectField({ label, path, options }) {
  const A = useAdmin();
  const val = getByPath(window.MENU_DATA, path) ?? options[0]?.value;
  return (
    <div className="pv-field">
      <label className="pv-label">{label}</label>
      <select
        className="pv-input"
        value={val}
        onChange={(e) => A.setOverride(path, e.target.value)}
        style={{
          appearance: 'none', cursor: 'pointer',
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path fill='%23595959' d='M0 0h12L6 8z'/></svg>")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 14px center',
          paddingRight: 36,
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ fontFamily: o.value }}>
            {o.label}
          </option>
        ))}
      </select>
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


function DateField({ label, path }) {
  const A = useAdmin();
  const val = getByPath(window.MENU_DATA, path) ?? '';
  return (
    <div className="pv-field">
      <label className="pv-label">{label}</label>
      <input
        className="pv-input"
        type="date"
        value={val}
        onChange={(e) => A.setOverride(path, e.target.value)}
      />
    </div>
  );
}

function GeneralEditor() {
  const FONTS = [
    { value: 'Instrument Serif', label: 'Instrument Serif (elegante)' },
    { value: 'DM Sans', label: 'DM Sans (moderna)' },
    { value: 'Georgia', label: 'Georgia (clásica)' },
    { value: 'Courier New', label: 'Courier New (máquina)' },
    { value: 'Comic Sans MS', label: 'Comic Sans (informal)' },
  ];
  const COLORS = ['#29261b', '#c46a3c', '#5a7a3c', '#3a4a8a', '#a02838', '#8a6a3a'];
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
      <Group title="Cerrado por hoy">
        <div style={{ fontSize: 11, color: 'var(--tierra-soft)', lineHeight: 1.4, marginBottom: 10 }}>
          Cuando esto está activado, los clientes no pueden ver el menú ni hacer pedidos. Se muestra el mensaje configurado abajo.
        </div>
        <ToggleField label="Activar modo cerrado" path="home.cerrado" />
        <TextField label="Mensaje" path="home.cerradoMensaje" multi />
        <ColorField label="Color del texto" path="home.cerradoColor" options={COLORS} />
        <SelectField label="Fuente" path="home.cerradoFont" options={FONTS} />
        <NumberField label="Tamaño del texto (px)" path="home.cerradoFontSize" prefix="" />
      </Group>
      <Group title="WhatsApp del local">
        <div style={{ fontSize: 11, color: 'var(--tierra-soft)', lineHeight: 1.4, marginBottom: 10 }}>
          Número al que se envía el pedido cuando el cliente confirma. Incluí código de país (ej: +54 9 297 …).
        </div>
        <TextField label="Número de WhatsApp" path="home.whatsapp" />

      <Group title="Descuento">
        <NumberField label="Porcentaje de descuento (%)" path="home.descuentoPorcentaje" prefix="" />
        <DateField label="Desde (opcional)" path="home.descuentoDesde" />
        <DateField label="Hasta (opcional)" path="home.descuentoHasta" />
        <div style={{ height: 1, background: 'var(--crema-line)', margin: '12px 0' }} />
        <div style={{ fontSize: 11, color: 'var(--tierra-soft)', lineHeight: 1.4, marginBottom: 6 }}>
          El descuento se aplica a los platos. Elegí si también aplica a los configuradores:
        </div>
        <ToggleField label="Aplicar a Comidas y Ensaladas" path="home.descuentoPlatos" />
        <ToggleField label="Aplicar a Arma tu ensalada" path="home.descuentoEnsalada" />
        <ToggleField label="Aplicar a Arma tu comida" path="home.descuentoComida" />
      </Group>
      </Group>
    </div>
  );
}

function OpcionesEditor() {
  const D = window.MENU_DATA;
  return (
    <div>
      <div style={{
        fontSize: 11, color: 'var(--tierra-soft)', lineHeight: 1.5, marginBottom: 16,
        padding: 12, background: 'var(--terracota-soft)', borderRadius: 12,
      }}>
        Para "Arma tu ensalada", el precio que aparece en la página principal sale del precio base que cargás desde la pestaña <b>Ensalada</b>.
      </div>
      <Group title="Comidas y Ensaladas">
        <TextField label="Título" path="home.comboTitulo" />
        <TextField label="Bajada" path="home.comboBajada" />
        <TextField label="Descripción" path="home.comboDescripcion" multi />
      </Group>
      {[3, 4].map((n) => {
        const op = D.opciones[n];
        return (
          <Group key={n} title={op.titulo}>
            <TextField label="Título" path={`opciones.${n}.titulo`} />
            <TextField label="Bajada" path={`opciones.${n}.bajada`} />
            <TextField label="Descripción" path={`opciones.${n}.descripcion`} multi />
            {n === 3 && (
              <div style={{ fontSize: 11, color: 'var(--tierra-soft)', lineHeight: 1.4, marginTop: 4 }}>
                El precio se edita desde la pestaña <b>Ensalada → Precio base</b>.
              </div>
            )}
          </Group>
        );
      })}
    </div>
  );
}

function PlatosEditor() {
  const A = useAdmin();
  const D = window.MENU_DATA;
  const [catTab, setCatTab] = React.useState('ensaladas');
  // Combinamos op 1 y 2 en una lista única; cada plato sabe a qué opción pertenece
  const visiblePlatos = [
    ...((D.platos[catTab]?.[1] || []).map((p) => ({ ...p, __op: 1 }))),
    ...((D.platos[catTab]?.[2] || []).map((p) => ({ ...p, __op: 2 }))),
  ];

  const addPlato = (cat) => {
    const op = 1; // los nuevos platos se agregan a opción 1 por defecto
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
      oculto: false,
    };
    A.setOverrideArray(`platos.${cat}.${op}`, [...D.platos[cat][op], nuevo]);
  };

  const removePlato = (cat, op, id) => {
    if (!confirm('¿Eliminar este plato? Se perderán sus textos e imagen.')) return;
    const next = D.platos[cat][op].filter((p) => p.id !== id);
    A.setOverrideArray(`platos.${cat}.${op}`, next);
    A.clearImage(`plato.${id}`);
  };

  return (
    <div>
      <div className="pv-tabs" style={{ marginBottom: 18 }}>
        {[
        { id: 'ensaladas', label: 'Ensaladas' },
        { id: 'comidas', label: 'Comidas' }].
        map((t) =>
        <div
          key={t.id}
          className="pv-tab"
          aria-selected={catTab === t.id}
          onClick={() => setCatTab(t.id)}>
          {t.label}</div>
        )}
      </div>
      <div style={{ marginBottom: 26 }}>
        <div className="pv-h3" style={{ fontSize: 18, marginBottom: 12 }}>
          {catTab === 'ensaladas' ? 'Ensaladas' : 'Comidas'}
        </div>
        {visiblePlatos.map((p) => {
          const op = p.__op;
          return (
            <div key={p.id} className="pv-card" style={{ background: 'var(--hueso)', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--tierra-soft)', fontWeight: 600, letterSpacing: '0.05em' }}>
                  {p.id.toUpperCase()}
                </div>
                <button
                  onClick={() => removePlato(catTab, op, p.id)}
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
              <PlatoText cat={catTab} op={op} plato={p} field="nombre" />
              <PlatoText cat={catTab} op={op} plato={p} field="desc" multi />
              <PlatoNumber cat={catTab} op={op} plato={p} field="precioOp1" label="Precio Opción 1" />
              <PlatoNumber cat={catTab} op={op} plato={p} field="precioOp2" label="Precio Opción 2" />
              <PlatoToggle cat={catTab} op={op} plato={p} field="agotado" label="Marcar como agotado" />
              <PlatoToggle cat={catTab} op={op} plato={p} field="oculto" label="Ocultar del menú" />

              <div style={{ height: 1, background: 'var(--crema-line)', margin: '14px -16px' }} />
              <PlatoToggle cat={catTab} op={op} plato={p} field="complementarioVisible" label="Mostrar complementarios" />
              <PlatoList cat={catTab} op={op} plato={p} field="complementarios" label="Complementarios" addPlaceholder="Nuevo complementario" />
            </div>
          );
        })}
        <button
          onClick={() => addPlato(catTab)}
          style={{
            appearance: 'none',
            border: '1px dashed var(--terracota)', background: 'transparent',
            color: 'var(--terracota)', padding: '14px', borderRadius: 14,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit', width: '100%',
          }}>+ Agregar plato</button>
      </div>
    </div>
  );
}

function getIdx(D, cat, op, id) {
  return D.platos[cat][op].findIndex((x) => x.id === id);
}

// ─── Plato fields: write whole array snapshot keyed by plato id ───
// Esto evita que los overrides "shifteen" cuando se agregan o eliminan platos.
function updatePlatoField(cat, op, platoId, field, value) {
  const A = window.__pvAdmin;
  const arr = window.MENU_DATA.platos[cat][op];
  const next = arr.map((p) => p.id === platoId ? { ...p, [field]: value } : p);
  A.setOverrideArray(`platos.${cat}.${op}`, next);
}

function PlatoText({ cat, op, plato, field, multi = false }) {
  const value = plato[field] ?? '';
  return (
    <div className="pv-field">
      <label className="pv-label">{multi ? 'Descripción' : 'Nombre'}</label>
      {multi ? (
        <textarea
          className="pv-input"
          style={{ height: 60, padding: 12, resize: 'none', lineHeight: 1.4 }}
          value={value}
          onChange={(e) => updatePlatoField(cat, op, plato.id, field, e.target.value)}
        />
      ) : (
        <input
          className="pv-input"
          value={value}
          onChange={(e) => updatePlatoField(cat, op, plato.id, field, e.target.value)}
        />
      )}
    </div>
  );
}

function PlatoNumber({ cat, op, plato, field, label = 'Precio' }) {
  const value = plato[field] ?? 0;
  const [draft, setDraft] = React.useState(String(value));
  const focusRef = React.useRef(false);
  React.useEffect(() => {
    if (!focusRef.current) setDraft(String(value));
  }, [value]);
  return (
    <div className="pv-field">
      <label className="pv-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--tierra-soft)', fontSize: 15,
        }}>$</span>
        <input
          className="pv-input"
          type="text"
          inputMode="numeric"
          style={{ paddingLeft: 30 }}
          value={draft}
          onFocus={() => { focusRef.current = true; }}
          onBlur={() => {
            focusRef.current = false;
            const n = parseInt(draft, 10);
            const final = isNaN(n) ? 0 : n;
            setDraft(String(final));
            updatePlatoField(cat, op, plato.id, field, final);
          }}
          onChange={(e) => {
            const v = e.target.value;
            if (v === '' || /^-?\d*$/.test(v)) {
              setDraft(v);
              if (v !== '' && v !== '-') {
                updatePlatoField(cat, op, plato.id, field, parseInt(v, 10));
              }
            }
          }}
        />
      </div>
    </div>
  );
}

function PlatoToggle({ cat, op, plato, field, label }) {
  const value = !!plato[field];
  return (
    <div className="pv-field" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <label className="pv-label" style={{ margin: 0 }}>{label}</label>
      </div>
      <button
        onClick={() => updatePlatoField(cat, op, plato.id, field, !value)}
        role="switch"
        aria-checked={value}
        style={{
          appearance: 'none', border: 0, width: 42, height: 24, borderRadius: 999,
          background: value ? 'var(--terracota)' : 'var(--crema-line)',
          position: 'relative', cursor: 'pointer', padding: 0, flexShrink: 0,
          transition: 'background .15s',
        }}>
        <span style={{
          position: 'absolute', top: 2, left: value ? 20 : 2,
          width: 20, height: 20, borderRadius: 999, background: 'var(--hueso)',
          transition: 'left .15s',
          boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
        }} />
      </button>
    </div>
  );
}

function PlatoList({ cat, op, plato, field, label, addPlaceholder = 'Nuevo' }) {
  const items = plato[field] || [];
  const update = (newItems) => updatePlatoField(cat, op, plato.id, field, newItems);
  const rename = (i, val) => update(items.map((x, j) => j === i ? val : x));
  const remove = (i) => update(items.filter((_, j) => j !== i));
  const add = () => update([...items, addPlaceholder]);
  return (
    <div className="pv-field">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <label className="pv-label" style={{ margin: 0 }}>{label} · {items.length}</label>
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

// ─── Arma tu ensalada / comida editor (reusable) ───
function ArmaEditor({ dataKey = 'arma', nombre = 'ensalada', showPrices = false }) {
  const A = useAdmin();
  const D = window.MENU_DATA;
  const pasos = D[dataKey].pasos;
  // Índice de la opción en home que corresponde al configurador
  const opcionN = dataKey === 'armaComida' ? 4 : 3;

  const setOpciones = (pasoIdx, nuevas) => {
    A.setOverride(`${dataKey}.pasos.${pasoIdx}.opciones`, nuevas);
  };

  const renameOpcion = (pasoIdx, opIdx, nombre) => {
    const nuevas = pasos[pasoIdx].opciones.map((o, i) => i === opIdx ? { ...o, nombre } : o);
    setOpciones(pasoIdx, nuevas);
  };

  const setPrecioOpcion = (pasoIdx, opIdx, precio) => {
    const nuevas = pasos[pasoIdx].opciones.map((o, i) => i === opIdx ? { ...o, precio } : o);
    setOpciones(pasoIdx, nuevas);
  };

  const toggleOpcion = (pasoIdx, opIdx) => {
    const nuevas = pasos[pasoIdx].opciones.map((o, i) => i === opIdx ? { ...o, inactivo: !o.inactivo } : o);
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

  const addPaso = () => {
    const id = 'paso-' + Date.now().toString(36);
    const nuevo = {
      id,
      titulo: 'Nuevo paso',
      sub: 'Elegí una',
      max: 1,
      opciones: [],
    };
    A.setOverride(`${dataKey}.pasos`, [...pasos, nuevo]);
  };

  const removePaso = (pasoIdx) => {
    if (!confirm(`¿Eliminar el paso "${pasos[pasoIdx].titulo}"? Se perderán sus opciones.`)) return;
    A.setOverride(`${dataKey}.pasos`, pasos.filter((_, i) => i !== pasoIdx));
  };

  return (
    <div>
      <div style={{
        fontSize: 11, color: 'var(--tierra-soft)', lineHeight: 1.5, marginBottom: 16,
        padding: 12, background: 'var(--terracota-soft)', borderRadius: 12,
      }}>
        Podés editar los pasos del configurador “Arma tu {nombre}”: cambiar el título, la cantidad máxima a elegir, el subtítulo y la lista de opciones. También podés agregar o eliminar pasos.
      </div>
      <Group title="Texto en la pantalla principal">
        <div style={{ fontSize: 11, color: 'var(--tierra-soft)', lineHeight: 1.4, marginBottom: 10 }}>
          Lo que aparece en la card de “Arma tu {nombre}” en la página principal.
        </div>
        <TextField label="Bajada (texto chico arriba)" path={`opciones.${opcionN}.bajada`} />
        <TextField label="Descripción" path={`opciones.${opcionN}.descripcion`} multi />
        <ToggleField label="Ocultar del menú" path={`opciones.${opcionN}.oculto`} />
      </Group>
      {nombre === 'ensalada' && (
        <div style={{ marginBottom: 26 }}>
          <div className="pv-h3" style={{ fontSize: 18, marginBottom: 12 }}>Precio base</div>
          <div className="pv-card" style={{ background: 'var(--hueso)' }}>
            <NumberField label={`Precio de la ${nombre} armada`} path={`${dataKey}.base`} />
          </div>
        </div>
      )}

      {pasos.map((paso, i) => (
        <div key={paso.id} style={{ marginBottom: 26 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="pv-h3" style={{ fontSize: 18 }}>
              Paso {i + 1} — <span style={{ color: 'var(--tierra-soft)', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500 }}>{paso.titulo}</span>
            </div>
            <button
              onClick={() => removePaso(i)}
              aria-label="Eliminar paso"
              title="Eliminar paso"
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
          <div className="pv-card" style={{ background: 'var(--hueso)' }}>
            <TextField label="Título" path={`${dataKey}.pasos.${i}.titulo`} />
            <TextField label="Subtítulo (texto bajo el título)" path={`${dataKey}.pasos.${i}.sub`} />
            <NumberField label="Cantidad máxima a elegir" path={`${dataKey}.pasos.${i}.max`} prefix="" />

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
                        height: 36, fontSize: 13, padding: '0 10px', flex: 1,
                        background: 'transparent', border: 0, borderRadius: 0,
                      }}
                    />
                    {showPrices && (
                      <div style={{ position: 'relative', flexShrink: 0, width: 86 }}>
                        <span style={{
                          position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                          color: 'var(--tierra-soft)', fontSize: 12,
                        }}>+$</span>
                        <PriceInput
                          value={op.precio ?? 0}
                          onCommit={(n) => setPrecioOpcion(i, j, n)}
                        />
                      </div>
                    )}
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
      <button
        onClick={addPaso}
        style={{
          appearance: 'none',
          border: '1px dashed var(--terracota)', background: 'transparent',
          color: 'var(--terracota)', padding: '14px', borderRadius: 14,
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'inherit', width: '100%', marginTop: 4,
        }}
      >+ Agregar paso</button>
    </div>
  );
}

Object.assign(window, { useAdmin, EditableImg, LoginScreen, AdminScreen });