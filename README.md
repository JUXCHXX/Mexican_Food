# Fabian's Mexican Restaurant

Menú digital para **Fabian's Mexican Restaurant**, ubicado en Brentwood, Tennessee. Este documento sirve como contexto operativo para personas y agentes de IA que trabajen en el proyecto. Describe el stack, la arquitectura, la experiencia del usuario y el catálogo disponible.

## Regla principal de datos

La fuente de verdad del menú es [`src/data/menu.json`](src/data/menu.json). Contiene nombres, descripciones, precios, variantes, notas de sección y banderas como `spicy`.

- No inventar platos, ingredientes, precios, horarios ni políticas.
- Consultar el JSON antes de modificar o responder sobre el catálogo.
- Mantener los nombres de platos tal como aparecen en el JSON.
- Los precios pueden representar tamaños, combinaciones o variantes; no asumir que todos los platos tienen un único precio.
- El README documenta el estado actual, pero no sustituye al JSON cuando exista una diferencia.

## Información del restaurante

- **Nombre:** Fabian's Mexican Restaurant
- **Dirección:** 116 Wilson Pike Circle, Brentwood, TN 37027
- **Teléfono:** [(615) 376-9978](tel:+16153769978)
- **Asistente:** Don Velto
- **Proveedor del asistente:** Groq
- **Modelo principal:** `llama-3.3-70b-versatile`
- **Modelo de fallback:** `llama-3.1-8b-instant`

Notas comerciales que aparecen en el catálogo:

- Avisar al servidor si alguien del grupo tiene una alergia alimentaria.
- Se añade un recargo de `$0.50` a cada pedido para llevar.
- Los platos marcados con `*` en el menú original pueden cocinarse al momento. Consumir carne, aves, mariscos, crustáceos o huevos crudos o poco cocidos puede aumentar el riesgo de enfermedades transmitidas por alimentos.

## Stack técnico

- React `19.2`
- TypeScript `5.8`
- Vite `7`
- TanStack Start y TanStack Router
- TanStack React Query
- Nitro con preset de Vercel
- Tailwind CSS `4` mediante `@tailwindcss/vite`
- Radix UI para primitives y componentes accesibles
- Framer Motion para animaciones, parallax, modal y transiciones
- Lucide React para iconos
- Zod para validar la entrada del endpoint de chat
- Groq OpenAI-compatible API para respuestas de IA
- pnpm como gestor de paquetes, con `pnpm-lock.yaml`

El proyecto es ESM (`"type": "module"`) y usa el alias `@/*` apuntando a `src/*`.

## Comandos

```bash
pnpm install
pnpm dev
pnpm build
pnpm build:dev
pnpm preview
pnpm lint
pnpm format
```

Para activar el chat en local se necesita una variable de entorno:

```bash
GROQ_API_KEY=tu_clave_de_groq
```

La clave se lee exclusivamente en servidor desde `process.env.GROQ_API_KEY`. Nunca debe exponerse en componentes del cliente ni confirmarse en el repositorio.

## Arquitectura y flujo de la aplicación

La aplicación tiene actualmente una ruta pública:

 - [`src/routes/index.tsx`](src/routes/index.tsx): página `/`, compone hero, navegación de categorías, footer, búsqueda, chat, modal de menú, reseñas y cookies.
 - [`src/routes/pedir.tsx`](src/routes/pedir.tsx): flujo público de pedido para mesa vía `?mesa=<qr_token>` o pickup vía `?tipo=pickup`.
 - [`src/routes/mis-pedidos.tsx`](src/routes/mis-pedidos.tsx): consulta pública por teléfono, Realtime filtrado por los pedidos encontrados y calificación tras entrega.
 - [`src/routes/panel.tsx`](src/routes/panel.tsx): login y panel protegido por rol; Kanban, impresión, agotados, mesas/QR y estadísticas.
