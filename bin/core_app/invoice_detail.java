public class InvoiceDetail {

    private int invoiceDetailId;
    private int invoiceId;
    private int batchId;
    private int quantity;
    private double unitPrice;
    private double subtotal;

    public InvoiceDetail() {
    }

    public InvoiceDetail(int invoiceDetailId, int invoiceId, int batchId,
                         int quantity, double unitPrice) {
        this.invoiceDetailId = invoiceDetailId;
        this.invoiceId = invoiceId;
        this.batchId = batchId;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        calculateSubtotal();
    }

    private void calculateSubtotal() {
        this.subtotal = this.quantity * this.unitPrice;
    }

    // Getters & Setters
    public int getInvoiceDetailId() {
        return invoiceDetailId;
    }

    public int getInvoiceId() {
        return invoiceId;
    }

    public int getBatchId() {
        return batchId;
    }

    public int getQuantity() {
        return quantity;
    }

    public double getUnitPrice() {
        return unitPrice;
    }

    public double getSubtotal() {
        return subtotal;
    }
}
 