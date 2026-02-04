package core_app.model;

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
    private String status; // PENDING, PAID, CANCELLED
    private String paymentProof; // URL/Path to image
    private String customerName; // Name of the buyer

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

    private double calculateTotalAmount() {
        totalAmount = 0;
        for (InvoiceDetail d : invoiceDetails) {
            totalAmount += d.getQuantity() * d.getUnitPrice();
        }
        return totalAmount;
    }

    // Getters & Setters
    public void setInvoiceId(int invoiceId) {
        this.invoiceId = invoiceId;
    }

    public void setInvoiceDate(LocalDateTime invoiceDate) {
        this.invoiceDate = invoiceDate;
    }

    public void setPharmacistId(int pharmacistId) {
        this.pharmacistId = pharmacistId;
    }

    public void setCustomerId(int customerId) {
        this.customerId = customerId;
    }

    public void setTotalAmount(double totalAmount) {
        this.totalAmount = totalAmount;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public void setInvoiceDetails(List<InvoiceDetail> invoiceDetails) {
        this.invoiceDetails = invoiceDetails;
    }

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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPaymentProof() {
        return paymentProof;
    }

    public void setPaymentProof(String paymentProof) {
        this.paymentProof = paymentProof;
    }

    public String getCustomerName() {
        return customerName != null ? customerName : "Khách vãng lai";
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }
}
