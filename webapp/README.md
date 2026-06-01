Plantilla Google Sheets para gestión de emprendimiento - Cuadros metálicos

Objetivo
- Gestionar inventario, compras y ventas.
- Calcular precios con profit y manejar gastos fijos y variables.
- Tener stock disponible, stock ideal y cálculo de compra para llegar al ideal.

Archivos clave
- `apps_script/Code.gs`: script para Google Sheets con funciones de menú.
- `Mugi_template.xlsx`: archivo listo para subir a Google Drive.
- `data/products.csv`, `data/sales.csv`, `data/purchases.csv`: ejemplos básicos.

Qué hace esta plantilla
- Crea hojas para Productos, Ventas, Compras, Inventario, Costos Fijos, Costos Variables, Pricing, Dashboard y Configuración.
- Calcula cuánto hay que comprar para llegar al stock ideal.
- Permite ingresar gastos fijos y variables.
- Sugerir precio de venta con margen y costo fijo por unidad.
- Calcular combos de productos con descuento.

Pasos para usar en Google Sheets
1) Subí `Mugi_template.xlsx` a Google Drive y abrilo con Google Sheets.
2) Abre Extensiones > Apps Script.
3) Copia el contenido de `apps_script/Code.gs` al editor de Apps Script y guarda.
4) Ejecuta la función `setupTemplate` desde el editor (esto creará o validará las hojas).
5) Vuelve a la hoja de cálculo y recarga si no ves el menú `MiTienda`.

Menú de Google Sheets
- `Setup template`: crea las hojas y valores base.
- `Agregar venta`: registra una venta en la hoja `Sales`.
- `Agregar compra`: registra una compra en la hoja `Purchases`.
- `Actualizar inventario`: recarga la hoja `Inventory` según stock y stock ideal.
- `Actualizar pricing`: recarga la hoja `Pricing` con precios sugeridos y profit.
- `Actualizar dashboard`: actualiza métricas de ventas, costos, utilidades y stocks bajos.
- `Calcular precio de venta`: calcula un precio sugerido para un producto.
- `Calcular combo`: arma un combo de productos con descuento y calcula ganancia.
- `Actualizar todo`: actualiza inventario, pricing y dashboard en un solo paso.

Hojas importantes

Products
- `ProductID`: código único (ej: C20X30, IM_RED).
- `Category`: categoría del producto.
- `Name`: nombre legible.
- `Size`: tamaño o presentación.
- `UnitCost`: costo base de producción.
- `UnitPrice`: precio sugerido estándar.
- `StockAvailable`: stock actual disponible.
- `StockIdeal`: stock ideal para mantener.
- `FixedCostShare`: costo fijo asignado por unidad.
- `TargetMargin`: margen objetivo en %.

Inventory
- `StockAvailable`: stock real.
- `StockIdeal`: stock deseado.
- `ToOrder`: cantidad que debes comprar para alcanzar el stock ideal.

FixedCosts
- Registra gastos fijos como ferias, transporte, gastos mensuales.
- El total se muestra en el Dashboard.

VariableCosts
- Registra insumos y gastos por producto.
- Ej: tiras de imán, resma A3, tinta, adhesivo, bolsas, celofán.

Pricing
- Muestra el precio sugerido por producto según costo base, costo fijo y margen.
- Calcula ganancia por unidad.

Dashboard
- Muestra ventas totales, costo de ventas, costo fijo, costo variable, utilidad bruta, utilidad neta e inventario.
- Lista productos con stock bajo.

Settings
- `DefaultMarginPct`: margen por defecto cuando calculas precios.
- `DefaultFixedCostShare`: costo fijo por unidad por defecto.
- `StockLowThreshold`: umbral para stock bajo.

Ideas de uso
- En `Products` ingresa tus materiales e inventario actual.
- En `FixedCosts` anota tus costos fijos mensuales.
- En `VariableCosts` anota gastos de materiales que no estén en tu inventario.
- Usa `Calcular precio de venta` para saber cuánto cobrar por un cuadro.
- Usa `Calcular combo` para ver cuánto conviene vender un paquete de cuadro + imanes + bolsa.
- Actualiza todo periódicamente con `Actualizar todo`.

Sugerencia práctica
- Para tu situación, carga en `Products` los materiales:
  - Laminas aluminio 20x30 blanca
  - Laminas aluminio 20x30 impresa
  - Laminas aluminio 30x40 blanca
  - Laminas aluminio 30x40 impresa
  - Laminas hierro 8x15
  - Tira iman 100cm x 63cm
  - Resma A3 sticker
  - Tinta sublimable
  - Pad de iman cortados
  - Bolsas de tela
  - Bolsa 30x20
  - Bolsa 10x15
  - Impresión 30x40
- Agrega los costos unitarios y stock ideal para cada item.
- Luego usa `updateAll` para ver el dashboard y la necesidad de compras.

Archivo listo para subir
- El archivo `Mugi_template.xlsx` ya está generado en esta carpeta.
- Es el archivo que podés subir directamente a Google Drive.

Si querés, también puedo:
- generar un ZIP con todo el proyecto,
- crear un archivo de ejemplo con todos los ítems y costos específicos que escribiste,
- o armar una mini plantilla con tus combos de cuadro + imán + bolsa ya definidos.
