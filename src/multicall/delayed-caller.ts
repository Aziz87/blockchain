import { Blockchain, NET, ethers } from "../blockchain";
import { multiCallLinear } from "./multicall";
import { faces } from "../utils/formatter/faces";
import { SwapRouterVersion } from "../nets/net.i";

export interface DelayedCall {
    target:string;
    method:string;
    args:any[];
    face:ethers.utils.Interface
    maxDelay:number;
    cb:Function;
}

export interface CustomFace{
    face:any
}

export interface CustomTarget{
    address:any
}

const MAX_PART_CALL_SIZE = 200;

export class DelayedCaller{

    private bc:Blockchain;
    private net:NET;

    private list:DelayedCall[] = [];

    private targets:any = {

    };

    constructor(bc:Blockchain, net:NET){
        this.bc = bc;
        this.net = net;
        const uniswapV2 = net.swapRouters.find(x=>x.version===SwapRouterVersion.UNISWAP_V2);
        this.targets = {
            uniswapRouterV2:uniswapV2.address,
            uniswapRouterV3:net.swapRouters.find(x=>x.version===SwapRouterVersion.UNISWAP_V3).address,
            metamaskSwapRouter:net.swapRouters.find(x=>x.version===SwapRouterVersion.METAMASK_SWAP).address,
            uniswapFactoryV2:uniswapV2.factory
        }
        setInterval(this.processor.bind(this), 500);
        
    }

    public call<T>(
        _target:CustomTarget|"uniswapRouterV2"|"uniswapRouterV3"|"metamaskSwapRouter"|"uniswapFactoryV2", method:string, args:any[], 
        _face:CustomFace|"erc20"|"uniswapRouterV2"|"uniswapFactoryV2"|"uniswapRouterV3"|"metamaskSwapRouter"|"uniswapPair", maxDelay:number):Promise<T>{

  
        const face = _face['face'] || faces[_face+''];
        const target = _target['address'] || this.targets[_target+'']

    
        return new Promise(resolve=>{
            function cb(result:T){
                resolve(result)
            }
            this.list.push({target, method, args, face, maxDelay ,cb});
        })
    }

    private processor(){
        this.list.sort((a,b)=>a.maxDelay<b.maxDelay?-1:1);
        const part = this.list.splice(0,MAX_PART_CALL_SIZE);
        if(part.length){
            this.bc.getLimitter(this.net).schedule(()=>multiCallLinear(this.net, part.map(item=>({target:item.target, arguments:item.args, face:item.face, method:item.method }))).then(results=>{
                for(let i = 0; i<results.length; i++){
                    part[i].cb(results[i])
                }
            }));
        }

    }

}






