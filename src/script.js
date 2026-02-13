import { 
    StellarWalletsKit, 
    WalletNetwork, 
    XBULL_ID, 
    FREIGHTER_ID, 
    ALBEDO_ID,
    FreighterModule,
    AlbedoModule,
    XBullModule
} from '@creit.tech/stellar-wallets-kit';
import * as StellarSdk from '@stellar/stellar-sdk';

const { 
    Horizon, 
    rpc, 
    Networks, 
    TransactionBuilder, 
    Contract, 
    BASE_FEE, 
    Operation, 
    Address, 
    scValToNative, 
    Asset,
    Account
} = StellarSdk;

// --- Configuration ---
const NETWORK = WalletNetwork.TESTNET;
const HORIZON_URL = "https://horizon-testnet.stellar.org";
const SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org";

// --- Custom Error Types (Level 2 Requirement) ---
class WalletNotConnectedError extends Error {
    constructor() {
        super('Wallet not connected');
        this.name = 'WalletNotConnectedError';
    }
}

class TransactionFailedError extends Error {
    constructor(message) {
        super(`Transaction failed: ${message}`);
        this.name = 'TransactionFailedError';
    }
}

class ContractInvocationError extends Error {
    constructor(message) {
        super(`Contract invocation error: ${message}`);
        this.name = 'ContractInvocationError';
    }
}

const server = new Horizon.Server(HORIZON_URL);
const rpcServer = new rpc.Server(SOROBAN_RPC_URL);

// --- Sanity Check ---
if (!server || !rpcServer) {
    console.error("Failed to initialize Stellar servers. Check your SDK imports.");
} else {
    console.log("Stellar Horizon and Soroban RPC servers initialized.");
}

