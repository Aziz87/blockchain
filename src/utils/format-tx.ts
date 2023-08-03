import { BigNumber, BigNumberish,Contract,constants,utils,providers } from "ethers"
import * as TronWeb from "tronweb";
import { Symbol, NET, SwapRouterVersion } from "../nets/net.i";
import { BlockTransaction } from "../tron/interfaces";
import  {TransactionResponse, Log} from "@ethersproject/abstract-provider"
const {AbiCoder, Interface} = utils;
import erc20 from "../abi/erc20";
import abiPancakePair from "../abi/pancake-pair"
import wrappedETH from "../abi/weth"
import abiPancakeRouterV2 from "../abi/pancake-router-v2"
import abiPancakeRouterV3 from "../abi/pancake-router-v3"
import abiMetamaskSwapRouter from "../abi/metamask-swap-router"
import TronDecoder from "../tron/tron-decoder";
import { Blockchain } from "../blockchain";
import nets from "../nets/net";


const TransferTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
const ApprovalTopic = "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925"
const WithdrawWETHTopic = "0x7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65"
const DepositWETHTopic = "0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c"

const face = {
    pancakePair : new Interface(abiPancakePair),
    pancakeRouterV2 : new Interface(abiPancakeRouterV2),
    pancakeRouterV3 : new Interface(abiPancakeRouterV3),
    erc20: new Interface(erc20),
    weth: new Interface(wrappedETH),
    metamaskSwapRouter: new Interface(abiMetamaskSwapRouter)
}
 
export function fromHex(hexAddress: string): string {
    return TronWeb.address.fromHex(hexAddress);
}

enum Method {
    transfer = "transfer",
    withdrawWETH = "withdraw",
    depositWETH = "deposit",
    transferFrom = "transferFrom",
    addLiquidityETH = "addLiquidityETH",
    stake = "stake",
    swap = "swap",
    approve = "approve",
    swapExactTokensForTokens = "swapExactTokensForTokens",
    swapTokensForExactTokens = "swapTokensForExactTokens",
    swapExactETHForTokens = "swapExactETHForTokens",
    swapExactTokensForETH = "swapExactTokensForETH",
    swapETHForExactTokens = "swapETHForExactTokens",
    swapTokensForExactETH = "swapTokensForExactETH",
    swapExactTokensForETHSupportingFeeOnTransferTokens = "swapExactTokensForETHSupportingFeeOnTransferTokens",
    swapExactETHForTokensSupportingFeeOnTransferTokens = "swapExactETHForTokensSupportingFeeOnTransferTokens",
    multicall = "multicall",
}

enum MethodCode {
    swap = "0x5f575529",
    transfer = "0xa9059cbb",
    transferFrom = "0x23b872dd",
    addLiquidityETH = "0xf305d719",
    stake = "0x952e68cf",
    approve = "0x095ea7b3",
    swapExactTokensForTokens = "0x38ed1739",
    swapTokensForExactTokens = "0x8803dbee",
    swapExactETHForTokens = "0x7ff36ab5",
    swapTokensForExactETH = "0x4a25d94a",
    swapExactTokensForETH = "0x18cbafe5",
    swapETHForExactTokens = "0xfb3bdb41",
    swapExactTokensForETHSupportingFeeOnTransferTokens = "0x791ac947",
    swapExactETHForTokensSupportingFeeOnTransferTokens = "0xb6f9de95",
    swapTokensForExactTokens_v3 = "0x42712a67",
    swapExactTokensForTokens_v3 = "0x472b43f3",
    multicall_v3_1 = "0x5ae401dc",
    multicall_v3_2 = "0xac9650d8",
    multicall_v3_3 = "0x1f0464d1",
}


 

// @ts-ignore
const methodsNames = Object.assign(...Object.keys(MethodCode).map(key => ({ [MethodCode[key]]: key })))

/**
 * Декодирует заголовки метода контракта
 * */
export function decodeParams(output, types = ["address", "uint256"], ignoreMethodHash = true) {
    if (!output || typeof output === "boolean") {
        ignoreMethodHash = output;
        output = types;
    }
    if (ignoreMethodHash && output.replace(/^0x/, "").length % 64 === 8)
        output = "0x" + output.replace(/^0x/, "").substring(8);

    const abiCoder = new AbiCoder();
    if (output.replace(/^0x/, "").length % 64){
        throw new Error(" The encoded string is not valid. Its length must be a multiple of 64.");
    }
   try {
        return abiCoder.decode(types, output).reduce((obj, arg, index) => {
            if (types[index] == "address")
                arg = 41 + arg.substr(2).toLowerCase();
            obj.push(arg);
            return obj;
        }, []);
    } catch (e) {
        //Logger.error("Ошибка в utils.service decodeParams")
        return [null, 0]
    }
}

