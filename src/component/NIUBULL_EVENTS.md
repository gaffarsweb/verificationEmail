# Niu Bull — Event Cheatsheet

Quick reference: kab kaunsa event fire hota hai, data me kya aata hai, aur UI pe kya dikhta hai. Iss file ka match `NiuBullGame.jsx` ke listeners se hai.

---

## 1️⃣ Client → Server (emits)

### `FETCH_LOBBY_INFO`
- **Kab:** Socket connect hone ke turant baad, auto-fire. Payload: `username` string.
- **Kyun:** Server `players[playerId]` dict me entry banata hai. Without this, `SIT_DOWN` silently fail karta hai.
- **UI:** Toast — *"Connected — registering player..."*

### `JOIN_TABLE`
- **Kab:** `RECEIVE_LOBBY_INFO` aane ke baad auto-fire. Payload: `tableId` (string).
- **Kya hota hai:** Observer ke roop me table join — abhi seat nahi mili.
- **UI:** Toast — *"Joining T-001..."*. Connect form hide, game UI show.

### `GET_TABLE`
- **Kab:** Refresh button click, ya `PLAYERS_UPDATED`/`ACTION_SITTED`/`SEATS_UPDATE` ke baad. Payload: `{ tableId }`.
- **Kya:** Latest table snapshot mangwana.
- **UI:** Refresh button — silently table re-render karta hai.

### `SIT_DOWN`
- **Kab:** User empty seat select karke "Sit Down" click kare. Payload: `{ tableId, seatId }` (Niu Bull me `amount` nahi bhejna — server Redis se chips uthata hai).
- **Kya:** Seat occupy karna.
- **UI:** Seat dropdown + Sit Down button.

### `LEAVE_TABLE`
- **Kab:** Leave Table button. Payload: `tableId` string.
- **Kya:** Table se nikalna (seated + observer dono).
- **UI:** Leave button → full state reset, connect form wapas.

### `SITTING_OUT` / `SITTING_IN`
- **Kab:** Sit Out / Sit In button click. Payload: `{ tableId }`.
- **Kya:** Seat hold karke next rounds skip / resume.
- **UI:** Sit Out / Sit In buttons (seated user ke liye).

### `PLAYER_CHIP_TOP_UP`
- **Kab:** Top Up modal me amount enter karke confirm (auto low-balance ya manual "Top Up" button).
- **Payload:** `{ tableId, amount, clubId, token }`.
  - `amount` = stack me ADD hone wale chips (final stack nahi).
  - `clubId` = club/union table ke liye (lobby pe `null`).
  - `token` = lobby/coin table ke liye JWT (club pe optional).
- **Kya:** Server pehle wallet se deduct karta hai (club: memberChips atomic; lobby: coins via JWT), phir seat ka stack badhata hai.
- **UI:** Top-up modal me Top Up button, ya actions row me manual Top Up button.

### `NIU_REQUEST_SUGGEST`
- **Kab:** 💡 Suggest button click (sirf apni turn me). Payload: `{ tableId }`.
- **Kya:** Server se best 2+3 split puchna.
- **UI:** Suggest button — response private aata hai.

### `NIU_CONFIRM_ARRANGE`
- **Kab:** ✅ Confirm Arrangement button (top=2, bottom=3 cards complete hone par enabled).
- **Payload:** `{ tableId, topHand: [c,c], bottomHand: [c,c,c], fromSuggest: bool }`.
- **Kya:** Final arrangement submit karna.
- **UI:** Confirm button → button disable, opponent reveal start.

---

## 2️⃣ Server → Client (listeners)

### `RECEIVE_LOBBY_INFO`
- **Kab milta hai:** `FETCH_LOBBY_INFO` ke response me.
- **Data:** `{ tables, players, socketId }`.
- **UI me kya dikha rahe ho:** Sirf trigger ke liye use — turant `JOIN_TABLE` emit ho jaata hai. Toast — *"Lobby registered — joining table..."*

