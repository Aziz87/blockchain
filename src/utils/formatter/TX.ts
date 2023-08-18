import { BigNumberish, providers } from "ethers";
import { Blockchain, NET } from "src/blockchain";
import { fromHex } from "./format-tx-tron";
import TronDecoder from "../../tron/tron-decoder";
import { BlockTransaction } from "../../tron/interfaces";
import { formatLog } from "./format-logs";
import { MethodCode } from "./method-code.enum";
import { Method } from "./method.enum";


export class TX {
    public router: Lowercase<string>;
    public from: Lowercase<string>;
    public to: Lowercase<string>;
    public path: Lowercase<string>[];
    public amountIn: BigNumberish;
    public amountOut: BigNumberish;
    public liquidity: BigNumberish;
    public hash: string;
    public error: string;
    public method: Method;
    public needDecode:boolean = false;
    public static methods = Method;
    public static methodsCodes = MethodCode;
    public additionalTxs:TX[]=[];
    public logs:TX[]=[];
    public originalTransaction : providers.TransactionResponse | BlockTransaction | providers.Log;
    public params:any = {}


    public async parseLogs(net:NET, bc:Blockchain):Promise<TX>{
        if(this.logs.length)return this;
        const receipt = await bc.getTransactionReceipt(net, this.hash) as providers.TransactionReceipt;
        this.logs = receipt.logs.map(log=>formatLog(log))
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