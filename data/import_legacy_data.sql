BULK INSERT Batch_Staging
FROM 'E:\Project-LAB-github\lab211-project-group1\data'
WITH (
    FIRSTROW = 2,
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '\n',
    CODEPAGE = '65001'
);
