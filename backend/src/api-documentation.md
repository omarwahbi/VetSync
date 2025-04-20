# Pet Well App API Documentation

## Authentication API Endpoints

**Base URL**: `/auth`

| Method  | Endpoint           | Description                          | Authentication    |
| ------- | ------------------ | ------------------------------------ | ----------------- |
| `POST`  | `/login`           | Login with email and password        | Public            |
| `POST`  | `/register`        | Register a new user                  | Public            |
| `GET`   | `/profile`         | Get the logged-in user's profile     | JWT Auth Required |
| `PATCH` | `/change-password` | Change the logged-in user's password | JWT Auth Required |

### Login Request/Response

**Request (POST /auth/login)**:

```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Response**:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "STAFF",
    "clinicId": "clinic-id"
  }
}
```

### Register Request/Response

**Request (POST /auth/register)**:

```json
{
  "email": "newuser@example.com",
  "password": "newpassword",
  "firstName": "Jane",
  "lastName": "Smith",
  "clinicId": "clinic-id"
}
```

**Response**:

```json
{
  "id": "new-user-id",
  "email": "newuser@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "STAFF",
  "clinicId": "clinic-id",
  "createdAt": "2023-05-20T15:30:00Z",
  "updatedAt": "2023-05-20T15:30:00Z"
}
```

### Change Password Request/Response

**Request (PATCH /auth/change-password)**:

```json
{
  "currentPassword": "currentpassword",
  "newPassword": "newstrongpassword",
  "confirmNewPassword": "newstrongpassword"
}
```

**Response**:

```json
{
  "message": "Password updated successfully"
}
```

## User Profile API Endpoints

**Base URL**: `/users`

| Method  | Endpoint | Description                                      | Authentication    |
| ------- | -------- | ------------------------------------------------ | ----------------- |
| `PATCH` | `/me`    | Update the logged-in user's first and last names | JWT Auth Required |

### Update Profile Request/Response

**Request (PATCH /users/me)**:

```json
{
  "firstName": "John",
  "lastName": "Smith"
}
```

**Response**:

```json
{
  "id": "user-id",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Smith",
  "role": "STAFF",
  "clinicId": "clinic-id",
  "isActive": true
}
```

Both fields in the request are optional, so you can update just the first name:

```json
{
  "firstName": "Johnny"
}
```

## Owner API Endpoints

**Base URL**: `/owners`

| Method   | Endpoint | Description                         | Authentication    |
| -------- | -------- | ----------------------------------- | ----------------- |
| `POST`   | `/`      | Create a new owner                  | JWT Auth Required |
| `GET`    | `/`      | Get all owners with optional search | JWT Auth Required |
| `GET`    | `/:id`   | Get a specific owner by ID          | JWT Auth Required |
| `PATCH`  | `/:id`   | Update a specific owner             | JWT Auth Required |
| `DELETE` | `/:id`   | Delete a specific owner             | JWT Auth Required |

### Owner Filtering and Search

The `/owners` endpoint supports searching across owner fields:

| Parameter | Type   | Description                                                 | Format/Example                |
| --------- | ------ | ----------------------------------------------------------- | ----------------------------- |
| `search`  | string | Text to search across firstName, lastName, email, and phone | Any string (case insensitive) |
| `page`    | number | The page number to retrieve                                 | Default: 1, Min: 1            |
| `limit`   | number | Number of items per page                                    | Default: 20, Min: 1, Max: 100 |

**Example**: `GET /owners?search=John&page=1&limit=10`

The search is designed to work with multi-word searches. For example, searching for "John Doe" will find owners where "John" appears in any searchable field AND "Doe" appears in any searchable field.

## Pet API Endpoints

**Base URL**: `/pets`

| Method | Endpoint | Description                       | Authentication    |
| ------ | -------- | --------------------------------- | ----------------- |
| `GET`  | `/`      | Get all pets with optional search | JWT Auth Required |

### Owner-Specific Pet Endpoints

**Base URL**: `/owners/:ownerId/pets`

| Method   | Endpoint | Description                   | Authentication    |
| -------- | -------- | ----------------------------- | ----------------- |
| `POST`   | `/`      | Create a new pet for an owner | JWT Auth Required |
| `GET`    | `/`      | Get all pets for an owner     | JWT Auth Required |
| `GET`    | `/:id`   | Get a specific pet by ID      | JWT Auth Required |
| `PATCH`  | `/:id`   | Update a specific pet         | JWT Auth Required |
| `DELETE` | `/:id`   | Delete a specific pet         | JWT Auth Required |

