package core_app.dao;

import core_app.util.DBConnection;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class MedicineDAO {

    /**
     * Checks if a medicine exists by ID. If not, it creates a placeholder record.
     * This prevents Foreign Key constraints from failing during Order Checkout
     * if the DB is empty but the Frontend has data from CSV.
     */
    public void ensureMedicineExists(String id, String name, double sellingPrice) {
        String checkSql = "SELECT COUNT(*) FROM Medicine WHERE medicine_id = ?";
        // Added import_price column logic
        String insertSql = "INSERT INTO Medicine (medicine_id, name, price, import_price, quantity, unit, dosage_form, manufacturer) "
                +
                "VALUES (?, ?, ?, ?, 100, 'Viên', 'Viên', 'Unknown')";

        try (Connection conn = DBConnection.getConnection();
                PreparedStatement checkPs = conn.prepareStatement(checkSql)) {

            checkPs.setString(1, id);
            ResultSet rs = checkPs.executeQuery();
            if (rs.next() && rs.getInt(1) > 0) {
                // Exists
                return;
            }

            // Does not exist, insert it
            try (PreparedStatement insertPs = conn.prepareStatement(insertSql)) {
                insertPs.setString(1, id);
                // Truncate name if too long (max 100)
                if (name.length() > 100)
                    name = name.substring(0, 100);
                insertPs.setString(2, name);

                // Price is INT in DB currently, casting it
                insertPs.setInt(3, (int) sellingPrice);
                // Estimate import price as 70% of selling price
                insertPs.setInt(4, (int) (sellingPrice * 0.7));

                insertPs.executeUpdate();
                System.out.println("✅ MedicineDAO: Auto-created missing medicine: " + id);
            }

        } catch (SQLException e) {
            System.err.println("⚠️ MedicineDAO Warning: Failed to ensure medicine existence: " + e.getMessage());
            // Consume error, don't crash main flow, but insert might fail later
        }
    }

    public double getImportPrice(String medicineId) {
        String sql = "SELECT import_price, price FROM Medicine WHERE medicine_id = ?";
        try (Connection conn = DBConnection.getConnection();
                PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, medicineId);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                // Check if column exists or try/catch around getting import_price if schema
                // update failed?
                // Assuming SchemaUpdate run before this.
                try {
                    double importPrice = rs.getDouble("import_price");
                    if (importPrice > 0)
                        return importPrice;
                } catch (SQLException ex) {
                    // Column might not exist yet if SchemaUpdate failed
                }
                // Fallback if 0 or column missing: 70% of price
                return rs.getInt("price") * 0.7;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;
    }
}
