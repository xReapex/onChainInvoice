// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract InvoiceManager {

    // Item
    struct Item {
        string description;
        uint256 quantity;
        uint256 unitPrice;
    }

    // Invoice
    struct Invoice {
        address owner;
        uint256 id;
        string title;
        bool paid;
        Item[] items;
    }

    // Mapping of invoice id to Invoice
    mapping(uint256 => Invoice) public invoices;
    uint256 public nextInvoiceId;

    // Create a new invoice
    function createInvoice(string memory title) external returns (uint256) {
        uint256 invoiceId = nextInvoiceId++;
        Invoice storage inv = invoices[invoiceId];
        inv.owner = msg.sender;
        inv.id = invoiceId;
        inv.title = title;
        inv.paid = false;
        return invoiceId;
    }

    // Add an item to an invoice
    function addItem(uint256 invoiceId, string memory description, uint256 quantity, uint256 unitPrice) external {
        Invoice storage inv = invoices[invoiceId];
        require(inv.owner == msg.sender, "Not invoice owner");
        inv.items.push(Item(description, quantity, unitPrice));
    }

    // Remove an item from an invoice by index
    function removeItem(uint256 invoiceId, uint256 index) external {
        Invoice storage inv = invoices[invoiceId];
        require(inv.owner == msg.sender, "Not invoice owner");
        require(index < inv.items.length, "Index out of bounds");

        inv.items[index] = inv.items[inv.items.length - 1];
        inv.items.pop();
    }

    // Get items of an invoice
    function getItems(uint256 invoiceId) external view returns (Item[] memory) {
        return invoices[invoiceId].items;
    }

    // Calculate total price of an invoice
    function getTotalPrice(uint256 invoiceId) external view returns (uint256) {
        Invoice storage inv = invoices[invoiceId];
        uint256 total = 0;
        for (uint256 i = 0; i < inv.items.length; i++) {
            total += inv.items[i].quantity * inv.items[i].unitPrice;
        }
        return total;
    }

    // Pay an invoice
    function payInvoice(uint256 invoiceId) external payable {
        Invoice storage inv = invoices[invoiceId];
        uint256 totalPrice = this.getTotalPrice(invoiceId);
        require(msg.value >= totalPrice, "Insufficient payment");

        // Mark invoice as paid
        inv.paid = true;

        // Transfer payment to invoice owner
        payable(inv.owner).transfer(totalPrice);

        // Refund excess payment
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }
    }
}