### Pet Filtering and Search

The `/pets` endpoint supports searching across pet fields:

| Parameter | Type   | Description                                                     | Format/Example                |
| --------- | ------ | --------------------------------------------------------------- | ----------------------------- |
| `search`  | string | Text to search across pet name, species, breed and owner's name | Any string (case insensitive) |
| `page`    | number | The page number to retrieve                                     | Default: 1, Min: 1            |
| `limit`   | number | Number of items per page                                        | Default: 20, Min: 1, Max: 100 |

**Example**: `GET /pets?search=Lab&page=1&limit=10`

Similar to owner search, the pet search also supports multi-word queries, checking if all words appear somewhere in the pet's or owner's details.

## Visits API Endpoints

### Pet-Specific Visit Endpoints

**Base URL**: `/pets/:petId/visits`

| Method   | Endpoint | Description                           | Authentication    |
| -------- | -------- | ------------------------------------- | ----------------- |
| `POST`   | `/`      | Create a new visit for a specific pet | JWT Auth Required |
| `GET`    | `/`      | Get all visits for a specific pet     | JWT Auth Required |
| `GET`    | `/:id`   | Get a specific visit by ID for a pet  | JWT Auth Required |
| `PATCH`  | `/:id`   | Update a specific visit for a pet     | JWT Auth Required |
| `DELETE` | `/:id`   | Delete a specific visit for a pet     | JWT Auth Required |

### Global Visit Endpoints

**Base URL**: `/visits`

| Method | Endpoint    | Description                                                 | Authentication    |
| ------ | ----------- | ----------------------------------------------------------- | ----------------- |
| `GET`  | `/upcoming` | Get upcoming visits (next 30 days)                          | JWT Auth Required |
| `GET`  | `/all`      | Get all visits for the clinic with filtering and pagination | JWT Auth Required |

## Clinic Profile API Endpoints

**Base URL**: `/clinic-profile`

| Method  | Endpoint | Description                                | Authentication    |
| ------- | -------- | ------------------------------------------ | ----------------- |
| `GET`   | `/`      | Get the logged-in user's clinic profile    | JWT Auth Required |
| `PATCH` | `/`      | Update the logged-in user's clinic profile | JWT Auth Required |

### Clinic Profile Update DTO

When updating a clinic profile, the following fields can be modified:

| Field     | Type   | Validation                     | Required |
| --------- | ------ | ------------------------------ | -------- |
| `name`    | string | Min length: 2, Max length: 100 | No       |
| `address` | string | Max length: 255                | No       |
| `phone`   | string | Max length: 20                 | No       |

### Example Request/Response

**Request (PATCH /clinic-profile)**:

```json
{
  "name": "Pet Care Clinic",
  "address": "123 Main St, Anytown, CA 12345",
  "phone": "(555) 123-4567"
}
```

**Response**:

```json
{
  "id": "clinic-id",
  "name": "Pet Care Clinic",
  "address": "123 Main St, Anytown, CA 12345",
  "phone": "(555) 123-4567",
  "createdAt": "2023-01-15T10:00:00Z",
  "updatedAt": "2023-05-20T15:30:00Z"
}
```

## Dashboard API Endpoints

**Base URL**: `/dashboard`

| Method | Endpoint | Description                                    | Authentication    |
| ------ | -------- | ---------------------------------------------- | ----------------- |
| `GET`  | `/stats` | Get statistics for the logged-in user's clinic | JWT Auth Required |

### Statistics Response Format

The statistics endpoint returns counts for entities within the clinic:

```json
{
  "ownerCount": 42,
  "petCount": 85,
  "upcomingVaccinationCount": 12,
  "dueTodayCount": 3,
  "isAdminView": false
}
```

This provides a quick overview of the clinic's size, upcoming vaccination visits, and reminders due today.

## Platform Admin API Endpoints

**Base URL**: `/admin/clinics`

| Method  | Endpoint | Description                                    | Authentication      |
| ------- | -------- | ---------------------------------------------- | ------------------- |
| `POST`  | `/`      | Create a new clinic                            | Admin Auth Required |
| `GET`   | `/`      | Get all clinics with basic statistics          | Admin Auth Required |
| `GET`   | `/:id`   | Get detailed information for a specific clinic | Admin Auth Required |
| `PATCH` | `/:id`   | Update settings for a specific clinic          | Admin Auth Required |

### Admin Authorization

All admin endpoints are protected by the `AdminGuard` which ensures that only users with the `ADMIN` role can access these resources.

### Create Clinic DTO

When creating a clinic as an admin, the following fields are available:

| Field                 | Type    | Validation                     | Required | Default |
| --------------------- | ------- | ------------------------------ | -------- | ------- |
| `name`                | string  | Min length: 2, Max length: 100 | Yes      | -       |
| `address`             | string  | Max length: 255                | No       | null    |
| `phone`               | string  | Max length: 20                 | No       | null    |
| `isActive`            | boolean | -                              | No       | false   |
| `canSendReminders`    | boolean | -                              | No       | false   |
| `subscriptionEndDate` | string  | ISO 8601 date format           | No       | null    |

### Clinic Settings Update DTO

When updating clinic settings as an admin, the following fields can be modified:

| Field                 | Type    | Validation                     | Required |
| --------------------- | ------- | ------------------------------ | -------- |
| `name`                | string  | Min length: 2, Max length: 100 | No       |
| `address`             | string  | Max length: 255                | No       |
| `phone`               | string  | Max length: 20                 | No       |
| `isActive`            | boolean | -                              | No       |
| `canSendReminders`    | boolean | -                              | No       |
| `subscriptionEndDate` | string  | ISO 8601 date format           | No       |

### Example Request/Response

**Request (PATCH /admin/clinics/:id)**:

```json
{
  "name": "Pet Care Clinic",
  "isActive": true,
  "canSendReminders": true,
  "subscriptionEndDate": "2024-12-31T23:59:59Z"
}
```

**Response**:

```json
{
  "id": "clinic-id",
  "name": "Pet Care Clinic",
  "address": "123 Main St, Anytown, CA 12345",
  "phone": "(555) 123-4567",
  "isActive": true,
  "canSendReminders": true,
  "subscriptionEndDate": "2024-12-31T23:59:59Z",
  "createdAt": "2023-01-15T10:00:00Z",
  "updatedAt": "2023-05-20T15:30:00Z"
}
```

## Filtering and Pagination for `/visits/all`

The `/visits/all` endpoint supports comprehensive filtering and pagination capabilities to help you retrieve exactly the visit data you need.

### Pagination Parameters

| Parameter | Type   | Description                 | Default | Range            |
| --------- | ------ | --------------------------- | ------- | ---------------- |
| `page`    | number | The page number to retrieve | 1       | Min: 1           |
| `limit`   | number | Number of items per page    | 20      | Min: 1, Max: 100 |

### Filtering Parameters

| Parameter   | Type   | Description                                                   | Format/Example                |
| ----------- | ------ | ------------------------------------------------------------- | ----------------------------- |
| `startDate` | string | Start date for filtering visits                               | ISO 8601 (e.g., `2023-01-01`) |
| `endDate`   | string | End date for filtering visits                                 | ISO 8601 (e.g., `2023-12-31`) |
| `visitType` | string | Type of visit to filter by                                    | e.g., `vaccination`, `dental` |
| `search`    | string | Text to search across pet names, owner names, and visit notes | Any string (case insensitive) |

### Response Format

```json
{
  "data": [
    {
      "id": "visit-id",
      "visitDate": "2023-05-15T10:00:00Z",
      "visitType": "vaccination",
      "notes": "Regular checkup, everything looks good",
      "nextReminderDate": "2023-11-15T10:00:00Z",
      "isReminderEnabled": true,
      "pet": {
        "id": "pet-id",
        "name": "Buddy",
        "owner": {
          "id": "owner-id",
          "firstName": "John",
          "lastName": "Doe"
        }
      }
    }
    // ... more visits
  ],
  "pagination": {
    "totalCount": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### Example Queries

1. **Basic Pagination**:

   ```
   GET /visits/all?page=2&limit=10
   ```

2. **Date Range Filtering**:

   ```
   GET /visits/all?startDate=2023-01-01&endDate=2023-06-30
   ```

3. **Visit Type Filtering**:

   ```
   GET /visits/all?visitType=vaccination
   ```

4. **Text Search**:

   ```
   GET /visits/all?search=Buddy
   ```

5. **Combined Filtering with Pagination**:
   ```
   GET /visits/all?search=Buddy&visitType=vaccination&startDate=2023-01-01&page=1&limit=5
   ```

### Implementation Notes

- The search is performed in a case-insensitive manner
- Search looks across pet names, owner first/last names, visit types, and visit notes
- Date filtering can be used with just a start date, just an end date, or both
- All filtering parameters are optional
- Filtering is combined with AND logic (all specified filters must match)
- Response always includes pagination metadata, even when filters return few results
- For multi-word searches (e.g., "black labrador"), the results will include entries where ALL words appear somewhere in the searched fields
