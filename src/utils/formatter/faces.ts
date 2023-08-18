import erc20 from "../../abi/erc20";
import abiPancakePair from "../../abi/pancake-pair"
import wrappedETH from "../../abi/weth"
import abiPancakeRouterV2 from "../../abi/pancake-router-v2"
import abiPancakeRouterV3 from "../../abi/pancake-router-v3"
import abiMetamaskSwapRouter from "../../abi/metamask-swap-router"
import { Interface } from "ethers/lib/utils";

export const face = {
    pancakePair : new Interface(abiPancakePair),
    pancakeRouterV2 : new Interface(abiPancakeRouterV2),
    pancakeRouterV3 : new Interface(abiPancakeRouterV3),
    erc20: new Interface(erc20),
    weth: new Interface(wrappedETH),
    metamaskSwapRouter: new Interface(abiMetamaskSwapRouter)
}
 