- [`src/routes/__root.tsx`](src/routes/__root.tsx): shell HTML, metadatos, fuentes, React Query, `Outlet`, errores y scripts.
- [`src/router.tsx`](src/router.tsx): configuración del router.
- [`src/routeTree.gen.ts`](src/routeTree.gen.ts): árbol generado automáticamente; no editar manualmente.
- [`src/start.ts`](src/start.ts): instancia TanStack Start y middleware de errores.
- [`src/server.ts`](src/server.ts): entrada del servidor, normaliza errores SSR y renderiza la página de error.

Flujo principal:

1. `index.tsx` importa `menu.json`.
2. Construye la navegación a partir de `data.menu` y excluye `build_your_own_combo` de las tarjetas navegables.
3. `MenuProvider` mantiene la categoría seleccionada, el estado del modal y el plato resaltado.
4. `CategoryNav` abre `MenuModal` al seleccionar una categoría.
5. `MenuModal` muestra los platos de la sección en tarjetas y permite navegar entre categorías.
6. `SearchBubble` busca por nombre o descripción en todas las secciones y lleva al plato dentro del modal.
7. `ChatBubble` abre `ChatPanel`; el panel envía el historial al server function de Groq.

## Componentes importantes

- [`src/components/HeroSection.tsx`](src/components/HeroSection.tsx): hero con logo, imagen Unsplash, parallax, CTA y teléfono.
- [`src/components/CategoryNav.tsx`](src/components/CategoryNav.tsx): dos filas horizontales animadas y arrastrables de categorías.
- [`src/components/MenuModal.tsx`](src/components/MenuModal.tsx): modal de pantalla completa en móvil y centrado en desktop, con imagen por categoría.
- [`src/components/MenuCard.tsx`](src/components/MenuCard.tsx): tarjeta de plato, descripción truncable, precio y estados visuales.
- [`src/components/SearchBubble.tsx`](src/components/SearchBubble.tsx): búsqueda local limitada a 20 resultados.
- [`src/components/ChatBubble.tsx`](src/components/ChatBubble.tsx) y [`src/components/ChatPanel.tsx`](src/components/ChatPanel.tsx): interfaz del asistente y persistencia del historial en `localStorage`.
- [`src/components/Footer.tsx`](src/components/Footer.tsx): co-branding Fabian's/Velto, compartir por WhatsApp, Facebook, X y copiar enlace.
- [`src/components/ReviewGateModal.tsx`](src/components/ReviewGateModal.tsx): solicita una reseña tras 15 segundos; usa cookie durante 30 días.
- [`src/components/CookieBanner.tsx`](src/components/CookieBanner.tsx): banner de cookies; guarda la elección durante un año.
- [`src/components/TalaveraDivider.tsx`](src/components/TalaveraDivider.tsx): divisor ornamental de la identidad visual.
- [`src/contexts/MenuContext.tsx`](src/contexts/MenuContext.tsx): estado global mínimo de navegación del menú.
- [`src/lib/menu-categories.ts`](src/lib/menu-categories.ts): icono e imagen Unsplash para cada categoría.
- [`src/lib/menu-summary.ts`](src/lib/menu-summary.ts): resumen embebido que actualmente se inyecta en el prompt de Don Velto.
- [`src/lib/groq-chat.functions.ts`](src/lib/groq-chat.functions.ts): server function, validación Zod, prompt de sistema y llamadas a Groq.
 - [`src/lib/supabase.ts`](src/lib/supabase.ts): cliente público de Supabase, estados y etiquetas bilingües.
 - [`src/lib/menu-data.ts`](src/lib/menu-data.ts): slugs deterministas `categoria-nombre` sin modificar el JSON fuente.
 - [`src/lib/order-types.ts`](src/lib/order-types.ts): tipos compartidos de carrito, pedido y respuesta RPC.

