// import { CLIENT_FEATURES } from '@/common/config/features';
// import HttpStatusCode from '@/common/controllers/httpStatusCodes';
// import { TransactionModalTypes } from '@/common/enums';
// import { FormInvestSchema } from '@/common/types/interfaces';
// import WalletNetwork from '@/containers/WalletNetwork';
// import {
//   createTransaction,
//   useUserPendingTransactions,
// } from '@/services/api.service';
// import {
//   NETWORK_TO_TOKEN_MAPPING,
//   getNetworkToken,
//   getNetworkTokenList,
// } from '@/services/crypto/config';
// import { useBlockchainTransaction } from '@/services/crypto/ethers.service';
// import amountCalculator from '@/services/pricefeeds/amount.service';
// import amountCalculatorService from '@/services/pricefeeds/amount.service';
// import { usePricePerUnit } from '@/lib/utils/use-before-unload';
// import { getTransactionModalTypeToOpen } from '@/utils/transactions';
// import { zodResolver } from '@hookform/resolvers/zod';
// import OpenInNewIcon from '@mui/icons-material/OpenInNew';
// import LoadingButton from '@mui/lab/LoadingButton';
// import {
//   Box,
//   Card,
//   Divider,
//   Fade,
//   FormHelperText,
//   MenuItem,
//   Select,
//   Typography,
// } from '@mui/material';
// import { FOP, SaleTransactions, TransactionStatus } from '@prisma/client';
// import currency from 'currency.js';
// import { BigNumber } from 'ethers';
// import { useTranslation } from 'next-i18next';
// import { ReactNode, useState } from 'react';
// import { Controller, SubmitHandler, useForm } from 'react-hook-form';
// import { toast } from 'react-toastify';
// import { Chain, useNetwork } from 'wagmi';
// import { polygon } from 'wagmi/chains';
// import DisplayNumberFormat from '../../containers/utils/numberformatter/DisplayNumberFormat';
// import PopoverButton from '../Buttons/PopoverButton';
// import ContractViewer from '../Contract';
// import { Title } from '../Typography/CommonTitles';
// import AddressWallet from './BuyToken/AddressWallet';
// import PaymentMethod from './BuyToken/PaymentMethod';
// import Quantity from './BuyToken/Quantity';
// import TokenModal from './BuyToken/TokenModal';
// import { useActiveSale } from '@/lib/services/api';

// const getCryptoCurrencies = (chain?: Chain & { unsupported?: boolean }) => {
//   if (!chain || chain?.unsupported) {
//     return [{ name: '', value: '', disabled: true }];
//   }
//   const currencies = getNetworkTokenList(chain);
//   if (currencies) {
//     return Object.entries(currencies).map(([key, value]) => {
//       return { name: value?.symbol || key, value: key };
//     });
//   } else {
//     toast.info('Please connect a wallet to see available currencies');
//     return [
//       {
//         name: chain.testnet ? 'LINK' : 'USDC',
//         value: 'USDC',
//       },
//     ];
//   }
// };

// const FormInvest = () => {
//   const { data: sale } = useActiveSale();

//   // const { address, isConnected } =
//   //   useAccount({
//   //     onConnect() {
//   //       !isConnected && handleModal(TransactionModalTypes.WalletLogin);
//   //       if (address) {
//   //         setValue('address', address satisfies `0x${string}`);
//   //       }
//   //       handleModal(null);
//   //     },
//   //   }) || {};

//   const {
//     control,
//     setValue,
//     handleSubmit,
//     clearErrors,
//     register,
//     getValues,
//     reset,
//     watch,
//     formState: { errors, isValid },
//   } = useForm<FormInvestSchema>({
//     resolver: zodResolver(FormInvestSchema),
//     defaultValues: {
//       formOfPayment: isSiwe ? FOP.CRYPTO : FOP.TRANSFER,
//       paymentCurrency: isSiwe ? Currency.USDC : sale.saleCurrency,
//       address: isSiwe || isConnected ? address : '',
//       paymentAmountCrypto: '',
//     },
//   });

//   const areAvailableUnits =
//     sale?.availableTokenQuantity && Number(sale?.availableTokenQuantity) > 0;

//   const { chain } = useNetwork();
//   const { t } = useTranslation();

//   const selectedCurrency = watch('paymentCurrency', sale.saleCurrency);
//   const defaultCurrency = sale?.saleCurrency;

