# GLOW — Class Diagram

```mermaid
classDiagram
    direction TB

    class User {
        +int id
        +string name
        +string email
        +string password
        +enum role
        +string phone
        +datetime email_verified_at
        +datetime deleted_at
        +timestamps()
        +salon() HasOne
        +appointments() HasMany
        +isAdmin() bool
        +isSalon() bool
        +isClient() bool
        +createToken(string) NewAccessToken
    }

    class Salon {
        +int id
        +int user_id
        +string name
        +string description
        +string address
        +string city
        +decimal latitude
        +decimal longitude
        +string logo
        +string license_number
        +enum status
        +string rejection_reason
        +datetime deleted_at
        +timestamps()
        +user() BelongsTo
        +services() HasMany
        +orders() HasMany
        +appointments() HasMany
        +isApproved() bool
        +distanceFrom(float lat, float lng) float
    }

    class SalonService {
        +int id
        +int salon_id
        +string name
        +string description
        +decimal price
        +int duration_minutes
        +string category
        +bool is_active
        +timestamps()
        +salon() BelongsTo
        +appointments() HasMany
    }

    class Product {
        +int id
        +string name
        +string description
        +decimal price
        +int stock
        +string image
        +string category
        +bool is_active
        +datetime deleted_at
        +timestamps()
        +orderItems() HasMany
    }

    class Order {
        +int id
        +int salon_id
        +decimal total_amount
        +enum status
        +string notes
        +timestamps()
        +salon() BelongsTo
        +items() HasMany
    }

    class OrderItem {
        +int id
        +int order_id
        +int product_id
        +int quantity
        +decimal unit_price
        +timestamps()
        +order() BelongsTo
        +product() BelongsTo
        +getSubtotalAttribute() float
    }

    class Appointment {
        +int id
        +int client_id
        +int salon_id
        +int salon_service_id
        +datetime scheduled_at
        +enum status
        +string notes
        +decimal price_at_booking
        +timestamps()
        +client() BelongsTo
        +salon() BelongsTo
        +service() BelongsTo
    }

    class PersonalAccessToken {
        +int id
        +string tokenable_type
        +int tokenable_id
        +string name
        +string token
        +json abilities
        +datetime last_used_at
        +datetime expires_at
        +timestamps()
    }

    %% Enumerations as notes
    note for User "role:\n admin | salon | client"
    note for Salon "status:\n pending | approved | rejected"
    note for Order "status:\n pending | confirmed\n shipped | delivered | cancelled"
    note for Appointment "status:\n pending | confirmed\n completed | cancelled"

    %% Relationships
    User "1" --o "0..1" Salon : owns
    User "1" --o "0..*" Appointment : books as client
    User "1" --o "0..*" PersonalAccessToken : has

    Salon "1" --* "0..*" SalonService : offers
    Salon "1" --o "0..*" Order : places
    Salon "1" --o "0..*" Appointment : receives

    Order "1" --* "1..*" OrderItem : contains
    OrderItem "0..*" --> "1" Product : references

    Appointment "0..*" --> "1" SalonService : books
```

---

## Relationships Legend

| Symbol | Meaning |
|--------|---------|
| `--*` | Composition (child cannot exist without parent) |
| `--o` | Aggregation (child can exist independently) |
| `-->` | Association (reference only) |

## Enum Values

| Model | Field | Values |
|-------|-------|--------|
| `User` | `role` | `admin` · `salon` · `client` |
| `Salon` | `status` | `pending` · `approved` · `rejected` |
| `Order` | `status` | `pending` · `confirmed` · `shipped` · `delivered` · `cancelled` |
| `Appointment` | `status` | `pending` · `confirmed` · `completed` · `cancelled` |

## Key Business Rules (enforced in controllers)

- A **Salon** must be `approved` before it can place Orders or receive Appointments
- A **SalonService** must be `is_active = true` to be bookable
- `OrderItem.unit_price` is snapshotted from `Product.price` at order time — price changes don't affect existing orders
- `Appointment.price_at_booking` is snapshotted from `SalonService.price` at booking time
- `Product.stock` is decremented atomically inside a DB transaction when an Order is placed
