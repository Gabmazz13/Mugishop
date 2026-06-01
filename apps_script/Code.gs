/*
Apps Script para Google Sheets - Plantilla gestión de tienda de cuadros
Funciones principales:
- onOpen: añade menú personalizado
- setupTemplate: crea pestañas y encabezados si faltan
- addSale: pide datos de una venta por prompts y la registra
- addPurchase: pide datos de compra por prompts y la registra
- updateInventory: calcula stock disponible, ideal y orden de compra
- updatePricing: calcula precio sugerido por producto con margen
- updateDashboard: calcula ventas, costos, utilidades y stock bajo
- calculateProductPrice: calcula precio de venta deseado para profit
- calculateCombo: sugiere precio de combo con descuento
- updateAll: ejecuta inventory + pricing + dashboard
*/

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('MiTienda')
    .addItem('Setup template', 'setupTemplate')
    .addSeparator()
    .addItem('Agregar venta', 'addSale')
    .addItem('Agregar compra', 'addPurchase')
    .addSeparator()
    .addItem('Actualizar inventario', 'updateInventory')
    .addItem('Actualizar pricing', 'updatePricing')
    .addItem('Actualizar dashboard', 'updateDashboard')
    .addSeparator()
    .addItem('Calcular precio de venta', 'calculateProductPrice')
    .addItem('Calcular combo', 'calculateCombo')
    .addSeparator()
    .addItem('Actualizar todo', 'updateAll')
    .addToUi();
}

function setupTemplate() {
  var ss = SpreadsheetApp.getActive();
  var sheets = {
    Products: ['ProductID','Category','Name','Size','UnitCost','UnitPrice','StockAvailable','StockIdeal','FixedCostShare','TargetMargin'],
    Sales: ['Date','SaleID','ProductID','Name','Size','Quantity','UnitPrice','Total','Notes'],
    Purchases: ['Date','PurchaseID','ProductID','Name','Size','Quantity','UnitCost','Total','Supplier'],
    Inventory: ['ProductID','Name','Size','StockAvailable','StockIdeal','ToOrder','UnitCost','Value'],
    FixedCosts: ['Item','Category','MonthlyCost','Notes'],
    VariableCosts: ['Item','Category','Cost','Notes'],
    Pricing: ['ProductID','Name','UnitCost','FixedCostShare','TargetMargin','TotalCost','SuggestedPrice','ProfitPerUnit'],
    Dashboard: ['Metric','Value'],
    Settings: ['Key','Value']
  };

  for (var name in sheets) {
    var sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    var header = sh.getRange(1,1,1,sheets[name].length).getValues()[0];
    var needHeader = header.join('').trim() === '';
    if (needHeader) {
      sh.clear();
      sh.getRange(1,1,1,sheets[name].length).setValues([sheets[name]]);
    }
  }

  var settings = ss.getSheetByName('Settings');
  if (settings.getLastRow() === 1) {
    settings.getRange(1,1,5,2).setValues([
      ['Key','Value'],
      ['DefaultMarginPct',30],
      ['DefaultFixedCostShare',50],
      ['StockLowThreshold',2],
      ['DefaultOrderMultiplier',1]
    ]);
  }

  var fixed = ss.getSheetByName('FixedCosts');
  if (fixed.getLastRow() === 1) {
    fixed.getRange(2,1,5,4).setValues([
      ['Ferias','Gasto fijo',600,'Costo mensual de ferias'],
      ['Transporte','Gasto fijo',200,'Envíos y logística'],
      ['Material de corte','Gasto fijo',1265,'Costos de materiales generales'],
      ['Otros costos','Gasto fijo',100,'Gastos varios'],
      ['Costos por cuadro','Variable',7555,'Costo estándar por cuadro']
    ]);
  }

  var variable = ss.getSheetByName('VariableCosts');
  if (variable.getLastRow() === 1) {
    variable.getRange(2,1,6,4).setValues([
      ['Tira iman 100cm x 63cm','Insumo',0,'Registrar cuando compres plástico magnético'],
      ['Resma A3','Insumo',0,'Papel para sublimar'],
      ['Tinta sublimable','Insumo',0,'Tinta para impresora'],
      ['Adhesivo','Insumo',0,'Pegamentos y cinta'],
      ['Bolsas ecologicas','Embalaje',0,'Bolsas de tela o papel'],
      ['Celofan 35x45','Embalaje',0,'Envase transparente']
    ]);
  }

  SpreadsheetApp.getUi().alert('Template creado o actualizado. Ahora puedes agregar productos, ventas, compras y usar los botones del menú.');
}

