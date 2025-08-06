'use client';

import { useInputOptionsContext } from '@/components/hooks/use-input-options';
import { motion } from '@mjs/ui/components/motion';
import { Button } from '@mjs/ui/primitives/button';
import { FormInput } from '@mjs/ui/primitives/form-input';
import {
  useAppForm,
  UseAppForm,
  useFormContext,
} from '@mjs/ui/primitives/form/index';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BankDetailsForm,
  BankDetailsSchema,
  formSchemaShape,
  InputProps,
} from '../utils';
import { SaftEditor } from '../saft-editor';
import {
  CardDescription,
  CardHeader,
  CardTitle,
} from '@mjs/ui/primitives/card';
import { Icons } from '@mjs/ui/components/icons';
import { EditableFormField } from '@mjs/ui/primitives/form-input/editable-field';
import { CardContainer } from '@mjs/ui/components/cards';
import { cn } from '@mjs/ui/lib/utils';
import { useSale, useSaleBanks } from '@/lib/services/api';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@mjs/ui/primitives/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@mjs/ui/primitives/tabs';
import { Banknote } from 'lucide-react';
import { SelectOption } from '@mjs/ui/primitives/form-input/types';
import { Placeholder } from '@/components/placeholder';
import { useActionListener } from '@mjs/ui/hooks/use-action-listener';
import { useAction } from 'next-safe-action/hooks';
import { disassociateBankDetailsFromSale } from '@/lib/actions/admin';
import { useSearchParams } from 'next/navigation';
import { getQueryClient } from '@/app/providers';
import { BankDetailsCard } from '@/components/bank-details';

type ProjectInfoField = {
  label: string;
  type: string;
  value: string;
  props?: Record<string, unknown>;
};

