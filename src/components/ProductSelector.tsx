
import React from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Product {
  id: string;
  product_code: string;
  description: string;
  cost_price: number;
  sale_price: number;
}

interface ProductSelectorProps {
  products: Product[];
  selectedProducts: string[];
  onProductsChange: (products: string[]) => void;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({
  products,
  selectedProducts,
  onProductsChange,
}) => {
  const handleAddProduct = (productId: string) => {
    if (!selectedProducts.includes(productId)) {
      onProductsChange([...selectedProducts, productId]);
    }
  };

  const handleRemoveProduct = (productId: string) => {
    onProductsChange(selectedProducts.filter(id => id !== productId));
  };

  return (
    <div>
      <Label>Related Products</Label>
      <Select value="" onValueChange={handleAddProduct}>
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
                  onClick={() => handleRemoveProduct(productId)}
                >
                  Remove
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductSelector;