La migración completa está en [`supabase/migrations/202609060001_orders.sql`](supabase/migrations/202609060001_orders.sql). Crea `profiles`, `tables`, `menu_item_status`, `orders`, `order_items`, `order_status_history` y `order_ratings`; activa RLS, políticas por rol, Realtime para `orders`, triggers de historial y las RPC `create_order`, `get_my_orders`, `update_my_order` y `submit_rating`.

## Identidad visual

La identidad es **Mexican Modern Premium**, con tema oscuro:

- `--carbon`: `#121212`, fondo principal.
- `--gris`: `#2A2A2A`, tarjetas y superficies.
- `--arena`: `#F5E6C8`, texto cálido.
- `--sombrero`: `#F2B233`, color primario y precios.
- `--tradicional`: `#C73A2D`, alertas y señal de picante.
- `--jalapeno`: `#0F8A5F`, acento verde y estados positivos.

Las fuentes remotas declaradas en el root son Cinzel para display, Montserrat para headings y Poppins para cuerpo. Los estilos globales viven en [`src/styles.css`](src/styles.css), que también define patrones Talavera, franjas tipo sarape, sombras y animaciones de marca.

## Catálogo del menú

El JSON tiene **25 categorías**, **266 entradas con `items`** y una sección adicional de combos configurables sin entradas individuales. La navegación visual excluye únicamente `build_your_own_combo`; la búsqueda recorre cualquier sección que tenga `items`.

### Entradas por categoría

La siguiente lista es el inventario de nombres actualmente presente en `menu.json`. Para ingredientes, descripciones y precios exactos, abrir el JSON enlazado arriba.

