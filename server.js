'use strict'
/* Credentials of the account placing the order */

const INTERVAL = 1000;
const api = new RippleAPI({server: 'wss://s.altnet.rippletest.net:51233'});
/* Number of ledgers to check for valid transaction before failing */
const ledgerOffset = 5;
const myInstructions = {maxLedgerVersionOffset: ledgerOffset};


const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');

const RippleAPI = require('ripple-lib').RippleAPI;
const myAddr = 'TVDY5PVRPdafrc9ipjW5kzpXZfifzScivqXhVLbut9ACSuv';
const mySecret = 'ssU5afHWZ1eNfp35PmxvxsVFoKF9V';


const TEST_NET = 'wss://s.altnet.rippletest.net:51233';


app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));


/* Verify a transaction is in a validated XRP Ledger version */
function verifyTransaction(hash, options) {
  console.log('Verifying Transaction');
  return api.getTransaction(hash, options).then(data => {
    console.log('Final Result: ', data.outcome.result);
    console.log('Validated in Ledger: ', data.outcome.ledgerVersion);
    console.log('Sequence: ', data.sequence);
    return data.outcome.result === 'SUCCESS';
  }).catch(error => {
    /* If transaction not in latest validated ledger,
       try again until max ledger hit */
    if (error instanceof api.errors.PendingLedgerVersionError) {
      return new Promise((resolve, reject) => {
        setTimeout(() => verifyTransaction(hash, options)
        .then(resolve, reject), INTERVAL);
      });
    }
    return error;
  });
}



/* Function to prepare, sign, and submit a transaction to the XRP Ledger. */
function submitTransaction(lastClosedLedgerVersion, prepared, secret) {
  const signedData = api.sign(prepared.txJSON, secret);
  return api.submit(signedData.signedTransaction).then(data => {
    console.log('Tentative Result: ', data.resultCode);
    console.log('Tentative Message: ', data.resultMessage);
    /* The tentative result should be ignored. Transactions that succeed here can ultimately fail,
       and transactions that fail here can ultimately succeed. */

    /* Begin validation workflow */
    const options = {
      minLedgerVersion: lastClosedLedgerVersion,
      maxLedgerVersion: prepared.instructions.maxLedgerVersion
    };
    return new Promise((resolve, reject) => {
      setTimeout(() => verifyTransaction(signedData.id, options)
    .then(resolve, reject), INTERVAL);
    });
  });
}


function createOrder() {
	return {
	  'direction': 'buy',
	  'quantity': {
	    'currency': 'FOO',
	    'counterparty': 'T75UQWUrrXDekikbRcq6gM77GjTmqLrj6MoCk6yLHGRjXJ3',
	    'value': '100'
	  },
	  'totalPrice': {
	    'currency': 'XRP',
	    'value': '100'}
	};
}

app.get('/home', (req, res) => {
		res.sendFile(path.join(__dirname, 'views/SloHacksProject/index.html'));
});

app.get('/', (req, res) => {
	  res.sendFile(path.join(__dirname, 'views/SloHacksProject/current-balance.html'));
});

app.get('/getMoney', (req, res) => {
	  res.sendFile("https://myportal.calpoly.edu");
});

const server = app.listen(8080, () => {
	  const host = server.address().address;
	  const port = server.address().port;

	  console.log(`Example app listening at http://${host}:${port}`);
});

app.get('/transfer', (req, res) => {
		api.connect().then(() => {
		  console.log('Connected');
		  var myOrder = createOrder();
		  return api.prepareOrder(myAddr, myOrder, myInstructions);
		}).then(prepared => {
		  console.log('Order Prepared');
		  return api.getLedger().then(ledger => {
		    console.log('Current Ledger', ledger.ledgerVersion);
		    return submitTransaction(ledger.ledgerVersion, prepared, mySecret);
		  });
		}).then(() => {
		  api.disconnect().then(() => {
		    console.log('api disconnected');
		    process.exit();
		  });
		}).catch(console.error);
});