const getInputProps = (
  key: keyof typeof formSchemaShape,
  t: ReturnType<typeof useTranslations>
) => {
  const inputProps = InputProps[key];

  if (inputProps.type === 'hidden') {
    return null;
  }

  return {
    name: key,
    type: inputProps.type,
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
  const t = useTranslations('admin.sales.create.basic');
  const { data, isLoading } = useSale(saleId);

  const form = useFormContext() as unknown as UseAppForm;
  const { options } = useInputOptionsContext();

  useEffect(() => {
    if (data && !isLoading) {
      const sale = data.sale;

      form.reset(sale);
      if (sale.tokenContractChainId) {
        form.setFieldValue('tokenContractChainId', sale.tokenContractChainId);
      }
      if (sale.currency) {
        form.setFieldValue('currency', sale.currency);
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
      behavior: 'smooth',
    });
  }, []);

  return (
    <motion.div {...animation}>
      <CardContainer
        title='Basic Information'
        description='Manage basic information'
        className={className}
      >
        <ul className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          {Object.keys(formSchemaShape).map((key) => {
            const input = getInputProps(key as keyof typeof formSchemaShape, t);
            if (!input) {
              return null;
            }
            const { name, type, label, description, props, optionKey } = input;
            if (optionKey && options) {
              props.options = options[optionKey as keyof typeof options];
              console.log(`🔧 Setting options for ${name}:`, {
                optionKey,
                options: options[optionKey as keyof typeof options],
                formValue: form.getFieldValue(name),
              });
            }

            return (
              <li key={key} className=''>
                <FormInput
                  name={name}
                  type={type}
                  label={label}
                  description={description}
                  message={true}
                  inputProps={props}
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
      behavior: 'smooth',
    });
  }, []);
  if (!saleId) {
    //TODO! improve
    return <div>No saleId</div>;
  }
  return (
    <motion.div {...animation}>
      <CardContainer
        title='SAFT Configuration'
        description='Manage SAFT shown to your investors when signing up.'
        className={className}
      >
        <SaftEditor
          saleId={saleId}
          placeholder={
            'Create or paste the SAFT content to generate a signeable version'
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
  const form = useFormContext() as unknown as UseAppForm;
  const stepValue = form.getFieldValue('information');
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  const handleAddField = (
    field: ProjectInfoField | ProjectInfoField[] = {
      label: 'New Field',
      type: 'textarea',
      value: '',
    }
  ) => {
    const value = (form.getFieldValue('information') as unknown[]) || [];
    form.setFieldValue(
      'information',
      value.concat(Array.isArray(field) ? field : [field])
    );
  };

  useEffect(() => {
    if (!stepValue) {
      const value = form.getFieldValue('information') as unknown[];
      if (!value?.length) {
        handleAddField(initialFields);
      }
    }
  }, [stepValue]);

  if (!saleId) {
    return <div>No saleId</div>;
  }

  return (
    <motion.div {...animation}>
      <CardContainer
        className={className}
        header={
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle className='flex-1'>Project Information</CardTitle>
              <Button
                variant='outline'
                size='icon'
                className='shrink-0'
                onClick={() => handleAddField()}
                type='button'
              >
                <Icons.plus className='w-4 h-4' />
                <span className='sr-only'>Add information field</span>
              </Button>
            </div>
            <CardDescription>Manage project information</CardDescription>
          </CardHeader>
        }
      >
        <div className='flex flex-col gap-4'>
          <ul className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            <form.Field name='information' mode='array'>
              {(field) => {
                return (
                  <>
                    {(field.state.value as unknown[])?.map((_, index) => (
                      <form.Field key={index} name={`information[${index}]`}>
                        {(itemField) => (
                          <EditableFormField
                            field={itemField}
                            index={index}
                            onRemove={(idx) => field.removeValue(idx)}
                          />
                        )}
                      </form.Field>
                    ))}
                    {(field.state.value as unknown[])?.length === 0 && (
                      <div className='text-center py-12 text-muted-foreground'>
                        No fields yet. Click the + sign to.
                      </div>
                    )}
                  </>
                );
              }}
            </form.Field>
          </ul>
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
  const { data: saleBanks, isLoading } = useSaleBanks(saleId || '');

  const bankList = options?.banks;
  const query = useSearchParams();

  const form = useFormContext() as unknown as UseAppForm;
  const action = useActionListener(useAction(disassociateBankDetailsFromSale), {
    successMessage: 'Bank details removed from sale',
    errorMessage: 'Error removing bank details from sale',
  });

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  const handleAddBankToForm = (field: BankDetailsForm | BankDetailsForm[]) => {
    const value = (form.getFieldValue('banks') as BankDetailsForm[]) || [];
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

    form.setFieldValue('banks', value.concat(uniqueNewFields));
  };

  const handleRemoveBankFromSale = (fieldId: string) => {
    const saleId = form.getFieldValue('saleId') || query.get('saleId');
    if (fieldId && saleId) {
      action
        .executeAsync({
          saleId: saleId as string,
          bankId: fieldId,
        })
        .then(() => {
          const queryClient = getQueryClient();
          queryClient.invalidateQueries({
            queryKey: ['sales', saleId, 'banks'],
          });
        });
    }
  };

  useEffect(() => {
    if (
      saleBanks &&
      !isLoading &&
      !(form.getFieldValue('banks') as unknown[])?.length
    ) {
      handleAddBankToForm(saleBanks.banks as unknown as BankDetailsForm[]);
    }
  }, [saleBanks, isLoading]);

  return (
    <motion.div {...animation}>
      <Dialog>
        <CardContainer
          className={className}
          header={
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle className='flex-1'>Payment Information</CardTitle>

                <DialogTrigger asChild>
                  <Button
                    variant='outline'
                    size='icon'
                    className='shrink-0'
                    type='button'
                  >
                    <Icons.plus className='w-4 h-4' />
                    <span className='sr-only'>Add bank details</span>
                  </Button>
                </DialogTrigger>
              </div>
              <CardDescription className='text-secondary'>
                Optinally add banking details to receive payments in different
                currencies
              </CardDescription>
            </CardHeader>
          }
        >
          <ul className='flex flex-col gap-4'>
            <form.Field name='banks' mode='array'>
              {(field) => {
                if (!(field.state.value as unknown[])?.length) {
                  return (
                    <Placeholder
                      title='No bank accounts found'
                      description='Add a new bank account to get started'
                      icon={Banknote}
                    />
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
                      <div className='text-center py-12 text-muted-foreground'>
                        No fields yet. Click the + sign to.
                      </div>
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
    !bankList?.length ? 'new' : 'existing'
  );
  const [selectedAccounts, setSelectedAccounts] = useState<BankDetailsForm[]>(
    initialSelected || []
  );
  const [existingAccounts, setExistingAccounts] = useState<BankDetailsForm[]>(
    bankList?.map(
      ({ meta, id }) => ({ ...meta, id }) as unknown as BankDetailsForm
    ) || []
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
      bankName: '',
      accountName: '',
      iban: '',
      swift: '',
      currency: '',
      address: '',
      memo: '',
    },
  });

  const handleSubmit = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
    },
    [form]
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
      <div className='max-h-[500px] overflow-y-auto'>
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='existing'>Select Existing</TabsTrigger>
            <TabsTrigger value='new'>Add New Account</TabsTrigger>
          </TabsList>

          <TabsContent value='existing' className='space-y-4'>
            <div className='space-y-3'>
              {existingAccounts?.length ? (
                existingAccounts.map((data) => (
                  <div key={data.id}>
                    <BankDetailsCard
                      key={data.id}
                      data={data as unknown as BankDetailsForm}
                      selected={selectedAccounts.some(
                        (account) => account.id === data.id
                      )}
                      onSelect={(da) => {
                        setSelectedAccounts((prev) => {
                          if (prev.some((account) => account.id === da.id)) {
                            return prev.filter(
                              (account) => account.id !== da.id
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
                  title='No bank accounts found'
                  description='Add a new bank account to get started'
                  icon={Banknote}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value='new' className='space-y-4 p-[1.5px]'>
            <form.AppForm>
              <div className='grid gap-4'>
                <FormInput
                  name='bankName'
                  type='text'
                  label='Bank Name'
                  inputProps={{
                    autoComplete: 'off',
                    placeholder: 'Enter bank name',
                    required: true,
                  }}
                />

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <FormInput
                    name='accountName'
                    type='text'
                    label='Account Name'
                    inputProps={{
                      autoComplete: 'off',
                      placeholder: 'Enter account name (optional)',
                      required: false,
                    }}
                  />
                  <FormInput
                    name='currency'
                    type='select'
                    label='Accepted currency'
                    inputProps={{
                      autoComplete: 'off',

                      required: false,
                      options: currencies || [],
                    }}
                  />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <FormInput
                    name='iban'
                    type='text'
                    label='IBAN'
                    inputProps={{
                      placeholder: 'Enter IBAN',
                      required: true,
                    }}
                  />

                  <FormInput
                    name='swift'
                    type='text'
                    label='SWIFT Code'
                    inputProps={{
                      placeholder: 'Enter SWIFT code (optional)',
                      required: false,
                    }}
                  />
                </div>

                <FormInput
                  name='address'
                  type='text'
                  label='Bank Address'
                  inputProps={{
                    placeholder: 'Enter bank address (optional)',
                    required: false,
                  }}
                />

                <FormInput
                  name='memo'
                  type='text'
                  label='Memo'
                  inputProps={{
                    placeholder: 'Add any additional notes (optional)',
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
          <Button variant='outline'>Cancel</Button>
        </DialogClose>
        <Button
          onClick={
            activeTab === 'existing' ? handleSelectAccounts : handleSubmit
          }
        >
          {activeTab === 'existing' ? 'Select Account' : 'Add Account'}
        </Button>
      </DialogFooter>
    </>
  );
};

export const SectionContainer = ({
  children,
  title = 'Create a New Sale',
  className,
}: {
  children: React.ReactNode;
  title?: string;
  className?: string;
}) => {
  return (
    <div className={cn('flex flex-col gap-6 justify-center', className)}>
      <h3 className='text-2xl font-bold text-primary-foreground text-center md:text-left font-heading'>
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
    label: 'Banner image',
    type: 'file',
    value: '',
    props: {
      required: true,
      type: 'image',
      maxSizeMB: 10,
      isBanner: true,
    },
  },
  {
    label: 'Token image',
    type: 'file',
    value: '',
    props: {
      required: true,
      type: 'image',
      maxSizeMB: 10,
      isTokenImage: true,
    },
  },
  {
    label: 'Summary',
    type: 'textarea',
    value: '',
  },
] satisfies ProjectInfoField[];
