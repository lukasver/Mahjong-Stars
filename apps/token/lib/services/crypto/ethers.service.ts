// import { Dispatch, ReactText, SetStateAction, useRef, useState } from "react";
// // import axios from 'axios';

// import { useRouter } from "next/router";
// import { toast } from "react-toastify";
// import {
// 	Chain,
// 	erc20ABI,
// 	useContractWrite,
// 	useNetwork,
// 	usePrepareContractWrite,
// 	usePrepareSendTransaction,
// 	useSendTransaction,
// 	useToken,
// 	useWaitForTransaction,
// } from "wagmi";

// import {
// 	cancelAllTransactions,
// 	confirmTransaction,
// } from "@/services/api.service";
// import {
// 	Currency,
// 	Sale,
// 	SaleTransactions,
// 	TransactionStatus,
// } from "@prisma/client";
// import { constants, BigNumber } from "ethers";
// import { getAddress } from "ethers/lib/utils";
// import { KeyedMutator } from "swr";
// import { TransactionModalTypes } from "../../../common/enums";
// import { ActiveSale } from "../../../common/types/sales";
// import { IS_DEVELOPMENT, IS_PRODUCTION } from "../../common/config";
// // import { UrlContract } from '../adobe.service';
// import amountCalculatorService from "../pricefeeds/amount.service";
// import { getNetworkToken } from "./config";

// const GENERIC_ERROR_MESSAGE = "Error executing transaction, please try again.";

// export const SMAT_TOKEN_CONTRACT =
// 	process.env.NEXT_PUBLIC_SMAT_TOKEN_CONTRACT_ADDRESS;
// export const SMAT_WALLET_ADDRESS = IS_DEVELOPMENT
// 	? process.env.NEXT_PUBLIC_TEST_WALLET || process.env.NEXT_PUBLIC_SMAT_WALLET
// 	: process.env.NEXT_PUBLIC_SMAT_WALLET;

// type UpdateTx = {
// 	uuid: SaleTransactions["uuid"];
// 	saleId: Sale["uuid"];
// 	statusTx: TransactionStatus;
// 	txHash?: string;
// 	onCancel?: Dispatch<SetStateAction<boolean>>;
// 	chainId?: Chain["id"];
// };

// export const handleUpdateTransaction = async ({
// 	uuid,
// 	saleId,
// 	statusTx,
// 	onCancel,
// 	txHash,
// 	chainId,
// }: UpdateTx): Promise<true | undefined> => {
// 	try {
// 		const { success } = await confirmTransaction({
// 			uuid,
// 			saleId,
// 			statusTx,
// 			txHash,
// 			chainId,
// 		});
// 		if (success) {
// 			onCancel?.(true);
// 			return true;
// 		}
// 	} catch (error) {
// 		toast.error(error);
// 	}
// };

// interface BlocktransactionProps {
// 	amount: BigNumber | undefined;
// 	enabled: boolean;
// 	sale?: ActiveSale;
// 	transaction: SaleTransactions | undefined;
// 	toAddress: string;
// 	setOpenModal: (arg: TransactionModalTypes | null) => void;
// 	currency?: Currency;
// 	address: string | undefined;
// 	mutatePending: KeyedMutator<{
// 		totalCount: number;
// 		transactions: SaleTransactions[];
// 		contract: UrlContract;
// 	}>;
// }

// export const useBlockchainTransaction = ({
// 	amount,
// 	enabled = false,
// 	sale,
// 	transaction,
// 	toAddress,
// 	setOpenModal,
// 	currency,
// 	address,
// 	mutatePending,
// }: BlocktransactionProps) => {
// 	const { push } = useRouter();
// 	const { chain } = useNetwork();
// 	const loadingToast = useRef<ReactText>();
// 	const [verifyingToken, setVerifyingToken] = useState(false);

// 	const [transactionCancelled, setTransactionCancelled] = useState<string>();
// 	const tokenSymbol = transaction?.amountPaidCurrency ?? currency;

// 	const ERC20_TOKEN = getNetworkToken(chain, tokenSymbol);

// 	const parsedAmountFromPendingTransaction =
// 		amount ||
// 		(transaction &&
// 			ERC20_TOKEN &&
// 			amountCalculatorService.getTotalAmountCrypto({
// 				amount: transaction?.amountPaid,
// 				decimals: ERC20_TOKEN?.decimals,
// 			}));

// 	const ERC20_TOKEN_CONTRACT = ERC20_TOKEN?.contract as `0x${string}`;
// 	// Important because native tokens can be sent without calling a contract
// 	const isNativeToken = ERC20_TOKEN_CONTRACT === constants.AddressZero;

