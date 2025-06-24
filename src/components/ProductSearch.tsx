
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from './ProductUpload';
import { Search, Plus, User } from 'lucide-react';

interface ProductSearchProps {
  selectedProducts: (Product | { id: string; description: string; isCustom: true })[];
  onProductsChange: (products: (Product | { id: string; description: string; isCustom: true })[]) => void;
  label?: string;
}

const ProductSearch: React.FC<ProductSearchProps> = ({ 
  selectedProducts, 
  onProductsChange, 
  label = "Select Products" 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [customProduct, setCustomProduct] = useState('');

  useEffect(() => {
    const storedProducts = JSON.parse(localStorage.getItem('crmProducts') || '[]');
    setProducts(storedProducts);
  }, []);

  useEffect(() => {
    if (searchTerm && products.length > 0) {
      const filtered = products.filter(product =>
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.productCode.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm, products]);

  const addProduct = (product: Product) => {
    if (!selectedProducts.find(p => p.id === product.id)) {
      onProductsChange([...selectedProducts, product]);
    }
    setSearchTerm('');
    setShowSuggestions(false);
  };

  const addCustomProduct = () => {
    if (customProduct.trim()) {
      const newCustomProduct = {
        id: `custom-${Date.now()}`,
        description: customProduct.trim(),
        isCustom: true as const
      };
      onProductsChange([...selectedProducts, newCustomProduct]);
      setCustomProduct('');
    }
  };

  const removeProduct = (productId: string) => {
    onProductsChange(selectedProducts.filter(p => p.id !== productId));
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((product) => (
              <div
                key={product.id}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                onClick={() => addProduct(product)}
              >
                <div className="font-medium">{product.description}</div>
                <div className="text-sm text-gray-500">Code: {product.productCode}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Add custom product..."
          value={customProduct}
          onChange={(e) => setCustomProduct(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addCustomProduct()}
        />
        <Button type="button" onClick={addCustomProduct} size="sm">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {selectedProducts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedProducts.map((product) => (
            <Badge key={product.id} variant="secondary" className="flex items-center gap-1">
              {'isCustom' in product && product.isCustom ? (
                <User className="h-3 w-3" />
              ) : null}
              {product.description}
              <button
                onClick={() => removeProduct(product.id)}
                className="ml-1 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
