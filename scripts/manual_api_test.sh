#!/bin/bash

# Manual API Test Script for SnackSurveyMaster
# This script tests all REST API endpoints for Admin functionality

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:3000"
API_BASE="${BASE_URL}/api"

# Check if JWT token is provided
if [ -z "$TEST_JWT_TOKEN" ]; then
    echo -e "${RED}Error: TEST_JWT_TOKEN environment variable is required${NC}"
    echo "Usage: TEST_JWT_TOKEN=your_jwt_token_here bash ./scripts/manual_api_test.sh"
    echo "Example: TEST_JWT_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... bash ./scripts/manual_api_test.sh"
    exit 1
fi

# Headers
HEADERS=(
    "-H" "Content-Type: application/json"
    "-H" "Authorization: Bearer ${TEST_JWT_TOKEN}"
)

echo -e "${BLUE}🚀 Starting SnackSurveyMaster API Tests${NC}"
echo -e "${BLUE}Base URL: ${BASE_URL}${NC}"
echo -e "${BLUE}JWT Token: ${TEST_JWT_TOKEN:0:20}...${NC}"
echo ""

# Test 1: Get Topics List
echo -e "${YELLOW}📋 Test 1: GET /api/topics${NC}"
echo "Testing topic list retrieval..."
RESPONSE=$(curl -s -w "\n%{http_code}" "${HEADERS[@]}" "${API_BASE}/topics")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ SUCCESS (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY" | jq '.' 2>/dev/null || echo "Response: $BODY"
else
    echo -e "${RED}❌ FAILED (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
fi
echo ""

# Test 2: Create Topic
echo -e "${YELLOW}📝 Test 2: POST /api/topics${NC}"
echo "Testing topic creation..."
TOPIC_DATA='{
    "title": "Test Topic from Script",
    "description": "This is a test topic created by the manual test script",
    "voting_type": "single",
    "time_limit": 60,
    "team": "FE"
}'

RESPONSE=$(curl -s -w "\n%{http_code}" "${HEADERS[@]}" -X POST -d "$TOPIC_DATA" "${API_BASE}/topics")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" -eq 201 ]; then
    echo -e "${GREEN}✅ SUCCESS (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY" | jq '.' 2>/dev/null || echo "Response: $BODY"
    # Extract topic ID for later tests
    TOPIC_ID=$(echo "$BODY" | jq -r '.data._id' 2>/dev/null)
    if [ "$TOPIC_ID" != "null" ] && [ "$TOPIC_ID" != "" ]; then
        echo -e "${BLUE}📌 Topic ID: $TOPIC_ID${NC}"
    fi
else
    echo -e "${RED}❌ FAILED (HTTP $HTTP_CODE)${NC}"
    echo "Response: $BODY"
fi
echo ""

# Test 3: Get Topic by ID (if we have a topic ID)
if [ ! -z "$TOPIC_ID" ] && [ "$TOPIC_ID" != "null" ]; then
    echo -e "${YELLOW}🔍 Test 3: GET /api/topics/{id}${NC}"
    echo "Testing topic retrieval by ID..."
    RESPONSE=$(curl -s -w "\n%{http_code}" "${HEADERS[@]}" "${API_BASE}/topics/${TOPIC_ID}")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n -1)

    if [ "$HTTP_CODE" -eq 200 ]; then
        echo -e "${GREEN}✅ SUCCESS (HTTP $HTTP_CODE)${NC}"
        echo "Response: $BODY" | jq '.' 2>/dev/null || echo "Response: $BODY"
    else
        echo -e "${RED}❌ FAILED (HTTP $HTTP_CODE)${NC}"
        echo "Response: $BODY"
    fi
    echo ""
fi

# Test 4: Update Topic (if we have a topic ID)
if [ ! -z "$TOPIC_ID" ] && [ "$TOPIC_ID" != "null" ]; then
    echo -e "${YELLOW}✏️  Test 4: PUT /api/topics/{id}${NC}"
    echo "Testing topic update..."
    UPDATE_DATA='{
        "title": "Updated Test Topic",
        "description": "This topic has been updated by the test script",
        "is_active": true
    }'

    RESPONSE=$(curl -s -w "\n%{http_code}" "${HEADERS[@]}" -X PUT -d "$UPDATE_DATA" "${API_BASE}/topics/${TOPIC_ID}")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n -1)

    if [ "$HTTP_CODE" -eq 200 ]; then
        echo -e "${GREEN}✅ SUCCESS (HTTP $HTTP_CODE)${NC}"
        echo "Response: $BODY" | jq '.' 2>/dev/null || echo "Response: $BODY"
    else
        echo -e "${RED}❌ FAILED (HTTP $HTTP_CODE)${NC}"
        echo "Response: $BODY"
    fi
    echo ""
fi

