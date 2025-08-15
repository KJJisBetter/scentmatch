# Shadcn/ui Expert Agent Documentation

## Core Component Architecture

### Installation and Setup

**Initial Configuration**
```bash
npx shadcn@latest init
```

**Component Installation**
```bash
npx shadcn@latest add button
npx shadcn@latest add card  
npx shadcn@latest add form
npx shadcn@latest add input
```

**components.json Configuration**
```json
{
  "style": "new-york",
  "rsc": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

## Essential Component Patterns

### Button Component Variants

**Primary Actions**
```jsx
import { Button } from "@/components/ui/button"

<Button>Default Button</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost">Subtle</Button>
<Button variant="link">Link Button</Button>

// Custom fragrance-themed variants
<Button className="bg-plum-600 hover:bg-plum-700">
  Add to Collection
</Button>
```

**Size Variants**
```jsx
<Button size="sm">Small</Button>
<Button size="default">Default</Button>  
<Button size="lg">Large</Button>
<Button size="icon">
  <PlusIcon className="h-4 w-4" />
</Button>
```

### Card Component Compositions

**Fragrance Card Layout**
```jsx
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

<Card className="w-full max-w-sm">
  <CardHeader>
    <CardTitle>Chanel No. 5</CardTitle>
    <CardDescription>Classic floral aldehyde</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="aspect-square bg-muted rounded-md" />
    <div className="flex gap-1 mt-2">
      {accords.map(accord => (
        <Badge key={accord} variant="secondary">{accord}</Badge>
      ))}
    </div>
  </CardContent>
  <CardFooter className="flex gap-2">
    <Button size="sm" className="flex-1">Try Sample</Button>
    <Button size="sm" variant="outline">Add to Wishlist</Button>
  </CardFooter>
</Card>
```

### Form Components with Validation

**Authentication Forms**
```jsx
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export function SignupForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Enter your email" {...field} />
              </FormControl>
              <FormDescription>We'll send you a verification link</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
```

### Dialog and Modal Patterns

**Fragrance Detail Modal**
```jsx
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">View Details</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Chanel No. 5</DialogTitle>
      <DialogDescription>
        Classic floral aldehyde fragrance
      </DialogDescription>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      {/* Fragrance details content */}
    </div>
  </DialogContent>
</Dialog>
```

**Sample Selection Modal**
```jsx
<Dialog>
  <DialogContent className="sm:max-w-[600px]">
    <DialogHeader>
      <DialogTitle>Choose Your Samples</DialogTitle>
      <DialogDescription>
        Select up to 5 fragrances to try
      </DialogDescription>
    </DialogHeader>
    <ScrollArea className="h-[400px]">
      <div className="grid grid-cols-1 gap-4">
        {recommendations.map(fragrance => (
          <SampleOption key={fragrance.id} fragrance={fragrance} />
        ))}
      </div>
    </ScrollArea>
    <DialogFooter>
      <Button type="submit">Add to Sample Cart</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Navigation Components

**Main Navigation**
```jsx
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu"

<NavigationMenu>
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuTrigger>Discover</NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="grid gap-3 p-6 md:w-[400px]">
          <NavigationMenuLink href="/quiz">
            <div className="text-sm font-medium">Fragrance Quiz</div>
            <p className="text-xs text-muted-foreground">Find your perfect scent</p>
          </NavigationMenuLink>
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>
```

### Data Display Components

**Fragrance Data Table**
```jsx
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

<Table>
  <TableCaption>Your fragrance collection</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Fragrance</TableHead>
      <TableHead>Brand</TableHead>
      <TableHead>Rating</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {collection.map((item) => (
      <TableRow key={item.id}>
        <TableCell className="font-medium">{item.fragrance.name}</TableCell>
        <TableCell>{item.fragrance.brand_name}</TableCell>
        <TableCell>
          <Badge variant={item.rating >= 8 ? "default" : "secondary"}>
            {item.rating}/10
          </Badge>
        </TableCell>
        <TableCell>{item.collection_type}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Feedback and Loading Components

**Loading States**
```jsx
import { Skeleton } from "@/components/ui/skeleton"

// Fragrance card skeleton
<Card>
  <CardHeader>
    <Skeleton className="h-4 w-[250px]" />
    <Skeleton className="h-4 w-[200px]" />
  </CardHeader>
  <CardContent>
    <Skeleton className="h-[200px] w-full rounded-md" />
  </CardContent>
</Card>
```

**Toast Notifications**
```jsx
import { useToast } from "@/components/ui/use-toast"

const { toast } = useToast()

// Success notification
toast({
  title: "Added to collection!",
  description: "Chanel No. 5 has been added to your wishlist.",
})

// Error notification
toast({
  variant: "destructive",
  title: "Uh oh! Something went wrong.",
  description: "Please try again later.",
})
```

### Advanced Composition Patterns

**Multi-Step Forms (Fragrance Quiz)**
```jsx
import { Steps } from "@/components/ui/steps"

<Steps currentStep={2} totalSteps={5}>
  <StepContent step={1}>
    <FragrancePreferencesStep />
  </StepContent>
  <StepContent step={2}>
    <AccordSelectionStep />
  </StepContent>
  <StepContent step={3}>
    <PersonalityQuizStep />
  </StepContent>
</Steps>
```

**Command Menu (Search)**
```jsx
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

<CommandDialog open={open} onOpenChange={setOpen}>
  <CommandInput placeholder="Search fragrances..." />
  <CommandList>
    <CommandEmpty>No fragrances found.</CommandEmpty>
    <CommandGroup heading="Suggestions">
      <CommandItem>
        <Search className="mr-2 h-4 w-4" />
        <span>Search by scent</span>
      </CommandItem>
    </CommandGroup>
    <CommandGroup heading="Recent">
      {recentFragrances.map((fragrance) => (
        <CommandItem key={fragrance.id}>
          <span>{fragrance.name}</span>
        </CommandItem>
      ))}
    </CommandGroup>
  </CommandList>
</CommandDialog>
```

## Customization and Theming

### CSS Variables Integration
```css
/* globals.css - Shadcn theming */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 262 83% 58%; /* Plum theme */
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 84% 4.9%;
  --muted: 210 40% 96%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 84% 4.9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 262 83% 58%;
  --radius: 0.5rem;
}
```

### Component Customization
```jsx
// Extend existing components
import { cn } from "@/lib/utils"
import { Button, ButtonProps } from "@/components/ui/button"

interface FragranceButtonProps extends ButtonProps {
  fragrance?: 'light' | 'strong'
}

const FragranceButton = ({ fragrance, className, ...props }: FragranceButtonProps) => {
  return (
    <Button
      className={cn(
        fragrance === 'light' && "bg-cream-100 text-cream-900 hover:bg-cream-200",
        fragrance === 'strong' && "bg-plum-600 text-white hover:bg-plum-700",
        className
      )}
      {...props}
    />
  )
}
```

You're absolutely right - a dedicated **Shadcn expert** would be incredibly valuable since we're using it heavily for all UI components!

**Should be our 6th agent**: Research Shadcn composition patterns, component selection, and customization strategies specifically for fragrance discovery interfaces.