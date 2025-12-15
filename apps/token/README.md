# The tiles company token dashboard

🔐 General
• Login via Thirdweb Smart Wallets (social login, wallet, email, passkeys, etc.)
• Email notifications for purchases and document signatures
• Integration with signature provider (Documenso)

🛠️ Admin Panel
• Create and update token sales
• Configure SAFT contract templates to be signed during token purchase
• Add supplementary sale information: images, documents, descriptions
• Set sales to “Active” status to display them to users
• Configure informational bank account details for FIAT payments (no direct banking integration)
• Review and confirm user-submitted transactions
• Transactions exports to CSV / XLSX

🧑‍💼 User/Buyer Flow
• Access active token sales with full sale details (text, images, documents)
• Purchase tokens using FIAT or CRYPTO
• Create purchase orders
• Submit KYC documents (if required)
• Generate and sign SAFT agreements (if required)
• Confirm FIAT payments manually
• Make direct CRYPTO transfers
• Real-time exchange rates from providers (FIAT) and the BNB Chain (CRYPTO)
• View personal transaction history

## Providers

Infrastructure:
• [Vercel](https://vercel.com)

Cronjobs:
• [Vercel](https://vercel.com/docs/cron-jobs)

Document Signature:
• [Documenso](https://documenso.com)

Storage:
• [GCP Cloud Storage](https://cloud.google.com/storage)

PDF Generation:
• [@mjs/pdf-gen](../packages/pdf-gen) @ [GCP Cloud Run](https://cloud.google.com/run)

Exchange Rates:
• Crypto: [BNB Oracle](https://docs.bnbchain.org/docs/oracle-relayer)
• FIAT: [cryptocompare.com](https://www.cryptocompare.com)

Database:
• Postgres: [NeonDB Serverless](https://console.neon.tech/)

Web3 & Auth:
• [Thirdweb](https://thirdweb.com)

## Demos

Admin flow: https://www.loom.com/share/5d7968aed3604c3db28897775104b937
User purchase flow (FIAT): https://www.loom.com/share/c0bd4db6222f49c88a65d66432daf24e?sid=155e0949-2c04-458c-a285-87f3e59616c0
User purchase flow (CRYPTO): https://www.loom.com/share/405a5d890deb4b06ad6b556920280867?sid=6e0b242a-99c8-4d33-8efb-c378810b4cea
User purchase flow (On-ramp w/ provider): https://www.loom.com/share/dce2a3eef3db49dcb40054224040076b?sid=250a4b90-2023-42b5-84fc-95a015504bd3

## Standalone scripts

### Add new coin

```sh

export SYMBOL=USDT  # (required)
export ENVIRONMENT= local | test | stage | production # (required)
export CHAINS= 1 # (optional, multiple)

pnpx tsx prisma/scripts/addCoin.ts --symbol $SYMBOL --environment $ENVIRONMENT --chain $CHAINS

```
