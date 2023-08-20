import erc20 from "../../abi/erc20";
import abiPancakePair from "../../abi/uniswap-pair"
import wrappedETH from "../../abi/weth"
import abiPancakeRouterV2 from "../../abi/uniswap-router-v2"
import abiPancakeRouterV3 from "../../abi/pancake-router-v3"
import abiMetamaskSwapRouter from "../../abi/metamask-swap-router"
import { Interface } from "ethers/lib/utils";

export const faces = {
    uniswapPair : new Interface(abiPancakePair),
    uniswapRouterV2 : new Interface(abiPancakeRouterV2),
    uniswapRouterV3 : new Interface(abiPancakeRouterV3),
    erc20: new Interface(erc20),
    weth: new Interface(wrappedETH),
    metamaskSwapRouter: new Interface(abiMetamaskSwapRouter)
}
 