export class TX {
    public router: Lowercase<string>;
    public from: Lowercase<string>;
    public to: Lowercase<string>;
    public path: Lowercase<string>[];
    public amountIn: BigNumberish;
    public amountOut: BigNumberish;
    public hash: string;
    public error: string;
    public method: Method;
    public needDecode:boolean = false;
    public static methods = Method;
    public static methodsCodes = MethodCode;
    public additionalTxs:TX[]=[];
    public logs:TX[]=[];
    public originalTransaction : TransactionResponse | BlockTransaction | Log;


    async parseLogs(net:NET, bc:Blockchain):Promise<TX>{

        if(this.logs.length)return this;
        const receipt = await bc.getTransactionReceipt(net, this.hash) as providers.TransactionReceipt;
        this.logs = receipt.logs.map(log=>formatLog(log))
        const specialLog = this.logs.find(log=>log.from===this.from && log.to===this.to && this.method===log.method);
        if(specialLog){
            this.amountIn=specialLog.amountIn;
            this.amountOut=specialLog.amountOut;
        }
        return this;
    }


    public decode = async function(net:NET, bc:Blockchain):Promise<TX>{
        if(!this.needDecode) return this;
        const decoder = new TronDecoder(net, bc)
        const decoded = await decoder.decodeInput(this.originalTransaction);

        const _amountIn = decoded.inputNames.indexOf("amountIn");
        const _amountInMax = decoded.inputNames.indexOf("amountInMax");
        const _amountOut = decoded.inputNames.indexOf("amountOut");
        const _amountOutMin = decoded.inputNames.indexOf("amountOutMin");
        const _to = decoded.inputNames.indexOf("to");
        const _path = decoded.inputNames.indexOf("path");

        this.amountIn = _amountIn>-1 ? decoded.decodedInput[_amountIn] : _amountInMax>-1 ? decoded.decodedInput[_amountInMax] :0;
        this.amountOut = _amountOut>-1 ? decoded.decodedInput[_amountOut] : _amountOutMin>-1 ? decoded.decodedInput[_amountOutMin] : 0;
        this.path = _path>-1 ? decoded.decodedInput[_path].map(x=>fromHex(x).toLowerCase() as Lowercase<string>) : []
        this.to = _to>-1 ? fromHex(decoded.decodedInput[_to]).toLowerCase() as Lowercase<string> : ""
        return this;
    }
}

const uniswapV3RoutersAddresses = nets.map(x=>x.swapRouters.filter(x=>x.version===SwapRouterVersion.UNISWAP_V3)).reduce((a,b)=>[...a,...b],[]).map(x=>x.address);
const metamaskRoutersAddresses = nets.map(x=>x.swapRouters.filter(x=>x.version===SwapRouterVersion.METAMASK_SWAP)).reduce((a,b)=>[...a,...b],[]).map(x=>x.address);

