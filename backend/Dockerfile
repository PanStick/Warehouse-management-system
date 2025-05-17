FROM golang:1.24 AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

WORKDIR /app/cmd/server
RUN go build -o /app/server

FROM golang:1.24

WORKDIR /app

COPY --from=builder /app/server .
COPY .env .env

EXPOSE 8080
CMD ["./server"]