### `TABLE_UPDATED` 🌐
- **Kab:** Sit/leave/top-up/round-start — har major change ke baad.
- **Data:** `{ tableId, table: { seats: {...}, phase, currentTurnSeatId, players: [...] } }` — full snapshot.
- **UI:** Saare 6 seats re-render — player name, stack, sit-out badge. `mySeatId` resolve hota hai apna `playerId` match karke. Phase indicator update.

### `ACTION_SITTED` 🌐
- **Kab:** Koi player seat le.
- **Data:** `{ tableId, seatId, message }`.
- **UI:** Toast — *"Alice sat in seat 3"*. Phir `GET_TABLE` emit → seat populate.

### `SEATS_UPDATE` 🌐
- **Kab:** Koi player sit-out / sit-in toggle kare.
- **Data:** `{ tableId, seatId, message }`.
- **UI:** Toast + `GET_TABLE` → seat ke `sittingOut` flag refresh, gray-out badge.

### `SEAT_EXIT_TABLE` 🌐
- **Kab:** Koi seat chhod ke leave kare.
- **Data:** `{ tableId, message }`.
- **UI:** Toast + `GET_TABLE` → seat empty.

### `PLAYERS_UPDATED` 🌐
- **Kab:** Observer/player count change.
- **Data:** Sirf trigger.
- **UI:** `GET_TABLE` emit → activePlayersCount update.

### `NIU_ROUND_WAIT_START` 🌐
- **Kab:** 20s pre-round window khula.
- **Data:** `{ tableId, roundId, waitMs: 20000 }`.
- **UI:** Status banner — *"Round starts in 0:20"* — countdown decrement (Date.now delta). Previous round winners/banner clear ho jaate hain.

### `NIU_WAITING_FOR_PLAYERS` 🌐 ⚠️
- **Kab:** Eligible players minPlayers se kam ho gaye.
- **Data:** `{ tableId, reason, eligibleCount, minPlayers, message }`.
- **UI:** Countdown STOP, status banner — *"Waiting for more players... (1/2)"*.

### `NIU_ROUND_START` 🌐
- **Kab:** Round actually start (deck shuffle ke pehle).
- **Data:** `{ tableId, roundId, seatIds: [...], baseBet }`.
- **UI:** Phase = ARRANGING, status — *"Round in progress"*, previous reveal/winner state clear, top/bottom slots reset.

### `NIU_CARDS_DEALT` 🔒 PRIVATE
- **Kab:** Round start ke turant baad — sirf TUMHE milta hai.
- **Data:** `{ cards: [5], suggestedTop: [2], suggestedBottom: [3] }`.
- **UI:** Apna 5-card hand bottom me show, suggested cards pe ★ mark.

### `NIU_TURN_STARTED` 🌐
- **Kab:** Kisi seat ki 15s arrangement turn shuru.
- **Data:** `{ tableId, seatId, timerMs: 15000, isInstantSpecial, specialPreview }`.
- **UI:** Active seat highlight + 15s countdown badge. Agar `seatId === mySeatId` to Confirm/Suggest enable, "YOUR TURN" banner.

### `NIU_TURN_TIMEOUT` 🌐
- **Kab:** Kisi player ka 15s expire ho gaya.
- **Data:** `{ tableId, seatId }`.
- **UI:** Toast — *"Seat 3 timed out — auto-arranging"*. Timer 0, Confirm/Suggest disable.

### `NIU_ARRANGE_CONFIRM` 🌐
- **Kab:** Kisi player ne arrange kar diya (manual ya auto).
- **Data:** `{ seatId, topHand, bottomHand, result: { label, multiplier }, autoArranged, fromSuggest }`.
- **UI:** Us seat pe top+bottom cards face-up reveal + hand label badge (e.g. "Niu Dong Gu (5x)").

### `NIU_SUGGEST_RESULT` 🔒 PRIVATE
- **Kab:** Tumne 💡 Suggest mara, server ka response.
- **Data:** `{ top, bottom, result: { label, multiplier } }`.
- **UI:** Toast — *"Suggested: Niu Dong Gu (5x)"*. "Accept Suggestion" button enable.