export function formatEth(transaction: TransactionResponse): TX {
    let tx = new TX();
    tx.originalTransaction = transaction;
    tx.hash = transaction.hash;
    tx.from = transaction.from.toLowerCase() as Lowercase<string>;
    tx.amountIn = transaction?.value || 0;
    if(transaction.to) tx.to=transaction.to.toLowerCase() as Lowercase<string>;


    let routerFace = face.pancakeRouterV2;
    if(transaction.to && uniswapV3RoutersAddresses.includes(transaction.to.toLowerCase() as Lowercase<string>)){
        routerFace = face.pancakeRouterV3;
    }
    if(transaction.to && metamaskRoutersAddresses.includes(transaction.to.toLowerCase() as Lowercase<string>)){
        routerFace = face.metamaskSwapRouter;
    }

    try {
        if (transaction.data) {
            if (transaction.data === "0x") {
                tx.to = transaction.to.toLowerCase() as Lowercase<string>;
                tx.amountIn = transaction.value;
                tx.amountOut = transaction.value;
                tx.path = []
            } else {
                tx.path = [];
                const methodCode = transaction.data.substring(0, 10);
                tx.method = methodsNames[methodCode].split("_")[0] || methodCode;
                if (methodCode === MethodCode.transfer) {
                    const [hexAddress, value] = decodeParams(transaction.data);
                    tx.to = "0x" + hexAddress.substr(2).toLowerCase() as Lowercase<string>
                    tx.amountIn = value;
                    tx.amountOut = value;
                    tx.path = [transaction.to.toLowerCase() as Lowercase<string>]
                } else if (methodCode === MethodCode.transferFrom) {
                    const [sender, recipient, value] = decodeParams(transaction.data);
                    tx.from = "0x" + sender.substr(2).toLowerCase() as Lowercase<string>
                    tx.to = "0x" + recipient.substr(2).toLowerCase() as Lowercase<string>
                    tx.amountIn = value;
                    tx.amountOut = value;
                    tx.path = [transaction.to.toLowerCase() as Lowercase<string>]
                } else if (methodCode === MethodCode.addLiquidityETH) {
                    const [token, amountTokenDesired, amountTokenMin, amountETHMin, to, deadline] = decodeParams(transaction.data);
                    tx.to = "0x" + to.substr(2).toLowerCase() as Lowercase<string>
                    tx.path = ["0x" + token.substr(2).toLowerCase() as Lowercase<string>]
                    tx.amountIn = amountETHMin;
                    tx.amountOut = amountETHMin;
                } else if ([
                    MethodCode.swapExactETHForTokensSupportingFeeOnTransferTokens+'',
                    MethodCode.swapExactTokensForETHSupportingFeeOnTransferTokens+'',
                    MethodCode.swapExactTokensForETH+'',
                    MethodCode.swapExactETHForTokens+'',
                    MethodCode.swapTokensForExactTokens+'',
                    MethodCode.swapExactTokensForTokens+'',
                    MethodCode.swapETHForExactTokens+'',
                    MethodCode.swapExactTokensForTokens_v3,
                    MethodCode.swapTokensForExactTokens_v3,
                ].includes(methodCode)) {
                    tx.router = transaction.to.toLowerCase() as Lowercase<string>;
                    const res = routerFace.parseTransaction(transaction)
                    tx.amountIn = res.args.amountIn || res.args.amountInMax || transaction.value;
                    tx.amountOut = res.args.amountOutMin || res.args.amountOut;
                    tx.path = res.args.path.map(x=>x.toLowerCase());
                    tx.to = res.args.to.toLowerCase();
                } else if ([
                    MethodCode.multicall_v3_1+'',
                    MethodCode.multicall_v3_2+'',
                    MethodCode.multicall_v3_3+'',
                ].includes(methodCode)) {
                    const res:any = routerFace.parseTransaction(transaction)
                    transaction.data=res.args.data[0]
                    tx = formatEth(transaction)
                    for(let i=1;i<res.args.data.length;i++){
                        transaction.data=res.args.data[i]
                        tx.additionalTxs.push(formatEth(transaction));
                    }                    
                } else if (methodCode === MethodCode.stake) {
                    const [token, amountTokenDesired, amountTokenMin, amountETHMin, to, deadline] = decodeParams(transaction.data);
                    tx.to = "0x" + to.substr(2).toLowerCase() as Lowercase<string>
                    tx.path = ["0x" + token.substr(2).toLowerCase() as Lowercase<string>]
                    tx.amountIn = amountETHMin;
                } else if (methodCode === MethodCode.swap) {
                    const res:any = routerFace.parseTransaction(transaction)
                    tx.amountIn = res.args.amount;
                    tx.amountOut = BigNumber.from("0x"+res.args.data.substring(216,258));
                    let tokenOut = "0x"+res.args.data.substring(90,130).toLowerCase();
                    if(tokenOut.substring(0,20)==="0x000000000000000000") tokenOut = constants.AddressZero;
                    tx.path=[res.args.tokenFrom.toLowerCase(),tokenOut]
                    tx.router = transaction.to.toLowerCase() as Lowercase<string>;
                    tx.to = tx.from;
                    tx.method = res.args.tokenFrom===constants.AddressZero ? Method.swapExactETHForTokens :tokenOut===constants.AddressZero ? Method.swapExactTokensForETH : Method.swapExactTokensForTokens;
                }
            }
        }
    } catch (e) {
        tx.error = "" + e?.message;
    }
    return tx;

}

 
export function parseDataAddresses(net:NET, transaction:BlockTransaction | TransactionResponse){

    if(net.symbol===Symbol.TRX){
        return (transaction as BlockTransaction).raw_data_hex.substring(10).match(/.{1,64}/g).filter(x=>x.substring(20,30)!=="0000000000").map(x=>fromHex("0x"+x.substring(24,64))) as Lowercase<string>[]
    }else{
        return (transaction as TransactionResponse).data.substring(10).match(/.{1,64}/g).filter(x=>x.substring(20,30)!=="0000000000").map(x=>"0x"+x.substring(24,64)) as Lowercase<string>[]

    }
}


