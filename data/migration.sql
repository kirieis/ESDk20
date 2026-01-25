/* =========================
   CREATE DATABASE
   ========================= */
CREATE DATABASE PharmacyDB;
GO
USE PharmacyDB;
GO

/* =========================
   DROP TABLES (SAFE RE-RUN)
   ========================= */
DROP TABLE IF EXISTS Invoice_Detail;
DROP TABLE IF EXISTS Invoice;
DROP TABLE IF EXISTS Batch;
DROP TABLE IF EXISTS Pharmacist;
DROP TABLE IF EXISTS Customer;
DROP TABLE IF EXISTS Medicine;
GO

/* =========================
   MEDICINE
   ========================= */
CREATE TABLE Medicine (
    medicine_id INT PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    active_ingredient NVARCHAR(100),
    dosage_form NVARCHAR(50),
    strength NVARCHAR(50),
    unit NVARCHAR(20) NOT NULL,
    manufacturer NVARCHAR(100),
    price DECIMAL(10,2) CHECK (price > 0),
    requires_prescription BIT DEFAULT 0
);

/* =========================
   IMPORT MEDICINE DATA
   ========================= */
BULK INSERT Medicine
FROM 'E:\Project-LAB-github\lab211-project-group1\data\medicines_clean.csv'
WITH (
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '\n',
    CODEPAGE = '65001'
);
GO

/* =========================
   CUSTOMER
   ========================= */
CREATE TABLE Customer (
    customer_id INT IDENTITY PRIMARY KEY,
    full_name NVARCHAR(100),
    phone VARCHAR(20),
    dob DATE,
    address NVARCHAR(255),
    loyalty_points INT DEFAULT 0
);

/* =========================
   PHARMACIST
   ========================= */
CREATE TABLE Pharmacist (
    pharmacist_id INT IDENTITY PRIMARY KEY,
    full_name NVARCHAR(100),
    license_number VARCHAR(50),
    branch_id INT,
    role VARCHAR(30)
);

/* =========================
   BATCH
   ========================= */
CREATE TABLE Batch (
    batch_id INT IDENTITY PRIMARY KEY,
    medicine_id INT NOT NULL,
    batch_number VARCHAR(20),
    manufacture_date DATE,
    expiry_date DATE,
    quantity_in INT CHECK (quantity_in >= 0),
    quantity_available INT CHECK (quantity_available >= 0),
    import_price DECIMAL(10,2) CHECK (import_price >= 0),
    warehouse_location NVARCHAR(50),

    FOREIGN KEY (medicine_id) REFERENCES Medicine(medicine_id)
);

/* =========================
   INVOICE
   ========================= */
CREATE TABLE Invoice (
    invoice_id INT IDENTITY PRIMARY KEY,
    invoice_date DATETIME DEFAULT GETDATE(),
    pharmacist_id INT,
    customer_id INT,
    total_amount DECIMAL(12,2),
    payment_method VARCHAR(30),

    FOREIGN KEY (pharmacist_id) REFERENCES Pharmacist(pharmacist_id),
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id)
);

/* =========================
   INVOICE DETAIL
   ========================= */
CREATE TABLE Invoice_Detail (
    invoice_detail_id INT IDENTITY PRIMARY KEY,
    invoice_id INT NOT NULL,
    batch_id INT NOT NULL,
    quantity INT CHECK (quantity > 0),
    unit_price DECIMAL(10,2),
    subtotal DECIMAL(12,2),

    FOREIGN KEY (invoice_id) REFERENCES Invoice(invoice_id),
    FOREIGN KEY (batch_id) REFERENCES Batch(batch_id)
);