function addSale() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActive();
  var products = ss.getSheetByName('Products');
  if (!products) { ui.alert('Falta la hoja "Products". Ejecuta Setup template.'); return; }

  var idResp = ui.prompt('Agregar venta','Ingrese ProductID (ej: C20X30):', ui.ButtonSet.OK_CANCEL);
  if (idResp.getSelectedButton() != ui.Button.OK) return;
  var productId = idResp.getResponseText().trim();
  if (!productId) { ui.alert('ProductID vacío. Operación cancelada.'); return; }

  var prod = findProduct(productId);
  var name = prod ? prod.Name : '';
  var size = prod ? prod.Size : '';
  var defaultPrice = prod && prod.UnitPrice ? prod.UnitPrice : '';

  var qtyResp = ui.prompt('Cantidad','Ingrese cantidad vendida:', ui.ButtonSet.OK_CANCEL);
  if (qtyResp.getSelectedButton() != ui.Button.OK) return;
  var qty = parseFloat(qtyResp.getResponseText());
  if (isNaN(qty) || qty<=0) { ui.alert('Cantidad inválida.'); return; }

  var priceResp = ui.prompt('Precio unitario','Ingrese precio unitario:', ui.ButtonSet.OK_CANCEL);
  if (priceResp.getSelectedButton() != ui.Button.OK) return;
  var unitPrice = parseFloat(priceResp.getResponseText() || defaultPrice);
  if (isNaN(unitPrice) || unitPrice<0) { ui.alert('Precio inválido.'); return; }

  var notesResp = ui.prompt('Notas (opcional)','Notas o cliente:', ui.ButtonSet.OK_CANCEL);
  var notes = notesResp.getSelectedButton()==ui.Button.OK ? notesResp.getResponseText() : '';

  var sales = ss.getSheetByName('Sales');
  var date = new Date();
  var saleId = Utilities.getUuid();
  var total = qty * unitPrice;
  sales.appendRow([date, saleId, productId, name, size, qty, unitPrice, total, notes]);

  updateInventory();
  updateDashboard();
  ui.alert('Venta registrada. Total: $' + total.toFixed(2));
}

function addPurchase() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActive();
  var products = ss.getSheetByName('Products');
  if (!products) { ui.alert('Falta la hoja "Products". Ejecuta Setup template.'); return; }

  var idResp = ui.prompt('Agregar compra','Ingrese ProductID (ej: C20X30):', ui.ButtonSet.OK_CANCEL);
  if (idResp.getSelectedButton() != ui.Button.OK) return;
  var productId = idResp.getResponseText().trim();
  if (!productId) { ui.alert('ProductID vacío. Operación cancelada.'); return; }

  var prod = findProduct(productId);
  var name = prod ? prod.Name : '';
  var size = prod ? prod.Size : '';
  var defaultCost = prod && prod.UnitCost ? prod.UnitCost : '';

  var qtyResp = ui.prompt('Cantidad','Ingrese cantidad comprada:', ui.ButtonSet.OK_CANCEL);
  if (qtyResp.getSelectedButton() != ui.Button.OK) return;
  var qty = parseFloat(qtyResp.getResponseText());
  if (isNaN(qty) || qty<=0) { ui.alert('Cantidad inválida.'); return; }

  var costResp = ui.prompt('Costo unitario','Ingrese costo unitario:', ui.ButtonSet.OK_CANCEL);
  if (costResp.getSelectedButton() != ui.Button.OK) return;
  var unitCost = parseFloat(costResp.getResponseText() || defaultCost);
  if (isNaN(unitCost) || unitCost<0) { ui.alert('Costo inválido.'); return; }

  var supResp = ui.prompt('Proveedor (opcional)','Ingrese nombre del proveedor:', ui.ButtonSet.OK_CANCEL);
  var supplier = supResp.getSelectedButton()==ui.Button.OK ? supResp.getResponseText() : '';

  var purchases = ss.getSheetByName('Purchases');
  var date = new Date();
  var purchaseId = Utilities.getUuid();
  var total = qty * unitCost;
  purchases.appendRow([date, purchaseId, productId, name, size, qty, unitCost, total, supplier]);

  updateInventory();
  updateDashboard();
  ui.alert('Compra registrada. Total: $' + total.toFixed(2));
}

