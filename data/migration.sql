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
DROP TABLE IF EXISTS Pharmacist;
DROP TABLE IF EXISTS Customer;
DROP TABLE IF EXISTS Medicine;
GO

/* =========================
   MEDICINE
   (MATCH CSV STRUCTURE)
   ========================= */
CREATE TABLE Medicine (
    medicine_id VARCHAR(20) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    batch VARCHAR(250),
    ingredient NVARCHAR(100),
    dosage_form NVARCHAR(50),
    strength NVARCHAR(20),
    unit NVARCHAR(10),
    manufacturer NVARCHAR(100),
    expiry DATE,
    quantity INT CHECK (quantity >= 0),
    base_price DECIMAL(10,2)
);

/* =========================
   IMPORT MEDICINE DATA
   ========================= */
--Nguyen_Van_An path:E:\Project-LAB-github\lab211-project-group1\data\medicines_clean.csv--
--Tran Quoc Thinh path:C:\Users\PC\Documents\GitHub\project_group1\data\medicines_clean.csv--
--Nguyen Tri Thien path: C:\Users\nguye\Documents\GitHub\lab211-project-group1\data\medicines_clean.csv--
--Hang Vo Minh Nhat path: C:\Users\nhatg\Documents\GitHub\lab211-project-group1\data\medicines_clean.csv--
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
    role VARCHAR(30)
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

    FOREIGN KEY (pharmacist_id) REFERENCES Pharmacist(pharmacist_id),
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id)
);

/* =========================
   INVOICE DETAIL
   (LINK DIRECTLY TO MEDICINE)
   ========================= */
CREATE TABLE Invoice_Detail (
    invoice_detail_id INT IDENTITY PRIMARY KEY,
    invoice_id INT NOT NULL,
    medicine_id VARCHAR(20) NOT NULL,
    quantity INT CHECK (quantity > 0),
    unit_price DECIMAL(10,2),
    subtotal DECIMAL(12,2),

    FOREIGN KEY (invoice_id) REFERENCES Invoice(invoice_id),
    FOREIGN KEY (medicine_id) REFERENCES Medicine(medicine_id)
);
