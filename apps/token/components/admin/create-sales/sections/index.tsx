"use client";

import { CardContainer } from "@mjs/ui/components/cards";
import { Icons } from "@mjs/ui/components/icons";
import { motion } from "@mjs/ui/components/motion";
import { useActionListener } from "@mjs/ui/hooks/use-action-listener";
import { cn } from "@mjs/ui/lib/utils";
import { Button } from "@mjs/ui/primitives/button";
import {
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mjs/ui/primitives/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@mjs/ui/primitives/dialog";
import {
  UseAppForm,
  useAppForm,
  useFormContext,
} from "@mjs/ui/primitives/form/index";
import { FormInput } from "@mjs/ui/primitives/form-input";
import { EditableFormField, FormFieldData } from "@mjs/ui/primitives/form-input/editable-field";
import { SelectOption } from "@mjs/ui/primitives/form-input/types";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@mjs/ui/primitives/tabs";
import { Banknote } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useEffect, useRef, useState } from "react";
import { SaleInformationItem } from "@/common/schemas/dtos/sales/information";
import { Document } from "@/common/schemas/generated";
import { BankDetailsCard } from "@/components/bank-details";
import { Banner } from "@/components/banner";
import { useInputOptionsContext } from "@/components/hooks/use-input-options";
import { Placeholder } from "@/components/placeholder";
import { PulseLoader } from "@/components/pulse-loader";
import { disassociateBankDetailsFromSale } from "@/lib/actions/admin";
import {
  useSale,
  useSaleBanks,
  useSaleDocuments,
  useSaleInformation,
} from "@/lib/services/api";
import { getQueryClient } from "@/lib/services/query";
import { SaftEditor } from "../saft-editor";
import {
  BankDetailsForm,
  BankDetailsSchema,
  formSchemaShape,
  InputProps,
} from "../utils";

const getInputProps = (
  key: keyof typeof formSchemaShape,
  t: ReturnType<typeof useTranslations>,
) => {
  const inputProps = InputProps[key];

  if (inputProps.type === "hidden") {
    return null;
  }

  return {
    name: key,
    type: inputProps.type,
    className: inputProps && 'className' in inputProps ? inputProps.className as string : undefined,
    label: t(`${key}.label`),
    description: t(`${key}.description`),
    //@ts-expect-error fixme
    optionKey: inputProps?.optionKey,
    //@ts-expect-error fixme
    props: inputProps?.inputProps || {},
  };
};

export const TokenInformation = ({
  saleId,
  className,
  step,
}: {
  saleId?: string;
  className?: string;
  step?: number;
}) => {
  const t = useTranslations("admin.sales.create.basic");
  const { data, isLoading } = useSale(saleId);

  const form = useFormContext() as unknown as UseAppForm;
  const { options } = useInputOptionsContext();

  useEffect(() => {
    if (data && !isLoading) {
      const sale = data.sale;

      form.reset(sale);
      if (sale?.tokenContractChainId) {
        form.setFieldValue("tokenContractChainId", sale.tokenContractChainId);
      }
      if (sale?.currency) {
        form.setFieldValue("currency", sale.currency);
      }
    }
  }, [data, isLoading, options, step]);

  // // Preserve form values when options are loaded
  // useEffect(() => {
  //   if (options && data?.sale) {
  //     const sale = data.sale;
  //     // Always ensure the form values are set correctly when options are available
  //     if (sale.tokenContractChainId) {
  //       form.setFieldValue('tokenContractChainId', sale.tokenContractChainId);
  //     }
  //     if (sale.currency) {
  //       form.setFieldValue('currency', sale.currency);
  //     }
  //   }
  // }, [options, data?.sale]);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  return (
    <motion.div {...animation}>
      <CardContainer
        title="Basic Information"
        description="Manage basic information"
        className={className}
      >
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
          {Object.keys(formSchemaShape).map((key) => {
            const input = getInputProps(key as keyof typeof formSchemaShape, t);
            if (!input) {
              return null;
            }
            const { name, type, label, description, props, optionKey } = input;
            if (optionKey && options) {
              props.options = options[optionKey as keyof typeof options];
            }

            // Disable toWalletsAddress field when editing an existing sale
            const isDisabled = saleId && name === "toWalletsAddress";
            const disabledMessage = isDisabled ? "This field cannot be edited after the sale is created" : undefined;
            const finalProps = isDisabled ? { ...props, disabled: true } : props;

            return (
              <li key={key} className="">
                <FormInput
                  className={input.className}
                  name={name}
                  type={type}
                  label={label}
                  description={disabledMessage ?? description}
                  message={true}
                  inputProps={finalProps}
                  descriptionClassName={"text-secondary"}
                />
              </li>
            );
          })}
        </ul>
      </CardContainer>
    </motion.div>
  );
};

