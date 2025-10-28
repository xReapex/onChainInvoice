# 🧾 On-Chain Invoice

A decentralized invoice management system built on blockchain technology. This project serves as a hands-on training ground for Solidity and React development, implementing a fully on-chain invoice solution.

## 🎯 Overview

On-Chain Invoice is a small project designed to practice Solidity smart contract development and React frontend integration. Built with a test-driven development approach and modern tooling including Solidity, Hardhat, Vite, and React.

## ✨ Features

### Create Invoices
- **Itemized Billing**: Create invoices with multiple items, each containing:
  - Title
  - Quantity
  - Price per unit
- **Address Attribution**: Optionally assign an invoice to a specific address, restricting payment to that address only
- **Flexible Access**: If no address is assigned, anyone can pay the invoice

### Manage Invoices
- **Payment Processing**: Pay invoices using cryptocurrency
- **Owner Controls**: As the invoice creator, you can delete your unpaid invoices at any time
- **Payer Rights**: Once an invoice is paid, the payer can also delete it
- **Full On-Chain Storage**: All invoice data is permanently stored on the blockchain

## 🛠️ Tech Stack

- **Smart Contracts**: Solidity
- **Development Framework**: Hardhat
- **Frontend**: React + Vite
- **Development Approach**: Test-Driven Development (TDD)

## 🚀 Getting Started
```bash
# Clone the repository
git clone https://github.com/xReapex/onChainInvoice.git

# Install dependencies
npm install

# Run tests
npx hardhat test

# Start local blockchain
npx hardhat node

# Deploy contracts (change network inside file)
npx hardhat run scripts/deploy.ts

# Start frontend
cd app
npm run dev
```

## 📝 Usage

1. **Create an Invoice**
   - Add items with title, quantity, and price
   - Optionally specify a payer address
   - Submit to create the on-chain invoice

2. **Pay an Invoice**
   - View available invoices
   - Pay using your wallet (if you're the assigned address or if no address is assigned)

3. **Delete an Invoice**
   - As owner: Delete any of your unpaid invoices
   - As payer: Delete invoices you've paid

## 🎓 Learning Goals

This project demonstrates:
- Smart contract development with Solidity
- Testing smart contracts with Hardhat
- React integration with Web3
- On-chain data storage patterns
- Transaction handling and wallet integration

## 📄 License

MIT License - feel free to use this project for learning and development purposes.