// Pre-compiled WASM for the Counter contract (Base64)
const COUNTER_WASM_B64 = "AGFzbQEAAAABGQVgAn5+AX5gA35+fgF+YAF/AGAAAX5gAAACEwMBbAEwAAABbAExAAABbAFfAAEDCAcCAwMDBAQEBQMBABAGGQN/AUGAgMAAC38AQYCAwAALfwBBgIDAAAsHQQYGbWVtb3J5AgAJZ2V0X2NvdW50AAUJaW5jcmVtZW50AAYBXwAJCl9fZGF0YV9lbmQDAQtfX2hlYXBfYmFzZQMCCrMCB1sCAX4CfwJAAkACQBCEgICAACIBQgEQgICAgABCAVENAEEAIQIMAQsgAUIBEIGAgIAAIgFC/wGDQgRSDQEgAUIgiKchA0EBIQILIAAgAzYCBCAAIAI2AgAPCwALCgBCjrrQr4bUOQtLAgJ/AX4jgICAgABBEGsiACSAgICAACAAQQhqEIOAgIAAIAAoAgghASAANQIMIQIgAEEQaiSAgICAACACQiCGQgSEQgQgAUEBcRsLbQICfwF+I4CAgIAAQRBrIgAkgICAgAAgAEEIahCDgICAAAJAIAAoAgxBACAAKAIIQQFxGyIBQX9HDQAQh4CAgAAACxCEgICAACABQQFqrUIghkIEhCICQgEQgoCAgAAaIABBEGokgICAgAAgAgsJABCIgICAAAALAwAACwIACwBXDmNvbnRyYWN0c3BlY3YwAAAAAAAAAAAAAAAJZ2V0X2NvdW50AAAAAAAAAAAAAAEAAAAEAAAAAAAAAAAAAAAJaW5jcmVtZW50AAAAAAAAAAAAAAEAAAAEAB4RY29udHJhY3RlbnZtZXRhdjAAAAAAAAAAFgAAAAAAbw5jb250cmFjdG1ldGF2MAAAAAAAAAAFcnN2ZXIAAAAAAAAGMS45My4wAAAAAAAAAAAACHJzc2RrdmVyAAAALzIyLjAuOSMzODkwNTIxNDI2ZDcxYmI0ZDg5MmIyMWY1YTI4M2ExZTgzNmNmYTM4AADOBARuYW1lABMSaGVsbG9fc29yb2Jhbi53YXNtAZ0ECgBKX1pOMTdzb3JvYmFuX2Vudl9ndWVzdDVndWVzdDZsZWRnZXIxN2hhc19jb250cmFjdF9kYXRhMTdoYzg1NDg5MWI3ZjYzNGJhM0UBSl9aTjE3c29yb2Jhbl9lbnZfZ3Vlc3Q1Z3Vlc3Q2bGVkZ2VyMTdnZXRfY29udHJhY3RfZGF0YTE3aDg1MDg3NDk4NTBlNGYyYjNFAkpfWk4xN3Nvcm9iYW5fZW52X2d1ZXN0NWd1ZXN0NmxlZGdlcjE3cHV0X2NvbnRyYWN0X2RhdGExN2hhMTNhZWMzNzcyOWE0OWRlRQM8X1pOMTFzb3JvYmFuX3NkazdzdG9yYWdlMTBQZXJzaXN0ZW50M2dldDE3aDU2NzM4NGVkZjVlNDZkYWNFBF5fWk42MF8kTFQkVSR1MjAkYXMkdTIwJHNvcm9iYW5fc2RrLi5lbnYuLkludG9WYWwkTFQkRSRDJFQkR1QkJEdUJDhpbnRvX3ZhbDE3aGIzN2ZhMThmNmNlNTdhMzRFBQlnZXRfY291bnQGCWluY3JlbWVudAdNX1pONGNvcmU5cGFuaWNraW5nMTFwYW5pY19jb25zdDI0cGFuaWNfY29uc3RfYWRkX292ZXJmbG93MTdoMWJmNWUxZDU4OTJmYzkwMEUIMF9aTjRjb3JlOXBhbmlja2luZzlwYW5pY19mbXQxN2hhOTI3NmQ0ZDlmNzRjNjRlRQkBXwcSAQAPX19zdGFja19wb2ludGVyAE0JcHJvZHVjZXJzAghsYW5ndWFnZQEEUnVzdAAMcHJvY2Vzc2VkLWJ5AQVydXN0Yx0xLjkzLjAgKDI1NGI1OTYwNyAyMDI2LTAxLTE5KQCUAQ90YXJnZXRfZmVhdHVyZXMIKwtidWxrLW1lbW9yeSsPYnVsay1tZW1vcnktb3B0KxZjYWxsLWluZGlyZWN0LW92ZXJsb25nKwptdWx0aXZhbHVlKw9tdXRhYmxlLWdsb2JhbHMrE25vbnRyYXBwaW5nLWZwdG9pbnQrD3JlZmVyZW5jZS10eXBlcysIc2lnbi1leHQ=";

// --- State ---
let kit;
let userPublicKey = null;
let currentWalletId = null;
let contractId = localStorage.getItem('stellar_contract_id') || null;

// --- DOM Elements ---
const connectWalletBtn = document.getElementById('connect-wallet');
const disconnectWalletBtn = document.getElementById('disconnect-wallet');
const walletModal = document.getElementById('wallet-modal');
const walletOptions = document.getElementById('wallet-options');
const closeModalBtn = document.getElementById('close-modal');

const notConnectedDiv = document.getElementById('not-connected');
const connectedDiv = document.getElementById('connected');
const walletNameSpan = document.getElementById('wallet-name');
const publicKeySpan = document.getElementById('public-key');
const balanceSpan = document.getElementById('balance');
const fundAccountBtn = document.getElementById('fund-account');

const contractSection = document.getElementById('contract-section');
const contractCountSpan = document.getElementById('contract-count');
const contractIdSpan = document.getElementById('contract-id');
const refreshCountBtn = document.getElementById('refresh-count');
const incrementCountBtn = document.getElementById('increment-count');
const deployContractBtn = document.getElementById('deploy-contract');

const destinationInput = document.getElementById('destination');
const amountInput = document.getElementById('amount');
const sendXlmBtn = document.getElementById('send-xlm');
const statusDisplay = document.getElementById('status-display');