- **Appetizers** (`appetizers`, 11): Guacamole Dip; Guacamole de la Casa; Cheese Dip; Bean Dip; Hamburger with Fries; Chicken Fingers with Fries; Tortilla Chips; Queso Fundido; Borracho Beans; Cheese Dip with Rice; Chicken Wings.
- **Nachos** (`nachos`, 16): Nachos - Cheese; Nachos - Bean; Nachos - Ground Beef; Nachos - Shredded Chicken; Nachos Jalisco; Nachos Supreme; Nachos Vallarta; Fajita Nachos; Shrimp Nachos; Nachos Texanos; Nachos San Luis; Nachos de Carnitas; Nachos al Carbón; Nachos Polish Sausage; Nachos El Rey; Jim's Nachos.
- **Salads** (`salads`, 6): Grilled Chicken Salad; Taco Salad; Taco Salad Fajita; Taco Salad Texano; Guacamole Salad; Tossed Salad.
- **Fajitas** (`fajitas`, 12): Fajitas; Fajitas Mixtas; Fajitas Locas; Fajitas Texanas; Shrimp Fajitas; Fajitas Del Mar; Pineapple Fajitas; Especial San José; Fajita San Luis; Fajita De Carnitas; Fajita San Pancho; Molcajete Volcan.
- **Steaks** (`steaks`, 11): Steak Corral; Steak Vallarta; Steak Ranchero; Steak La Tampiqueña; Steak Azteca; Carne Asada; Chile Colorado; Tacos De Carne Asada; Efrain Special; Milanesa de Carne; Caldo de Res.
- **Chicken** (`chicken`, 13): La Carreta; Pollo Loco; Chilaquiles Mexicanos; California; Gringa; Gringa Texana; Pollo Azteca; Chicken Delight; Pollo Acapulco; Chicken Soup; Pollo Feliz; Pollo A La Mexicana; Milanesa de Pollo.
- **Pork** (`pork`, 3): Carnitas; Traditional Ribs; Chile Verde.
- **Del Mar (Seafood)** (`seafood`, 14): Shrimp Brochette; Camarones al Mojo de Ajo; Shrimp Tacos; Camarones Rancheros; Shrimp Delight; Camarones a la Diabla; Fish & Shrimp; El Rey Shrimp; Fish Tacos; Shrimp Cocktail; Mojarra; Chago Special; Mojarra Feliz; Caldo de Mariscos.
- **Burritos** (`burritos`, 11): Burrito Acapulco; Burrito Deluxe; Burrito San Luis; Burritos Mexicanos; Burrito Supreme; Burrito Texano; Burrito Special; Burrito Fajita Shrimp; Hot and Spicy Burrito; Burrito Fajita; Burrito Real.
- **Enchiladas** (`enchiladas`, 6): Enchiladas Supremas; Enchiladas Yolanda; Enchiladas Rancheras; Enchiladas Suizas; Enchiladas Patrón; Enchiladas Tapatias.
- **Quesadilla Dinners** (`quesadilla_dinners`, 7): Quesadilla Rellena; Quesadilla Deluxe; Shrimp Quesadilla; Quesadilla Fajita; Quesadilla San Luis; Quesadilla Texana; Quesa Birrias.
- **House Specials** (`house_specials`, 17): Guadalajara Special; Sincronizada; Veracruz; Sonora; Huevos con Chorizo; Huevos Rancheros; Chimichanga; Chimichanga (Shrimp); Chimichanga Texana; El Rey Special; Taquitos Mexicanos; Torta Mexicana; Fabian Special; Papa Loca; Los Cuates; Flautas Mexicanas; Gringa Texana.
- **A La Carte** (`a_la_carte`, 33): Taco (Ground beef or shredded chicken); Taco Grilled Chicken; Taco de Carne Asada; Taco de Carnitas; Taco de Chorizo; Taco Al Pastor; Shrimp Taco; Fish Taco; Taco Polish Sausage; Burrito (Ground beef or shredded chicken); Bean Burrito; Burrito (Steak, grilled chicken or shrimp); Enchilada (Ground beef or shredded chicken); Enchilada (Steak, grilled chicken or shrimp); Cheese Enchilada; Beans Enchilada; Chile Relleno; Chimichanga (Ground beef or chicken); Chimichanga (Grilled chicken, steak or shrimp); Chimichanga Polish Sausage; Tostada; Tostada de Chorizo; Tostada (Steak, grilled chicken or shrimp); Chalupa; Quesadilla (Shredded beef or chicken); Spinach Quesadilla; Quesadilla Grande (Shredded chicken or shredded beef); Grilled Quesadilla (Grilled steak or chicken); Quesadilla Grande (Steak or grilled chicken); Cheese Quesadilla; Order Grilled Shrimp (15); Tamale; Order Steak or Grilled Chicken.
- **Side Orders** (`side_orders`, 23): Mexican Rice; Refried Beans; French Fries; Hash Brown; Shredded Cheese; Chiles Toreados; Tomatillo Sauce; Pico de Gallo; California Vegetables; Bell Peppers; Grilled Onions; Tortillas (3); Small Sour Cream; Tomatoes; Jalapeños; Cilantro; Onions; Lettuce; Sliced Avocado (1); Large Sauce To-Go; Mushrooms; Chorizo; Polish Sausage.
- **Build Your Own Vegetarian** (`vegetarian`, 3): Veggie Burrito; Veggie Quesadilla; Vegetarian Fajitas.
- **Build Your Own Combo** (`build_your_own_combo`, configurable): selección de 2 o 3 entradas entre burrito, enchilada, quesadilla, taco, chile relleno, chalupa, chile con queso, tostada y tamale.
- **Kid's Menu** (`kids_menu`, 14): One burrito and one taco.; One beef taco, rice, and beans.; One quesadilla and one enchilada.; Mini taco salad.; One burrito, rice, and beans.; Enchilada, rice, and beans.; Cheese quesadilla, rice, and beans.; Cheese quesadilla with French fries.; Chicken fingers with French fries.; Cheeseburger with French fries.; Chicken nuggets with French fries.; Cheese sticks with French Fries.; Shredded chicken or ground beef nachos.; Grilled chicken, steak or six shrimp with rice and cheese dip.
- **Lunch** (`lunch`, 31): Lunch Special No. 1 al No. 10; Lunch Fajitas; El Rey Burrito; Sincronizada; Pollo Loco; Quesadilla Deluxe; Huevos Rancheros; Huevos con Chorizo; Speedy Gonzalez; Milanesa de Pollo; California (Lunch); Veracruz (Lunch); Chicken Soup (Lunch); Fajita Taco Salad (Lunch); Fajita Quesadilla (Lunch); Burrito Special (Lunch); Chimichanga (Lunch); Taco Salad (Lunch); Enchilada Supreme (Lunch); Taquitos Mexicanos (Lunch); Torta Mexicana (Lunch); Flautas Mexicanas (Lunch).
- **Desserts** (`desserts`, 4): Mexican Flan; Fried Ice Cream; Sopapilla; Sopapilla with Ice Cream.
- **Soft Drinks** (`soft_drinks`, 8): Coke, Diet Coke, Zero Coke, Sprite, Fanta, Dr Pepper, Lemonade; Sweet or Unsweet Tea; Jarritos; Coffee; Milk; Roy Rogers; Shirley Temple; Agua de Horchata y Jamaica.
- **Daiquiris** (`daiquiris`, 1): Daiquiri (Peach, Strawberry or Piña Colada).
- **Margaritas** (`margaritas`, 3): Lime Margaritas; Flavored Margaritas; Texas Margaritas.
- **Cold Beers** (`beers`, 5): Bud Light (Draft); Dos Equis XX (Draft); Domestic Beers (Bud Light, Budweiser, Miller Lite, Michelob Light); Imported Beers (Corona, Tecate, Dos Equis XX, Negra Modelo, Pacífico); Micheladas.
- **Mixed Drinks** (`mixed_drinks`, 10): Amaretto Sour; Bloody Mary; Bourbon and Coke; Cuba Libre; Tequila Shot (Patron, Don Julio); Long Island Iced Tea; Screw Driver; Tequila Sunrise; White Russian; House Shot Tequila (Jose Cuervo, 1800, Jack Daniel's, Crown Royal).
- **Wines** (`wines`, 4): Glass; Carafe; ½ Carafe; Wine-A-Rita.

## Reglas especiales del catálogo

### Precios

Los campos de precio no son uniformes. Los existentes son:

- `price`: precio único.
- `price_small` / `price_large`: tamaño pequeño y grande.
- `price_single` / `price_double`: porción sencilla y doble.
- `price_half` / `price_full`: media orden y orden completa.
- `price_regular`: precio regular.
- `price_mixed`, `price_shrimp`, `price_texana`, `price_3`: variantes específicas.
- `prices`: objeto con claves de presentación, usado sobre todo en margaritas y cervezas.
- `price_ref`: precio de referencia del menú infantil, actualmente `$7.50`; no es el mismo campo que `price`.

La sección `build_your_own_combo` usa `pricing.two_entrees`, `pricing.three_entrees` y `pricing.grilled_chicken_or_steak_extra`, en vez de un array de platos.

### Secciones y notas

- `fajitas`: todas incluyen pimientos, cebolla y tomate salteados; arroz mexicano, frijoles y ensalada de fajita.
- `vegetarian`: dos entradas a elegir, con arroz y frijoles; rellenos vegetarianos de frijoles, queso, espinaca y champiñones.
- `build_your_own_combo`: 2 entradas `$12.25`, 3 entradas `$14.99`, pollo o steak a la parrilla `$1.99` extra.
- `kids_menu`: menores de 12 años; precio de referencia de `$7.50` con bebida pequeña; pollo o steak a la parrilla suma `$1.99`.
- `lunch`: disponible todos los días de `11:00 a.m. a 3:00 p.m.`.
- Burritos, vegetarian, combos y lunch pueden cobrar `$1.99` por sustituir salsa o cheese dip, según las notas de cada sección.
- En A La Carte, combos y lunch, las chips y salsa no siempre están incluidas; respetar la nota de la sección.

### Picante y alergias

`spicy: true` es una señal explícita para la interfaz y el asistente, pero la ausencia de la bandera no garantiza que el plato sea completamente no picante. Las descripciones mencionan jalapeño, salsa picante, ranchero, chile, chorizo y otros ingredientes que deben comunicarse cuando sean relevantes.

No hacer afirmaciones médicas sobre alergias. Recomendar avisar al servidor y verificar directamente con el restaurante.

## Asistente de IA: Don Velto

El backend de chat está en [`src/lib/groq-chat.functions.ts`](src/lib/groq-chat.functions.ts):

- Server function POST de TanStack Start.
- Input validado con Zod: mensajes con `role` `user`, `assistant` o `system`, contenido de 1 a 4000 caracteres, máximo 30 mensajes.
- El prompt fuerza respuesta en el idioma del último mensaje.
- Solo debe responder preguntas relacionadas con el menú.
- Debe recomendar nombre exacto y precio cuando corresponda.
- No debe inventar platos ni precios.
- Usa `MENU_SUMMARY` como contexto enviado al modelo.
- Reintenta con el modelo de 8B si falla el modelo principal.
- Sin API key o tras dos fallos devuelve un mensaje de fallback.

### Advertencia importante sobre el contexto del chat

`src/lib/menu-summary.ts` es un resumen separado y puede quedarse desactualizado o ser menos completo que `menu.json`. Algunas descripciones del resumen están truncadas con `...`, y el resumen no representa todas las variantes de precios con la misma precisión. Si se requiere exactitud para el asistente, la mejora correcta es generar el contexto desde `menu.json` o importar una representación completa y validada, no mantener dos catálogos a mano.

## Búsqueda y precios mostrados

`SearchBubble` busca coincidencias simples, sin normalización avanzada, en `name` y `description`, y muestra como máximo 20 resultados. Su función de precio es más limitada que la de `MenuCard`.

`MenuCard` contiene `resolvePrice`, que intenta resolver el precio en este orden: `prices`, pequeño/grande, sencillo/doble, media/completa, `price`, regular y algunos campos de variante. Antes de cambiar la estructura de precios, revisar esta función y la función equivalente de búsqueda para mantener consistencia.

## Assets y dependencias externas

- Logos y personajes están en [`src/assets/`](src/assets/).
- Las imágenes de categorías y la imagen del hero se cargan desde Unsplash mediante URLs remotas.
- Las fuentes se cargan desde Google Fonts en el root HTML.
- El enlace de reseñas apunta a Google Business: `https://g.page/r/Ceifp0vMzoMKEBM/review`.
- No agregar secretos a assets, código cliente o archivos versionados.

## Convenciones para agentes de IA

1. Leer primero `menu.json` y el componente que consume el dato antes de cambiar el catálogo.
2. Mantener TanStack Start y el routing basado en archivos; no crear `src/pages` ni patrones de Next.js/Remix.
3. No editar `routeTree.gen.ts` manualmente.
4. Preferir los primitives existentes de `src/components/ui/` y los iconos de `lucide-react`.
5. Mantener la identidad visual de `styles.css` y el comportamiento responsive.
6. Cambiar el JSON y el contexto del chat juntos cuando una modificación de menú deba estar disponible para Don Velto.
7. Si una respuesta depende de precio, horario, alergias o disponibilidad, expresar la limitación y remitir al restaurante cuando el JSON no lo confirme.
8. Después de cambios, ejecutar al menos `pnpm lint` y `pnpm build`.

## Despliegue

[`vite.config.ts`](vite.config.ts) configura TanStack Start para Vercel mediante Nitro (`preset: "vercel"`). [`vercel.json`](vercel.json) contiene la configuración adicional de despliegue. La variable `GROQ_API_KEY` debe configurarse como secreto en el entorno de Vercel para habilitar el asistente.