# Test 5: Create Option (if we have a topic ID)
if [ ! -z "$TOPIC_ID" ] && [ "$TOPIC_ID" != "null" ]; then
    echo -e "${YELLOW}📝 Test 5: POST /api/options${NC}"
    echo "Testing option creation..."
    OPTION_DATA="{
        \"title\": \"Test Option 1\",
        \"topic_id\": \"${TOPIC_ID}\"
    }"

    RESPONSE=$(curl -s -w "\n%{http_code}" "${HEADERS[@]}" -X POST -d "$OPTION_DATA" "${API_BASE}/options")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n -1)

    if [ "$HTTP_CODE" -eq 201 ]; then
        echo -e "${GREEN}✅ SUCCESS (HTTP $HTTP_CODE)${NC}"
        echo "Response: $BODY" | jq '.' 2>/dev/null || echo "Response: $BODY"
        # Extract option ID for later tests
        OPTION_ID=$(echo "$BODY" | jq -r '.data._id' 2>/dev/null)
        if [ "$OPTION_ID" != "null" ] && [ "$OPTION_ID" != "" ]; then
            echo -e "${BLUE}📌 Option ID: $OPTION_ID${NC}"
        fi
    else
        echo -e "${RED}❌ FAILED (HTTP $HTTP_CODE)${NC}"
        echo "Response: $BODY"
    fi
    echo ""
fi

# Test 6: Get Options by Topic ID
if [ ! -z "$TOPIC_ID" ] && [ "$TOPIC_ID" != "null" ]; then
    echo -e "${YELLOW}🔍 Test 6: GET /api/options/topic/{topicId}${NC}"
    echo "Testing options retrieval by topic ID..."
    RESPONSE=$(curl -s -w "\n%{http_code}" "${HEADERS[@]}" "${API_BASE}/options/topic/${TOPIC_ID}")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n -1)

    if [ "$HTTP_CODE" -eq 200 ]; then
        echo -e "${GREEN}✅ SUCCESS (HTTP $HTTP_CODE)${NC}"
        echo "Response: $BODY" | jq '.' 2>/dev/null || echo "Response: $BODY"
    else
        echo -e "${RED}❌ FAILED (HTTP $HTTP_CODE)${NC}"
        echo "Response: $BODY"
    fi
    echo ""
fi

# Test 7: Update Option (if we have an option ID)
if [ ! -z "$OPTION_ID" ] && [ "$OPTION_ID" != "null" ]; then
    echo -e "${YELLOW}✏️  Test 7: PUT /api/options/{id}${NC}"
    echo "Testing option update..."
    UPDATE_OPTION_DATA='{
        "title": "Updated Test Option"
    }'

    RESPONSE=$(curl -s -w "\n%{http_code}" "${HEADERS[@]}" -X PUT -d "$UPDATE_OPTION_DATA" "${API_BASE}/options/${OPTION_ID}")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n -1)

    if [ "$HTTP_CODE" -eq 200 ]; then
        echo -e "${GREEN}✅ SUCCESS (HTTP $HTTP_CODE)${NC}"
        echo "Response: $BODY" | jq '.' 2>/dev/null || echo "Response: $BODY"
    else
        echo -e "${RED}❌ FAILED (HTTP $HTTP_CODE)${NC}"
        echo "Response: $BODY"
    fi
    echo ""
fi

# Test 8: Vote for Option (if we have an option ID)
if [ ! -z "$OPTION_ID" ] && [ "$OPTION_ID" != "null" ]; then
    echo -e "${YELLOW}🗳️  Test 8: POST /api/options/{id}/vote${NC}"
    echo "Testing option voting..."
    RESPONSE=$(curl -s -w "\n%{http_code}" "${HEADERS[@]}" -X POST "${API_BASE}/options/${OPTION_ID}/vote")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n -1)

    if [ "$HTTP_CODE" -eq 200 ]; then
        echo -e "${GREEN}✅ SUCCESS (HTTP $HTTP_CODE)${NC}"
        echo "Response: $BODY" | jq '.' 2>/dev/null || echo "Response: $BODY"
    else
        echo -e "${RED}❌ FAILED (HTTP $HTTP_CODE)${NC}"
        echo "Response: $BODY"
    fi
    echo ""
fi

# Test 9: Delete Option (if we have an option ID)
if [ ! -z "$OPTION_ID" ] && [ "$OPTION_ID" != "null" ]; then
    echo -e "${YELLOW}🗑️  Test 9: DELETE /api/options/{id}${NC}"
    echo "Testing option deletion..."
    RESPONSE=$(curl -s -w "\n%{http_code}" "${HEADERS[@]}" -X DELETE "${API_BASE}/options/${OPTION_ID}")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n -1)

    if [ "$HTTP_CODE" -eq 200 ]; then
        echo -e "${GREEN}✅ SUCCESS (HTTP $HTTP_CODE)${NC}"
        echo "Response: $BODY" | jq '.' 2>/dev/null || echo "Response: $BODY"
    else
        echo -e "${RED}❌ FAILED (HTTP $HTTP_CODE)${NC}"
        echo "Response: $BODY"
    fi
    echo ""
