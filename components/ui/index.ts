// UI Component Library Index
// Consolidated exports for all shadcn/ui and custom components

// Core shadcn/ui components
export { Alert, AlertDescription } from './alert';
export { Avatar, AvatarFallback, AvatarImage } from './avatar';
export { Badge, badgeVariants } from './badge';
export {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from './breadcrumb';
export { Button, buttonVariants } from './button';
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card';
export { Checkbox } from './checkbox';
export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from './command';
export { DataTable } from './data-table';
export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from './dialog';
export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from './dropdown-menu';
export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from './form';
export { Input } from './input';
export { Label } from './label';
export { Progress } from './progress';
export { RadioGroup, RadioGroupItem } from './radio-group';
export {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from './select';
export { Separator } from './separator';
export {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from './sheet';
export { Skeleton } from './skeleton';
export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './table';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
export { ToggleGroup, ToggleGroupItem } from './toggle-group';

// Custom components maintained for specific functionality
export { OptimizedImage } from './optimized-image';
export {
  PerformanceObserver,
  usePerformanceMetrics,
} from './performance-observer';
export { ProgressiveLoader, StreamingContent } from './progressive-loader';
export { Rating, type RatingProps } from './rating';

// Skeleton components for specialized loading states
export { QuizSkeleton } from './skeletons/quiz-skeleton';
export { RecommendationSkeleton } from './skeletons/recommendation-skeleton';
export { SearchSkeleton } from './skeletons/search-skeleton';

// Type exports for TypeScript
export type { BadgeProps } from './badge';
export type { ButtonProps } from './button';
// export type { CardProps } from './card'; // CardProps not available
// export type { InputProps } from './input'; // InputProps not available
// export type { LabelProps } from './label'; // LabelProps not available
// export type { SelectProps } from './select'; // SelectProps not available
// export type { TabsProps } from './tabs'; // TabsProps not available