// --- Initialization ---
function initKit() {
    kit = new StellarWalletsKit({
        network: NETWORK,
        selectedWalletId: FREIGHTER_ID,
        modules: [
            new FreighterModule(),
            new AlbedoModule(),
            new XBullModule()
        ]
    });
}

// --- UI Helpers ---
function showStatus(message, type = 'success') {
    statusDisplay.textContent = message;
    statusDisplay.className = `status-msg status-${type}`;
    statusDisplay.style.display = 'block';
    
    // Remove old explorer links if any
    const oldLink = statusDisplay.querySelector('.tx-explorer-link');
    if (oldLink) oldLink.remove();
    
    if (type !== 'pending') {
        setTimeout(() => {
            if (statusDisplay.textContent === message) {
                statusDisplay.style.opacity = '0';
                setTimeout(() => {
                    statusDisplay.style.display = 'none';
                    statusDisplay.style.opacity = '1';
                }, 300);
            }
        }, 8000);
    }
}

async function updateUI() {
    if (userPublicKey) {
        notConnectedDiv.style.display = 'none';
        connectedDiv.style.display = 'block';
        contractSection.style.display = 'block';
        publicKeySpan.textContent = `${userPublicKey.slice(0, 6)}...${userPublicKey.slice(-6)}`;
        walletNameSpan.textContent = currentWalletId;
        sendXlmBtn.disabled = false;
        
        if (contractId) {
            contractIdSpan.textContent = `${contractId.slice(0, 8)}...${contractId.slice(-8)}`;
            fetchContractCount();
        } else {
            contractIdSpan.textContent = "Not deployed";
            contractCountSpan.textContent = "?";
        }
        
        updateBalance();
    } else {
        notConnectedDiv.style.display = 'block';
        connectedDiv.style.display = 'none';
        contractSection.style.display = 'none';
        sendXlmBtn.disabled = true;
    }
}

// --- Wallet Logic ---
async function updateBalance() {
    if (!userPublicKey) return;
    try {
        const account = await server.loadAccount(userPublicKey);
        const nativeBalance = account.balances.find(b => b.asset_type === 'native');
        balanceSpan.textContent = parseFloat(nativeBalance.balance).toFixed(2);
    } catch (e) {
        console.error("Error fetching balance:", e);
        balanceSpan.textContent = "0.00";
        showStatus("Account not found on testnet. Please fund it!", "error");
    }
}

async function connectWallet(walletId) {
    try {
        showStatus("Connecting...", "pending");
        kit.setWallet(walletId);
        const { address } = await kit.getAddress();
        
        if (!address) {
            throw new WalletNotConnectedError();
        }

        userPublicKey = address;
        currentWalletId = walletId;
        
        walletModal.style.display = 'none';
        showStatus(`Connected to ${walletId}!`, "success");
        updateUI();
    } catch (e) {
        console.error("Connection error:", e);
        if (e instanceof WalletNotConnectedError) {
            showStatus("❌ Error Type 1: Wallet not connected", "error");
        } else {
            showStatus(`Failed to connect: ${e.message || e}`, "error");
        }
    }
}

// --- Contract Logic ---
async function fetchContractCount() {
    if (!contractId || !userPublicKey) return;
    try {
        const contract = new Contract(contractId);
        const tx = new TransactionBuilder(
            new Account(userPublicKey, "0"),
            { fee: "100", networkPassphrase: Networks.TESTNET }
        )
        .addOperation(contract.call("get_count"))
        .setTimeout(30)
        .build();

        const result = await rpcServer.simulateTransaction(tx);
        if (rpc.Api.isSimulationSuccess(result)) {
            const count = scValToNative(result.result.retval);
            contractCountSpan.textContent = count;
        }
    } catch (e) {
        console.error("Error fetching count:", e);
    }
}

