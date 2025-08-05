'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@mjs/ui/primitives/card';
import { motion } from '@mjs/ui/components/motion';

export function RecentTransactionsError() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.6,
        scale: { type: 'spring', visualDuration: 0.6, bounce: 0.2 },
      }}
    >
      <Card className='border-zinc-800 bg-zinc-900/50 max-h-[565px] h-full overflow-y-auto scrollbar-hidden'>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest token purchases and sales</CardDescription>
          </CardHeader>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className='h-[calc(100%-100px)]'
        >
          <CardContent className='h-full flex items-center justify-center'>
            <div className='text-center text-zinc-400 py-8 mb-20'>
              No recent transactions found
            </div>
          </CardContent>
        </motion.div>
      </Card>
    </motion.div>
  );
}