//   const {
//     data: userPendingTransaction,
//     mutate: mutatePendingTransaction,
//     isLoading: loadingPending,
//   } = useUserPendingTransactions({
//     saleId: sale?.uuid,
//     status: TransactionStatus.PENDING,
//   });

//   const pendingTransaction = userPendingTransaction?.transactions?.[0];

//   const mutate = () => {
//     mutateActiveSale();
//     mutatePendingTransaction();
//   };
//   const [loadingExchange, setLoadingExchange] = useState<boolean>(false);

//   const [loading, setLoading] = useState<boolean>(false);
//   const [openModal, setOpenModal] = useState<TransactionModalTypes | null>(
//     null
//   );
//   const [transaction, setTransaction] = useState<SaleTransactions | null>();

//   const [contract, setContract] = useState<string | null>(null);

//   const toAddress = sale?.toWalletsAddress;
//   const activeWalletAddress = address;
//   const isCryptoFOP = watch('formOfPayment') === FOP.CRYPTO;
//   const paymentAmountCrypto = watch('paymentAmountCrypto');

//   const { write, verifyingToken } = useBlockchainTransaction({
//     enabled: !!isCryptoFOP,
//     amount:
//       isCryptoFOP && paymentAmountCrypto ? paymentAmountCrypto : undefined,
//     sale,
//     transaction: transaction || pendingTransaction,
//     toAddress,
//     setOpenModal,
//     currency: watch('paymentCurrency'),
//     address: activeWalletAddress,
//     mutatePending: mutatePendingTransaction,
//   });

//   const resetForm = () => {
//     reset();
//     setValue('quantity', '');
//   };

//   const [pricePerUnit, setPricePerUnit] = usePricePerUnit({
//     from: defaultCurrency,
//     to: selectedCurrency,
//     base: sale?.tokenPricePerUnit,
//     isSiwe,
//     onError: resetForm,
//     precision:
//       watch('formOfPayment') === FOP.CRYPTO
//         ? amountCalculatorService.CRYPTO_PRECISION
//         : 2,
//   });

//   const IS_SUPPORTED_NETWORK =
//     chain?.id && !!NETWORK_TO_TOKEN_MAPPING[chain.id];
//   const MIN_BUY_ALLOWANCE = sale?.minimumTokenBuyPerUser;
//   const MAX_BUY_ALLOWANCE = sale?.maximumTokenBuyPerUser
//     ? sale?.maximumTokenBuyPerUser
//     : sale?.availableTokenQuantity;
//   const TOKENS_AVAILABLES = sale?.availableTokenQuantity;

//   const handleFormOfPaymentChange = async (
//     name: 'formOfPayment',
//     value: FOP
//   ) => {
//     const isCrypto = value === FOP.CRYPTO;
//     // This is used as initial currency when FOP is changed
//     const selectedCurrencyValue = isCrypto ? Currency.USDC : defaultCurrency;
//     const token = getNetworkToken(chain, selectedCurrencyValue);

//     if (isCrypto && !isConnected) {
//       toast.info('Please connect a wallet to proceed', { autoClose: 4000 });
//     }
//     if (name === 'formOfPayment') {
//       resetForm();
//       try {
//         const { pricePerUnit } = await amountCalculator.calculateAmountToPay({
//           currency: selectedCurrencyValue,
//           quantity: getValues().quantity || '0',
//           sale: sale,
//           tokenDecimals: token?.decimals,
//         });

//         if (pricePerUnit) {
//           setPricePerUnit(pricePerUnit);
//         }
//       } catch (error) {
//         toast.error('Ops! someting wrong.');
//         resetForm();
//       }
//       setValue(name, value);
//       if (selectedCurrencyValue) {
//         setValue('paymentCurrency', selectedCurrencyValue);
//       }
//       if (activeWalletAddress) {
//         setValue('address', activeWalletAddress);
//       }
//       if (value) {
//         clearErrors(name);
//       }
//     }
//   };

//   const handleSelectCurrency = async (e) => {
//     const newCurrency = e.target.value;

//     if (newCurrency === defaultCurrency) {
//       setPricePerUnit(null);
//       setValue('paymentCurrency', newCurrency);
//     }

//     const token = getNetworkToken(chain, newCurrency);

