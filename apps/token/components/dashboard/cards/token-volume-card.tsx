
/**
 * Server component that fetches and displays the token volume
 */
export async function TokenVolumeCard() {
  try {
    throw new Error('Not implemented');
    // const { data: activeSale, error } = await getActiveSale();

    // if (error || !activeSale?.sales?.[0]) {
    //   return <DashboardCardError title='Volume' />;
    // }

    // const currentSale = activeSale.sales[0];
    // const remainingTokens = parseFloat(
    //   currentSale.availableTokenQuantity?.toString() || '0'
    // );

    // //TODO! implement the volume fetching calculation & logic

    // // Format the number with K/M suffix for large numbers
    // const formatNumber = (num: number) => {
    //   if (num >= 1000000) {
    //     return `${(num / 1000000).toFixed(1)}M`;
    //   }
    //   if (num >= 1000) {
    //     return `${(num / 1000).toFixed(1)}K`;
    //   }
    //   return num.toLocaleString();
    // };

    // return (
    //   <DashboardCard
    //     title='Volume'
    //     value={formatNumber(remainingTokens)}
    //   />
    // );
  } catch (error) {
    console.error('Error fetching remaining tokens:', error);
    return null;
    // return <DashboardCardError title='Volume' />;
  }
}
