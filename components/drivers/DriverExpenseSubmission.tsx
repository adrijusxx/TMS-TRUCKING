'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Loader2, Plus, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const EXPENSE_TYPES = [
  { value: 'TOLL', label: 'Toll' },
  { value: 'SCALE', label: 'Scale/Weigh Station' },
  { value: 'PERMIT', label: 'Permit' },
  { value: 'LUMPER', label: 'Lumper Fee' },
  { value: 'DETENTION', label: 'Detention' },
  { value: 'PARKING', label: 'Parking' },
  { value: 'REPAIR', label: 'Repair' },
  { value: 'TOWING', label: 'Towing' },
  { value: 'TIRE', label: 'Tire' },
  { value: 'WASH', label: 'Truck Wash' },
  { value: 'MEAL', label: 'Meal' },
  { value: 'LODGING', label: 'Lodging' },
  { value: 'PHONE', label: 'Phone/Communication' },
  { value: 'OTHER', label: 'Other' },
];

export function DriverExpenseSubmission({ driverId }: { driverId: string }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadId, setLoadId] = useState('');
  const [expenseType, setExpenseType] = useState('');
  const [amount, setAmount] = useState('');
  const [vendor, setVendor] = useState('');
  const [description, setDescription] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // TODO: Upload receipt first if provided
      let receiptUrl = '';
      if (receipt) {
        // Upload logic here
        console.log('Uploading receipt:', receipt);
      }

      const response = await fetch(`/api/loads/${loadId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expenseType,
          amount: parseFloat(amount),
          vendor,
          description,
          receiptUrl,
          date: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Expense submitted successfully');
        setDialogOpen(false);
        // Reset form
        setLoadId('');
        setExpenseType('');
        setAmount('');
        setVendor('');
        setDescription('');
        setReceipt(null);
      } else {
        alert('Error: ' + (data.error?.message || 'Failed to submit expense'));
      }
    } catch (error: any) {
      alert('Error: ' + (error.message || 'Failed to submit expense'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Submit Expense</CardTitle>
            <CardDescription>
              Submit expenses for reimbursement or deduction from settlement
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Submit Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Submit Expense</DialogTitle>
                  <DialogDescription>
                    Fill in the expense details and upload a receipt if available
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="loadId">Load Number</Label>
                      <Input
                        id="loadId"
                        placeholder="L-2025-001"
                        value={loadId}
                        onChange={(e) => setLoadId(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expenseType">Expense Type</Label>
                      <Select value={expenseType} onValueChange={setExpenseType} required>
                        <SelectTrigger id="expenseType">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPENSE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount ($)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="50.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vendor">Vendor (Optional)</Label>
                      <Input
                        id="vendor"
                        placeholder="e.g., Flying J, Pilot, etc."
                        value={vendor}
                        onChange={(e) => setVendor(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Additional details about this expense"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="receipt">Receipt (Optional)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="receipt"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setReceipt(e.target.files?.[0] || null)}
                      />
                      {receipt && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setReceipt(null)}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Upload a photo or PDF of your receipt
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Submit Expense
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Click "Submit Expense" to add a new expense</p>
          <p className="text-sm mt-2">
            Expenses will be reviewed and approved by the accounting team
          </p>
        </div>
      </CardContent>
    </Card>
  );
}