//     try {
//       setLoadingExchange(true);
//       const { pricePerUnit, amount, bigNumber } =
//         await amountCalculator.calculateAmountToPay({
//           quantity: getValues().quantity || '0',
//           sale: sale,
//           currency: newCurrency,
//           tokenDecimals: token?.decimals,
//         });

//       if (pricePerUnit) {
//         setPricePerUnit(pricePerUnit);
//         setValue('paymentCurrency', newCurrency);
//       }
//       if (bigNumber) {
//         setValue('paymentAmountCrypto', bigNumber);
//       }
//       if (amount) {
//         setValue(
//           'paymentAmount',
//           isCryptoFOP ? amount : currency(amount, { precision: 2 }).toString()
//         );
//       } else {
//         throw new Error(
//           'Error fetching investment value amount, please try again'
//         );
//       }
//     } catch (error) {
//       toast.error(error?.message || 'Ops! someting wrong.');
//       resetForm();
//     } finally {
//       setLoadingExchange(false);
//     }
//   };

//   const onSubmit: SubmitHandler<FormInvestSchema> = async (formData) => {
//     if (isDisabled) {
//       return toast.error('Transaction has errors and cannot be submitted');
//     }
//     if (!areAvailableUnits) {
//       return toast.error('No tokens available for this sale');
//     }
//     const { quantity, formOfPayment, address, paymentAmount, paymentCurrency } =
//       formData;

//     if (TOKENS_AVAILABLES && Number(quantity) > TOKENS_AVAILABLES) {
//       return toast.error('Excedeed tokens available for this sale');
//     }
//     if (MAX_BUY_ALLOWANCE && Number(quantity) > MAX_BUY_ALLOWANCE) {
//       return toast.error('Excedeed maximum buy amount per transaction');
//     } else if (Number(quantity) < MIN_BUY_ALLOWANCE) {
//       return toast.error(
//         `You cannot buy less than ${MIN_BUY_ALLOWANCE} tokens`
//       );
//     }

//     if (formOfPayment === FOP.CRYPTO) {
//       if (!formData.paymentAmount) {
//         return toast.error(
//           `Error fetching investment value amount, please try again`
//         );
//       }
//       setLoading(true);

//       const amountPaidCurrency = formData?.paymentCurrency;
//       if (isConnected) {
//         if (write) {
//           try {
//             const data = await createTransaction({
//               tokenSymbol: sale.tokenSymbol,
//               boughtTokenQuantity: Number(quantity),
//               formOfPayment: FOP.CRYPTO,
//               receivingWallet: address,
//               userId: userId,
//               saleId: sale.uuid,
//               amountPaid: String(paymentAmount),
//               amountPaidCurrency,
//             });

//             if (data?.success) {
//               setTransaction(data?.transaction);
//               handleModal(
//                 data.urlSign
//                   ? TransactionModalTypes.Contract
//                   : TransactionModalTypes.CryptoWarning
//               );
//               if (!data.urlSign) {
//                 write?.();
//               }
//               mutate();
//             }
//             if (!data?.success && data?.status === HttpStatusCode.CONFLICT) {
//               handleModal(TransactionModalTypes.PendingTx);
//             }
//           } catch (e) {
//             toast.error(
//               e?.message || 'Ups, something went wrong. Please try again.'
//             );
//           } finally {
//             setLoading(false);
//           }
//         }
//       } else {
//         toast.error('Wallet is not connected, please reconnect and try again');
//       }
//     }

//     if (formOfPayment === FOP.TRANSFER) {
//       setLoading(true);
//       try {
//         const data = await createTransaction({
//           tokenSymbol: sale.tokenSymbol,
//           boughtTokenQuantity: Number(quantity),
//           formOfPayment: FOP.TRANSFER,
//           receivingWallet: address,
//           userId: userId,
//           saleId: sale.uuid,
//           amountPaid: String(paymentAmount),
//           amountPaidCurrency: paymentCurrency,
//         });

//         if (data?.success) {
//           setTransaction(data?.transaction);
//           handleModal(
//             data?.urlSign
//               ? TransactionModalTypes.Contract
//               : TransactionModalTypes.ManualTransfer
//           );
//           toast.success('Transaction created successfully');
//           mutate();
//         }
//         if (!data?.success && data?.status === HttpStatusCode.CONFLICT) {
//           handleModal(TransactionModalTypes.PendingTx);
//         }
//       } catch (e) {
//         toast.error(
//           e?.message || 'Ups, something went wrong. Please try again.'
//         );
//       } finally {
//         setLoading(false);
//       }
//     }
//   };

