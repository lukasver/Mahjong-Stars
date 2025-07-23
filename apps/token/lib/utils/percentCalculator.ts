export const percentCalculator = (props: {
  availableTokenQuantity: number;
  initialTokenQuantity: number;
}) => {
  const availableBalance = props?.availableTokenQuantity;

  if (availableBalance && props?.initialTokenQuantity) {
    return (1 - availableBalance / props?.initialTokenQuantity) * 100;
  } else {
    return 100;
  }
};
