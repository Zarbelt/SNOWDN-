// Exchange Rates
const kasToSwodnRate = 10; 
const swodnToKasRate = 0.022; 
const ksdogToSwodnBuyRate = 100000; 
const ksdogToSwodnSellRate = 0.000909; 
const kangoToSwodnRate = 250; 
const swodnToKangoRate = 330; 
const nachoToSwodnRate = 100; 
const swodnToNachoRate = 165; 
const usdcToSwodnRate = 500;
const swodnToUsdcRate = 0.002;
const minSwodnForUsdc = 500;

// DOM Elements
const sendInput = document.getElementById('send-amount');
const swodnInput = document.getElementById('swodn-amount');
const buyBtn = document.getElementById('buy-btn');
const sellBtn = document.getElementById('sell-btn');
const toggleBtn = document.getElementById('toggle-btn');
const sendLabel = document.getElementById('send-label');
const getLabel = document.getElementById('get-label');
const selectedCurrency = document.getElementById("selected-currency");
const currencyList = document.getElementById("currency-list");
const kaswareConnectDiv = document.getElementById('kasware-connect');
const connectKaswareBtn = document.getElementById('connect-kasware-btn');

// Initial State
let isKasToSwodn = true; // Default mode: You send KAS, get SNOWDN
let selectedCurrencyValue = 'KAS'; // Default currency
const maxSnowdn = 1000; // Maximum SNOWDN per transaction
const minSnowdn = 10; // Minimum SWODN for any transaction
const minKsdogBuy = 100000; // Minimum KSDOG for buy transaction

// Kasware Wallet State Management
class KaswareState extends EventTarget {
  constructor() {
    super(); // Call the parent constructor (EventTarget)
    this.state = {
      account: null,
      isConnected: false,
      balance: null,
      krc20Balances: null,
      isLoading: false,
      error: null,
    };
    this.initialize();
  }

  static getInstance() {
    if (!KaswareState.instance) {
      KaswareState.instance = new KaswareState();
    }
    return KaswareState.instance;
  }

  initialize() {
    if (window.kasware) {
      window.kasware.on("accountsChanged", this.handleAccountsChanged.bind(this));
      window.kasware.on("chainChanged", this.handleChainChanged.bind(this));
      window.kasware.on("disconnect", this.handleDisconnect.bind(this));
    }
  }

  async connectWallet() {
    this.setState({ isLoading: true, error: null });
    try {
      const accounts = await window.kasware.getAccounts();
      if (accounts.length > 0) {
        this.setState({
          account: accounts[0],
          isConnected: true,
          isLoading: false,
        });
        await this.refreshBalances();
      } else {
        throw new Error("No accounts found. Please unlock your wallet.");
      }
    } catch (error) {
      this.setState({ error: "Failed to connect wallet", isLoading: false });
      throw error;
    }
  }

  async refreshBalances() {
    if (this.state.account) {
      try {
        const [balance, krc20Balances] = await Promise.all([
          window.kasware.getBalance(),
          window.kasware.getKRC20Balances(),
        ]);
        this.setState({ balance, krc20Balances });
      } catch (error) {
        this.setState({ error: "Failed to fetch balances" });
        throw error;
      }
    }
  }

  handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      this.setState({
        account: null,
        isConnected: false,
        balance: null,
        krc20Balances: null,
      });
    } else {
      this.setState({ account: accounts[0], isConnected: true });
      this.refreshBalances().catch(console.error);
    }
  }

  handleChainChanged() {
    this.connectWallet().catch(console.error);
  }

  handleDisconnect() {
    this.setState({
      account: null,
      isConnected: false,
      balance: null,
      krc20Balances: null,
    });
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    // Dispatch a custom event when the state changes
    this.dispatchEvent(new CustomEvent("stateChanged", { detail: this.state }));
  }

  getState() {
    return { ...this.state };
  }
}

function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Event Listeners for Input Fields
sendInput.addEventListener('input', () => {
  updateExchangeValues();
});

swodnInput.addEventListener('input', () => {
  updateReverseExchangeValues();
});

