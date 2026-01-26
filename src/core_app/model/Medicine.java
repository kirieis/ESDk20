package core_app.model;

public class Medicine {

    private String medicineId;
    private String medicineCode;
    private String medicineName;
    private String activeIngredient;
    private String registrationNumber; // Số đăng ký Bộ Y Tế
    private MedicineGroup group;        // DRUG, SUPPLEMENT, MEDICAL_DEVICE

    public Medicine() {
    }

    public Medicine(String medicineId, String medicineCode, String medicineName,
                    String activeIngredient, String registrationNumber,
                    MedicineGroup group) {
        this.medicineId = medicineId;
        this.medicineCode = medicineCode;
        this.medicineName = medicineName;
        this.activeIngredient = activeIngredient;
        this.registrationNumber = registrationNumber;
        this.group = group;
    }

    // ===== Getter & Setter =====

    public String getMedicineId() {
        return medicineId;
    }

    public String getMedicineCode() {
        return medicineCode;
    }

    public String getMedicineName() {
        return medicineName;
    }

    public String getActiveIngredient() {
        return activeIngredient;
    }

    public String getRegistrationNumber() {
        return registrationNumber;
    }

    public MedicineGroup getGroup() {
        return group;
    }
}
