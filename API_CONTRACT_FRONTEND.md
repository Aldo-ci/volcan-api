# API Contract For Frontend

## Base
- Base URL: `http://localhost:3000/v1`
- Content-Type: `application/json`
- Auth protegida con `Authorization: Bearer <token>`

## Convenciones
- Endpoints publicos:
  - `POST /auth/login`
  - `GET /health`
- El resto de endpoints estan protegidos con JWT
- Fechas en formato ISO 8601
- Respuestas de listados paginados:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 1
  }
}
```

- Error shape general:

```json
{
  "statusCode": 400,
  "path": "/v1/products",
  "timestamp": "2026-04-12T12:00:00.000Z",
  "error": "Readable message or object"
}
```

## Auth

### POST `/auth/login`
- Protected: No
- Roles: Public

Body:

```json
{
  "username": "admin",
  "password": "secret123"
}
```

Response `201`:

```json
{
  "accessToken": "jwt-token",
  "user": {
    "id": "uuid",
    "legacyUserId": null,
    "username": "admin",
    "roleId": "uuid",
    "role": {
      "id": "uuid",
      "code": "admin",
      "name": "Administrator",
      "createdAt": "2026-04-12T12:00:00.000Z",
      "updatedAt": "2026-04-12T12:00:00.000Z"
    },
    "legacyRoleName": null,
    "isActive": true,
    "createdAt": "2026-04-12T12:00:00.000Z",
    "updatedAt": "2026-04-12T12:00:00.000Z",
    "deletedAt": null
  }
}
```

Errores comunes:
- `401` credenciales invalidas

Notas frontend:
- guardar `accessToken`
- usar `user.role.code` para permisos

## Health

### GET `/health`
- Protected: No
- Roles: Public

Response `200`:

```json
{
  "status": "ok",
  "timestamp": "2026-04-12T12:00:00.000Z"
}
```

## Roles

### GET `/roles`
- Protected: Yes
- Roles: `admin`

Response `200`:

```json
[
  {
    "id": "uuid",
    "code": "admin",
    "name": "Administrator",
    "createdAt": "2026-04-12T12:00:00.000Z",
    "updatedAt": "2026-04-12T12:00:00.000Z"
  }
]
```

### GET `/roles/:id`
- Protected: Yes
- Roles: `admin`

Response `200`: mismo shape de un rol

Errores comunes:
- `404` rol no encontrado

## Users

### POST `/users`
- Protected: Yes
- Roles: `admin`

Body:

```json
{
  "legacyUserId": "legacy-123",
  "username": "cashier",
  "password": "secret123",
  "roleId": "uuid",
  "legacyRoleName": "Cashier",
  "isActive": true
}
```

Response `201`:

```json
{
  "id": "uuid",
  "legacyUserId": "legacy-123",
  "username": "cashier",
  "roleId": "uuid",
  "role": {
    "id": "uuid",
    "code": "cashier",
    "name": "Cashier",
    "createdAt": "2026-04-12T12:00:00.000Z",
    "updatedAt": "2026-04-12T12:00:00.000Z"
  },
  "legacyRoleName": "Cashier",
  "isActive": true,
  "createdAt": "2026-04-12T12:00:00.000Z",
  "updatedAt": "2026-04-12T12:00:00.000Z",
  "deletedAt": null
}
```

Errores comunes:
- `404` roleId no existe
- `409` username duplicado

### GET `/users`
- Protected: Yes
- Roles: `admin`

Query params opcionales:
- `page`
- `limit`
- `search`
- `isActive`
- `roleId`

Response `200`:

```json
{
  "data": [
    {
      "id": "uuid",
      "legacyUserId": null,
      "username": "cashier",
      "roleId": "uuid",
      "role": {
        "id": "uuid",
        "code": "cashier",
        "name": "Cashier",
        "createdAt": "2026-04-12T12:00:00.000Z",
        "updatedAt": "2026-04-12T12:00:00.000Z"
      },
      "legacyRoleName": null,
      "isActive": true,
      "createdAt": "2026-04-12T12:00:00.000Z",
      "updatedAt": "2026-04-12T12:00:00.000Z",
      "deletedAt": null
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### GET `/users/:id`
- Protected: Yes
- Roles: `admin`

Response `200`: mismo shape de usuario

### PATCH `/users/:id`
- Protected: Yes
- Roles: `admin`

Body parcial:

```json
{
  "username": "cashier-2",
  "password": "new-secret",
  "roleId": "uuid",
  "isActive": true
}
```

Response `200`: mismo shape de usuario

### POST `/users/:id/activate`
- Protected: Yes
- Roles: `admin`

Response `200`: mismo shape de usuario con `isActive: true`

### POST `/users/:id/deactivate`
- Protected: Yes
- Roles: `admin`

Response `200`: mismo shape de usuario con `isActive: false`

### DELETE `/users/:id`
- Protected: Yes
- Roles: `admin`

Response `200` o `204` sin body utilizable

Notas frontend:
- es soft delete
- el usuario deja de salir en listados normales

## Product Categories

### POST `/product-categories`
- Protected: Yes
- Roles: `admin`

Body:

```json
{
  "legacyProductTypeId": "legacy-10",
  "name": "Shirts",
  "description": "Top wear",
  "isActive": true
}
```

Response `201`:

```json
{
  "id": "uuid",
  "legacyProductTypeId": "legacy-10",
  "name": "Shirts",
  "description": "Top wear",
  "isActive": true,
  "createdAt": "2026-04-12T12:00:00.000Z",
  "updatedAt": "2026-04-12T12:00:00.000Z"
}
```

### GET `/product-categories`
- Protected: Yes
- Roles: `admin` o `cashier`

Query params opcionales:
- `page`
- `limit`
- `search`
- `isActive`

Response `200`: paginado con `ProductCategoryResponseDto`

### GET `/product-categories/:id`
- Protected: Yes
- Roles: `admin` o `cashier`

Response `200`: shape de categoria

### PATCH `/product-categories/:id`
- Protected: Yes
- Roles: `admin`

Body parcial:

```json
{
  "name": "Shoes",
  "isActive": false
}
```

Response `200`: shape de categoria

## Products

### POST `/products`
- Protected: Yes
- Roles: `admin`

Body:

```json
{
  "barcode": "750100000001",
  "name": "Basic Tee",
  "description": "Cotton shirt",
  "imageUrl": "",
  "categoryId": "uuid",
  "regularPrice": 20,
  "salePrice": 18,
  "stockQuantity": 5,
  "minimumStock": 2,
  "color": "Black",
  "size": "M",
  "isActive": true
}
```

Response `201`:

```json
{
  "id": "uuid",
  "barcode": "750100000001",
  "name": "Basic Tee",
  "description": "Cotton shirt",
  "imageUrl": "",
  "categoryId": "uuid",
  "category": {
    "id": "uuid",
    "legacyProductTypeId": null,
    "name": "Shirts",
    "description": null,
    "isActive": true,
    "createdAt": "2026-04-12T12:00:00.000Z",
    "updatedAt": "2026-04-12T12:00:00.000Z"
  },
  "regularPrice": "20.00",
  "salePrice": "18.00",
  "stockQuantity": 5,
  "minimumStock": 2,
  "color": "Black",
  "size": "M",
  "isActive": true,
  "createdAt": "2026-04-12T12:00:00.000Z",
  "updatedAt": "2026-04-12T12:00:00.000Z",
  "deletedAt": null
}
```

Notas frontend:
- si no se manda `salePrice`, backend lo guarda igual a `regularPrice`

Errores comunes:
- `400` `salePrice` mayor a `regularPrice`
- `404` `categoryId` no existe
- `409` `barcode` duplicado

### GET `/products`
- Protected: Yes
- Roles: `admin` o `cashier`

Query params opcionales:
- `page`
- `limit`
- `search`
- `isActive`
- `categoryId`
- `lowStock`

Response `200`: paginado con `ProductResponseDto`

### GET `/products/low-stock`
- Protected: Yes
- Roles: `admin` o `cashier`

Response `200`:

```json
[
  {
    "id": "uuid",
    "barcode": null,
    "name": "Basic Tee",
    "description": null,
    "imageUrl": "",
    "categoryId": "uuid",
    "category": {
      "id": "uuid",
      "legacyProductTypeId": null,
      "name": "Shirts",
      "description": null,
      "isActive": true,
      "createdAt": "2026-04-12T12:00:00.000Z",
      "updatedAt": "2026-04-12T12:00:00.000Z"
    },
    "regularPrice": "20.00",
    "salePrice": "20.00",
    "stockQuantity": 2,
    "minimumStock": 2,
    "color": null,
    "size": null,
    "isActive": true,
    "createdAt": "2026-04-12T12:00:00.000Z",
    "updatedAt": "2026-04-12T12:00:00.000Z",
    "deletedAt": null
  }
]
```

### GET `/products/:id`
- Protected: Yes
- Roles: `admin` o `cashier`

Response `200`: shape de producto

### PATCH `/products/:id`
- Protected: Yes
- Roles: `admin`

Body parcial:

```json
{
  "name": "Premium Tee",
  "regularPrice": 25,
  "salePrice": 22,
  "stockQuantity": 8,
  "minimumStock": 3,
  "isActive": true
}
```

Response `200`: shape de producto

Notas frontend:
- si cambias `regularPrice` y no mandas `salePrice`, backend alinea `salePrice` al nuevo `regularPrice`

### DELETE `/products/:id`
- Protected: Yes
- Roles: `admin`

Response `200` o `204` sin body utilizable

Notas frontend:
- es soft delete

## Sales

### POST `/sales`
- Protected: Yes
- Roles: `admin` o `cashier`

Body:

```json
{
  "occurredAt": "2026-04-12T18:00:00.000Z",
  "discountTotal": 2,
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

Reglas:
- `pricingMode` puede ser `regular` o `sale`
- si no se manda, backend usa `sale`
- backend valida stock y calcula montos
- no mandar montos por item

Response `201`:

```json
{
  "id": "uuid",
  "occurredAt": "2026-04-12T18:00:00.000Z",
  "createdByUserId": "uuid",
  "subtotal": "40.00",
  "discountTotal": "2.00",
  "total": "38.00",
  "hasDiscount": true,
  "notes": "optional",
  "status": "completed",
  "cancelledAt": null,
  "cancelledByUserId": null,
  "cancellationReason": null,
  "items": [
    {
      "id": "uuid",
      "productId": "uuid-1",
      "quantity": 2,
      "productNameSnapshot": "Basic Tee",
      "productBarcodeSnapshot": "750100000001",
      "unitPrice": "20.00",
      "discountAmount": "0.00",
      "lineTotal": "40.00"
    }
  ],
  "createdAt": "2026-04-12T18:00:00.000Z",
  "updatedAt": "2026-04-12T18:00:00.000Z"
}
```

Errores comunes:
- `400` descuento total mayor al subtotal
- `400` stock insuficiente
- `400` producto inactivo
- `404` producto no encontrado

### GET `/sales`
- Protected: Yes
- Roles: `admin` o `cashier`

Query params opcionales:
- `page`
- `limit`
- `search`
- `from`
- `to`

Response `200`: paginado con `SaleResponseDto`

### GET `/sales/summary`
- Protected: Yes
- Roles: `admin` o `cashier`

Query params opcionales:
- `from`
- `to`

Response `200`:

```json
{
  "totalSold": "120.00",
  "subtotal": "130.00",
  "discountTotal": "10.00",
  "tickets": 4,
  "totalUnits": 10
}
```

Notas frontend:
- este resumen considera solo ventas `completed`

### GET `/sales/:id`
- Protected: Yes
- Roles: `admin` o `cashier`

Response `200`: shape de venta

### POST `/sales/:id/cancel`
- Protected: Yes
- Roles: `admin`

Body:

```json
{
  "reason": "Customer request"
}
```

Response `201` o `200`:

```json
{
  "id": "uuid",
  "occurredAt": "2026-04-12T18:00:00.000Z",
  "createdByUserId": "uuid",
  "subtotal": "40.00",
  "discountTotal": "2.00",
  "total": "38.00",
  "hasDiscount": true,
  "notes": "optional",
  "status": "cancelled",
  "cancelledAt": "2026-04-12T19:00:00.000Z",
  "cancelledByUserId": "uuid",
  "cancellationReason": "Customer request",
  "items": [
    {
      "id": "uuid",
      "productId": "uuid-1",
      "quantity": 2,
      "productNameSnapshot": "Basic Tee",
      "productBarcodeSnapshot": "750100000001",
      "unitPrice": "20.00",
      "discountAmount": "0.00",
      "lineTotal": "40.00"
    }
  ],
  "createdAt": "2026-04-12T18:00:00.000Z",
  "updatedAt": "2026-04-12T19:00:00.000Z"
}
```

Errores comunes:
- `404` venta no encontrada
- `400` venta ya cancelada

## Sugerencias frontend por endpoint
- Login:
  - persistir token
  - redirigir segun rol si luego agregas mas roles
- Listados paginados:
  - leer siempre `data` y `meta`
- Productos:
  - si `regularPrice === salePrice`, ocultar selector visual de descuento en carrito
- Ventas:
  - permitir escoger `pricingMode` por linea
  - no enviar subtotal ni total; solo `items`, `discountTotal`, `occurredAt`, `notes`
- Cancelacion:
  - pedir confirmacion y motivo obligatorio