function updateInventory() {
  var ss = SpreadsheetApp.getActive();
  var prodSh = ss.getSheetByName('Products');
  var invSh = ss.getSheetByName('Inventory');
  if (!prodSh || !invSh) return;

  var prods = prodSh.getDataRange().getValues();
  var rows = [];
  for (var i=1; i<prods.length; i++) {
    var r = prods[i];
    var pid = r[0];
    if (!pid) continue;
    var name = r[2];
    var size = r[3];
    var unitCost = parseFloat(r[4])||0;
    var stockAvailable = parseFloat(r[6])||0;
    var stockIdeal = parseFloat(r[7])||0;
    var toOrder = Math.max(stockIdeal - stockAvailable, 0);
    var value = stockAvailable * unitCost;
    rows.push([pid, name, size, stockAvailable, stockIdeal, toOrder, unitCost, value]);
  }

  invSh.clearContents();
  invSh.getRange(1,1,1,8).setValues([['ProductID','Name','Size','StockAvailable','StockIdeal','ToOrder','UnitCost','Value']]);
  if (rows.length > 0) invSh.getRange(2,1,rows.length,8).setValues(rows);
}

function updatePricing() {
  var ss = SpreadsheetApp.getActive();
  var prodSh = ss.getSheetByName('Products');
  var pricingSh = ss.getSheetByName('Pricing');
  if (!prodSh || !pricingSh) return;

  var prods = prodSh.getDataRange().getValues();
  var rows = [];
  for (var i=1; i<prods.length; i++) {
    var r = prods[i];
    var pid = r[0];
    if (!pid) continue;
    var name = r[2];
    var unitCost = parseFloat(r[4])||0;
    var fixedCostShare = parseFloat(r[8])||0;
    var targetMargin = parseFloat(r[9])||0;
    var totalCost = unitCost + fixedCostShare;
    var suggestedPrice = totalCost * (1 + targetMargin / 100);
    var profitPerUnit = suggestedPrice - totalCost;
    rows.push([pid, name, unitCost, fixedCostShare, targetMargin, totalCost, suggestedPrice, profitPerUnit]);
  }

  pricingSh.clearContents();
  pricingSh.getRange(1,1,1,8).setValues([['ProductID','Name','UnitCost','FixedCostShare','TargetMargin','TotalCost','SuggestedPrice','ProfitPerUnit']]);
  if (rows.length > 0) pricingSh.getRange(2,1,rows.length,8).setValues(rows);
}

function getSettings() {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName('Settings');
  var settings = {};
  if (!sheet) return settings;
  var data = sheet.getDataRange().getValues();
  for (var i=1; i<data.length; i++) {
    if (!data[i][0]) continue;
    settings[String(data[i][0]).trim()] = data[i][1];
  }
  return settings;
}

