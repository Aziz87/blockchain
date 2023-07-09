

const dotenv = require("dotenv");
dotenv.config({ path: "../.env" })


import { fromHex } from "../src/tron/tron-methods";
import { Blockchain, NetworkName } from "../src/blockchain";
import { CurrencySymbol } from "../src/blockchain";
import { ZeroAddress } from "ethers";
import nets from "../src/nets/net";
console.log(process.env.TRONGRID_APIKEY)

const bc = new Blockchain();


(async () => {

    bc.getBalances(1000, [
        "TToXewisPGQdu2Cwa8kE45Ds7pgwGD9BNP",
        "TFAvYTWbBEhhdh4xKQPbWXjyCNVzj77LHx",
        "TMAb3SnnLeBULZauB3WYxcCJyEUfhNRwYt",
        "TAiWLYJkwmdbKqtunEPv6DQjAyC8Uuetpg",
        "TXaHQNTtVGkq9Gq8UbY11MtdF1sWUy9PPY",
        "TPmcEn83PuWQiRFxZF3zfAWZ6UM75vSEwV",
        "TRDfTBrCqRp3B7sbkeT5jUcwx2kuuae3yy",
        "TPbTBdRcC5Jek52xHPPG25hBp84Q2uVWgC",
        "TYYpWRFgLC5PWMZrCNc95DgF4HxKHEbPuR",
        "TTsWxBMj9uZ2fPLuc4toyHnqTtwkcHjCng",
        "TRJKmPmJNGDeNGtACc2BL1Ywzf5WNkrGch",
        "TToXewisPGQdu2Cwa8kE45Ds7pgwGD9BNP",
        "TA3rahHQrFz8ewyDpSzefRzt2v84jME7h3",
        "TSDJvd8M8YvjApTLaztu98C5vPVhx2aTj6",
        "TTvFzyGhPSSHupLQQTYsm4tgb81pZn2KTX",
        "TFfpSc3Mi5Lj1kFMH5TjwsaXNC7FCkR4wu",
        "TN2Nct2TgBRmobEYHxnmN5DQiV238eABq1",
        "TJ7kFyiRYM7qNQkW7KDw6wfXgLmFGC9J8J",
        "TXj1rgp4fr18TWg5hTN9aeNVsydgNL2cVN",
        "TRbMz3ebgfaA3QwzBQ5FLvk2WgWLapUDXy",
    ], [{ address: fromHex(ZeroAddress), symbol: CurrencySymbol.TRX, decimals: 6 }, nets.find(x => x.id === 1000).tokens[0]]).then(balances => console.log(balances))
    await new Promise(r => setTimeout(r, 100000))
})()
