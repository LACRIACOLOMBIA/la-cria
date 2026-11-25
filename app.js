/* =====================================================================
   LA CRÍA · Aplicación conectada a Supabase (fase 1)
   ===================================================================== */
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* ---------- constantes ---------- */
const GRUPOS = {gan:'Ganadería y equinos', mas:'Mascotas y pequeños animales', ave:'Aves', api:'Apicultura', acu:'Acuicultura', otr:'Otras producciones'};
const TIPOS = {ind:'Ejemplar individual', cam:'Camada', lote:'Lote', rep:'Reproductor', hem:'Hembra de cría', ges:'Animal gestante', col:'Colonia / núcleo', gen:'Material genético', acu:'Organismo acuático', pie:'Pie de cría'};
const FINES = [
  ['m','🏡','Mascota o compañía','Ejemplares destinados a vivir en un hogar y brindar compañía.'],
  ['r','🧬','Reproducción','Ejemplares destinados a la cría, reproducción, genética o mejoramiento de líneas.'],
  ['e','🏆','Exposición y competencia','Ejemplares destinados a exposiciones, ferias, juzgamientos, concursos morfológicos y campeonatos.'],
  ['c','🌾','Producción y consumo','Animales destinados a la producción de carne, leche, huevos, lana u otros productos de origen animal.'],
  ['d','🏇','Deporte y competición','Animales destinados a disciplinas deportivas, pruebas, carreras y actividades competitivas.'],
  ['t','🐕','Trabajo y servicio','Animales destinados a labores agrícolas, pastoreo, vigilancia, transporte, asistencia u otros servicios.']];
const PROP = Object.fromEntries(FINES.map(f=>[f[0],f[2]]).concat([['a','Adopción']]));
/* aptitud, disciplina o especialidad según la especie (se pueden ampliar) */
const APTITUDES = {
  felino:['Exposición felina','Línea de reproducción','Selección genética'],
  canino:['Exposición canina','Agilidad','Obediencia','Trabajo'],
  equino:['Salto','Paso fino','Trocha','Polo','Carreras','Adiestramiento'],
  bovino:['Carne','Leche','Genética','Juzgamiento o exposición ganadera'],
  bufalino:['Carne','Leche','Genética','Juzgamiento o exposición ganadera'],
  ovino:['Carne','Leche','Lana','Genética','Exposición'],
  caprino:['Carne','Leche','Lana','Genética','Exposición']};
const LEGAL = {habilitada:['Habilitada','e-ok'], revision:['Con revisión documental','e-pend'], no_habilitada:['Temporalmente no habilitada','e-gris'], prohibida:['Prohibida','e-mal']};
const DEPTOS = ['Amazonas','Antioquia','Arauca','Atlántico','Bogotá D.C.','Bolívar','Boyacá','Caldas','Caquetá','Casanare','Cauca','Cesar','Chocó','Córdoba','Cundinamarca','Guainía','Guaviare','Huila','La Guajira','Magdalena','Meta','Nariño','Norte de Santander','Putumayo','Quindío','Risaralda','San Andrés y Providencia','Santander','Sucre','Tolima','Valle del Cauca','Vaupés','Vichada'];
const PRODUCCION = ['bovino','bufalino','porcino','equino','asnal','ovino','caprino','camelido','gallinas','patos','pavos'];
const ACUI = ['peces','pecesorn','crustaceos'];
const CAMPOS = {
  bovino:['Edad','Peso promedio (kg)','Propósito productivo','Estado reproductivo','Registro genealógico'],
  bufalino:['Edad','Peso promedio (kg)','Propósito productivo','Estado reproductivo','Registro genealógico'],
  porcino:['Etapa productiva','Edad','Peso (kg)','Vacunas'], equino:['Edad','Andar','Alzada','Doma','Registro'],
  asnal:['Edad','Alzada','Uso (carga, trabajo, paseo)'], ovino:['Edad','Peso promedio (kg)','Producción'], caprino:['Edad','Peso promedio (kg)','Producción'],
  camelido:['Edad','Linaje (si está documentado)'], canino:['Edad','Color','Vacunas','Microchip','Pedigree'], felino:['Edad','Color','Ojos','Vacunas','Pedigree'],
  conejo:['Edad','Color','Peso'], cuy:['Edad','Color'], peqmam:['Edad','Color'], gallinas:['Edad','Línea'], patos:['Edad'], pavos:['Edad'], palomas:['Edad','Línea'],
  aveorn:['Edad','Anillo / documento de origen'], abeja:['Tipo (reina, núcleo, paquete, colonia)','Origen'], meliponas:['Especie científica','Nombre común','N.º de autorización'],
  peces:['Etapa / tamaño','Sistema de cultivo','Permiso AUNAP / origen'], pecesorn:['Etapa / tamaño','Permiso AUNAP / origen'], crustaceos:['Etapa / tamaño','Sistema de cultivo','Permiso AUNAP / origen'],
};
const camposDe = id => CAMPOS[id] || ['Etapa / tamaño','Origen'];
function docsReq(id){const d=[];if(['canino','felino','conejo','cuy','peqmam'].includes(id))d.push('Carnet de vacunas o desparasitación');if(PRODUCCION.includes(id))d.push('Registro sanitario de predio pecuario (ICA)');if(id==='abeja')d.push('Registro de apiario (ICA)');if(ACUI.includes(id))d.push('Permiso AUNAP o certificado de origen');if(['meliponas','aveorn','camelido','insectos','caracoles'].includes(id))d.push('Autorización o documento de origen legal');return d}
const BGS = ['bg-sp0','bg-sp1','bg-sp2','bg-sp3','bg-sp4','bg-sp5'];

/* ---------- estado ---------- */
function pubVacia(cat){return {cat:cat||'canino',raza:'',tipo:'ind',fotos:[],fotosEx:[],vals:{},padres:{padre:{},madre:{}},edit:null}}
const S = {view:'inicio', param:null, f:filtrosVacios(), sub:'resumen', sesion:null, perfil:null, yo:null, notifs:[], verFiltros:false, reg:{paso:1,plan:'criadero',anual:false,esp:[],arch:{}}, pub:pubVacia(), cache:{}};
let CATS = [], RAZAS = {}, PLANES = [], CONFIG = {}, BANNERS = [], LEGALES_DB = {};

/* ---------- utilidades ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cop = n => '$' + Math.round(Number(n)||0).toLocaleString('es-CO');
const norm = s => String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const catDe = id => CATS.find(c=>c.id===id) || {id, nombre:id, emoji:'🐾', tipos:[], bg:'bg-sp0'};
const porPub = p => p && p.pago_unico && !esGratis(p) && p.id!=='ocasional';   // se paga por cada publicación
const unidadPlan = p => esGratis(p)?'30 días':p.id==='ocasional'?'pago único · 60 días':p.pago_unico?'por publicación':'/ mes';
const TIENE_ANUAL = ['criadero','hacienda'];
const esGratis = p => !!p && (p.id||p)==='gratis';
const planDe = id => PLANES.find(p=>p.id===id) || {id, nombre:id, precio:0};
const fotoUrl = p => p ? (p.startsWith('http') ? p : sb.storage.from('fotos').getPublicUrl(p).data.publicUrl) : '';
const fechaCO = d => d ? new Date(d+(String(d).length===10?'T12:00:00':'')).toLocaleDateString('es-CO',{day:'numeric',month:'short',year:'numeric'}) : '—';
function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('on');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('on'),3200)}
function modal(html){$('#modal').innerHTML=html+'<div style="margin-top:18px;text-align:right"><button class="btn btn-o btn-s" data-cerrar>Cerrar</button></div>';$('#velo').classList.add('on')}
function cerrar(){$('#velo').classList.remove('on')}
function cargando(){return '<div class="cargando"><div class="spin"></div>Cargando…</div>'}
function filtrosVacios(){return {cat:'',raza:'',tipo:'',sexo:'',prop:'',apt:'',depto:'',q:'',min:'',max:'',vend:'',orden:'dest'}}
const hashDe=(v,p)=>v==='animal'?'animal-'+p:v==='vendedor'?'vendedor-'+p:v==='legal'?'legal-'+p:v;
const fotoNav=()=>({view:S.view,param:S.param,f:{...S.f},sub:S.sub,y:window.scrollY});
function go(v,p=null){
  try{history.replaceState({...fotoNav(),lc:1},'')}catch(e){}           // guarda dónde estaba (y hasta dónde había bajado)
  S.view=v;S.param=p;S.nav=(S.nav||0)+1;
  try{history.pushState({...fotoNav(),y:0,lc:1},'','#'+hashDe(v,p))}catch(e){}
  render();window.scrollTo({top:0})}
/* botón Volver y flecha atrás del navegador: regresan a la sección anterior con sus filtros */
window.addEventListener('popstate',e=>{const st=e.state;if(!st||!st.lc)return;S.view=st.view;S.param=st.param;S.f={...filtrosVacios(),...(st.f||{})};S.sub=st.sub||S.sub;S.nav=Math.max(0,(S.nav||0)-1);render().then(()=>window.scrollTo({top:st.y||0}))});
const VISTAS_VOLVER=['categorias','explorar','animal','vendedor','vendedores','planes','legal','crear','registro'];
function volver(){if((S.nav||0)>0)history.back();else go(S.view==='animal'?'explorar':'inicio')}
function err(e,msg){console.error(e);toast((msg||'Ocurrió un error')+(e&&e.message?': '+e.message:''))}
const esAdmin = () => S.perfil && S.perfil.rol === 'admin';
const precioTxt = p => (p.finalidades||[]).includes('a') ? 'En adopción' : (p.precio==null ? 'Precio a consultar' : cop(p.precio));
const subPrecio = p => (p.finalidades||[]).includes('a') ? (p.precio?`cuota de adopción ${cop(p.precio)}`:'sin costo') : (p.unidad&&p.precio!=null?esc(p.unidad):'');
const sumarMeses = (n) => {const d=new Date();d.setMonth(d.getMonth()+n);return d.toISOString().slice(0,10)};
const sumarDias = (n) => {const d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};