// Update Exchange Values
function updateExchangeValues() {
  const sendAmount = parseFloat(sendInput.value);
  let calculatedAmount = 0;

  if (!isNaN(sendAmount)) {
    if (selectedCurrencyValue === 'KAS') {
      calculatedAmount = isKasToSwodn
        ? sendAmount * kasToSwodnRate
        : sendAmount * swodnToKasRate;
    } else if (selectedCurrencyValue === 'KSDOG') {
      if (isKasToSwodn && sendAmount >= minKsdogBuy) {
        calculatedAmount = Math.floor(sendAmount / ksdogToSwodnBuyRate);
      } else if (!isKasToSwodn) {
        calculatedAmount = Math.floor(sendAmount / ksdogToSwodnSellRate);
      }
    } else if (selectedCurrencyValue === 'KANGO') {
      calculatedAmount = isKasToSwodn
        ? sendAmount / kangoToSwodnRate
        : sendAmount * swodnToKangoRate;
    } else if (selectedCurrencyValue === 'NACHO') {
      calculatedAmount = isKasToSwodn
        ? sendAmount / nachoToSwodnRate
        : sendAmount * swodnToNachoRate;
    } else if (selectedCurrencyValue === 'USDC') {
      calculatedAmount = isKasToSwodn
        ? sendAmount * usdcToSwodnRate // 1 USDC = 500 SWODN (BUY)
        : sendAmount / usdcToSwodnRate; // 500 SWODN = 1 USDC (SELL)
    }

    calculatedAmount = Math.floor(calculatedAmount);
    if (calculatedAmount < minSnowdn) {
      calculatedAmount = 0;
    } else if (calculatedAmount > maxSnowdn) {
      calculatedAmount = maxSnowdn;
      if (selectedCurrencyValue === 'KAS') {
        sendInput.value = Math.floor(maxSnowdn / kasToSwodnRate);
      } else if (selectedCurrencyValue === 'KSDOG') {
        sendInput.value = Math.floor(maxSnowdn * ksdogToSwodnBuyRate);
      } else if (selectedCurrencyValue === 'KANGO') {
        sendInput.value = Math.floor(maxSnowdn * kangoToSwodnRate);
      } else if (selectedCurrencyValue === 'NACHO') {
        sendInput.value = Math.floor(maxSnowdn * nachoToSwodnRate);
      } else if (selectedCurrencyValue === 'USDC') {
        sendInput.value = Math.floor(maxSnowdn / usdcToSwodnRate); // Adjust USDC input for max SWODN
      }
    }

    swodnInput.value = calculatedAmount;
  } else {
    swodnInput.value = '';
  }
}

// Update Reverse Exchange Values
function updateReverseExchangeValues() {
  const swodnAmount = parseFloat(swodnInput.value);
  let calculatedAmount = 0;

  if (!isNaN(swodnAmount)) {
    if (selectedCurrencyValue === 'KAS') {
      calculatedAmount = isKasToSwodn
        ? Math.floor(swodnAmount / kasToSwodnRate)
        : Math.floor(swodnAmount / swodnToKasRate);
    } else if (selectedCurrencyValue === 'KSDOG') {
      calculatedAmount = isKasToSwodn
        ? swodnAmount * ksdogToSwodnBuyRate
        : swodnAmount * ksdogToSwodnSellRate;
    } else if (selectedCurrencyValue === 'KANGO') {
      calculatedAmount = isKasToSwodn
        ? swodnAmount * kangoToSwodnRate
        : swodnAmount / swodnToKangoRate;
    } else if (selectedCurrencyValue === 'NACHO') {
      calculatedAmount = isKasToSwodn
        ? swodnAmount * nachoToSwodnRate
        : swodnAmount / swodnToNachoRate;
    } else if (selectedCurrencyValue === 'USDC') {
      calculatedAmount = isKasToSwodn
        ? swodnAmount / usdcToSwodnRate 
        : swodnAmount / usdcToSwodnRate; 
    }

    // Ensure SWODN is an integer and enforce minimum and maximum limits
    const swodnAmountRounded = Math.floor(swodnAmount);
    if (swodnAmountRounded < minSnowdn) {
      swodnInput.value = 0;
      calculatedAmount = 0;
    } else if (swodnAmountRounded > maxSnowdn) {
      swodnInput.value = maxSnowdn;
      if (selectedCurrencyValue === 'KAS') {
        calculatedAmount = isKasToSwodn
          ? Math.floor(maxSnowdn / kasToSwodnRate)
          : Math.floor(maxSnowdn / swodnToKasRate);
      } else if (selectedCurrencyValue === 'KSDOG') {
        calculatedAmount = isKasToSwodn
          ? Math.floor(maxSnowdn * ksdogToSwodnBuyRate)
          : Math.floor(maxSnowdn * ksdogToSwodnSellRate);
      } else if (selectedCurrencyValue === 'KANGO') {
        calculatedAmount = isKasToSwodn
          ? Math.floor(maxSnowdn / kangoToSwodnRate)
          : Math.floor(maxSnowdn * swodnToKangoRate);
      } else if (selectedCurrencyValue === 'NACHO') {
        calculatedAmount = isKasToSwodn
          ? Math.floor(maxSnowdn / nachoToSwodnRate)
          : Math.floor(maxSnowdn * swodnToNachoRate);
      } else if (selectedCurrencyValue === 'USDC') {
        calculatedAmount = isKasToSwodn
          ? Math.floor(maxSnowdn / usdcToSwodnRate)
          : Math.floor(maxSnowdn / usdcToSwodnRate);
      }
    }

    sendInput.value = calculatedAmount.toFixed(2);
  } else {
    sendInput.value = '';
  }
}