function updateDashboard() {
  var ss = SpreadsheetApp.getActive();
  var salesSh = ss.getSheetByName('Sales');
  var purchasesSh = ss.getSheetByName('Purchases');
  var fixedSh = ss.getSheetByName('FixedCosts');
  var variableSh = ss.getSheetByName('VariableCosts');
  var invSh = ss.getSheetByName('Inventory');
  var dashboard = ss.getSheetByName('Dashboard');
  var settings = getSettings();
  var threshold = parseFloat(settings['StockLowThreshold']) || 2;

  var totalSales = 0;
  var totalPurchases = 0;
  var fixedTotal = 0;
  var variableTotal = 0;
  var inventoryValue = 0;

  if (salesSh) {
    var s = salesSh.getDataRange().getValues();
    for (var i=1; i<s.length; i++) totalSales += parseFloat(s[i][7])||0;
  }
  if (purchasesSh) {
    var p = purchasesSh.getDataRange().getValues();
    for (var j=1; j<p.length; j++) totalPurchases += parseFloat(p[j][7])||0;
  }
  if (fixedSh) {
    var f = fixedSh.getDataRange().getValues();
    for (var k=1; k<f.length; k++) fixedTotal += parseFloat(f[k][2])||0;
  }
  if (variableSh) {
    var v = variableSh.getDataRange().getValues();
    for (var m=1; m<v.length; m++) variableTotal += parseFloat(v[m][2])||0;
  }
  if (invSh) {
    var inv = invSh.getDataRange().getValues();
    for (var n=1; n<inv.length; n++) inventoryValue += parseFloat(inv[n][7])||0;
  }

  var grossProfit = totalSales - totalPurchases;
  var netProfit = grossProfit - fixedTotal - variableTotal;

  dashboard.clearContents();
  var metrics = [
    ['Metric','Value'],
    ['Ventas totales', totalSales],
    ['Costo de ventas', totalPurchases],
    ['Costo fijo total', fixedTotal],
    ['Costo variable total', variableTotal],
    ['Utilidad bruta', grossProfit],
    ['Utilidad neta', netProfit],
    ['Valor inventario', inventoryValue]
  ];
  dashboard.getRange(1,1,metrics.length,2).setValues(metrics);

  var low = [];
  if (invSh) {
    var inv = invSh.getDataRange().getValues();
    for (var q=1; q<inv.length; q++) {
      var stock = parseFloat(inv[q][3])||0;
      if (stock <= threshold) low.push([inv[q][0], inv[q][1], inv[q][2], stock]);
    }
  }
  var startRow = metrics.length + 2;
  dashboard.getRange(startRow,1,1,4).setValues([['Stock bajo','ProductID','Name','Stock']]);
  if (low.length > 0) dashboard.getRange(startRow+1,1,low.length,4).setValues(low);
}

function updateAll() {
  updateInventory();
  updatePricing();
  updateDashboard();
  SpreadsheetApp.getUi().alert('Inventario, pricing y dashboard actualizados.');
}

function findProduct(productId) {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName('Products');
  if (!sh) return null;
  var data = sh.getDataRange().getValues();
  for (var i=1; i<data.length; i++) {
    if (String(data[i][0]).trim() == String(productId).trim()) {
      return {
        ProductID: data[i][0],
        Category: data[i][1],
        Name: data[i][2],
        Size: data[i][3],
        UnitCost: data[i][4],
        UnitPrice: data[i][5],
        StockAvailable: data[i][6],
        StockIdeal: data[i][7],
        FixedCostShare: data[i][8],
        TargetMargin: data[i][9]
      };
    }
  }
  return null;
}

