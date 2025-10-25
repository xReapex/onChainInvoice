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
    mapping(address => uint256[]) private ownerInvoices;
    uint256 public nextInvoiceId;

    // Get invoice
    function getInvoice(
        uint256 invoiceId
    ) external view returns (Invoice memory) {
        return invoices[invoiceId];
    }

    // Create a new invoice
    function createInvoice(string memory title, Item[] memory items) external {
        uint256 invoiceId = nextInvoiceId++;
        Invoice storage inv = invoices[invoiceId];
        inv.owner = msg.sender;
        inv.id = invoiceId;
        inv.title = title;
        inv.paid = false;

        for (uint256 i = 0; i < items.length; i++) {
            inv.items.push(Item({
                description: items[i].description,
                quantity: items[i].quantity,
                unitPrice: items[i].unitPrice
            }));
        }

        ownerInvoices[msg.sender].push(invoiceId);
    }

    function deleteInvoice(uint256 invoiceId) external {
        Invoice storage inv = invoices[invoiceId];
        require(inv.owner == msg.sender, "Not invoice owner");

        // Delete invoice
        delete invoices[invoiceId];

        // Remove from owner's list
        uint256[] storage ownerInvs = ownerInvoices[msg.sender];
        for (uint256 i = 0; i < ownerInvs.length; i++) {
            if (ownerInvs[i] == invoiceId) {
                ownerInvs[i] = ownerInvs[ownerInvs.length - 1];
                ownerInvs.pop();
                break;
            }
        }
    }

    // Add an item to an invoice
    function addItem(
        uint256 invoiceId,
        string memory description,
        uint256 quantity,
        uint256 unitPrice
    ) external {
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

    // Get all invoices created by owner
    function getInvoicesByOwner(address owner) external view returns (Invoice[] memory) {
        uint256[] memory ids = ownerInvoices[owner];
        Invoice[] memory result = new Invoice[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = invoices[ids[i]];
        }

        return result;
    }
}
