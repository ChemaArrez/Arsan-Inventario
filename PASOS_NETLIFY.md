# Inventario Arsan Motors · Cómo publicarlo en Netlify

La app tiene dos partes y las dos viven en Netlify, sin pagar ni contratar nada extra:

- **Frontend**: `public/index.html`, la pantalla que abre la gente en el celular.
- **Backend**: `netlify/functions/api.mjs`, que guarda todo en **Netlify Blobs**, la base de datos de Netlify. Ahí quedan las piezas, los folios y las fotos, compartidos por todos.

> **Importante:** Netlify **no corre funciones si arrastras la carpeta** (deploy de "drag & drop"). Por eso se publica conectando un repositorio de GitHub. Se hace una sola vez y desde el navegador, sin instalar nada.

---

## 1. Subir el proyecto a GitHub (5 min)

1. Entra a <https://github.com> e inicia sesión (o crea una cuenta gratis).
2. Arriba a la derecha da clic en **+ → New repository**.
3. En el nombre pon `inventario-arsan`, márcalo como **Private** y da clic en **Create repository**.
4. En la página del repositorio vacío da clic en **uploading an existing file**.
5. Descomprime el .zip en tu computadora. Abre la carpeta `inventario-arsan` y **arrastra todo su contenido** a la página de GitHub (`public`, `netlify`, `netlify.toml`, `package.json`, `.gitignore`, `PASOS_NETLIFY.md`). Arrastra el contenido de la carpeta, no la carpeta.
6. Da clic en **Commit changes**.

Verifica que en GitHub se vean `netlify.toml` y `package.json` en la raíz y las carpetas `public/` y `netlify/functions/`.

## 2. Crear el sitio en Netlify (5 min)

1. Entra a <https://app.netlify.com> e inicia sesión. Puedes entrar con tu cuenta de GitHub.
2. Ve a **Add new project → Import an existing project → GitHub**.
3. Autoriza a Netlify y elige el repositorio `inventario-arsan`.
4. En la configuración deja todo como viene: Netlify lee `netlify.toml` solo. *Publish directory* debe decir `public` y *Functions directory* `netlify/functions`.
5. **Antes de desplegar**, abre **Environment variables → Add variable**:
   - Key: `INVENTARIO_PIN`
   - Value: el PIN que va a usar tu equipo, por ejemplo `4821`. Usa uno que no sea obvio.
6. Da clic en **Deploy**. Tarda 1 o 2 minutos.

Si ya desplegaste sin la variable, agrégala en **Project configuration → Environment variables** y luego ve a **Deploys → Trigger deploy → Deploy project** para que la tome.

## 3. Ponerle un nombre fácil (opcional)

**Project configuration → Change project name** → por ejemplo `inventario-arsan`. La dirección queda así: `https://inventario-arsan.netlify.app`.

## 4. Probar antes de repartirlo

1. Abre la dirección en tu celular y escribe el PIN.
2. Captura una pieza de prueba con foto y revisa que reciba el folio `ARS-…-0001`.
3. Ábrela en otro celular o en la computadora: la pieza debe aparecer ahí también.
4. Bórrala desde **Inventario → tocar la pieza → Eliminar**.

Si aparece "Falta configurar la variable INVENTARIO_PIN", regresa al paso 2.5.

## 5. Repartirlo al equipo

- Manda por WhatsApp **la dirección y el PIN**. No mandes el archivo .html: ese archivo no lleva los datos.
- En el celular de cada quien: abre la dirección en Chrome (Android) o Safari (iPhone), luego **Compartir / ⋮ → Agregar a pantalla de inicio**. Así queda como una app.
- Cada quien escribe su nombre en "Quién captura" una sola vez.

## Cómo funciona en el día a día

- **Folios**: los asigna el servidor (`ARS-DAD-0001`, `ARS-MAN-0001`…). Dos personas capturando al mismo tiempo nunca reciben el mismo folio.
- **Sin señal**: lo capturado se queda en ese celular con un folio temporal `PEND-…` y se sube solo cuando regresa la señal. Mientras quede algo pendiente se ve un aviso amarillo. **No borren datos del navegador mientras ese aviso esté visible.**
- **Actualizar**: la app se actualiza sola cada ~45 segundos. Tocar el indicador de conexión (arriba a la derecha) la actualiza en ese momento.
- **Excel**: Avance → **Descargar Excel (CSV)**. Guárdalo en `AM/04_OPERACION/07_Herramienta_y_equipo/[sucursal]/`.
- **Etiquetas QR**: Etiquetas → **Imprimir etiquetas**. Imprime al **100 % / tamaño real** en hojas carta de 30 etiquetas (tipo 5160). Primero haz una prueba en hoja normal.
- **Respaldo completo**: con el PIN puedes abrir `https://TU-SITIO.netlify.app/api/export`. Para eso necesitas mandar el PIN como encabezado `x-pin`, así que es más fácil usar el CSV.

## Cambiar el PIN

Cambia `INVENTARIO_PIN` en Netlify y vuelve a desplegar (Deploys → Trigger deploy). A cada celular se le pedirá el PIN nuevo la siguiente vez que abra la app.

## Hacer cambios a la app después

Edita el archivo en GitHub (por ejemplo `public/index.html`) y da clic en **Commit**. Netlify vuelve a publicar solo en 1 o 2 minutos. **Los datos no se pierden**, porque viven en Netlify Blobs y no en el archivo.

## Límites a tener en cuenta

- El plan gratis de Netlify alcanza de sobra para 7 personas y unos miles de piezas.
- Las fotos se reducen a ~720 px antes de subir, para que no pesen.
- El PIN es un candado sencillo y es el mismo para todos. No guardes en la app nada confidencial como costos o datos de personal.
