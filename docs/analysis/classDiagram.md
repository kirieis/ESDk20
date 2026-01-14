+------------------+
|    Medicine      |
+------------------+
| - medicineId     |
| - name           |
| - price          |
| - unit           |
+------------------+

+------------------+
|      Batch       |
+------------------+
| - batchId        |
| - medicineId     |
| - quantity       |
| - expiryDate     |
| - importDate     |
+------------------+

+------------------+
|    Customer      |
+------------------+
| - customerId     |
| - name           |
| - phone          |
+------------------+

+------------------+
|   Pharmacist     |
+------------------+
| - pharmacistId   |
| - name           |
| - username       |
| - password       |
+------------------+

+------------------+
|     Invoice      |
+------------------+
| - invoiceId      |
| - customerId     |
| - pharmacistId   |
| - totalAmount    |
| - createdAt      |
+------------------+

+------------------------+
|    InvoiceDetail       |
+------------------------+
| - invoiceDetailId      |
| - invoiceId            |
| - medicineId           |
| - quantity             |
| - price                |
+------------------------+
