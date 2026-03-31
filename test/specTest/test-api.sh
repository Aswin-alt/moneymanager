#!/usr/bin/env bash
BASE="http://localhost:8080/api"
SEP="─────────────────────────────────────────"

pass() { printf "  ✅  %s\n" "$1"; }
fail() { printf "  ❌  %s\n" "$1"; }
info() { printf "  ℹ   %s\n" "$1"; }
section() { echo ""; echo "$SEP"; echo "  $1"; echo "$SEP"; }

# ── 1. Register ──────────────────────────────────────────────────────────────
section "1. Register demo user"
REG=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@moneymanager.com","password":"Demo@1234","displayName":"Demo User"}')
REG_STATUS=$(echo "$REG" | tail -1)
REG_BODY=$(echo "$REG" | sed '$d')
if [ "$REG_STATUS" = "201" ]; then
  pass "Registered (201)"
elif [ "$REG_STATUS" = "409" ]; then
  info "Already registered (409) — continuing with login"
else
  fail "Register failed: HTTP $REG_STATUS — $REG_BODY"; exit 1
fi

# ── 2. Login ─────────────────────────────────────────────────────────────────
section "2. Login"
LOGIN=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@moneymanager.com","password":"Demo@1234"}')
TOKEN=$(echo "$LOGIN" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
  fail "Login failed — $LOGIN"; exit 1
fi
pass "Login OK — token obtained"
info "Token: ${TOKEN:0:40}..."

AUTH="-H Authorization:\ Bearer\ $TOKEN"

# ── 3. Get profile ────────────────────────────────────────────────────────────
section "3. Get user profile"
PROFILE=$(curl -s "$BASE/users/me" -H "Authorization: Bearer $TOKEN")
DISPLAY=$(echo "$PROFILE" | grep -o '"displayName":"[^"]*"' | cut -d'"' -f4)
EMAIL=$(echo "$PROFILE" | grep -o '"email":"[^"]*"' | cut -d'"' -f4)
pass "Profile: $DISPLAY ($EMAIL)"

# ── 4. Get categories ─────────────────────────────────────────────────────────
section "4. Get categories"
CATS=$(curl -s "$BASE/categories" -H "Authorization: Bearer $TOKEN")
CAT_COUNT=$(echo "$CATS" | grep -o '"id"' | wc -l | tr -d ' ')
pass "Loaded $CAT_COUNT categories"
EXPENSE_CAT_ID=$(echo "$CATS" | grep -o '"id":[0-9]*,"name":"[^"]*","icon":"[^"]*","color":"[^"]*","categoryType":"EXPENSE"' | head -1 | grep -o '"id":[0-9]*' | cut -d: -f2)
INCOME_CAT_ID=$(echo "$CATS" | grep -o '"id":[0-9]*,"name":"[^"]*","icon":"[^"]*","color":"[^"]*","categoryType":"INCOME"' | head -1 | grep -o '"id":[0-9]*' | cut -d: -f2)
info "Using expense categoryId=$EXPENSE_CAT_ID, income categoryId=$INCOME_CAT_ID"

# ── 5. Create account ─────────────────────────────────────────────────────────
section "5. Create bank account"
ACC=$(curl -s -w "\n%{http_code}" -X POST "$BASE/accounts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo Savings","accountType":"SAVINGS","currency":"USD","initialBalance":10000,"institution":"Demo Bank"}')
ACC_STATUS=$(echo "$ACC" | tail -1)
ACC_BODY=$(echo "$ACC" | sed '$d')
if [ "$ACC_STATUS" = "201" ] || [ "$ACC_STATUS" = "200" ]; then
  ACCOUNT_ID=$(echo "$ACC_BODY" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
  BAL=$(echo "$ACC_BODY" | grep -o '"balance":[0-9.]*' | cut -d: -f2)
  pass "Account created — id=$ACCOUNT_ID, balance=\$$BAL"
else
  fail "Create account failed: HTTP $ACC_STATUS — $ACC_BODY"; exit 1
fi

# ── 6. Add income transaction ─────────────────────────────────────────────────
section "6. Add income transaction"
TODAY=$(date +%Y-%m-%d)
INC=$(curl -s -w "\n%{http_code}" -X POST "$BASE/transactions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"accountId\":$ACCOUNT_ID,\"categoryId\":$INCOME_CAT_ID,\"amount\":5000,\"transactionType\":\"INCOME\",\"merchantName\":\"Employer\",\"description\":\"March salary\",\"transactionDate\":\"$TODAY\"}")
INC_STATUS=$(echo "$INC" | tail -1)
INC_BODY=$(echo "$INC" | sed '$d')
if [ "$INC_STATUS" = "201" ] || [ "$INC_STATUS" = "200" ]; then
  INC_ID=$(echo "$INC_BODY" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
  pass "Income tx created — id=$INC_ID, amount=\$5000"
else
  fail "Income tx failed: HTTP $INC_STATUS — $INC_BODY"
fi

# ── 7. Add expense transaction ────────────────────────────────────────────────
section "7. Add expense transaction"
EXP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/transactions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"accountId\":$ACCOUNT_ID,\"categoryId\":$EXPENSE_CAT_ID,\"amount\":120,\"transactionType\":\"EXPENSE\",\"merchantName\":\"Supermarket\",\"description\":\"Groceries\",\"transactionDate\":\"$TODAY\"}")
EXP_STATUS=$(echo "$EXP" | tail -1)
EXP_BODY=$(echo "$EXP" | sed '$d')
if [ "$EXP_STATUS" = "201" ] || [ "$EXP_STATUS" = "200" ]; then
  EXP_ID=$(echo "$EXP_BODY" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
  pass "Expense tx created — id=$EXP_ID, amount=\$120"
else
  fail "Expense tx failed: HTTP $EXP_STATUS — $EXP_BODY"
fi

# ── 8. List transactions ──────────────────────────────────────────────────────
section "8. List transactions (page 0, size 10)"
TX_LIST=$(curl -s "$BASE/transactions?page=0&size=10" -H "Authorization: Bearer $TOKEN")
TOTAL=$(echo "$TX_LIST" | grep -o '"totalElements":[0-9]*' | cut -d: -f2)
pass "Total transactions: $TOTAL"

# ── 9. Create budget ──────────────────────────────────────────────────────────
section "9. Create budget"
MONTH=$(date +%Y-%m)
BUD=$(curl -s -w "\n%{http_code}" -X POST "$BASE/budgets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"categoryId\":$EXPENSE_CAT_ID,\"monthYear\":\"$MONTH\",\"limitAmount\":500,\"currency\":\"USD\",\"alertAt80\":true,\"alertAt100\":true}")
BUD_STATUS=$(echo "$BUD" | tail -1)
BUD_BODY=$(echo "$BUD" | sed '$d')
if [ "$BUD_STATUS" = "201" ] || [ "$BUD_STATUS" = "200" ]; then
  SPENT=$(echo "$BUD_BODY" | grep -o '"spentAmount":[0-9.]*' | cut -d: -f2)
  PCT=$(echo "$BUD_BODY" | grep -o '"percentUsed":[0-9.]*' | cut -d: -f2)
  STATUS_VAL=$(echo "$BUD_BODY" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
  pass "Budget created — limit=\$500, spent=\$$SPENT (${PCT}%) — $STATUS_VAL"
elif [ "$BUD_STATUS" = "409" ]; then
  info "Budget already exists for this month (409)"
else
  fail "Budget failed: HTTP $BUD_STATUS — $BUD_BODY"
fi

# ── 10. Get account balance ───────────────────────────────────────────────────
section "10. Get updated account balance"
ACC2=$(curl -s "$BASE/accounts/$ACCOUNT_ID" -H "Authorization: Bearer $TOKEN")
NEWBAL=$(echo "$ACC2" | grep -o '"balance":[0-9.]*' | cut -d: -f2)
pass "Account balance after transactions: \$$NEWBAL"

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "$SEP"
echo "  All tests completed!"
echo "$SEP"
echo ""
