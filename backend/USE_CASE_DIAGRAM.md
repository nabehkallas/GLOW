# GLOW — Use Case Diagram

```mermaid
graph LR
    %% Actors
    ADMIN(("👤 Admin"))
    SALON(("💇 Salon"))
    CLIENT(("🙋 Client"))

    subgraph SYSTEM["🖥️  GLOW API"]

        subgraph AUTH["Authentication"]
            direction TB
            A1(["Login"])
            A2(["Logout"])
            A3(["View My Profile"])
        end

        subgraph REGISTER["Registration"]
            direction TB
            R1(["Register as Client"])
            R2(["Register as Salon\n+ GPS Coordinates"])
        end

        subgraph ADMIN_UC["Admin — Platform Management"]
            direction TB
            AD1(["View Dashboard Stats"])
            AD2(["List Salons\n(filter by status)"])
            AD3(["View Salon Detail"])
            AD4(["Approve Salon"])
            AD5(["Reject Salon\n(with reason)"])
            AD6(["Remove Salon"])
            AD7(["Add Product"])
            AD8(["Edit Product"])
            AD9(["Delete Product"])
            AD10(["List Products"])
        end

        subgraph SALON_UC["Salon — Operations"]
            direction TB
            S1(["Update Profile\n& Coordinates"])
            S2(["Add Service\n(name, price, duration)"])
            S3(["Edit Service"])
            S4(["Delete Service"])
            S5(["Browse Product Catalog"])
            S6(["Place Product Order"])
            S7(["View My Orders"])
            S8(["View Incoming Appointments"])
            S9(["Confirm Appointment"])
            S10(["Complete Appointment"])
            S11(["Cancel Appointment"])
        end

        subgraph CLIENT_UC["Client — Booking"]
            direction TB
            C1(["Browse Salons\n(search / filter by city)"])
            C2(["View Distance to Salon\n(Haversine in KM)"])
            C3(["View Salon Services\n& Prices"])
            C4(["Book Appointment"])
            C5(["View My Appointments"])
            C6(["Cancel Appointment"])
        end

    end

    %% Admin connections
    ADMIN --- A1
    ADMIN --- A2
    ADMIN --- A3
    ADMIN --- AD1
    ADMIN --- AD2
    ADMIN --- AD3
    ADMIN --- AD4
    ADMIN --- AD5
    ADMIN --- AD6
    ADMIN --- AD7
    ADMIN --- AD8
    ADMIN --- AD9
    ADMIN --- AD10

    %% Salon connections
    SALON --- A1
    SALON --- A2
    SALON --- A3
    SALON --- R2
    SALON --- S1
    SALON --- S2
    SALON --- S3
    SALON --- S4
    SALON --- S5
    SALON --- S6
    SALON --- S7
    SALON --- S8
    SALON --- S9
    SALON --- S10
    SALON --- S11

    %% Client connections
    CLIENT --- A1
    CLIENT --- A2
    CLIENT --- A3
    CLIENT --- R1
    CLIENT --- C1
    CLIENT --- C2
    CLIENT --- C3
    CLIENT --- C4
    CLIENT --- C5
    CLIENT --- C6

    %% Include relationships (dependencies)
    C2 -.->|"<<include>>"| C1
    C3 -.->|"<<include>>"| C1
    C4 -.->|"<<include>>"| C3
    AD4 -.->|"<<extends>>"| AD2
    AD5 -.->|"<<extends>>"| AD2
    S9 -.->|"<<extends>>"| S8
    S10 -.->|"<<extends>>"| S8

    %% Styling
    classDef actor fill:#4A90D9,stroke:#2C5F8A,color:#fff,rx:50
    classDef usecase fill:#fff,stroke:#555,rx:20
    classDef system fill:#f9f9f9,stroke:#aaa

    class ADMIN,SALON,CLIENT actor
```

---

## Summary Table

| Actor  | # Use Cases | Key Capabilities |
|--------|-------------|------------------|
| Admin  | 13 | Dashboard, salon verification, product catalog management |
| Salon  | 12 | Profile + GPS, services CRUD, product ordering, appointment management |
| Client | 7  | Browse salons, distance in KM, book & cancel appointments |
| **Total** | **32** | |

## API Endpoint Map

| Use Case | Method | Endpoint |
|---|---|---|
| Register Client | POST | `/api/auth/register/client` |
| Register Salon | POST | `/api/auth/register/salon` |
| Login | POST | `/api/auth/login` |
| Logout | POST | `/api/auth/logout` |
| My Profile | GET | `/api/auth/me` |
| Dashboard Stats | GET | `/api/admin/dashboard` |
| List Salons (admin) | GET | `/api/admin/salons?status=pending` |
| Approve Salon | PATCH | `/api/admin/salons/{id}/approve` |
| Reject Salon | PATCH | `/api/admin/salons/{id}/reject` |
| Delete Salon | DELETE | `/api/admin/salons/{id}` |
| Products CRUD | * | `/api/admin/products` |
| Salon Profile | GET/PUT | `/api/salon/profile` |
| Services CRUD | * | `/api/salon/services` |
| Place Order | POST | `/api/salon/orders` |
| Manage Appointments | PATCH | `/api/salon/appointments/{id}/confirm\|complete\|cancel` |
| Browse Salons + Distance | GET | `/api/client/salons?lat=&lng=&city=&search=` |
| View Salon Services | GET | `/api/client/salons/{id}` |
| Book Appointment | POST | `/api/client/appointments` |
| Cancel Appointment | PATCH | `/api/client/appointments/{id}/cancel` |