//   const handlePendingTransaction = () => {
//     const result = getTransactionModalTypeToOpen(
//       pendingTransaction,
//       user,
//       userPendingTransaction?.contract
//     );
//     if (result === TransactionModalTypes.CryptoWarning && pendingTransaction) {
//       const token = getNetworkToken(
//         chain,
//         pendingTransaction?.amountPaidCurrency
//       );

//       if (token && pendingTransaction) {
//         reset({
//           address: pendingTransaction.receivingWallet!,
//           formOfPayment: FOP.CRYPTO,
//           paymentAmount: pendingTransaction?.amountPaid,
//           paymentCurrency: pendingTransaction?.amountPaidCurrency,
//           quantity: pendingTransaction?.boughtTokenQuantity?.toString(),
//           paymentAmountCrypto: amountCalculatorService.getTotalAmountCrypto({
//             amount: pendingTransaction.amountPaid,
//             decimals: token.decimals,
//           }),
//         });
//         if (write) {
//           write();
//         } else {
//           toast.info('Transaction could not be sent to wallet');
//         }
//       }
//     }
//     handleModal(result || TransactionModalTypes.PendingTx);
//   };

//   const handleModal = (state: TransactionModalTypes | null) => {
//     setOpenModal(state ?? null);
//   };

//   const saveDraft = async () => {
//     try {
//       handleModal(TransactionModalTypes.WalletLogin);
//     } catch (error) {
//       error.inner?.map((inner, index) => {
//         const { errors } = inner;
//         return toast.error(errors[index]);
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const isDisabled =
//     (isConnected && isCryptoFOP && !IS_SUPPORTED_NETWORK) ||
//     (isConnected && !isValid) ||
//     (!isCryptoFOP && !isValid) ||
//     (isCryptoFOP && !verifyingToken) ||
//     !FormInvestSchema.safeParse(getValues())?.success ||
//     loadingExchange ||
//     !areAvailableUnits;

//   return (
//     <Card
//       sx={{
//         width: '100%',
//         boxShadow: '4',
//         borderRadius: '10px',
//         padding: '2rem',
//       }}
//     >
//       {contract && (
//         <ContractViewer
//           contractUrl={contract}
//           onClose={() => setContract(null)}
//           write={write}
//           handleModal={handleModal}
//           getValues={getValues}
//         />
//       )}
//       <Box sx={{ display: 'flex', mb: '1.5rem', flexDirection: 'column' }}>
//         <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
//           <Title sx={{ color: 'primary.main' }}>Buy Token</Title>
//           {isCryptoFOP && <WalletNetwork isConnected={isConnected} />}
//         </Box>
//         <Divider />
//       </Box>

//       <Box
//         sx={{
//           marginBottom: '1.5rem',
//           fontWeight: 500,
//           display: 'grid',
//           gridTemplateColumns: '1fr',
//           alignItems: 'center',
//           columnGap: '1rem',
//           rowGap: '1rem',
//           fontSize: '0.75rem',
//           color: 'tableGray',
//         }}
//       >
//         <TokenModal
//           openModal={openModal}
//           handleModal={handleModal}
//           transaction={transaction || pendingTransaction}
//           setLoading={setLoading}
//           user={user}
//           setContract={setContract}
//           sale={sale}
//         />

//         <AddressWallet
//           errors={errors}
//           register={register}
//           isCryptoFOP={isCryptoFOP}
//           address={address}
//         />
//         <PaymentMethod
//           handleFormChange={handleFormOfPaymentChange}
//           register={register}
//           errors={errors}
//         />
//         <Quantity
//           control={control}
//           sale={sale}
//           pricePerUnit={pricePerUnit}
//           getValues={getValues}
//           setValue={setValue}
//           errors={errors}
//         />

