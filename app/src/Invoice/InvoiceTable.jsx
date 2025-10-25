import { useEffect, useState } from 'react'
import { Search, ChevronDown, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { ZeroAddress } from "ethers";
import { createInvoice, getInvoice, getInvoicesByOwner, deleteInvoice, payInvoice, getTotalPrice } from './InvoiceContratManager';
import { connectWallet, getAddress } from '../Wallet/WalletManager';

export default function InvoiceTable() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [customerFilter, setCustomerFilter] = useState('All customers');

  const [formData, setFormData] = useState({
    title: '',
    status: '',
    ownerAddress: getAddress(),
    items: [
      { description: '', quantity: 1, unitPrice: '' },
    ],
  });

  const [payFormData, setPayFormData] = useState({
    invoiceId: '',
  });

  // Auto connect wallet and load invoices
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await connectWallet();
        await loadInvoices();
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Load Owners Invoices
  const loadInvoices = async () => {
    try {
      const ownerAddress = getAddress();
      if (!ownerAddress) {
        console.error('No wallet address found');
        return;
      }

      const ownerInvoices = await getInvoicesByOwner(ownerAddress);

      // Format invoice data for display
      const formattedInvoices = ownerInvoices.map(invoice => ({
        id: invoice.id,
        title: invoice.title,
        status: invoice.paid ? 'Paid' : 'Issued',
        createdOn: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        owner: invoice.owner,
        items: invoice.items
      }));

      setInvoices(formattedInvoices);
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Paid': return 'bg-emerald-100 text-emerald-700';
      case 'Issued': return 'bg-blue-100 text-blue-700';
      case 'Overdue': return 'bg-orange-100 text-orange-700';
      case 'Draft': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusDot = (status) => {
    switch (status) {
      case 'Paid': return 'bg-emerald-500';
      case 'Issued': return 'bg-blue-500';
      case 'Overdue': return 'bg-orange-500';
      case 'Draft': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  // --- Items Management ---
  const addItemRow = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unitPrice: '' }],
    });
  };

  const removeItemRow = (index) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const updateItemField = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce((acc, item) => {
      const qty = parseFloat(item.quantity || 0);
      const price = parseFloat(item.unitPrice || 0);
      return acc + qty * price;
    }, 0);
  };

  const handleCreateInvoice = async () => {
    try {
      if (!formData.title) {
        alert('Please enter an invoice title');
        return;
      }

      const hasValidItem = formData.items.some(i =>
        i.description && Number(i.quantity) > 0 && Number(i.unitPrice) > 0
      );

      if (!hasValidItem) {
        alert('Add at least one item with valid quantity and price');
        return;
      }

      // Create invoice
      await createInvoice(formData.title, formData.items, formData.payerAddress || ZeroAddress);

      // Reload invoices
      await loadInvoices();

      // Reset form and close modal
      setFormData({
        title: '',
        status: 'Draft',
        ownerAddress: getAddress(),
        items: [{ description: '', quantity: 1, unitPrice: '' }]
      });
      setShowCreateModal(false);

    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Error creating invoice: ' + error.message);
    }
  };

  async function handlePayInvoice() {
    try {
      const id = (payFormData.invoiceId || '').trim();
      if (!id) {
        alert('Please enter a valid Invoice ID');
        return;
      }

      // Pay invoice
      const totalWei = await getTotalPrice(id);
      await payInvoice(id, totalWei);

      // Reset + reload
      setPayFormData({ invoiceId: '' });
      setShowImportModal(false);
      await loadInvoices();

    } catch (error) {
      console.error('Error paying invoice:', error);
      alert('Error paying invoice: ' + error.message);
    }
  }

  // Delete Invoice
  function handleDeleteInvoice(invoiceId) {
    deleteInvoice(invoiceId).then(() => {
      loadInvoices();
    })
  }

  // Filter Invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All statuses' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="border-b border-gray-200 px-8 py-6 flex justify-between items-center">
        <h1 className="text-4xl font-bold text-gray-900">Invoice Manager</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-gray-100 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition"
          >
            Pay an Invoice
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Create Invoice
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-8 py-6 border-b border-gray-200">
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-0 rounded-lg text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-gray-50 border-0 rounded-lg px-4 py-3 pr-10 text-gray-700 cursor-pointer focus:ring-2 focus:ring-blue-500"
            >
              <option>All statuses</option>
              <option>Issued</option>
              <option>Paid</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="px-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading invoices...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No invoices found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-2 text-sm font-medium text-gray-600">Title</th>
                <th className="text-left py-4 px-2 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left py-4 px-2 text-sm font-medium text-gray-600">
                  <div className="flex items-center gap-1">
                    Created on
                    <ChevronDown size={16} className="text-gray-400" />
                  </div>
                </th>
                <th className="text-left py-4 px-2 text-sm font-medium text-gray-600">Invoice ID</th>
                <th className="text-left py-4 px-2 text-sm font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice, index) => (
                <tr key={invoice.id} className={`border-b border-gray-100 hover:bg-gray-50 ${index === filteredInvoices.length - 1 ? 'border-b-2 border-gray-300' : ''}`}>
                  <td className="py-4 px-2 text-gray-900 font-medium">{invoice.title}</td>
                  <td className="py-4 px-2">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(invoice.status)}`}>
                      <span className={`w-2 h-2 rounded-full ${getStatusDot(invoice.status)}`}></span>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-4 px-2 text-gray-700">{invoice.createdOn}</td>
                  <td className="py-4 px-2 text-gray-700">#{invoice.id}</td>
                  <td className="py-4 px-2">
                    <button onClick={() => { handleDeleteInvoice(invoice.id) }} className="text-red-500 hover:text-red-700 font-medium cursor-pointer">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="px-8 py-6 flex justify-between items-center">
        <div className="flex gap-2">
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <span>Results per page</span>
          <div className="relative">
            <select className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 cursor-pointer">
              <option>20</option>
              <option>50</option>
              <option>100</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 backdrop-blur-xs bg-white/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Invoice</h2>

            {/* Form */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Invoice title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Invoice Title"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Items Section */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold">Invoice Items</h3>
                  <button onClick={addItemRow} className="text-blue-600 hover:underline">+ Add Item</button>
                </div>

                <table className="w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-gray-700">Description</th>
                      <th className="p-2 text-left text-sm font-medium text-gray-700">Qty</th>
                      <th className="p-2 text-left text-sm font-medium text-gray-700">Unit Price</th>
                      <th className="p-2 text-right text-sm font-medium text-gray-700">Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => updateItemField(index, 'description', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-2 py-1"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItemField(index, 'quantity', e.target.valueAsNumber || 1)}
                            className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-right"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItemField(index, 'unitPrice', e.target.valueAsNumber || 0)}
                            className="w-28 border border-gray-300 rounded-lg px-2 py-1 text-right"
                          />
                        </td>
                        <td className="p-2 text-right">{((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}</td>
                        <td className="p-2 text-right">
                          {formData.items.length > 1 && (
                            <button onClick={() => removeItemRow(index)} className="text-red-500 hover:underline text-sm">
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="text-right mt-3 font-semibold text-gray-800">
                  Total: {calculateTotal().toFixed(2)} ETH
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateInvoice}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Create Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {showImportModal && (
        <div className="fixed inset-0 backdrop-blur-xs bg-white/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Pay an Invoice</h2>

            {/* Form */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Invoice ID</label>
                <input
                  value={payFormData.invoiceId}
                  onChange={(e) => setPayFormData({ ...payFormData, invoiceId: e.target.value })}
                  placeholder="Enter Invoice ID"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayInvoice}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Pay Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}