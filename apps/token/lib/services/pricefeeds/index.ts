import { AmountCalculatorService } from './amount.service';
import { getExchangeRate } from '../fetchers';

export default new AmountCalculatorService(getExchangeRate);