fi

# Test 10: Delete Topic (if we have a topic ID)
if [ ! -z "$TOPIC_ID" ] && [ "$TOPIC_ID" != "null" ]; then
    echo -e "${YELLOW}🗑️  Test 10: DELETE /api/topics/{id}${NC}"
    echo "Testing topic deletion..."
    RESPONSE=$(curl -s -w "\n%{http_code}" "${HEADERS[@]}" -X DELETE "${API_BASE}/topics/${TOPIC_ID}")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n -1)

    if [ "$HTTP_CODE" -eq 200 ]; then
        echo -e "${GREEN}✅ SUCCESS (HTTP $HTTP_CODE)${NC}"
        echo "Response: $BODY" | jq '.' 2>/dev/null || echo "Response: $BODY"
    else
        echo -e "${RED}❌ FAILED (HTTP $HTTP_CODE)${NC}"
        echo "Response: $BODY"
    fi
    echo ""
fi

# Test 11: Get Voting Statistics (if we have a topic ID)
if [ ! -z "$TOPIC_ID" ] && [ "$TOPIC_ID" != "null" ]; then
    echo -e "${YELLOW}📊 Test 11: GET /api/vote/stats/{topicId}${NC}"
    echo "Testing voting statistics..."
    RESPONSE=$(curl -s -w "\n%{http_code}" "${HEADERS[@]}" "${API_BASE}/vote/stats/${TOPIC_ID}")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n -1)

    if [ "$HTTP_CODE" -eq 200 ]; then
        echo -e "${GREEN}✅ SUCCESS (HTTP $HTTP_CODE)${NC}"
        echo "Response: $BODY" | jq '.' 2>/dev/null || echo "Response: $BODY"
    else
        echo -e "${RED}❌ FAILED (HTTP $HTTP_CODE)${NC}"
        echo "Response: $BODY"
    fi
    echo ""
fi

# Test 12: Test Authentication Flow
echo -e "${YELLOW}🔐 Test 12: Authentication Flow${NC}"
echo "Testing login and token management..."

# Test login
LOGIN_DATA='{
    "email": "admin@example.com",
    "password": "admin123"
}'

echo "Testing login..."
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -H "Content-Type: application/json" -X POST -d "$LOGIN_DATA" "${API_BASE}/auth/login")
LOGIN_HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | head -n -1)

if [ "$LOGIN_HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Login SUCCESS (HTTP $LOGIN_HTTP_CODE)${NC}"
    # Extract tokens
    ACCESS_TOKEN=$(echo "$LOGIN_BODY" | jq -r '.data.accessToken' 2>/dev/null)
    REFRESH_TOKEN=$(echo "$LOGIN_BODY" | jq -r '.data.refreshToken' 2>/dev/null)
    
    if [ "$ACCESS_TOKEN" != "null" ] && [ "$ACCESS_TOKEN" != "" ]; then
        echo -e "${BLUE}📌 Access Token: ${ACCESS_TOKEN:0:20}...${NC}"
        # Test with new token
        echo "Testing API call with new token..."
        TEST_HEADERS=(
            "-H" "Content-Type: application/json"
            "-H" "Authorization: Bearer ${ACCESS_TOKEN}"
        )
        
        TEST_RESPONSE=$(curl -s -w "\n%{http_code}" "${TEST_HEADERS[@]}" "${API_BASE}/topics")
        TEST_HTTP_CODE=$(echo "$TEST_RESPONSE" | tail -n1)
        
        if [ "$TEST_HTTP_CODE" -eq 200 ]; then
            echo -e "${GREEN}✅ API call with new token SUCCESS${NC}"
        else
            echo -e "${RED}❌ API call with new token FAILED (HTTP $TEST_HTTP_CODE)${NC}"
        fi
    fi
else
    echo -e "${RED}❌ Login FAILED (HTTP $LOGIN_HTTP_CODE)${NC}"
    echo "Response: $LOGIN_BODY"
fi
echo ""

# Test 13: Test Refresh Token
if [ ! -z "$REFRESH_TOKEN" ] && [ "$REFRESH_TOKEN" != "null" ]; then
    echo -e "${YELLOW}🔄 Test 13: Refresh Token${NC}"
    echo "Testing token refresh..."
    
    REFRESH_DATA="{
        \"refreshToken\": \"${REFRESH_TOKEN}\"
    }"
    
    REFRESH_RESPONSE=$(curl -s -w "\n%{http_code}" -H "Content-Type: application/json" -X POST -d "$REFRESH_DATA" "${API_BASE}/auth/refresh-token")
    REFRESH_HTTP_CODE=$(echo "$REFRESH_RESPONSE" | tail -n1)
    REFRESH_BODY=$(echo "$REFRESH_RESPONSE" | head -n -1)
    
    if [ "$REFRESH_HTTP_CODE" -eq 200 ]; then
        echo -e "${GREEN}✅ Refresh Token SUCCESS (HTTP $REFRESH_HTTP_CODE)${NC}"
        echo "Response: $REFRESH_BODY" | jq '.' 2>/dev/null || echo "Response: $REFRESH_BODY"
    else
        echo -e "${RED}❌ Refresh Token FAILED (HTTP $REFRESH_HTTP_CODE)${NC}"
        echo "Response: $REFRESH_BODY"
    fi
    echo ""
