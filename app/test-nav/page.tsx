export default function TestNavPage() {
  return (
    <div className="min-h-screen bg-background p-4">
      <h1 className="text-3xl font-bold mb-4">Bottom Navigation Test</h1>
      <p className="text-muted-foreground mb-8">
        This page is used to test the bottom navigation component. 
        Switch to mobile view to see the navigation in action.
      </p>
      
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h2 className="font-semibold">Current Route</h2>
          <p className="text-sm text-muted-foreground">/test-nav</p>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h2 className="font-semibold">Features to Test</h2>
          <ul className="text-sm text-muted-foreground space-y-1 mt-2">
            <li>• Navigation between tabs</li>
            <li>• Active state highlighting</li>
            <li>• Touch targets (44px minimum)</li>
            <li>• Keyboard navigation</li>
            <li>• Haptic feedback on iOS</li>
            <li>• Backdrop blur effect</li>
            <li>• Responsive hiding on desktop</li>
          </ul>
        </div>
      </div>
    </div>
  );
}