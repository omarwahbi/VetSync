# Pet Well App API Documentation

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

## Filtering and Pagination for `/visits/all`

The `/visits/all` endpoint supports comprehensive filtering and pagination capabilities to help you retrieve exactly the visit data you need.

### Pagination Parameters

| Parameter | Type   | Description                 | Default | Range            |
| --------- | ------ | --------------------------- | ------- | ---------------- |
| `page`    | number | The page number to retrieve | 1       | Min: 1           |
| `limit`   | number | Number of items per page    | 20      | Min: 1, Max: 100 |

### Filtering Parameters

| Parameter   | Type   | Description                                                   | Format/Example                 |
| ----------- | ------ | ------------------------------------------------------------- | ------------------------------ |
| `startDate` | string | Start date for filtering visits                               | ISO 8601 (e.g., `2023-01-01`)  |
| `endDate`   | string | End date for filtering visits                                 | ISO 8601 (e.g., `2023-12-31`)  |
| `visitType` | string | Type of visit to filter by                                    | e.g., `CHECKUP`, `VACCINATION` |
| `search`    | string | Text to search across pet names, owner names, and visit notes | Any string (case insensitive)  |

### Response Format

```json
{
  "data": [
    {
      "id": "visit-id",
      "visitDate": "2023-05-15T10:00:00Z",
      "visitType": "CHECKUP",
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
  "meta": {
    "totalCount": 42,
    "currentPage": 1,
    "perPage": 20,
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
   GET /visits/all?visitType=VACCINATION
   ```

4. **Text Search**:

   ```
   GET /visits/all?search=Buddy
   ```

5. **Combined Filtering with Pagination**:
   ```
   GET /visits/all?search=Buddy&visitType=CHECKUP&startDate=2023-01-01&page=1&limit=5
   ```

### Implementation Notes

- The search is performed in a case-insensitive manner
- Search looks across pet names, owner first/last names, and visit notes
- Date filtering can be used with just a start date, just an end date, or both
- All filtering parameters are optional
- Filtering is combined with AND logic (all specified filters must match)
- Response always includes pagination metadata, even when filters return few results
