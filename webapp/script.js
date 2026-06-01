// Simple SPA using localStorage
const STORAGE_KEY = 'mugi_data_v1';
const AUTH_KEY = 'mugi_auth_v1';
let state = {products:[], fixedCosts:[], variableCosts:[], settings:{defaultMargin:30, defaultFixedShare:10, stockThreshold:2}, auth:{loggedIn:false}};

function save(){localStorage.setItem(STORAGE_KEY, JSON.stringify(state));localStorage.setItem(AUTH_KEY, JSON.stringify(state.auth));}
function load(){const v=localStorage.getItem(STORAGE_KEY);if(v){state=JSON.parse(v);}else{seed();save();}
 const auth=localStorage.getItem(AUTH_KEY);state.auth=auth?JSON.parse(auth):{loggedIn:false};}

function seed(){state.products=[
  {productId:'LAM20B',name:'Lamina aluminio 20x30 blanca',size:'20x30',unitCost:5.49,unitPrice:12,stockAvailable:20,stockIdeal:40,fixedCostShare:2,targetMargin:30},
  {productId:'LAM20I',name:'Lamina aluminio 20x30 impresa',size:'20x30',unitCost:15,unitPrice:30,stockAvailable:10,stockIdeal:30,fixedCostShare:3,targetMargin:40},
];
state.fixedCosts=[{item:'Ferias',monthlyCost:600,notes:'Ferias y eventos'}];
state.variableCosts=[];
}

function toggleMenu(open){const menu = document.getElementById('sideMenu');if(open){menu.classList.add('open');menu.setAttribute('aria-hidden','false');}else{menu.classList.remove('open');menu.setAttribute('aria-hidden','true');}}
function updateAuthUi(){const loginButton = document.getElementById('loginButton'); const menuToggle = document.getElementById('menuToggle'); if(state.auth.loggedIn){loginButton.textContent='Cerrar sesión'; menuToggle.style.display='inline-flex'; document.body.classList.add('auth-active');} else {loginButton.textContent='Iniciar sesión'; menuToggle.style.display='none'; document.body.classList.remove('auth-active'); toggleMenu(false);}}
function showPrivatePage(){const loggedIn = state.auth.loggedIn; const loginPanel = document.getElementById('loginPanel'); const privateData = document.getElementById('privateData'); if(loggedIn){loginPanel.style.display='none';privateData.style.display='block';} else {loginPanel.style.display='block';privateData.style.display='none';}}

// DOM helpers
function $(sel,root=document) {return root.querySelector(sel);} 
function $all(sel,root=document){return Array.from(root.querySelectorAll(sel));}

// Tabs
$all('nav button').forEach(btn=>btn.addEventListener('click',()=>{ $all('nav button').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); showTab(btn.dataset.tab);}));
function showTab(name){ if(name !== 'private' && !state.auth.loggedIn){ alert('Necesitas iniciar sesión para acceder a esta área.'); name = 'private'; $all('nav button').forEach(b=>b.classList.remove('active')); $all('nav button[data-tab="private"]').forEach(b=>b.classList.add('active')); }
  $all('.tab').forEach(t=>t.style.display='none'); if(name==='private'){showPrivatePage();} $(`#${name}`).style.display='block'; toggleMenu(false); }

// Products
function renderProducts(){const tbody=$('#productsTable tbody');tbody.innerHTML='';state.products.forEach(p=>{const tr=document.createElement('tr');tr.innerHTML=`<td>${p.productId}</td><td>${p.name}</td><td>${p.size||''}</td><td>${p.unitCost||0}</td><td>${p.unitPrice||0}</td><td>${p.stockAvailable||0}</td><td>${p.stockIdeal||0}</td><td><button data-id="${p.productId}" class="edit">Editar</button> <button data-id="${p.productId}" class="del">Borrar</button></td>`;tbody.appendChild(tr);} );
 $all('.edit').forEach(b=>b.addEventListener('click',e=>editProduct(e.target.dataset.id)));
 $all('.del').forEach(b=>b.addEventListener('click',e=>{if(confirm('Borrar producto?')){deleteProduct(e.target.dataset.id);}}));}

