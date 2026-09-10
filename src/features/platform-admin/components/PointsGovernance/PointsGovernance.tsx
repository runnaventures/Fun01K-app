// src/features/platform-admin/components/PointsGovernance/PointsGovernance.tsx

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function PointsGovernance() {
  const [pointValuationUSD, setPointValuationUSD] = useState(0.10);
  const [monthlyEmployeeCap, setMonthlyEmployeeCap] = useState(1000);
  const [categoryMultipliers, setCategoryMultipliers] = useState({
    Wellness: 1.2,
    Learning: 1.5,
    Sports: 1.0,
    Social: 1.1,
    Hobby: 1.0,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Points Governance</h2>
          <p className="text-sm text-muted-foreground">
            Configure global point economics and earning rules
          </p>
        </div>
        <Button>Save Changes</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">Global Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Point USD Valuation</label>
              <Input
                type="number"
                value={pointValuationUSD}
                onChange={(e) => setPointValuationUSD(parseFloat(e.target.value))}
                step={0.01}
                min={0.05}
                max={0.50}
              />
              <p className="text-xs text-muted-foreground mt-1">
                100 Points = ${(100 * pointValuationUSD).toFixed(2)} USD
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Monthly Employee Cap</label>
              <Input
                type="number"
                value={monthlyEmployeeCap}
                onChange={(e) => setMonthlyEmployeeCap(parseInt(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Category Multipliers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(categoryMultipliers).map(([category, multiplier]) => (
              <div key={category} className="flex items-center gap-4">
                <span className="text-sm font-medium w-24">{category}</span>
                <Input
                  type="number"
                  value={multiplier}
                  onChange={(e) =>
                    setCategoryMultipliers({
                      ...categoryMultipliers,
                      [category]: parseFloat(e.target.value),
                    })
                  }
                  step={0.1}
                  min={0.5}
                  max={3.0}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">× multiplier</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}