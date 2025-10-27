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
        address payer;
        uint256 id;
        string title;
        bool paid;
        Item[] items;
    }

    // Mapping for invoices
    mapping(uint256 => Invoice) public invoices;
    mapping(address => uint256[]) private ownerInvoices;
    mapping(address => uint256[]) private attributedInvoice;
    uint256 public nextInvoiceId;

    // Get invoice
    function getInvoice(
        uint256 invoiceId
    ) external view returns (Invoice memory) {
        return invoices[invoiceId];
    }

    // Create a new invoice
    function createInvoice(
        string memory title,
        Item[] memory items,
        address payer
    ) public {
        uint256 invoiceId = nextInvoiceId++;
        Invoice storage inv = invoices[invoiceId];
        inv.owner = msg.sender;
        inv.id = invoiceId;

        // Payer
        inv.payer = payer;
        attributedInvoice[payer].push(invoiceId);

        inv.title = title;
        inv.paid = false;

        for (uint256 i = 0; i < items.length; i++) {
            inv.items.push(
                Item(
                    items[i].description,
                    items[i].quantity,
                    items[i].unitPrice
                )
            );
        }

        ownerInvoices[msg.sender].push(invoiceId);
    }

    function deleteInvoice(uint256 invoiceId) external {
        Invoice storage inv = invoices[invoiceId];
        require(
            inv.owner == msg.sender ||
                (inv.payer == msg.sender && inv.paid == true),
            "Can't delete invoice"
        );

        // Save before delete
        address owner = inv.owner;
        address payer = inv.payer;

        // Delete invoice
        delete invoices[invoiceId];

        // Remove from owner's list
        _removeId(ownerInvoices[owner], invoiceId);

        // Remove from payer's attributed list
        if (payer != address(0)) {
            _removeId(attributedInvoice[payer], invoiceId);
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

        if (inv.payer != address(0)) {
            require(
                msg.sender == inv.payer,
                "You are not authorized to pay this invoice"
            );
        }
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
    function getInvoicesByOwner(
        address owner
    ) external view returns (Invoice[] memory) {
        uint256[] memory ids = ownerInvoices[owner];
        Invoice[] memory result = new Invoice[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = invoices[ids[i]];
        }

        return result;
    }

    // Get attributed Invoice
    function getAttributedInvoice(
        address attributedAddress
    ) external view returns (Invoice[] memory) {
        uint256[] memory ids = attributedInvoice[attributedAddress];
        Invoice[] memory result = new Invoice[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = invoices[ids[i]];
        }

        return result;
    }

    // Helpers //
    function _removeId(uint256[] storage arr, uint256 id) internal {
        for (uint256 i = 0; i < arr.length; i++) {
            if (arr[i] == id) {
                arr[i] = arr[arr.length - 1];
                arr.pop();
                break;
            }
        }
    }
}
