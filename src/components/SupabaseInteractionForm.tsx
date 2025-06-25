
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Product {
  id: string;
  product_code: string;
  description: string;
  cost_price: number;
  sale_price: number;
}

interface SupabaseInteractionFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

const SupabaseInteractionForm: React.FC<SupabaseInteractionFormProps> = ({ onCancel, onSuccess }) => {
  const [formData, setFormData] = useState({
    clientName: '',
    description: '',
    status: 'Quoted' as 'Closed' | 'Quoted' | 'Lost',
    reason: '' as 'Lack of product' | 'Stock Error' | 'Delay' | 'Price' | 'Other' | '',
    monetaryValue: '',
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('description');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSubmitting(true);

    try {
      // Insert interaction
      const { data: interaction, error: interactionError } = await supabase
        .from('interactions')
        .insert({
          client_name: formData.clientName,
          description: formData.description,
          status: formData.status,
          reason: formData.status === 'Lost' ? formData.reason : null,
          monetary_value: formData.monetaryValue ? parseFloat(formData.monetaryValue) : null,
          user_id: profile.id,
        })
        .select()
        .single();

      if (interactionError) throw interactionError;

      // Insert selected products
      if (selectedProducts.length > 0) {
        const productInserts = selectedProducts.map(productId => ({
          interaction_id: interaction.id,
          product_id: productId,
          is_custom: false,
        }));

        const { error: productsError } = await supabase
          .from('interaction_products')
          .insert(productInserts);

        if (productsError) throw productsError;
      }

      toast({
        title: "Interaction Added",
        description: "Client interaction has been logged successfully.",
      });

      onSuccess();
    } catch (error) {
      console.error('Error adding interaction:', error);
      toast({
        title: "Error",
        description: "Failed to add interaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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

      <div>
        <Label>Related Products</Label>
        <Select value="" onValueChange={(productId) => {
          if (!selectedProducts.includes(productId)) {
            setSelectedProducts([...selectedProducts, productId]);
          }
        }}>
          <SelectTrigger>
            <SelectValue placeholder="Add products" />
          </SelectTrigger>
          <SelectContent>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {selectedProducts.length > 0 && (
          <div className="mt-2 space-y-1">
            {selectedProducts.map((productId) => {
              const product = products.find(p => p.id === productId);
              return (
                <div key={productId} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                  <span className="text-sm">{product?.description}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedProducts(selectedProducts.filter(id => id !== productId))}
                  >
                    Remove
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
