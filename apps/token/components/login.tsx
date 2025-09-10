"use client";

import { Icons } from "@mjs/ui/components/icons";
import { motion } from "@mjs/ui/components/motion";
import { cn } from "@mjs/ui/lib/utils";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@mjs/ui/primitives/alert-dialog";
import { useState } from "react";
import { Wallet } from "thirdweb/wallets";
import { Blockchain } from "@/common/schemas/generated";
import { ConnectWallet } from "./connect-wallet";

export function LoginForm({
  className,
  chains,
}: {
  className?: string;
  chains: Pick<
    Blockchain,
    "chainId"
  >[];
}) {


  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = (_wallet: Wallet) => {
    setIsConnecting(true);
  };

  return (
    <>
      <motion.div
        className={cn("w-full [&>button]:w-full!", className)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.1,
          duration: 0.6,
        }}
      >
        <ConnectWallet onConnect={handleConnect} chains={chains} />
      </motion.div>

      <AlertDialog open={isConnecting}>
        <AlertDialogContent className="[&>button]:hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.3,
              scale: { type: "spring", visualDuration: 0.3, bounce: 0.1 },
            }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle>Connecting Wallet</AlertDialogTitle>
              <AlertDialogDescription>
                Please wait while we establish your connection...
              </AlertDialogDescription>
            </AlertDialogHeader>
            <motion.div
              className="flex items-center justify-center h-20 w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                delay: 0.2,
                duration: 0.4,
              }}
            >
              <Icons.loader className="w-10 h-10 animate-spin" />
            </motion.div>
          </motion.div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
