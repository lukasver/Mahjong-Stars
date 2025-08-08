# MJS token dashboard

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

# Providers

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

Web3 & Auth:
• [Thirdweb](https://thirdweb.com)
