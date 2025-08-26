# Snack Survey Master

Vue 3 + TypeScript + Vite project for managing snack surveys with real-time voting capabilities.

## 🚀 Recent Updates

### ✅ Firebase Cleanup & Project Finalization (Prompt 5)
- **Firebase Cleanup**: Xóa hoàn toàn Firebase Firestore và Vuefire
- **Storage Isolation**: Tách Firebase Storage logic thành file riêng cho upload file
- **Package Cleanup**: Gỡ bỏ vuefire package, chỉ giữ firebase/storage
- **Code Refactoring**: Cập nhật components sử dụng TanStack Query thay vì useCollection
- **Documentation**: Cập nhật README với hướng dẫn Firebase Storage và manual testing
- **Project Structure**: Chuẩn hóa cấu trúc project và environment variables

### ✅ Auth Flow & Error Handling Improvements (Prompt 4)
- **Token Management**: Cải thiện quản lý access token và refresh token
- **Error Handling**: Chuẩn hóa error messages và user-friendly notifications
- **Auth Interceptors**: Tự động refresh token khi gặp 401, redirect khi refresh thất bại
- **Error Types**: Tạo error types thống nhất và error mapping
- **UI Components**: ErrorAlert component và useErrorHandler composable
- **Manual Testing**: Cập nhật test script với auth flow và error scenarios

### ✅ Admin UI Migration to TanStack Query (Prompt 3)
- **Admin UI** đã được refactor hoàn toàn từ Firebase sang **TanStack Query composables**
- **Real-time Firebase listeners** đã được loại bỏ
- **CRUD operations** cho Topics và Options sử dụng REST API với caching
- **Loading states** và **error handling** được tích hợp đầy đủ
- **Performance improvements** với automatic cache invalidation

### ✅ TanStack Query Composables (Prompt 2)
- **Topic composables**: `useTopicsList`, `useCreateTopic`, `useUpdateTopic`, `useDeleteTopic`
- **Option composables**: `useOptionsByTopic`, `useCreateOption`, `useUpdateOption`, `useDeleteOption`
- **Voting composables**: `useVoteOption`, `useSingleVote`, `useMultipleVote`
- **Automatic caching** và **state management** với TanStack Query

### ✅ REST API Migration (Prompt 1)
- **Service layer** đã được refactor từ Firebase sang REST API
- **Axios instance** với interceptors và error handling
- **TypeScript types** được generate từ Swagger/OpenAPI
- **API testing script** với `manual_api_test.sh`

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) to make the TypeScript language service aware of `.vue` types.

If the standalone TypeScript plugin doesn't feel fast enough to you, Volar has also implemented a [Take Over Mode](https://github.com/johnsoncodehk/volar/discussions/471#discussioncomment-1361669) that is more performant. You can enable it by the following steps:

1. Disable the built-in TypeScript Extension
   1. Run `Extensions: Show Built-in Extensions` from VSCode's command palette
   2. Find `TypeScript and JavaScript Language Features`, right click and select `Disable (Workspace)`
2. Reload the VSCode window by running `Developer: Reload Window` from the command palette.

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

### Prerequisites
- Node.js >= 16.0.0
- npm >= 8.0.0
- Backend server running on `http://localhost:3000`

### Installation

```sh
npm install
```

### Environment Configuration

Copy the environment example file and configure your variables:

```sh
cp env.example .env
```

**Required Environment Variables:**

```env
# API Configuration
VUE_APP_API_BASE_URL=http://localhost:3000

# Firebase Storage Configuration (for file uploads only)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

**Note:** Firebase Storage is only used for file uploads. All CRUD operations use REST API.

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

### Rules ues common

#

## API Testing

### Manual API Test Script

This project includes a comprehensive manual test script to verify all REST API endpoints for Admin functionality.

#### Prerequisites

1. **Backend Server**: Ensure the backend server is running on `http://localhost:3000`
2. **JWT Token**: You need a valid JWT token with admin privileges
3. **curl**: The script uses curl for HTTP requests (usually pre-installed on Unix systems)

#### Running the Test Script