fi

# Test 14: Test Error Handling
echo -e "${YELLOW}⚠️  Test 14: Error Handling${NC}"
echo "Testing various error scenarios..."

# Test 400 - Bad Request
echo "Testing 400 Bad Request..."
BAD_REQUEST_DATA='{
    "title": "",
    "description": "Test with empty title"
}'

BAD_REQUEST_RESPONSE=$(curl -s -w "\n%{http_code}" "${HEADERS[@]}" -X POST -d "$BAD_REQUEST_DATA" "${API_BASE}/topics")
BAD_REQUEST_HTTP_CODE=$(echo "$BAD_REQUEST_RESPONSE" | tail -n1)
BAD_REQUEST_BODY=$(echo "$BAD_REQUEST_RESPONSE" | head -n -1)

if [ "$BAD_REQUEST_HTTP_CODE" -eq 400 ]; then
    echo -e "${GREEN}✅ 400 Bad Request handled correctly${NC}"
    echo "Response: $BAD_REQUEST_BODY" | jq '.' 2>/dev/null || echo "Response: $BAD_REQUEST_BODY"
else
    echo -e "${YELLOW}⚠️  Expected 400, got $BAD_REQUEST_HTTP_CODE${NC}"
fi
echo ""

# Test 401 - Unauthorized (with invalid token)
echo "Testing 401 Unauthorized..."
INVALID_HEADERS=(
    "-H" "Content-Type: application/json"
    "-H" "Authorization: Bearer invalid_token_12345"
)

UNAUTHORIZED_RESPONSE=$(curl -s -w "\n%{http_code}" "${INVALID_HEADERS[@]}" "${API_BASE}/topics")
UNAUTHORIZED_HTTP_CODE=$(echo "$UNAUTHORIZED_RESPONSE" | tail -n1)
UNAUTHORIZED_BODY=$(echo "$UNAUTHORIZED_RESPONSE" | head -n -1)

if [ "$UNAUTHORIZED_HTTP_CODE" -eq 401 ]; then
    echo -e "${GREEN}✅ 401 Unauthorized handled correctly${NC}"
    echo "Response: $UNAUTHORIZED_BODY" | jq '.' 2>/dev/null || echo "Response: $UNAUTHORIZED_BODY"
else
    echo -e "${YELLOW}⚠️  Expected 401, got $UNAUTHORIZED_HTTP_CODE${NC}"
fi
echo ""

# Test 404 - Not Found
echo "Testing 404 Not Found..."
NOT_FOUND_RESPONSE=$(curl -s -w "\n%{http_code}" "${HEADERS[@]}" "${API_BASE}/topics/nonexistent_id_12345")
NOT_FOUND_HTTP_CODE=$(echo "$NOT_FOUND_RESPONSE" | tail -n1)
NOT_FOUND_BODY=$(echo "$NOT_FOUND_RESPONSE" | head -n -1)

if [ "$NOT_FOUND_HTTP_CODE" -eq 404 ]; then
    echo -e "${GREEN}✅ 404 Not Found handled correctly${NC}"
    echo "Response: $NOT_FOUND_BODY" | jq '.' 2>/dev/null || echo "Response: $NOT_FOUND_BODY"
else
    echo -e "${YELLOW}⚠️  Expected 404, got $NOT_FOUND_HTTP_CODE${NC}"
fi
echo ""

echo -e "${BLUE}🏁 API Tests Completed${NC}"
echo ""
echo -e "${YELLOW}📝 Notes:${NC}"
echo "- Make sure the backend server is running on ${BASE_URL}"
echo "- Ensure you have a valid JWT token with admin privileges"
echo "- Some tests depend on previous test results (topic/option IDs)"
echo "- Check the server logs for any additional error details"
echo "- Auth tests require valid credentials (admin@example.com/admin123)"
echo "- Error handling tests verify proper HTTP status codes and messages"
echo ""
echo -e "${GREEN}✅ All tests completed!${NC}"