//         <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
//           <Typography
//             variant={'body1'}
//             sx={{
//               flex: 1,
//               fontSize: '1rem',
//               fontFamily: 'Montserrat, Sans-Serif;',
//               color: 'grey',
//             }}
//           >
//             {t('sale:buyToken.toPay')}{' '}
//             <span>{` + ${isCryptoFOP ? 'gas' : ''} fees`}</span>
//           </Typography>
//         </Box>
//         <Box
//           sx={{
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'space-between',
//             borderBottom: '1px solid lightGrey',
//             width: 'inherit !important',
//             fontSize: '1.25rem',
//             marginBottom: '1rem',
//             color: ({ palette }) =>
//               palette.mode === 'dark' ? 'lightGrey' : 'grey',
//             gap: '1rem',
//           }}
//         >
//           <Controller
//             control={control}
//             name={'paymentAmount'}
//             rules={{ required: true }}
//             render={({ field: { onChange, name, value } }) => (
//               <DisplayNumberFormat
//                 name={name}
//                 value={value?.toString() || BigNumber.from('0').toString()}
//                 decimalScale={isCryptoFOP ? 8 : 2}
//                 placeholder={0}
//                 onChange={onChange}
//                 max={MAX_BUY_ALLOWANCE}
//                 isLoading={loadingExchange}
//               />
//             )}
//           />

//           <Select
//             {...register('paymentCurrency', {
//               required: true,
//             })}
//             sx={{
//               '&>div': {
//                 minWidth: '3ch',
//               },
//             }}
//             variant='filled'
//             onChange={handleSelectCurrency}
//             value={selectedCurrency}
//             defaultValue={defaultCurrency}
//           >
//             {(isCryptoFOP ? getCryptoCurrencies(chain) : CURRENCY)?.map(
//               ({
//                 value,
//                 name,
//                 disabled = false,
//               }: {
//                 value: string;
//                 name: string;
//                 disabled?: boolean;
//               }) => {
//                 return (
//                   <MenuItem key={name} value={value} disabled={disabled}>
//                     {name}
//                   </MenuItem>
//                 );
//               }
//             )}
//           </Select>
//           <input
//             type={'text'}
//             style={{ display: 'none' }}
//             {...register('paymentAmountCrypto')}
//           />
//         </Box>
//         {isCryptoFOP && (
//           <Fade
//             in={selectedCurrency === Currency.USDC && chain?.id === polygon.id}
//             timeout={1500}
//           >
//             <Box
//               component={'a'}
//               sx={{
//                 display: 'flex',
//                 gap: '.5rem',
//                 justifyContent: 'flex-end',
//                 alignItems: 'center',
//                 mt: -4,
//               }}
//               rel='noreferrer noopener nofollow'
//               href={
//                 'https://help.circle.com/s/article-page?articleId=ka0Un00000011rLIAQ'
//               }
//               target='_blank'
//             >
//               <FormHelperText sx={{ textAlign: 'right' }}>
//                 We accept Native Polygon USDC.
//               </FormHelperText>
//               <OpenInNewIcon sx={{ height: 10, width: 10 }} />
//             </Box>
//           </Fade>
//         )}
//         <Box
//           sx={{
//             display: 'flex',
//             gap: '0.5rem',
//             flexDirection: 'column',
//           }}
//         >
//           {getValues().formOfPayment === FOP.CRYPTO ? (
//             <span>{t('sale:buyToken.cryptoPaymentHelperText')}</span>
//           ) : CLIENT_FEATURES.Ramp ? (
//             <p>{t('sale:buyToken.bankPaymentHelperText')}</p>
//           ) : (
//             <>
//               <p>{t('sale:buyToken.transferHelperText')}</p>
//             </>
//           )}
//           {selectedCurrency && selectedCurrency !== sale?.saleCurrency && (
//             <p>{t('sale:buyToken.managementFees')}</p>
//           )}
//         </Box>

//         {pendingTransaction ? (
//           <LoadingButton
//             variant={'contained'}
//             color={'primary'}
//             fullWidth
//             loading={loading || loadingPending}
//             onClick={handlePendingTransaction}
//           >
//             You have a pending transaction
//           </LoadingButton>
//         ) : (
//           <LoadingButton
//             variant={'contained'}
//             color={'primary'}
//             disabled={isDisabled}
//             fullWidth
//             loading={loading || loadingPending}
//             onClick={
//               !isConnected && isCryptoFOP ? saveDraft : handleSubmit(onSubmit)
//             }
//           >
//             <ButtonText
//               isConnected={isConnected}
//               isCryptoFOP={isCryptoFOP}
//               isSupported={IS_SUPPORTED_NETWORK}
//             />
//           </LoadingButton>
//         )}
//       </Box>
//     </Card>
//   );
// };
