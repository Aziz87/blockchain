
import { SwapRouterVersion } from "../nets/net.i";
import { Blockchain, NET } from "../blockchain";
import { BigNumberish, Contract, providers, utils } from "ethers";
import quoterv2 from "../abi/quoterv2";


export interface Quote {
    amountIn:BigNumberish;
    amountOut:BigNumberish;
    sqrtPriceX96After:BigNumberish;
    initializedTicksCrossed:BigNumberish;
    gasEstimate:BigNumberish;

}


// {
//     tokenIn: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
//     tokenOut: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
//     fee: '300',
//     amountIn: BigNumber { _hex: '0x0de0b6b3a7640000', _isBigNumber: true },
//     sqrtPriceLimitX96: '0'
//   }

//   {
//     tokenIn: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
//     tokenOut: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
//     fee: '3000',
//     amountIn: BigNumber { _hex: '0x0de0b6b3a7640000', _isBigNumber: true },
//     sqrtPriceLimitX96: '0'
//   }




export const quoteExactInputSingle = async function(bc:Blockchain, net:NET, tokenIn:Lowercase<string>, tokenOut:Lowercase<string>, amountIn:BigNumberish, fee:BigNumberish="3000",sqrtPriceLimitX96:BigNumberish="0" ):Promise<Quote>{
    const params = {
        tokenIn:utils.getAddress(tokenIn),
        tokenOut:utils.getAddress(tokenOut),
        fee,
        amountIn,
        sqrtPriceLimitX96,
      };
    
      const abi =JSON.parse(JSON.stringify(quoterv2));
      const quoter = net.swapRouters.find(x=>x.version===SwapRouterVersion.UNISWAP_V3).quoters.sort((a,b)=>a.v>b.v?-1:1)[0];
      abi.find(x=>x.name==="uniswapV3SwapCallback").name=quoter.methodName;

      const provider = bc.getProvider<providers.JsonRpcProvider>(net);
      const quoter2 = new Contract(quoter.address, abi, provider)

      let output = await quoter2.callStatic.quoteExactInputSingle(params);
      return output;
}


 

export const quoteExactOutputSingle = async function(bc:Blockchain, net:NET, tokenIn:Lowercase<string>, tokenOut:Lowercase<string>, amountOut:BigNumberish, fee:BigNumberish="3000",sqrtPriceLimitX96:BigNumberish="0" ):Promise<Quote>{
    const params = {
        tokenIn:utils.getAddress(tokenIn),
        tokenOut:utils.getAddress(tokenOut),
        fee,
        amount:amountOut,
        sqrtPriceLimitX96,
      };
    
      const abi =JSON.parse(JSON.stringify(quoterv2));
      const quoter = net.swapRouters.find(x=>x.version===SwapRouterVersion.UNISWAP_V3).quoters.sort((a,b)=>a.v>b.v?-1:1)[0];
      abi.find(x=>x.name==="uniswapV3SwapCallback").name=quoter.methodName;

      const provider = bc.getProvider<providers.JsonRpcProvider>(net);
      const quoter2 = new Contract(quoter.address, abi, provider)

      let output = await quoter2.callStatic.quoteExactOutputSingle(params);
      return output;
}