export const SaftInformation = ({
  saleId,
  className,
}: {
  saleId?: string;
  className?: string;
}) => {
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);
  if (!saleId) {
    //TODO! improve
    return <div>No saleId: Create the sale on the first step</div>;
  }
  return (
    <motion.div {...animation}>
      <CardContainer
        title="SAFT Configuration"
        description="Manage SAFT shown to your investors when signing up."
        className={className}
      >
        <SaftEditor
          saleId={saleId}
          placeholder={
            "Create or paste the SAFT content to generate a signeable version"
          }
        />
      </CardContainer>
    </motion.div>
  );
};

export const ProjectInformation = ({
  saleId,
  className,
}: {
  saleId?: string;
  className?: string;
}) => {
  const containerRef = useRef<HTMLUListElement>(null);
  const { data: info, isLoading: isInfoLoading } = useSaleInformation(saleId);
  const { data: existing, isLoading: isDocsLoading } = useSaleDocuments(saleId);
  const form = useFormContext() as unknown as UseAppForm;
  const stepValue = form.getFieldValue("information");
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  const handleAddField = (
    field: FormFieldData | FormFieldData[] = {
      label: "New Field",
      type: "textarea",
      value: "",
    },
  ) => {
    const value = (form.getFieldValue("information") as unknown[]) || [];
    form.setFieldValue(
      "information",
      value.concat(Array.isArray(field) ? field : [field]),
    );
  };


  const isLoading = isInfoLoading || isDocsLoading;


  useEffect(() => {

    // INIT
    if (!isLoading) {
      const value =
        getInformationDefaultValues(info, null) //existing)

      const stepValue = form.getFieldValue("information") as FormFieldData[];

      // Load default information values
      if (!stepValue) {
        handleAddField(value);
      }
    }
  }, [stepValue, isLoading, info, existing]);

  if (!saleId) {
    return <div>No saleId</div>;
  }

  const handleClickPlusButton = () => {
    handleAddField();
    // Focus and scroll to the newly added field(s)
    setTimeout(() => {
      if (containerRef.current) {
        const lastLiElement = containerRef.current.querySelector('li:last-child');
        if (lastLiElement) {
          const textareaElement = lastLiElement.querySelector('textarea');
          if (textareaElement) {
            // Scroll the field into view
            textareaElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });

            // Focus the field
            (textareaElement as HTMLTextAreaElement).focus({
              preventScroll: true,
            });
          }
        }
      }
    }, 100); // Small delay to ensure DOM is updated
  };


  return (
    <motion.div {...animation}>
      <CardContainer
        className={className}
        header={
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex-1">Project Information</CardTitle>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={handleClickPlusButton}
                type="button"
              >
                <Icons.plus className="w-4 h-4" />
                <span className="sr-only">Add information field</span>
              </Button>
            </div>
            <CardDescription>Manage project information</CardDescription>
          </CardHeader>
        }
      >
        <div className="flex flex-col gap-4">
          {isLoading && <PulseLoader text="Loading information..." />}
          {!isLoading && (
            <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4" ref={containerRef}>
              <form.Field name="information" mode="array">
                {(field) => {
                  return (
                    <>
                      {(field.state.value as unknown[])?.map((_, index) => {
                        return <li key={`list-${index}`}>
                          <form.Field key={index} name={`information[${index}]`}>
                            {(itemField) => (
                              <EditableFormField
                                field={itemField}
                                index={index}
                                onRemove={(idx) => field.removeValue(idx)}
                              />
                            )}
                          </form.Field>
                        </li>;
                      })}
                      {(field.state.value as unknown[])?.length === 0 && (
                        <Placeholder
                          title="No fields yet"
                          description="Click the + sign to add a new field"
                          className='col-span-2'
                        />
                      )}
                    </>
                  );
                }}
              </form.Field>
            </ul>
          )}
        </div>
      </CardContainer>
    </motion.div>
  );
};

