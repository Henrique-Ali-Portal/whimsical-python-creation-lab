
import { useState, useEffect } from 'react';
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

interface FormData {
  clientName: string;
  description: string;
  status: 'Closed' | 'Quoted' | 'Lost';
  reason: 'Lack of product' | 'Stock Error' | 'Delay' | 'Price' | 'Other' | '';
  monetaryValue: string;
}

export const useInteractionForm = (onSuccess: () => void) => {
  const [formData, setFormData] = useState<FormData>({
    clientName: '',
    description: '',
    status: 'Quoted',
    reason: '',
    monetaryValue: '',
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userStoreId, setUserStoreId] = useState<string | null>(null);
  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    loadProducts();
    loadUserStore();
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

  const loadUserStore = async () => {
    if (!profile) return;

    try {
      console.log('Loading user store for profile:', profile.id);
      
      const { data, error } = await supabase
        .from('user_stores')
        .select('store_id')
        .eq('user_id', profile.id)
        .single();

      if (error) {
        console.error('Error loading user store:', error);
        return;
      }

      console.log('User store loaded:', data?.store_id);
      setUserStoreId(data?.store_id || null);
    } catch (error) {
      console.error('Error loading user store:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSubmitting(true);

    try {
      console.log('Creating interaction with store_id:', userStoreId);
      
      const { data: interaction, error: interactionError } = await supabase
        .from('interactions')
        .insert({
          client_name: formData.clientName,
          description: formData.description,
          status: formData.status,
          reason: formData.status === 'Lost' ? formData.reason : null,
          monetary_value: formData.monetaryValue ? parseFloat(formData.monetaryValue) : null,
          user_id: profile.id,
          store_id: userStoreId,
        })
        .select()
        .single();

      if (interactionError) {
        console.error('Error creating interaction:', interactionError);
        throw interactionError;
      }

      console.log('Interaction created successfully:', interaction.id);

      if (selectedProducts.length > 0) {
        const productInserts = selectedProducts.map(productId => ({
          interaction_id: interaction.id,
          product_id: productId,
          is_custom: false,
        }));

        const { error: productsError } = await supabase
          .from('interaction_products')
          .insert(productInserts);

        if (productsError) {
          console.error('Error adding products to interaction:', productsError);
          throw productsError;
        }
      }

      toast({
        title: "Interaction Added",
        description: "Client interaction has been logged successfully.",
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error adding interaction:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add interaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return {
    formData,
    products,
    selectedProducts,
    setSelectedProducts,
    isSubmitting,
    userStoreId,
    handleSubmit,
    handleInputChange,
  };
};
