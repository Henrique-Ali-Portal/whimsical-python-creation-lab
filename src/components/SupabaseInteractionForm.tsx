
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useInteractionForm } from '@/hooks/useInteractionForm';
import ProductSelector from './ProductSelector';

interface SupabaseInteractionFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

const SupabaseInteractionForm: React.FC<SupabaseInteractionFormProps> = ({ onCancel, onSuccess }) => {
  const {
    formData,
    products,
    selectedProducts,
    setSelectedProducts,
    isSubmitting,
    userStoreId,
    handleSubmit,
    handleInputChange,
  } = useInteractionForm(onSuccess);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="clientName">Client Name</Label>
        <Input
          id="clientName"
          value={formData.clientName}
          onChange={(e) => handleInputChange('clientName', e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          required
        />
      </div>

      <div>
        <Label>Status</Label>
        <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Quoted">Quoted</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
            <SelectItem value="Lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.status === 'Lost' && (
        <div>
          <Label>Reason for Loss</Label>
          <Select value={formData.reason} onValueChange={(value) => handleInputChange('reason', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select reason" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Lack of product">Lack of product</SelectItem>
              <SelectItem value="Stock Error">Stock Error</SelectItem>
              <SelectItem value="Delay">Delay</SelectItem>
              <SelectItem value="Price">Price</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="monetaryValue">Monetary Value (optional)</Label>
        <Input
          id="monetaryValue"
          type="number"
          step="0.01"
          value={formData.monetaryValue}
          onChange={(e) => handleInputChange('monetaryValue', e.target.value)}
          placeholder="0.00"
        />
      </div>

      <ProductSelector
        products={products}
        selectedProducts={selectedProducts}
        onProductsChange={setSelectedProducts}
      />

      {userStoreId && (
        <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
          This interaction will be associated with your current store.
        </div>
      )}

      <div className="flex space-x-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add Interaction'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default SupabaseInteractionForm;