**Method 1: Using npm script (Recommended)**
```bash
# Set your JWT token as environment variable
export TEST_JWT_TOKEN="your_jwt_token_here"

# Run the test script
npm run api:manual-test
```

**Method 2: Direct execution**
```bash
# Set your JWT token as environment variable
export TEST_JWT_TOKEN="your_jwt_token_here"

# Run the script directly
bash ./scripts/manual_api_test.sh
```

**Method 3: One-liner**
```bash
TEST_JWT_TOKEN="your_jwt_token_here" npm run api:manual-test
```

#### What the Script Tests

The manual test script performs the following API operations in sequence:

**Core API Tests (1-11):**
1. **GET /api/topics** - Retrieve list of topics
2. **POST /api/topics** - Create a new topic
3. **GET /api/topics/{id}** - Get topic by ID
4. **PUT /api/topics/{id}** - Update topic
5. **POST /api/options** - Create a new option
6. **GET /api/options/topic/{topicId}** - Get options by topic ID
7. **PUT /api/options/{id}** - Update option
8. **POST /api/options/{id}/vote** - Vote for an option
9. **DELETE /api/options/{id}** - Delete an option
10. **DELETE /api/topics/{id}** - Delete topic
11. **GET /api/vote/stats/{topicId}** - Get voting statistics

**Authentication Tests (12-13):**
12. **POST /api/auth/login** - Test login flow and token management
13. **POST /api/auth/refresh-token** - Test token refresh functionality

**Error Handling Tests (14):**
14. **Error Scenarios** - Test 400, 401, 404 error responses

#### Expected Output

The script provides colored output indicating success (✅) or failure (❌) for each test:

```
🚀 Starting SnackSurveyMaster API Tests
Base URL: http://localhost:3000
JWT Token: eyJhbGciOiJIUzI1NiIs...

📋 Test 1: GET /api/topics
✅ SUCCESS (HTTP 200)
Response: {"success":true,"data":{"topics":[...]},"timestamp":"..."}

📝 Test 2: POST /api/topics
✅ SUCCESS (HTTP 201)
📌 Topic ID: 60d21b4667d0d8992e610c85
...
```

#### Troubleshooting

**Common Issues:**

1. **"TEST_JWT_TOKEN environment variable is required"**
   - Make sure you've set the JWT token: `export TEST_JWT_TOKEN="your_token"`

2. **Connection refused errors**
   - Ensure the backend server is running on `http://localhost:3000`
   - Check if the server is accessible: `curl http://localhost:3000/api/topics`

3. **401 Unauthorized errors**
   - Verify your JWT token is valid and not expired
   - Ensure the token has admin privileges

4. **404 Not Found errors**
   - Check if the API endpoints match the backend implementation
   - Verify the base URL is correct

#### Getting a JWT Token

To get a valid JWT token for testing:

1. **Login via API:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"your_password"}'
   ```

2. **Extract the token from the response:**
   ```json
   {
     "success": true,
     "data": {
       "accessToken": "eyJhbGciOiJIUzI1NiIs...",
       "refreshToken": "..."
     }
   }
   ```

3. **Use the accessToken value:**
   ```bash
   export TEST_JWT_TOKEN="eyJhbGciOiJIUzI1NiIs..."
   ```

#### Notes

- The script creates test data (topics and options) and cleans up after itself
- Some tests depend on previous test results (e.g., topic ID from creation is used for retrieval)
- The script is designed to be idempotent - you can run it multiple times safely
- All test data is prefixed with "Test" to make it easily identifiable
- Auth tests require valid credentials (admin@example.com/admin123)
- Error handling tests verify proper HTTP status codes and messages

## 🔐 Authentication & Error Handling

### Token Management

The application uses JWT tokens for authentication with automatic refresh capabilities:

#### Auth Store (`src/stores/auth.ts`)
```typescript
// Token management
const authStore = useAuthStore();

// Login and store tokens
await authStore.login({ email, password });

// Check authentication status
const isAuthenticated = authStore.isAuthenticated();

