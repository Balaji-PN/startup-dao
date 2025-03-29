# Startup DAO

A decentralized platform for funding innovative startups using blockchain technology. Built with Next.js, TypeScript, and Solidity.

![Startup DAO](./public/screenshot.png)

## Features

- **Create Funding Proposals**: Startups can create detailed funding proposals with custom funding goals and deadlines.
- **Fund Projects**: Investors can contribute ETH to promising startup projects.
- **Smart Contract Security**: All funds are securely managed by smart contracts on the Ethereum blockchain.
- **Responsive UI**: Beautiful UI that works across desktop and mobile devices.
- **Dark/Light Mode**: Support for both dark and light themes.
- **Web3 Integration**: Seamless wallet connection using RainbowKit.

## Tech Stack

- **Frontend**:
  - Next.js
  - TypeScript
  - TailwindCSS
  - Wagmi (Ethereum hooks)
  - RainbowKit (Wallet connection)

- **Smart Contracts**:
  - Solidity
  - Hardhat
  - Ethers.js

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- MetaMask or other Web3 wallet

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/startup-dao.git
   cd startup-dao
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in the required values in `.env.local`.

4. Compile and deploy the smart contracts:
   ```bash
   cd blockchain
   npx hardhat compile
   npx hardhat node
   # In a new terminal
   npx hardhat run scripts/deploy.js --network localhost
   ```

5. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Smart Contract Development

The smart contracts are located in the `blockchain/contracts` directory. The main contract is `StartupFunding.sol`.

### Testing

Run the tests with:

```bash
cd blockchain
npx hardhat test
```

### Deployment

Deploy to a local network:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

Deploy to a test network (e.g., Sepolia):

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

## Frontend Development

The frontend is built with Next.js and is located in the `app` directory. The UI components are in the `components` directory.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
