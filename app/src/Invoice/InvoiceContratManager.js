import { ethers } from "ethers";
import invoiceArtifact from '../artifacts/contracts/Invoice/Invoice.sol/InvoiceManager.json';

const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

const provider = new ethers.BrowserProvider(window.ethereum);
await provider.send("eth_requestAccounts", []);
const signer = await provider.getSigner();

const invoiceContract = new ethers.Contract(
  CONTRACT_ADDRESS,
  invoiceArtifact.abi,
  signer
);

export async function createInvoice(title, items) {
  await (await invoiceContract.createInvoice(title, items)).wait();

  // get id
  const next = await nextInvoiceId();
  let invoiceId = Number(next) - 1;

  return await getInvoice(invoiceId);
}

export async function deleteInvoice(invoiceId) {
  await (await invoiceContract.deleteInvoice(invoiceId)).wait();
}

export async function getInvoice(invoiceId) {
  let invoice = await invoiceContract.getInvoice(invoiceId);
  return {
    owner: invoice.owner,
    id: Number(invoice.id),
    title: invoice.title,
    paid: false,
    items: (invoice.items).map(item => ({
      description: item[0],
      quantity: Number(item[1]),
      unitPrice: Number(item[2])
    }))
  };
}

export async function getInvoicesByOwner(ownerAddress) {
  let invoices = await invoiceContract.getInvoicesByOwner(ownerAddress);
  return invoices;
}

export async function nextInvoiceId() {
  let nextId = await invoiceContract.nextInvoiceId();
  return nextId;
}

export async function getTotalPrice(invoiceId) {
  let totalPrice = await invoiceContract.getTotalPrice(invoiceId);
  return totalPrice;
}

export async function payInvoice(invoiceId, amountWei) {
  await (await invoiceContract.payInvoice(invoiceId, { value: amountWei })).wait();
}