### `NIU_HAND_EVALUATED` 🌐
- **Kab:** Reveal phase me har seat ke liye ek-ek.
- **Data:** `{ seatId, topHand, bottomHand, result: { label, multiplier, rank } }`.
- **UI:** Us seat pe hand label prominent + final result.

### `NIU_WINNER_DETERMINED` 🌐
- **Kab:** Winner decide ho gaye.
- **Data:** `{ winners: [{ seatId, label, multiplier }], losersCount, isPush }`.
- **UI:** Internal state update — winners array store, push check.

### `NIU_RESULT_REVEAL` 🌐
- **Kab:** 2s winner flash.
- **Data:** `{ winners, losers, winningHand: { label, multiplier }, revealMs: 2000 }`.
- **UI:** Bada gold banner — *"Winner: Seat 1 with Niu Dong Gu (5x)"*. Banner ~8s tak hold karte hain (revealMs + 6s extra).

### `NIU_SETTLEMENT` 🌐 💸
- **Kab:** Reveal ke baad money move hua.
- **Data:** `{ pot, rake, winnerCredits: [{ seatId, playerId, amount, txId, type }], loserDebits: [...], winningHand, isPush }`.
- **UI:** Toast — *"You won +95"* / *"You lost -50"*.
  - 🎰 **Animation:** Har loser seat se gold chips fly hoke winner seat pe land karte hain (3 chips per pair).
  - **Floating text:** Green `+95` winner seat pe upar uthkar fade, red `-50` loser seat pe.
  - **Stack tween:** `displayedStacks` easeOutCubic se purane → naye value pe 1.3s me animate.
  - Last Settlement panel me pot/rake/credits/debits list.

### `BUY_RAKE` 🔒 PRIVATE (club only)
- **Kab:** `PLAYER_CHIP_TOP_UP` success — sirf club/union table pe.
- **Data:** `{ balance }` (naya memberChips wallet balance).
- **UI:** 💰 Chips pill update + toast — *"Wallet balance: 940"*.

### `NIU_CHIPS_UPDATE` 🔒 PRIVATE
- **Kab:** Tumhare chips change huye — sit-down/settlement/top-up.
- **Data:** `{ tableId, playerId, seatId, balance, delta, txId, source, eventTimestamp }`.
  - `source`: `"REDIS_AT_SIT_DOWN"` | `"SETTLEMENT"` | `"TOP_UP"`.
  - `delta`: positive (jeeta/top-up), negative (haara), absent (sit ke time).
- **UI:** Top status row me 💰 **Chips: {balance}** gold pill update. Agar `delta` non-zero to apne seat pe floating ±text + stack tween toward new balance.

### `NIU_ROUND_END` 🌐
- **Kab:** Round complete, next 20s wait window aane wala hai.
- **Data:** `{ roundId, nextWaitMs: 20000 }`.
- **UI:** Turn highlight clear, phase = WAITING, currentTurnSeatId = null.

### `NIU_PLAYER_SITOUT` 🌐
- **Kab:** Koi player sit-out hua (user-triggered ya server-forced).
- **Data:** `{ seatId, playerId, reason, table }`.
  - `reason`: `"USER_REQUEST"` (user ne khud sit-out kara) | `"BALANCE_LOW"` (server forced — top-up prompt).
- **UI:** Reason ke hisaab se toast. Agar `table` payload me hai to direct snapshot apply, warna `GET_TABLE` emit. Seat gray-out + "Sitting Out" badge.

### `NIU_PLAYER_SITIN` 🌐 🆕
- **Kab:** Koi player sit-out se wapas sit-in hua.
- **Data:** `{ seatId, playerId, table }`.
- **UI:** Toast — *"You are back in"* (if mine) / *"Seat 3 sat back in"*. Snapshot apply, seat active color, gray-out hatao, badge remove.

