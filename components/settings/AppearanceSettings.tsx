'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { useTheme, type FontSize } from '@/components/providers/ThemeProvider';
import { Moon, Sun, Monitor, Type, LayoutGrid, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AppearanceSettings() {
  const {
    theme,
    setTheme,
    fontSize,
    setFontSize,
    compactMode,
    setCompactMode,
    reduceMotion,
    setReduceMotion,
  } = useTheme();

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5" />
            Theme
          </CardTitle>
          <CardDescription>
            Choose your preferred theme. System will follow your device settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={theme} onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}>
            <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent cursor-pointer">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light" className="flex items-center gap-3 flex-1 cursor-pointer">
                <Sun className="h-4 w-4" />
                <div>
                  <div className="font-medium">Light</div>
                  <div className="text-sm text-muted-foreground">Clean and bright interface</div>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent cursor-pointer">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark" className="flex items-center gap-3 flex-1 cursor-pointer">
                <Moon className="h-4 w-4" />
                <div>
                  <div className="font-medium">Dark</div>
                  <div className="text-sm text-muted-foreground">Easy on the eyes for low-light environments</div>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent cursor-pointer">
              <RadioGroupItem value="system" id="system" />
              <Label htmlFor="system" className="flex items-center gap-3 flex-1 cursor-pointer">
                <Monitor className="h-4 w-4" />
                <div>
                  <div className="font-medium">System</div>
                  <div className="text-sm text-muted-foreground">Follows your device theme</div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Font Size */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Font Size
          </CardTitle>
          <CardDescription>
            Adjust the base font size for better readability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={fontSize} onValueChange={(value) => setFontSize(value as FontSize)}>
            <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent cursor-pointer">
              <RadioGroupItem value="small" id="small" />
              <Label htmlFor="small" className="flex items-center gap-3 flex-1 cursor-pointer">
                <div>
                  <div className="font-medium">Small</div>
                  <div className="text-sm text-muted-foreground">14px base size - More content per screen</div>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent cursor-pointer">
              <RadioGroupItem value="medium" id="medium" />
              <Label htmlFor="medium" className="flex items-center gap-3 flex-1 cursor-pointer">
                <div>
                  <div className="font-medium">Medium</div>
                  <div className="text-sm text-muted-foreground">16px base size - Default, balanced</div>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent cursor-pointer">
              <RadioGroupItem value="large" id="large" />
              <Label htmlFor="large" className="flex items-center gap-3 flex-1 cursor-pointer">
                <div>
                  <div className="font-medium">Large</div>
                  <div className="text-sm text-muted-foreground">18px base size - Better for accessibility</div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Display Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
            Display Options
          </CardTitle>
          <CardDescription>
            Customize the layout and behavior of the interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="compact-mode">Compact Mode</Label>
              <div className="text-sm text-muted-foreground">
                Reduce spacing and padding for a denser layout
              </div>
            </div>
            <Switch
              id="compact-mode"
              checked={compactMode}
              onCheckedChange={setCompactMode}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reduce-motion">Reduce Motion</Label>
              <div className="text-sm text-muted-foreground">
                Minimize animations and transitions for better performance
              </div>
            </div>
            <Switch
              id="reduce-motion"
              checked={reduceMotion}
              onCheckedChange={setReduceMotion}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Reset all appearance settings to default
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => {
              setTheme('system');
              setFontSize('medium');
              setCompactMode(false);
              setReduceMotion(false);
            }}
          >
            Reset to Defaults
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
