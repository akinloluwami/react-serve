#!/bin/bash

echo "🚀 Testing File Based Routing API Endpoints"
echo "======================================"

BASE_URL=${BASE_URL:-"http://localhost:7070"}
API="$BASE_URL/api"
ADMIN_TOKEN=${ADMIN_TOKEN:-"valid-token"}


echo ""
echo "1. API Root (GET /api)"
echo "---------------------"
RESP=$(curl -X GET "$API" \
  -H "Content-Type: application/json" \
  -sS)
echo "$RESP"
curl -X GET "$API" \
  -H "Content-Type: application/json" \
  -sS -o /dev/null -w "\nStatus: %{http_code}\n"

echo ""
echo "2. API Root (POST /api)"
echo "----------------------"
RESP=$(curl -X POST "$API" \
  -H "Content-Type: application/json" \
  -d '{"ping":true}' \
  -sS)
echo "$RESP"
curl -X POST "$API" \
  -H "Content-Type: application/json" \
  -d '{"ping":true}' \
  -sS -o /dev/null -w "\nStatus: %{http_code}\n"

echo ""
echo "3. Users list (GET /api/users)"
echo "-----------------------------"
RESP=$(curl -X GET "$API/users" \
  -H "Content-Type: application/json" \
  -sS)
echo "$RESP"
curl -X GET "$API/users" \
  -H "Content-Type: application/json" \
  -sS -o /dev/null -w "\nStatus: %{http_code}\n"

echo ""
echo "4. Create user (POST /api/users)"
echo "-------------------------------"
RESP=$(curl -X POST "$API/users" \
  -H "Content-Type: application/json" \
  -d '{"name":"New User"}' \
  -sS)
echo "$RESP"
curl -X POST "$API/users" \
  -H "Content-Type: application/json" \
  -d '{"name":"New User"}' \
  -sS -o /dev/null -w "\nStatus: %{http_code}\n"

echo ""
echo "5. Get user by id (GET /api/users/1)"
echo "-----------------------------------"
RESP=$(curl -X GET "$API/users/1" \
  -H "Content-Type: application/json" \
  -sS)
echo "$RESP"
curl -X GET "$API/users/1" \
  -H "Content-Type: application/json" \
  -sS -o /dev/null -w "\nStatus: %{http_code}\n"

echo ""
echo "6. Blog catch-all (GET /api/blog/a/b/c)"
echo "--------------------------------------"
RESP=$(curl -X GET "$API/blog/a/b/c" \
  -H "Content-Type: application/json" \
  -sS)
echo "$RESP"
curl -X GET "$API/blog/a/b/c" \
  -H "Content-Type: application/json" \
  -sS -o /dev/null -w "\nStatus: %{http_code}\n"

echo ""
echo "7. Docs optional catch-all (GET /api/docs)"
echo "-----------------------------------------"
RESP=$(curl -X GET "$API/docs" \
  -H "Content-Type: application/json" \
  -sS)
echo "$RESP"
curl -X GET "$API/docs" \
  -H "Content-Type: application/json" \
  -sS -o /dev/null -w "\nStatus: %{http_code}\n"

echo ""
echo "8. Docs optional catch-all (GET /api/docs/guide)"
echo "-----------------------------------------------"
RESP=$(curl -X GET "$API/docs/guide" \
  -H "Content-Type: application/json" \
  -sS)
echo "$RESP"
curl -X GET "$API/docs/guide" \
  -H "Content-Type: application/json" \
  -sS -o /dev/null -w "\nStatus: %{http_code}\n"

echo ""
echo "9. Admin (GET /api/admin) without token — expect 401"
echo "----------------------------------------------------"
RESP=$(curl -X GET "$API/admin" \
  -H "Content-Type: application/json" \
  -sS)
echo "$RESP"
curl -X GET "$API/admin" \
  -H "Content-Type: application/json" \
  -sS -o /dev/null -w "\nStatus: %{http_code}\n"

echo ""
echo "10. Admin stats (GET /api/admin/stats) with token"
echo "-----------------------------------------------"
RESP=$(curl -X GET "$API/admin/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -sS)
echo "$RESP"
curl -X GET "$API/admin/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -sS -o /dev/null -w "\nStatus: %{http_code}\n"

echo ""
echo "🏁 Testing Complete!"