function calculateProductPrice() {
  var ui = SpreadsheetApp.getUi();
  var settings = getSettings();
  var prodIdResp = ui.prompt('Cálculo de precio','Ingrese ProductID a calcular:', ui.ButtonSet.OK_CANCEL);
  if (prodIdResp.getSelectedButton() != ui.Button.OK) return;
  var productId = prodIdResp.getResponseText().trim();
  if (!productId) return;

  var prod = findProduct(productId);
  if (!prod) { ui.alert('Producto no encontrado.'); return; }

  var cost = parseFloat(prod.UnitCost) || 0;
  var defaultMargin = parseFloat(prod.TargetMargin) || parseFloat(settings['DefaultMarginPct']) || 30;
  var defaultFixedShare = parseFloat(prod.FixedCostShare) || parseFloat(settings['DefaultFixedCostShare']) || 0;

  var marginResp = ui.prompt('Margen deseado (%)','Ingrese margen sobre costo (%), valor por defecto: ' + defaultMargin, ui.ButtonSet.OK_CANCEL);
  if (marginResp.getSelectedButton() != ui.Button.OK) return;
  var marginPct = parseFloat(marginResp.getResponseText()) || defaultMargin;

  var fixedResp = ui.prompt('Costo fijo por unidad','Ingrese costo fijo asignado por unidad (valor por defecto: ' + defaultFixedShare + ')', ui.ButtonSet.OK_CANCEL);
  if (fixedResp.getSelectedButton() != ui.Button.OK) return;
  var fixedShare = parseFloat(fixedResp.getResponseText()) || defaultFixedShare;

  var totalCost = cost + fixedShare;
  var suggestedPrice = totalCost * (1 + marginPct / 100);
  var profit = suggestedPrice - totalCost;
  var message = 'Producto: ' + prod.Name + ' (' + prod.ProductID + ')\n';
  message += 'Costo base: $' + cost.toFixed(2) + '\n';
  message += 'Costo fijo asignado: $' + fixedShare.toFixed(2) + '\n';
  message += 'Costo total por unidad: $' + totalCost.toFixed(2) + '\n';
  message += 'Margen deseado: ' + marginPct.toFixed(2) + '%\n';
  message += 'Precio sugerido: $' + suggestedPrice.toFixed(2) + '\n';
  message += 'Ganancia por unidad: $' + profit.toFixed(2);

  ui.alert('Precio sugerido', message, ui.ButtonSet.OK);
}

function calculateCombo() {
  var ui = SpreadsheetApp.getUi();
  var productIdsResp = ui.prompt('Combo de productos','Ingrese ProductID separados por coma (ej: C20X30,IM_RED):', ui.ButtonSet.OK_CANCEL);
  if (productIdsResp.getSelectedButton() != ui.Button.OK) return;
  var ids = productIdsResp.getResponseText().split(',').map(function(item){return item.trim();}).filter(Boolean);
  if (ids.length == 0) return;

  var qtyResp = ui.prompt('Cantidades','Ingrese cantidades para cada producto en el mismo orden, separadas por coma (ej: 1,2):', ui.ButtonSet.OK_CANCEL);
  if (qtyResp.getSelectedButton() != ui.Button.OK) return;
  var qtys = qtyResp.getResponseText().split(',').map(function(item){return parseFloat(item.trim())||1;});
  while (qtys.length < ids.length) qtys.push(1);

  var discountResp = ui.prompt('Descuento combo (%)','Ingrese descuento sobre precio sugerido total (ej: 10):', ui.ButtonSet.OK_CANCEL);
  if (discountResp.getSelectedButton() != ui.Button.OK) return;
  var discount = parseFloat(discountResp.getResponseText()) || 0;

  var totalCost = 0;
  var totalSuggested = 0;
  var lines = [];
  for (var i=0; i<ids.length; i++) {
    var pid = ids[i];
    var qty = qtys[i];
    var prod = findProduct(pid);
    if (!prod) continue;
    var cost = parseFloat(prod.UnitCost) || 0;
    var margin = parseFloat(prod.TargetMargin) || 0;
    var fixedShare = parseFloat(prod.FixedCostShare) || 0;
    var suggestedPrice = (cost + fixedShare) * (1 + margin / 100);
    totalCost += (cost + fixedShare) * qty;
    totalSuggested += suggestedPrice * qty;
    lines.push(qty + ' x ' + prod.Name + ' @ $' + suggestedPrice.toFixed(2));
  }
  var bundlePrice = totalSuggested * (1 - discount / 100);
  var bundleProfit = bundlePrice - totalCost;
  var message = 'Productos en combo:\n' + lines.join('\n') + '\n\n';
  message += 'Costo total combos: $' + totalCost.toFixed(2) + '\n';
  message += 'Precio sugerido sin descuento: $' + totalSuggested.toFixed(2) + '\n';
  message += 'Descuento combo: ' + discount.toFixed(2) + '%\n';
  message += 'Precio sugerido con descuento: $' + bundlePrice.toFixed(2) + '\n';
  message += 'Ganancia estimada: $' + bundleProfit.toFixed(2);

  ui.alert('Combo calculado', message, ui.ButtonSet.OK);
}
