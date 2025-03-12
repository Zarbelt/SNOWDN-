document.addEventListener('DOMContentLoaded', () => {
  const supabase = window.supabase.createClient(
    'https://idtajnzyikcrqqyeephb.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkdGFqbnp5aWtjcnFxeWVlcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwNzExODEsImV4cCI6MjA1NjY0NzE4MX0.dmdooctqxdRcA3DkKXHo8T2jE69AFUpccrgpm7V73lI'
  );
  window.supabaseClient = supabase;
});

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
const mmediaToSwodnRate = 5; 
const swodnToMmediaRate = 5; 
const ghoadToSwodnRate = 100; 
const swodnToGhoadRate = 300; 
const minSwodnForUsdc = 500;

const sendInput = document.getElementById('send-amount');
const swodnInput = document.getElementById('swodn-amount');
const buyBtn = document.getElementById('buy-btn');
const sellBtn = document.getElementById('sell-btn');
const toggleBtn = document.getElementById('toggle-btn');
const sendLabel = document.getElementById('send-label');
const getLabel = document.getElementById('get-label');
const selectedCurrency = document.getElementById("selected-currency");
const currencyList = document.getElementById("currency-list");
const connectBtn = document.getElementById('connect-kasware-btn');
const kaswareConnectDiv = document.getElementById('kasware-connect');

let isKasToSwodn = true;
let selectedCurrencyValue = 'KAS';
const maxSnowdn = 1000;
const minSnowdn = 10;
const minKsdogBuy = 100000;

class KaswareState extends EventTarget {
  constructor() {
    super();
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
    } else {
      this.setState({ error: "Kasware wallet not detected" });
    }
  }

  async connectWallet() {
    if (!window.kasware) {
      alert("Please install Kasware Wallet extension");
      return;
    }

    this.setState({ isLoading: true, error: null });
    try {
      const accounts = await window.kasware.requestAccounts();
      if (accounts.length > 0) {
        this.setState({
          account: accounts[0],
          isConnected: true,
          isLoading: false,
        });
        await this.refreshBalances();
        kaswareConnectDiv.style.display = 'none';
        // Update button text with shortened address
        connectBtn.textContent = `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`;
      }
    } catch (error) {
      this.setState({ 
        error: error.message || "Failed to connect wallet", 
        isLoading: false 
      });
      throw error;
    }
  }

  async refreshBalances() {
    if (this.state.account) {
      try {
        const [balance, krc20Balances] = await Promise.all([
          window.kasware.getBalance(),
          window.kasware.getKRC20Balance()
        ]);
        this.setState({ balance, krc20Balances });
      } catch (error) {
        this.setState({ error: "Failed to fetch balances" });
        throw error;
      }
    }
  }

  async sendTransaction(toAddress, amount) {
    try {
      const txid = await window.kasware.sendKaspa(toAddress, amount);
      return txid;
    } catch (error) {
      this.setState({ error: "Transaction failed" });
      throw error;
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
      connectBtn.textContent = "Connect Kasware Wallet";
      kaswareConnectDiv.style.display = 'block';
    } else {
      this.setState({ account: accounts[0], isConnected: true });
      connectBtn.textContent = `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`;
      kaswareConnectDiv.style.display = 'none';
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
    connectBtn.textContent = "Connect Kasware Wallet";
    kaswareConnectDiv.style.display = 'block';
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.dispatchEvent(new CustomEvent("stateChanged", { detail: this.state }));
  }

  getState() {
    return { ...this.state };
  }
}

sendInput.addEventListener('input', () => {
  updateExchangeValues();
});

swodnInput.addEventListener('input', () => {
  updateReverseExchangeValues();
});