// Toggle Buy/Sell Mode
toggleBtn.addEventListener('click', () => {
  isKasToSwodn = !isKasToSwodn;
  updateLabels();
  resetInputs();
});

// Currency Selection
selectedCurrency.addEventListener("click", () => {
  currencyList.style.display = currencyList.style.display === "block" ? "none" : "block";
});

currencyList.addEventListener("click", (e) => {
  if (e.target.tagName === "LI" || e.target.closest("LI")) {
    let selectedItem = e.target.closest("LI");
    selectedCurrencyValue = selectedItem.dataset.value;
    let currencyIcon = selectedItem.dataset.icon;

    selectedCurrency.innerHTML = `
      <img src="${currencyIcon}" alt="${selectedCurrencyValue} Logo" class="currency-logo" />
      <span>${selectedCurrencyValue}</span>
    `;

    currencyList.style.display = "none";
    updateLabels();
    resetInputs();
  }
});

document.addEventListener("click", (e) => {
  if (!selectedCurrency.contains(e.target) && !currencyList.contains(e.target)) {
    currencyList.style.display = "none";
  }
});

// Update Labels
function updateLabels() {
  sendLabel.textContent = isKasToSwodn ? `You Send (${selectedCurrencyValue}):` : `You Send (SNOWDN):`;
  getLabel.textContent = isKasToSwodn ? `You Get (SNOWDN):` : `You Get (${selectedCurrencyValue}):`;
}

// Reset Inputs
function resetInputs() {
  sendInput.value = '';
  swodnInput.value = '';
}

// Log Transactions
function logTransaction(action, currency, amount) {
  const timestamp = new Date().toLocaleString();
  const kaswareState = KaswareState.getInstance().getState();
  const logEntry = `Timestamp: ${timestamp}, Action: ${action}, Currency: ${currency}, Amount: ${amount}, Wallet: ${kaswareState.account}, Balance: ${kaswareState.balance}\n`;

  fetch('/log-transaction', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, currency, amount, timestamp, wallet: kaswareState.account, balance: kaswareState.balance }),
  })
  .then(response => response.text())
  .then(data => {
    console.log('Transaction logged:', data);
  })
  .catch((error) => {
    console.error('Error:', error);
  });
}

// Buy/Sell Buttons
buyBtn.addEventListener('click', () => {
  const amount = swodnInput.value;
  if (amount) {
    logTransaction('Buy', selectedCurrencyValue, amount);
  }
  alert('Redirecting to Treasury wallet page...');
  window.location.href = './buytreasury.html';
});

sellBtn.addEventListener('click', () => {
  const amount = swodnInput.value;
  if (amount) {
    logTransaction('Sell', selectedCurrencyValue, amount);
  }
  alert('Redirecting to Treasury wallet page...');
  window.location.href = './selltreasury.html';
});

// Initialize Labels
updateLabels();

// Initialize Kasware Wallet
document.addEventListener('DOMContentLoaded', () => {
  initKaswareButton();
  const kaswareState = KaswareState.getInstance();
  kaswareState.addEventListener("stateChanged", (event) => {
    const state = event.detail;
    if (state.isConnected) {
      console.log('Wallet connected:', state.account);
    } else {
      console.log('Wallet disconnected');
    }
  });
});