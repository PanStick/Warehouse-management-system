FROM golang:1.24 AS builder

WORKDIR /app

# First copy only go.mod and go.sum to leverage caching
COPY go.mod go.sum ./
RUN go mod download

# Now copy the rest of your source code
COPY . .

RUN go build -o server

# Final minimal image
FROM golang:1.24

WORKDIR /app

COPY --from=builder /app/server .
COPY .env .env

CMD ["./server"]