async function incrementCount() {
    try {
        if (!userPublicKey) {
            throw new WalletNotConnectedError();
        }
        if (!contractId) {
            showStatus("Deploy contract first!", "error");
            return;
        }

        showStatus("Incrementing count...", "pending");
        
        const contract = new Contract(contractId);
        const account = await server.loadAccount(userPublicKey);
        
        let tx = new TransactionBuilder(account, {
            fee: BASE_FEE,
            networkPassphrase: Networks.TESTNET,
        })
        .addOperation(contract.call("increment"))
        .setTimeout(30)
        .build();

        // Simulate (Level 2 requirement - Error Type 2)
        const simulation = await rpcServer.simulateTransaction(tx);
        if (rpc.Api.isSimulationError(simulation)) {
            throw new ContractInvocationError(simulation.error);
        }

        tx = await rpcServer.prepareTransaction(tx);
        const signedXdr = await kit.signTransaction(tx.toXDR());
        const signedTx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
        
        const result = await rpcServer.sendTransaction(signedTx);
        
        if (result.status === "PENDING") {
            showStatus("Transaction pending...", "pending");
            await pollTransactionStatus(result.hash, "Increment successful! ✨");
        } else if (result.status === "DUPLICATE") {
             showStatus("Transaction already submitted", "error");
        } else {
            // Error Type 3
            throw new TransactionFailedError(result.status);
        }
    } catch (e) {
        console.error("Increment error:", e);
        if (e instanceof WalletNotConnectedError) {
            showStatus("❌ Error Type 1: Wallet not connected", "error");
        } else if (e instanceof ContractInvocationError) {
            showStatus(`❌ Error Type 2: ${e.message}`, "error");
        } else if (e instanceof TransactionFailedError) {
            showStatus(`❌ Error Type 3: ${e.message}`, "error");
        } else {
            showStatus(`Error: ${e.message || "Failed to increment"}`, "error");
        }
    }
}

async function deployNewContract() {
    if (!userPublicKey) return;
    try {
        showStatus("Deploying contract (1/2: Uploading WASM)...", "pending");
        
        const account = await server.loadAccount(userPublicKey);
        const wasmBuffer = Buffer.from(COUNTER_WASM_B64, 'base64');
        
        // 1. Upload WASM
        let uploadTx = new TransactionBuilder(account, {
            fee: BASE_FEE,
            networkPassphrase: Networks.TESTNET,
        })
        .addOperation(Operation.uploadContractWasm({ wasm: wasmBuffer }))
        .setTimeout(30)
        .build();

        uploadTx = await rpcServer.prepareTransaction(uploadTx);
        const signedUploadXdr = await kit.signTransaction(uploadTx.toXDR());
        const signedUploadTx = TransactionBuilder.fromXDR(signedUploadXdr, Networks.TESTNET);
        
        const uploadResult = await rpcServer.sendTransaction(signedUploadTx);
        if (uploadResult.status !== "PENDING") throw new Error("WASM upload failed");
        
        const wasmResult = await pollTransactionStatus(uploadResult.hash, "WASM uploaded! (2/2: Creating Instance)...");
        const wasmId = wasmResult.returnValue.bytes().toString('hex');
        
        // 2. Create Contract Instance
        const updatedAccount = await server.loadAccount(userPublicKey);
        let createTx = new TransactionBuilder(updatedAccount, {
            fee: BASE_FEE,
            networkPassphrase: Networks.TESTNET,
        })
        .addOperation(Operation.createContract({
            wasmHash: wasmId,
            address: new Address(userPublicKey)
        }))
        .setTimeout(30)
        .build();

        createTx = await rpcServer.prepareTransaction(createTx);
        const signedCreateXdr = await kit.signTransaction(createTx.toXDR());
        const signedCreateTx = TransactionBuilder.fromXDR(signedCreateXdr, Networks.TESTNET);
        
        const createResult = await rpcServer.sendTransaction(signedCreateTx);
        const finalResult = await pollTransactionStatus(createResult.hash, "Contract deployed successfully! 🎉");
        
        contractId = finalResult.returnValue.address().toString();
        localStorage.setItem('stellar_contract_id', contractId);
        updateUI();
        
    } catch (e) {
        console.error("Deployment error:", e);
        showStatus(`Deployment failed: ${e.message || e}`, "error");
    }
}