export const PaymentInformation = ({
  className,
  saleId,
}: {
  className?: string;
  saleId?: string;
}) => {
  const { options } = useInputOptionsContext();
  const { data: saleBanks, isLoading } = useSaleBanks(saleId || "");

  const bankList = options?.banks;
  const query = useSearchParams();

  const form = useFormContext() as unknown as UseAppForm;
  const action = useActionListener(useAction(disassociateBankDetailsFromSale), {
    successMessage: "Bank details removed from sale",
    errorMessage: "Error removing bank details from sale",
  });

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  const handleAddBankToForm = (field: BankDetailsForm | BankDetailsForm[]) => {
    const value = (form.getFieldValue("banks") as BankDetailsForm[]) || [];
    const newFields = Array.isArray(field) ? field : [field];

    // Filter out duplicates based on id OR iban + currency combination
    const uniqueNewFields = newFields.filter((newField) => {
      const isDuplicate = value.some((existingField) => {
        // Check by id if both have ids
        if (
          newField.id &&
          existingField.id &&
          newField.id === existingField.id
        ) {
          return true;
        }
        // Check by iban + currency combination
        if (
          newField.iban &&
          existingField.iban &&
          newField.currency &&
          existingField.currency &&
          newField.iban === existingField.iban &&
          newField.currency === existingField.currency
        ) {
          return true;
        }
        return false;
      });
      return !isDuplicate;
    });

    form.setFieldValue("banks", value.concat(uniqueNewFields));
  };

  const handleRemoveBankFromSale = (fieldId: string) => {
    const saleId = form.getFieldValue("saleId") || query.get("saleId");
    if (fieldId && saleId) {
      action
        .executeAsync({
          saleId: saleId as string,
          bankId: fieldId,
        })
        .then(() => {
          const queryClient = getQueryClient();
          queryClient.invalidateQueries({
            queryKey: ["sales", saleId, "banks"],
          });
        });
    }
  };

  useEffect(() => {
    if (
      saleBanks &&
      !isLoading &&
      !(form.getFieldValue("banks") as unknown[])?.length
    ) {
      handleAddBankToForm(saleBanks.banks as unknown as BankDetailsForm[]);
    }
  }, [saleBanks, isLoading]);

  if (!saleId) {
    return <div>No saleId: Create the sale on the first step</div>;
  }

  return (
    <motion.div {...animation}>
      <Dialog>
        <CardContainer
          className={className}
          header={
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex-1">Payment Information</CardTitle>

                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    type="button"
                  >
                    <Icons.plus className="w-4 h-4" />
                    <span className="sr-only">Add bank details</span>
                  </Button>
                </DialogTrigger>
              </div>
              <CardDescription className="text-secondary">
                Optinally add banking details to receive payments in different
                currencies
              </CardDescription>
            </CardHeader>
          }
        >
          <ul className="flex flex-col gap-4">
            <form.Field name="banks" mode="array">
              {(field) => {
                if (!(field.state.value as unknown[])?.length) {
                  return (
                    <Placeholder
                      title="No bank accounts found"
                      description="Add a new bank account to get started"
                      icon={Banknote}
                    >
                      <Banner
                        className="max-w-[370px] mt-4"
                        size={"sm"}
                        variant={"info"}
                        message="User will still be able to pay using ON-RAMP provider if no bank account details are added"
                      />
                    </Placeholder>
                  );
                }
                return (
                  <>
                    {(field.state.value as unknown[])?.map((_, index) => (
                      <form.Field key={index} name={`banks[${index}]`}>
                        {(itemField) => {
                          return (
                            <BankDetailsCard
                              data={itemField.state.value as BankDetailsForm}
                              //@ts-expect-error wontfix
                              key={itemField.state.value?.iban || index}
                              index={index}
                              onRemove={(idx) => {
                                //@ts-expect-error wontfix
                                const id = itemField.state.value?.id;
                                field.removeValue(Number(idx));
                                if (id) {
                                  const fieldId = String(id);
                                  handleRemoveBankFromSale(fieldId);
                                }
                              }}
                            />
                          );
                        }}
                      </form.Field>
                    ))}
                    {(field.state.value as unknown[])?.length === 0 && (
                      <Placeholder
                        title="No fields yet"
                        description="Click the + sign to add a new field"
                      />
                    )}
                  </>
                );
              }}
            </form.Field>
          </ul>
        </CardContainer>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add bank details</DialogTitle>
          </DialogHeader>
          {bankList && (
            <form.Subscribe
              selector={(state) => ({
                //@ts-expect-error wontfix
                banks: state.values?.banks || [],
              })}
            >
              {({ banks }) => (
                <BankDetailsTabs
                  bankList={bankList}
                  initialSelected={banks}
                  onAdd={handleAddBankToForm}
                  currencies={options?.fiatCurrencies || []}
                />
              )}
            </form.Subscribe>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

const BankDetailsTabs = ({
  bankList,
  onAdd,
  currencies,
  initialSelected,
}: {
  bankList: SelectOption[];
  currencies: SelectOption[];
  selected?: string;
  setSelected?: (value: string) => void;
  initialSelected?: BankDetailsForm[];
  onAdd: (value: BankDetailsForm | BankDetailsForm[]) => void;
}) => {
  const closeBtn = useRef<HTMLButtonElement>(null);
  const [activeTab, setActiveTab] = useState(
    !bankList?.length ? "new" : "existing",
  );
  const [selectedAccounts, setSelectedAccounts] = useState<BankDetailsForm[]>(
    initialSelected || [],
  );
  const [existingAccounts, setExistingAccounts] = useState<BankDetailsForm[]>(
    bankList?.map(
      ({ meta, id }) => ({ ...meta, id }) as unknown as BankDetailsForm,
    ) || [],
  );

  const form = useAppForm({
    validators: {
      //@ts-expect-error wontfix
      onSubmit: BankDetailsSchema,
    },
    onSubmit: ({ value }) => {
      setExistingAccounts((prev) => {
        return [...prev, value];
      });
      onAdd(value);
      form.reset();
      closeBtn.current?.click();
    },
    defaultValues: {
      bankName: "",
      accountName: "",
      iban: "",
      swift: "",
      currency: "",
      address: "",
      memo: "",
    },
  });

  const handleSubmit = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
    },
    [form],
  );

  const handleSelectAccounts = () => {
    onAdd(selectedAccounts as unknown as BankDetailsForm[]);
    closeBtn.current?.click();
  };

  useEffect(() => {
    if (initialSelected?.length) {
      setSelectedAccounts(initialSelected);
    }
  }, [initialSelected]);

  return (
    <>
      <div className="max-h-[500px] overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">Select Existing</TabsTrigger>
            <TabsTrigger value="new">Add New Account</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-4">
            <div className="space-y-3">
              {existingAccounts?.length ? (
                existingAccounts.map((data) => (
                  <div key={data.id}>
                    <BankDetailsCard
                      key={data.id}
                      data={data as unknown as BankDetailsForm}
                      selected={selectedAccounts.some(
                        (account) => account.id === data.id,
                      )}
                      onSelect={(da) => {
                        setSelectedAccounts((prev) => {
                          if (prev.some((account) => account.id === da.id)) {
                            return prev.filter(
                              (account) => account.id !== da.id,
                            );
                          }
                          return [...prev, da];
                        });
                      }}
                    />
                  </div>
                ))
              ) : (
                <Placeholder
                  title="No bank accounts found"
                  description="Add a new bank account to get started"
                  icon={Banknote}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="new" className="space-y-4 p-[1.5px]">
            <form.AppForm>
              <div className="grid gap-4">
                <FormInput
                  name="bankName"
                  type="text"
                  label="Bank Name"
                  inputProps={{
                    autoComplete: "off",
                    placeholder: "Enter bank name",
                    required: true,
                  }}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    name="accountName"
                    type="text"
                    label="Account Name"
                    inputProps={{
                      autoComplete: "off",
                      placeholder: "Enter account name (optional)",
                      required: false,
                    }}
                  />
                  <FormInput
                    name="currency"
                    type="select"
                    label="Accepted currency"
                    inputProps={{
                      autoComplete: "off",

                      required: false,
                      options: currencies || [],
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    name="iban"
                    type="text"
                    label="IBAN"
                    inputProps={{
                      placeholder: "Enter IBAN",
                      required: true,
                    }}
                  />

                  <FormInput
                    name="swift"
                    type="text"
                    label="SWIFT Code"
                    inputProps={{
                      placeholder: "Enter SWIFT code (optional)",
                      required: false,
                    }}
                  />
                </div>

                <FormInput
                  name="address"
                  type="text"
                  label="Bank Address"
                  inputProps={{
                    placeholder: "Enter bank address (optional)",
                    required: false,
                  }}
                />

                <FormInput
                  name="memo"
                  type="text"
                  label="Memo"
                  inputProps={{
                    placeholder: "Add any additional notes (optional)",
                    required: false,
                  }}
                />
              </div>
            </form.AppForm>
          </TabsContent>
        </Tabs>
      </div>

      <DialogFooter>
        <DialogClose asChild ref={closeBtn}>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button
          onClick={
            activeTab === "existing" ? handleSelectAccounts : handleSubmit
          }
        >
          {activeTab === "existing" ? "Select Account" : "Add Account"}
        </Button>
      </DialogFooter>
    </>
  );
};

export const SectionContainer = ({
  children,
  title = "Create a New Sale",
  className,
}: {
  children: React.ReactNode;
  title?: string;
  className?: string;
}) => {
  return (
    <div className={cn("flex flex-col gap-6 justify-center", className)}>
      <h3 className="text-2xl font-bold text-primary-foreground text-center md:text-left font-heading">
        {title}
      </h3>
      {children}
    </div>
  );
};

const animation = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 40 },
};




const initialFields = [
  {
    label: "Banner image",
    type: "file" as const,
    value: "",
    props: {
      required: true,
      type: "image",
      maxSizeMB: 10,
      isBanner: true,
    },
  },
  {
    label: "Token image",
    type: "file" as const,
    value: "",
    props: {
      required: true,
      type: "image",
      maxSizeMB: 10,
      isTokenImage: true,
    },
  },
  {
    label: "Summary",
    type: "textarea",
    value: "",
  },
] satisfies FormFieldData[];

const getInformationDefaultValues = (
  info: SaleInformationItem[] | undefined | null,
  docs: { images: Document[]; documents: Document[] } | null | undefined,
): FormFieldData[] => {
  const data = (info ? (SaleInformationItem.array().safeParse(info)?.data) : [...initialFields])?.map((v) => ({
    ...v,
    type: v.type === 'text' ? 'textarea' : v.type
  })).sort((a, b) => {
    if (a.type === 'file' && b.type !== 'file') return -1;
    if (a.type !== 'file' && b.type === 'file') return 1;
    return 0;
  }) as FormFieldData[];


  docs?.documents.forEach((doc) => {
    const isBanner = doc.name === 'Banner image';
    const isTokenImage = doc.name === 'Token image';
    data.unshift({
      type: "file",
      value: doc.url,
      label: doc.name,
      props: {
        maxSizeMB: 10,
        ...isBanner && { isBanner, required: true, type: 'image' },
        ...isTokenImage && { isTokenImage, required: true, type: 'image' },
      }
    });
  });
  docs?.images.forEach((img) => {
    const isBanner = img.name === 'Banner image';
    const isTokenImage = img.name === 'Token image';
    data.unshift({
      type: "file",
      value: img.url,
      label: img.name,
      props: {
        ...isBanner && { isBanner, required: true, type: 'image', },
        ...isTokenImage && { isTokenImage, required: true, type: 'image' },
        maxSizeMB: 10,
      }
    });
  });

  if (data.length === 0) {
    return initialFields as FormFieldData[];
  }

  // Here we need to ensure that if data does not have at this point at least one Banner image or Token image in the array, we need to add the default options
  const hasBannerImage = data.some(item =>
    item.label === 'Banner image' && (item.props?.isBanner || item.props?.type === 'image' || item.props?.type === 'document')
  );
  const hasTokenImage = data.some(item =>
    item.label === 'Token image' && (item.props?.isTokenImage || item.props?.type === 'image' || item.props?.type === 'document')
  );

  // Add default Banner image if missing
  if (!hasBannerImage) {
    data.unshift(initialFields[0]! as FormFieldData);
  }

  // Add default Token image if missing
  if (!hasTokenImage) {
    data.unshift(initialFields[1]! as FormFieldData);
  }

  return data;
};
