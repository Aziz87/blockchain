import { SwapRouterVersion } from "../../nets/net.i";
import { NET } from "../../blockchain";
import { TransactionDescription } from "ethers/lib/utils";
import { BigNumber,ethers } from "ethers";
import erc20 from '../../abi/erc20';


export interface Descriped {
    response:ethers.providers.TransactionResponse
    description:TransactionDescription
}


 /**
     * Парсим транзакции 
     */
 export function descriptor(net: NET, responses: ethers.providers.TransactionResponse[]):Descriped[] {
    const results = [];
    for(let response of responses){
        const router = net.swapRouters.find(x => x.address === response?.to?.toLowerCase());

        if(!response.to && response.data.length>2000)  {
            results.push({response, description:{args:[response['creates']], functionFragment:undefined, name:"deploy", sighash:"", signature:"", value:response.value}});
            continue;
        }
        
        try {
            const face = response.data==="0x" ? undefined : router ? new ethers.Contract(response.to, router.abi).interface : new ethers.Contract(response.to, erc20).interface;
            function parse(response:ethers.providers.TransactionResponse): Descriped[] {
                let description = response?.data==="0x"
                ? {args:[], functionFragment:undefined, name:"sendETH", signature:"send(address, uint256)", sighash:"0x", value:response.value } as TransactionDescription
                : {...face?.parseTransaction(response), functionFragment:undefined}
                
                if (description && router?.version === SwapRouterVersion.METAMASK_SWAP && description.name === "swap") {
                
                    const amountOut = BigNumber.from("0x"+description.args.data.substring(216,258));
                    let tokenOut = "0x"+description.args.data.substring(90,130).toLowerCase();
                    const amountIn = description.args.amount;
                    const tokenIn = description.args.tokenFrom;
                    if(tokenOut.substring(0,20)==="0x000000000000000000") tokenOut = ethers.constants.AddressZero;
                    let path=[description.args.tokenFrom.toLowerCase(),tokenOut]
                    // const method = description.args.tokenFrom===constants.AddressZero ? "swapExactETHForTokens" :tokenOut===constants.AddressZero ? "swapExactTokensForETH" : "swapExactTokensForTokens";

                    const args:any = [];
                    args.amountIn=amountIn;
                    args.amountOut=amountOut;
                    args.tokenIn=tokenIn;
                    args.tokenOut=tokenOut;
                    args.path=path;
                    // args.method=method;
                    description = {...description, args}
                }

                if (description && router?.version === SwapRouterVersion.UNISWAP_V3 && description.name === "multicall") {


                    const [sub0] = parse({ ...response, data:description.args['data'][0] });
                    const [sub1] = parse({ ...response, data:description.args['data'][description.args['data'].length-1] });

          
                  
                     const args:any = [];
                    // IN
                    if(Number(sub0.description.args.amountIn))  args.amountIn=sub0.description.args.amountIn;
                    else if(Number(sub0.description.args.amountInMax))  args.amountInMax=sub0.description.args.amountInMax;
                    else if(Number(sub0.description.args.params?.amountIn))  args.amountIn=sub0.description.args.params.amountIn;
                    else if(Number(sub0.description.args.params?.amountInMax))  args.amountInMax=sub0.description.args.params.amountInMax;

                    // OUT
                    if(Number(sub1.description.args.amountOut))  args.amountOut=sub1.description.args.amountOut;
                    else if(Number(sub1.description.args.amountOutMin))  args.amountOutMin=sub1.description.args.amountOutMin;
                    else if(Number(sub1.description.args.params.amountOut))  args.amountOut=sub1.description.args.params.amountOut;
                    else if(Number(sub1.description.args.params.amountOutMin))  args.amountOutMin=sub1.description.args.params.amountOutMin;
                   
                    const path0 = sub0.description.args.path || sub0.description.args.params?.path
                    const path1 = sub1.description.args.path || sub1.description.args.params?.path

                    args.path = [path0.length>10?path0.substr(0,42):path0[0], path1.length>10 ? "0x"+path1.substring(path1.length-40) : path1[path1.length-1]]
                    if(!args.amountIn && !args.amountInMax) args.amountIn = description.value



                    args.to=sub1.description.args.to || sub0.description.args.to || sub1.description.args.params?.to || sub0.description.args.params?.to || description.args.to;
                    args[0]=(args.amountIn || args.amountInMax)
                    args[1]=(args.amountOut || args.amountOutMin)
                    args[2]=(args.path)
                    args[3]=(args.to)

                   
                    description={...sub1.description, args, value:description.value}
                    // console.log("--")
                }
                return [{ response, description }]
            }
             results.push(...parse(response));
        } catch (err) {
            results.push({response, description:undefined})
            // console.log("err", router?.version, err.message, response.hash)
        }
    }
    return results;
}
