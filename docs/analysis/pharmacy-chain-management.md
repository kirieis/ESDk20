# Pharmacy Chain Management System
(Mô hình Long Châu / Pharmacity)

## 📌 Project Overview
Hệ thống quản lý chuỗi nhà thuốc với các chức năng:
- Quản lý kho thuốc theo **Batch (FIFO)**
- Cảnh báo thuốc **sắp hết hạn / hết tồn**
- Bán hàng tại quầy (**POS Interface**)
- Simulator các máy POS gửi dữ liệu về Server trung tâm

---

## 👥 Actors
- **Admin / Chain Manager**
- **Store Manager / Pharmacist**
- **Customer**
- **POS Device (Simulator)**

---

## 🧩 Core Entities
- Medicine (Thuốc)
- Batch (Lô thuốc – Hạn sử dụng)
- Store (Cửa hàng)
- Inventory (Tồn kho theo Store + Batch)
- Customer
- Pharmacist (User)
- Invoice
- InvoiceItem
- POS_Device
- POS_Order

---

## 🔑 Business Rules
- Xuất kho theo **FIFO (Expiry Date tăng dần)**
- Không bán thuốc **đã hết hạn**
- Cảnh báo batch sắp hết hạn (configurable)
- Xử lý đồng thời nhiều POS → cần transaction

---

## 🗂 ER Diagram

```mermaid
erDiagram
    MEDICINE ||--o{ BATCH : has
    BATCH ||--o{ INVENTORY : stocked_in
    STORE ||--o{ INVENTORY : has
    STORE ||--o{ INVOICE : issues
    CUSTOMER ||--o{ INVOICE : places
    PHARMACIST ||--o{ INVOICE : creates
    INVOICE ||--o{ INVOICE_ITEM : contains
    MEDICINE ||--o{ INVOICE_ITEM : referenced_by
    BATCH ||--o{ INVOICE_ITEM : sold_from
    STORE ||--o{ POS_DEVICE : has
    POS_DEVICE ||--o{ POS_ORDER : sends