/* Reduce la foto y le pone la marca de agua de La Cría */
function prepararFoto(file){
  return new Promise((ok,fail)=>{
    if(!file.type.startsWith('image/')){ok(file);return}
    const img=new Image(), url=URL.createObjectURL(file);
    img.onload=()=>{const max=1600,r=Math.min(1,max/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*r);c.height=Math.round(img.height*r);const x=c.getContext('2d');x.drawImage(img,0,0,c.width,c.height);
      const fs=Math.max(18,Math.round(c.width/22));x.font=`${fs}px Rye, Georgia, serif`;x.fillStyle='rgba(255,255,255,.75)';x.strokeStyle='rgba(30,58,43,.45)';x.lineWidth=Math.max(1,fs/14);x.textAlign='right';x.strokeText('La Cría',c.width-fs*.6,c.height-fs*.6);x.fillText('La Cría',c.width-fs*.6,c.height-fs*.6);
      c.toBlob(b=>{URL.revokeObjectURL(url);b?ok(new File([b],file.name.replace(/\.\w+$/,'')+'.jpg',{type:'image/jpeg'})):fail(new Error('No se pudo procesar la foto'))},'image/jpeg',.82)};
    img.onerror=()=>fail(new Error('Archivo de imagen no válido'));img.src=url;
  });
}
async function subir(bucket, carpeta, file, sinMarca){
  const f = bucket==='fotos' && !sinMarca ? await prepararFoto(file) : file;
  const ext=(f.name.split('.').pop()||'bin').toLowerCase().replace(/[^a-z0-9]/g,'');
  const ruta=`${carpeta}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
  const {error}=await sb.storage.from(bucket).upload(ruta,f,{upsert:false,contentType:f.type});
  if(error) throw error; return ruta;
}
async function verPrivado(bucket,ruta){const {data,error}=await sb.storage.from(bucket).createSignedUrl(ruta,600);if(error){err(error,'No se pudo abrir el archivo');return}window.open(data.signedUrl,'_blank')}

/* =====================================================================
   CARGA INICIAL Y SESIÓN
   ===================================================================== */
async function cargarBase(){
  const [c,r,p,cf,b,l]=await Promise.all([
    sb.from('categorias').select('*').order('orden'),
    sb.from('razas').select('categoria_id,nombre').order('nombre').limit(5000),
    sb.from('planes').select('*').order('orden'),
    sb.from('config').select('*'),
    sb.from('banners').select('*').eq('activo',true),
    sb.from('legales').select('*').eq('estado','publicado')]);
  if(c.error) throw c.error;
  CATS=(c.data||[]).map((x,i)=>({...x,bg:BGS[i%6]}));
  RAZAS={}; (r.data||[]).forEach(x=>{(RAZAS[x.categoria_id]=RAZAS[x.categoria_id]||[]).push(x.nombre)});
  PLANES=p.data||[]; CONFIG={}; (cf.data||[]).forEach(x=>CONFIG[x.clave]=x.valor);
  BANNERS=b.data||[]; LEGALES_DB={}; (l.data||[]).forEach(x=>LEGALES_DB[x.id]=x);
}
async function cargarSesion(){
  const {data:{session}}=await sb.auth.getSession(); S.sesion=session; S.perfil=null; S.yo=null;
  if(session){
    const [p,v]=await Promise.all([sb.from('profiles').select('*').eq('id',session.user.id).maybeSingle(), sb.from('vendedores').select('*').eq('id',session.user.id).maybeSingle()]);
    S.perfil=p.data; S.yo=v.data;
    const pf=S.perfil, hoy=hoyISO();
    if(pf&&pf.rol!=='admin'&&pf.estado_cuenta&&pf.estado_cuenta!=='activa'&&!(pf.estado_cuenta==='suspendida'&&pf.sancion_hasta&&pf.sancion_hasta<hoy)){
      S.bloqueo={estado:pf.estado_cuenta,motivo:pf.motivo_sancion,hasta:pf.sancion_hasta};
      await sb.auth.signOut(); S.sesion=null; S.perfil=null; S.yo=null; S.notifs=[]; return;
    }
    await Promise.all([cargarNotifs(),contarNoLeidos()]);
  }
}
function avisoBloqueo(){if(!S.bloqueo)return;const b=S.bloqueo;S.bloqueo=null;
  modal(`<div style="text-align:center"><div style="font-size:52px">${b.estado==='bloqueada'?'⛔':'⏸️'}</div><h3>Tu cuenta está ${b.estado==='bloqueada'?'bloqueada':'suspendida'}</h3>
    <p style="color:var(--gris);margin-top:8px">${b.motivo?'<b>Motivo:</b> '+esc(b.motivo)+'<br>':''}${b.estado==='suspendida'&&b.hasta?'La suspensión termina el <b>'+fechaCO(b.hasta)+'</b>.<br>':''}Si crees que es un error, escríbenos desde el botón <b>Ayuda</b>.</p>
    <button class="btn btn-p" style="margin-top:14px" data-soporte>Escribir a soporte</button></div>`)}
async function cargarNotifs(){
  if(!S.sesion){S.notifs=[];return}
  const q=sb.from('notificaciones').select('*').order('created_at',{ascending:false}).limit(40);
  const {data}=await q; S.notifs=(data||[]).filter(n=>esAdmin()?true:!n.para_admin);
}
sb.auth.onAuthStateChange(async (ev,ses)=>{
  if(ev==='PASSWORD_RECOVERY'){modalNuevaClave();return}
  if(S.enviando) return;
  const antes=S.sesion&&S.sesion.user.id, ahora=ses&&ses.user.id;
  if(ev==='TOKEN_REFRESHED'||(ev==='SIGNED_IN'&&antes&&antes===ahora)){S.sesion=ses;return}  // solo se renovó la sesión: no recargar la pantalla
  if(ev==='USER_UPDATED'){S.sesion=ses;pintarAuth();return}
  if(ev==='SIGNED_IN'||ev==='SIGNED_OUT'){await cargarSesion();render();avisoBloqueo()}
});

/* =====================================================================
   ENCABEZADO, CAMPANITA Y RENDER
   ===================================================================== */
function pintarAuth(){
  const box=$('#authbox');
  if(!S.sesion){box.innerHTML='<button class="ses" data-login>Iniciar sesión</button><button class="btn btn-p btn-crear" data-go="crear">Crear cuenta</button>';return}
  const panel = esAdmin() ? 'admin' : S.yo ? 'panel' : 'micuenta';
  const enPanel = ['admin','panel','micuenta'].includes(S.view);
  const fa=S.yo&&S.yo.logo||S.perfil&&S.perfil.foto;
  box.innerHTML=(fa?`<button class="av-h" data-go="${panel}" aria-label="Mi cuenta"><img src="${esc(fotoUrl(fa))}" alt=""></button>`:'')+(enPanel?'':`<button class="btn btn-p btn-crear" data-go="${panel}">${esAdmin()?'Panel admin':S.yo?'Mi panel':'Mi cuenta'}</button>`)+'<button class="ses" data-salir>Cerrar sesión</button>';
}
function pintarCampana(){
  const b=$('#campana'); b.style.display=S.sesion?'':'none'; if(!S.sesion) return;
  const n=S.notifs.filter(x=>!x.leida).length; $('#nb').textContent=n; $('#nb').style.display=n?'':'none';
  $('#pnotif').innerHTML=`<div class="pn-cab"><b>Notificaciones</b><button data-leertodo>Marcar todo como leído</button></div>${S.notifs.map(x=>`<button class="pn-i ${x.leida?'':'nueva'}" data-notif="${x.id}"><span>${esc(x.icono||'🔔')}</span><div>${esc(x.texto)}<small>${new Date(x.created_at).toLocaleString('es-CO',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'})}</small></div></button>`).join('')||'<div style="padding:20px;color:var(--gris)">Sin notificaciones</div>'}`;
}
async function render(){
  pintarAuth(); pintarCampana();
  const app=$('#app'); const v=S.view;
  const vistas={inicio:vInicio,categorias:vCategorias,explorar:vExplorar,animal:vAnimal,vendedor:vVendedor,vendedores:vVendedores,planes:vPlanes,legal:vLegal,crear:vCrear,registro:vRegistro,micuenta:vMiCuenta,panel:vPanel,admin:vAdmin};
  const f = vistas[v]||vInicio;
  app.innerHTML=cargando();
  try{ const html=await f(); if(S.view===v) { setTimeout(bajarChat,0); } if(S.view===v) app.innerHTML=(VISTAS_VOLVER.includes(v)?'<div class="wrap barra-volver"><button class="volver" data-volver>← Volver</button></div>':'')+html; }
  catch(e){ console.error(e); app.innerHTML=`<div class="wrap"><div class="vacio" style="margin:40px 0">😕 No pudimos cargar esta parte.<br><small>${esc(e.message||e)}</small><br><br><button class="btn btn-o btn-s" data-go="inicio">Volver al inicio</button></div></div>`; }
}

/* =====================================================================
   VISTAS PÚBLICAS
   ===================================================================== */
const SELECT_PUB = '*, vendedor:vendedores(id,nombre_publico,plan,departamento,municipio,verificado,oficial,whatsapp,estado,logo)';
function sellos(v,verNo){const s={ocasional:'Vendedor verificado',criadero:'Criadero verificado',hacienda:'Hacienda verificada',fundacion:'Fundación verificada',adopcion:'Particular verificado',gratis:'Vendedor verificado'}[v.plan]||'Vendedor verificado';return (v.oficial?'<span class="sello-o">★ Tienda oficial</span> ':'')+(v.verificado?`<span class="sello-v">✓ ${s}</span>`:(verNo?'<span class="sello-n" title="La Cría todavía no ha revisado los documentos de este vendedor">⏳ Sin verificar</span>':''))}
function vendTipo(v){return ['ocasional','adopcion'].includes(v.plan)?'particular':v.plan==='fundacion'?'fundacion':'profesional'}
function tarjeta(p){
  const c=catDe(p.categoria_id), v=p.vendedor||{}, foto=(p.fotos||[])[0];
  return `<button class="card" data-animal="${p.id}">
    <div class="foto ${c.bg}">${foto?`<img src="${esc(fotoUrl(foto))}" alt="" loading="lazy">`:c.emoji}<div class="tags">${p.destacado?'<span class="tag dest">★ Destacado</span>':''}${(p.finalidades||[]).slice(0,2).map(k=>`<span class="tag ${k}">${PROP[k]||''}</span>`).join('')}${(p.finalidades||[]).length>2?`<span class="tag">+${p.finalidades.length-2}</span>`:''}${p.cantidad>1?`<span class="tag">${p.cantidad} disp.</span>`:''}</div></div>
    <div class="info"><h3>${esc(p.titulo)}</h3><div class="meta">${esc(p.raza||c.nombre)} · ${TIPOS[p.tipo]||''}${p.sexo&&!['No aplica','Mixto'].includes(p.sexo)?' · '+esc(p.sexo):''}</div>
      <div class="meta">📍 ${esc(v.municipio||'')}${v.municipio?', ':''}${esc(v.departamento||'')}</div>
      <div class="precio">${precioTxt(p)} <small>${subPrecio(p)}</small></div>
      <div class="cri"><span>${esc(v.nombre_publico||'')}</span>${v.verificado?'<span class="ver">✓</span>':''}</div></div></button>`;
}
async function vInicio(){
  const [{data:dest},{data:vend}]=await Promise.all([
    sb.from('publicaciones').select(SELECT_PUB).eq('estado','activo').order('destacado',{ascending:false}).order('created_at',{ascending:false}).limit(8),
    sb.from('vendedores').select('id,nombre_publico,plan,departamento,municipio,verificado,oficial,logo').eq('estado','activo').limit(6)]);
  const pop=['bovino','porcino','equino','canino','felino','bufalino','ovino','caprino','conejo','gallinas','abeja','peces'].map(catDe).filter(c=>c.activa!==false);
  const ban=bannersDe('inicio');
  return `
  <section class="hero"><div class="wrap"><span class="deco">🐄</span>
    <h1>Los criadores de Colombia, <em>en un solo lugar.</em></h1>
    <p class="lead">Encuentra y publica animales de origen legal: ganado, caballos, cerdos, perros, gatos, aves, abejas, peces y más. De criaderos, productores y vendedores verificados.</p>
    <form class="buscador-g" id="buscar" autocomplete="off"><div class="campo-g"><span>🔎</span><input id="hq" name="q" placeholder="Busca un animal: “hembra Duroc”, “búfala Murrah”, “caballo Paso Fino”…"></div><button class="btn btn-p" type="submit">Buscar</button></form>
  </div></section>
  <section class="blk" style="padding-bottom:0"><div class="wrap"><div class="rutas">
    <button class="ruta" data-go="categorias"><span class="em">🗂️</span><b>Explorar categorías</b><p>Entra a una categoría, elige la raza y mira las publicaciones.</p><span class="link">Ver categorías →</span></button>
    <div class="ruta"><span class="em">📍</span><b>Buscar por ubicación</b><p>Elige el departamento y mira los animales que hay allí.</p><select class="campo" id="udepto" style="margin-top:6px"><option value="">Elige el departamento</option>${DEPTOS.map(d=>`<option>${d}</option>`).join('')}</select><button class="btn btn-v btn-s" style="margin-top:8px" data-ubic>Ver animales en esta zona</button></div>
    <button class="ruta" data-foco><span class="em">🔎</span><b>Buscar un animal</b><p>Escribe la especie, la raza o el tipo de ejemplar.</p><span class="link">Ir al buscador →</span></button>
  </div></div></section>
  <section class="blk" style="padding-bottom:0"><div class="wrap"><div class="cta"><div><h2 class="serif">¿Crías animales? Publícalos y llega a todo el país.</h2><p>Sin comisiones por venta. Elige el plan que se ajusta a ti.</p></div><button class="btn" style="background:#fff;color:var(--terra)" data-go="planes">Ver planes</button></div></div></section>
  <section class="blk"><div class="wrap"><div class="tit"><div><h2>Categorías principales</h2><p>Categoría → raza → publicaciones.</p></div><button class="link" data-go="categorias">Ver todas →</button></div>
    <div class="especies">${pop.map(c=>`<button class="esp" data-cat="${c.id}"><span class="em">${c.emoji}</span><b>${esc(c.nombre)}</b></button>`).join('')}</div></div></section>
  <section class="blk" style="padding-top:0"><div class="wrap"><div class="finalidad"><b>¿Para qué lo buscas?</b>${FINES.map(([k,i,n])=>[k,i,n]).concat([['a','💜','Adopción']]).map(([k,i,n])=>`<button data-prop="${k}">${i} ${n}</button>`).join('')}</div></div></section>
  ${ban.length?`<section style="padding:0 0 30px"><div class="wrap">${bannersHtml(ban)}</div></section>`:''}
  <section class="blk" style="background:var(--papel);border-top:1px solid var(--linea);border-bottom:1px solid var(--linea)"><div class="wrap">
    <div class="tit"><div><h2>Publicaciones recientes</h2></div><button class="link" data-go="explorar">Ver todo →</button></div>
    ${dest&&dest.length?`<div class="grid">${dest.map(tarjeta).join('')}</div>`:'<div class="vacio">Muy pronto verás aquí los primeros animales publicados. 🐾</div>'}</div></section>
  <section class="blk"><div class="wrap"><div class="tit"><div><h2>Así funciona</h2></div></div><div class="pasos">
    <div class="paso"><h3>Busca y filtra</h3><p>Por categoría, raza, ubicación o escribiendo lo que buscas.</p></div><div class="paso"><h3>Conoce al vendedor</h3><p>Mira su perfil, si es particular o profesional, y sus documentos.</p></div>
    <div class="paso"><h3>Escríbele directo</h3><p>Agenda visita o videollamada antes de pagar.</p></div><div class="paso"><h3>Acuerden la compra</h3><p>El pago y la entrega se acuerdan directo con el vendedor.</p></div></div></div></section>
  ${vend&&vend.length?`<section class="blk" style="padding-top:0"><div class="wrap"><div class="tit"><div><h2>Vendedores verificados</h2></div><button class="link" data-go="vendedores">Ver todos →</button></div><div class="criaderos">${vend.map(crc).join('')}</div></div></section>`:''}
`;
}
const hoyISO=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
function enlaceBanner(l){l=(l||'').trim();if(!l)return'';const d=l.replace(/\D/g,'');if(!/[a-z]/i.test(l)&&d.length>=7)return'https://wa.me/'+(d.length===10?'57'+d:d);return/^https?:\/\//i.test(l)?l:'https://'+l}
function estadoBanner(b){const h=hoyISO();if(!b.activo)return['Pausado','e-gris'];if(b.desde&&b.desde>h)return['Programado','e-pend'];if(b.hasta&&b.hasta<h)return['Terminado','e-gris'];return['Al aire','e-ok']}
function bannersDe(lugar){return BANNERS.filter(b=>(b.ubicacion===lugar||b.ubicacion==='ambas')&&estadoBanner(b)[0]==='Al aire').sort(()=>Math.random()-.5)}
function bannersHtml(list){
  const uno=x=>{const u=enlaceBanner(x.enlace);
    if(x.imagen){const img=`<img src="${esc(fotoUrl(x.imagen))}" alt="${esc(x.texto||('Publicidad de '+x.anunciante))}" loading="lazy"><span class="ban-tag">Publicidad</span>`;
      return u?`<a class="banner-img" href="${esc(u)}" target="_blank" rel="noopener sponsored" data-banclic="${x.id}">${img}</a>`:`<div class="banner-img">${img}</div>`}
    return `<div class="banner-ad" style="background:${esc(x.color||'#2F5A42')}"><span class="em">${esc(x.emoji||'📣')}</span><div style="flex:1"><small>Publicidad · ${esc(x.anunciante)}</small><b>${esc(x.texto||'')}</b></div>${u?`<a class="btn btn-s" style="background:#fff;color:${esc(x.color||'#2F5A42')};text-decoration:none" href="${esc(u)}" target="_blank" rel="noopener sponsored" data-banclic="${x.id}">${esc(x.boton||'Ver más')}</a>`:''}</div>`};
  return `<div class="banners ${list.length>1?'ban-rot':''}">${list.map((x,i)=>`<div class="ban-slide ${i===0?'on':''}">${uno(x)}</div>`).join('')}${list.length>1?`<div class="ban-puntos">${list.map((x,i)=>`<span class="${i===0?'on':''}"></span>`).join('')}</div>`:''}</div>`;
}
setInterval(()=>{document.querySelectorAll('.ban-rot').forEach(r=>{const sl=[...r.querySelectorAll('.ban-slide')],pt=[...r.querySelectorAll('.ban-puntos span')];let i=sl.findIndex(x=>x.classList.contains('on'));sl[i].classList.remove('on');pt[i]&&pt[i].classList.remove('on');i=(i+1)%sl.length;sl[i].classList.add('on');pt[i]&&pt[i].classList.add('on')})},6000);
const urlWeb = w => { w=String(w||'').trim(); return /^https?:\/\//i.test(w)?w:'https://'+w };
const avatar = (v,emoji) => v&&v.logo ? `<img src="${esc(fotoUrl(v.logo))}" alt="">` : (emoji||planDe(v&&v.plan).emoji||'🐾');
function crc(v){return `<button class="crc" data-vend="${v.id}"><div class="av">${avatar(v)}</div><div><b>${esc(v.nombre_publico)}</b><small>${esc(v.municipio||'')}${v.municipio?', ':''}${esc(v.departamento||'')}</small><div style="margin-top:5px">${sellos(v)}</div></div></button>`}

async function vCategorias(){
  return `<div class="wrap" style="padding:34px 20px"><div class="tit"><div><h2>Todas las categorías</h2><p>Elige una categoría para ver sus razas y publicaciones.</p></div></div>
    ${Object.entries(GRUPOS).map(([g,gn])=>{const cs=CATS.filter(c=>c.grupo===g&&c.activa);if(!cs.length)return'';return `<h3 class="serif" style="color:var(--verde);font-size:22px;margin:22px 0 12px">${gn}</h3><div class="cat-lista">${cs.map(c=>`<button class="cat-i" data-cat="${c.id}" ${c.estado_legal==='no_habilitada'||c.estado_legal==='prohibida'?'disabled':''}><span class="em">${c.emoji}</span><div><b>${esc(c.nombre)}</b><small>${esc(c.descripcion||'')}</small>${c.estado_legal!=='habilitada'?`<span class="estado ${LEGAL[c.estado_legal][1]}" style="margin-top:4px;display:inline-block">${LEGAL[c.estado_legal][0]}</span>`:''}</div></button>`).join('')}</div>`}).join('')}</div>`;
}

async function buscarPublicaciones(){
  const f=S.f; let q=sb.from('publicaciones').select(SELECT_PUB).eq('estado','activo').limit(300);
  if(f.cat) q=q.eq('categoria_id',f.cat); if(f.raza) q=q.eq('raza',f.raza); if(f.tipo) q=q.eq('tipo',f.tipo); if(f.sexo) q=q.eq('sexo',f.sexo);
  if(f.prop) q=q.contains('finalidades',[f.prop]); if(f.apt) q=q.contains('aptitudes',[f.apt]); if(f.min) q=q.gte('precio',Number(f.min)); if(f.max) q=q.lte('precio',Number(f.max));
  q = f.orden==='menor'?q.order('precio',{ascending:true,nullsFirst:false}):f.orden==='mayor'?q.order('precio',{ascending:false,nullsFirst:false}):f.orden==='nuevo'?q.order('created_at',{ascending:false}):q.order('destacado',{ascending:false}).order('created_at',{ascending:false});
  const {data,error}=await q; if(error) throw error;
  let r=(data||[]).filter(p=>p.vendedor);
  if(f.depto) r=r.filter(p=>p.vendedor.departamento===f.depto);
  if(f.vend) r=r.filter(p=>vendTipo(p.vendedor)===f.vend);
  if(f.q){const t=norm(f.q).split(/\s+/).filter(Boolean);r=r.filter(p=>{const c=catDe(p.categoria_id);const h=norm([p.titulo,p.raza,c.nombre,c.palabras_clave,TIPOS[p.tipo],p.sexo,(p.finalidades||[]).map(k=>PROP[k]).join(' '),(p.aptitudes||[]).join(' '),p.vendedor.nombre_publico,p.vendedor.municipio,p.vendedor.departamento,Object.values(p.atributos||{}).join(' ')].join(' '));return t.every(w=>h.includes(w)||(w.length>4&&w.endsWith('s')&&h.includes(w.slice(0,-1))))})}
  return r;
}
async function vExplorar(){
  const f=S.f, cat=f.cat?catDe(f.cat):null, r=await buscarPublicaciones(), tipos=cat?(cat.tipos||[]):Object.keys(TIPOS);
  const chip=(k,v,t)=>`<button class="chip ${f[k]===v?'on':''}" data-f="${k}" data-v="${v}">${t}</button>`;
  const act=[];if(f.q)act.push(['q','“'+esc(f.q)+'”']);if(cat)act.push(['cat',cat.emoji+' '+esc(cat.nombre)]);if(f.raza)act.push(['raza',esc(f.raza)]);if(f.prop)act.push(['prop',PROP[f.prop]]);if(f.apt)act.push(['apt','🎯 '+esc(f.apt)]);if(f.tipo)act.push(['tipo',TIPOS[f.tipo]]);if(f.sexo)act.push(['sexo',f.sexo]);if(f.depto)act.push(['depto','📍 '+f.depto]);if(f.min||f.max)act.push(['precio','💲 '+(f.min?cop(f.min):'0')+' – '+(f.max?cop(f.max):'más')]);if(f.vend)act.push(['vend',{particular:'Particular',profesional:'Profesional',fundacion:'Fundación'}[f.vend]]);
  const ban=bannersDe('explorar');
  return `<div class="wrap"><div class="explorar">
    <aside class="filtros ${S.verFiltros?'abierto':''}"><div class="filtros-cab"><b>Filtros</b><button data-verfiltros>✕ Cerrar</button></div>
      <h3>Buscar</h3><input class="campo" id="fq" value="${esc(f.q)}" placeholder="Raza, tipo, ciudad…">
      <h3>Categoría</h3><select class="campo" id="fcat"><option value="">Todas las categorías</option>${Object.entries(GRUPOS).map(([g,gn])=>`<optgroup label="${gn}">${CATS.filter(c=>c.grupo===g&&c.activa&&!['no_habilitada','prohibida'].includes(c.estado_legal)).map(c=>`<option value="${c.id}" ${f.cat===c.id?'selected':''}>${c.emoji} ${esc(c.nombre)}</option>`).join('')}</optgroup>`).join('')}</select>
      ${cat?`<h3>Raza / variedad</h3><select class="campo" id="fraza"><option value="">Todas</option>${(RAZAS[cat.id]||[]).map(x=>`<option ${f.raza===x?'selected':''}>${esc(x)}</option>`).join('')}</select>`:''}
      <h3>Departamento</h3><select class="campo" id="fdepto"><option value="">Toda Colombia</option>${DEPTOS.map(d=>`<option ${f.depto===d?'selected':''}>${d}</option>`).join('')}</select>
      <h3>Precio (COP)</h3><div style="display:flex;gap:6px"><input class="campo" id="fmin" type="number" placeholder="Mín." value="${esc(f.min)}"><input class="campo" id="fmax" type="number" placeholder="Máx." value="${esc(f.max)}"></div>
      <details class="mas-f" ${f.tipo||f.sexo||f.prop||f.apt||f.vend?'open':''}><summary>Más filtros</summary>
        <h3>Finalidad</h3><div class="chips">${chip('prop','','Todas')}${Object.entries(PROP).map(([k,v])=>chip('prop',k,v)).join('')}</div>
        ${cat&&APTITUDES[cat.id]?`<h3>Aptitud o disciplina</h3><div class="chips">${chip('apt','','Todas')}${APTITUDES[cat.id].map(x=>chip('apt',x,esc(x))).join('')}</div>`:''}
        <h3>Tipo de publicación</h3><div class="chips">${chip('tipo','','Todos')}${tipos.map(t=>chip('tipo',t,TIPOS[t])).join('')}</div>
        <h3>Sexo</h3><div class="chips">${chip('sexo','','Todos')}${['Macho','Hembra','Mixto'].map(s=>chip('sexo',s,s)).join('')}</div>
        <h3>Vendedor</h3><div class="chips">${chip('vend','','Todos')}${chip('vend','particular','Particular')}${chip('vend','profesional','Profesional')}${chip('vend','fundacion','Fundación')}</div></details>
      <button class="btn btn-o btn-s" style="width:100%;margin-top:18px" data-limpiar>Limpiar filtros</button></aside>
    <div>
      <div class="activos"><button class="btn btn-o btn-s solo-movil" data-verfiltros>⚙️ Filtros</button>${act.map(([k,t])=>`<button class="chip-act" data-quitar="${k}">${t} ✕</button>`).join('')}${act.length>1?'<button class="link" style="font-size:13.5px" data-limpiar>Quitar todo</button>':''}</div>
      ${cat?`<div class="cat-cab"><div class="em">${cat.emoji}</div><div style="flex:1"><h2 class="serif" style="color:var(--verde);font-size:30px">${esc(cat.nombre)}</h2><p style="color:var(--gris)">${esc(cat.descripcion||'')}</p></div></div>
        <div class="razas"><b>Razas y variedades (${(RAZAS[cat.id]||[]).length})</b><div class="chips" style="margin-top:10px;max-height:220px;overflow:auto"><button class="chip ${!f.raza?'on':''}" data-raza="">Todas</button>${(RAZAS[cat.id]||[]).map(x=>`<button class="chip ${f.raza===x?'on':''}" data-raza="${esc(x)}">${esc(x)}</button>`).join('')}</div></div>`:''}
      ${ban.length?bannersHtml(ban):''}
      <div class="barra-res"><div><h2 class="serif" style="color:var(--verde);font-size:24px">${esc(f.raza)||(cat?'Publicaciones':'Todos los animales')}</h2><span style="color:var(--gris)">${r.length} ${r.length===1?'publicación':'publicaciones'}${f.depto?' en '+f.depto:''}</span></div>
        <select class="campo" id="forden" style="width:auto"><option value="dest" ${f.orden==='dest'?'selected':''}>Destacados primero</option><option value="nuevo" ${f.orden==='nuevo'?'selected':''}>Más recientes</option><option value="menor" ${f.orden==='menor'?'selected':''}>Menor precio</option><option value="mayor" ${f.orden==='mayor'?'selected':''}>Mayor precio</option></select></div>
      ${r.length?`<div class="grid">${r.map(tarjeta).join('')}</div>`:'<div class="vacio"><div style="font-size:44px">🔎</div><b>No hay publicaciones con esos filtros</b><p>Prueba con otra raza o quita algún filtro.</p></div>'}
    </div></div></div>`;
}

function padresHtml(pd){pd=pd||{};const qs=['padre','madre'].filter(q=>pd[q]&&Object.keys(pd[q]).length);if(!qs.length)return'';
  const fila=(n,x)=>x?`<div><small>${n}</small><b>${esc(x)}</b></div>`:'';
  return `<div class="panel" style="margin-top:18px"><h3 class="serif" style="color:var(--verde);margin-bottom:12px">Información de los padres</h3><div class="padres-g">${qs.map(q=>{const d=pd[q];return `<div class="padre-pub"><div class="padre-tit">${q==='padre'?'♂ Padre':'♀ Madre'}</div>${d.foto?`<img src="${esc(fotoUrl(d.foto))}" alt="${q==='padre'?'Padre':'Madre'}">`:''}<div class="fichas" style="grid-template-columns:1fr;margin:8px 0 0">${fila('Nombre',d.nombre)}${fila('Raza',d.raza)}${fila('Color o variedad',d.color)}${fila('Registro genealógico',d.registro)}</div></div>`}).join('')}</div>
    <p style="font-size:12.5px;color:var(--gris);margin-top:10px">ℹ️ Información declarada por el vendedor. La Cría no verifica la filiación.</p></div>`}
async function vAnimal(){
  const {data:p,error}=await sb.from('publicaciones').select(SELECT_PUB).eq('id',S.param).maybeSingle();
  if(error) throw error; if(!p) return `<div class="wrap"><div class="vacio" style="margin:40px 0">Esta publicación ya no está disponible.<br><br><button class="btn btn-o btn-s" data-go="explorar">Ver otros animales</button></div></div>`;
  const c=catDe(p.categoria_id), v=p.vendedor||{}, fotos=p.fotos||[], adop=(p.finalidades||[]).includes('a');
  const wa=(v.whatsapp||'').replace(/\D/g,''), waN=wa.length===10?'57'+wa:wa, txt=encodeURIComponent(`Hola ${v.nombre_publico}, te vi en La Cría y me interesa: ${p.titulo}`);
  const fav = S.sesion ? (await sb.from('favoritos').select('publicacion_id').eq('publicacion_id',p.id).maybeSingle()).data : null;
  return `<div class="wrap"><div class="migas"><button data-go="explorar">Explorar</button> › <button data-cat="${c.id}">${esc(c.nombre)}</button> › ${esc(p.titulo)}</div>
  <div class="detalle"><div class="galeria"><div class="principal ${c.bg}" id="fotoP">${fotos[0]?`<img src="${esc(fotoUrl(fotos[0]))}" alt="">`:c.emoji}</div>
    ${fotos.length>1?`<div class="minis">${fotos.slice(0,8).map(f=>`<div><img src="${esc(fotoUrl(f))}" data-vfoto="${esc(fotoUrl(f))}" alt=""></div>`).join('')}</div>`:''}
    ${p.video?`<video src="${esc(fotoUrl(p.video))}" controls style="width:100%;border-radius:16px;margin-top:10px"></video>`:''}
    <div class="panel" style="margin-top:18px"><h3 class="serif" style="color:var(--verde);margin-bottom:6px">Descripción</h3><p style="white-space:pre-line">${esc(p.descripcion||'Sin descripción.')}</p></div>
    ${padresHtml(p.padres)}</div>
  <div><div class="panel">
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">${(p.finalidades||[]).map(k=>`<span class="tag ${k}">${PROP[k]}</span>`).join('')}<span class="tag" style="background:var(--crema)">${c.emoji} ${esc(c.nombre)}</span><span class="tag" style="background:var(--crema)">${TIPOS[p.tipo]||''}</span></div>
    <h1>${esc(p.titulo)}</h1>
    <div class="precio-g">${precioTxt(p)} <span style="font-size:16px;font-family:'DM Sans';color:var(--gris);font-weight:500">${subPrecio(p)}</span></div>
    <div style="color:var(--gris)">📍 ${esc(v.municipio||'')}${v.municipio?', ':''}${esc(v.departamento||'')} <small>(ubicación aproximada)</small> · ${p.cantidad>1?p.cantidad+' disponibles':'1 disponible'}</div>
    ${(p.finalidades||[]).filter(k=>k!=='a').length?`<b style="font-size:14px">Finalidad del ejemplar</b><div class="docs" style="margin-bottom:12px">${p.finalidades.filter(k=>k!=='a').map(k=>{const f=FINES.find(x=>x[0]===k);return `<span class="doc fin-doc">${f?f[1]+' ':''}${esc(PROP[k]||k)}</span>`}).join('')}</div>`:''}
    ${(p.aptitudes||[]).length?`<b style="font-size:14px">Aptitud, disciplina o especialidad</b><div class="docs" style="margin-bottom:12px">${p.aptitudes.map(x=>`<span class="doc fin-doc">🎯 ${esc(x)}</span>`).join('')}</div>`:''}
    <div class="fichas"><div><small>Raza / variedad</small><b>${esc(p.raza||'—')}</b></div><div><small>Tipo</small><b>${TIPOS[p.tipo]||'—'}</b></div>${p.sexo?`<div><small>Sexo</small><b>${esc(p.sexo)}</b></div>`:''}${Object.entries(p.atributos||{}).map(([k,x])=>[k==='Pedigrí'?'Pedigree':k,x]).filter(([k,x])=>x).map(([k,x])=>`<div><small>${esc(k)}</small><b>${esc(x)}</b></div>`).join('')}</div>
    ${(p.documentos||[]).length?`<b style="font-size:14px">Documentos que entrega</b><div class="docs">${p.documentos.map(d=>`<span class="doc">✓ ${esc(d)}</span>`).join('')}</div>`:''}
    ${PRODUCCION.includes(p.categoria_id)?'<div class="aviso">🚚 <b>Movilización:</b> para trasladar este animal el vendedor debe tramitar la Guía Sanitaria de Movilización Interna (GSMI) del ICA.</div>':''}
    ${ACUI.includes(p.categoria_id)?'<div class="aviso">🐟 <b>Acuicultura:</b> el vendedor debe contar con permisos de la AUNAP o certificado de origen.</div>':''}
    ${S.sesion&&S.sesion.user.id===v.id?'':`<button class="btn btn-p" style="width:100%;margin-bottom:8px" data-escribir="${p.id}">✉️ ${adop?'Escribir por mensaje sobre la adopción':'Enviar mensaje al vendedor'}</button>`}
    ${waN?`<a class="btn btn-wa" style="width:100%;text-decoration:none" href="https://wa.me/${waN}?text=${txt}" target="_blank" rel="noopener">💬 ${adop?'Preguntar por WhatsApp':'Escribir por WhatsApp'}</a>`:''}
    <div style="display:flex;gap:8px;margin-top:8px"><button class="btn btn-o btn-s" style="flex:1" data-vend="${v.id}">Ver vendedor</button><button class="btn btn-o btn-s" style="flex:1" data-fav="${p.id}">${fav?'♥ Guardado':'♡ Guardar'}</button><button class="btn btn-o btn-s" style="flex:1" data-compartir="${p.id}">🔗 Compartir</button></div>
    <button style="margin-top:12px;font-size:13px;color:var(--gris);text-decoration:underline" data-reportar="${p.id}">Reportar esta publicación</button></div>
    <button class="panel crc" style="width:100%;margin-top:14px" data-vend="${v.id}"><div class="av">${avatar(v)}</div><div><b>${esc(v.nombre_publico)}</b><div style="margin-top:5px">${sellos(v,true)}</div></div></button>
    <div class="aviso" style="background:#EEF5F0;border-color:#C8DFCF">🛡️ <b>Compra segura:</b> visita al vendedor o pide videollamada antes de pagar. Nunca pagues por un animal que no has visto.</div>
    <p style="font-size:12px;color:var(--gris)">El sello de verificación de La Cría es una revisión interna de documentos y no equivale a una certificación oficial.</p></div></div></div>`;
}

async function vVendedor(){
  const [{data:v},{data:pubs}]=await Promise.all([sb.from('vendedores').select('*').eq('id',S.param).maybeSingle(), sb.from('publicaciones').select(SELECT_PUB).eq('vendedor_id',S.param).eq('estado','activo').order('created_at',{ascending:false})]);
  if(!v) return `<div class="wrap"><div class="vacio" style="margin:40px 0">Este vendedor no está disponible.</div></div>`;
  const wa=(v.whatsapp||'').replace(/\D/g,''), waN=wa.length===10?'57'+wa:wa;
  return `<div class="portada"><span>${(v.especies||[]).length?catDe(v.especies[0]).emoji:(planDe(v.plan).emoji||'🐾')}</span></div><div class="wrap">
    <div class="perfil-cab"><div class="av">${avatar(v)}</div><div style="padding-bottom:6px"><div style="margin-bottom:6px">${sellos(v,true)}</div><h1>${esc(v.nombre_publico)}</h1><div style="color:var(--gris)">📍 ${esc(v.municipio||'')}${v.municipio?', ':''}${esc(v.departamento||'')}${v.anios?` · ${v.anios} años`:''}</div></div>
      <div style="margin-left:auto;display:flex;gap:8px;padding-bottom:6px">${waN?`<a class="btn btn-wa" style="text-decoration:none" href="https://wa.me/${waN}" target="_blank" rel="noopener">💬 WhatsApp</a>`:''}<button class="btn btn-o" data-compartir-v="${v.id}">🔗 Compartir</button></div></div>
    <div class="perfil-datos"><div class="panel"><h3 class="serif" style="color:var(--verde);margin-bottom:8px">Sobre ${v.plan==='fundacion'?'la fundación':'el vendedor'}</h3><p style="white-space:pre-line">${esc(v.descripcion||'')}</p>
      <div style="margin-top:14px;display:flex;gap:6px;flex-wrap:wrap">${(v.especies||[]).map(x=>`<span class="tag" style="background:var(--crema)">${catDe(x).emoji} ${esc(catDe(x).nombre)}</span>`).join('')}</div></div>
      <div class="panel">${v.whatsapp?`<div class="linea-dato">📱 ${waN?`<a class="lk-dato" href="https://wa.me/${waN}" target="_blank" rel="noopener">${esc(v.whatsapp)}</a>`:`<span>${esc(v.whatsapp)}</span>`}</div>`:''}${v.instagram?`<div class="linea-dato">📸 <a class="lk-dato" href="https://instagram.com/${encodeURIComponent(v.instagram.replace(/^@/,'').trim())}" target="_blank" rel="noopener">@${esc(v.instagram.replace(/^@/,''))}</a></div>`:''}${v.web?`<div class="linea-dato">🌐 <a class="lk-dato" href="${esc(urlWeb(v.web))}" target="_blank" rel="noopener">${esc(v.web.replace(/^https?:\/\//,'').replace(/\/$/,''))}</a></div>`:''}${v.envios?`<div class="linea-dato">🚚 <span>${esc(v.envios)}</span></div>`:''}${v.llave_donaciones?`<div class="linea-dato">💜 <span>Donaciones: ${esc(v.llave_donaciones)}</span></div>`:''}</div></div>
    <div class="tit"><h2>${v.plan==='fundacion'||v.plan==='adopcion'?'Buscan hogar':'Disponibles'} (${(pubs||[]).length})</h2></div>
    <div class="grid" style="margin-bottom:40px">${(pubs||[]).map(tarjeta).join('')||'<div class="vacio">Aún no tiene publicaciones activas.</div>'}</div></div>`;
}
async function vVendedores(){
  const {data}=await sb.from('vendedores').select('id,nombre_publico,plan,departamento,municipio,verificado,oficial,logo').eq('estado','activo').order('oficial',{ascending:false});
  return `<div class="wrap" style="padding:34px 20px"><div class="tit"><div><h2>Vendedores verificados</h2><p>Criaderos, haciendas, fundaciones y particulares que pasaron revisión de documentos.</p></div></div><div class="criaderos">${(data||[]).map(crc).join('')||'<div class="vacio">Muy pronto.</div>'}</div></div>`;
}

async function vPlanes(){
  const AN=!!S.anualPlanes, venta=PLANES.filter(p=>!p.adopcion&&(!AN||TIENE_ANUAL.includes(p.id))), adop=AN?[]:PLANES.filter(p=>p.adopcion);
  const card=p=>{const an=AN&&TIENE_ANUAL.includes(p.id);return `<div class="plan ${p.id==='criadero'?'pop':''}"><div style="font-size:34px">${p.emoji}</div><h3>Plan ${esc(p.nombre)}</h3><div class="val">${esGratis(p)?'Gratis':cop(an?p.precio*10:p.precio)}<small> ${an?'/ año':unidadPlan(p)}</small></div>
    ${TIENE_ANUAL.includes(p.id)?(an?`<small style="color:var(--ok);font-weight:700">12 meses por el precio de 10 · ahorras ${cop(p.precio*2)}</small>`:`<small style="color:var(--ok);font-weight:700">o ${cop(p.precio*10)} al año (2 meses gratis)</small>`):(AN&&!p.adopcion&&!esGratis(p)?'<small style="color:var(--gris)">Este plan no tiene opción anual</small>':'<small>&nbsp;</small>')}
    <ul>${({gratis:['1 publicación activa por 30 días','Sin pagar nada','Los compradores te contactan por WhatsApp','Panel básico para publicar'],ocasional:['Hasta 20 publicaciones durante 60 días','Para personas sin criadero registrado','Todas las especies permitidas','Un solo pago'],criadero:['Hasta 40 publicaciones activas','Perfil de criadero con redes y WhatsApp','Hasta 3 especies','3 destacados al mes'],hacienda:['Publicaciones ilimitadas','Todas las especies','10 destacados al mes','Varias fincas o sedes'],adopcion:['1 publicación por 60 días','Cada publicación es de un solo animal','Para personas que no son fundación','Sin costo para quien adopta'],fundacion:['Hasta 40 publicaciones en adopción','Cada publicación es de un solo animal','Perfil de fundación','Botón de donaciones','Para entidades legalmente constituidas']}[p.id]||[]).map(i=>`<li>${i}</li>`).join('')}</ul>
    <button class="btn ${p.adopcion?'':'btn-p'}" ${p.adopcion?'style="background:#7A4E8C;color:#fff"':''} data-elegir="${p.id}" data-anual="${an?1:0}">Elegir plan ${esc(p.nombre)}${an?' anual':''}</button></div>`};
  return `<div class="wrap" style="padding:44px 20px;text-align:center"><h1 class="serif" style="font-size:clamp(32px,4.5vw,50px);color:var(--verde)">Planes de La Cría</h1><p style="color:var(--gris);max-width:620px;margin:10px auto 18px">Sin comisiones: el comprador le paga directo al vendedor. Solo pagas tu plan por Bre-B.</p>
    <div class="toggle-anual"><button class="${AN?'':'on'}" data-anualplanes="0">Mensual</button><button class="${AN?'on':''}" data-anualplanes="1">Anual <span>2 meses gratis</span></button></div>
    <div class="planes ${AN?'planes-anual':''}" style="text-align:left">${venta.map(card).join('')}</div>
    ${AN?`<p style="color:var(--gris);margin-top:16px;font-size:14.5px">El pago anual está disponible para los planes Criadero y Hacienda. Los demás planes se pagan como siempre: toca <b>Mensual</b> para verlos.</p>`:`<h2 class="serif" style="color:#6A3F7C;font-size:30px;margin:40px 0 16px;text-align:left">Planes para dar en adopción</h2><div class="planes" style="text-align:left;grid-template-columns:1fr 1fr">${adop.map(card).join('')}</div>`}
    <div class="panel" style="text-align:left;margin-top:26px"><h3 class="serif" style="color:var(--verde)">¿Cómo pago mi plan?</h3><p style="margin-top:8px">Elige tu plan, crea tu cuenta, sube tus documentos y paga por Bre-B a la llave <b>${esc(CONFIG.llave_breb||'')}</b> (${esc(CONFIG.titular_breb||'La Cría')}). Sube el comprobante y activamos tu cuenta en máximo ${esc(CONFIG.horas_activacion||24)} horas.</p>
      <p style="margin-top:8px;color:var(--gris)">🛒 Los compradores no pagan nada: registrarse y contactar vendedores es gratis.</p></div></div>`;
}

async function vLegal(){
  const id=S.param||'terminos', base=LEGALES_BASE.find(x=>x.id===id)||LEGALES_BASE[0], db=LEGALES_DB[id];
  const html=db&&db.html?db.html:base.html();
  return `<div class="wrap"><div class="legal-w"><aside class="legal-idx"><b>Documentos legales</b>${LEGALES_BASE.map(x=>`<button class="${x.id===id?'on':''}" data-legal="${x.id}">${x.ico} ${x.t}</button>`).join('')}</aside>
    <article class="legal-doc"><small style="color:var(--gris)">Versión ${esc(db?db.version:base.v)} · Aplica a: ${esc(base.para)}</small><h1 class="serif">${esc(db?db.titulo:base.t)}</h1>${html}</article></div></div>`;
}

/* =====================================================================
   CUENTAS
   ===================================================================== */
function modalLogin(msg){
  modal(`<h3>Iniciar sesión</h3>${msg?`<p style="color:var(--gris);margin-bottom:10px">${msg}</p>`:''}
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:6px"><input class="campo" id="lcor" type="email" placeholder="Correo"><input class="campo" id="lpas" type="password" placeholder="Contraseña"></div>
    <div id="lerr" style="color:var(--mal);font-size:13.5px;font-weight:600;margin-top:8px"></div>
    <button class="link" style="font-size:13.5px;margin-top:4px" data-olvide>¿Olvidaste tu contraseña?</button>
    <button class="btn btn-p" style="width:100%;margin-top:12px" data-entrar>Entrar</button>
    <p style="text-align:center;margin-top:12px;font-size:14px">¿No tienes cuenta? <button class="link" data-gocrear>Créala gratis</button></p>`);
}
function modalOlvide(){modal(`<h3>Recuperar contraseña</h3><p style="color:var(--gris);margin:6px 0 12px">Escribe el correo de tu cuenta y te enviamos un enlace para crear una contraseña nueva.</p><input class="campo" id="ocor" type="email" placeholder="tucorreo@gmail.com"><button class="btn btn-p" style="width:100%;margin-top:12px" data-olvenviar>Enviar enlace</button>`)}
function modalNuevaClave(){modal(`<h3>Crea tu nueva contraseña</h3><div style="display:flex;flex-direction:column;gap:8px;margin-top:8px"><input class="campo" id="nc1" type="password" placeholder="Nueva contraseña (mínimo 8)"><input class="campo" id="nc2" type="password" placeholder="Repite la contraseña"></div><button class="btn btn-p" style="width:100%;margin-top:12px" data-nuevaclave>Guardar contraseña</button>`)}
function pedirCuenta(accion){modal(`<h3>Crea tu cuenta gratis</h3><p style="color:var(--gris);margin:6px 0 14px">Para ${accion} necesitas una cuenta. Es gratis.</p><button class="btn btn-p" style="width:100%" data-gocrear>Crear cuenta</button><button class="btn btn-o" style="width:100%;margin-top:8px" data-login>Ya tengo cuenta</button>`)}

async function vCrear(){
  if(S.sesion) return vMiCuenta();
  return `<div class="wrap"><div class="reg" style="max-width:600px">
    <div class="aviso" style="margin:0 0 18px;display:flex;gap:12px;align-items:center;flex-wrap:wrap"><span style="flex:1;min-width:220px">🐾 <b>¿Vas a vender o dar animales en adopción?</b> No llenes esto: elige tu plan, paga y ahí mismo creas tu cuenta.</span><button class="btn btn-p btn-s" data-go="planes">Ver planes</button></div>
    <h2 class="serif" style="color:var(--verde)">Crear cuenta de comprador</h2><p style="color:var(--gris);margin-bottom:16px">Gratis. Para guardar favoritos y contactar vendedores.</p>
    <div class="form-g"><div class="f"><label>Nombre</label><input class="campo" id="cc-n"></div><div class="f"><label>Apellido</label><input class="campo" id="cc-a"></div>
      <div class="f full"><label>Correo</label><input class="campo" id="cc-c" type="email" placeholder="tucorreo@gmail.com"></div>
      <div class="f"><label>Celular (WhatsApp)</label><input class="campo" id="cc-w" placeholder="300 123 4567"></div>
      <div class="f"><label>Departamento</label><select class="campo" id="cc-d">${DEPTOS.map(d=>`<option>${d}</option>`).join('')}</select></div>
      <div class="f"><label>Contraseña</label><input class="campo" id="cc-p" type="password" placeholder="Mínimo 8 caracteres"></div><div class="f"><label>Repite la contraseña</label><input class="campo" id="cc-p2" type="password"></div>
      <label class="full chk"><input type="checkbox" id="cc-18"> Soy mayor de 18 años</label>
      <label class="full chk"><input type="checkbox" id="cc-t"> <span>Acepto los <a class="lk" data-legal="terminos">Términos y condiciones</a>, la <a class="lk" data-legal="datos">Política de datos personales</a> y el <a class="lk" data-legal="privacidad">Aviso de privacidad</a></span></label></div>
    <div class="pie-form"><button class="link" data-login>Ya tengo cuenta</button><button class="btn btn-p" data-crearcuenta>Crear cuenta</button></div></div></div>`;
}
async function crearCuenta(){
  const n=$('#cc-n').value.trim(), a=$('#cc-a').value.trim(), c=$('#cc-c').value.trim().toLowerCase(), w=$('#cc-w').value.trim(), d=$('#cc-d').value, p=$('#cc-p').value, p2=$('#cc-p2').value;
  if(!n||!c||!w){toast('Completa nombre, correo y celular');return}
  if(p.length<8){toast('La contraseña debe tener mínimo 8 caracteres');return}
  if(p!==p2){toast('Las contraseñas no coinciden');return}
  if(!$('#cc-18').checked||!$('#cc-t').checked){toast('Debes ser mayor de 18 años y aceptar los términos');return}
  const {data,error}=await sb.auth.signUp({email:c,password:p,options:{data:{nombre:(n+' '+a).trim(),whatsapp:w,departamento:d},emailRedirectTo:location.origin+location.pathname}});
  if(error){err(error,'No se pudo crear la cuenta');return}
  if(data.session){await sb.from('aceptaciones').insert({usuario_id:data.user.id,tipo:'Comprador',documentos:'Términos · Datos personales · Aviso de privacidad'});toast('🎉 ¡Bienvenido a La Cría!');go(S.despues||'micuenta');S.despues=null}
  else modal(`<div style="text-align:center"><div style="font-size:52px">📧</div><h3>Revisa tu correo</h3><p style="color:var(--gris);margin-top:8px">Te enviamos un enlace a <b>${esc(c)}</b> para confirmar tu cuenta. Ábrelo y listo, ya puedes entrar. Revisa también la carpeta de spam.</p></div>`);
}

function cajaVerificacion(v){const e=v.verificacion||'pendiente';
  if(e==='verificado')return `<div class="caja ver-estado ok">✓ <div><b>Cuenta verificada</b><small>Tu perfil y tus publicaciones muestran el sello de verificación de La Cría.</small></div></div>`;
  if(e==='rechazado')return `<div class="caja ver-estado mal">✕ <div><b>Verificación no aprobada</b><small>${v.motivo_verificacion?'Motivo: '+esc(v.motivo_verificacion)+'. ':''}Corrige lo indicado y escríbenos desde <button class="link" data-sub="soporte">Ayuda y soporte</button>.</small></div></div>`;
  return `<div class="caja ver-estado pend">⏳ <div><b>Verificación pendiente</b><small>El equipo de La Cría está revisando tus documentos. Mientras tanto, tu perfil aparece como “Sin verificar”.</small></div></div>`}
function cajaFoto(actual,tipo){
  const vend=tipo==='logo';
  return `<div class="caja foto-perfil"><div class="av av-g">${actual?`<img src="${esc(fotoUrl(actual))}" alt="">`:(vend?'🏡':'👤')}</div>
    <div style="flex:1;min-width:200px"><b>${vend?'Logo o foto de tu perfil':'Tu foto de perfil'}</b><p style="color:var(--gris);font-size:14px;margin:4px 0 10px">${vend?'Aparece en tu perfil público, en tus publicaciones y en la lista de vendedores. Usa tu logo o una foto tuya o de tus animales.':'Así te verán los vendedores cuando les escribas.'}</p>
    <label class="btn btn-o btn-s" style="display:inline-block;cursor:pointer">⬆ ${actual?'Cambiar':'Subir'} ${vend?'logo o foto':'foto'}<input type="file" hidden accept="image/*" data-subiravatar="${tipo}"></label>${actual?` <button class="btn btn-o btn-s" style="color:var(--mal)" data-quitaravatar="${tipo}">Quitar</button>`:''}
    <small style="display:block;margin-top:6px;color:var(--gris)">Foto cuadrada se ve mejor · JPG o PNG · máximo 10 MB</small></div></div>`;
}
/* recorta la imagen en cuadrado y la reduce para que cargue rápido */
function fotoCuadrada(file,lado=600){return new Promise((ok,fail)=>{const img=new Image(),u=URL.createObjectURL(file);img.onload=()=>{const m=Math.min(img.width,img.height),c=document.createElement('canvas');c.width=c.height=Math.min(lado,m);c.getContext('2d').drawImage(img,(img.width-m)/2,(img.height-m)/2,m,m,0,0,c.width,c.height);c.toBlob(b=>{URL.revokeObjectURL(u);b?ok(new File([b],'perfil.jpg',{type:'image/jpeg'})):fail(new Error('No se pudo procesar la imagen'))},'image/jpeg',.88)};img.onerror=()=>fail(new Error('Archivo de imagen no válido'));img.src=u})}
function reducirImagen(file,max){return new Promise((ok,fail)=>{const img=new Image(),u=URL.createObjectURL(file);img.onload=()=>{const r=Math.min(1,max/img.width),c=document.createElement('canvas');c.width=Math.round(img.width*r);c.height=Math.round(img.height*r);c.getContext('2d').drawImage(img,0,0,c.width,c.height);c.toBlob(b=>{URL.revokeObjectURL(u);b?ok(new File([b],'banner.jpg',{type:'image/jpeg'})):fail(new Error('No se pudo procesar la imagen'))},'image/jpeg',.9)};img.onerror=()=>fail(new Error('Archivo de imagen no válido'));img.src=u})}
const ESTADO_T={abierto:['Esperando respuesta','e-pend'],respondido:['Respondido','e-ok'],cerrado:['Cerrado','e-gris']};
function hiloTicket(x,soyAdmin){
  const fh=d=>new Date(d).toLocaleString('es-CO',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'});
  const msgs=[{texto:x.mensaje,de_admin:false,created_at:x.created_at}].concat((x.respuestas||[]).slice().sort((a,b)=>a.created_at<b.created_at?-1:1));
  return `<div class="hilo">${msgs.map(m=>{const mio=soyAdmin?m.de_admin:!m.de_admin;return `<div class="msj ${mio?'mio':''} ${m.de_admin?'adm':''}"><small>${m.de_admin?'🐾 La Cría':esc(soyAdmin?(x.nombre||'Usuario'):'Tú')} · ${fh(m.created_at)}</small><div>${esc(m.texto)}</div></div>`}).join('')}</div>
    ${x.estado!=='cerrado'?`<div class="resp-box"><textarea class="campo" id="tr-${x.id}" rows="2" placeholder="${soyAdmin?'Escribe tu respuesta…':'Escribe tu mensaje…'}"></textarea><button class="btn btn-p btn-s" data-tresp="${x.id}">Enviar</button></div>`:`<p style="font-size:13.5px;color:var(--gris);margin-top:10px">Este caso está cerrado.${soyAdmin?'':' Si necesitas algo más, abre un caso nuevo.'}</p>`}`;
}
async function vSoporteUsuario(){
  const {data}=await sb.from('tickets').select('*, respuestas:ticket_respuestas(*)').eq('usuario_id',S.sesion.user.id).order('created_at',{ascending:false}).limit(30);
  const L=data||[];
  return `<div class="h-dash"><h2>Ayuda y soporte</h2><button class="btn btn-p btn-s" data-soporte>➕ Nuevo caso</button></div>
    <div class="caja" style="background:var(--crema);font-size:14.5px">🛟 Aquí ves tus casos con el equipo de La Cría. Cuando te respondamos te llega un aviso a la campanita 🔔 y puedes contestar desde aquí mismo.</div>
    ${L.map(x=>{const e=ESTADO_T[x.estado]||ESTADO_T.abierto;return `<div class="caja"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><div><b>${esc(x.tipo||'Caso')}</b> <small style="color:var(--gris)">#${x.id}</small>${x.referencia?`<div style="font-size:13.5px;color:var(--gris)">Sobre: ${esc(x.referencia)}</div>`:''}</div><span class="estado ${e[1]}">${e[0]}</span></div>${hiloTicket(x,false)}</div>`}).join('')||'<div class="vacio">No tienes casos de soporte. Si necesitas ayuda, toca “➕ Nuevo caso”.</div>'}`;
}
/* =====================  MENSAJES (comprador ⇄ vendedor)  ===================== */
async function contarNoLeidos(){if(!S.sesion){S.noLeidos=0;return}const {count}=await sb.from('mensajes').select('*',{count:'exact',head:true}).eq('leido',false).neq('autor_id',S.sesion.user.id);S.noLeidos=count||0}
async function abrirChatDe(pubId){
  if(!S.sesion){S.despues=null;pedirCuenta('escribirle al vendedor');return}
  const me=S.sesion.user.id;
  let {data:c}=await sb.from('conversaciones').select('id').eq('publicacion_id',pubId).eq('comprador_id',me).maybeSingle();
  if(!c){const {data:p}=await sb.from('publicaciones').select('vendedor_id').eq('id',pubId).single();
    const r=await sb.from('conversaciones').insert({publicacion_id:pubId,comprador_id:me,vendedor_id:p.vendedor_id}).select('id').single();
    if(r.error){err(r.error,'No se pudo abrir el chat');return}c=r.data}
  S.chat=c.id;S.sub='mensajes';go(S.yo?'panel':esAdmin()?'micuenta':'micuenta');
}
async function vMensajes(){
  const me=S.sesion.user.id;
  const {data:cs}=await sb.from('conversaciones').select('*, vendedor:vendedores(id,nombre_publico,logo,plan), publicacion:publicaciones(id,titulo,fotos)').order('actualizada',{ascending:false,nullsFirst:false}).limit(100);
  const L=cs||[];
  const {data:nl}=await sb.from('mensajes').select('conversacion_id').eq('leido',false).neq('autor_id',me).limit(1000);
  const sinLeer={};(nl||[]).forEach(m=>sinLeer[m.conversacion_id]=(sinLeer[m.conversacion_id]||0)+1);
  if(S.chat&&!L.some(c=>c.id===S.chat))S.chat=null;
  const otro=c=>c.vendedor_id===me?{n:c.comprador_nombre||'Comprador',av:'👤',rol:'Comprador'}:{n:c.vendedor?c.vendedor.nombre_publico:'Vendedor',av:c.vendedor&&c.vendedor.logo?`<img src="${esc(fotoUrl(c.vendedor.logo))}" alt="">`:(c.vendedor?planDe(c.vendedor.plan).emoji:'🏡'),rol:'Vendedor'};
  const lista=L.map(c=>{const o=otro(c),n=sinLeer[c.id]||0;return `<button class="conv ${S.chat===c.id?'on':''}" data-chat="${c.id}"><div class="av av-s">${o.av}</div><div style="flex:1;min-width:0"><b>${esc(o.n)}</b><small>${esc(c.publicacion?c.publicacion.titulo:c.publicacion_titulo||'Publicación')}</small></div>${n?`<span class="badge">${n}</span>`:''}</button>`}).join('');
  let hilo='';
  if(S.chat){const c=L.find(x=>x.id===S.chat),o=otro(c);
    hilo=`<div class="chat-cab"><button class="link solo-movil" data-chatcerrar>← Chats</button><div class="av av-s">${o.av}</div><div style="flex:1;min-width:0"><b>${esc(o.n)}</b><small>${o.rol} · sobre ${c.publicacion?`<button class="link" data-animal="${c.publicacion.id}">${esc(c.publicacion.titulo)}</button>`:esc(c.publicacion_titulo||'una publicación')}</small></div></div>
      <div class="chat-hilo" id="hilochat">${await hiloChat(S.chat)}</div>
      <div class="chat-pie"><label class="chat-adj" title="Adjuntar foto o video">📎<input type="file" hidden accept="image/*,video/*" data-chatarch></label><textarea class="campo" id="chattxt" rows="1" placeholder="Escribe un mensaje…"></textarea><button class="btn btn-p btn-s" data-chatenviar>Enviar</button></div>
      <small class="chat-nota">🛡️ Por seguridad, no compartas claves ni pagues sin ver al animal. Puedes enviar fotos y videos (máx. 50 MB).</small>`}
  return `<div class="h-dash"><h2>Mensajes</h2></div>
    ${L.length?`<div class="chat ${S.chat?'con-chat':''}"><div class="chat-lista">${lista}</div><div class="chat-panel">${hilo||'<div class="vacio" style="margin:auto">Elige una conversación para ver los mensajes.</div>'}</div></div>`
      :`<div class="vacio">${S.yo?'Todavía no tienes mensajes. Cuando un comprador te escriba desde una de tus publicaciones, la conversación aparece aquí.':'Todavía no tienes mensajes. Entra a un animal que te guste y toca “✉️ Enviar mensaje al vendedor”.'}</div>`}`;
}
async function hiloChat(cid){
  const me=S.sesion.user.id;
  const {data:ms}=await sb.from('mensajes').select('*').eq('conversacion_id',cid).order('created_at').limit(500);
  const L=ms||[];S.chatN=L.length;
  const rutas=L.filter(m=>m.archivo).map(m=>m.archivo);let urls={};
  if(rutas.length){const {data}=await sb.storage.from('chat').createSignedUrls(rutas,3600);(data||[]).forEach(x=>{if(x.signedUrl)urls[x.path]=x.signedUrl})}
  if(L.some(m=>!m.leido&&m.autor_id!==me)){await sb.from('mensajes').update({leido:true}).eq('conversacion_id',cid).neq('autor_id',me).eq('leido',false);contarNoLeidos().then(pintarBadgeChat)}
  const fh=d=>new Date(d).toLocaleString('es-CO',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'});
  return L.map(m=>{const u=urls[m.archivo];const adj=m.archivo?(m.archivo_tipo==='video'?(u?`<video src="${esc(u)}" controls preload="metadata"></video>`:'🎬 Video'):(u?`<a href="${esc(u)}" target="_blank" rel="noopener"><img src="${esc(u)}" alt="Foto"></a>`:'🖼️ Foto')):'';
    return `<div class="msj ${m.autor_id===me?'mio':''}">${adj}${m.texto?`<div>${esc(m.texto)}</div>`:''}<small class="msj-h">${fh(m.created_at)}${m.autor_id===me?(m.leido?' · ✓✓ Visto':' · ✓ Enviado'):''}</small></div>`}).join('')||'<div class="vacio" style="margin:auto;border:0">Escribe el primer mensaje 👋</div>';
}
function bajarChat(){const h=$('#hilochat');if(h)h.scrollTop=h.scrollHeight}
function pintarBadgeChat(){document.querySelectorAll('.side [data-sub="mensajes"]').forEach(b=>{let x=b.querySelector('.badge');if(S.noLeidos){if(!x){x=document.createElement('span');x.className='badge';b.appendChild(x)}x.textContent=S.noLeidos}else if(x)x.remove()})}
async function enviarChat(archivo){
  const t=$('#chattxt'),txt=t?t.value.trim():'';if(!txt&&!archivo)return;
  const me=S.sesion.user.id,cid=S.chat;const btn=document.querySelector('[data-chatenviar]');if(btn)btn.disabled=true;
  try{let ruta=null,tipo=null;
    if(archivo){const vid=archivo.type.startsWith('video/');tipo=vid?'video':'imagen';toast(vid?'Subiendo video…':'Subiendo foto…');
      const f=vid?archivo:await reducirImagen(archivo,1600);const ext=vid?(archivo.name.split('.').pop()||'mp4').toLowerCase().replace(/[^a-z0-9]/g,''):'jpg';
      ruta=`${cid}/${Date.now()}-${Math.random().toString(36).slice(2,7)}.${ext}`;const up=await sb.storage.from('chat').upload(ruta,f,{contentType:f.type});if(up.error)throw up.error}
    const {error}=await sb.from('mensajes').insert({conversacion_id:cid,autor_id:me,texto:archivo?null:txt,archivo:ruta,archivo_tipo:tipo});if(error)throw error;
    if(t&&!archivo)t.value='';
    const h=$('#hilochat');if(h){h.innerHTML=await hiloChat(cid);bajarChat()}
  }catch(x){err(x,'No se pudo enviar')}finally{if(btn)btn.disabled=false}
}
/* revisa mensajes nuevos cada 8 segundos mientras el chat está abierto, sin borrar lo que escribes */
setInterval(async()=>{if(document.hidden||!S.sesion||S.sub!=='mensajes'||!['panel','micuenta'].includes(S.view))return;
  if(S.chat){const {count}=await sb.from('mensajes').select('*',{count:'exact',head:true}).eq('conversacion_id',S.chat);if(count!==S.chatN){const h=$('#hilochat');if(h){h.innerHTML=await hiloChat(S.chat);bajarChat()}}}
},8000);
function vSeguridad(){
  const correo=S.sesion?S.sesion.user.email:'';
  return `<div class="caja"><b>🔐 Correo y contraseña</b><p style="font-size:13.5px;color:var(--gris);margin:4px 0 12px">Para cambiar la contraseña te enviamos un código a tu correo. No necesitas la contraseña actual.</p>
    <div class="form-g"><div class="f"><label>Nueva contraseña</label><input class="campo" id="seg-n" type="password" placeholder="Mínimo 8 caracteres"></div><div class="f"><label>Repite la nueva contraseña</label><input class="campo" id="seg-r" type="password"></div>
    <div class="f full"><label>Código de verificación</label><div style="display:flex;gap:6px"><input class="campo" id="seg-k" placeholder="Código del correo" style="max-width:200px"><button class="btn btn-o btn-s" data-segcod>Enviar código a mi correo</button></div><small>Te llega a <b>${esc(correo)}</b>. Revisa también la carpeta de spam.</small></div></div>
    <div style="text-align:right;margin-top:10px"><button class="btn btn-p btn-s" data-segclave>Cambiar contraseña</button></div>
    <hr style="border:none;border-top:1px dashed var(--linea);margin:18px 0">
    <div class="f"><label>Cambiar correo</label><div style="display:flex;gap:6px"><input class="campo" id="seg-c" type="email" placeholder="correo nuevo"><button class="btn btn-o btn-s" data-segcorreo>Cambiar correo</button></div><small>Te enviaremos un enlace a los dos correos para confirmar el cambio.</small></div></div>`;
}

/* --- Mi cuenta (comprador) --- */
async function vMiCuenta(){
  if(!S.sesion) return vCrear();
  const t=['seguridad','favs','datos','soporte','mensajes'].includes(S.sub)?S.sub:'favs';
  let body='';
  if(t==='favs'){const {data}=await sb.from('favoritos').select('publicacion_id, publicaciones('+SELECT_PUB+')').order('created_at',{ascending:false});const l=(data||[]).map(x=>x.publicaciones).filter(Boolean);body=l.length?`<div class="grid">${l.map(tarjeta).join('')}</div>`:'<div class="vacio">Toca “♡ Guardar” en un animal para verlo aquí.</div>'}
  if(t==='datos'){const p=S.perfil||{};body=cajaFoto(p.foto,'foto')+`<div class="caja form-g"><div class="f"><label>Nombre</label><input class="campo" id="md-n" value="${esc(p.nombre)}"></div><div class="f"><label>Celular</label><input class="campo" id="md-w" value="${esc(p.whatsapp)}"></div><div class="f"><label>Departamento</label><select class="campo" id="md-d">${DEPTOS.map(d=>`<option ${p.departamento===d?'selected':''}>${d}</option>`).join('')}</select></div><div class="full" style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><button class="btn btn-o btn-s" data-go="planes">🐾 Quiero vender o dar en adopción</button><button class="btn btn-p btn-s" data-guardardatos>Guardar</button></div></div>`}
  if(t==='seguridad') body=vSeguridad();
  if(t==='soporte') body=await vSoporteUsuario();
  if(t==='mensajes') body=await vMensajes();
  const tabs=[['mensajes','💬','Mensajes',S.noLeidos||''],['favs','♡','Favoritos'],['datos','👤','Mis datos'],['soporte','🛟','Ayuda y soporte'],['seguridad','🔐','Correo y contraseña']];
  return `<div class="wrap"><div class="dash"><aside class="side"><div class="quien quien-av"><div class="av av-s">${S.perfil&&S.perfil.foto?`<img src="${esc(fotoUrl(S.perfil.foto))}" alt="">`:'👤'}</div><div><b>${esc((S.perfil||{}).nombre||'Mi cuenta')}</b><small>Cuenta gratis</small></div></div>${menuLateral(tabs,t)}<button data-salir><span class="ic">🚪</span><span class="tx">Cerrar sesión</span></button></aside><div>${t==='soporte'||t==='mensajes'?'':`<div class="h-dash"><h2>${tabs.find(x=>x[0]===t)[2]}</h2></div>`}${body}</div></div></div>`;
}

/* =====================================================================
   REGISTRO DE VENDEDORES Y FUNDACIONES
   ===================================================================== */
async function vRegistro(){
  if(S.yo) return vPanel();
  const R=S.reg, pl=planDe(R.plan), ado=pl.adopcion, fu=R.plan==='fundacion', oc=pl.pago_unico, valor=R.anual?pl.precio*10:pl.precio;
  const up=(k,t)=>cajaArchivo(k,t,k==='fotos');
  let cuerpo='';
  if(R.paso===1) cuerpo=`<h2 class="serif" style="color:var(--verde)">¿Qué plan quieres?</h2><p style="color:var(--gris);margin-bottom:14px">Elige el que más se parece a ti.</p>
    <div style="display:flex;flex-direction:column;gap:10px">${PLANES.map(x=>`<button class="crc" style="border-width:2px;${R.plan===x.id?'border-color:var(--terra);background:#FDF3EE':''}" data-regplan="${x.id}"><div class="av">${x.emoji}</div><div style="flex:1"><b>Plan ${esc(x.nombre)}</b></div><b>${esGratis(x)?'Gratis':cop(R.anual&&R.plan===x.id?x.precio*10:x.precio)}<small style="display:block;text-align:right">${R.anual&&R.plan===x.id?'/ año':unidadPlan(x)}</small>${TIENE_ANUAL.includes(x.id)?`<small style="display:block;text-align:right;color:var(--ok)">o anual ${cop(x.precio*10)}</small>`:''}</b></button>`).join('')}</div>
    ${['criadero','hacienda'].includes(R.plan)?`<div class="panel" style="margin-top:14px;background:var(--crema)"><b>¿Cómo quieres pagar?</b><div class="opc-plan" style="grid-template-columns:1fr 1fr;margin-top:10px"><button class="${!R.anual?'on':''}" data-reganual="0"><b>Mensual</b>${cop(pl.precio)} cada mes</button><button class="${R.anual?'on':''}" data-reganual="1"><b>Anual · 2 meses gratis</b>${cop(pl.precio*10)} por 12 meses</button></div></div>`:''}`;
  if(R.paso===3) cuerpo=`<h2 class="serif" style="color:var(--verde)">${fu?'Datos de la fundación':oc?'Tus datos públicos':'Datos del criadero'}</h2><p style="color:var(--gris);margin-bottom:16px">Así te verán los compradores.</p>
    <div class="form-g"><div class="f full"><label>${fu?'Nombre de la fundación':oc?'Nombre que verán los compradores':'Nombre del criadero o hacienda'}</label><input class="campo" id="r-nom" value="${esc(R.nom||'')}"></div>
      <div class="f"><label>Departamento</label><select class="campo" id="r-dep">${DEPTOS.map(d=>`<option ${R.dep===d?'selected':''}>${d}</option>`).join('')}</select></div><div class="f"><label>Municipio</label><input class="campo" id="r-mun" value="${esc(R.mun||'')}"></div>
      <div class="f"><label>WhatsApp público</label><input class="campo" id="r-wa" value="${esc(R.wa||(S.perfil||{}).whatsapp||'')}"></div>${oc?'':`<div class="f"><label>Instagram (opcional)</label><input class="campo" id="r-ig" value="${esc(R.ig||'')}"></div><div class="f"><label>${fu?'Años rescatando':'Años de experiencia'}</label><input class="campo" id="r-an" type="number" value="${esc(R.an||'')}"></div>`}
      <div class="f full"><label>${ado?'¿Qué especies das en adopción?':'¿Qué especies vendes?'}</label><div class="chips">${CATS.filter(c=>c.activa&&!['no_habilitada','prohibida'].includes(c.estado_legal)).map(c=>`<button class="chip ${R.esp.includes(c.id)?'on':''}" data-regesp="${c.id}">${c.emoji} ${esc(c.nombre)}</button>`).join('')}</div>${R.plan==='criadero'?'<small>El plan Criadero incluye hasta 3 especies.</small>':''}</div>
      <div class="f full"><label>Descripción</label><textarea class="campo" id="r-desc" rows="3">${esc(R.desc||'')}</textarea></div>
      ${S.sesion?`<div class="f full aviso" style="margin:4px 0 0">👤 Tu solicitud queda en tu cuenta <b>${esc(S.sesion.user.email)}</b>.</div>`:`<div class="f full" style="border-top:1px dashed var(--linea);padding-top:12px;margin-top:4px"><b>Datos para entrar a tu cuenta</b><small style="display:block">Con este correo y contraseña entras a tu panel de vendedor.</small></div>
      <div class="f"><label>${fu?'Representante legal':'Tu nombre completo'}</label><input class="campo" id="r-resp" value="${esc(R.resp||'')}"></div>
      <div class="f"><label>Correo</label><input class="campo" id="r-cor" type="email" placeholder="tucorreo@gmail.com" value="${esc(R.cor||'')}"></div>
      <div class="f"><label>Contraseña</label><input class="campo" id="r-pas" type="password" placeholder="Mínimo 8 caracteres" value="${esc(R.pas||'')}"></div>
      <div class="f"><label>Repite la contraseña</label><input class="campo" id="r-pas2" type="password" value="${esc(R.pas2||'')}"></div>
      <label class="full chk"><input type="checkbox" id="r-18" ${R.m18?'checked':''}> Soy mayor de 18 años</label>
      <p class="full" style="font-size:13.5px;margin:0">¿Ya tienes cuenta en La Cría? <button class="link" data-login>Inicia sesión</button> y continúa aquí mismo.</p>`}</div>`;
  if(R.paso===4){const prod=R.esp.some(x=>PRODUCCION.includes(x));
    cuerpo=`<h2 class="serif" style="color:var(--verde)">Documentos de verificación</h2><p style="color:var(--gris);margin-bottom:16px">Solo los ve el equipo de La Cría. Nunca se publican.</p>
    <div class="form-g"><div class="f"><label>Tipo de documento</label><select class="campo" id="r-td">${['Cédula de ciudadanía','Cédula de extranjería','NIT'].map(x=>`<option ${R.td===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="f"><label>Número</label><input class="campo" id="r-nd" value="${esc(R.nd||'')}"></div>
      <div class="f full"><label>Dirección de notificaciones</label><input class="campo" id="r-dir" value="${esc(R.dir||'')}"><small>No se publica. La ley pide tenerla registrada.</small></div>
      ${up('cedula','Foto de la cédula (ambas caras)')}${oc?up('selfie','Selfie con tu cédula'):up('rut',fu?'Certificado de existencia (ESAL) o Cámara de Comercio':'Cámara de Comercio o RUT')}
      ${fu?up('rutf','RUT de la fundación'):''}${!oc?up('fotos','Fotos del criadero, finca o refugio'):''}${prod?up('ica','Registro sanitario de predio pecuario (ICA)'):''}</div>
    <label class="chk" style="margin-top:14px"><input type="checkbox" id="r-decl" ${R.decl?'checked':''}> <span><b>Declaro que la información y los documentos son verdaderos</b>, que soy el único responsable de los animales que publico, y autorizo su inclusión en el registro de oferentes del artículo 53 de la Ley 1480 de 2011. Acepto los <a class="lk" data-legal="terminos">Términos</a>, las <a class="lk" data-legal="reglas">Reglas de publicación</a> y las <a class="lk" data-legal="${ado?'fundaciones':'vendedores'}">${ado?'Condiciones de adopción':'Condiciones para vendedores'}</a>.</span></label>`;}
  if(R.paso===2) cuerpo=`<h2 class="serif" style="color:var(--verde)">Paga tu plan ${esc(pl.nombre)}</h2><p style="color:var(--gris);margin-bottom:16px">Primero paga tu plan por Bre-B y sube el pantallazo. Después llenas tus datos y documentos.</p>
    ${bloquePago(cop(valor),R.anual?'un solo pago por 12 meses':pl.id==='ocasional'?'un solo pago · 60 días':pl.pago_unico?'la publicación dura 60 días':'mensual','comp')}
    <p style="font-size:13px;color:var(--gris);margin-top:12px">🔒 Tu pago queda guardado con tu solicitud. Revisamos el pago y tus documentos juntos en máximo ${esc(CONFIG.horas_activacion||24)} horas.</p>`;
  return `<div class="wrap"><div class="reg"><div class="progreso">${[1,2,3,4].map(i=>`<div class="${i<=R.paso?'on':''}"></div>`).join('')}</div><small style="color:var(--gris);font-weight:700">${esGratis(pl)?`PASO ${[0,1,1,2,3][R.paso]} DE 3`:`PASO ${R.paso} DE 4`} · ${['','Tu plan','Pago','Tus datos','Documentos'][R.paso]}</small>${cuerpo}
    <div class="pie-form">${R.paso>1?'<button class="btn btn-o" data-regpaso="-1">← Atrás</button>':'<span></span>'}<button class="btn btn-p" data-regpaso="1" id="regsig">${R.paso===4?'Enviar solicitud':R.paso===1?(esGratis(pl)?'Continuar →':'Continuar al pago →'):R.paso===2?'Ya pagué, continuar →':'Continuar →'}</button></div></div></div>`;
}
const ARCH_MAX={fotos:6};
function listaArch(k){const v=S.reg.arch[k];return !v?[]:Array.isArray(v)?v:[v]}
function filaArch(f,quitar){const img=f.type&&f.type.startsWith('image/');return `<div class="arch"><div class="arch-mini">${img?`<img src="${URL.createObjectURL(f)}" alt="">`:'<span>📄</span>'}</div><div class="arch-info"><b>${esc(f.name)}</b><small>${pesoTxt(f.size)}</small></div><button type="button" class="arch-x" ${quitar} aria-label="Quitar">✕</button></div>`}
function cajaArchivo(k,texto,multi){
  const l=listaArch(k), max=multi?(ARCH_MAX[k]||6):1;
  return `<div class="subir-w full">${l.length?`<small class="arch-tit">✓ ${esc(texto)}</small><div class="arch-lista">${l.map((f,i)=>filaArch(f,`data-quitararch="${k}" data-i="${i}"`)).join('')}</div>`:''}
    ${l.length<max?`<label class="subir ${l.length?'ok':''}" style="display:block;cursor:pointer"><input type="file" hidden data-arch="${k}" accept="image/*,application/pdf" ${multi?'multiple':''}>${l.length?(multi?'➕ Agregar más':'🔁 Cambiar archivo'):'⬆ '+texto}<small style="display:block;font-weight:500;margin-top:2px">${multi?'Fotos':'Foto o PDF'} · máximo 10 MB</small></label>`:''}</div>`;
}
const pesoTxt=b=>b>1048576?(b/1048576).toFixed(1)+' MB':Math.max(1,Math.round(b/1024))+' KB';
function validarArchivo(f,soloImg){const img=f.type.startsWith('image/'),pdf=f.type==='application/pdf';if(!(img||(!soloImg&&pdf)))return f.name+' (formato no permitido)';if(f.size>10*1048576)return f.name+' (pesa '+pesoTxt(f.size)+', máximo 10 MB)';return ''}
function bloquePago(valor,detalle,clave,listo){
  const qr=CONFIG.qr_breb?fotoUrl(CONFIG.qr_breb):'';
  return `<div class="pago-card ${qr?'con-qr':''}">${qr?`<div class="pago-qr" style="width:100%;max-width:380px;margin:0 auto;box-sizing:border-box"><button type="button" class="qr-zoom" data-verqr="${esc(qr)}" aria-label="Ver QR grande" style="width:100%"><img src="${esc(qr)}" alt="Código QR Bre-B de La Cría" style="width:100%;max-width:340px;height:auto;aspect-ratio:1/1;display:block;margin:0 auto"></button><small>Escanéalo con la app de tu banco</small><a class="link" style="font-size:13px" href="${esc(qr)}" target="_blank" rel="noopener" download="qr-pagos-la-cria.png">⬇ Descargar QR</a><small style="font-size:11.5px">¿Pagas desde este mismo celular? Descárgalo y en tu banco elige “pagar con QR desde la galería”.</small></div>`:''}
    <div class="pago-datos"><div class="pago-fila"><small>Llave Bre-B</small><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><b class="pago-llave">${esc(CONFIG.llave_breb||'')}</b><button class="btn btn-o btn-s" data-copiarllave>Copiar</button></div></div>
      <div class="pago-fila"><small>A nombre de</small><b>${esc(CONFIG.titular_breb||'La Cría')}</b></div>
      <div class="pago-fila"><small>Valor a pagar</small><b class="pago-valor">${valor}</b>${detalle?`<span style="font-size:13px;color:var(--gris)">${detalle}</span>`:''}</div></div></div>
    <ol class="pago-pasos"><li>Abre la app de tu banco y entra a <b>Bre-B</b> (o “Transferir con llave”).</li><li>${qr?'Escanea el QR o escribe':'Escribe'} la llave <b>${esc(CONFIG.llave_breb||'')}</b>.</li><li>Paga el valor exacto: <b>${valor}</b>.</li><li>Toma pantallazo del pago y súbelo aquí abajo.</li></ol>
    ${clave==='comp'?cajaArchivo('comp','Subir pantallazo del pago'):`<label class="subir" style="display:block;cursor:pointer">⬆ Subir pantallazo del pago${clave}</label>`}`;
}
function datosCuentaReg(R,g){if(S.sesion)return;Object.assign(R,{resp:g('r-resp'),cor:(g('r-cor')||'').toLowerCase(),pas:$('#r-pas')?$('#r-pas').value:R.pas,pas2:$('#r-pas2')?$('#r-pas2').value:R.pas2});if($('#r-18'))R.m18=$('#r-18').checked}
function guardarPasoReg(){
  const R=S.reg, g=id=>{const el=$('#'+id);return el?el.value.trim():undefined};
  if(R.paso===2&&!R.arch.comp){toast('Sube el pantallazo del pago para continuar');return false}
  if(R.paso===3){Object.assign(R,{nom:g('r-nom'),dep:g('r-dep'),mun:g('r-mun'),wa:g('r-wa'),ig:g('r-ig')??R.ig,an:g('r-an')??R.an,desc:g('r-desc')});
    if(!R.nom||!R.mun||!R.wa){toast('Completa el nombre, el municipio y el WhatsApp');return false}
    if(!R.esp.length){toast('Elige al menos una especie');return false}
    if(R.plan==='criadero'&&R.esp.length>3){toast('El plan Criadero permite hasta 3 especies');return false}
    datosCuentaReg(R,g);
    if(!S.sesion){if(!R.resp||!R.cor||!/^\S+@\S+\.\S+$/.test(R.cor)){toast('Escribe tu nombre y un correo válido');return false}
      if((R.pas||'').length<8){toast('La contraseña debe tener mínimo 8 caracteres');return false}
      if(R.pas!==R.pas2){toast('Las contraseñas no coinciden');return false}
      if(!R.m18){toast('Debes ser mayor de 18 años');return false}}}
  if(R.paso===4){Object.assign(R,{td:g('r-td'),nd:g('r-nd'),dir:g('r-dir')});
    if(!R.nd||!R.dir){toast('Escribe el número de documento y la dirección');return false}
    if(!R.arch.cedula){toast('Sube la foto de tu cédula');return false}
    if(!$('#r-decl').checked){toast('Debes aceptar la declaración');return false}}
  return true;
}
async function enviarRegistro(){
  const R=S.reg, pl=planDe(R.plan);
  const gratis=esGratis(pl);
  if(!gratis&&!R.arch.comp){toast('Sube el comprobante de pago');return}
  const btn=$('#regsig'); btn.disabled=true; btn.textContent='Enviando…';
  S.enviando=true;
  try{
    if(!S.sesion){
      const {data,error}=await sb.auth.signUp({email:R.cor,password:R.pas,options:{data:{nombre:R.resp,whatsapp:R.wa,departamento:R.dep},emailRedirectTo:urlBase()}});
      if(error){S.enviando=false;btn.disabled=false;btn.textContent='Enviar solicitud';
        if(/registered|already/i.test(error.message)){S.despues='registro';modalLogin('Ese correo ya tiene cuenta en La Cría. Entra con tu contraseña y luego toca “Enviar solicitud” otra vez. No pierdes lo que ya llenaste.');return}
        throw error}
      if(!data.session){S.enviando=false;btn.disabled=false;btn.textContent='Enviar solicitud';modal('<h3>Falta un ajuste</h3><p style="margin-top:8px">No pudimos crear tu cuenta en este momento. Escríbenos desde <b>Ayuda</b> y te ayudamos a terminar tu registro.</p>');return}
      S.sesion=data.session;
    }
    const uid=S.sesion.user.id;
    const docs={};
    for(const [k,f] of Object.entries(R.arch)){ if(k==='comp') continue; if(Array.isArray(f)){docs[k]=[];for(const x of f)docs[k].push(await subir('documentos',uid,x))} else docs[k]=await subir('documentos',uid,f); }
    const comp=gratis?null:await subir('comprobantes',uid,Array.isArray(R.arch.comp)?R.arch.comp[0]:R.arch.comp);
    let r=await sb.from('vendedores').insert({id:uid,nombre_publico:R.nom,plan:R.plan,pago_anual:!!R.anual,departamento:R.dep,municipio:R.mun,whatsapp:R.wa,instagram:R.ig||null,anios:R.an?Number(R.an):null,especies:R.esp,descripcion:R.desc});
    if(r.error) throw r.error;
    r=await sb.from('vendedores_privado').upsert({id:uid,tipo_documento:R.td,numero_documento:R.nd,direccion_notificaciones:R.dir,telefono:R.wa,documentos:docs}); if(r.error) throw r.error;
    if(!gratis) r=await sb.from('pagos').insert({vendedor_id:uid,plan:R.plan,pago_anual:!!R.anual,valor:R.anual?pl.precio*10:pl.precio,comprobante:comp}); if(r.error) throw r.error;
    await sb.from('aceptaciones').insert({usuario_id:uid,tipo:pl.adopcion?'Adopción':'Vendedor',documentos:'Términos · Datos · Reglas · '+(pl.adopcion?'Condiciones de adopción':'Condiciones para vendedores')+' · Declaración art. 53'});
    if(R.pas)await sb.from('aceptaciones').insert({usuario_id:uid,tipo:'Cuenta',documentos:'Términos · Datos personales · Aviso de privacidad · Mayor de 18'});
    S.reg={paso:1,plan:'criadero',anual:false,esp:[],arch:{}};S.enviando=false;
    await cargarSesion(); S.sub='resumen'; go('panel');
    modal(`<div style="text-align:center"><div style="font-size:60px">🎉</div><h3>¡Solicitud enviada!</h3><p style="color:var(--gris);margin-top:8px">Revisaremos tus documentos y el pago en máximo ${esc(CONFIG.horas_activacion||24)} horas. Cuando tu cuenta esté activa podrás publicar.</p></div>`);
  }catch(e){S.enviando=false;err(e,'No se pudo enviar la solicitud');const b2=$('#regsig');if(b2){b2.disabled=false;b2.textContent='Enviar solicitud'}}
}

/* =====================================================================
   PANEL DEL VENDEDOR / FUNDACIÓN
   ===================================================================== */
function menuLateral(tabs,t){return tabs.map(([k,i,n,b])=>k==='§'?`<div class="side-sec">${i}</div>`:`<button class="${t===k?'on':''}" data-sub="${k}"><span class="ic">${i}</span><span class="tx">${n}</span>${b?`<span class="badge">${b}</span>`:''}</button>`).join('')}
async function vPanel(){
  if(!S.sesion) return vCrear(); if(esAdmin()&&!S.yo) return vAdmin(); if(!S.yo) return vRegistro();
  const v=S.yo, pl=planDe(v.plan), adop=pl.adopcion, gratis=esGratis(pl);
  const {data:pubs}=await sb.from('publicaciones').select('*').eq('vendedor_id',v.id).order('created_at',{ascending:false});
  const activas=(pubs||[]).filter(p=>['activo','revision'].includes(p.estado));
  const lim=v.oficial?9999:(pl.max_publicaciones??9999), limDest=v.oficial?10:(pl.max_destacados||0);
  const tabs=[['resumen','🏠','Inicio'],['§','Mis animales'],['pubs',adop?'💜':'🐾',adop?'En adopción':'Publicaciones'],['nueva','➕','Publicar'],['mensajes','💬','Mensajes',S.noLeidos||''],['§','Mi cuenta'],['perfil','🏡','Mi perfil'],['plan','💳','Mi plan'],['soporte','🛟','Ayuda y soporte'],['seguridad','🔐','Correo y contraseña']];
  const t=tabs.some(x=>x[0]===S.sub)?S.sub:'resumen'; let body='';
  const est={pendiente:['En revisión','e-pend'],activo:['Activa','e-ok'],vencido:['Plan vencido','e-pend'],sancionado:['Suspendida','e-mal'],bloqueado:['Bloqueada','e-mal'],rechazado:['Rechazada','e-mal']}[v.estado]||['—','e-gris'];
  if(v.estado!=='activo'&&!['plan','seguridad','perfil','soporte'].includes(t)){
    body=`<div class="h-dash"><h2>Hola, ${esc(v.nombre_publico)}</h2></div><div class="caja" style="text-align:center;padding:40px"><div style="font-size:52px">${v.estado==='pendiente'?'⏳':'⚠️'}</div><h3 class="serif" style="color:var(--verde);font-size:26px;margin:8px 0">Tu cuenta está: <span class="estado ${est[1]}">${est[0]}</span></h3>
      <p style="color:var(--gris);max-width:480px;margin:0 auto">${v.estado==='pendiente'?`Estamos revisando tus documentos${gratis?'':' y tu pago'}. Te avisamos en máximo ${esc(CONFIG.horas_activacion||24)} horas.`:v.estado==='vencido'?(gratis?'Tus 30 días gratis terminaron y tu publicación está oculta. Elige un plan para seguir publicando.':'Tu plan venció y tus publicaciones están ocultas. Renueva tu plan para volver a mostrarlas.'):v.estado==='rechazado'?('Tu solicitud no fue aprobada.'+(v.motivo_verificacion?' <b>Motivo:</b> '+esc(v.motivo_verificacion):'')+' Corrige lo indicado y escríbenos desde Ayuda y soporte.'):'Tu cuenta tiene una restricción. Escríbenos desde Ayuda.'}</p>
      ${v.estado==='vencido'?`<button class="btn btn-p" style="margin-top:14px" data-sub="plan">${gratis?'Elegir un plan':'Renovar plan'}</button>`:''}</div>`;
  } else if(t==='resumen'&&gratis) body=`<div class="h-dash"><h2>Hola, ${esc(v.nombre_publico)} 👋</h2></div>
      ${v.verificacion!=='verificado'?cajaVerificacion(v):''}<div class="caja"><b>🌱 Plan Gratis</b><p style="color:var(--gris);margin:4px 0 12px">Tienes ${activas.length} de 1 publicación activa. Tu plan gratis vence el ${fechaCO(v.vence)}. Los compradores te contactan por el WhatsApp que pusiste en <button class="link" data-sub="perfil">Mi perfil</button>.</p>${activas.length?'<button class="btn btn-o btn-s" data-sub="pubs">Ver mi publicación</button>':'<button class="btn btn-p" data-sub="nueva">➕ Publicar mi animal</button>'}</div>
      <div class="caja" style="background:var(--crema)"><b>¿Quieres más?</b><p style="color:var(--gris);font-size:14.5px;margin:4px 0 12px">Con un plan pago publicas más animales, destacas tus publicaciones y tienes perfil completo con redes.</p><button class="btn btn-p btn-s" data-sub="plan">Ver planes</button></div>`;
  else if(t==='resumen') body=`<div class="h-dash"><h2>Hola, ${esc(v.nombre_publico)} 👋</h2><button class="btn btn-p btn-s" data-sub="nueva">➕ Publicar</button></div>
      ${v.verificacion!=='verificado'?cajaVerificacion(v):''}<div class="kpis"><div class="kpi"><small>Publicaciones activas</small><b>${activas.length}</b><span style="color:var(--gris)">${lim>999?'Ilimitadas':'de '+lim}</span></div><div class="kpi"><small>En revisión</small><b>${(pubs||[]).filter(p=>p.estado==='revision').length}</b></div><div class="kpi"><small>Destacados</small><b>${(pubs||[]).filter(p=>p.destacado).length}/${limDest}</b></div><div class="kpi"><small>Plan</small><b style="font-size:20px">${esc(pl.nombre)}</b><span style="color:var(--gris)">vence ${fechaCO(v.vence)}</span></div></div>
      <div class="aviso">💡 Los mensajes, la agenda de visitas y las estadísticas llegan en la próxima actualización de La Cría. Mientras tanto, los compradores te escriben por WhatsApp.</div>`;
  else if(t==='pubs') body=`<div class="h-dash"><h2>${adop?'Animales en adopción':'Mis publicaciones'}</h2><button class="btn btn-p btn-s" data-sub="nueva">➕ Nueva</button></div>
      ${(pubs||[]).length?`<table class="tabla"><tr><th>Animal</th><th>Precio</th><th>Estado</th><th>Acciones</th></tr>${pubs.map(p=>{const e={activo:['Disponible','e-ok'],revision:['En revisión','e-pend'],vendido:['Vendido','e-gris'],adoptado:['Adoptado','e-ok'],pausado:['Pausado','e-gris'],rechazado:['Rechazado','e-mal'],vencido:['Vencido','e-gris']}[p.estado]||['—','e-gris'];return `<tr><td><b>${catDe(p.categoria_id).emoji} ${esc(p.titulo)}</b><br><small style="color:var(--gris)">${esc(p.raza||'')}</small></td><td>${precioTxt(p)}</td><td><span class="estado ${e[1]}">${e[0]}</span></td>
        <td class="acciones">${limDest&&p.estado==='activo'?`<button class="btn btn-o btn-s" data-destacar="${p.id}" data-val="${p.destacado?0:1}">${p.destacado?'★ Quitar destacado':'☆ Destacar'}</button>`:''}${['activo','pausado'].includes(p.estado)?`<button class="btn btn-o btn-s" data-pubest="${p.id}" data-val="${adop?'adoptado':'vendido'}">${adop?'Marcar adoptado':'Marcar vendido'}</button>`:''}${['vendido','adoptado'].includes(p.estado)?`<button class="btn btn-o btn-s" data-pubest="${p.id}" data-val="activo">Reactivar</button>`:''}<button class="btn btn-o btn-s" data-pubeditar="${p.id}">✏️ Editar</button>${p.estado==='activo'?`<button class="btn btn-o btn-s" data-animal="${p.id}">Ver</button>`:''}<button class="btn btn-o btn-s" style="color:var(--mal)" data-pubdel="${p.id}">Eliminar</button></td></tr>`}).join('')}</table>`:'<div class="vacio">Aún no tienes publicaciones. ¡Publica tu primer animal!</div>'}`;
  else if(t==='nueva') body = !S.pub.edit && activas.length>=lim ? `<div class="h-dash"><h2>Publicar</h2></div><div class="caja"><h3 class="serif" style="color:var(--verde)">Llegaste al límite de tu plan</h3><p style="margin:8px 0 14px">Tu plan ${esc(pl.nombre)} permite ${lim} ${lim===1?'publicación activa':'publicaciones activas'}. ${porPub(pl)?'Para publicar otra, paga una nueva publicación desde “Mi plan”.':'Marca como vendidas las que ya no estén disponibles o cambia de plan.'}</p><button class="btn btn-p" data-sub="plan">Ir a Mi plan</button></div>` : vPublicar(v,pl);
  else if(t==='perfil') body=`<div class="h-dash"><h2>Mi perfil</h2><button class="btn btn-o btn-s" data-vend="${v.id}">Ver como comprador</button></div>${cajaVerificacion(v)}${cajaFoto(v.logo,'logo')}<div class="caja form-g">
      <div class="f full"><label>Nombre público</label><input class="campo" id="pf-n" value="${esc(v.nombre_publico)}"></div><div class="f"><label>WhatsApp</label><input class="campo" id="pf-w" value="${esc(v.whatsapp)}"></div>${gratis?'':`<div class="f"><label>Instagram</label><input class="campo" id="pf-i" placeholder="@tucriadero" value="${esc(v.instagram)}"></div><div class="f full"><label>Página web (opcional)</label><input class="campo" id="pf-web" placeholder="www.tucriadero.com" value="${esc(v.web)}"></div>`}
      <div class="f"><label>Departamento</label><select class="campo" id="pf-d">${DEPTOS.map(d=>`<option ${v.departamento===d?'selected':''}>${d}</option>`).join('')}</select></div><div class="f"><label>Municipio</label><input class="campo" id="pf-m" value="${esc(v.municipio)}"></div>
      ${gratis?'':`<div class="f full"><label>Envíos o entrega</label><input class="campo" id="pf-e" value="${esc(v.envios)}"></div>`}${v.plan==='fundacion'?`<div class="f full"><label>Llave Bre-B para donaciones</label><input class="campo" id="pf-don" value="${esc(v.llave_donaciones)}"></div>`:''}
      <div class="f full"><label>Descripción</label><textarea class="campo" id="pf-desc" rows="4">${esc(v.descripcion)}</textarea></div><div class="full" style="text-align:right"><button class="btn btn-p" data-guardarperfil>Guardar cambios</button></div></div>`;
  else if(t==='plan'){const {data:pagos}=await sb.from('pagos').select('*').eq('vendedor_id',v.id).order('created_at',{ascending:false}).limit(10);
    body=`<div class="h-dash"><h2>Mi plan</h2></div><div class="caja"><small style="color:var(--gris);font-weight:700">PLAN ACTUAL</small><h3 class="serif" style="font-size:28px;color:var(--verde)">${pl.emoji} ${esc(pl.nombre)}${v.pago_anual?' (anual)':''}</h3><span class="estado ${est[1]}">${est[0]}</span> <small style="color:var(--gris)">Vence: ${fechaCO(v.vence)}</small>${v.oficial?'<div class="aviso">★ Tienda oficial de La Cría: sin costo y sin límite.</div>':''}</div>
      ${gratis?cajaMejorar():v.oficial?'':`<div class="caja"><b>${porPub(pl)?'Pagar una nueva publicación':'Renovar mi plan'}</b><p style="color:var(--gris);font-size:14.5px;margin:4px 0 14px">Lo activamos en máximo ${esc(CONFIG.horas_activacion||24)} horas después de subir el pantallazo.</p>${bloquePago(cop(v.pago_anual?pl.precio*10:pl.precio),pl.id==='ocasional'?'por 60 días más':pl.pago_unico?'la publicación dura 60 días':v.pago_anual?'por 12 meses más':'por 1 mes más','<input type="file" hidden data-renovar accept="image/*,application/pdf">')}</div>`}
      ${(pagos||[]).length?`<table class="tabla"><tr><th>Fecha</th><th>Valor</th><th>Estado</th></tr>${pagos.map(x=>`<tr><td>${fechaCO(x.created_at.slice(0,10))}</td><td>${cop(x.valor)}</td><td><span class="estado ${x.estado==='confirmado'?'e-ok':x.estado==='rechazado'?'e-mal':'e-pend'}">${x.estado==='confirmado'?'Confirmado':x.estado==='rechazado'?'Rechazado':'Por confirmar'}</span></td></tr>`).join('')}</table>`:''}`;}
  else if(t==='seguridad') body='<div class="h-dash"><h2>Correo y contraseña</h2></div>'+vSeguridad();
  else if(t==='soporte') body=await vSoporteUsuario();
  else if(t==='mensajes') body=await vMensajes();
  return `<div class="wrap"><div class="dash"><aside class="side"><div class="quien quien-av"><div class="av av-s">${avatar(v)}</div><div><b>${esc(v.nombre_publico)}</b><small>${esc(pl.nombre)}${v.oficial?' · Oficial':''}</small></div></div>${menuLateral(tabs,t)}<button data-vend="${v.id}"><span class="ic">👁</span><span class="tx">Ver mi perfil público</span></button><button data-salir><span class="ic">🚪</span><span class="tx">Cerrar sesión</span></button></aside><div>${body}</div></div></div>`;
}
function cajaMejorar(){
  const op=PLANES.filter(p=>!esGratis(p)&&!p.adopcion), C=S.cambio=S.cambio&&op.some(p=>p.id===S.cambio.plan)?S.cambio:{plan:'criadero',anual:false}, p=planDe(C.plan), val=C.anual?p.precio*10:p.precio;
  return `<div class="caja"><b>⬆ Pasar a un plan pago</b><p style="color:var(--gris);font-size:14.5px;margin:4px 0 12px">Escoge el plan, paga y sube el pantallazo. Cuando confirmemos el pago, tu cuenta cambia de plan.</p>
    <div class="chips" style="margin-bottom:10px">${op.map(x=>`<button class="chip ${C.plan===x.id?'on':''}" data-mejorar="${x.id}">${x.emoji} ${esc(x.nombre)} · ${cop(x.precio)}${x.pago_unico?(x.id==='ocasional'?' · 60 días':''):'/mes'}</button>`).join('')}</div>
    ${['criadero','hacienda'].includes(C.plan)?`<div class="chips" style="margin-bottom:12px"><button class="chip ${!C.anual?'on':''}" data-mejoraranual="0">Mensual</button><button class="chip ${C.anual?'on':''}" data-mejoraranual="1">Anual · 2 meses gratis</button></div>`:''}
    ${bloquePago(cop(val),C.anual?'un solo pago por 12 meses':p.pago_unico?'la publicación dura 60 días':'mensual','<input type="file" hidden data-renovar accept="image/*,application/pdf">')}</div>`;
}
function prevFotos(){const P=S.pub,L=[...(P.fotosEx||[]).map(r=>({url:fotoUrl(r)})),...P.fotos.map(f=>({url:URL.createObjectURL(f)}))];
  return L.map((f,i)=>`<div class="pf"><img src="${esc(f.url)}" alt="">${i===0?'<span class="pf-p">Principal</span>':''}<button type="button" class="arch-x" data-quitarfoto="${i}" aria-label="Quitar foto">✕</button></div>`).join('')}
/* guarda lo que la persona ya escribió, para no perderlo cuando la pantalla se vuelve a dibujar */
function guardarFormPub(){const f=$('#fpub');if(!f)return;const P=S.pub,V=P.vals={},fd=new FormData(f);
  ['t','sexo','cant','precio','unidad','desc','otra','aptotra'].forEach(k=>{if(f.elements[k])V[k]=f.elements[k].value});
  V.props=fd.getAll('prop');V.apt=fd.getAll('apt');V.docs=fd.getAll('docs');V.at={};f.querySelectorAll('[data-k]').forEach(i=>V.at[i.dataset.k]=i.value);
  ['padre','madre'].forEach(q=>['nombre','raza','color','registro'].forEach(k=>{const el=f.elements[q+'_'+k];if(el)P.padres[q][k]=el.value}))}
function cajaPadre(q){const d=S.pub.padres[q]||{},img=d.foto?URL.createObjectURL(d.foto):d.fotoEx?fotoUrl(d.fotoEx):'',t=q==='padre'?'Padre':'Madre';
  return `<div class="padre-card"><div class="padre-tit">${q==='padre'?'♂':'♀'} ${t}</div>
    <div class="padre-foto">${img?`<img src="${esc(img)}" alt="${t}"><button type="button" class="arch-x" data-quitarpadre="${q}" aria-label="Quitar foto">✕</button>`:`<label class="padre-subir">📷<span>Subir foto del ${q==='padre'?'padre':'de la madre'}</span><input type="file" hidden accept="image/*" data-fotopadre="${q}"></label>`}</div>
    ${img?`<label class="link" style="font-size:13px;cursor:pointer">🔁 Cambiar foto<input type="file" hidden accept="image/*" data-fotopadre="${q}"></label>`:''}
    <input class="campo" name="${q}_nombre" placeholder="Nombre (opcional)" value="${esc(d.nombre||'')}">
    <input class="campo" name="${q}_raza" placeholder="Raza (opcional)" value="${esc(d.raza||'')}">
    <input class="campo" name="${q}_color" placeholder="Color o variedad (opcional)" value="${esc(d.color||'')}">
    <input class="campo" name="${q}_registro" placeholder="Registro genealógico (opcional)" value="${esc(d.registro||'')}"></div>`}
function vPublicar(v,pl){
  const permit=(v.plan==='criadero'&&!v.oficial&&(v.especies||[]).length)?v.especies:null, adop=pl.adopcion;
  if(!S.pub.edit&&permit&&!permit.includes(S.pub.cat)) S.pub={...S.pub,cat:permit[0],raza:'',tipo:(catDe(permit[0]).tipos||['ind'])[0]};
  const P=S.pub, V=P.vals||{}, cat=catDe(P.cat), tipos=cat.tipos&&cat.tipos.length?cat.tipos:['ind'], ed=!!P.edit;
  if(!tipos.includes(P.tipo)) P.tipo=tipos[0];
  const apts=APTITUDES[cat.id]||[], aptSel=V.apt||[], aptCustom=aptSel.filter(x=>x!=='__otra'&&!apts.includes(x));
  const props=V.props||[], docs=V.docs||[], at=V.at||{};
  const paso=(n,t,h,sub)=>`<div class="paso-pub"><div class="num">${n}</div><div style="flex:1"><label class="lbl">${t}</label>${sub?`<small style="display:block;margin:-4px 0 8px;color:var(--gris)">${sub}</small>`:''}${h}</div></div>`;
  const sel=(v1,v2)=>v1===v2?'selected':'';
  return `<div class="h-dash"><h2>${ed?'Editar publicación':'Nueva publicación'}</h2></div><form id="fpub" class="caja">
    ${paso(1,'Especie o categoría',`<select class="campo" id="pcat" ${ed?'disabled':''}>${Object.entries(GRUPOS).map(([g,gn])=>`<optgroup label="${gn}">${CATS.filter(c=>c.grupo===g&&c.activa&&(!permit||permit.includes(c.id)||c.id===P.cat)).map(c=>`<option value="${c.id}" ${P.cat===c.id?'selected':''} ${['no_habilitada','prohibida'].includes(c.estado_legal)?'disabled':''}>${c.emoji} ${esc(c.nombre)}${c.estado_legal==='revision'?' (con revisión)':''}</option>`).join('')}</optgroup>`).join('')}</select>${ed?'<small>La categoría no se puede cambiar al editar. Si te equivocaste, elimina la publicación y créala de nuevo.</small>':''}`)}
    ${paso(2,'Raza o variedad',`<select class="campo" id="praza"><option value="">Sin definir / no aplica</option>${(RAZAS[cat.id]||[]).map(r=>`<option ${P.raza===r?'selected':''}>${esc(r)}</option>`).join('')}${P.raza&&P.raza!=='__otra'&&!(RAZAS[cat.id]||[]).includes(P.raza)?`<option selected>${esc(P.raza)}</option>`:''}<option value="__otra" ${P.raza==='__otra'?'selected':''}>Otra raza o variedad…</option></select>${P.raza==='__otra'?`<input class="campo" name="otra" style="margin-top:6px" placeholder="Escribe la raza" value="${esc(V.otra||'')}"><small>La enviaremos a revisión para agregarla al catálogo.</small>`:''}`)}
    ${paso(3,'Tipo de publicación',`<div class="chips">${tipos.map(x=>`<button type="button" class="chip ${P.tipo===x?'on':''}" data-ptipo="${x}">${TIPOS[x]}</button>`).join('')}</div>`)}
    ${paso(4,'Finalidad del ejemplar',adop?`<input type="hidden" name="prop" value="a"><div class="aviso" style="margin:0;background:#F3EAF6;border-color:#DCC7E4">💜 Este animal se publica <b>en adopción</b>.</div>`
      :`<div class="fines">${FINES.map(([k,ic,n,dsc])=>`<label class="fin-op"><input type="checkbox" name="prop" value="${k}" ${props.includes(k)?'checked':''}><span><b>${ic} ${n}</b><small>${dsc}</small></span></label>`).join('')}</div>`,adop?'':'Puedes marcar una o varias: un mismo ejemplar puede tener más de un propósito.')}
    ${paso(5,'Aptitud, disciplina o especialidad',`<div class="chips">${apts.map(x=>`<label class="chip chk-chip"><input type="checkbox" name="apt" value="${esc(x)}" ${aptSel.includes(x)?'checked':''}> ${esc(x)}</label>`).join('')}<label class="chip chk-chip"><input type="checkbox" name="apt" value="__otra" id="aptotrachk" ${aptSel.includes('__otra')||aptCustom.length?'checked':''}> Otra</label></div>
      <input class="campo" name="aptotra" id="aptotra" style="margin-top:8px;${aptSel.includes('__otra')||aptCustom.length?'':'display:none'}" placeholder="Escribe la aptitud o disciplina (si son varias, sepáralas con coma)" value="${esc(V.aptotra??aptCustom.join(', '))}">`,`Opcional. ${apts.length?'Opciones para '+esc(cat.nombre.toLowerCase())+'; puedes marcar varias.':'Si aplica, márcala en “Otra” y escríbela.'}`)}
    ${paso(6,'Datos del animal',`<div class="form-g"><div class="f full"><label>Título</label><input class="campo" name="t" required maxlength="90" placeholder="Ej: ${adop?'Gatita de 3 meses busca hogar':'Camada de '+esc(cat.nombre.toLowerCase())}" value="${esc(V.t||'')}"></div>
      <div class="f"><label>Sexo</label><select class="campo" name="sexo">${['Macho','Hembra','Mixto','No aplica'].map(x=>`<option ${sel(V.sexo,x)}>${x}</option>`).join('')}</select></div>
      ${adop?`<input type="hidden" name="cant" value="1"><div class="f"><label>Cantidad</label><input class="campo" value="1 animal" disabled><small>Cada publicación de adopción es de un solo animal.</small></div>${v.plan==='adopcion'?'<div class="f"><label>Costo</label><input class="campo" value="Sin costo" disabled></div>':`<div class="f"><label>Cuota de adopción (opcional)</label><input class="campo" name="precio" type="number" value="${esc(V.precio||'')}"></div>`}`
        :`<div class="f"><label>Cantidad</label><input class="campo" name="cant" type="number" value="${esc(V.cant||1)}" min="1"></div>
        <div class="f"><label>Precio (COP)</label><input class="campo" name="precio" type="number" placeholder="Vacío = a consultar" value="${esc(V.precio||'')}"></div><div class="f"><label>Precio por</label><select class="campo" name="unidad"><option value="">Ejemplar</option>${['por animal','por kg en pie','por lote'].map(x=>`<option ${sel(V.unidad,x)}>${x}</option>`).join('')}</select></div>`}
      ${camposDe(cat.id).concat(adop?['Esterilizado','Carácter']:[]).map(k=>`<div class="f"><label>${esc(k)}</label><input class="campo" data-k="${esc(k)}" value="${esc(at[k]||'')}"></div>`).join('')}
      <div class="f full"><label>Descripción</label><textarea class="campo" name="desc" rows="4" maxlength="2000">${esc(V.desc||'')}</textarea></div>
      <div class="f full"><label>Fotos (hasta 8)</label><label class="subir" style="display:block">⬆ Elegir fotos<input type="file" hidden id="pfotos" accept="image/*" multiple></label><div class="prev-fotos" id="prevf">${prevFotos()}</div><small>🔒 Tus fotos nuevas se marcan automáticamente con el logo de La Cría.</small></div></div>`)}
    ${paso(7,'Información de los padres',`<div class="padres-g">${cajaPadre('padre')}${cajaPadre('madre')}</div>`,'Opcional. Si los tienes, agrega la foto y los datos del padre y de la madre. Se mostrarán en tu publicación como información declarada por ti.')}
    ${paso(8,'Documentos que entregas',`<div class="chips">${docsReq(cat.id).concat(['Contrato de compraventa','Exámenes']).map(d=>`<label class="chip chk-chip"><input type="checkbox" name="docs" value="${esc(d)}" ${docs.includes(d)?'checked':''}> ${esc(d)}</label>`).join('')}</div>`)}
    ${ed?'':paso(9,'Revisión',cat.estado_legal==='revision'?`<div class="aviso" style="margin:0">⚖️ <b>${esc(cat.nombre)}</b> requiere revisión: tu publicación aparecerá cuando el equipo la apruebe.</div>`:'<div class="aviso" style="margin:0;background:#EEF5F0;border-color:#C8DFCF">✓ Tu publicación aparece de inmediato.</div>')}
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px"><button type="button" class="btn btn-o" data-cancelarpub>Cancelar</button><button class="btn btn-p" id="pubbtn">${ed?'Guardar cambios':'Publicar'}</button></div></form>`;
}
async function editarPublicacion(id){
  const {data:p,error}=await sb.from('publicaciones').select('*').eq('id',id).single(); if(error){err(error);return}
  const apts=APTITUDES[p.categoria_id]||[], pad=p.padres||{};
  const conv=x=>({nombre:x&&x.nombre||'',raza:x&&x.raza||'',color:x&&x.color||'',registro:x&&x.registro||'',fotoEx:x&&x.foto||null});
  S.pub={cat:p.categoria_id,raza:p.raza||'',tipo:p.tipo,fotos:[],fotosEx:(p.fotos||[]).slice(),edit:p.id,
    padres:{padre:conv(pad.padre),madre:conv(pad.madre)},
    vals:{t:p.titulo,sexo:p.sexo,cant:p.cantidad,precio:p.precio??'',unidad:p.unidad||'',desc:p.descripcion||'',props:p.finalidades||[],
      apt:(p.aptitudes||[]).filter(x=>apts.includes(x)).concat((p.aptitudes||[]).some(x=>!apts.includes(x))?['__otra']:[]),
      aptotra:(p.aptitudes||[]).filter(x=>!apts.includes(x)).join(', '),docs:p.documentos||[],at:Object.fromEntries(Object.entries(p.atributos||{}).map(([k,x])=>[k==='Pedigrí'?'Pedigree':k,x]))}};
  S.sub='nueva'; render(); window.scrollTo({top:0});
}
async function publicar(form){
  guardarFormPub();
  const v=S.yo, P=S.pub, V=P.vals, ed=!!P.edit;
  const props=V.props||[]; if(!props.length){toast('Elige al menos una finalidad del ejemplar');return}
  if(!(V.t||'').trim()){toast('Escribe un título');return}
  if(!P.fotos.length&&!(P.fotosEx||[]).length){toast('Sube al menos una foto real del animal');return}
  const apt=(V.apt||[]).filter(x=>x!=='__otra').concat((V.apt||[]).includes('__otra')?String(V.aptotra||'').split(',').map(x=>x.trim()).filter(Boolean):[]);
  const btn=$('#pubbtn'); btn.disabled=true; btn.textContent='Subiendo fotos…';
  try{
    const fotos=(P.fotosEx||[]).slice(); for(const f of P.fotos.slice(0,8-fotos.length)) fotos.push(await subir('fotos',v.id,f));
    const padres={};
    for(const q of ['padre','madre']){const d=P.padres[q]||{};let foto=d.fotoEx||null;if(d.foto)foto=await subir('fotos',v.id,await reducirImagen(d.foto,1200),true);
      const o={foto,nombre:(d.nombre||'').trim(),raza:(d.raza||'').trim(),color:(d.color||'').trim(),registro:(d.registro||'').trim()};
      if(o.foto||o.nombre||o.raza||o.color||o.registro){Object.keys(o).forEach(k=>{if(!o[k])delete o[k]});padres[q]=o}}
    let raza=P.raza||null;
    if(P.raza==='__otra'){raza=(V.otra||'').trim()||null; if(raza) await sb.from('razas_propuestas').insert({categoria_id:P.cat,nombre:raza,propuesta_por:v.id});}
    const at={};Object.entries(V.at||{}).forEach(([k,x])=>{if(String(x).trim())at[k]=String(x).trim()});
    const reg={raza,tipo:P.tipo,sexo:V.sexo,finalidades:props,aptitudes:apt,padres,titulo:V.t.trim(),descripcion:V.desc,precio:V.precio!==''&&V.precio!=null?Number(V.precio):null,unidad:V.unidad||null,cantidad:Number(V.cant||1),atributos:at,documentos:V.docs||[],fotos};
    const {error}=ed?await sb.from('publicaciones').update(reg).eq('id',P.edit):await sb.from('publicaciones').insert({...reg,vendedor_id:v.id,categoria_id:P.cat});
    if(error) throw error;
    const cat=P.cat; S.pub=pubVacia(cat); S.sub='pubs'; render();
    toast(ed?'✅ Cambios guardados':catDe(cat).estado_legal==='revision'?'Enviada a revisión. Te avisaremos cuando se apruebe.':'¡Publicado! Ya aparece en La Cría.');
  }catch(e){err(e,ed?'No se pudieron guardar los cambios':'No se pudo publicar');btn.disabled=false;btn.textContent=ed?'Guardar cambios':'Publicar'}
}

/* =====================================================================
   PANEL DE ADMINISTRACIÓN
   ===================================================================== */
async function vAdmin(){
  if(!esAdmin()) return `<div class="wrap"><div class="vacio" style="margin:40px 0">Esta sección es solo para administración.</div></div>`;
  const cnt=async (t,f)=>{let q=sb.from(t).select('*',{count:'exact',head:true});q=f(q);const {count}=await q;return count||0};
  const [nSol,nPag,nMod,nTic,nRep]=await Promise.all([cnt('vendedores',q=>q.eq('verificacion','pendiente').neq('estado','bloqueado')),cnt('pagos',q=>q.eq('estado','pendiente')),cnt('publicaciones',q=>q.eq('estado','revision')),cnt('tickets',q=>q.eq('estado','abierto')),cnt('reportes',q=>q.eq('estado','pendiente'))]);
  const tabs=[['resumen','🏠','Inicio'],['§','Por revisar'],['sol','✅','Verificar vendedores',nSol],['pagos','💳','Pagos de planes',nPag],['mod','🛡️','Moderación',nMod],['soporte','🛟','Soporte',nTic],['rep','🚩','Reportes',nRep],['§','Administrar'],['usuarios','👥','Personas registradas'],['vend','🏡','Vendedores'],['publi','📣','Publicidad'],['§','Ajustes'],['config','⚙️','Configuración'],['seguridad','🔐','Correo y contraseña']];
  const t=tabs.some(x=>x[0]===S.sub)?S.sub:'resumen'; let body='';
  if(t==='resumen'){const [{count:nv},{count:np},{count:nu}]=await Promise.all([sb.from('vendedores').select('*',{count:'exact',head:true}).eq('estado','activo'),sb.from('publicaciones').select('*',{count:'exact',head:true}).eq('estado','activo'),sb.from('profiles').select('*',{count:'exact',head:true})]);
    body=`<div class="h-dash"><h2>Panel de administración</h2></div><div class="accesos">${[['sol','✅','Vendedores por verificar',nSol],['pagos','💳','Pagos por confirmar',nPag],['soporte','🛟','Casos de soporte',nTic],['mod','🛡️','Publicaciones en revisión',nMod]].map(([k,i,n,x])=>`<button class="acceso ${x?'hay':''}" data-sub="${k}"><span>${i}</span><b>${x}</b><small>${n}</small></button>`).join('')}</div>
      <div class="kpis" style="grid-template-columns:repeat(3,1fr)"><button class="kpi kpi-btn" data-sub="vend"><small>Vendedores activos</small><b>${nv||0}</b><span class="ver-mas">Ver vendedores →</span></button><div class="kpi"><small>Publicaciones activas</small><b>${np||0}</b></div><button class="kpi kpi-btn" data-sub="usuarios"><small>Personas registradas</small><b>${nu||0}</b><span class="ver-mas">Ver quiénes son →</span></button></div>`}
  if(t==='sol'){const f=S.filtroV||'pendiente';
    const [{data},{data:pg}]=await Promise.all([sb.from('vendedores').select('*, privado:vendedores_privado(*)').order('created_at',{ascending:false}),sb.from('pagos').select('vendedor_id,estado,valor,created_at').order('created_at',{ascending:false})]);
    const all=(data||[]).filter(v=>v.estado!=='bloqueado'||f==='todos'), L=all.filter(v=>f==='todos'||v.verificacion===f), n=k=>all.filter(v=>v.verificacion===k).length;
    const pago=id=>(pg||[]).find(x=>x.vendedor_id===id);
    const EV={pendiente:['⏳ Pendiente','e-pend'],verificado:['✓ Verificado','e-ok'],rechazado:['✕ Rechazado','e-mal']};
    body=`<div class="h-dash"><h2>Verificar vendedores</h2></div>
    <div class="caja" style="background:var(--crema);font-size:14.5px">🔎 Revisa los datos y documentos de cada vendedor y decide si queda <b>verificado</b> o <b>rechazado</b>. El sello “✓ verificado” solo aparece cuando ustedes lo aprueban aquí: nunca se pone solo. Si rechazan, escriban el motivo: el vendedor lo verá en su panel.</div>
    <div class="chips" style="margin-bottom:14px">${[['pendiente','Pendientes'],['verificado','Verificados'],['rechazado','Rechazados'],['todos','Todos']].map(([k,nm])=>`<button class="chip ${f===k?'on':''}" data-filtrov="${k}">${nm}${k!=='todos'?' ('+n(k)+')':''}</button>`).join('')}</div>
    ${L.map(v=>{const pv=Array.isArray(v.privado)?v.privado[0]:v.privado, docs=(pv&&pv.documentos)||{}, p=pago(v.id), ev=EV[v.verificacion]||EV.pendiente;
      return `<div class="caja ver-card"><div style="display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap"><div class="av av-s" style="background:var(--crema)">${avatar(v)}</div>
        <div style="flex:1;min-width:240px"><b style="font-size:17px">${esc(v.nombre_publico)}</b> <span class="estado ${ev[1]}">${ev[0]}</span>${v.oficial?' <span class="sello-o">★ Oficial</span>':''}
          <div class="ver-datos">
            <div><small>Plan</small><b>${esc(planDe(v.plan).nombre)}${v.pago_anual?' (anual)':''}</b></div>
            <div><small>Cuenta</small><b>${esc(v.estado)}</b></div>
            <div><small>Pago</small><b>${esGratis(planDe(v.plan))||v.oficial?'No aplica':p?`${p.estado==='confirmado'?'✓ Confirmado':p.estado==='rechazado'?'✕ Rechazado':'⏳ Por confirmar'} · ${cop(p.valor)}`:'Sin pago'}</b></div>
            <div><small>Ubicación</small><b>${esc(v.municipio||'')}${v.municipio?', ':''}${esc(v.departamento||'')}</b></div>
            <div><small>WhatsApp</small><b>${esc(v.whatsapp||'—')}</b></div>
            <div><small>Documento</small><b>${esc(pv&&pv.tipo_documento||'—')} ${esc(pv&&pv.numero_documento||'')}</b></div>
            <div class="full"><small>Dirección de notificaciones</small><b>${esc(pv&&pv.direccion_notificaciones||'—')}</b></div>
            <div class="full"><small>Especies</small><b>${(v.especies||[]).map(x=>catDe(x).emoji+' '+esc(catDe(x).nombre)).join(' · ')||'—'}</b></div>
          </div>
          <div class="docs" style="margin:10px 0 0">${Object.entries(docs).flatMap(([k,r])=>(Array.isArray(r)?r:[r]).map((x,i,a)=>`<span class="doc doc-link" data-verdoc="${esc(x)}">📎 ${esc({cedula:'Cédula',selfie:'Selfie con cédula',rut:'Cámara de Comercio / RUT',rutf:'RUT fundación',fotos:'Foto del lugar',ica:'Registro ICA'}[k]||k)}${a.length>1?' '+(i+1):''}</span>`)).join('')||'<span class="doc no">No subió documentos</span>'}</div>
          ${v.verificacion==='rechazado'&&v.motivo_verificacion?`<div class="aviso" style="margin:10px 0 0;background:#FBEAEA;border-color:#EBC4C4">✕ <b>Motivo del rechazo:</b> ${esc(v.motivo_verificacion)}</div>`:''}
          ${v.verificacion==='verificado'&&v.verificado_at?`<small style="display:block;margin-top:8px;color:var(--gris)">Verificado el ${fechaCO(String(v.verificado_at).slice(0,10))}</small>`:''}
        </div></div>
        <div class="acciones" style="justify-content:flex-end;margin-top:12px">
          ${v.verificacion!=='verificado'?`<button class="btn btn-v btn-s" data-verificar="${v.id}">✓ ${v.estado==='pendiente'?'Verificar y activar':'Marcar como verificado'}</button>`:''}
          ${v.verificacion!=='rechazado'?`<button class="btn btn-o btn-s" style="color:var(--mal)" data-rechazarv="${v.id}">✕ Rechazar</button>`:''}
          ${v.verificacion!=='pendiente'?`<button class="btn btn-o btn-s" data-pendientev="${v.id}">↩ Volver a pendiente</button>`:''}
          <button class="btn btn-o btn-s" data-vend="${v.id}">Ver perfil</button></div></div>`}).join('')||'<div class="vacio">No hay vendedores en este grupo 🎉</div>'}
    <p style="font-size:13px;color:var(--gris)">💡 “Verificar y activar” también activa la cuenta y su plan desde hoy. Antes, revisen en “Pagos de planes” que el dinero haya llegado.</p>`}
  if(t==='pagos'){const {data}=await sb.from('pagos').select('*, vendedor:vendedores(nombre_publico,plan,estado)').order('created_at',{ascending:false}).limit(60);
    body=`<div class="h-dash"><h2>Pagos de planes</h2></div><div class="caja" style="background:var(--crema)">💳 Llave Bre-B: <b>${esc(CONFIG.llave_breb||'')}</b>. Revisen que el dinero esté en su cuenta antes de confirmar. Al confirmar, el plan se activa o se renueva.</div>
      <table class="tabla"><tr><th>Vendedor</th><th>Plan</th><th>Valor</th><th>Fecha</th><th>Estado</th><th></th></tr>${(data||[]).map(x=>`<tr><td><b>${esc(x.vendedor?x.vendedor.nombre_publico:'')}</b></td><td>${esc(planDe(x.plan).nombre)}${x.pago_anual?' (anual)':''}</td><td>${cop(x.valor)}</td><td>${fechaCO(x.created_at.slice(0,10))}</td><td><span class="estado ${x.estado==='confirmado'?'e-ok':x.estado==='rechazado'?'e-mal':'e-pend'}">${x.estado}</span></td>
        <td class="acciones">${x.comprobante?`<button class="btn btn-o btn-s" data-vercomp="${esc(x.comprobante)}">Ver comprobante</button>`:''}${x.estado==='pendiente'?`<button class="btn btn-v btn-s" data-confpago="${x.id}">Confirmar</button><button class="btn btn-o btn-s" data-rechpago="${x.id}">Rechazar</button>`:''}</td></tr>`).join('')||'<tr><td colspan="6" style="text-align:center;color:var(--gris)">Aún no hay pagos</td></tr>'}</table>`}
  if(t==='mod'){const {data}=await sb.from('publicaciones').select(SELECT_PUB).eq('estado','revision').order('created_at');const {data:rp}=await sb.from('razas_propuestas').select('*').order('created_at');
    body=`<div class="h-dash"><h2>Moderación</h2></div><div class="caja">${(data||[]).map(p=>`<div class="sol"><div class="av">${catDe(p.categoria_id).emoji}</div><div><b>${esc(p.titulo)}</b><div style="color:var(--gris);font-size:14px">${esc(catDe(p.categoria_id).nombre)} · ${esc(p.raza||'')} · ${esc(p.vendedor?p.vendedor.nombre_publico:'')}</div><div class="prev-fotos">${(p.fotos||[]).slice(0,4).map(f=>`<img src="${esc(fotoUrl(f))}">`).join('')}</div></div><div class="acciones"><button class="btn btn-v btn-s" data-modok="${p.id}">Aprobar</button><button class="btn btn-o btn-s" style="color:var(--mal)" data-modno="${p.id}">Rechazar</button></div></div>`).join('')||'<div class="vacio">No hay publicaciones en revisión 🎉</div>'}</div>
      ${(rp||[]).length?`<div class="caja"><b>Razas propuestas por vendedores</b>${rp.map(r=>`<div style="display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-top:1px solid var(--linea)"><span>${catDe(r.categoria_id).emoji} <b>${esc(r.nombre)}</b> · ${esc(catDe(r.categoria_id).nombre)}</span><span class="acciones"><button class="btn btn-v btn-s" data-razaok="${r.id}" data-cat="${r.categoria_id}" data-nombre="${esc(r.nombre)}">Agregar</button><button class="btn btn-o btn-s" data-razano="${r.id}">Descartar</button></span></div>`).join('')}</div>`:''}`}
  if(t==='soporte'){const f=S.filtroT||'abierto';const {data}=await sb.from('tickets').select('*, respuestas:ticket_respuestas(*)').order('created_at',{ascending:false}).limit(80);
    const L=(data||[]).filter(x=>f==='todos'||x.estado===f), n=k=>(data||[]).filter(x=>x.estado===k).length;
    body=`<div class="h-dash"><h2>Soporte</h2></div>
    <div class="chips" style="margin-bottom:14px">${[['abierto','Por responder'],['respondido','Respondidos'],['cerrado','Cerrados'],['todos','Todos']].map(([k,nm])=>`<button class="chip ${f===k?'on':''}" data-filtrot="${k}">${nm}${k!=='todos'?' ('+n(k)+')':''}</button>`).join('')}</div>
    ${L.map(x=>{const e=ESTADO_T[x.estado]||ESTADO_T.abierto;return `<div class="caja"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><div><b>${esc(x.tipo||'Caso')}</b> <small style="color:var(--gris)">#${x.id}</small> · <span style="color:var(--gris)">${esc(x.nombre||'')} · ${esc(x.contacto||'')}</span>${x.referencia?`<div style="font-size:13.5px;color:var(--gris)">Sobre: ${esc(x.referencia)}</div>`:''}</div><span class="estado ${e[1]}">${e[0]}</span></div>
      ${x.usuario_id?'':`<div class="aviso" style="margin:10px 0 0">✉️ Esta persona escribió <b>sin cuenta</b>, así que no ve las respuestas en la página. Respóndele a su correo: ${/@/.test(x.contacto||'')?`<a class="lk" href="mailto:${esc(x.contacto)}?subject=${encodeURIComponent('Tu caso en La Cría #'+x.id)}">${esc(x.contacto)}</a>`:esc(x.contacto||'(no dejó correo)')}</div>`}
      ${hiloTicket(x,true)}
      <div style="display:flex;gap:6px;justify-content:flex-end;margin-top:8px">${x.estado==='cerrado'?`<button class="btn btn-o btn-s" data-treabrir="${x.id}">Reabrir caso</button>`:`<button class="btn btn-o btn-s" data-tcerrar="${x.id}">Cerrar caso</button>`}</div></div>`}).join('')||'<div class="vacio">No hay casos aquí 🎉</div>'}`}
  if(t==='rep'){const {data}=await sb.from('reportes').select('*, publicacion:publicaciones(id,titulo)').order('created_at',{ascending:false}).limit(50);
    body=`<div class="h-dash"><h2>Reportes</h2></div><table class="tabla"><tr><th>Publicación</th><th>Motivo</th><th>Detalle</th><th>Estado</th><th></th></tr>${(data||[]).map(r=>`<tr><td>${r.publicacion?`<button class="link" data-animal="${r.publicacion.id}">${esc(r.publicacion.titulo)}</button>`:'(eliminada)'}</td><td>${esc(r.motivo)}</td><td>${esc(r.detalle||'')}</td><td><span class="estado ${r.estado==='pendiente'?'e-mal':'e-ok'}">${r.estado}</span></td><td class="acciones">${r.estado==='pendiente'?`${r.publicacion?`<button class="btn btn-o btn-s" style="color:var(--mal)" data-repquitar="${r.id}" data-pub="${r.publicacion.id}">Quitar publicación</button>`:''}<button class="btn btn-o btn-s" data-repdesc="${r.id}">Descartar</button>`:''}</td></tr>`).join('')||'<tr><td colspan="5" style="text-align:center;color:var(--gris)">Sin reportes</td></tr>'}</table>`}
  if(t==='vend'){const {data}=await sb.from('vendedores').select('*').order('created_at',{ascending:false});
    body=`<div class="h-dash"><h2>Vendedores</h2></div><table class="tabla"><tr><th>Vendedor</th><th>Plan</th><th>Vence</th><th>Estado</th><th></th></tr>${(data||[]).map(v=>`<tr><td><b>${esc(v.nombre_publico)}</b>${v.oficial?' <span class="sello-o">★ Oficial</span>':''}<br><small style="color:var(--gris)">${esc(v.municipio||'')}, ${esc(v.departamento||'')}</small></td><td>${esc(planDe(v.plan).nombre)}${v.pago_anual?' (anual)':''}</td><td>${v.oficial?'—':fechaCO(v.vence)}</td><td><span class="estado ${v.estado==='activo'?'e-ok':v.estado==='pendiente'||v.estado==='vencido'?'e-pend':'e-mal'}">${v.estado}</span></td>
      <td class="acciones">${['sancionado','bloqueado'].includes(v.estado)?'':v.estado!=='activo'?`<button class="btn btn-v btn-s" data-vest="${v.id}" data-val="activo">Activar</button>`:`<button class="btn btn-o btn-s" data-vest="${v.id}" data-val="vencido">Desactivar plan</button>`}<button class="btn btn-o btn-s" data-voficial="${v.id}" data-val="${v.oficial?0:1}">${v.oficial?'Quitar oficial':'Hacer oficial'}</button>${['sancionado','bloqueado'].includes(v.estado)?`<button class="btn btn-v btn-s" data-sancion="activa" data-uid="${v.id}">Reactivar cuenta</button>`:`<button class="btn btn-o btn-s" style="color:var(--mal)" data-sancion="suspendida" data-uid="${v.id}">⏸️ Suspender</button><button class="btn btn-o btn-s" style="color:var(--mal)" data-sancion="bloqueada" data-uid="${v.id}">⛔ Bloquear</button>`}<button class="btn btn-o btn-s" style="color:var(--mal)" data-eliminarcta="${v.id}">🗑 Eliminar</button></td></tr>`).join('')||'<tr><td colspan="5" style="text-align:center;color:var(--gris)">Aún no hay vendedores</td></tr>'}</table>`}
  if(t==='usuarios'){const [{data:us},{data:vs}]=await Promise.all([sb.from('profiles').select('*').order('created_at',{ascending:false}).limit(1000),sb.from('vendedores').select('id,nombre_publico,plan,estado,oficial,verificacion,vence,municipio,departamento,whatsapp,created_at')]);
    const V={};(vs||[]).forEach(v=>V[v.id]=v);const L=us||[];const f=S.filtroU||'todos';S.cacheU={L,V};
    const tipo=u=>u.rol==='admin'?'admin':V[u.id]?'vendedor':'comprador';
    const n=k=>L.filter(u=>tipo(u)===k).length;
    const lista=L.filter(u=>f==='todos'||(f==='sancion'?u.estado_cuenta&&u.estado_cuenta!=='activa':tipo(u)===f));
    const wa=w=>{const d=String(w||'').replace(/\D/g,'');return d?(d.length===10?'57'+d:d):''};
    body=`<div class="h-dash"><h2>Personas registradas</h2></div>
    <div class="kpis" style="grid-template-columns:repeat(4,1fr)"><div class="kpi"><small>Total</small><b>${L.length}</b></div><div class="kpi"><small>Compradores</small><b>${n('comprador')}</b></div><div class="kpi"><small>Vendedores</small><b>${n('vendedor')}</b></div><div class="kpi"><small>Administración</small><b>${n('admin')}</b></div></div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:12px"><div class="chips">${[['todos','Todos'],['comprador','Compradores'],['vendedor','Vendedores'],['admin','Administración'],['sancion','Suspendidas o bloqueadas']].map(([k,nm])=>`<button class="chip ${f===k?'on':''}" data-filtrou="${k}">${nm}${k==='sancion'?' ('+L.filter(u=>u.estado_cuenta&&u.estado_cuenta!=='activa').length+')':''}</button>`).join('')}</div><input class="campo" id="busu" placeholder="🔎 Buscar por nombre, correo, celular o departamento" style="flex:1;min-width:240px"></div>
    <table class="tabla" id="tablau"><tr><th>Persona</th><th>Contacto</th><th>Departamento</th><th>Tipo</th><th>Se registró</th><th></th></tr>
    ${lista.map(u=>{const v=V[u.id],tp=tipo(u);return `<tr data-busca="${esc(norm([u.nombre,u.correo,u.whatsapp,u.departamento,v&&v.nombre_publico].join(' ')))}"><td><b>${esc(u.nombre||'(sin nombre)')}</b>${v?`<br><button class="link" style="font-size:13px" data-vend="${v.id}">🏡 ${esc(v.nombre_publico)}</button>`:''}</td>
      <td style="font-size:14px">${u.correo?`<a class="lk" href="mailto:${esc(u.correo)}">${esc(u.correo)}</a>`:'—'}${u.whatsapp?`<br>${wa(u.whatsapp)?`<a class="lk" href="https://wa.me/${wa(u.whatsapp)}" target="_blank" rel="noopener">📱 ${esc(u.whatsapp)}</a>`:esc(u.whatsapp)}`:''}</td>
      <td>${esc(u.departamento||'—')}</td>
      <td><span class="estado ${tp==='admin'?'e-gris':tp==='vendedor'?'e-ok':'e-pend'}">${tp==='admin'?'Administración':tp==='vendedor'?'Vendedor':'Comprador'}</span>${u.estado_cuenta&&u.estado_cuenta!=='activa'?` <span class="estado e-mal">${u.estado_cuenta==='bloqueada'?'⛔ Bloqueada':'⏸️ Suspendida'}</span>`:''}${v?`<br><small style="color:var(--gris)">Plan ${esc(planDe(v.plan).nombre)} · ${esc(v.estado)}${v.oficial?' · Oficial':''}</small>`:''}</td>
      <td style="font-size:14px">${fechaCO(String(u.created_at).slice(0,10))}</td><td><button class="btn btn-o btn-s" data-verpersona="${u.id}">Ver detalles</button></td></tr>`}).join('')||'<tr><td colspan="6" style="text-align:center;color:var(--gris)">No hay personas en este grupo</td></tr>'}</table>
    <p style="font-size:12.5px;color:var(--gris);margin-top:10px">🔒 Estos datos son personales: úsenlos solo para atender a la persona y según la Política de datos de La Cría.</p>`}
  if(t==='publi'){const {data}=await sb.from('banners').select('*').order('created_at',{ascending:false});const L=data||[];const E=S.banEdit;
    const ed=E?(E==='nuevo'?{ubicacion:'ambas',activo:true,desde:hoyISO()}:L.find(x=>x.id==E)||{}):null;
    const prev=S.banImg?URL.createObjectURL(S.banImg):ed&&ed.imagen?fotoUrl(ed.imagen):'';
    body=`<div class="h-dash"><h2>Publicidad</h2>${E?'':'<button class="btn btn-p btn-s" data-bannuevo>➕ Nuevo banner</button>'}</div>
    <div class="caja" style="background:var(--crema);font-size:14.5px">📣 Aquí manejan los banners de las marcas del sector (concentrados, veterinarias, accesorios, transporte…). Cada banner es una <b>imagen</b>: cuando alguien le hace clic, lo lleva a la página o al WhatsApp de la marca. Se muestran en el inicio y/o en la búsqueda, y si hay varios van rotando solos.</div>
    ${ed?`<div class="caja" id="banform"><b>${E==='nuevo'?'Nuevo banner':'Editar banner'}</b>
      <div class="form-g" style="margin-top:12px">
        <div class="f full"><label>Imagen del banner *</label>
          <div class="ban-prev">${prev?`<img src="${esc(prev)}" alt="">`:'<span>Aquí verás la imagen</span>'}</div>
          <label class="btn btn-o btn-s" style="display:inline-block;cursor:pointer;margin-top:8px">⬆ ${prev?'Cambiar imagen':'Subir imagen'}<input type="file" hidden accept="image/*" data-banimg></label>
          <small style="display:block;margin-top:6px">Tamaño recomendado: <b>1200 × 300 píxeles</b> (horizontal, 4 a 1). JPG o PNG, máximo 10 MB. Que el texto importante quede en el centro.</small></div>
        <div class="f"><label>Marca o anunciante *</label><input class="campo" id="bn-an" value="${esc(ed.anunciante||'')}" placeholder="Ej: Concentrados El Campo"></div>
        <div class="f"><label>Enlace de la marca *</label><input class="campo" id="bn-en" value="${esc(ed.enlace||'')}" placeholder="www.marca.com o 3001234567"><small>Página web, Instagram o un número de WhatsApp</small></div>
        <div class="f"><label>Dónde se muestra</label><select class="campo" id="bn-ub">${[['ambas','Inicio y búsqueda'],['inicio','Solo en el inicio'],['explorar','Solo en la búsqueda']].map(([k,n])=>`<option value="${k}" ${ed.ubicacion===k?'selected':''}>${n}</option>`).join('')}</select></div>
        <div class="f"><label>Valor cobrado (COP)</label><input class="campo" id="bn-va" type="number" value="${esc(ed.valor??'')}" placeholder="Solo lo ven ustedes"></div>
        <div class="f"><label>Desde</label><input class="campo" id="bn-de" type="date" value="${esc(ed.desde||'')}"></div>
        <div class="f"><label>Hasta</label><input class="campo" id="bn-ha" type="date" value="${esc(ed.hasta||'')}"><small>Ese día deja de mostrarse solo</small></div>
        <div class="f full"><label>Descripción corta (opcional)</label><input class="campo" id="bn-tx" value="${esc(ed.texto&&ed.texto!==ed.anunciante?ed.texto:'')}" placeholder="Ej: 20% de descuento en concentrado para cerdos"><small>No se ve en la imagen; ayuda a personas con lector de pantalla y a Google.</small></div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px"><button class="btn btn-o" data-bancancelar>Cancelar</button><button class="btn btn-p" data-banguardar id="banbtn">Guardar banner</button></div></div>`:''}
    ${L.length?`<div class="ban-lista">${L.map(b=>{const e=estadoBanner(b);return `<div class="caja ban-item"><div class="ban-mini">${b.imagen?`<img src="${esc(fotoUrl(b.imagen))}" alt="">`:`<span>${esc(b.emoji||'📣')}</span>`}</div>
      <div style="flex:1;min-width:200px"><b>${esc(b.anunciante)}</b> <span class="estado ${e[1]}">${e[0]}</span>
        <div style="font-size:13.5px;color:var(--gris);margin-top:4px">${{ambas:'Inicio y búsqueda',inicio:'Inicio',explorar:'Búsqueda'}[b.ubicacion]||b.ubicacion} · ${b.desde?fechaCO(b.desde):'sin inicio'} → ${b.hasta?fechaCO(b.hasta):'sin fin'}${b.valor?' · '+cop(b.valor):''}</div>
        <div style="font-size:13.5px;margin-top:4px">👆 <b>${b.clics||0}</b> ${(b.clics||0)===1?'clic':'clics'} · <span style="color:var(--gris);word-break:break-all">${esc(b.enlace||'sin enlace')}</span></div></div>
      <div class="acciones"><button class="btn btn-o btn-s" data-baneditar="${b.id}">Editar</button><button class="btn btn-o btn-s" data-banactivo="${b.id}" data-val="${b.activo?0:1}">${b.activo?'Pausar':'Activar'}</button><button class="btn btn-o btn-s" style="color:var(--mal)" data-banborrar="${b.id}">Eliminar</button></div></div>`}).join('')}</div>`:(ed?'':'<div class="vacio">Todavía no hay banners. Toca “➕ Nuevo banner” para crear el primero.</div>')}`}
  if(t==='config') body=`<div class="h-dash"><h2>Configuración</h2></div><div class="caja"><b>💳 Cobro de planes por Bre-B</b><div class="form-g" style="margin-top:10px"><div class="f"><label>Llave Bre-B</label><input class="campo" id="cf-llave" value="${esc(CONFIG.llave_breb||'')}"></div><div class="f"><label>Titular que verá el vendedor</label><input class="campo" id="cf-tit" value="${esc(CONFIG.titular_breb||'')}"></div><div class="f"><label>Horas para activar</label><input class="campo" id="cf-hor" type="number" value="${esc(CONFIG.horas_activacion||24)}"></div>
    <div class="f full"><label>Código QR de la llave Bre-B</label><div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">${CONFIG.qr_breb?`<div class="pago-qr"><img src="${esc(fotoUrl(CONFIG.qr_breb))}" alt=""></div>`:'<div class="pago-qr" style="width:150px;height:150px;justify-content:center"><small>Sin QR todavía</small></div>'}<div style="flex:1;min-width:200px"><label class="btn btn-o btn-s" style="display:inline-block;cursor:pointer">⬆ ${CONFIG.qr_breb?'Cambiar':'Subir'} imagen del QR<input type="file" accept="image/*" hidden data-subirqr></label>${CONFIG.qr_breb?' <button class="btn btn-o btn-s" data-quitarqr>Quitar</button>':''}<small style="display:block;margin-top:8px">Descárguenlo desde la app del banco donde registraron la llave (opción “Mi QR” o “Compartir llave”). Les sale a los vendedores al pagar y al renovar.</small></div></div></div></div></div>
    <div class="caja"><b>🏷️ Precios de los planes</b><div class="form-g" style="margin-top:10px">${PLANES.map(p=>`<div class="f"><label>${p.emoji} ${esc(p.nombre)} ${p.id==='ocasional'?'(pago único · 60 días)':p.pago_unico?'(por publicación)':'(mensual, el anual es ×10)'}</label><input class="campo" type="number" data-cfplan="${p.id}" value="${p.precio}"></div>`).join('')}</div></div>
    <div style="text-align:right"><button class="btn btn-p" data-guardarconfig>Guardar configuración</button></div>`;
  if(t==='seguridad') body='<div class="h-dash"><h2>Correo y contraseña</h2></div>'+vSeguridad();
  return `<div class="wrap"><div class="dash"><aside class="side"><div class="quien"><b>Administración</b><small>La Cría</small></div>${menuLateral(tabs,t)}<button data-salir><span class="ic">🚪</span><span class="tx">Cerrar sesión</span></button></aside><div>${body}</div></div></div>`;
}
function venceDe(plan,anual){const p=planDe(plan);return esGratis(p)?sumarDias(30):p.pago_unico?sumarDias(60):anual?sumarMeses(12):sumarMeses(1)}

/* =====================================================================
   SOPORTE, REPORTES, COMPARTIR
   ===================================================================== */
function modalSoporte(){modal(`<h3>🛟 Soporte La Cría</h3><p style="color:var(--gris);margin-bottom:12px">Cuéntanos qué pasó y te respondemos a tu correo.</p>
  <div style="display:flex;flex-direction:column;gap:8px"><input class="campo" id="snom" placeholder="Tu nombre" value="${esc((S.perfil||{}).nombre||'')}"><input class="campo" id="scor" placeholder="Tu correo" value="${esc(S.sesion?S.sesion.user.email:'')}">
  <select class="campo" id="stipo"><option>Inconformidad con un vendedor</option><option>Posible estafa</option><option>Problema con mi plan o pago</option><option>Problema con mi cuenta</option><option>Duda sobre la página</option><option>Otro</option></select>
  <input class="campo" id="sref" placeholder="¿Sobre qué publicación o vendedor? (opcional)"><textarea class="campo" id="smsg" rows="4" placeholder="Describe tu caso"></textarea></div>
  <button class="btn btn-p" style="width:100%;margin-top:12px" data-senviar>Enviar a soporte</button>`)}
function modalReportar(id){modal(`<h3>Reportar publicación</h3><select class="campo" id="rmot" style="margin-top:8px"><option>Fauna silvestre</option><option>Posible estafa</option><option>Animal en mal estado</option><option>Información falsa</option><option>Otro</option></select><textarea class="campo" id="rdet" rows="3" style="margin-top:8px" placeholder="Cuéntanos qué pasó"></textarea><button class="btn btn-p" style="width:100%;margin-top:12px" data-envrep="${id}">Enviar reporte</button>`)}
function modalCompartir(url,titulo){const t=encodeURIComponent(`Mira ${titulo} en La Cría 🐾 ${url}`);modal(`<h3>🔗 Compartir</h3><p style="color:var(--gris);margin-bottom:12px">${esc(titulo)}</p><div style="display:flex;gap:6px"><input class="campo" id="shurl" value="${esc(url)}" readonly><button class="btn btn-v btn-s" data-copiar>Copiar</button></div><div style="display:flex;gap:8px;margin-top:10px"><a class="btn btn-wa" style="flex:1;text-decoration:none" href="https://wa.me/?text=${t}" target="_blank" rel="noopener">WhatsApp</a><a class="btn btn-o" style="flex:1;text-decoration:none" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener">Facebook</a></div>`)}
const urlBase = () => location.origin + location.pathname;

/* =====================================================================
   EVENTOS
   ===================================================================== */
document.addEventListener('click', e=>{const a=e.target.closest('a[data-banclic]');if(a)sb.rpc('sumar_clic_banner',{p_id:Number(a.dataset.banclic)}).then(()=>{},()=>{})},true);
document.addEventListener('click', async e=>{
  if(!e.target.closest('.campana-w')) $('#pnotif').classList.remove('on');
  const b=e.target.closest('button,a[data-legal],[data-vfoto]'); if(!b) return; const d=b.dataset;
  try{
  if(d.cerrar!==undefined){cerrar();return}
  if(d.verqr){modal(`<div style="text-align:center"><h3>Escanea para pagar</h3><img src="${esc(d.verqr)}" alt="QR Bre-B" style="width:min(80vw,420px);margin-top:10px;border-radius:16px"><p style="margin-top:8px"><a class="lk" href="${esc(d.verqr)}" target="_blank" rel="noopener" download>⬇ Descargar QR</a></p></div>`);return}
  if(d.escribir){await abrirChatDe(Number(d.escribir));return}
  if(d.chat){S.chat=Number(d.chat);await render();bajarChat();$('#chattxt')&&$('#chattxt').focus();return}
  if(d.chatcerrar!==undefined){S.chat=null;render();return}
  if(d.chatenviar!==undefined){await enviarChat();return}
  if(d.volver!==undefined){volver();return}
  if(d.go){go(d.go);return}
  if(d.legal){e.preventDefault();cerrar();go('legal',d.legal);return}
  if(d.cat){S.f={...filtrosVacios(),cat:d.cat};go('explorar');return}
  if(d.prop&&!d.f){S.f={...filtrosVacios(),prop:d.prop};go('explorar');return}
  if(d.animal){go('animal',d.animal);return}
  if(d.vend){cerrar();go('vendedor',d.vend);return}
  if(d.vfoto){$('#fotoP').innerHTML=`<img src="${esc(d.vfoto)}" alt="">`;return}
  if(d.f){S.f[d.f]=d.v;render();return}
  if(d.raza!==undefined){S.f.raza=d.raza;render();return}
  if(d.limpiar!==undefined){S.f=filtrosVacios();render();return}
  if(d.verfiltros!==undefined){S.verFiltros=!S.verFiltros;render();return}
  if(d.quitar){const k=d.quitar;if(k==='cat')S.f={...filtrosVacios(),q:S.f.q,depto:S.f.depto};else if(k==='precio'){S.f.min='';S.f.max=''}else S.f[k]='';render();return}
  if(d.ubic!==undefined){const dp=$('#udepto').value;if(!dp){toast('Elige un departamento');return}S.f={...filtrosVacios(),depto:dp};go('explorar');return}
  if(d.foco!==undefined){window.scrollTo({top:0,behavior:'smooth'});setTimeout(()=>$('#hq')&&$('#hq').focus(),300);return}
  if(d.sub){if(S.pub.edit)S.pub=pubVacia(S.pub.cat);S.sub=d.sub;render();window.scrollTo({top:0});return}
  // cuentas
  if(d.login!==undefined){modalLogin();return}
  if(d.gocrear!==undefined){cerrar();go('crear');return}
  if(d.entrar!==undefined){const {error}=await sb.auth.signInWithPassword({email:$('#lcor').value.trim().toLowerCase(),password:$('#lpas').value});if(error){$('#lerr').textContent=error.message.includes('confirm')?'Primero confirma tu correo con el enlace que te enviamos.':'Correo o contraseña incorrectos';return}cerrar();await cargarSesion();if(!S.sesion){render();avisoBloqueo();return}S.sub='resumen';go(S.despues||(esAdmin()?'admin':S.yo?'panel':'inicio'));S.despues=null;toast('¡Hola de nuevo!');return}
  if(d.salir!==undefined){await sb.auth.signOut();S.sesion=null;S.perfil=null;S.yo=null;go('inicio');toast('Cerraste sesión');return}
  if(d.olvide!==undefined){modalOlvide();return}
  if(d.olvenviar!==undefined){const c=$('#ocor').value.trim().toLowerCase();if(!c){toast('Escribe tu correo');return}const {error}=await sb.auth.resetPasswordForEmail(c,{redirectTo:urlBase()});if(error){err(error,'No se pudo enviar');return}modal('<div style="text-align:center"><div style="font-size:52px">📧</div><h3>Revisa tu correo</h3><p style="color:var(--gris);margin-top:8px">Si ese correo tiene cuenta en La Cría, te llegó un enlace para crear una contraseña nueva. Revisa también la carpeta de spam.</p></div>');return}
  if(d.nuevaclave!==undefined){const a=$('#nc1').value,c=$('#nc2').value;if(a.length<8){toast('Mínimo 8 caracteres');return}if(a!==c){toast('Las contraseñas no coinciden');return}const {error}=await sb.auth.updateUser({password:a});if(error){err(error,'No se pudo cambiar');return}cerrar();toast('✅ Contraseña actualizada');return}
  if(d.crearcuenta!==undefined){await crearCuenta();return}
  if(d.segcod!==undefined){const {error}=await sb.auth.reauthenticate();if(error){err(error,'No se pudo enviar el código');return}toast('📧 Te enviamos un código a tu correo');return}
  if(d.segclave!==undefined){const n=$('#seg-n').value,r=$('#seg-r').value,k=$('#seg-k').value.trim();if(n.length<8){toast('Mínimo 8 caracteres');return}if(n!==r){toast('Las contraseñas no coinciden');return}const {error}=await sb.auth.updateUser(k?{password:n,nonce:k}:{password:n});if(error){err(error,error.message.toLowerCase().includes('nonce')||error.message.toLowerCase().includes('reauth')?'Primero toca “Enviar código” y escribe el código':'No se pudo cambiar');return}$('#seg-n').value=$('#seg-r').value=$('#seg-k').value='';toast('✅ Contraseña actualizada');return}
  if(d.segcorreo!==undefined){const c=$('#seg-c').value.trim().toLowerCase();if(!c){toast('Escribe el correo nuevo');return}const {error}=await sb.auth.updateUser({email:c},{emailRedirectTo:urlBase()});if(error){err(error,'No se pudo cambiar');return}toast('📧 Te enviamos un enlace a los dos correos para confirmar');return}
  if(d.guardardatos!==undefined){const {error}=await sb.from('profiles').update({nombre:$('#md-n').value.trim(),whatsapp:$('#md-w').value.trim(),departamento:$('#md-d').value}).eq('id',S.sesion.user.id);if(error){err(error);return}await cargarSesion();toast('Datos guardados');return}
  if(d.fav){if(!S.sesion){pedirCuenta('guardar favoritos');return}const id=Number(d.fav);if(b.textContent.includes('♥')){await sb.from('favoritos').delete().eq('publicacion_id',id).eq('usuario_id',S.sesion.user.id);b.textContent='♡ Guardar'}else{const {error}=await sb.from('favoritos').insert({usuario_id:S.sesion.user.id,publicacion_id:id});if(error){err(error);return}b.textContent='♥ Guardado';toast('♥ Guardado en tus favoritos')}return}
  // registro
  if(d.anualplanes){S.anualPlanes=d.anualplanes==='1';render();return}
  if(d.elegir){S.reg={paso:1,plan:d.elegir,anual:d.anual==='1'&&TIENE_ANUAL.includes(d.elegir),esp:[],arch:{}};go('registro');return}
  if(d.regplan){S.reg.plan=d.regplan;S.reg.esp=[];if(!['criadero','hacienda'].includes(d.regplan))S.reg.anual=false;render();return}
  if(d.reganual){S.reg.anual=d.reganual==='1';render();return}
  if(d.regesp){guardarPasoRegSilencioso();const a=S.reg.esp,i=a.indexOf(d.regesp);i<0?a.push(d.regesp):a.splice(i,1);render();return}
  if(d.regpaso){const dir=Number(d.regpaso);if(dir>0&&!guardarPasoReg())return;if(dir>0&&S.reg.paso===4){await enviarRegistro();return}let np=Math.max(1,Math.min(4,S.reg.paso+dir));if(np===2&&esGratis(planDe(S.reg.plan)))np=dir>0?3:1;S.reg.paso=np;render();window.scrollTo({top:0});return}
  // panel vendedor
  if(d.quitararch){guardarPasoRegSilencioso();const l=listaArch(d.quitararch).slice();l.splice(Number(d.i),1);if(l.length)S.reg.arch[d.quitararch]=Array.isArray(S.reg.arch[d.quitararch])?l:l[0];else delete S.reg.arch[d.quitararch];render();return}
  if(d.quitarfoto){const i=Number(d.quitarfoto),ne=(S.pub.fotosEx||[]).length;if(i<ne)S.pub.fotosEx.splice(i,1);else S.pub.fotos.splice(i-ne,1);$('#prevf').innerHTML=prevFotos();return}
  if(d.quitarpadre){guardarFormPub();const q=S.pub.padres[d.quitarpadre];q.foto=null;q.fotoEx=null;render();return}
  if(d.cancelarpub!==undefined){S.pub=pubVacia(S.pub.cat);S.sub='pubs';render();return}
  if(d.pubeditar){await editarPublicacion(Number(d.pubeditar));return}
  if(d.mejorar){S.cambio={plan:d.mejorar,anual:false};render();return}
  if(d.mejoraranual){S.cambio.anual=d.mejoraranual==='1';render();return}
  if(d.quitaravatar){const vend=d.quitaravatar==='logo';const {error}=vend?await sb.from('vendedores').update({logo:null}).eq('id',S.yo.id):await sb.from('profiles').update({foto:null}).eq('id',S.sesion.user.id);if(error){err(error);return}await cargarSesion();toast('Foto quitada');render();return}
  if(d.bannuevo!==undefined){S.banEdit='nuevo';S.banImg=null;render();return}
  if(d.baneditar){S.banEdit=d.baneditar;S.banImg=null;render();return}
  if(d.bancancelar!==undefined){S.banEdit=null;S.banImg=null;render();return}
  if(d.banactivo){const {error}=await sb.from('banners').update({activo:d.val==='1'}).eq('id',d.banactivo);if(error){err(error);return}await cargarBase();toast(d.val==='1'?'Banner activado':'Banner pausado');render();return}
  if(d.banborrar){if(!b.dataset.ok){b.dataset.ok='1';b.textContent='¿Seguro? Toca otra vez';return}const {error}=await sb.from('banners').delete().eq('id',d.banborrar);if(error){err(error);return}await cargarBase();toast('Banner eliminado');render();return}
  if(d.banguardar!==undefined){const g=id=>$('#'+id).value.trim(),E=S.banEdit,an=g('bn-an'),en=g('bn-en');
    if(!an||!en){toast('Escribe la marca y el enlace');return}
    if(E==='nuevo'&&!S.banImg){toast('Sube la imagen del banner');return}
    const de=g('bn-de')||null,ha=g('bn-ha')||null;if(de&&ha&&ha<de){toast('La fecha “Hasta” debe ser después de “Desde”');return}
    const btn=$('#banbtn');btn.disabled=true;btn.textContent='Guardando…';
    try{const reg={anunciante:an,enlace:en,ubicacion:g('bn-ub'),valor:g('bn-va')?Number(g('bn-va')):null,desde:de,hasta:ha,texto:g('bn-tx')||an};
      if(S.banImg)reg.imagen=await subir('fotos',S.sesion.user.id,await reducirImagen(S.banImg,1600),true);
      const r=E==='nuevo'?await sb.from('banners').insert({...reg,activo:true}):await sb.from('banners').update(reg).eq('id',E);if(r.error)throw r.error;
      S.banEdit=null;S.banImg=null;await cargarBase();toast('✅ Banner guardado');render()}catch(x){err(x,'No se pudo guardar el banner');btn.disabled=false;btn.textContent='Guardar banner'}return}
  if(d.ptipo){guardarFormPub();S.pub.tipo=d.ptipo;render();return}
  if(d.destacar){const {error}=await sb.from('publicaciones').update({destacado:d.val==='1'}).eq('id',d.destacar);if(error){err(error);return}render();return}
  if(d.pubest){const {error}=await sb.from('publicaciones').update({estado:d.val}).eq('id',d.pubest);if(error){err(error);return}render();return}
  if(d.pubdel){if(!b.dataset.ok){b.dataset.ok='1';b.textContent='¿Seguro? Toca otra vez';return}const {error}=await sb.from('publicaciones').delete().eq('id',d.pubdel);if(error){err(error);return}toast('Publicación eliminada');render();return}
  if(d.guardarperfil!==undefined){const g=id=>$('#'+id)?$('#'+id).value.trim():undefined;const upd={nombre_publico:g('pf-n'),whatsapp:g('pf-w'),instagram:g('pf-i'),web:g('pf-web'),departamento:g('pf-d'),municipio:g('pf-m'),envios:g('pf-e'),descripcion:g('pf-desc')};if(g('pf-don')!==undefined)upd.llave_donaciones=g('pf-don');const {error}=await sb.from('vendedores').update(upd).eq('id',S.yo.id);if(error){err(error);return}await cargarSesion();toast('Perfil guardado');return}
  // admin
  if(d.verdoc){await verPrivado('documentos',d.verdoc);return}
  if(d.vercomp){await verPrivado('comprobantes',d.vercomp);return}
  if(d.filtrov){S.filtroV=d.filtrov;render();return}
  if(d.verificar){const {data:v}=await sb.from('vendedores').select('plan,pago_anual,estado').eq('id',d.verificar).single();const upd={verificacion:'verificado',motivo_verificacion:null};
    if(v.estado==='pendiente'){upd.estado='activo';upd.vence=venceDe(v.plan,v.pago_anual)}
    const {error}=await sb.from('vendedores').update(upd).eq('id',d.verificar);if(error){err(error);return}
    if(v.estado==='pendiente')await sb.from('pagos').update({estado:'confirmado',revisado_at:new Date().toISOString()}).eq('vendedor_id',d.verificar).eq('estado','pendiente');
    await sb.rpc('notificar',{p_usuario:d.verificar,p_icono:'✅',p_texto:v.estado==='pendiente'?'¡Tu cuenta fue verificada y activada! Ya puedes publicar en La Cría':'¡Tu cuenta fue verificada! Ya tienes el sello ✓ de La Cría',p_seccion:'resumen',p_admin:false});
    toast('✅ Vendedor verificado');render();return}
  if(d.rechazarv){modal(`<h3>Rechazar verificación</h3><p style="color:var(--gris);margin:6px 0 10px">Escribe el motivo. El vendedor lo verá en su panel para saber qué corregir.</p><textarea class="campo" id="motivorech" rows="3" placeholder="Ej: La foto de la cédula no se ve bien. Súbela de nuevo por ambos lados."></textarea><button class="btn btn-p" style="width:100%;margin-top:12px" data-confrech="${d.rechazarv}">Rechazar y enviar motivo</button>`);setTimeout(()=>$('#motivorech')&&$('#motivorech').focus(),50);return}
  if(d.confrech){const m=$('#motivorech').value.trim();if(!m){toast('Escribe el motivo del rechazo');return}const {data:v}=await sb.from('vendedores').select('estado').eq('id',d.confrech).single();const upd={verificacion:'rechazado',motivo_verificacion:m};if(v&&v.estado==='pendiente')upd.estado='rechazado';
    const {error}=await sb.from('vendedores').update(upd).eq('id',d.confrech);if(error){err(error);return}
    await sb.rpc('notificar',{p_usuario:d.confrech,p_icono:'⚠️',p_texto:'Tu verificación no fue aprobada. Motivo: '+m.slice(0,160),p_seccion:'perfil',p_admin:false});cerrar();toast('Verificación rechazada');render();return}
  if(d.pendientev){const {data:v}=await sb.from('vendedores').select('estado').eq('id',d.pendientev).single();const upd={verificacion:'pendiente',motivo_verificacion:null};if(v&&v.estado==='rechazado')upd.estado='pendiente';const {error}=await sb.from('vendedores').update(upd).eq('id',d.pendientev);if(error){err(error);return}toast('Vuelve a quedar pendiente de verificación');render();return}
  if(d.confpago){const {data:p}=await sb.from('pagos').select('*').eq('id',d.confpago).single();const {data:v}=await sb.from('vendedores').select('*').eq('id',p.vendedor_id).single();await sb.from('pagos').update({estado:'confirmado',revisado_at:new Date().toISOString()}).eq('id',p.id);if(v&&v.estado!=='pendiente'){await sb.from('vendedores').update({estado:'activo',plan:p.plan,pago_anual:!!p.pago_anual,vence:venceDe(p.plan,p.pago_anual)}).eq('id',v.id);await sb.rpc('notificar',{p_usuario:v.id,p_icono:'💳',p_texto:'Tu pago fue confirmado y tu plan quedó activo',p_seccion:'plan',p_admin:false})}toast(v&&v.estado==='pendiente'?'Pago confirmado. Ahora verifica la cuenta en “Verificar vendedores”.':'Pago confirmado: plan activo');render();return}
  if(d.rechpago){await sb.from('pagos').update({estado:'rechazado',revisado_at:new Date().toISOString()}).eq('id',d.rechpago);toast('Pago rechazado');render();return}
  if(d.modok){const {error}=await sb.from('publicaciones').update({estado:'activo'}).eq('id',d.modok);if(error){err(error);return}toast('Publicación aprobada');render();return}
  if(d.modno){await sb.from('publicaciones').update({estado:'rechazado'}).eq('id',d.modno);toast('Publicación rechazada');render();return}
  if(d.razaok){await sb.from('razas').insert({categoria_id:d.cat,nombre:d.nombre});await sb.from('razas_propuestas').delete().eq('id',d.razaok);await cargarBase();toast('Raza agregada');render();return}
  if(d.razano){await sb.from('razas_propuestas').delete().eq('id',d.razano);render();return}
  if(d.tresp){const i=$('#tr-'+d.tresp);if(!i.value.trim()){toast('Escribe el mensaje');return}b.disabled=true;const {error}=await sb.from('ticket_respuestas').insert({ticket_id:Number(d.tresp),autor_id:S.sesion.user.id,texto:i.value.trim()});b.disabled=false;if(error){err(error,'No se pudo enviar');return}toast(esAdmin()?'✅ Respuesta enviada. Le llega el aviso a su campanita.':'✅ Mensaje enviado al equipo de La Cría');render();return}
  if(d.verpersona){const C=S.cacheU||{L:[],V:{}},u=C.L.find(x=>x.id===d.verpersona);if(!u)return;const v=C.V[u.id];
    const fila=(n,x)=>`<div class="det-f"><small>${n}</small><b>${x||'—'}</b></div>`;
    modal(`<h3>👤 ${esc(u.nombre||'(sin nombre)')}</h3><div class="det-g">
      ${fila('Correo',u.correo?`<a class="lk" href="mailto:${esc(u.correo)}">${esc(u.correo)}</a>`:'')}${fila('Celular / WhatsApp',esc(u.whatsapp||''))}
      ${fila('Departamento',esc(u.departamento||''))}${fila('Tipo de cuenta',u.rol==='admin'?'Administración':v?'Vendedor':'Comprador')}
      ${fila('Se registró',new Date(u.created_at).toLocaleString('es-CO',{day:'numeric',month:'long',year:'numeric',hour:'numeric',minute:'2-digit'}))}
      ${fila('Acepta promociones',u.acepta_promos===false?'No':'Sí')}
      ${v?fila('Nombre público',esc(v.nombre_publico))+fila('Plan',esc(planDe(v.plan).nombre))+fila('Estado de la cuenta',esc(v.estado))+fila('Verificación',{pendiente:'⏳ Pendiente',verificado:'✓ Verificado',rechazado:'✕ Rechazado'}[v.verificacion]||'—')+fila('Vence',v.oficial?'Tienda oficial':fechaCO(v.vence))+fila('Ubicación',esc([v.municipio,v.departamento].filter(Boolean).join(', '))):''}
      ${fila('Estado de la cuenta en La Cría',u.estado_cuenta==='bloqueada'?'⛔ Bloqueada':u.estado_cuenta==='suspendida'?'⏸️ Suspendida'+(u.sancion_hasta?' hasta el '+fechaCO(u.sancion_hasta):''):'✅ Activa')}${u.motivo_sancion?fila('Motivo de la sanción',esc(u.motivo_sancion)):''}
      </div>${v?`<div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap"><button class="btn btn-o btn-s" data-vend="${v.id}">Ver perfil público</button><button class="btn btn-o btn-s" data-irsol="1">Verificar vendedores</button></div>`:''}
      ${u.rol==='admin'?'':`<div class="sancion-box"><b>Sanciones</b><small>Úsalas cuando la persona incumpla los Términos o las Reglas de publicación.</small><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">${u.estado_cuenta&&u.estado_cuenta!=='activa'?`<button class="btn btn-v btn-s" data-sancion="activa" data-uid="${u.id}">✅ Reactivar cuenta</button>`:`<button class="btn btn-o btn-s" style="color:var(--mal)" data-sancion="suspendida" data-uid="${u.id}">⏸️ Suspender</button><button class="btn btn-o btn-s" style="color:var(--mal)" data-sancion="bloqueada" data-uid="${u.id}">⛔ Bloquear</button>`}<button class="btn btn-o btn-s" style="color:var(--mal)" data-eliminarcta="${u.id}">🗑 Eliminar cuenta</button></div></div>`}`);return}
  if(d.sancion){const est=d.sancion,uid=d.uid;
    if(est==='activa'){const {error}=await sb.rpc('sancionar',{p_usuario:uid,p_estado:'activa',p_motivo:null,p_hasta:null});if(error){err(error);return}cerrar();toast('✅ Cuenta reactivada');render();return}
    modal(`<h3>${est==='bloqueada'?'⛔ Bloquear cuenta':'⏸️ Suspender cuenta'}</h3><p style="color:var(--gris);margin:6px 0 10px">${est==='bloqueada'?'La persona no podrá entrar a La Cría y sus publicaciones se ocultan. Úsalo en casos graves (estafa, fauna silvestre, maltrato).':'La persona no podrá entrar ni publicar mientras dure la suspensión, y sus publicaciones se ocultan. Si pones fecha de fin, la cuenta se reactiva sola ese día.'}</p>
      <label style="font-weight:700;font-size:14px">Motivo (la persona lo verá) *</label><textarea class="campo" id="sanmot" rows="3" placeholder="Ej: Publicó un animal de fauna silvestre, lo cual está prohibido por las Reglas de publicación."></textarea>
      ${est==='suspendida'?'<label style="font-weight:700;font-size:14px;display:block;margin-top:10px">Suspender hasta (opcional)</label><input class="campo" id="sanhasta" type="date">':''}
      <button class="btn btn-p" style="width:100%;margin-top:14px;background:var(--mal)" data-confsancion="${est}" data-uid="${uid}">${est==='bloqueada'?'Bloquear cuenta':'Suspender cuenta'}</button>`);return}
  if(d.confsancion){const m=$('#sanmot').value.trim();if(!m){toast('Escribe el motivo');return}const h=$('#sanhasta')?$('#sanhasta').value||null:null;if(h&&h<=hoyISO()){toast('La fecha de fin debe ser después de hoy');return}
    const {error}=await sb.rpc('sancionar',{p_usuario:d.uid,p_estado:d.confsancion,p_motivo:m,p_hasta:h});if(error){err(error,'No se pudo aplicar');return}cerrar();toast(d.confsancion==='bloqueada'?'⛔ Cuenta bloqueada':'⏸️ Cuenta suspendida');render();return}
  if(d.eliminarcta){modal(`<h3>🗑 Eliminar cuenta</h3><p style="color:var(--gris);margin:6px 0 10px">Se borran la cuenta, el perfil, las publicaciones, los mensajes y los favoritos. <b>No se puede deshacer.</b> Para casos de incumplimiento normalmente es mejor <b>bloquear</b>, así la persona no puede volver a registrarse con ese correo.</p>
      <label style="font-weight:700;font-size:14px">Motivo *</label><textarea class="campo" id="elimot" rows="2" placeholder="Ej: Solicitud de la persona / estafa comprobada"></textarea>
      <label style="font-weight:700;font-size:14px;display:block;margin-top:10px">Para confirmar escribe ELIMINAR</label><input class="campo" id="eliconf" placeholder="ELIMINAR">
      <button class="btn btn-p" style="width:100%;margin-top:14px;background:var(--mal)" data-confeliminar="${d.eliminarcta}">Eliminar definitivamente</button>`);return}
  if(d.confeliminar){const m=$('#elimot').value.trim();if(!m){toast('Escribe el motivo');return}if($('#eliconf').value.trim().toUpperCase()!=='ELIMINAR'){toast('Escribe ELIMINAR para confirmar');return}
    b.disabled=true;const {error}=await sb.rpc('eliminar_cuenta',{p_usuario:d.confeliminar,p_motivo:m});b.disabled=false;if(error){err(error,'No se pudo eliminar');return}cerrar();toast('🗑 Cuenta eliminada');render();return}
  if(d.irsol){cerrar();S.sub='sol';S.filtroV='todos';render();return}
  if(d.filtrou){S.filtroU=d.filtrou;render();return}
  if(d.filtrot){S.filtroT=d.filtrot;render();return}
  if(d.treabrir){await sb.from('tickets').update({estado:'abierto'}).eq('id',d.treabrir);render();return}
  if(d.tcerrar){await sb.from('tickets').update({estado:'cerrado'}).eq('id',d.tcerrar);render();return}
  if(d.repquitar){await sb.from('publicaciones').update({estado:'rechazado'}).eq('id',d.pub);await sb.from('reportes').update({estado:'resuelto'}).eq('id',d.repquitar);toast('Publicación quitada');render();return}
  if(d.repdesc){await sb.from('reportes').update({estado:'descartado'}).eq('id',d.repdesc);render();return}
  if(d.vest){const upd={estado:d.val};if(d.val==='activo'){const {data:v}=await sb.from('vendedores').select('plan,pago_anual').eq('id',d.vest).single();upd.vence=venceDe(v.plan,v.pago_anual)}const {error}=await sb.from('vendedores').update(upd).eq('id',d.vest);if(error){err(error);return}toast('Estado actualizado');render();return}
  if(d.voficial){const {error}=await sb.from('vendedores').update({oficial:d.val==='1',estado:'activo'}).eq('id',d.voficial);if(error){err(error);return}toast(d.val==='1'?'★ Ahora es tienda oficial':'Ya no es tienda oficial');render();return}
  if(d.guardarconfig!==undefined){const ups=[{clave:'llave_breb',valor:$('#cf-llave').value.trim()},{clave:'titular_breb',valor:$('#cf-tit').value.trim()},{clave:'horas_activacion',valor:Number($('#cf-hor').value||24)}];let r=await sb.from('config').upsert(ups);if(r.error){err(r.error);return}for(const i of document.querySelectorAll('[data-cfplan]')){await sb.from('planes').update({precio:Number(i.value)}).eq('id',i.dataset.cfplan)}await cargarBase();toast('Configuración guardada');return}
  if(d.copiarllave!==undefined){try{await navigator.clipboard.writeText(CONFIG.llave_breb||'');toast('Llave copiada: '+(CONFIG.llave_breb||''))}catch(x){toast('Llave: '+(CONFIG.llave_breb||''))}return}
  if(d.quitarqr!==undefined){const {error}=await sb.from('config').upsert({clave:'qr_breb',valor:''});if(error){err(error);return}await cargarBase();toast('QR quitado');render();return}
  // soporte, reportes, compartir
  if(d.soporte!==undefined){modalSoporte();return}
  if(d.senviar!==undefined){const m=$('#smsg').value.trim();if(!m){toast('Cuéntanos qué pasó');return}const {error}=await sb.from('tickets').insert({usuario_id:S.sesion?S.sesion.user.id:null,nombre:$('#snom').value.trim(),contacto:$('#scor').value.trim(),tipo:$('#stipo').value,referencia:$('#sref').value.trim(),mensaje:m});if(error){err(error,'No se pudo enviar');return}cerrar();if(S.sesion){toast('🛟 Recibimos tu caso. Te respondemos en “Ayuda y soporte” de tu cuenta.');if(['panel','micuenta'].includes(S.view)&&S.sub==='soporte')render()}else toast('🛟 Recibimos tu caso. Te responderemos a tu correo.');return}
  if(d.reportar){modalReportar(d.reportar);return}
  if(d.envrep){const {error}=await sb.from('reportes').insert({publicacion_id:Number(d.envrep),usuario_id:S.sesion?S.sesion.user.id:null,motivo:$('#rmot').value,detalle:$('#rdet').value.trim()});if(error){err(error);return}cerrar();toast('Reporte enviado. Lo revisaremos pronto.');return}
  if(d.compartir){modalCompartir(urlBase()+'#animal-'+d.compartir,'esta publicación');return}
  if(d.compartirV){modalCompartir(urlBase()+'#vendedor-'+d.compartirV,'este vendedor');return}
  if(d.copiar!==undefined){try{await navigator.clipboard.writeText($('#shurl').value);toast('Enlace copiado')}catch(x){$('#shurl').select();toast('Selecciona y copia el enlace')}return}
  // campanita
  if(d.campana!==undefined){$('#pnotif').classList.toggle('on');return}
  if(d.notif){const n=S.notifs.find(x=>x.id==d.notif);if(n&&!n.leida){await sb.from('notificaciones').update({leida:true}).eq('id',n.id);n.leida=true}$('#pnotif').classList.remove('on');S.sub=n?n.seccion||'resumen':'resumen';go(esAdmin()?'admin':S.yo?'panel':'micuenta');return}
  if(d.leertodo!==undefined){const ids=S.notifs.filter(x=>!x.leida).map(x=>x.id);if(ids.length)await sb.from('notificaciones').update({leida:true}).in('id',ids);S.notifs.forEach(x=>x.leida=true);pintarCampana();$('#pnotif').classList.add('on');return}
  }catch(x){err(x)}
});
function guardarPasoRegSilencioso(){const R=S.reg,g=id=>{const el=$('#'+id);return el?el.value.trim():undefined};if(R.paso===3)datosCuentaReg(R,g);if(R.paso===4){Object.assign(R,{td:g('r-td'),nd:g('r-nd'),dir:g('r-dir')});if($('#r-decl'))R.decl=$('#r-decl').checked}if(R.paso===3)Object.assign(R,{nom:g('r-nom'),dep:g('r-dep'),mun:g('r-mun'),wa:g('r-wa'),ig:g('r-ig')??R.ig,an:g('r-an')??R.an,desc:g('r-desc')})}
document.addEventListener('keydown',e=>{if(e.target.id==='chattxt'&&e.key==='Enter'&&!e.shiftKey){e.preventDefault();enviarChat()}});
document.addEventListener('submit',async e=>{
  e.preventDefault();
  if(e.target.id==='buscar'){S.f={...filtrosVacios(),q:new FormData(e.target).get('q')||''};go('explorar')}
  if(e.target.id==='fpub') await publicar(e.target);
});
let tq;
document.addEventListener('input',e=>{if(e.target.id==='busu'){const q=norm(e.target.value).trim();document.querySelectorAll('#tablau tr[data-busca]').forEach(r=>r.style.display=!q||r.dataset.busca.includes(q)?'':'none');return}if(e.target.id==='fq'){clearTimeout(tq);tq=setTimeout(()=>{S.f.q=e.target.value;render()},500)}});
document.addEventListener('change',async e=>{
  const t=e.target, d=t.dataset;
  if(t.id==='fcat'){S.f={...filtrosVacios(),q:S.f.q,cat:t.value};render()}
  if(t.id==='fraza'){S.f.raza=t.value;render()}
  if(t.id==='fdepto'){S.f.depto=t.value;render()}
  if(t.id==='fmin'){S.f.min=t.value;render()}
  if(t.id==='fmax'){S.f.max=t.value;render()}
  if(t.id==='forden'){S.f.orden=t.value;render()}
  if(t.id==='pcat'){guardarFormPub();S.pub={...S.pub,cat:t.value,raza:'',tipo:(catDe(t.value).tipos||['ind'])[0]};S.pub.vals.apt=[];S.pub.vals.aptotra='';S.pub.vals.at={};render()}
  if(t.id==='praza'){guardarFormPub();S.pub.raza=t.value;render()}
  if(t.id==='aptotrachk'){const i=$('#aptotra');if(i){i.style.display=t.checked?'':'none';if(t.checked)i.focus()}}
  if(d.fotopadre){const f=t.files[0];if(!f)return;const m=validarArchivo(f,true);if(m){toast('No se pudo subir: '+m);return}guardarFormPub();S.pub.padres[d.fotopadre].foto=f;render();return}
  if(t.id==='pfotos'){const malos=[];for(const f of t.files){const m=validarArchivo(f,true);if(m)malos.push(m);else if(S.pub.fotos.length+(S.pub.fotosEx||[]).length<8)S.pub.fotos.push(f);else malos.push(f.name+' (máximo 8 fotos)')}if(malos.length)toast('No se pudo subir: '+malos.join(', '));$('#prevf').innerHTML=prevFotos();t.value=''}
  if(d.arch){const k=d.arch,multi=t.multiple,malos=[];let l=multi?listaArch(k).slice():[];for(const f of t.files){const m=validarArchivo(f,k==='fotos');if(m){malos.push(m);continue}if(multi&&l.length>=(ARCH_MAX[k]||6)){malos.push(f.name+' (máximo '+(ARCH_MAX[k]||6)+')');continue}if(multi)l.push(f);else l=[f]}
    if(malos.length)toast('No se pudo subir: '+malos.join(', '));if(!l.length)return;guardarPasoRegSilencioso();S.reg.arch[k]=multi?l:l[0];render()}
  if(d.banimg!==undefined){const f=t.files[0];if(!f)return;const m=validarArchivo(f,true);if(m){toast('No se pudo subir: '+m);return}S.banImg=f;const pv=$('#banform .ban-prev');if(pv)pv.innerHTML=`<img src="${URL.createObjectURL(f)}" alt="">`;t.closest('label').firstChild.textContent='⬆ Cambiar imagen';return}
  if(d.chatarch!==undefined){const f=t.files[0];t.value='';if(!f)return;const vid=f.type.startsWith('video/'),img=f.type.startsWith('image/');if(!vid&&!img){toast('Solo se pueden enviar fotos o videos');return}if(f.size>(vid?50:10)*1048576){toast(vid?'El video pesa más de 50 MB':'La foto pesa más de 10 MB');return}await enviarChat(f);return}
  if(d.subiravatar){const f=t.files[0];if(!f)return;const m=validarArchivo(f,true);if(m){toast('No se pudo subir: '+m);return}try{toast('Subiendo foto…');const vend=d.subiravatar==='logo',uid=S.sesion.user.id;const r=await subir('fotos',uid,await fotoCuadrada(f),true);const {error}=vend?await sb.from('vendedores').update({logo:r}).eq('id',uid):await sb.from('profiles').update({foto:r}).eq('id',uid);if(error)throw error;await cargarSesion();toast('✅ Foto guardada');render()}catch(x){err(x,'No se pudo subir la foto')}return}
  if(d.subirqr!==undefined){const f=t.files[0];if(!f)return;try{toast('Subiendo QR…');const r=await subir('fotos',S.sesion.user.id,f,true);const {error}=await sb.from('config').upsert({clave:'qr_breb',valor:r});if(error)throw error;await cargarBase();toast('✅ QR guardado');render()}catch(x){err(x,'No se pudo subir el QR')}return}
  if(d.renovar!==undefined){const f=t.files[0];if(!f)return;try{const v=S.yo,cam=esGratis(planDe(v.plan))&&S.cambio,np=cam?S.cambio.plan:v.plan,an=cam?!!S.cambio.anual:v.pago_anual,pl=planDe(np);toast('Subiendo comprobante…');const r=await subir('comprobantes',v.id,f);const {error}=await sb.from('pagos').insert({vendedor_id:v.id,plan:np,pago_anual:an,valor:an?pl.precio*10:pl.precio,comprobante:r});if(error)throw error;toast('Comprobante enviado. Te avisamos cuando se confirme.');render()}catch(x){err(x,'No se pudo subir')}}
});
$('#velo').addEventListener('click',e=>{if(e.target.id==='velo')cerrar()});

/* =====================================================================
   INICIO
   ===================================================================== */
/* revisa avisos nuevos de la campanita cada minuto, sin recargar la pantalla */
setInterval(async()=>{if(!S.sesion||document.hidden)return;const antes=S.notifs.filter(x=>!x.leida).length;await Promise.all([cargarNotifs(),contarNoLeidos()]);pintarCampana();pintarBadgeChat();const ahora=S.notifs.filter(x=>!x.leida).length;if(ahora>antes)toast('🔔 Tienes un aviso nuevo')},60000);
(async function iniciar(){
  sb.rpc('levantar_suspensiones').then(()=>{},()=>{});
  try{ await cargarBase(); await cargarSesion(); }
  catch(e){ $('#app').innerHTML=`<div class="wrap"><div class="vacio" style="margin:40px 0">😕 No pudimos conectar con La Cría. Revisa tu internet e intenta de nuevo.<br><small>${esc(e.message||e)}</small></div></div>`; return; }
  const h=(location.hash||'').slice(1);
  if(h.startsWith('animal-')){S.view='animal';S.param=h.slice(7)}
  else if(h.startsWith('vendedor-')){S.view='vendedor';S.param=h.slice(9)}
  else if(h.startsWith('legal-')){S.view='legal';S.param=h.slice(6)}
  else if(['explorar','categorias','planes','crear','vendedores'].includes(h)) S.view=h;
  try{history.replaceState({...fotoNav(),lc:1},'')}catch(e){}
  render();avisoBloqueo();
})();
