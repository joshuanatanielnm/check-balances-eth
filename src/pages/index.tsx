import { Inter } from "next/font/google";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ethers } from "ethers";
import { chainList } from "@/data/chain-list";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { useToast } from "@/components/ui/use-toast";
const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [address, setAddress] = useState<string>("");
  const [data, setData] =
    useState<{ balance: string; symbol: string; name: string }[]>();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const checkBalance = async () => {
    setData(undefined);
    try {
      setIsLoading(true);
      const balances: { balance: string; symbol: string; name: string }[] = [];
      const ERC20_ABI = [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function totalSupply() view returns (uint256)",
        "function decimals() view returns (uint256)",
        "function balanceOf(address) view returns (uint256)",
      ];
      // UPDATE THIS WITH YOUR RPC PROVIDER
      const provider = new ethers.JsonRpcProvider(
        `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_RPC_API_KEY}`
      );
      const balance = await provider.getBalance(address);
      const formatEtherBalance = ethers.formatEther(balance);
      if (formatEtherBalance !== "0.0") {
        balances.push({
          balance: formatEtherBalance,
          symbol: "ETH",
          name: "Ethereum",
        });
      }
      chainList.map(async (chain) => {
        const contract = new ethers.Contract(
          chain.address,
          ERC20_ABI,
          provider
        );
        const chainBalance = await contract.balanceOf(address);
        const formatChainBalance = ethers.formatEther(chainBalance);
        const name = await contract.name();
        const symbol = await contract.symbol();
        const decimals = await contract.decimals();
        if (formatChainBalance !== "0.0") {
          const isEther = decimals !== 18;
          if (isEther) {
            const formatUnits = ethers.formatUnits(
              Number(chainBalance),
              decimals
            );
            balances.push({
              balance: formatUnits,
              symbol: symbol,
              name,
            });
          } else {
            balances.push({
              balance: formatChainBalance,
              symbol: symbol,
              name,
            });
          }
        }
        setData(balances);
        return chainBalance;
      });
      setIsLoading(false);
    } catch (error) {
      toast({
        title: "Error: invalid wallet address",
        description: "Please check your wallet address",
      });
      setIsLoading(false);
      setAddress("");
    }
  };

  return (
    <main
      className={`flex min-h-screen flex-col items-center p-12 ${inter.className} gap-10 max-w-xl mx-auto`}
    >
      <div>
        <h1 className="text-3xl font-bold text-center">
          Check your account balance
        </h1>
        <p className="text-center text-sm pt-4">
          Simple project demonstrating how to use ethers.js on the client side.
        </p>
      </div>
      <Input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Account address"
      />
      <Button
        className="w-full"
        onClick={checkBalance}
        disabled={isLoading || address === ""}
        size="lg"
      >
        Check balance
      </Button>
      <div className="flex flex-col w-full gap-6">
        {isLoading && (
          <>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </>
        )}
        {!isLoading &&
          data &&
          data.map((value) => (
            <div
              key={value.symbol}
              className="bg-gray-900 w-full p-4 flex gap-2 text-white rounded-lg"
            >
              <Avatar className="my-auto">
                <AvatarImage
                  src={`/icons/${value.symbol.toLowerCase()}.webp`}
                  className="w-10"
                />
                <AvatarFallback>{value.symbol}</AvatarFallback>
              </Avatar>
              <div>
                <p>{value.name}</p>
                <p>
                  {value.balance} {value.symbol}
                </p>
              </div>
            </div>
          ))}
      </div>
    </main>
  );
}
