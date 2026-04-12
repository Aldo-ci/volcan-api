# Frontend Spec

## Producto
Backoffice de punto de venta para administrar:
- autenticacion
- usuarios
- categorias
- productos
- ventas
- cancelaciones
- reportes basicos

La aplicacion debe servir tanto para operacion administrativa como para captura de ventas.

## Base tecnica
- API base: `http://localhost:3000/v1`
- Auth: JWT Bearer
- Formato: JSON
- Fechas: ISO 8601
- Todas las operaciones protegidas requieren token salvo health y login

## Autenticacion
- Login con `username` y `password`
- Endpoint:
  - `POST /auth/login`
- Respuesta esperada:
  - `accessToken`
  - `user`

El frontend debe:
- guardar el token
- enviarlo en `Authorization: Bearer <token>`
- usar `user.role.code` para permisos de UI

## Modulos del frontend
- Login
- Dashboard
- Usuarios
- Categorias de producto
- Productos
- Nueva venta
- Historial de ventas
- Detalle de venta
- Cancelacion de venta
- Productos con bajo stock

## Reglas de negocio importantes
- El backend calcula subtotal y total final
- El frontend puede mostrar vista previa, pero la verdad final es backend
- No se permite vender sin stock suficiente
- Si un item falla, falla toda la venta
- Las ventas no se editan; solo se cancelan
- Al cancelar una venta, el stock vuelve al inventario
- Usuarios y productos tienen soft delete
- Roles controlan acceso a modulos y acciones

## Regla actual de precios por producto
Al crear o actualizar un producto:
- `regularPrice` es obligatorio
- `salePrice` es opcional
- si `salePrice` no se envia, backend lo guarda igual a `regularPrice`

Eso significa:
- todos los productos terminan teniendo un `salePrice` usable
- si no hay descuento real, `regularPrice` y `salePrice` seran iguales

## Regla actual de precios por linea en ventas
Cada item del carrito puede elegir que precio usar:
- `pricingMode: "regular"`
- `pricingMode: "sale"`

Si no se manda `pricingMode`, backend usa `"sale"` por defecto.

Esto permite que el frontend muestre por producto en el carrito:
- vender a precio normal
- vender a precio descuento

Ejemplo de item:

```json
{
  "productId": "uuid",
  "quantity": 2,
  "pricingMode": "regular"
}
```

## Diseno recomendado para el carrito
Cada producto agregado al carrito debe mostrar:
- nombre
- stock disponible
- precio regular
- precio descuento
- selector de modo de precio
- cantidad
- subtotal por linea

Comportamiento recomendado:
- si `regularPrice === salePrice`, el selector puede ocultarse o deshabilitarse
- si son distintos, mostrar opcion clara:
  - Precio normal
  - Precio descuento

## Pantalla Nueva venta
Debe permitir:
- buscar productos
- agregar varios productos
- elegir cantidad
- elegir `pricingMode` por linea
- aplicar descuento global opcional a la venta
- mostrar:
  - subtotal
  - descuento global
  - total estimado

Payload esperado:

```json
{
  "occurredAt": "2026-04-12T18:00:00.000Z",
  "discountTotal": 0,
  "notes": "optional",
  "items": [
    {
      "productId": "uuid-1",
      "quantity": 2,
      "pricingMode": "regular"
    },
    {
      "productId": "uuid-2",
      "quantity": 1,
      "pricingMode": "sale"
    }
  ]
}
```

## Productos
Campos relevantes:
- `id`
- `barcode`
- `name`
- `description`
- `imageUrl`
- `categoryId`
- `regularPrice`
- `salePrice`
- `stockQuantity`
- `minimumStock`
- `color`
- `size`
- `isActive`

Pantallas recomendadas:
- listado con busqueda, filtros y paginacion
- formulario de creacion/edicion
- indicador visual de bajo stock

En formulario:
- `regularPrice` obligatorio
- `salePrice` opcional
- si el usuario no captura `salePrice`, el frontend puede dejarlo vacio; backend lo resolvera

## Ventas
Campos relevantes:
- `id`
- `occurredAt`
- `subtotal`
- `discountTotal`
- `total`
- `status`
- `notes`
- `items`

Estados:
- `completed`
- `cancelled`

Acciones:
- listar ventas
- ver detalle
- cancelar venta

## Cancelacion
Endpoint:
- `POST /sales/:id/cancel`

Payload:

```json
{
  "reason": "Customer request"
}
```

UX recomendada:
- mostrar modal de confirmacion
- pedir motivo obligatorio
- advertir que regresara stock al inventario

## Dashboard
Debe mostrar:
- total vendido
- subtotal
- descuentos
- tickets
- unidades vendidas

Endpoint:
- `GET /sales/summary`

## Productos con bajo stock
Endpoint:
- `GET /products/low-stock`

El frontend deberia:
- mostrar lista destacada
- permitir navegacion rapida al detalle o edicion del producto

## Usuarios
Acciones:
- crear
- editar
- activar
- desactivar
- eliminar logico

Campos relevantes:
- `id`
- `username`
- `roleId`
- `role`
- `isActive`

## Categorias
Acciones:
- crear
- editar
- listar

Campos:
- `id`
- `name`
- `description`
- `isActive`

## Permisos
- `admin`: acceso completo
- `cashier`: Ventas y listado de productos

El frontend debe usar `role.code` para:
- ocultar rutas
- ocultar botones
- proteger acciones administrativas

## Headers
Para rutas protegidas:

```http
Authorization: Bearer <token>
```

## Errores que el frontend debe manejar
- `400`: validacion o regla de negocio
- `401`: token ausente o invalido
- `403`: rol insuficiente
- `404`: recurso no encontrado
- `409`: conflicto de negocio, por ejemplo duplicados

## UX recomendada
- tablas con busqueda, filtros y paginacion
- formularios con validacion inmediata
- toasts o alerts para respuestas del backend
- confirmacion para cancelaciones y eliminaciones
- resaltar:
  - ventas canceladas
  - stock bajo
  - productos inactivos


## Resumen de endpoints clave
- `POST /auth/login`
- `GET /roles`
- `GET/POST/PATCH/DELETE /users`
- `POST /users/:id/activate`
- `POST /users/:id/deactivate`
- `GET/POST/PATCH /product-categories`
- `GET/POST/PATCH/DELETE /products`
- `GET /products/low-stock`
- `GET/POST /sales`
- `GET /sales/:id`
- `POST /sales/:id/cancel`
- `GET /sales/summary`
- `GET /health`

## Recomendacion de implementacion
- cliente HTTP centralizado
- manejo global del token
- guards de ruta por auth y rol
- tipado compartido para requests/responses
- modulo de carrito desacoplado de catalogo
- logica visual de `pricingMode` por linea en el carrito
