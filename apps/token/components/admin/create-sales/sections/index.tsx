'use client';

import { useInputOptionsContext } from '@/components/hooks/use-input-options';
import { motion } from '@mjs/ui/components/motion';
import { Button } from '@mjs/ui/primitives/button';
import { FormInput } from '@mjs/ui/primitives/form-input';
import { UseAppForm, useFormContext } from '@mjs/ui/primitives/form/index';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { formSchemaShape, InputProps } from '../utils';
import { SaftEditor } from '../saft-editor';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@mjs/ui/primitives/card';
import { Icons } from '@mjs/ui/components/icons';
import { EditableFormField } from '@mjs/ui/primitives/form-input/editable-field';
import { CardContainer } from '@mjs/ui/components/cards';
import { cn } from '@mjs/ui/lib/utils';
import { useSale } from '@/lib/services/api';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@mjs/ui/primitives/dialog';
import { RadioGroup, RadioGroupItem } from '@mjs/ui/primitives/radio-group';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@mjs/ui/primitives/tabs';
import { Label } from '@mjs/ui/primitives/label';
import { Building2 } from 'lucide-react';
import { Input } from '@mjs/ui/primitives/input';
import { Textarea } from '@mjs/ui/primitives/textarea';

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
}: {
  saleId?: string;
  className?: string;
}) => {
  const t = useTranslations('admin.sales.create.basic');
  const { data, isLoading } = useSale(saleId);

  const form = useFormContext() as unknown as UseAppForm;
  const { options } = useInputOptionsContext();

  useEffect(() => {
    if (data && !isLoading) {
      const sale = data.sale;
      form.reset(sale);
    }
  }, [data, isLoading]);

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
  saleId,
  className,
}: {
  saleId?: string;
  className?: string;
}) => {
  const { options } = useInputOptionsContext();
  const form = useFormContext() as unknown as UseAppForm;
  const stepValue = form.getFieldValue('banks');
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
    const value = (form.getFieldValue('banks') as unknown[]) || [];
    form.setFieldValue(
      'banks',
      value.concat(Array.isArray(field) ? field : [field])
    );
  };

  useEffect(() => {
    if (!stepValue) {
      const value = form.getFieldValue('banks') as unknown[];
      if (!value?.length) {
        handleAddField(initialFields);
      }
    }
  }, [stepValue]);

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
                    onClick={() => handleAddField()}
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
                return (
                  <>
                    {(field.state.value as unknown[])?.map((_, index) => (
                      <form.Field key={index} name={`banks[${index}]`}>
                        {(itemField) => {
                          return <div className='grid grid-cols-2 gap-4'></div>;
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
          <BankDetailsTabs />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

interface BankAccountForm {
  bankName: string;
  accountName: string;
  iban: string;
  swift: string;
  address: string;
  memo: string;
}

const BankDetailsTabs = () => {
  const existingAccounts = [
    {
      id: '1',
      bankName: 'Bank of America',
      accountName: 'Company Account',
      iban: 'US123456789',
      swift: 'BOFAUS3N',
      address: '100 Main St, New York, NY 10001',
      memo: 'Primary business account',
    },
    {
      id: '2',
      bankName: 'Chase Bank',
      accountName: 'Operating Account',
      iban: 'US987654321',
      swift: 'CHASUS33',
      address: '200 Park Ave, New York, NY 10002',
      memo: 'Secondary business account',
    },
    {
      id: '3',
      bankName: 'Wells Fargo',
      accountName: 'Corporate Account',
      iban: 'US456789123',
      swift: 'WFBIUS6S',
      address: '300 Madison Ave, New York, NY 10003',
      memo: 'Reserve account',
    },
  ];
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('existing');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [formData, setFormData] = useState<BankAccountForm>({
    bankName: '',
    accountName: '',
    iban: '',
    swift: '',
    address: '',
    memo: '',
  });

  const handleInputChange = () => {};
  return (
    <>
      <div className='max-h-[500px] overflow-y-auto'>
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='existing'>Select Existing</TabsTrigger>
            <TabsTrigger value='new'>Add New Account</TabsTrigger>
          </TabsList>

          <TabsContent value='existing' className='space-y-4'>
            <RadioGroup
              value={selectedAccount}
              onValueChange={setSelectedAccount}
            >
              <div className='space-y-3'>
                {existingAccounts.map((account) => (
                  <div key={account.id}>
                    <RadioGroupItem
                      value={account.id}
                      id={account.id}
                      className='peer sr-only'
                    />
                    <Label htmlFor={account.id} className='flex cursor-pointer'>
                      <Card className='w-full transition-colors hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent/50'>
                        <CardHeader className='pb-3'>
                          <div className='flex items-center gap-3'>
                            <Building2 className='h-5 w-5 text-muted-foreground' />
                            <div className='flex-1'>
                              <CardTitle className='text-base'>
                                {account.bankName}
                              </CardTitle>
                              {account.accountName && (
                                <CardDescription className='text-sm'>
                                  {account.accountName}
                                </CardDescription>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className='pt-0'>
                          <div className='grid grid-cols-1 gap-2 text-sm text-muted-foreground'>
                            {account.iban && (
                              <div>
                                <span className='font-medium'>IBAN:</span>{' '}
                                {account.iban}
                              </div>
                            )}
                            {account.swift && (
                              <div>
                                <span className='font-medium'>SWIFT:</span>{' '}
                                {account.swift}
                              </div>
                            )}
                            {account.address && (
                              <div>
                                <span className='font-medium'>Address:</span>{' '}
                                {account.address}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </TabsContent>

          <TabsContent value='new' className='space-y-4'>
            <div className='grid gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='bankName'>
                  Bank Name <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='bankName'
                  placeholder='Enter bank name'
                  value={formData.bankName}
                  onChange={(e) =>
                    handleInputChange('bankName', e.target.value)
                  }
                />
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='accountName'>Account Name</Label>
                <Input
                  id='accountName'
                  placeholder='Enter account name (optional)'
                  value={formData.accountName}
                  onChange={(e) =>
                    handleInputChange('accountName', e.target.value)
                  }
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='iban'>IBAN</Label>
                  <Input
                    id='iban'
                    placeholder='Enter IBAN (optional)'
                    value={formData.iban}
                    onChange={(e) => handleInputChange('iban', e.target.value)}
                  />
                </div>

                <div className='grid gap-2'>
                  <Label htmlFor='swift'>SWIFT Code</Label>
                  <Input
                    id='swift'
                    placeholder='Enter SWIFT code (optional)'
                    value={formData.swift}
                    onChange={(e) => handleInputChange('swift', e.target.value)}
                  />
                </div>
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='address'>Bank Address</Label>
                <Textarea
                  id='address'
                  placeholder='Enter bank address (optional)'
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={3}
                />
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='memo'>Memo</Label>
                <Input
                  id='memo'
                  placeholder='Add any additional notes (optional)'
                  value={formData.memo}
                  onChange={(e) => handleInputChange('memo', e.target.value)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <DialogFooter>
        <Button variant='outline' onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
        <Button>
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