async function pollTransactionStatus(hash, successMsg) {
    let retry = 0;
    while (retry < 20) {
        const status = await rpcServer.getTransaction(hash);
        if (status.status === "SUCCESS") {
            showStatus(successMsg, "success");
            
            // Add transaction link to status display
            const txLink = document.createElement('a');
            txLink.href = `https://stellar.expert/explorer/testnet/tx/${hash}`;
            txLink.target = "_blank";
            txLink.textContent = " View on Stellar Expert";
            txLink.className = "tx-explorer-link";
            statusDisplay.appendChild(txLink);

            fetchContractCount();
            updateBalance();
            return status;
        } else if (status.status === "FAILED") {
            // Error Type 3
            throw new TransactionFailedError(`Transaction ${hash} failed on-chain`);
        }
        await new Promise(r => setTimeout(r, 2000));
        retry++;
    }
    throw new TransactionFailedError("Transaction timeout after 40 seconds");
}

// --- Event Listeners ---
connectWalletBtn.addEventListener('click', () => {
    walletOptions.innerHTML = '';
    const wallets = [
        { id: FREIGHTER_ID, name: 'Freighter', icon: 'https://www.freighter.app/favicon.ico' },
        { id: ALBEDO_ID, name: 'Albedo', icon: 'https://albedo.link/favicon.ico' },
        { id: XBULL_ID, name: 'xBull', icon: 'https://xbull.app/favicon.ico' }
    ];

    wallets.forEach(w => {
        const opt = document.createElement('div');
        opt.className = 'wallet-option';
        opt.innerHTML = `<img src="${w.icon}" alt="${w.name}"> <span>${w.name}</span>`;
        opt.onclick = () => connectWallet(w.id);
        walletOptions.appendChild(opt);
    });
    
    walletModal.style.display = 'flex';
});

closeModalBtn.addEventListener('click', () => walletModal.style.display = 'none');

disconnectWalletBtn.addEventListener('click', () => {
    userPublicKey = null;
    currentWalletId = null;
    updateUI();
    showStatus("Disconnected", "success");
});

fundAccountBtn.addEventListener('click', async () => {
    if (!userPublicKey) return;
    showStatus("Funding account...", "pending");
    try {
        const response = await fetch(`https://friendbot.stellar.org?addr=${userPublicKey}`);
        if (response.ok) {
            showStatus("Account funded! 💰", "success");
            updateBalance();
        } else {
            showStatus("Friendbot failed. Try again later.", "error");
        }
    } catch (e) {
        showStatus("Error funding account.", "error");
    }
});

incrementCountBtn.addEventListener('click', incrementCount);
refreshCountBtn.addEventListener('click', fetchContractCount);
deployContractBtn.addEventListener('click', deployNewContract);

sendXlmBtn.addEventListener('click', async () => {
    const dest = destinationInput.value;
    const amount = amountInput.value;
    
    if (!dest || !amount) {
        showStatus("Please fill in all fields", "error");
        return;
    }

    try {
        showStatus("Sending XLM...", "pending");
        const account = await server.loadAccount(userPublicKey);
        const transaction = new TransactionBuilder(account, {
            fee: BASE_FEE,
            networkPassphrase: Networks.TESTNET
        })
        .addOperation(Operation.payment({
            destination: dest,
            asset: Asset.native(),
            amount: amount
        }))
        .setTimeout(30)
        .build();

        const signedXdr = await kit.signTransaction(transaction.toXDR());
        const signedTx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
        const result = await server.submitTransaction(signedTx);
        
        showStatus(`Sent ${amount} XLM! 🚀`, "success");
        updateBalance();
    } catch (e) {
        console.error("Send error:", e);
        showStatus(`Failed to send: ${e.message || "Error"}`, "error");
    }
});

// Initialize on load
initKit();
updateUI();
