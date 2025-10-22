import {expect} from 'chai';
import {network} from 'hardhat';
const { ethers } = await network.connect();

describe('Invoice', function () {

    let invoiceContract: any;
    let owner: any;
    let addr1: any;

    beforeEach(async function () {
        [owner, addr1] = await ethers.getSigners();
        invoiceContract = await ethers.deployContract('InvoiceManager');
        await invoiceContract.waitForDeployment();
    });

    it('should create an invoice', async function () {
        await (await invoiceContract.connect(owner).createInvoice('Test Invoice', [])).wait();
        const invoice = await invoiceContract.invoices(0);
        expect(invoice.id).to.equal(0);
        expect(invoice.owner).to.equal(owner.address);
        expect(invoice.title).to.equal('Test Invoice');
    });

    it('should add items to invoice', async function () {
        await (await invoiceContract.connect(owner).createInvoice('Test Invoice', [])).wait();
        await (await invoiceContract.addItem(0, 'Item 1', 2, ethers.parseEther('1.0'))).wait();
        await (await invoiceContract.addItem(0, 'Item 2', 2, ethers.parseEther('1.0'))).wait();
        const item = await invoiceContract.getItems(0);
        expect(item.length).to.equal(2);
    });

    it('should remove items to invoice', async function () {
        await (await invoiceContract.connect(owner).createInvoice('Test Invoice', [])).wait();
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
        await (await invoiceContract.connect(owner).createInvoice('Test Invoice', [])).wait();
        await (await invoiceContract.addItem(0, 'Item 1', 2, ethers.parseEther('1.0'))).wait();
        await (await invoiceContract.addItem(0, 'Item 2', 3, ethers.parseEther('2.0'))).wait();
        const totalPrice = await invoiceContract.getTotalPrice(0);
        expect(totalPrice).to.equal(ethers.parseEther('8.0'));
    });

    it('should be able to pay invoice', async function () {
        await (await invoiceContract.connect(owner).createInvoice('Test Invoice', [])).wait();
        await (await invoiceContract.addItem(0, 'Item 1', 2, ethers.parseEther('1.0'))).wait();
        await (await invoiceContract.addItem(0, 'Item 2', 3, ethers.parseEther('2.0'))).wait();
        const totalPrice = await invoiceContract.getTotalPrice(0);
        await (await invoiceContract.connect(addr1).payInvoice(0, { value: totalPrice })).wait();
        const invoice = await invoiceContract.invoices(0);
        expect(invoice.paid).to.equal(true);
    });

    it('should refund overpayment', async function () {
        // Create invoice with 2 items worth 2 ether
        await (await invoiceContract.connect(owner).createInvoice('Test Invoice', [])).wait();
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
});