// Manual token management
authStore.setTokens(accessToken, refreshToken);
authStore.clearTokens();
```

#### Automatic Token Refresh
- **401 Unauthorized**: Automatically attempts to refresh token
- **Refresh Success**: Retries original request with new token
- **Refresh Failure**: Logs out user and redirects to login page

### Error Handling

#### Structured Error Response
All API errors are standardized with the following structure:
```typescript
interface ApiError {
  message: string;    // User-friendly error message
  code: number;       // HTTP status code
  details?: any;      // Additional error details
  originalError?: any; // Original axios error
}
```

#### Error Messages Mapping
Common HTTP status codes are mapped to Vietnamese error messages:
- **400**: "Dữ liệu không hợp lệ"
- **401**: "Bạn cần đăng nhập để tiếp tục"
- **403**: "Bạn không có quyền thực hiện hành động này"
- **404**: "Không tìm thấy dữ liệu"
- **500**: "Lỗi máy chủ, vui lòng thử lại sau"

#### Using Error Handler in Components

**1. ErrorAlert Component:**
```vue
<template>
  <ErrorAlert 
    :error="error" 
    :dismissible="true" 
    @dismiss="clearError" 
  />
</template>

<script setup>
import ErrorAlert from '@/components/ErrorAlert.vue';
</script>
```

**2. useErrorHandler Composable:**
```vue
<script setup>
import { useErrorHandler } from '@/composables/useErrorHandler';

const { error, loading, clearError, executeWithErrorHandling } = useErrorHandler();

// Execute API call with error handling
const createTopic = async () => {
  await executeWithErrorHandling(
    async () => {
      const response = await api.post('/api/topics', topicData);
      // Handle success
    },
    {
      onError: (err) => {
        console.error('Failed to create topic:', err);
      }
    }
  );
};
</script>
```

**3. Complete Example:**
See `src/examples/AdminWithErrorHandling.vue` for a full implementation example.

### Testing Auth & Error Handling

#### Manual Testing
The updated test script includes comprehensive auth and error testing:

```bash
# Test authentication flow
TEST_JWT_TOKEN="your_token" npm run api:manual-test
```

**Auth Tests:**
- Login with valid credentials
- Token extraction and validation
- API calls with new tokens
- Refresh token functionality

**Error Tests:**
- 400 Bad Request (validation errors)
- 401 Unauthorized (invalid tokens)
- 404 Not Found (non-existent resources)

#### Error Scenarios Testing
```bash
# Test specific error scenarios
curl -X POST http://localhost:3000/api/topics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid_token" \
  -d '{"title":""}'
```

### Best Practices

1. **Always use error handling**: Wrap API calls with `executeWithErrorHandling`
2. **Show user-friendly messages**: Use the standardized error messages
3. **Handle loading states**: Show loading indicators during API calls
4. **Clear errors on new actions**: Reset error state when starting new operations
5. **Log errors for debugging**: Use console.error for development debugging

## 🏗️ Architecture Overview

### Current Tech Stack
- **Frontend**: Vue 3 + TypeScript + Vite
- **State Management**: Pinia + TanStack Query
- **UI Framework**: Vuetify 3
- **API Layer**: Axios with interceptors
- **File Storage**: Firebase Storage (upload only)
- **Backend**: REST API (Node.js/Express)

### Firebase Usage
- **Firebase Storage**: Used only for file uploads (images, documents)
- **Firebase Firestore**: ❌ Removed - replaced with REST API
- **Vuefire**: ❌ Removed - replaced with TanStack Query

### Project Structure
```
src/
├── firebase/
│   └── storage.ts          # Firebase Storage configuration
├── core/
│   ├── api.ts             # Axios instance with interceptors
│   └── interfaces/        # TypeScript interfaces
├── composables/           # TanStack Query composables
├── services/              # API service layer
├── stores/                # Pinia stores
├── types/                 # TypeScript type definitions
└── views/                 # Vue components
```

### Migration Summary
- ✅ **Firebase Firestore** → **REST API**
- ✅ **Vuefire** → **TanStack Query**
- ✅ **Firebase Auth** → **JWT + Refresh Token**
- ✅ **Manual Error Handling** → **Centralized Error System**
- 🔄 **Firebase Storage** → **Retained for file uploads**