connectBtn.addEventListener('click', async () => {
  const kaswareState = KaswareState.getInstance();
  try {
    await kaswareState.connectWallet();
  } catch (error) {
    console.error('Connection failed:', error);
  }
});

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
        ? sendAmount * usdcToSwodnRate
        : sendAmount / usdcToSwodnRate;
    } else if (selectedCurrencyValue === 'MMEDIA') {
      calculatedAmount = isKasToSwodn
        ? sendAmount * mmediaToSwodnRate 
        : sendAmount / swodnToMmediaRate; 
    } else if (selectedCurrencyValue === 'GHOAD') {
      calculatedAmount = isKasToSwodn
        ? sendAmount / ghoadToSwodnRate
        : sendAmount * swodnToGhoadRate;
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
        sendInput.value = Math.floor(maxSnowdn / usdcToSwodnRate);
      } else if (selectedCurrencyValue === 'MMEDIA') {
        sendInput.value = Math.floor(maxSnowdn / mmediaToSwodnRate);
      } else if (selectedCurrencyValue === 'GHOAD') {
        sendInput.value = Math.floor(maxSnowdn * ghoadToSwodnRate);
      }
    }

    swodnInput.value = calculatedAmount;
  } else {
    swodnInput.value = '';
  }
}

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
        : swodnAmount * swodnToUsdcRate;
    } else if (selectedCurrencyValue === 'MMEDIA') {
      calculatedAmount = isKasToSwodn
        ? swodnAmount / mmediaToSwodnRate 
        : swodnAmount * swodnToMmediaRate; 
    } else if (selectedCurrencyValue === 'GHOAD') {
      calculatedAmount = isKasToSwodn
        ? swodnAmount * ghoadToSwodnRate 
        : swodnAmount * swodnToGhoadRate; 
    }

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
          ? Math.floor(maxSnowdn * kangoToSwodnRate)
          : Math.floor(maxSnowdn / swodnToKangoRate);
      } else if (selectedCurrencyValue === 'NACHO') {
        calculatedAmount = isKasToSwodn
          ? Math.floor(maxSnowdn * nachoToSwodnRate)
          : Math.floor(maxSnowdn / swodnToNachoRate);
      } else if (selectedCurrencyValue === 'USDC') {
        calculatedAmount = isKasToSwodn
          ? Math.floor(maxSnowdn / usdcToSwodnRate)
          : Math.floor(maxSnowdn * swodnToUsdcRate);
      } else if (selectedCurrencyValue === 'MMEDIA') {
        calculatedAmount = isKasToSwodn
          ? Math.floor(maxSnowdn / mmediaToSwodnRate)
          : Math.floor(maxSnowdn * swodnToMmediaRate);
      } else if (selectedCurrencyValue === 'GHOAD') {
        calculatedAmount = isKasToSwodn
          ? Math.floor(maxSnowdn * ghoadToSwodnRate)
          : Math.floor(maxSnowdn * swodnToGhoadRate);
      }
    }

    sendInput.value = calculatedAmount.toFixed(2);
  } else {
    sendInput.value = '';
  }
}

toggleBtn.addEventListener('click', () => {
  isKasToSwodn = !isKasToSwodn;
  updateLabels();
  resetInputs();
});

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

function updateLabels() {
  sendLabel.textContent = isKasToSwodn ? `You Send (${selectedCurrencyValue}):` : `You Send (SNOWDN):`;
  getLabel.textContent = isKasToSwodn ? `You Get (SNOWDN):` : `You Get (${selectedCurrencyValue}):`;
}

function resetInputs() {
  sendInput.value = '';
  swodnInput.value = '';
}

