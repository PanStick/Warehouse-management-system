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
COPY --from=builder /app/assets ./assets 
COPY .env .env

EXPOSE 8080
RUN mkdir -p ./assets/images/products
CMD ["./server"]