// 	const ENABLED =
// 		ERC20_TOKEN?.enabled && !!parsedAmountFromPendingTransaction && enabled;

// 	const ENABLED_NATIVE =
// 		isNativeToken && !!address && !!parsedAmountFromPendingTransaction;

// 	const { data: tokenData } = useToken({
// 		address: ERC20_TOKEN_CONTRACT,
// 		enabled: !!ERC20_TOKEN_CONTRACT && !isNativeToken,
// 		onError(error) {
// 			toast.error(error?.message);
// 		},
// 	});

// 	const handleCancelTransaction = (tx: SaleTransactions) => {
// 		// Only cancel transaction if user has not crated an agreement for the transaction
// 		if (!transaction?.agreementId) {
// 			cancelAllTransactions({
// 				uuid: tx.uuid,
// 				saleId: tx.saleId,
// 				statusTx: TransactionStatus.CANCELLED,
// 			}).then(() => {
// 				mutatePending();
// 			});
// 		}
// 		setOpenModal(null);
// 	};

// 	const { config: nativeConfig } = usePrepareSendTransaction({
// 		enabled: ENABLED_NATIVE,
// 		to: toAddress,
// 		value: amount?.toBigInt(),
// 		onSuccess() {
// 			setVerifyingToken(true);
// 		},
// 		onError(err) {
// 			if (err.name === "EstimateGasExecutionError") {
// 				toast.error("Transfer amount plus gas cost exceeds balance.");
// 			}

// 			setVerifyingToken(false);
// 		},
// 	});

// 	const {
// 		data: nativeTransactionData,
// 		isLoading: loadingNativeTx,
// 		sendTransaction,
// 	} = useSendTransaction({
// 		...nativeConfig,
// 		onError(e) {
// 			if (e.name === "TransactionExecutionError") {
// 				toast.error(GENERIC_ERROR_MESSAGE, {
// 					autoClose: 3000,
// 				});
// 			}
// 		},
// 		onSettled(data, error) {
// 			if (error && transaction) {
// 				handleCancelTransaction(transaction);
// 			}

// 			if (data && transaction && sale) {
// 				handleUpdateTransaction({
// 					uuid: transaction.uuid,
// 					saleId: sale.uuid,
// 					// Here is confirmed by user becuase the dispatched the TX from the wallet but blockchain did not confirmed yet.
// 					statusTx: TransactionStatus.CONFIRMED_BY_USER,
// 					txHash: data.hash,
// 					chainId: chain?.id,
// 				});
// 			}
// 		},
// 	});

// 	// ============ ERC20 TOKENS ============

// 	const { config, error } = usePrepareContractWrite({
// 		address: ERC20_TOKEN_CONTRACT,
// 		abi: erc20ABI,
// 		functionName: "transfer",
// 		enabled: ENABLED && !!ERC20_TOKEN_CONTRACT && !isNativeToken,

// 		args: [
// 			toAddress as `0x${string}`,
// 			(parsedAmountFromPendingTransaction as BigNumber)?.toBigInt(),
// 		],
// 		onSuccess() {
// 			setVerifyingToken(true);
// 		},

// 		onError(err) {
// 			const insuficientFunds = "Transfer amount exceeds balance";
// 			if (
// 				err.message?.includes(
// 					"execution reverted: ERC20: transfer amount exceeds balance",
// 				)
// 			) {
// 				return toast.error(insuficientFunds);
// 			}
// 			if (err.message.includes("code=INVALID_ARGUMENT")) {
// 				return toast.error("invalid contract address or ENS name");
// 			}
// 			if (err.message.includes("code=UNPREDICTABLE_GAS_LIMIT")) {
// 				return toast.error(
// 					"cannot estimate gas, transaction may fail or may require manual gas limit",
// 				);
// 			}
// 			if (err.name === "ContractFunctionExecutionError") {
// 				const message = err?.message?.includes(
// 					"transfer amount exceeds balance",
// 				)
// 					? insuficientFunds
// 					: err.message;

// 				return toast.error(message, {
// 					autoClose: 3000,
// 				});
// 			}
// 			toast.error(`${GENERIC_ERROR_MESSAGE}: ${err}`);
// 		},
// 	});

