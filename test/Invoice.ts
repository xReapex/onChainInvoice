import { expect } from 'chai';
import { ZeroAddress } from 'ethers';
import { network } from 'hardhat';
const { ethers } = await network.connect();

describe('Invoice', function () {

    let invoiceContract: any;
    let owner: any;
    let addr1: any;
    let addr2: any;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        invoiceContract = await ethers.deployContract('InvoiceManager');
        await invoiceContract.waitForDeployment();
    });

    it('should create an invoice with no item', async function () {
        await (await invoiceContract.connect(owner).createInvoice('Test Invoice', [], ZeroAddress)).wait();
        const invoice = await invoiceContract.invoices(0);
        expect(invoice.id).to.equal(0);
        expect(invoice.owner).to.equal(owner.address);
        expect(invoice.title).to.equal('Test Invoice');
    });

    it('should create an invoice with many items', async function () {
        await (await invoiceContract.connect(owner).createInvoice('Test Invoice', [], ZeroAddress)).wait();
        await (await invoiceContract.addItem(0, 'Item 1', 2, ethers.parseEther('1.0'))).wait();
        await (await invoiceContract.addItem(0, 'Item 2', 2, ethers.parseEther('2.0'))).wait();

        const invoice = await invoiceContract.invoices(0);
        const items = await invoiceContract.getItems(0)

        expect(items.length).to.be.equal(2)

        expect(invoice.id).to.equal(0);
        expect(invoice.owner).to.equal(owner.address);
        expect(invoice.title).to.equal('Test Invoice');

        expect(items[0].description).to.be.equal('Item 1');
        expect(items[1].description).to.be.equal('Item 2');

        expect(items[0].quantity).to.be.equal(2)
        expect(items[1].quantity).to.be.equal(2)

        expect(items[0].unitPrice).to.be.equal(ethers.parseEther('1.0'))
        expect(items[1].unitPrice).to.be.equal(ethers.parseEther('2.0'))
    });

    it('should delete an invoice as owner', async function () {
        await (await invoiceContract.connect(owner).createInvoice('Test Invoice', [], ZeroAddress)).wait();
        let invoice = await invoiceContract.invoices(0);
        expect(invoice.id).to.equal(0);
        await (await invoiceContract.connect(owner).deleteInvoice(0)).wait();
        invoice = await invoiceContract.invoices(0);
        expect(invoice.id).to.equal(0);
        expect(invoice.owner).to.equal(ZeroAddress);
    });

    it('should delete a paid invoice as payer', async function () {
        await (await invoiceContract.connect(owner).createInvoice('Test Invoice', [], addr1.address)).wait();

        await (await invoiceContract.addItem(0, 'Item 1', 2, ethers.parseEther('1.0'))).wait();
        await (await invoiceContract.addItem(0, 'Item 2', 2, ethers.parseEther('1.0'))).wait();

        const totalPrice = await invoiceContract.getTotalPrice(0);
        await (await invoiceContract.connect(addr1).payInvoice(0, { value: totalPrice })).wait();

        await (await invoiceContract.deleteInvoice(0)).wait();
        let invoice = await invoiceContract.invoices(0);

        expect(invoice.id).to.equal(0);
        expect(invoice.owner).to.equal(ZeroAddress);
    });

    it('should reverse when deleting an unpaid invoice as payer', async function () {
        await (await invoiceContract.connect(owner).createInvoice('Test Invoice', [], addr1.address)).wait();

        await (await invoiceContract.addItem(0, 'Item 1', 2, ethers.parseEther('1.0'))).wait();
        await (await invoiceContract.addItem(0, 'Item 2', 2, ethers.parseEther('1.0'))).wait();

        expect(invoiceContract.connect(addr1).deleteInvoice(0)).revertedWith('Can\'t delete invoice');
    });

    it('should add items to invoice', async function () {
        await (await invoiceContract.connect(owner).createInvoice('Test Invoice', [], ZeroAddress)).wait();
        await (await invoiceContract.addItem(0, 'Item 1', 2, ethers.parseEther('1.0'))).wait();
        await (await invoiceContract.addItem(0, 'Item 2', 2, ethers.parseEther('1.0'))).wait();
        const item = await invoiceContract.getItems(0);
        expect(item.length).to.equal(2);
    });

    it('should remove items to invoice', async function () {
        await (await invoiceContract.connect(owner).createInvoice('Test Invoice', [], ZeroAddress)).wait();
        await (await invoiceContract.addItem(0, 'Item 1', 2, ethers.parseEther('1.0'))).wait();
        await (await invoiceContract.addItem(0, 'Item 2', 2, ethers.parseEther('1.0'))).wait();

        // Should have 2 items
        const item = await invoiceContract.getItems(0);
        expect(item.length).to.equal(2);

        // Should remove first item
        await (await invoiceContract.removeItem(0, 1)).wait();
        const newItem = await invoiceContract.getItems(0);
        expect(newItem.length).to.equal(1);
    });

    it('should get total price of invoice', async function () {
        await (await invoiceContract.connect(owner).createInvoice('Test Invoice', [], ZeroAddress)).wait();
        await (await invoiceContract.addItem(0, 'Item 1', 2, ethers.parseEther('1.0'))).wait();
        await (await invoiceContract.addItem(0, 'Item 2', 3, ethers.parseEther('2.0'))).wait();
        const totalPrice = await invoiceContract.getTotalPrice(0);
        expect(totalPrice).to.equal(ethers.parseEther('8.0'));
    });

    it('should be able to pay invoice if ZeroAddress', async function () {
        await (await invoiceContract.connect(owner).createInvoice('Test Invoice', [], ZeroAddress)).wait();
        await (await invoiceContract.addItem(0, 'Item 1', 2, ethers.parseEther('1.0'))).wait();
        await (await invoiceContract.addItem(0, 'Item 2', 3, ethers.parseEther('2.0'))).wait();
        const totalPrice = await invoiceContract.getTotalPrice(0);
        await (await invoiceContract.connect(addr1).payInvoice(0, { value: totalPrice })).wait();
        const invoice = await invoiceContract.invoices(0);
        expect(invoice.paid).to.equal(true);
    });

    it('should not be able to pay if not ZeroAddress nether payer address', async function () {
        await (await invoiceContract.connect(owner).createInvoice('Test Invoice', [], addr1.address)).wait();
        await (await invoiceContract.addItem(0, 'Item 1', 2, ethers.parseEther('1.0'))).wait();
        await (await invoiceContract.addItem(0, 'Item 2', 3, ethers.parseEther('2.0'))).wait();
        const totalPrice = await invoiceContract.getTotalPrice(0);
        expect(invoiceContract.connect(addr2).payInvoice(0, { value: totalPrice })).to.be.revertedWith("You are not authorized to pay this invoice")
    });

    it('should refund overpayment', async function () {
        // Create invoice with 2 items worth 2 ether
        await (await invoiceContract.connect(owner).createInvoice('Test Invoice', [], ZeroAddress)).wait();
        await (await invoiceContract.addItem(0, 'Item 1', 2, ethers.parseEther('1.0'))).wait();
        const totalPrice = await invoiceContract.getTotalPrice(0);

        // Setup overpayment of 5 ether
        const overPayment = ethers.parseEther('5.0');

        // Check balance before and after payment
        const initialBalance = await ethers.provider.getBalance(addr1.address);
        const tx = await (await invoiceContract.connect(addr1).payInvoice(0, { value: overPayment })).wait();
        const finalBalance = await ethers.provider.getBalance(addr1.address);

        // Calculate expected final balance
        const gasUsed = BigInt(tx.gasUsed) * BigInt(tx.gasPrice);
        expect(finalBalance).to.equal(initialBalance - totalPrice - gasUsed);
    })

    it('should get all invoice by Owner', async function () {
        await (await invoiceContract.connect(owner).createInvoice('Test 1', [], ZeroAddress)).wait();
        await (await invoiceContract.createInvoice('Test 2', [], ZeroAddress)).wait();

        let invoices = await invoiceContract.getInvoicesByOwner(owner.address);
        expect(invoices.length).to.be.equal(2)
        expect(Number(invoices[0].id)).to.equal(0);
        expect(Number(invoices[1].id)).to.equal(1);
    });

    it('should revert addItem/removeItem/deleteInvoice when not owner', async () => {
        await (await invoiceContract.connect(owner).createInvoice('Test Invoice', [], ZeroAddress)).wait();
        await (await invoiceContract.connect(owner).addItem(0, 'Item', 1, ethers.parseEther('1'))).wait();
        expect(invoiceContract.connect(addr1).addItem.staticCall(0, 'Item 2', 1, ethers.parseEther('1'))).to.be.revertedWith('Not invoice owner');
        expect(invoiceContract.connect(addr1).removeItem.staticCall(0, 0)).to.be.revertedWith('Not invoice owner');
        expect(invoiceContract.connect(addr1).deleteInvoice.staticCall(0)).to.be.revertedWith('Can\'t delete invoice');
    });

    it('should retreive invoices attributed to address', async () => {
        await (await invoiceContract.connect(owner).createInvoice('Test Invoice', [], addr1.address)).wait();
        await (await invoiceContract.createInvoice('Test Invoice 2', [], addr1.address)).wait();
        const invoices = await invoiceContract.getAttributedInvoice(addr1.address);
        expect(invoices.length).to.be.equal(2);
        expect(invoices[0].title).to.be.equal('Test Invoice')
        expect(invoices[1].title).to.be.equal('Test Invoice 2')
    })
});