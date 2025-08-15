'use client';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Input,
  Label,
  Skeleton,
} from '@/components';
import { Heart, Star, Search, User, ShoppingBag, Sparkles } from 'lucide-react';

/**
 * Design System Showcase Component
 * Demonstrates the premium fragrance aesthetic and component library
 * For development and testing purposes
 */
export function DesignSystemShowcase() {
  return (
    <div className='container py-12 space-y-12'>
      {/* Header Section */}
      <section className='text-center space-y-4'>
        <h1 className='text-gradient-primary'>ScentMatch Design System</h1>
        <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
          A premium fragrance discovery platform with sophisticated aesthetics
          and accessible design patterns.
        </p>
      </section>

      {/* Color Palette */}
      <section className='space-y-6'>
        <h2>Color Palette</h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {/* Primary Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Primary - Deep Plum</CardTitle>
              <CardDescription>Sophisticated, premium feeling</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='h-16 rounded-lg bg-plum-900 flex items-center justify-center text-cream-100 font-medium'>
                #2d1b3d
              </div>
              <div className='grid grid-cols-5 gap-2'>
                <div className='h-8 rounded bg-plum-100'></div>
                <div className='h-8 rounded bg-plum-300'></div>
                <div className='h-8 rounded bg-plum-600'></div>
                <div className='h-8 rounded bg-plum-900'></div>
                <div className='h-8 rounded bg-plum-950'></div>
              </div>
            </CardContent>
          </Card>

          {/* Secondary Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Secondary - Warm Cream</CardTitle>
              <CardDescription>Soft, approachable base</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='h-16 rounded-lg bg-cream-100 flex items-center justify-center text-plum-900 font-medium border'>
                #f5f1e8
              </div>
              <div className='grid grid-cols-5 gap-2'>
                <div className='h-8 rounded bg-cream-50 border'></div>
                <div className='h-8 rounded bg-cream-100 border'></div>
                <div className='h-8 rounded bg-cream-300'></div>
                <div className='h-8 rounded bg-cream-600'></div>
                <div className='h-8 rounded bg-cream-900'></div>
              </div>
            </CardContent>
          </Card>

          {/* Accent Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Accent - Warm Gold</CardTitle>
              <CardDescription>Luxurious highlights</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='h-16 rounded-lg bg-gold-400 flex items-center justify-center text-plum-900 font-medium'>
                #d4a574
              </div>
              <div className='grid grid-cols-5 gap-2'>
                <div className='h-8 rounded bg-gold-100 border'></div>
                <div className='h-8 rounded bg-gold-300'></div>
                <div className='h-8 rounded bg-gold-400'></div>
                <div className='h-8 rounded bg-gold-600'></div>
                <div className='h-8 rounded bg-gold-900'></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Typography */}
      <section className='space-y-6'>
        <h2>Typography</h2>
        <Card>
          <CardContent className='space-y-6 p-8'>
            <div className='space-y-4'>
              <h1 className='font-serif'>Heading 1 - Playfair Display</h1>
              <h2 className='font-serif'>Heading 2 - Premium Elegance</h2>
              <h3>Heading 3 - Inter Medium</h3>
              <h4>Heading 4 - Clean & Modern</h4>
              <p className='text-lg'>
                Large body text for important information and descriptions.
              </p>
              <p>
                Regular body text with excellent readability for fragrance
                reviews, product descriptions, and general content across the
                platform.
              </p>
              <p className='text-sm text-muted-foreground'>
                Small text for metadata, captions, and secondary information.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Button Variants */}
      <section className='space-y-6'>
        <h2>Button Components</h2>
        <Card>
          <CardContent className='space-y-6 p-8'>
            {/* Primary Buttons */}
            <div className='space-y-3'>
              <Label>Primary Buttons</Label>
              <div className='flex flex-wrap gap-3'>
                <Button size='sm'>Small</Button>
                <Button>Default</Button>
                <Button size='lg'>Large</Button>
                <Button size='xl'>Extra Large</Button>
                <Button variant='premium' size='lg'>
                  <Sparkles className='w-4 h-4 mr-2' />
                  Premium
                </Button>
              </div>
            </div>

            {/* Secondary Buttons */}
            <div className='space-y-3'>
              <Label>Secondary & Variants</Label>
              <div className='flex flex-wrap gap-3'>
                <Button variant='secondary'>Secondary</Button>
                <Button variant='outline'>Outline</Button>
                <Button variant='ghost'>Ghost</Button>
                <Button variant='accent'>Accent</Button>
                <Button variant='link'>Link</Button>
              </div>
            </div>

            {/* Icon Buttons */}
            <div className='space-y-3'>
              <Label>Icon Buttons</Label>
              <div className='flex flex-wrap gap-3'>
                <Button variant='outline' size='icon'>
                  <Heart className='w-4 h-4' />
                </Button>
                <Button variant='ghost' size='icon'>
                  <Star className='w-4 h-4' />
                </Button>
                <Button size='icon-sm'>
                  <Search className='w-3 h-3' />
                </Button>
                <Button variant='accent' size='icon-lg'>
                  <ShoppingBag className='w-5 h-5' />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Form Elements */}
      <section className='space-y-6'>
        <h2>Form Elements</h2>
        <Card>
          <CardContent className='space-y-6 p-8'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-3'>
                <Label htmlFor='email'>Email Address</Label>
                <Input id='email' type='email' placeholder='your@email.com' />
              </div>
              <div className='space-y-3'>
                <Label htmlFor='search'>Search Fragrances</Label>
                <div className='relative'>
                  <Search className='absolute left-3 top-3 w-4 h-4 text-muted-foreground' />
                  <Input
                    id='search'
                    placeholder='Tom Ford, Chanel...'
                    className='pl-10'
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Badges */}
      <section className='space-y-6'>
        <h2>Badges & Tags</h2>
        <Card>
          <CardContent className='space-y-6 p-8'>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label>Fragrance Notes</Label>
                <div className='flex flex-wrap gap-2'>
                  <Badge variant='note'>Vanilla</Badge>
                  <Badge variant='note'>Bergamot</Badge>
                  <Badge variant='note'>Sandalwood</Badge>
                  <Badge variant='note'>Rose</Badge>
                  <Badge variant='note'>Amber</Badge>
                </div>
              </div>
              <div className='space-y-2'>
                <Label>Categories</Label>
                <div className='flex flex-wrap gap-2'>
                  <Badge variant='gold'>Premium</Badge>
                  <Badge variant='accent'>Niche</Badge>
                  <Badge variant='secondary'>Designer</Badge>
                  <Badge variant='premium'>Limited Edition</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Avatar Component */}
      <section className='space-y-6'>
        <h2>Avatar Component</h2>
        <Card>
          <CardContent className='space-y-6 p-8'>
            <div className='flex items-center gap-4'>
              <Avatar className='h-12 w-12'>
                <AvatarImage src='/placeholder-avatar.jpg' alt='User' />
                <AvatarFallback>
                  <User className='w-6 h-6' />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className='font-medium'>Sarah Johnson</p>
                <p className='text-sm text-muted-foreground'>
                  Fragrance Enthusiast
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Loading States */}
      <section className='space-y-6'>
        <h2>Loading States</h2>
        <Card>
          <CardContent className='space-y-6 p-8'>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-[250px]' />
                <Skeleton className='h-4 w-[200px]' />
              </div>
              <div className='flex items-center space-x-4'>
                <Skeleton className='h-12 w-12 rounded-full' />
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-[150px]' />
                  <Skeleton className='h-4 w-[100px]' />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Interactive Card Example */}
      <section className='space-y-6'>
        <h2>Interactive Components</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          <Card className='card-interactive'>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-lg'>Tom Ford Oud Wood</CardTitle>
                <Button variant='ghost' size='icon-sm'>
                  <Heart className='w-4 h-4' />
                </Button>
              </div>
              <CardDescription>Woody, spicy, luxurious</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <div className='flex flex-wrap gap-1'>
                  <Badge variant='note' className='text-xs'>
                    Oud
                  </Badge>
                  <Badge variant='note' className='text-xs'>
                    Vanilla
                  </Badge>
                  <Badge variant='note' className='text-xs'>
                    Sandalwood
                  </Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-1'>
                    <Star className='w-4 h-4 fill-gold-400 text-gold-400' />
                    <span className='text-sm font-medium'>4.8</span>
                  </div>
                  <Badge variant='gold'>Premium</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='card-interactive'>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-lg'>Chanel No. 5</CardTitle>
                <Button variant='ghost' size='icon-sm'>
                  <Heart className='w-4 h-4 fill-red-500 text-red-500' />
                </Button>
              </div>
              <CardDescription>Floral, aldehydic, classic</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <div className='flex flex-wrap gap-1'>
                  <Badge variant='note' className='text-xs'>
                    Rose
                  </Badge>
                  <Badge variant='note' className='text-xs'>
                    Jasmine
                  </Badge>
                  <Badge variant='note' className='text-xs'>
                    Aldehydes
                  </Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-1'>
                    <Star className='w-4 h-4 fill-gold-400 text-gold-400' />
                    <span className='text-sm font-medium'>4.9</span>
                  </div>
                  <Badge variant='secondary'>Designer</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='card-interactive'>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-lg'>
                  Maison Margiela REPLICA
                </CardTitle>
                <Button variant='ghost' size='icon-sm'>
                  <Heart className='w-4 h-4' />
                </Button>
              </div>
              <CardDescription>Fresh, clean, nostalgic</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <div className='flex flex-wrap gap-1'>
                  <Badge variant='note' className='text-xs'>
                    Lemon
                  </Badge>
                  <Badge variant='note' className='text-xs'>
                    Cotton
                  </Badge>
                  <Badge variant='note' className='text-xs'>
                    Musk
                  </Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-1'>
                    <Star className='w-4 h-4 fill-gold-400 text-gold-400' />
                    <span className='text-sm font-medium'>4.6</span>
                  </div>
                  <Badge variant='accent'>Niche</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
