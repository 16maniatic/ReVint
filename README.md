<p align="center">
  <img src="icons/icon128.png" width="96" alt="Icono de ReVint">
</p>

<h1 align="center">ReVint</h1>

<p align="center">
  Extensión para Chrome y Edge que republica tus artículos de Vinted con un clic.
</p>

> **Aviso:** proyecto independiente y no oficial. No está afiliado, patrocinado ni aprobado por Vinted UAB. «Vinted» es una marca registrada de su titular y aquí solo se usa para indicar con qué web funciona la extensión.

---

## ¿Qué hace?

En la página de cualquiera de **tus** artículos añade un botón **🔁 Republicar**. Al pulsarlo:

1. Lee los datos del artículo (título, descripción, precio, categoría, talla, marca, estado, colores, medidas y atributos).
2. Descarga sus fotos y las vuelve a subir.
3. Crea un anuncio nuevo idéntico, que aparece como recién publicado.
4. Borra el anuncio original (opcional, activado por defecto).
5. Te lleva al anuncio nuevo.

Funciona en todos los dominios de Vinted: `.es`, `.fr`, `.it`, `.de`, `.co.uk`, `.be`, `.nl`, `.pt`, `.pl`, `.at`, `.lu`, `.cz`, `.sk`, `.lt`, `.hu`, `.ro`, `.se`, `.fi`, `.dk`, `.gr`, `.hr`, `.ie` y `.com`.

## Instalación

La extensión no está en la Chrome Web Store, así que se instala en modo desarrollador:

1. Ve al apartado **[Releases](https://github.com/16maniatic/ReVint/releases/latest)** y descarga el archivo `ReVint-vX.Y.Z.zip` de la última versión.
2. Descomprímelo en una carpeta que no vayas a borrar (Chrome carga la extensión desde ahí).
3. Abre `chrome://extensions` (en Edge, `edge://extensions`).
4. Activa el **Modo de desarrollador** (arriba a la derecha en Chrome, en el menú lateral en Edge).
5. Pulsa **Cargar descomprimida** y elige la carpeta descomprimida (la que contiene `manifest.json`).
6. Opcional: fija la extensión en la barra con el icono de la pieza de puzle 🧩.

Para actualizar, descarga el `.zip` de la nueva versión desde **Releases**, sustituye con él el contenido de la carpeta y pulsa el botón de recargar (↻) de la extensión en `chrome://extensions`.

## Uso

1. Inicia sesión en Vinted como siempre.
2. Abre uno de tus artículos (una dirección del tipo `https://www.vinted.es/items/123456789-...`).
3. Pulsa **🔁 Republicar**, abajo a la derecha.
4. Confirma en el aviso. El botón irá mostrando el progreso: *Leyendo artículo…*, *Subiendo foto 1/5…*, *Creando anuncio nuevo…* y *Borrando anuncio antiguo…*.
5. Al terminar se abre el anuncio nuevo.

### Opciones

Pulsa el icono de la extensión en la barra del navegador:

| Opción | Por defecto | Descripción |
|---|---|---|
| Borrar el anuncio original tras republicar | ✅ | Si la desactivas, el original se queda y tendrás dos anuncios iguales. |
| Pedir confirmación antes de republicar | ✅ | Muestra un aviso antes de empezar. |

> **Consejo:** la primera vez, prueba con la opción de borrar **desactivada** para comprobar que el anuncio nuevo sale bien.

## Privacidad

- Usa la sesión que ya tienes abierta en el navegador. **No pide, guarda ni envía contraseñas.**
- Solo se comunica con Vinted (`vinted.*`) y con su servidor de imágenes (`*.vinted.net`). No hay analítica, servidores propios ni terceros.
- Lo único que guarda son tus dos opciones, en el almacenamiento de Chrome (`chrome.storage.sync`).

## Limitaciones y avisos

- Usa la API interna de Vinted, que no es pública y puede cambiar sin aviso. Si deja de funcionar, el mensaje de error indica qué paso falló; también puedes verlo en la consola (F12).
- Al borrar el original **se pierden sus favoritos, visitas y mensajes asociados**.
- Las [condiciones de uso de Vinted](https://www.vinted.es/terms_and_conditions) pueden limitar el uso de herramientas automatizadas y la publicación de anuncios duplicados. **Úsala con moderación y bajo tu responsabilidad.** Republicar muchos artículos seguidos puede hacer que Vinted limite o suspenda tu cuenta.
- El original solo se borra cuando el anuncio nuevo ya se ha creado.

## Estructura

```
├── manifest.json   # Configuración de la extensión (Manifest V3)
├── content.js      # Botón «Republicar» y lógica de republicación
├── content.css     # Estilos del botón
├── background.js   # Descarga de fotos desde el CDN de Vinted
├── popup.html/js   # Ventana de opciones
└── icons/          # Iconos de 16, 32, 48 y 128 px
```

## Licencia

[MIT](LICENSE). Se ofrece tal cual, sin garantías de ningún tipo.
