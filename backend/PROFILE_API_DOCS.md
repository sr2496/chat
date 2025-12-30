# User Profile Update API - Backend Implementation

## Summary

Successfully created the backend API endpoint for updating user profiles with avatar upload support.

---

## Files Modified/Created

### 1. **Migration**: `2025_12_30_102024_add_avatar_to_users_table.php`
- Added `avatar` column to `users` table
- Type: `string`, nullable
- Position: After `email` column
- Already migrated ✅

### 2. **Controller**: `AuthController.php`
- Added `updateProfile()` method
- Location: `/var/www/html/chat/backend/app/Http/Controllers/AuthController.php`

### 3. **Routes**: `api.php`
- Added route: `POST /api/user/profile`
- Protected by `auth:sanctum` middleware
- Location: `/var/www/html/chat/backend/routes/api.php`

---

## API Endpoint

### **POST /api/user/profile**

**Authentication**: Required (Sanctum middleware)

**Request**:
```http
POST /api/user/profile
Content-Type: multipart/form-data
Authorization: Bearer {token}

Form Data:
- name: string (optional, min: 2, max: 50)
- avatar: file (optional, image: jpeg,png,jpg,gif,webp, max: 2MB)
```

**Response** (Success - 200):
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "name": "Updated Name",
    "email": "user@example.com",
    "avatar": "/storage/avatars/xyz123.jpg",
    "created_at": "2024-01-01T00:00:00.000000Z",
    "updated_at": "2024-01-02T00:00:00.000000Z"
  }
}
```

**Response** (Validation Error - 422):
```json
{
  "message": "The name field must be at least 2 characters. (and 1 more error)",
  "errors": {
    "name": ["The name field must be at least 2 characters."],
    "avatar": ["The avatar must be an image."]
  }
}
```

---

## Features

### Name Update
- ✅ Validation: min 2 chars, max 50 chars
- ✅ Optional field (use `sometimes` validation)
- ✅ Updates only if provided in request

### Avatar Upload
- ✅ **Accepted formats**: JPEG, PNG, JPG, GIF, WEBP
- ✅ **Max file size**: 2MB (2048 KB)
- ✅ **Storage location**: `storage/app/public/avatars/`
- ✅ **Public URL**: `/storage/avatars/{filename}`
- ✅ **Old avatar cleanup**: Automatically deletes previous avatar when uploading new one
- ✅ **Validation**: Image file type and size checks

### Security
- ✅ Protected by Sanctum authentication
- ✅ User can only update their own profile
- ✅ File validation prevents malicious uploads
- ✅ Storage in secure public directory

---

## How It Works

1. **Request received** → Validated (name & avatar)
2. **Name update** → If `name` is in request, update user name
3. **Avatar upload**:
   - Check if avatar file exists in request
   - Delete old avatar from storage (if exists)
   - Store new avatar in `public/avatars/` directory
   - Save path as `/storage/avatars/{filename}` in database
4. **Save user** → Persists changes to database
5. **Return response** → Updated user object with new data

---

## Storage Configuration

- **Symbolic link**: `public/storage` → `../storage/app/public` (Already exists ✅)
- **Avatar directory**: `storage/app/public/avatars/`
- **Accessible via**: `http://yoursite.com/storage/avatars/filename.jpg`

---

## Testing the API

### Using cURL:

```bash
# Update name only
curl -X POST http://localhost:8000/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=John Doe"

# Update avatar only
curl -X POST http://localhost:8000/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "avatar=@/path/to/image.jpg"

# Update both
curl -X POST http://localhost:8000/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=John Doe" \
  -F "avatar=@/path/to/image.jpg"
```

---

## Frontend Integration

The frontend (`user.ts` store) is already configured to call this endpoint:

```typescript
async updateProfile(data: { name?: string; avatar?: File }) {
  const formData = new FormData();
  if (data.name) formData.append('name', data.name);
  if (data.avatar) formData.append('avatar', data.avatar);
  
  const response = await api.post('/user/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  
  this.user = response.data.user;
  return response.data;
}
```

---

## Database Schema

### Users Table (Updated):
```sql
CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  avatar VARCHAR(255) NULL,  -- NEW COLUMN
  email_verified_at TIMESTAMP NULL,
  password VARCHAR(255) NOT NULL,
  remember_token VARCHAR(100) NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL
);
```

---

## Status: ✅ Complete

- ✅ Migration created and executed
- ✅ Controller method implemented
- ✅ Route added
- ✅ Validation configured
- ✅ File storage configured
- ✅ Frontend already integrated

Everything is ready to use!
