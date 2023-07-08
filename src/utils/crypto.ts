
import * as crypto from "crypto";
import { Contract, HDNodeWallet, JsonRpcProvider, Wallet, getAddress, verifyMessage } from "ethers";

function wrapSecret(secret): string {
    return "00000000000000000000000000000000".split("").map((char, index) => secret.substring(index, index + 1) || char).join("")
}

export function encode(message: string, secret: string): string {
    secret = wrapSecret(secret);
    const iv = crypto.randomBytes(16).toString("hex").slice(0, 16);
    const encrypter = crypto.createCipheriv("aes-256-cbc", secret, iv);
    let code = encrypter.update(message, "utf-8", "hex");
    code += encrypter.final("hex");
    return code + ":" + iv;
}

export function decode(codeWithIv: string, secret: string): string {
    secret = wrapSecret(secret);
    const [code, iv] = codeWithIv.split(":");
    const decrypter = crypto.createDecipheriv("aes-256-cbc", secret, iv);
    let message = decrypter.update(code, "hex", "utf8");
    message += decrypter.final("utf8");
    return message;
}

export function createWallet(): HDNodeWallet {
    return Wallet.createRandom();
}

export function createBuetyWallet(timeout: number = 5000): HDNodeWallet {
    let temp = null
    let temp3 = null
    let temp4 = null
    const start = new Date().getTime()
    const variants4 = ["0000", "1111", "2222", "3333", "4444", "5555", "6666", "7777", "8888", "9999", "aaaa", 'bbbb', 'cccc', "dddd", "eeee", "ffff", 'dead', '1234'];
    const variants3 = variants4.map(x => x.substring(0, 3));

    while (!temp4) {
        temp = createWallet();
        if (variants3.includes(temp.address.substring(2, 5)) || variants3.includes(temp.address.substr(-3, 3))) temp3 = temp;
        if (variants4.includes(temp.address.substring(2, 6)) || variants4.includes(temp.address.substr(-4, 4))) {
            temp4 = temp;
            break;
        }
        if (new Date().getTime() - start > timeout) {
            break;
        }
    }
    return temp4 || temp3 || temp;
}

export async function callContract(rpc: string, contractAddress: string, method: string, args: any[], abi: any): Promise<any> {
    const provider = new JsonRpcProvider(rpc);
    const contract = new Contract(contractAddress, abi, provider)
    try {
        return await contract[method](...args);
    } catch (err) {
        console.error(`${rpc} ERROR`, "callContract")
        return null;
    }
}

export function validateSignature(message: string, address: string, signature: string): boolean {
    try {
        const signerAddr = verifyMessage(message, signature);
        if (signerAddr.toLowerCase() !== address.toLowerCase()) {
            return false;
        }
        return true;
    } catch (err: any) {
        console.warn((err?.message || "INVALID SIGNATURE") + " address:" + address + ' signature:' + signature + ' message:' + message, "VALIDATE SIGNATURE");
        return false;
    }
}

export function roundAmount(amount: number, decimals: number = 5): number {
    return Math.round(amount * Number("1e" + decimals)) / Number("1e" + decimals)
}

export function getEthAddress(address: string): string {
    try {
        return getAddress(address)
    } catch (err) {
        console.log(err);
        return null;
    }
}