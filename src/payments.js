import React, { Component } from "react";

const xrpl = require('xrpl');


let client = new xrpl.Client("wss://s.altnet.rippletest.net:51233");
let store = new xrpl.Client("wss://s.altnet.rippletest.net:51233");
let clientWallet;
let storeWallet;

let setup = async () => {
    client.connect().then(() => {
        console.log('Creating funded wallet')
        client.fundWallet().then(wallet => {
            clientWallet = wallet.wallet;
            console.log('Funded wallet:', clientWallet);

            client.request({
                "command": "account_info",
                "account": clientWallet.address,
                "ledger_index": "validated"
            }).then(response => console.log(response))

        })
    })
    store.connect().then(() => {
        console.log('Creating store wallet')
        storeWallet = xrpl.Wallet.generate();
        console.log("Store wallet:", storeWallet);
    })
}

let pay = async (amount) => {
    console.log('Payment ', amount, ' drops are ', xrpl.xrpToDrops(amount));

    // Prepare transaction -------------------------------------------------------
    const prepared = await client.autofill({
        "TransactionType": "Payment",
        "Account": clientWallet.address,
        "Amount": xrpl.xrpToDrops(amount),
        "Destination": storeWallet.address,
    })
    const max_ledger = prepared.LastLedgerSequence
    console.log("Prepared transaction instructions:", prepared)
    console.log("Transaction cost:", xrpl.dropsToXrp(prepared.Fee), "XRP")
    console.log("Transaction expires after ledger:", max_ledger)

    // Sign prepared instructions ------------------------------------------------
    const signed = clientWallet.sign(prepared)
    console.log("Identifying hash:", signed.hash)
    console.log("Signed blob:", signed.tx_blob)

    client.submitAndWait(signed.tx_blob).then(res => {
        console.log("Transaction result:", res.result.meta.TransactionResult)
        // Get the balance of both client and store wallets
        client.request({
            "command": "account_info",
            "account": clientWallet.address,
            "ledger_index": "validated"
        }).then(response => console.log("Client balance: ", response.result.account_data.Balance))

        store.request({
            "command": "account_info",
            "account": storeWallet.address,
            "ledger_index": "validated"
        }).then(response => console.log("Store balance: ", response.result.account_data.Balance))
    })

}

export { setup, pay };