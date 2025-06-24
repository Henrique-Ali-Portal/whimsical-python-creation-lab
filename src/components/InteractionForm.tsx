
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Interaction } from '@/pages/Dashboard';
import ProductSearch from './ProductSearch';
import { Product } from './ProductUpload';

interface InteractionFormProps {
  onSubmit: (interaction: Omit<Interaction, 'id' | 'createdAt' | 'salespersonId'>) => void;
  onCancel: () => void;
}

const InteractionForm: React.FC<InteractionFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    clientName: '',
    description: '',
    status: '' as 'Closed' | 'Quoted' | 'Lost' | '',
    reason: '' as 'Lack of product' | 'Stock Error' | 'Delay' | 'Price' | 'Other' | '',
    monetaryValue: '',
    relatedProducts: [] as (Product | { id: string; description: string; isCustom: true })[]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientName || !formData.description || !formData.status) {
      return;
    }

    const interaction: Omit<Interaction, 'id' | 'createdAt' | 'salespersonId'> = {
      clientName: formData.clientName,
      description: formData.description,
      status: formData.status as 'Closed' | 'Quoted' | 'Lost',
      relatedProducts: formData.relatedProducts,
    };

    if (formData.status === 'Lost' && formData.reason) {
      interaction.reason = formData.reason as 'Lack of product' | 'Stock Error' | 'Delay' | 'Price' | 'Other';
    }

    if ((formData.status === 'Closed' || formData.status === 'Quoted') && formData.monetaryValue) {
      interaction.monetaryValue = parseFloat(formData.monetaryValue);
    }

    onSubmit(interaction);
  };

  const handleStatusChange = (value: string) => {
    setFormData({
      ...formData,
      status: value as 'Closed' | 'Quoted' | 'Lost',
      reason: '',
      monetaryValue: '',
      relatedProducts: []
    });
  };

  const showProductSelection = formData.status === 'Lost' && 
    ['Lack of product', 'Stock Error', 'Delay', 'Price'].includes(formData.reason);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="clientName">Client Name</Label>
        <Input
          id="clientName"
          value={formData.clientName}
          onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
          placeholder="Enter client name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Interaction Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the interaction"
          required
        />
      </div>

      <div className="space-y-3">
        <Label>Interaction Status</Label>
        <RadioGroup value={formData.status} onValueChange={handleStatusChange} className="space-y-2">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Closed" id="closed" />
            <Label htmlFor="closed">Closed</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Quoted" id="quoted" />
            <Label htmlFor="quoted">Quoted</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Lost" id="lost" />
            <Label htmlFor="lost">Lost</Label>
          </div>
        </RadioGroup>
      </div>

      {formData.status === 'Lost' && (
        <div className="space-y-2">
          <Label>Reason for Loss</Label>
          <Select value={formData.reason} onValueChange={(value) => setFormData({ ...formData, reason: value as any })}>
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

      {showProductSelection && (
        <ProductSearch
          selectedProducts={formData.relatedProducts}
          onProductsChange={(products) => setFormData({ ...formData, relatedProducts: products })}
          label="Related Products"
        />
      )}

      {(formData.status === 'Closed' || formData.status === 'Quoted') && (
        <div className="space-y-2">
          <Label htmlFor="monetaryValue">Monetary Value ($)</Label>
          <Input
            id="monetaryValue"
            type="number"
            step="0.01"
            min="0"
            value={formData.monetaryValue}
            onChange={(e) => setFormData({ ...formData, monetaryValue: e.target.value })}
            placeholder="Enter amount"
          />
        </div>
      )}

      <div className="flex space-x-3 pt-4">
        <Button type="submit" className="flex-1">
          Log Interaction
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default InteractionForm;
