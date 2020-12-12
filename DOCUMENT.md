## server german

# node api.js

telegram bot
rest api (port 3000) -> header [auth... = Bearer xyz]

- PUT /user/token {cookie, userName, ...}
- GET /order?id=1
- GET /orders?status=new&server=iran_127.99.123.12
- PUT /order {id, quantity, status, statusText}

# node orderStatus.js [time: 12:35:00]

get run orders
if exist
get status order is buyed or sale -> update status = done
else
update status order by id to cancel by human

============================================================================
other servers

---

# node runOrders.js

GET /orders?status=new&server=\${config.serverKey}
loop exec(`node order.js --id ${order.id}`)

# into order.js

get order by id -> GET /order?id
set status to run -> PUT /order {id, status}
get quantity -> PUT /order {id, quantity}
get positions -> PUT /order {id, position, volumetricPosition, positionCreatedAt, statusText}

---

08:20:00 - 13:00 -> close add order

08:20:00 [start bot, set quantity & run]
08:30:40 [start send order]
08:30:00 [open]
08:30:05 [stop send order]
08:35:00 [get position]

---

# runOrder.js

loop -> 1 min
get new order list

now >= order.startTime(-10 min)
send to server [exec]
exec order.js --id order.id
