Instrucciones: página web local para Mugi

Qué es
- Página web estática que funciona sin servidor y guarda datos en `localStorage`.
- Permite: gestionar productos, ver inventario (stock/ideal/por ordenar), declarar costos fijos y variables, calcular precios sugeridos y combos.

Cómo usar
1) Abre `webapp/index.html` en tu navegador (doble click o "Abrir con -> navegador").
2) La primera vez se cargan datos de ejemplo.
3) Agrega/edita productos en la pestaña "Productos".
4) En "Costos" añade gastos fijos y variables y ajusta los parámetros por defecto.
5) Usa "Pricing" para calcular precios por producto y actualizar la tabla.
6) Usa "Combos" para armar combos y ver precio final y ganancia estimada.

Persistencia
- Los datos se guardan en el navegador (localStorage). Si querés migrarlos, copia /exporta manualmente desde la consola (window.mugiState).

Siguiente paso (opcional)
- Puedo convertir esto en una aplicación con backend (Node.js + SQLite) o desplegarla en Netlify/Vercel y conectar Firestore para sincronización entre dispositivos.
