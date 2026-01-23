import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class Invoice {

    private int invoiceId;
    private LocalDateTime invoiceDate;
    private int pharmacistId;
    private int customerId;
    private double totalAmount;
    private String paymentMethod; // CASH, BANK_TRANSFER

    private List<InvoiceDetail> invoiceDetails;

    public Invoice() {
        this.invoiceDetails = new ArrayList<>();
        this.invoiceDate = LocalDateTime.now();
    }

    public Invoice(int invoiceId, int pharmacistId, int customerId, String paymentMethod) {
        this.invoiceId = invoiceId;
        this.pharmacistId = pharmacistId;
        this.customerId = customerId;
        this.paymentMethod = paymentMethod;
        this.invoiceDate = LocalDateTime.now();
        this.invoiceDetails = new ArrayList<>();
    }

    // Business Logic
    public void addInvoiceDetail(InvoiceDetail detail) {
        invoiceDetails.add(detail);
        calculateTotalAmount();
    }

    private void calculateTotalAmount() {
        totalAmount = 0;
        for (InvoiceDetail d : invoiceDetails) {
            totalAmount += d.getSubtotal();
        }
    }

    // Getters & Setters
    public int getInvoiceId() {
        return invoiceId;
    }

    public LocalDateTime getInvoiceDate() {
        return invoiceDate;
    }

    public int getPharmacistId() {
        return pharmacistId;
    }

    public int getCustomerId() {
        return customerId;
    }

    public double getTotalAmount() {
        return totalAmount;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public List<InvoiceDetail> getInvoiceDetails() {
        return invoiceDetails;
    }
}