function editProduct(id){const p=state.products.find(x=>x.productId===id);if(!p) return;const f=document.forms['productForm'];f.productId.value=p.productId;f.name.value=p.name;f.size.value=p.size;f.unitCost.value=p.unitCost;f.unitPrice.value=p.unitPrice;f.stockAvailable.value=p.stockAvailable;f.stockIdeal.value=p.stockIdeal;f.fixedCostShare.value=p.fixedCostShare;f.targetMargin.value=p.targetMargin;}
function deleteProduct(id){state.products=state.products.filter(x=>x.productId!==id);save();renderProducts();renderInventory();renderPricing();}

document.getElementById('productForm').addEventListener('submit',e=>{e.preventDefault();const f=e.target;const prod={productId:f.productId.value.trim(),name:f.name.value.trim(),size:f.size.value,unitCost:parseFloat(f.unitCost.value)||0,unitPrice:parseFloat(f.unitPrice.value)||0,stockAvailable:parseFloat(f.stockAvailable.value)||0,stockIdeal:parseFloat(f.stockIdeal.value)||0,fixedCostShare:parseFloat(f.fixedCostShare.value)||parseFloat(state.settings.defaultFixedShare)||0,targetMargin:parseFloat(f.targetMargin.value)||parseFloat(state.settings.defaultMargin)||30};const idx=state.products.findIndex(x=>x.productId===prod.productId);if(idx>=0) state.products[idx]=prod; else state.products.push(prod);save();renderProducts();renderInventory();renderPricing();f.reset();});

// Inventory
function renderInventory(){const tbody=$('#inventoryTable tbody');tbody.innerHTML='';state.products.forEach(p=>{const toOrder=Math.max((p.stockIdeal||0)-(p.stockAvailable||0),0);const tr=document.createElement('tr');tr.innerHTML=`<td>${p.productId}</td><td>${p.name}</td><td>${p.stockAvailable||0}</td><td>${p.stockIdeal||0}</td><td>${toOrder}</td>`;tbody.appendChild(tr);});}
$('#refreshInventory').addEventListener('click',()=>renderInventory());

// Costs
function renderCosts(){const fixed=$('#fixedList');fixed.innerHTML='';state.fixedCosts.forEach((f,i)=>{const li=document.createElement('li');li.textContent=`${f.item}: $${f.monthlyCost}`;const b=document.createElement('button');b.textContent='B';b.addEventListener('click',()=>{state.fixedCosts.splice(i,1);save();renderCosts();});li.appendChild(b);fixed.appendChild(li);});
const varlist=$('#variableList');varlist.innerHTML='';state.variableCosts.forEach((v,i)=>{const li=document.createElement('li');li.textContent=`${v.item}: $${v.cost}`;const b=document.createElement('button');b.textContent='B';b.addEventListener('click',()=>{state.variableCosts.splice(i,1);save();renderCosts();});li.appendChild(b);varlist.appendChild(li);});}

document.getElementById('fixedForm').addEventListener('submit',e=>{e.preventDefault();const data={item:e.target.item.value,monthlyCost:parseFloat(e.target.monthlyCost.value)||0,notes:''};state.fixedCosts.push(data);save();renderCosts();e.target.reset();});
document.getElementById('variableForm').addEventListener('submit',e=>{e.preventDefault();const data={item:e.target.item.value,cost:parseFloat(e.target.cost.value)||0,notes:''};state.variableCosts.push(data);save();renderCosts();e.target.reset();});

// Settings
function renderSettings(){ $('#defaultMargin').value=state.settings.defaultMargin; $('#defaultFixedShare').value=state.settings.defaultFixedShare; $('#stockThreshold').value=state.settings.stockThreshold; }
$('#saveSettings').addEventListener('click',()=>{state.settings.defaultMargin=parseFloat($('#defaultMargin').value)||30;state.settings.defaultFixedShare=parseFloat($('#defaultFixedShare').value)||10;state.settings.stockThreshold=parseFloat($('#stockThreshold').value)||2;save();alert('Ajustes guardados');renderPricing();renderInventory();});

// Pricing
function renderPricing(){const tbody=$('#pricingTable tbody');tbody.innerHTML='';state.products.forEach(p=>{const fixedShare = parseFloat(p.fixedCostShare||state.settings.defaultFixedShare)||0;const margin = parseFloat(p.targetMargin||state.settings.defaultMargin)||30;const totalCost = (parseFloat(p.unitCost)||0) + fixedShare;const suggested = totalCost * (1 + margin/100);const profit = suggested - totalCost;const tr=document.createElement('tr');tr.innerHTML=`<td>${p.productId}</td><td>${p.name}</td><td>${p.unitCost}</td><td>${fixedShare}</td><td>${margin}</td><td>${suggested.toFixed(2)}</td><td>${profit.toFixed(2)}</td>`;tbody.appendChild(tr);});}

