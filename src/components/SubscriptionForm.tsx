import React, { useEffect, useState, useMemo } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, DollarSign, Calendar, Tag, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { addSubscription } from '../lib/subscriptions';

// --- Schema (single source of truth)
// IMPORTANT: use z.number() here (not z.coerce.number())
const subscriptionSchema = z.object({
  name: z.string().min(2, 'Service name is required'),
  cost: z.number().min(0.01, 'Cost must be greater than 0'),
  billing_cycle: z.enum(['weekly', 'monthly', 'yearly']),
  next_renewal_date: z.string().min(1, 'Date is required'),
  category: z.string().min(1, 'Category is required'),
  is_trial: z.boolean(),
  currency: z.string().min(2, 'Currency is required'),
});

type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

type QuickAddPreset = {
  name: string;
  cost: number;
  category: string;
  billing_cycle: 'weekly' | 'monthly' | 'yearly';
};

const quickAddPresets: QuickAddPreset[] = [
  { name: 'Netflix', cost: 15.49, category: 'Entertainment', billing_cycle: 'monthly' },
  { name: 'Spotify', cost: 9.99, category: 'Music', billing_cycle: 'monthly' },
];

const defaultFormValues: SubscriptionFormData = {
  name: '',
  cost: 0,
  billing_cycle: 'monthly',
  next_renewal_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
  category: '',
  is_trial: false,
  currency: 'USD',
};

interface SubscriptionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (addAnother?: boolean) => void;
}

const SubscriptionForm: React.FC<SubscriptionFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [customCategories, setCustomCategories] = useState<string[]>(['Personal', 'Utilities']);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    setFocus,
  } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: defaultFormValues,
  });

  const watchedIsTrial = watch('is_trial');
  const [confirmationData, setConfirmationData] = useState<SubscriptionFormData | null>(null);

  useEffect(() => {
    if (isOpen) {
      reset(defaultFormValues);
      setIsAddingCategory(false);
      setNewCategory('');
      setTimeout(() => setFocus('name'), 100);
    }
  }, [isOpen, reset, setFocus]);

  const proceedWithSubmission = async (data: SubscriptionFormData) => {
    try {
      await addSubscription(data);
      toast.success(
        (t) => (
          <div className="flex items-center justify-between w-full">
            <span>Subscription added!</span>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                onSuccess(true);
              }}
              className="ml-4 bg-indigo-700 text-white px-3 py-1 rounded-md text-sm"
            >
              Add Another
            </button>
          </div>
        ),
        { duration: 5000 }
      );
      onSuccess();
      handleClose();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to add subscription.');
    } finally {
      setConfirmationData(null);
    }
  };

  const handleFormSubmit: SubmitHandler<SubscriptionFormData> = (data) => {
    if (data.cost > 1000 && !confirmationData) {
      setConfirmationData(data);
      return;
    }
    proceedWithSubmission(data);
  };

  const handleClose = () => {
    setConfirmationData(null);
    onClose();
  };

  const handleQuickAdd = (preset: QuickAddPreset) => {
    const fullData: SubscriptionFormData = { ...defaultFormValues, ...preset };
    reset(fullData);
    toast.success(`${preset.name} details pre-filled!`);
  };

  const handleAddNewCategory = () => {
    const label = newCategory.trim();
    if (label && !customCategories.includes(label)) {
      setCustomCategories((prev) => [...prev, label]);
      setValue('category', label, { shouldValidate: true, shouldDirty: true });
      setIsAddingCategory(false);
      setNewCategory('');
    }
  };

  const onCategoryChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const value = e.target.value;
    if (value === 'add_new') {
      setIsAddingCategory(true);
      setValue('category', '', { shouldValidate: true, shouldDirty: true });
    } else {
      setValue('category', value, { shouldValidate: true, shouldDirty: true });
    }
  };

  const allCategories = useMemo(
    () => [
      'Entertainment',
      'Productivity',
      'Health & Fitness',
      'Education',
      'Business',
      'Music',
      'Cloud Storage',
      ...customCategories,
      'Other',
    ],
    [customCategories]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {confirmationData ? 'Confirm High Cost' : 'Add New Subscription'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {confirmationData ? 'Please verify this amount is correct.' : 'Track a new recurring payment'}
                </p>
              </div>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={24} />
              </button>
            </div>

            {confirmationData ? (
              <div className="p-6 text-center space-y-4">
                <div className="text-sm text-gray-700">
                  You’re adding <span className="font-semibold">{confirmationData.name}</span> with a cost of{' '}
                  <span className="font-semibold">
                    {confirmationData.currency} {confirmationData.cost.toFixed(2)}
                  </span>
                  . Proceed?
                </div>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setConfirmationData(null)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => proceedWithSubmission(confirmationData)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 flex items-center space-x-2 mb-2">
                    <Zap size={16} />
                    <span>Quick Add</span>
                  </label>
                  <div className="flex space-x-2">
                    {quickAddPresets.map((preset) => (
                      <button
                        type="button"
                        key={preset.name}
                        onClick={() => handleQuickAdd(preset)}
                        className="flex-1 bg-gray-100 text-gray-800 text-sm py-2 rounded-lg hover:bg-gray-200"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        {...register('name')}
                        placeholder="e.g., Notion, Adobe..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg"
                        autoComplete="off"
                      />
                    </div>
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                  </div>

                  <div className="flex space-x-2">
                    <div className="flex-grow">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cost</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          inputMode="decimal"
                          placeholder="0.00"
                          {...register('cost', { valueAsNumber: true })}
                          className="w-full pl-10 pr-4 py-2 border rounded-lg"
                        />
                      </div>
                      {errors.cost && <p className="text-red-500 text-sm mt-1">{errors.cost.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                      <select {...register('currency')} className="py-2 px-3 border rounded-lg h-[42px]">
                        <option>USD</option>
                        <option>EUR</option>
                        <option>GBP</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Billing Cycle</label>
                    <select {...register('billing_cycle')} className="w-full py-2 px-3 border rounded-lg">
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    {isAddingCategory ? (
                      <div className="flex space-x-2">
                        <input
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="New category name"
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                        <button type="button" onClick={handleAddNewCategory} className="bg-green-600 text-white px-3 rounded-lg">
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingCategory(false);
                            setValue('category', '', { shouldValidate: true });
                          }}
                          className="px-3 rounded-lg border"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <select onChange={onCategoryChange} value={watch('category')} className="w-full py-2 px-3 border rounded-lg">
                        <option value="">-- Select a Category --</option>
                        {allCategories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                        <option value="add_new" className="font-bold text-indigo-600">
                          -- Add New Category --
                        </option>
                      </select>
                    )}
                    {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
                  </div>

                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                    <label htmlFor="is_trial" className="text-sm font-medium text-gray-700">
                      Is this a free trial?
                    </label>
                    <input
                      {...register('is_trial')}
                      type="checkbox"
                      id="is_trial"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {watchedIsTrial ? 'Trial End Date' : 'Next Renewal Date'}
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input {...register('next_renewal_date')} type="date" className="w-full pl-10 pr-4 py-2 border rounded-lg" />
                    </div>
                    {errors.next_renewal_date && <p className="text-red-500 text-sm mt-1">{errors.next_renewal_date.message}</p>}
                  </div>

                  <div className="flex space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center space-x-2 font-medium"
                    >
                      <Plus size={18} />
                      <span>{isSubmitting ? 'Adding...' : 'Add Subscription'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SubscriptionForm;
