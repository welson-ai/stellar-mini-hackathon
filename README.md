# Stellar Sparkle - Stellar dApp

A multi-level Stellar dApp demonstrating wallet integration, Soroban smart contracts, and transaction management on the Stellar Testnet.

##  Level 1: Stellar Basics
This level covers the fundamental interactions with the Stellar network.

### Features
- **Wallet Connection**: Connect to the Stellar network using various wallets.
- **Balance Display**: View real-time XLM balance of the connected account.
- **Testnet Funding**: Fund new accounts using Friendbot.
- **XLM Transactions**: Send XLM to other Stellar addresses.

### Screenshots
- **Wallet connected state**: 
- **Balance displayed**: 
- **Successful testnet transaction**: `[Attach Screenshot Here]`
- **The transaction result is shown to the user**: `[Attach Screenshot Here]`

## 💎 Level 2 Checklist Verification
This project satisfies all the requirements for Level 2:

1.  **3 Error Types Handled**:
    -   `WalletNotConnectedError` (Type 1): Handles cases where users attempt actions without a connected wallet.
    -   `ContractInvocationError` (Type 2): Catches failures during Soroban contract simulation (e.g., logic errors).
    -   `TransactionFailedError` (Type 3): Manages on-chain failures and timeouts during polling.
2.  **Contract Deployed on Testnet**:
    -   Users can deploy their own instance of the Counter contract directly via the "Deploy New Contract" button.
3.  **Contract Called from Frontend**:
    -   The `incrementCount` and `fetchContractCount` functions interact with the Soroban RPC to read and update contract state.
4.  **Transaction Status Visible**:
    -   Real-time status updates (Pending, Success, Error) are shown in the UI.
    -   Successful transactions provide a direct link to the **Stellar Expert** explorer.

---

## 🛠️ Local Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd stellar
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```
   The app will be available at `http://localhost:1234`.

### Building for Production
To create a production build:
```bash
npm run build
```
The optimized files will be in the `dist/` directory.

---

## 📜 Project Structure
- `src/index.html`: Main UI structure.
- `src/script.js`: Core dApp logic, wallet integration, and contract interactions.
- `src/style.css`: Custom styling for the dApp.
- `package.json`: Project dependencies and scripts.
