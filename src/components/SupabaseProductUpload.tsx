
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { Upload, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { canUploadProducts } from '@/utils/supabase-security';

interface Product {
  product_code: string;
  description: string;
  cost_price: number;
  sale_price: number;
}

const SupabaseProductUpload: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const canUpload = profile ? canUploadProducts(profile.role) : false;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canUpload || !profile) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to upload products.",
        variant: "destructive",
      });
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['.xlsx', '.xlsm'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload only .xlsx or .xlsm files.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // First upload file to storage
      const fileName = `products-${Date.now()}.${file.name.split('.').pop()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('products')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Parse Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const products: Product[] = jsonData.map((row: any) => ({
        product_code: row['Product Code'] || '',
        description: row['Description'] || '',
        cost_price: parseFloat(row['Cost Price']) || 0,
        sale_price: parseFloat(row['Sale Price']) || 0,
      }));

      // Clear existing products and insert new ones
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteError) throw deleteError;

      // Insert new products
      const { error: insertError } = await supabase
        .from('products')
        .insert(products);

      if (insertError) throw insertError;

      toast({
        title: "Products Uploaded",
        description: `Successfully uploaded ${products.length} products to global database.`,
      });

      // Reset file input
      e.target.value = '';
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to parse the Excel file. Please check the format.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (!canUpload) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Access Restricted
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">You don't have permission to upload product databases. Only ADMIN and BOARD users can access this feature.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Product Database Upload
        </CardTitle>
        <CardDescription>
          Upload an Excel file (.xlsx or .xlsm) with columns: Product Code, Description, Cost Price, Sale Price
          <br />
          <strong>Note:</strong> Products will be shared globally across all users and stores.
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

export default SupabaseProductUpload;