async function logTransactionToSupabase(action, currency, amount, txid = null) {
  const kaswareState = KaswareState.getInstance().getState();
  const sendAmount = parseFloat(sendInput.value);
  const convertedAmount = parseFloat(swodnInput.value);
  let rate;
  let sourceCurrency;
  let convertCurrency;

  if (isKasToSwodn) {
    sourceCurrency = selectedCurrencyValue;
    convertCurrency = 'SNOWDN';
  } else {
    sourceCurrency = 'SNOWDN';
    convertCurrency = selectedCurrencyValue;
  }

  if (selectedCurrencyValue === 'KAS') {
    rate = isKasToSwodn ? kasToSwodnRate : swodnToKasRate;
  } else if (selectedCurrencyValue === 'KSDOG') {
    rate = isKasToSwodn ? ksdogToSwodnBuyRate : ksdogToSwodnSellRate;
  } else if (selectedCurrencyValue === 'KANGO') {
    rate = isKasToSwodn ? kangoToSwodnRate : swodnToKangoRate;
  } else if (selectedCurrencyValue === 'NACHO') {
    rate = isKasToSwodn ? nachoToSwodnRate : swodnToNachoRate;
  } else if (selectedCurrencyValue === 'USDC') {
    rate = isKasToSwodn ? usdcToSwodnRate : swodnToUsdcRate;
  } else if (selectedCurrencyValue === 'MMEDIA') {
    rate = isKasToSwodn ? mmediaToSwodnRate : swodnToMmediaRate;
  } else if (selectedCurrencyValue === 'GHOAD') {
    rate = isKasToSwodn ? ghoadToSwodnRate : swodnToGhoadRate;
  }

  const transactionData = {
    action,
    source_currency: sourceCurrency,
    amount: sendAmount,
    converted_amount: convertedAmount,
    rate,
    wallet_address: kaswareState.account || 'N/A',
    convert_currency: convertCurrency,
    transaction_id: txid,
    created_at: new Date().toISOString()
  };

  // For manual transactions, store in localStorage
  if (!txid) {
    console.log('Logging manual transaction:', transactionData);
    localStorage.setItem('pendingTransaction', JSON.stringify(transactionData));
  } 
  // For automatic transactions, store directly in Supabase
  else {
    const { error } = await window.supabaseClient
      .from('transactions')
      .insert([transactionData]);
    
    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }
    console.log('Transaction recorded in Supabase:', transactionData);
  }
}

async function handleTransaction(action) {
  const kaswareState = KaswareState.getInstance();
  const state = kaswareState.getState();
  
  if (!state.isConnected) {
    alert("Please connect Kasware wallet first");
    return;
  }

  const sendAmount = parseFloat(sendInput.value);
  const convertedAmount = parseFloat(swodnInput.value);
  
  if (!sendAmount || !convertedAmount) {
    alert("Please enter valid amounts");
    return;
  }

  const paymentMethod = confirm("Would you like to pay automatically?\nPress OK for automatic payment or Cancel for manual payment");
  const treasuryAddress = "kaspa:qyp60g7z60kk77vrjm2muz5knlex9uxlp88r2sznwsl30mxzrxwp2cglt7f5czn";

  if (paymentMethod) { 
    try {
      let txid;
      if (action === 'Buy' && isKasToSwodn && selectedCurrencyValue === 'KAS') {
        const amountInSompi = Math.floor(sendAmount * 100000000);
        txid = await kaswareState.sendTransaction(treasuryAddress, amountInSompi);
      }
      
      if (txid) {
        await logTransactionToSupabase(action, selectedCurrencyValue, convertedAmount, txid);
        return txid;
      }
    } catch (error) {
      console.error(`${action} failed:`, error);
      throw error;
    }
  } else { // Manual payment
    await logTransactionToSupabase(action, selectedCurrencyValue, convertedAmount);
    return null;
  }
}

buyBtn.addEventListener('click', async () => {
  try {
    const txid = await handleTransaction('Buy');
    if (txid) {
      alert(`Automatic transaction successful! TXID: ${txid}`);
    }
    window.location.href = './buytreasury.html';
  } catch (error) {
    alert('Transaction failed. Please try again.');
  }
});

sellBtn.addEventListener('click', async () => {
  try {
    const txid = await handleTransaction('Sell');
    if (txid) {
      alert(`Automatic transaction successful! TXID: ${txid}`);
    }
    window.location.href = './selltreasury.html';
  } catch (error) {
    alert('Transaction failed. Please try again.');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const kaswareState = KaswareState.getInstance();
  
  if (!window.kasware || !kaswareState.getState().isConnected) {
    kaswareConnectDiv.style.display = 'block';
  }

  kaswareState.addEventListener("stateChanged", (event) => {
    const state = event.detail;
    console.log('Wallet state changed:', state);
    if (state.isConnected) {
      console.log('Wallet connected:', state.account);
      console.log('Balance:', state.balance);
    }
  });

  updateLabels();
});