// 	const {
// 		write,
// 		data: transactionData,
// 		isLoading: loadingContractTx,
// 	} = useContractWrite({
// 		...config,
// 		onSuccess(data) {
// 			if (!IS_PRODUCTION) {
// 				console.log("Success on writing contract", data, "config", config);
// 			}
// 		},
// 		onError(error) {
// 			// @ts-expect-error Fix error types from blockchain node
// 			toast.error(error.cause["details"] ?? GENERIC_ERROR_MESSAGE);
// 			setOpenModal(null);
// 			if (!isLoadingTx && !!isErrorTx) {
// 				if (loadingToast.current) {
// 					toast.update(loadingToast.current, {
// 						render: "Error ocurred!",
// 						type: "error",
// 						isLoading: false,
// 						autoClose: 2000,
// 						closeOnClick: true,
// 					});
// 				}
// 				push({
// 					pathname: "/status/failure",
// 				});
// 			}
// 			//TODO: maybe not push user if transaction was manually rejected in metamask?
// 		},
// 		onSettled(data, error) {
// 			if (error) {
// 				// Avoid cancelling transaction if user has already created an agreement for the transaction
// 				if (transaction && !transaction?.agreementId && sale) {
// 					handleUpdateTransaction({
// 						uuid: transaction.uuid,
// 						saleId: sale.uuid,
// 						statusTx: TransactionStatus.CANCELLED,
// 						chainId: chain?.id,
// 					}).then(() => {
// 						mutatePending();
// 						setTransactionCancelled(transaction.uuid);
// 					});
// 				}
// 			}
// 			if (data && transaction && sale) {
// 				// Here is confirmed by user becuase the dispatched the TX from the wallet but blockchain did not confirmed yet.
// 				handleUpdateTransaction({
// 					uuid: transaction.uuid,
// 					saleId: sale.uuid,
// 					statusTx: TransactionStatus.CONFIRMED_BY_USER,
// 					txHash: data.hash,
// 					chainId: chain?.id,
// 				});
// 			}
// 		},
// 	});

// 	const isLoading = loadingContractTx || loadingNativeTx;

// 	const {
// 		data: dataTx,
// 		isError: isErrorTx,
// 		isLoading: isLoadingTx,
// 	} = useWaitForTransaction({
// 		hash: transactionData?.hash || nativeTransactionData?.hash,
// 		//@ts-expect-error TODO:! FIX
// 		wait: transactionData?.wait || nativeTransactionData?.wait,
// 	});

// 	if (!isLoading) {
// 		if (isLoadingTx && !dataTx && !loadingToast.current) {
// 			loadingToast.current = toast.loading("Waiting for confirmation...");
// 		}
// 	}

// 	if (!isLoadingTx && !isErrorTx && dataTx) {
// 		const url = chain?.blockExplorers?.default?.url;
// 		const complteUrl = `${url}/tx/${dataTx.transactionHash}`;
// 		if (loadingToast.current) {
// 			toast.update(loadingToast?.current, {
// 				render: "Success!",
// 				type: "success",
// 				isLoading: false,
// 				autoClose: 2000,
// 				closeOnClick: true,
// 			});
// 		}
// 		if (transaction && sale) {
// 			// at this stage the transaction has been confirmed in the blockchain. Happy path
// 			handleUpdateTransaction({
// 				uuid: transaction.uuid,
// 				saleId: sale.uuid,
// 				statusTx: TransactionStatus.CONFIRMED,
// 				txHash: dataTx.transactionHash,
// 				chainId: chain?.id,
// 			}).then((res) => {
// 				if (res) {
// 					push({
// 						pathname: "/status/success",
// 						query: {
// 							urlTxHash: complteUrl,
// 							saleId: sale.uuid,
// 						},
// 					});
// 				}
// 			});
// 		}
// 	}

// 	if (!IS_PRODUCTION) {
// 		console.log(
// 			"isNative?",
// 			!!isNativeToken,
// 			"sendwrite",
// 			!!sendTransaction,
// 			!!write,
// 		);
// 	}

// 	const executeTransaction = () => {
// 		try {
// 			if ((isNativeToken && !sendTransaction) || (!isNativeToken && !write)) {
// 				return toast.error(
// 					"Transaction execution is not available at the moment.",
// 				);
// 			}
// 			isNativeToken ? sendTransaction?.() : write?.();
// 		} catch (e) {
// 			console.log(e?.message);
// 		}
// 	};

// 	return {
// 		write: executeTransaction,
// 		tokenData,
// 		transactionData: transactionData || nativeTransactionData,
// 		error,
// 		verifyingToken,
// 		transactionCancelled,
// 	};
// };

// /**
//  *  Normalize any supported address-format to a checksum address.
//  */
// export const normalizeAddress = (data: string) => getAddress(data);
