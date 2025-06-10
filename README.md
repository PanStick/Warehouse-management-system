Prerequisites

Docker

Docker Compose v2+

(Optional) Node.js & npm & Go


1.
cp .env.example .env

Edit .env to match credentials

2.
docker compose up --build

older CLI: docker-compose up --build

brings up three services:

1.mysql

2.backend (localhost:8080)

3.frontend (localhost:3000)

3. verification

docker compose ps

docker compose logs -f backend

docker compose exec mysql mysql -u {user} -p auth_demo -e "SHOW TABLES;"

4. 
frontend: http://localhost:3000

backend healthcheck: curl http://localhost:8080/api/purchase-requests

5. shutdown

docker compose down

(-v to return to init.sql state)



Running locally without docker

1. Backend

cd backend

go mod download

go run cmd/server/main.go

2. Frontend

cd frontend

npm install

npm start