export function formatLog(log:Log):TX{
    const tx = new TX();
    tx.originalTransaction = log;
    tx.hash = log.transactionHash;
    tx.path = [log.address.toLowerCase() as Lowercase<string>];
    if(log.topics[0]===TransferTopic){
        const d = face.erc20.decodeEventLog("Transfer", log.data, log.topics)
        tx.from = d.from;
        tx.to=d.to;
        tx.method=Method.transfer;
        tx.amountIn=tx.amountOut=d.value;
    }else 
    if(log.topics[0]===ApprovalTopic){
        const d = face.erc20.decodeEventLog("Approval", log.data, log.topics)
        tx.from = d.owner;
        tx.to=d.spender;
        tx.amountIn=tx.amountOut=d.value;
        tx.method=Method.approve;
    }else 
    if(log.topics[0]===DepositWETHTopic){
        const d = face.weth.decodeEventLog("Deposit", log.data, log.topics)
        tx.from = d.dst;
        tx.to = d.dst;
        tx.amountIn=tx.amountOut=d.wad;
        tx.method=Method.depositWETH;
    }else 
    if(log.topics[0]===WithdrawWETHTopic){
        const d = face.weth.decodeEventLog("Withdrawal", log.data, log.topics)
        tx.from = d.src;
        tx.to = d.src;
        tx.amountIn=tx.amountOut=d.wad;
        tx.method=Method.withdrawWETH;
    }else tx.error=`Cannot decode log topic ${log.topics[0]}`


    return tx;

}


export function formatTron(transaction:BlockTransaction):TX{

   
    const tronTx = new TX();
    tronTx.hash = transaction.txID;

    tronTx.originalTransaction = transaction;

    try {
        if (transaction.raw_data?.contract) {
            const contract = transaction.raw_data.contract[0];
            if (contract.type === "TransferContract") {
                tronTx.from = fromHex(contract.parameter?.value?.owner_address).toLowerCase() as Lowercase<string>
                tronTx.to = fromHex(contract.parameter?.value?.to_address).toLowerCase() as Lowercase<string>
                tronTx.amountIn = contract.parameter?.value?.amount;
            } else if (contract.type === "TriggerSmartContract") {
                const data = "0x" + contract.parameter?.value?.data;
                const {owner_address, contract_address} = transaction.raw_data.contract[0].parameter.value;
                tronTx.from = fromHex(owner_address).toLowerCase() as Lowercase<string>
                tronTx.path = [fromHex(contract_address).toLowerCase() as Lowercase<string>]
                const methodCode = data.substring(0, 10);

                tronTx.method = methodsNames[methodCode].split("_")[0] || methodCode;
                const arr = data.split("");
                arr.splice(0, 10).join(""); //method 
                
                if (methodCode === MethodCode.transfer) {
                    arr.splice(0, 24); // 000000000000000000000000
                    const to = fromHex("0x" + arr.splice(0, 40).join(""))
                    const amount = Number("0x" + arr.join(""))
                    tronTx.to = to.toLowerCase() as Lowercase<string>
                    tronTx.amountIn = amount;
                    tronTx.amountOut = amount;
                } else if (methodCode === MethodCode.transferFrom) {
                    arr.splice(0, 24); // 000000000000000000000000
                    const from = fromHex("0x" + arr.splice(0, 40).join(""))
                    arr.splice(0, 24); // 000000000000000000000000
                    const to = fromHex("0x" + arr.splice(0, 40).join(""))
                    const amount = Number("0x" + arr.join(""))
                    tronTx.from = from.toLowerCase() as Lowercase<string>
                    tronTx.to = to.toLowerCase() as Lowercase<string>
                    tronTx.amountIn = amount;
                    tronTx.amountOut = amount;
                } else if (methodCode === MethodCode.approve) {
                    arr.splice(0, 24); // 000000000000000000000000
                    const to = fromHex("0x" + arr.splice(0, 40).join(""))
                    arr.splice(0, 24); // 000000000000000000000000
                    const amount = Number("0x" + arr.join(""))
                    tronTx.to = to.toLowerCase() as Lowercase<string>
                    tronTx.amountIn = amount;
                    tronTx.amountOut = amount;
                } else if ([
                    MethodCode.swapExactETHForTokensSupportingFeeOnTransferTokens+'',
                    MethodCode.swapExactTokensForETHSupportingFeeOnTransferTokens+'',
                    MethodCode.swapExactTokensForETH+'',
                    MethodCode.swapExactETHForTokens+'',
                    MethodCode.swapTokensForExactTokens+'',
                    MethodCode.swapExactTokensForTokens+''
                ].includes(methodCode)) {
                    tronTx.router = fromHex(contract_address).toLowerCase() as Lowercase<string>;
                    tronTx.needDecode = true;
                }
                
                else tronTx.error = "unknown data " + data
            } else tronTx.error = "unknown contract.type " + contract.type
        } else tronTx.error = "No tronTransaction.raw_data?.contract"
    
        return tronTx;
    } catch (e) {
        console.error(e)
    }
}