### `NIU_PLAYER_KICKED` 🌐
- **Kab:** Server ne seat clear kar di (stand-up / disconnect / balance-low / inactivity).
- **Data:** `{ seatId, playerId, reason, inactiveRounds? }`.
  - `reason`: `"LEFT_TABLE"` | `"STAND_UP"` | `"DISCONNECT"` | `"BALANCE_LOW"` | `"INACTIVITY"`.
  - `inactiveRounds`: count of missed rounds (only with `INACTIVITY`).
- **UI:** Toast + `GET_TABLE` → seat empty. Agar `INACTIVITY` aur kicked player = current user, to special toast + connect screen pe wapas drop.

### `NIU_BALANCE_LOW` 🔒 PRIVATE
- **Kab:** Settlement ke baad tumhara balance min buy-in se neeche.
- **Data:** `{ balance, minBuyIn, message }`.
- **UI:** Top-up modal popup — *"Your balance ($30) is below the table minimum ($80)"*. Top Up / Cancel buttons.

### `GAME_ERROR` 🔒 PRIVATE
- **Kab:** Koi emit validation ya state error.
- **Data:** `{ tableId, reason, minBuyIn?, balance? }`.
- **UI:** Red toast.
  - **Sit-in low-balance reject** (`minBuyIn` + `balance` dono present): warn toast — *"Sit in failed — need 80 chips (you have 30). Top up to continue."* + top-up modal auto-open with both values.
  - `reason` me "Insufficient": top-up modal auto-open.
  - **Top-up reason codes** (friendly toast map):
    - `invalid_amount` — amount ≤ 0.
    - `insufficient_balance` — wallet me itne chips nahi (`balance` ke saath aata hai → modal re-open).
    - `not_club_member` — is club ka member nahi.
    - `coin_deduction_failed` — lobby coin deduct fail (JWT/REST).
    - `chip_deduction_failed` — club chip deduct fail.
    - `Invalid_Token` — JWT expired.

---

## 3️⃣ Phase lifecycle (UI overlay reference)

```
IDLE → (sit pe min players hue) → WAITING (20s countdown)
WAITING → (timer expire) → ARRANGING (per-player 15s turns)
ARRANGING → (sab confirmed) → REVEAL (~2s flash, UI ~8s)
REVEAL → SETTLING (chips fly + stack tween)
SETTLING → WAITING (loop with NIU_ROUND_WAIT_START)
```

`state.phase` ke har value pe UI alag dikhta hai — banner text, button enable, countdown visibility.

---

## 4️⃣ State → UI mapping (quick scan)

| State slice | Drives which UI |
|-------------|-----------------|
| `state.phase` | Top phase indicator |
| `state.statusBanner` | Center info banner ("Waiting for more players...") |
| `state.waitTimerMs` + `waitTimerStart` | "Round starts in 0:XX" countdown |
| `state.turnTimerMs` + `turnTimerStart` | "YOUR TURN · 0:15" countdown |
| `state.mySeatId` | "YOU" badge on seat, controls visibility |
| `state.currentTurnSeatId` | "ACTING" badge + glow on seat |
| `state.myCards` | Apna hand row |
| `state.suggestion` | ★ stars on suggested cards + "Accept Suggestion" button |
| `state.topSlot` / `bottomSlot` | Top (2) / Bottom (3) drop zones |
| `state.revealedHands[seatId]` | Opponent seat pe top+bottom + hand label |
| `state.winners` + `winningHand` | Winner banner content |
| `state.showWinnerBanner` | Banner visibility |
| `state.displayedStacks[seatId]` | Animated stack number on each seat |
| `state.flyingChips` | Gold chip dots flying loser→winner |
| `state.floatingDeltas` | +95/-50 floating texts |
| `state.myBalance` | 💰 Chips gold pill in status row |
| `state.showTopUpModal` + `topUpInfo` | Top-up modal |
| `state.toasts` | Top-right toast stack |

---

## 5️⃣ Card data format (universal)

```js
{ rank: "A" | "2".."10" | "T" | "J" | "Q" | "K", suit: "s" | "h" | "d" | "c" }
```

UI me suit emoji map: `s → ♠`, `h → ♥`, `d → ♦`, `c → ♣`. Red color for `h`/`d`.
