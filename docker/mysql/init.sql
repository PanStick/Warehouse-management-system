CREATE DATABASE IF NOT EXISTS auth_demo;

USE auth_demo;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    verification_token VARCHAR(64),
    verified BOOLEAN DEFAULT FALSE,
    role ENUM('customer', 'worker', 'admin', 'demo') NOT NULL DEFAULT 'customer'
);

CREATE TABLE IF NOT EXISTS suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplierName VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    productName VARCHAR(255) NOT NULL,
    unitType VARCHAR(50) NOT NULL,
    supplierID INT NOT NULL,
    shortExpirationDate INT DEFAULT NULL,
    image VARCHAR(255) DEFAULT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (supplierID) REFERENCES suppliers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orderedProducts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  productID INT NOT NULL,
  quantity FLOAT NOT NULL,
  expirationDate DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (productID) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS stock (
    batchID INT AUTO_INCREMENT PRIMARY KEY,
    productID INT NOT NULL,
    quantity FLOAT NOT NULL,
    expirationDate DATE NULL,
    FOREIGN KEY (productID) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS purchase_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userID INT NOT NULL,
    status ENUM('pending', 'accepted', 'denied', 'shipped') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userID) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS purchase_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requestID INT NOT NULL,
    productID INT NOT NULL,
    quantity INT NOT NULL,
    FOREIGN KEY (requestID) REFERENCES purchase_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (productID) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assigned_batches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    itemID INT NOT NULL,
    batchID INT NOT NULL,
    quantity FLOAT NOT NULL,
    FOREIGN KEY (itemID) REFERENCES purchase_items(id) ON DELETE CASCADE,
    FOREIGN KEY (batchID) REFERENCES stock(batchID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requestID INT NULL UNIQUE,
    orderID INT NULL UNIQUE,
    workerID INT NOT NULL,
    status ENUM('pending', 'completed') NOT NULL DEFAULT 'pending',
    type ENUM('unload', 'prepare', 'dispose') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requestID) REFERENCES purchase_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (workerID) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (orderID) REFERENCES orderedProducts(id) ON DELETE CASCADE

);

CREATE TABLE IF NOT EXISTS rapports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workerID INT NOT NULL,
  type ENUM('text','delivery','batchProblem') NOT NULL DEFAULT 'text',
  content TEXT NULL,
  status ENUM('pending','accepted','denied','responded') NOT NULL DEFAULT 'pending',
  response TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL,
  FOREIGN KEY (workerID) REFERENCES users(id) ON DELETE CASCADE
);



INSERT INTO users (email, password, verified, role) VALUES
  ('demo',   '$2a$12$KGfuCaTqABwLn71qMUuhDugxMlD4sF2mM9G6xJlbx4Jl7OhX.j9tC', TRUE,  'demo'),
  ('user',   '$2b$12$zh3Sgo7duI5Oc5C5sff9EO1SFE5v5fEzojj.PeigZc8s2.0/x4bpq', TRUE,  'customer'),
  ('worker', '$2b$12$Hc00ktbkkHSyNNS5gtSJ3ul0lufelMBcTPKEEabOQ.lTsm/35inLK', TRUE,  'worker'),
  ('admin',  '$2b$12$sYCLRq0dRtRZcqZvA2H/bOWhPEe5kNWDoldQluxmNVyozdOkpizd2', TRUE,  'admin');


INSERT INTO suppliers (supplierName) VALUES 
('Global Supply Co.'),
('FreshFarm Ltd.'),
('TechParts Inc.'),
('Daily Needs Wholesale');

INSERT INTO products (productName, unitType, supplierID, shortExpirationDate, image, price) VALUES 
('Apples 1KG', 'kg', 2, 10, 'assets/images/products/Apples.jpg', 3.50),
('Bananas 1KG', 'kg', 2, 4, 'assets/images/products/Bananas.jpg', 2.20),
('USB Cable', 'unit', 3, NULL, 'assets/images/products/USB Cable.jpg', 10.00),
('Rice 1KG', 'unit', 1, 30, 'assets/images/products/Rice 1KG.jpg', 1.80),
('Milk 1L', 'unit', 2, 3, 'assets/images/products/Milk 1L.jpg', 1.40),
('Toilet Paper 12-rolls', 'unit', 4, 30, 'assets/images/products/Toilet Paper 12-rolls.jpg', 3.00),
('Eggs Dozen', 'unit', 2, 7, 'assets/images/products/Eggs Dozen.jpg', 3.20);

INSERT INTO stock (productID, quantity, expirationDate) VALUES
(1, 120, '2025-12-01'),
(2, 200, '2025-11-15'),
(4, 300, '2026-03-01'),

(3, 500, NULL),
(6, 1000, '2030-01-05'),

(1, 80, '2025-06-01'),
(1, 60, '2025-07-10'),
(2, 150, '2025-08-15'),
(2, 90, '2025-09-01'),
(4, 250, '2026-01-01'),
(4, 400, '2026-04-20'),
(5, 200, '2025-06-15'),
(5, 120, '2025-07-01'),
(7, 210, '2025-06-25'),
(7, 150, '2025-07-10');


