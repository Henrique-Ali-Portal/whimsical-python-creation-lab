
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { Upload } from 'lucide-react';

export interface Product {
  id: string;
  productCode: string;
  description: string;
  costPrice: number;
  salePrice: number;
}

interface ProductUploadProps {
  onProductsUploaded: (products: Product[]) => void;
}

const ProductUpload: React.FC<ProductUploadProps> = ({ onProductsUploaded }) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const products: Product[] = jsonData.map((row: any, index: number) => ({
        id: `product-${Date.now()}-${index}`,
        productCode: row['Product Code'] || '',
        description: row['Description'] || '',
        costPrice: parseFloat(row['Cost Price']) || 0,
        salePrice: parseFloat(row['Sale Price']) || 0,
      }));

      // Store products in localStorage
      localStorage.setItem('crmProducts', JSON.stringify(products));
      onProductsUploaded(products);

      toast({
        title: "Products Uploaded",
        description: `Successfully uploaded ${products.length} products.`,
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to parse the Excel file. Please check the format.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Product Database Upload
        </CardTitle>
        <CardDescription>
          Upload an Excel file (.xlsx or .xlsm) with columns: Product Code, Description, Cost Price, Sale Price
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="productFile">Select Excel File</Label>
          <Input
            id="productFile"
            type="file"
            accept=".xlsx,.xlsm"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          {isUploading && (
            <p className="text-sm text-gray-500">Uploading and processing...</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductUpload;
