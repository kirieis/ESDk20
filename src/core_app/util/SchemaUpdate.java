package core_app.util;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;

public class SchemaUpdate {

    public static void updateSchema() {
        try (Connection conn = DBConnection.getConnection();
                Statement stmt = conn.createStatement()) {

            // 1. Thêm import_price vào Medicine
            executeQuietly(stmt,
                    "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Medicine') AND name = 'import_price') "
                            +
                            "ALTER TABLE Medicine ADD import_price INT DEFAULT 0");

            // 2. Thêm import_price vào Invoice_Detail
            executeQuietly(stmt,
                    "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Invoice_Detail') AND name = 'import_price') "
                            +
                            "ALTER TABLE Invoice_Detail ADD import_price DECIMAL(12,2) DEFAULT 0");

            // 3. Thêm payment_method vào Invoice
            executeQuietly(stmt,
                    "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Invoice') AND name = 'payment_method') "
                            +
                            "ALTER TABLE Invoice ADD payment_method NVARCHAR(50)");

            // 4. Thêm medicine_name vào Invoice_Detail (Sửa lỗi bạn vừa chụp)
            executeQuietly(stmt,
                    "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Invoice_Detail') AND name = 'medicine_name') "
                            +
                            "ALTER TABLE Invoice_Detail ADD medicine_name NVARCHAR(255)");

            System.out.println("✅ SchemaUpdate: Database auto-fix completed.");

        } catch (SQLException e) {
            System.err.println("❌ SchemaUpdate Error: " + e.getMessage());
        }
    }

    private static void executeQuietly(Statement stmt, String sql) {
        try {
            stmt.execute(sql);
        } catch (SQLException e) {
            // Qua nếu cột đã có
        }
    }
}