$('#pricingCalc').addEventListener('submit',e=>{e.preventDefault();const id=$('#priceProductId').value.trim();const p=state.products.find(x=>x.productId===id);if(!p){alert('Producto no encontrado');return;}const fixedShare=parseFloat(p.fixedCostShare||state.settings.defaultFixedShare)||0;const margin=parseFloat(p.targetMargin||state.settings.defaultMargin)||30;const cost=parseFloat(p.unitCost)||0;const totalCost=cost+fixedShare;const suggested=totalCost*(1+margin/100);const profit=suggested-totalCost;$('#pricingResult').textContent=`Producto: ${p.name}\nCosto base: $${cost.toFixed(2)}\nCosto fijo asignado: $${fixedShare.toFixed(2)}\nCosto total: $${totalCost.toFixed(2)}\nMargen: ${margin}%\nPrecio sugerido: $${suggested.toFixed(2)}\nGanancia por unidad: $${profit.toFixed(2)}`;});
$('#refreshPricing').addEventListener('click',()=>renderPricing());

// Combos
document.getElementById('comboForm').addEventListener('submit',e=>{e.preventDefault();const ids=$('#comboIds').value.split(',').map(s=>s.trim()).filter(Boolean);let qtys=$('#comboQtys').value.split(',').map(s=>parseFloat(s.trim())||1);while(qtys.length<ids.length) qtys.push(1);const discount=parseFloat($('#comboDiscount').value)||0;let totalCost=0;let totalSuggested=0;let lines=[];ids.forEach((id,i)=>{const p=state.products.find(x=>x.productId===id);if(!p) return;const qty=qtys[i]||1;const fixedShare=parseFloat(p.fixedCostShare||state.settings.defaultFixedShare)||0;const margin=parseFloat(p.targetMargin||state.settings.defaultMargin)||30;const cost=parseFloat(p.unitCost)||0;const suggested=(cost+fixedShare)*(1+margin/100);totalCost+=(cost+fixedShare)*qty;totalSuggested+=suggested*qty;lines.push(`${qty} x ${p.name} @ $${suggested.toFixed(2)}`);} );const bundlePrice=totalSuggested*(1-discount/100);const bundleProfit=bundlePrice-totalCost;$('#comboResult').textContent=`Productos:\n${lines.join('\n')}\n\nCosto total: $${totalCost.toFixed(2)}\nPrecio sin descuento: $${totalSuggested.toFixed(2)}\nDescuento: ${discount}%\nPrecio final: $${bundlePrice.toFixed(2)}\nGanancia estimada: $${bundleProfit.toFixed(2)}`;});

// Auth and menu controls
document.getElementById('menuToggle').addEventListener('click',()=>toggleMenu(true));
document.getElementById('closeMenu').addEventListener('click',()=>toggleMenu(false));
document.getElementById('loginButton').addEventListener('click',()=>{if(state.auth.loggedIn){state.auth.loggedIn=false;save();updateAuthUi();showPrivatePage();alert('Sesión cerrada');} else {showTab('private'); $all('nav button').forEach(b=>b.classList.remove('active')); $all('nav button[data-tab="private"]').forEach(b=>b.classList.add('active'));}}
);
document.getElementById('loginForm').addEventListener('submit',e=>{e.preventDefault();const username=e.target.username.value.trim();const password=e.target.password.value.trim();if(username==='Mugishop' && password==='JoseJoseYPimpinela'){state.auth.loggedIn=true;save();updateAuthUi();showPrivatePage();$all('nav button').forEach(b=>b.classList.remove('active')); $all('nav button[data-tab="products"]').forEach(b=>b.classList.add('active'));showTab('products');alert('Acceso concedido');} else {alert('Usuario o contraseña incorrectos');}});
document.getElementById('logoutButton').addEventListener('click',()=>{state.auth.loggedIn=false;save();updateAuthUi();showPrivatePage();$all('nav button').forEach(b=>b.classList.remove('active')); $all('nav button[data-tab="private"]').forEach(b=>b.classList.add('active'));showTab('private');alert('Has cerrado sesión');});

// Init
load();renderProducts();renderInventory();renderCosts();renderSettings();renderPricing();updateAuthUi();showTab('private');

// expose for debugging
window.mugiState=state;