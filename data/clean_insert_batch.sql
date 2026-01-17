INSERT INTO Batch (batch_id, medicine_id, expiry_date, quantity_vien, branch_id)
SELECT
    batch_id,
    medicine_id,
    TRY_CONVERT(DATE, expiry_date),
    TRY_CONVERT(INT, quantity_vien),
    branch_id
FROM Batch_Staging
WHERE
    batch_id IS NOT NULL
    AND batch_id <> ''
    AND medicine_id IS NOT NULL
    AND medicine_id <> ''
    AND TRY_CONVERT(DATE, expiry_date) IS NOT NULL
    AND TRY_CONVERT(INT, quantity_vien) > 0;
