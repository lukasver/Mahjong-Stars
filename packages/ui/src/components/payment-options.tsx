"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@mjs/ui/primitives/card";
import { CheckCircle2, CreditCard } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { usePaymentMethods } from "../hooks/use-payment-methods";
import { cn } from "../lib/utils";
import { Button } from "../primitives/button";

interface PaymentMethodOption {
  id: string;
  name: string;
  icon: React.ReactNode;
}

const paymentMethods: PaymentMethodOption[] = [
  {
    id: "card",
    name: "Credit / Debit Card",
    icon: <CreditCard className="w-8 h-8" />,
  },
  {
    id: "ideal",
    name: "iDEAL",
    icon: (
      <div className="w-8 h-8 flex items-center justify-center bg-white rounded text-[#cc0066] font-bold text-sm">
        iD
      </div>
    ),
  },
  {
    id: "bancontact",
    name: "Bancontact",
    icon: (
      <div className="w-8 h-8 flex items-center justify-center bg-white rounded">
        <svg viewBox="0 0 24 24" className="w-6 h-6">
          <rect width="24" height="24" fill="#005498" />
          <path
            d="M4 12h16M12 4v16"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
  },
  {
    id: "apple-pay",
    name: "Apple Pay",
    icon: (
      <div className="size-8 flex items-center justify-center bg-transparent rounded">
        <svg
          version="1.1"
          id="Artwork"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          x="0px"
          y="0px"
          width="165.52107px"
          height="105.9651px"
          viewBox="0 0 165.52107 105.9651"
          enableBackground="new 0 0 165.52107 105.9651"
          xmlSpace="preserve"
        >
          <g>
            <path
              id="XMLID_4_"
              d="M150.69807,0H14.82318c-0.5659,0-1.1328,0-1.69769,0.0033c-0.47751,0.0034-0.95391,0.0087-1.43031,0.0217
		c-1.039,0.0281-2.0869,0.0894-3.1129,0.2738c-1.0424,0.1876-2.0124,0.4936-2.9587,0.9754
		c-0.9303,0.4731-1.782,1.0919-2.52009,1.8303c-0.73841,0.7384-1.35721,1.5887-1.83021,2.52
		c-0.4819,0.9463-0.7881,1.9166-0.9744,2.9598c-0.18539,1.0263-0.2471,2.074-0.2751,3.1119
		c-0.0128,0.4764-0.01829,0.9528-0.0214,1.4291c-0.0033,0.5661-0.0022,1.1318-0.0022,1.6989V91.142
		c0,0.5671-0.0011,1.13181,0.0022,1.69901c0.00311,0.4763,0.0086,0.9527,0.0214,1.4291
		c0.028,1.03699,0.08971,2.08469,0.2751,3.11069c0.1863,1.0436,0.4925,2.0135,0.9744,2.9599
		c0.473,0.9313,1.0918,1.7827,1.83021,2.52c0.73809,0.7396,1.58979,1.3583,2.52009,1.8302
		c0.9463,0.4831,1.9163,0.7892,2.9587,0.9767c1.026,0.1832,2.0739,0.2456,3.1129,0.2737c0.4764,0.0108,0.9528,0.0172,1.43031,0.0194
		c0.56489,0.0044,1.13179,0.0044,1.69769,0.0044h135.87489c0.5649,0,1.13181,0,1.69659-0.0044
		c0.47641-0.0022,0.95282-0.0086,1.4314-0.0194c1.0368-0.0281,2.0845-0.0905,3.11301-0.2737
		c1.041-0.1875,2.0112-0.4936,2.9576-0.9767c0.9313-0.4719,1.7805-1.0906,2.52011-1.8302c0.7372-0.7373,1.35599-1.5887,1.8302-2.52
		c0.48299-0.9464,0.78889-1.9163,0.97429-2.9599c0.1855-1.026,0.2457-2.0737,0.2738-3.11069
		c0.013-0.4764,0.01941-0.9528,0.02161-1.4291c0.00439-0.5672,0.00439-1.1319,0.00439-1.69901V14.8242
		c0-0.5671,0-1.1328-0.00439-1.6989c-0.0022-0.4763-0.00861-0.9527-0.02161-1.4291c-0.02811-1.0379-0.0883-2.0856-0.2738-3.1119
		c-0.18539-1.0432-0.4913-2.0135-0.97429-2.9598c-0.47421-0.9313-1.093-1.7816-1.8302-2.52
		c-0.73961-0.7384-1.58881-1.3572-2.52011-1.8303c-0.9464-0.4818-1.9166-0.7878-2.9576-0.9754
		c-1.0285-0.1844-2.0762-0.2457-3.11301-0.2738c-0.47858-0.013-0.95499-0.0183-1.4314-0.0217C151.82988,0,151.26297,0,150.69807,0
		L150.69807,0z"
            />
            <path
              id="XMLID_3_"
              fill="#FFFFFF"
              d="M150.69807,3.532l1.67149,0.0032c0.4528,0.0032,0.90561,0.0081,1.36092,0.0205
		c0.79201,0.0214,1.71849,0.0643,2.58209,0.2191c0.7507,0.1352,1.38029,0.3408,1.9845,0.6484
		c0.5965,0.3031,1.14301,0.7003,1.62019,1.1768c0.479,0.4797,0.87671,1.0271,1.18381,1.6302
		c0.30589,0.5995,0.51019,1.2261,0.64459,1.9823c0.1544,0.8542,0.1971,1.7832,0.21881,2.5801
		c0.01219,0.4498,0.01819,0.8996,0.0204,1.3601c0.00429,0.5569,0.0042,1.1135,0.0042,1.6715V91.142
		c0,0.558,0.00009,1.1136-0.0043,1.6824c-0.00211,0.4497-0.0081,0.8995-0.0204,1.3501c-0.02161,0.7957-0.0643,1.7242-0.2206,2.5885
		c-0.13251,0.7458-0.3367,1.3725-0.64429,1.975c-0.30621,0.6016-0.70331,1.1484-1.18022,1.6251
		c-0.47989,0.48-1.0246,0.876-1.62819,1.1819c-0.5997,0.3061-1.22821,0.51151-1.97151,0.6453
		c-0.88109,0.157-1.84639,0.2002-2.57339,0.2199c-0.4574,0.0103-0.9126,0.01649-1.37889,0.0187
		c-0.55571,0.0043-1.1134,0.0042-1.6692,0.0042H14.82318c-0.0074,0-0.0146,0-0.0221,0c-0.5494,0-1.0999,0-1.6593-0.0043
		c-0.4561-0.00211-0.9112-0.0082-1.3512-0.0182c-0.7436-0.0201-1.7095-0.0632-2.5834-0.2193
		c-0.74969-0.1348-1.3782-0.3402-1.9858-0.6503c-0.59789-0.3032-1.1422-0.6988-1.6223-1.1797
		c-0.4764-0.4756-0.8723-1.0207-1.1784-1.6232c-0.3064-0.6019-0.5114-1.2305-0.64619-1.9852
		c-0.15581-0.8626-0.19861-1.7874-0.22-2.5777c-0.01221-0.4525-0.01731-0.9049-0.02021-1.3547l-0.0022-1.3279l0.0001-0.3506V14.8242
		l-0.0001-0.3506l0.0021-1.3251c0.003-0.4525,0.0081-0.9049,0.02031-1.357c0.02139-0.7911,0.06419-1.7163,0.22129-2.5861
		c0.1336-0.7479,0.3385-1.3765,0.6465-1.9814c0.3037-0.5979,0.7003-1.1437,1.17921-1.6225
		c0.477-0.4772,1.02309-0.8739,1.62479-1.1799c0.6011-0.3061,1.2308-0.5116,1.9805-0.6465c0.8638-0.1552,1.7909-0.198,2.5849-0.2195
		c0.4526-0.0123,0.9052-0.0172,1.3544-0.0203l1.6771-0.0033H150.69807"
            />
            <g>
              <g>
                <path
                  d="M45.1862,35.64053c1.41724-1.77266,2.37897-4.15282,2.12532-6.58506c-2.07464,0.10316-4.60634,1.36871-6.07207,3.14276
				c-1.31607,1.5192-2.4809,3.99902-2.17723,6.3293C41.39111,38.72954,43.71785,37.36345,45.1862,35.64053"
                />
                <path
                  d="M47.28506,38.98252c-3.38211-0.20146-6.25773,1.91951-7.87286,1.91951c-1.61602,0-4.08931-1.81799-6.76438-1.76899
				c-3.48177,0.05114-6.71245,2.01976-8.4793,5.15079c-3.63411,6.2636-0.95904,15.55471,2.57494,20.65606
				c1.71618,2.5238,3.78447,5.30269,6.50976,5.20287c2.57494-0.10104,3.58421-1.66732,6.71416-1.66732
				c3.12765,0,4.03679,1.66732,6.76252,1.61681c2.82665-0.05054,4.59381-2.52506,6.30997-5.05132
				c1.96878-2.877,2.77473-5.65498,2.82542-5.80748c-0.0507-0.05051-5.45058-2.12204-5.50065-8.33358
				c-0.05098-5.20101,4.23951-7.6749,4.44144-7.82832C52.3832,39.4881,48.5975,39.08404,47.28506,38.98252"
                />
              </g>
              <g>
                <path
                  d="M76.73385,31.94381c7.35096,0,12.4697,5.06708,12.4697,12.44437c0,7.40363-5.22407,12.49704-12.65403,12.49704h-8.13892
				v12.94318h-5.88037v-37.8846H76.73385z M68.41059,51.9493h6.74732c5.11975,0,8.0336-2.75636,8.0336-7.53479
				c0-4.77792-2.91385-7.50845-8.00727-7.50845h-6.77365V51.9493z"
                />
                <path
                  d="M90.73997,61.97864c0-4.8311,3.70182-7.79761,10.26583-8.16526l7.56061-0.44614v-2.12639
				c0-3.07185-2.07423-4.90959-5.53905-4.90959c-3.28251,0-5.33041,1.57492-5.82871,4.04313h-5.35574
				c0.31499-4.98859,4.56777-8.66407,11.3941-8.66407c6.69466,0,10.97377,3.54432,10.97377,9.08388v19.03421h-5.43472v-4.54194
				h-0.13065c-1.60125,3.07185-5.09341,5.01441-8.71623,5.01441C94.52078,70.30088,90.73997,66.94038,90.73997,61.97864z
				 M108.56641,59.4846v-2.17905l-6.8,0.41981c-3.38683,0.23649-5.30306,1.73291-5.30306,4.09579
				c0,2.41504,1.99523,3.99046,5.04075,3.99046C105.46823,65.81161,108.56641,63.08108,108.56641,59.4846z"
                />
                <path
                  d="M119.34167,79.9889v-4.5946c0.4193,0.10483,1.36425,0.10483,1.83723,0.10483c2.6252,0,4.04313-1.10245,4.90908-3.9378
				c0-0.05267,0.49931-1.68025,0.49931-1.70658l-9.97616-27.64562h6.14268l6.98432,22.47371h0.10432l6.98433-22.47371h5.9857
				l-10.34483,29.06304c-2.36186,6.69517-5.0924,8.84789-10.81577,8.84789C121.17891,80.12006,119.76098,80.06739,119.34167,79.9889
				z"
                />
              </g>
            </g>
          </g>
          <g></g>
          <g></g>
          <g></g>
          <g></g>
          <g></g>
          <g></g>
        </svg>
      </div>
    ),
  },
  {
    id: "google-pay",
    name: "Google Pay",
    icon: (
      <div className="-ml-2! w-12 h-8 flex items-center justify-center bg-transparent rounded">
        <svg
          version="1.1"
          id="G_Pay_Acceptance_Mark"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          x="0px"
          y="0px"
          viewBox="0 0 1094 742"
          enableBackground="new 0 0 1094 742"
          xmlSpace="preserve"
        >
          <path
            id="Base_1_"
            fill="#FFFFFF"
            d="M722.7,170h-352c-110,0-200,90-200,200l0,0c0,110,90,200,200,200h352c110,0,200-90,200-200l0,0
   C922.7,260,832.7,170,722.7,170z"
          />
          <path
            id="Outline"
            fill="#3C4043"
            d="M722.7,186.2c24.7,0,48.7,4.9,71.3,14.5c21.9,9.3,41.5,22.6,58.5,39.5
   c16.9,16.9,30.2,36.6,39.5,58.5c9.6,22.6,14.5,46.6,14.5,71.3s-4.9,48.7-14.5,71.3c-9.3,21.9-22.6,41.5-39.5,58.5
   c-16.9,16.9-36.6,30.2-58.5,39.5c-22.6,9.6-46.6,14.5-71.3,14.5h-352c-24.7,0-48.7-4.9-71.3-14.5c-21.9-9.3-41.5-22.6-58.5-39.5
   c-16.9-16.9-30.2-36.6-39.5-58.5c-9.6-22.6-14.5-46.6-14.5-71.3s4.9-48.7,14.5-71.3c9.3-21.9,22.6-41.5,39.5-58.5
   c16.9-16.9,36.6-30.2,58.5-39.5c22.6-9.6,46.6-14.5,71.3-14.5L722.7,186.2 M722.7,170h-352c-110,0-200,90-200,200l0,0
   c0,110,90,200,200,200h352c110,0,200-90,200-200l0,0C922.7,260,832.7,170,722.7,170L722.7,170z"
          />
          <g id="G_Pay_Lockup_1_">
            <g id="Pay_Typeface_3_">
              <path
                id="Letter_p_3_"
                fill="#3C4043"
                d="M529.3,384.2v60.5h-19.2V295.3H561c12.9,0,23.9,4.3,32.9,12.9
       c9.2,8.6,13.8,19.1,13.8,31.5c0,12.7-4.6,23.2-13.8,31.7c-8.9,8.5-19.9,12.7-32.9,12.7h-31.7V384.2z M529.3,313.7v52.1h32.1
       c7.6,0,14-2.6,19-7.7c5.1-5.1,7.7-11.3,7.7-18.3c0-6.9-2.6-13-7.7-18.1c-5-5.3-11.3-7.9-19-7.9h-32.1V313.7z"
              />
              <path
                id="Letter_a_3_"
                fill="#3C4043"
                d="M657.9,339.1c14.2,0,25.4,3.8,33.6,11.4c8.2,7.6,12.3,18,12.3,31.2v63h-18.3v-14.2h-0.8
       c-7.9,11.7-18.5,17.5-31.7,17.5c-11.3,0-20.7-3.3-28.3-10s-11.4-15-11.4-25c0-10.6,4-19,12-25.2c8-6.3,18.7-9.4,32-9.4
       c11.4,0,20.8,2.1,28.1,6.3v-4.4c0-6.7-2.6-12.3-7.9-17c-5.3-4.7-11.5-7-18.6-7c-10.7,0-19.2,4.5-25.4,13.6l-16.9-10.6
       C625.9,345.8,639.7,339.1,657.9,339.1z M633.1,413.3c0,5,2.1,9.2,6.4,12.5c4.2,3.3,9.2,5,14.9,5c8.1,0,15.3-3,21.6-9
       s9.5-13,9.5-21.1c-6-4.7-14.3-7.1-25-7.1c-7.8,0-14.3,1.9-19.5,5.6C635.7,403.1,633.1,407.8,633.1,413.3z"
              />
              <path
                id="Letter_y_3_"
                fill="#3C4043"
                d="M808.2,342.4l-64,147.2h-19.8l23.8-51.5L706,342.4h20.9l30.4,73.4h0.4l29.6-73.4H808.2z"
              />
            </g>
            <g id="G_Mark_1_">
              <path
                id="Blue_500"
                fill="#4285F4"
                d="M452.93,372c0-6.26-0.56-12.25-1.6-18.01h-80.48v33L417.2,387
       c-1.88,10.98-7.93,20.34-17.2,26.58v21.41h27.59C443.7,420.08,452.93,398.04,452.93,372z"
              />
              <path
                id="Green_500_1_"
                fill="#34A853"
                d="M400.01,413.58c-7.68,5.18-17.57,8.21-29.14,8.21c-22.35,0-41.31-15.06-48.1-35.36
       h-28.46v22.08c14.1,27.98,43.08,47.18,76.56,47.18c23.14,0,42.58-7.61,56.73-20.71L400.01,413.58z"
              />
              <path
                id="Yellow_500_1_"
                fill="#FABB05"
                d="M320.09,370.05c0-5.7,0.95-11.21,2.68-16.39v-22.08h-28.46
       c-5.83,11.57-9.11,24.63-9.11,38.47s3.29,26.9,9.11,38.47l28.46-22.08C321.04,381.26,320.09,375.75,320.09,370.05z"
              />
              <path
                id="Red_500"
                fill="#E94235"
                d="M370.87,318.3c12.63,0,23.94,4.35,32.87,12.85l24.45-24.43
       c-14.85-13.83-34.21-22.32-57.32-22.32c-33.47,0-62.46,19.2-76.56,47.18l28.46,22.08C329.56,333.36,348.52,318.3,370.87,318.3z"
              />
            </g>
          </g>
        </svg>
      </div>
    ),
  },
];

type PaymentMethodSelectorProps<
  T extends readonly string[] = readonly string[],
> = {
  onSelect: (method: T[number]) => void;
  allowedMethods?: T;
  defaultMethod?: T[number];
  asCard?: boolean;
  className?: string;
  header?: React.ReactNode;
};

export default function PaymentMethodSelector<T extends readonly string[]>({
  className,
  onSelect,
  allowedMethods,
  defaultMethod = "card",
  asCard = false,
  header,
}: PaymentMethodSelectorProps<T>) {
  const { applePay, googlePay, isLoading } = usePaymentMethods();

  // Filter payment methods based on availability and allowed methods
  const availableMethods = useMemo(() => {
    let methods = allowedMethods
      ? paymentMethods.filter((m) => allowedMethods.includes(m.id))
      : paymentMethods;

    // Filter based on payment method availability
    // Only show Apple Pay if it's available (on Apple devices with Apple Pay enabled)
    // Google Pay can be shown on both mobile and desktop (Chrome supports it)
    if (!isLoading) {
      methods = methods.filter((method) => {
        if (method.id === "apple-pay") {
          return applePay;
        }
        if (method.id === "google-pay") {
          return googlePay;
        }
        // Show all other methods (card, ideal, bancontact, etc.)
        return true;
      });
    }

    return methods;
  }, [allowedMethods, applePay, googlePay, isLoading]);

  const initialMethod =
    allowedMethods && !allowedMethods.includes(defaultMethod)
      ? (availableMethods[0]?.id ?? defaultMethod)
      : defaultMethod;

  const [selectedMethod, setSelectedMethod] =
    useState<T[number]>(initialMethod);

  // Update selected method if it's no longer available after loading
  useEffect(() => {
    if (!isLoading && availableMethods.length > 0) {
      const isCurrentMethodAvailable = availableMethods.some(
        (m) => m.id === selectedMethod,
      );
      if (!isCurrentMethodAvailable) {
        // If current method is not available, select the first available method
        const newMethod = availableMethods[0]?.id ?? defaultMethod;
        setSelectedMethod(newMethod as T[number]);
      }
    }
  }, [isLoading, availableMethods, selectedMethod, defaultMethod]);

  const handleProceed = () => {
    onSelect(selectedMethod);
  };

  const FooterComponent = () => {
    return (
      <Button
        onClick={handleProceed}
        className="px-4 sm:px-0 w-full bg-white hover:bg-gray-100 text-black font-semibold rounded-xl text-base transition-all shadow-lg hover:shadow-xl"
      >
        Proceed
      </Button>
    );
  };

  return (
    <CardWrapper asCard={asCard} footer={<FooterComponent />}>
      {/* <div className="mb-6 p-4 bg-[#8B1E1E]/30 border border-[#8B1E1E]/50 rounded-lg">
        <h3 className="text-red-200/90 font-semibold mb-2 text-sm">
          Important notice:
        </h3>
        <p className="text-red-200/70 text-xs leading-relaxed">
          Payments are securely processed by our payment providers. You will
          be redirected to complete your payment. This process may take a
          couple of minutes, please do not close this page.
        </p>
      </div> */}

      {/* Payment Methods Grid */}
      <div className={cn("mb-8", className)}>
        {header || (
          <h3 className="text-white text-sm font-semibold mb-4">
            Select Payment Method
          </h3>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {availableMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={`relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${selectedMethod === method.id
                ? "bg-[#8B1E1E]/40 border-[#DC143C] shadow-lg shadow-[#DC143C]/20"
                : "bg-black/40 border-[#8B1E1E]/30 hover:border-[#8B1E1E]/60 hover:bg-black/60"
                }`}
            >
              <div className="flex-shrink-0 text-white">{method.icon}</div>
              <span className="text-white font-medium text-left flex-grow">
                {method.name}
              </span>
              {selectedMethod === method.id && (
                <CheckCircle2 className="w-5 h-5 text-[#DC143C] flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>
      <FooterComponent />
    </CardWrapper>
  );
}

const CardWrapper = ({
  children,
  asCard,
  footer,
}: {
  children: React.ReactNode;
  asCard: boolean;
  footer?: React.ReactNode;
}) => {
  return !asCard ? (
    children
  ) : (
    <Card
      className="border-primary"
    // className="bg-gradient-to-br from-[#8B1E1E] via-[#6B1515] to-[#4A0E0E] flex items-center justify-center p-4"
    >
      {/* <div className="w-full max-w-2xl bg-black/60 backdrop-blur-sm border-2 border-[#8B1E1E] rounded-2xl overflow-hidden"> */}

      {/* Header */}
      <CardHeader>
        <CardTitle>
          <h2 className="text-3xl font-bold text-white mb-2">Payment</h2>
        </CardTitle>
        <CardDescription className="text-red-200/70 text-sm leading-relaxed">
          Please select your preferred payment method to complete the
          transaction.
        </CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer ? <CardFooter>{footer}</CardFooter> : null}
      {/* </div> */}
    </Card>
  );
};

export const PaymentMethodSelectorSkeleton = ({
  count = 4,
  withBackground = false,
}: {
  count?: number;
  withBackground?: boolean;
}) => {
  return (
    <div className={cn("w-full mx-auto p-6", {
      'bg-gradient-to-br from-zinc-900 via-red-950/20 to-zinc-900 rounded-2xl border border-red-900/30 shadow-2xl': withBackground,
    })}>
      {/* Title skeleton */}
      {/* <div className="h-8 w-48 bg-zinc-800/50 rounded-lg mb-2 animate-pulse" /> */}

      {/* Subtitle skeleton */}
      {/* <div className="h-4 w-64 bg-zinc-800/50 rounded mb-8 animate-pulse" /> */}

      {/* Payment options grid */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-4 bg-zinc-900/40 border border-zinc-800/50 rounded-xl animate-pulse"
          >
            {/* Icon skeleton */}
            <div className="w-12 h-12 bg-zinc-800/50 rounded-lg flex-shrink-0" />

            {/* Text skeleton */}
            <div className="flex-1">
              <div className="h-5 w-24 bg-zinc-800/50 rounded" />
            </div>

            {/* Radio button skeleton */}
            <div className="w-5 h-5 bg-zinc-800/50 rounded-full flex-shrink-0" />
          </div>
        ))}
      </div>

      {/* Button skeleton */}
      <div className="h-14 w-full bg-white/20 rounded-xl animate-pulse" />
    </div>
  );
};
