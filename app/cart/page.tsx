"use client"

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Minus, Plus, Trash2, MapPin, Clock, ShoppingBag, Tag, Gift, Truck, Check, CreditCard, Banknote, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCart } from '@/context/cart-context'
import { BottomNav } from '@/components/bottom-nav'
import menuData from '@/data/menu.json'
import { useMenu } from '@/hooks/use-menu'
import couponsData from '@/data/coupons.json'
import { cn } from '@/lib/utils'

interface Coupon {
  id: string
  code: string
  title: string
  description: string
  type: 'percentage' | 'flat' | 'free_delivery' | 'free_item' | 'bogo'
  value: number
  maxDiscount?: number
  minOrderValue: number
  validTill: string
  isActive: boolean
  freeItem?: {
    name: string
    price: number
    image: string
  }
  terms?: string[]
}

interface CustomerDetails {
  name: string
  phone: string
  address: string
}

type CheckoutStep = 'cart' | 'details' | 'payment' | 'processing'

export default function CartPage() {
  const { items, updateQuantity, removeItem, getTotal, clearCart, hydrated } = useCart()
  const liveMenu = useMenu()

  // Admin ne stock band kiya to yahan turant pata chal jaata hai.
  const soldOut = items.filter(item => {
    const dish = liveMenu.dishes.find(d => d.id === item.id)
    return !dish || dish.inStock === false
  })
  const hasSoldOut = soldOut.length > 0
  const [promoCode, setPromoCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [promoError, setPromoError] = useState('')
  const [showCoupons, setShowCoupons] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('cart')
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: '',
    phone: '',
    address: ''
  })
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi'>('cod')
  const [errors, setErrors] = useState<Partial<CustomerDetails>>({})

  const subtotal = getTotal()
  const deliveryFee = subtotal >= menuData.restaurantInfo.minOrderForFreeDelivery ? 0 : 40
  
  const calculateDiscount = (): { discount: number; freeDelivery: boolean; freeItem: Coupon['freeItem'] | null } => {
    if (!appliedCoupon) return { discount: 0, freeDelivery: false, freeItem: null }

    switch (appliedCoupon.type) {
      case 'percentage':
        const percentDiscount = Math.round(subtotal * (appliedCoupon.value / 100))
        return { 
          discount: appliedCoupon.maxDiscount ? Math.min(percentDiscount, appliedCoupon.maxDiscount) : percentDiscount,
          freeDelivery: false,
          freeItem: appliedCoupon.freeItem || null
        }
      case 'flat':
        return { discount: appliedCoupon.value, freeDelivery: false, freeItem: appliedCoupon.freeItem || null }
      case 'free_delivery':
        return { discount: 0, freeDelivery: true, freeItem: null }
      case 'free_item':
        return { discount: 0, freeDelivery: false, freeItem: appliedCoupon.freeItem || null }
      case 'bogo':
        return { discount: 0, freeDelivery: false, freeItem: null }
      default:
        return { discount: 0, freeDelivery: false, freeItem: null }
    }
  }

  const { discount, freeDelivery, freeItem } = calculateDiscount()
  const actualDeliveryFee = freeDelivery ? 0 : deliveryFee
  
  // Calculate GST (2.5% SGST + 2.5% CGST = 5% total)
  const taxableAmount = subtotal - discount
  const sgst = Math.round(taxableAmount * 0.025)
  const cgst = Math.round(taxableAmount * 0.025)
  const total = taxableAmount + sgst + cgst + actualDeliveryFee

  const handleApplyPromo = (code?: string) => {
    const codeToApply = code || promoCode
    const coupon = couponsData.coupons.find(
      c => c.code.toLowerCase() === codeToApply.toLowerCase() && c.isActive
    ) as Coupon | undefined

    if (coupon) {
      if (subtotal < coupon.minOrderValue) {
        setPromoError(`Minimum order of Rs.${coupon.minOrderValue} required`)
        setAppliedCoupon(null)
      } else {
        setAppliedCoupon(coupon)
        setPromoCode(coupon.code)
        setPromoError('')
        setShowCoupons(false)
      }
    } else {
      setPromoError('Invalid or expired promo code')
      setAppliedCoupon(null)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setPromoCode('')
    setPromoError('')
  }

  const validateDetails = (): boolean => {
    const newErrors: Partial<CustomerDetails> = {}
    
    if (!customerDetails.name.trim()) {
      newErrors.name = 'Name is required'
    }
    
    if (!customerDetails.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^[6-9]\d{9}$/.test(customerDetails.phone.trim())) {
      newErrors.phone = 'Enter valid 10-digit phone number'
    }
    
    if (!customerDetails.address.trim()) {
      newErrors.address = 'Address is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleProceedToPayment = () => {
    if (validateDetails()) {
      setCheckoutStep('payment')
    }
  }

  const sendWhatsAppOrder = (paymentStatus: string) => {
    // Build order items
    const orderItems = items.map(item => {
      let line = `  ${item.name}${item.size ? ` (${item.size})` : ''} x${item.quantity} = Rs.${item.price * item.quantity}`
      if (item.addOns?.length) {
        line += `\n     + ${item.addOns.map(a => `${a.name} (Rs.${a.price})`).join(', ')}`
      }
      if (item.cookingRequest) {
        line += `\n     * Request: ${item.cookingRequest}`
      }
      return line
    }).join('\n')
    
    // Build the WhatsApp message
    let message = `🍢 *NEW ORDER - KABAB KITCHEN* 🍢\n\n`
    message += `*Customer Details:*\n`
    message += `👤 Name: ${customerDetails.name}\n`
    message += `📱 Phone: ${customerDetails.phone}\n`
    message += `📍 Address: ${customerDetails.address}\n\n`
    message += `*Order Details:*\n${orderItems}\n`
    
    if (freeItem) {
      message += `  ${freeItem.name} x1 = FREE\n`
    }
    
    message += `\n*Bill Summary:*\n`
    message += `Subtotal: Rs.${subtotal}\n`
    
    if (discount > 0) {
      message += `Discount (${appliedCoupon?.code}): -Rs.${discount}\n`
    }
    
    message += `SGST (2.5%): Rs.${sgst}\n`
    message += `CGST (2.5%): Rs.${cgst}\n`
    
    if (actualDeliveryFee > 0) {
      message += `Delivery: Rs.${actualDeliveryFee}\n`
    } else {
      message += `Delivery: FREE\n`
    }
    
    message += `━━━━━━━━━━━━━\n`
    message += `*TOTAL: Rs.${total}*\n\n`
    message += `*Payment Mode:* ${paymentStatus}\n`
    message += `*Expected Delivery:* 30-45 minutes\n\n`
    message += `Thank you for ordering! 🙏`
    
    const whatsappUrl = `https://wa.me/${liveMenu.restaurantInfo.whatsapp}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const handleCODOrder = () => {
    sendWhatsAppOrder('💵 Cash on Delivery')
    clearCart()
    setCheckoutStep('cart')
  }

  const handleUPIPayment = () => {
    setCheckoutStep('processing')
  }

  const handlePaymentDone = () => {
    sendWhatsAppOrder('💳 UPI - Payment in process')
    clearCart()
    setCheckoutStep('cart')
  }

  const availableCoupons = couponsData.coupons.filter(c => c.isActive) as Coupon[]

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading your cart…</p>
      </div>
    )
  }

  if (items.length === 0 && checkoutStep === 'cart') {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-50 bg-background border-b border-border">
          <div className="flex items-center gap-4 px-4 py-3">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-bold">Your Cart</h1>
          </div>
        </header>
        
        <div className="flex flex-col items-center justify-center h-[60vh] px-4">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <ShoppingBag className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground text-center mb-6">
            Looks like you have not added anything to your cart yet
          </p>
          <Link href="/">
            <Button className="bg-primary text-primary-foreground">
              Browse Menu
            </Button>
          </Link>
        </div>
        
        <BottomNav />
      </div>
    )
  }

  // Customer Details Step
  if (checkoutStep === 'details') {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-50 bg-background border-b border-border">
          <div className="flex items-center gap-4 px-4 py-3">
            <button onClick={() => setCheckoutStep('cart')}>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold">Delivery Details</h1>
          </div>
        </header>

        <div className="p-4">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">
                <Check className="w-4 h-4" />
              </div>
              <span className="text-xs text-green-600 font-medium">Cart</span>
            </div>
            <div className="w-8 h-0.5 bg-primary" />
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">2</div>
              <span className="text-xs text-primary font-medium">Details</span>
            </div>
            <div className="w-8 h-0.5 bg-muted" />
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs">3</div>
              <span className="text-xs text-muted-foreground">Payment</span>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4 space-y-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Delivery Information
            </h2>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Full Name *</label>
              <Input
                value={customerDetails.name}
                onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                placeholder="Enter your full name"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Phone Number *</label>
              <Input
                value={customerDetails.phone}
                onChange={(e) => setCustomerDetails({ ...customerDetails, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                placeholder="10-digit mobile number"
                type="tel"
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Complete Address *</label>
              <textarea
                value={customerDetails.address}
                onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })}
                placeholder="House No, Building, Street, Area, Landmark, City, Pincode"
                rows={3}
                className={cn(
                  "w-full px-3 py-2 rounded-lg border bg-background text-foreground text-sm resize-none",
                  errors.address ? 'border-destructive' : 'border-input'
                )}
              />
              {errors.address && <p className="text-xs text-destructive mt-1">{errors.address}</p>}
            </div>
          </div>

          {/* Order Summary Mini */}
          <div className="bg-card rounded-xl border border-border p-4 mt-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">Order Total</span>
              <span className="font-bold text-primary text-lg">Rs.{total}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{items.length} items</p>
          </div>
        </div>

        {/* Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 safe-area-pb">
          <Button 
            onClick={handleProceedToPayment}
            className="w-full bg-primary text-primary-foreground h-12 text-base font-semibold"
          >
            Proceed to Payment
          </Button>
        </div>
      </div>
    )
  }

  // Payment Step
  if (checkoutStep === 'payment') {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-50 bg-background border-b border-border">
          <div className="flex items-center gap-4 px-4 py-3">
            <button onClick={() => setCheckoutStep('details')}>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold">Payment</h1>
          </div>
        </header>

        <div className="p-4">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">
                <Check className="w-4 h-4" />
              </div>
              <span className="text-xs text-green-600 font-medium">Cart</span>
            </div>
            <div className="w-8 h-0.5 bg-green-500" />
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">
                <Check className="w-4 h-4" />
              </div>
              <span className="text-xs text-green-600 font-medium">Details</span>
            </div>
            <div className="w-8 h-0.5 bg-primary" />
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">3</div>
              <span className="text-xs text-primary font-medium">Payment</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <h2 className="font-semibold text-foreground">Select Payment Method</h2>

            <button
              onClick={() => setPaymentMethod('cod')}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                paymentMethod === 'cod' ? "border-primary bg-primary/5" : "border-border"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center",
                paymentMethod === 'cod' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                <Banknote className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Cash on Delivery</p>
                <p className="text-sm text-muted-foreground">Pay when you receive your order</p>
              </div>
              {paymentMethod === 'cod' && <Check className="w-5 h-5 text-primary" />}
            </button>

            <button
              onClick={() => setPaymentMethod('upi')}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                paymentMethod === 'upi' ? "border-primary bg-primary/5" : "border-border"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center",
                paymentMethod === 'upi' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                <CreditCard className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">UPI Payment</p>
                <p className="text-sm text-muted-foreground">Pay via Google Pay, PhonePe, Paytm</p>
              </div>
              {paymentMethod === 'upi' && <Check className="w-5 h-5 text-primary" />}
            </button>
          </div>

          {/* Bill Summary */}
          <div className="bg-card rounded-xl border border-border p-4 mt-4">
            <h3 className="font-semibold text-foreground mb-3">Bill Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">Rs.{subtotal}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span>-Rs.{discount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">SGST (2.5%)</span>
                <span className="text-foreground">Rs.{sgst}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CGST (2.5%)</span>
                <span className="text-foreground">Rs.{cgst}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className={actualDeliveryFee === 0 ? "text-green-600" : "text-foreground"}>
                  {actualDeliveryFee === 0 ? 'FREE' : `Rs.${actualDeliveryFee}`}
                </span>
              </div>
              <div className="border-t border-border pt-2 mt-2 flex justify-between">
                <span className="font-bold text-foreground">Total</span>
                <span className="font-bold text-primary text-lg">Rs.{total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 safe-area-pb">
          <Button 
            onClick={paymentMethod === 'cod' ? handleCODOrder : handleUPIPayment}
            className={cn(
              "w-full h-12 text-base font-semibold",
              paymentMethod === 'cod' ? "bg-green-600 hover:bg-green-700 text-white" : "bg-primary text-primary-foreground"
            )}
          >
            {paymentMethod === 'cod' ? 'Place Order (COD)' : 'Pay Rs.' + total + ' via UPI'}
          </Button>
        </div>
      </div>
    )
  }

  // UPI QR Code / Processing Step
  if (checkoutStep === 'processing') {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-50 bg-background border-b border-border">
          <div className="flex items-center gap-4 px-4 py-3">
            <button onClick={() => setCheckoutStep('payment')}>
              <X className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold">UPI Payment</h1>
          </div>
        </header>

        <div className="p-4 flex flex-col items-center">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-sm">
            <h2 className="text-center font-semibold text-foreground mb-4">Scan QR to Pay</h2>
            
            {/* QR Code Placeholder */}
            <div className="w-48 h-48 mx-auto bg-white border-2 border-border rounded-xl flex items-center justify-center mb-4">
              <div className="text-center">
                <CreditCard className="w-12 h-12 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">UPI QR Code</p>
                <p className="text-sm font-bold text-foreground mt-1">Rs.{total}</p>
              </div>
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Or pay to UPI ID:</p>
              <p className="font-mono text-sm bg-muted px-3 py-2 rounded-lg">kababkitchen@oksbi</p>
            </div>

            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs text-amber-800 text-center">
                After payment, click {"'Payment Done'"} to confirm your order
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Waiting for payment...</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 safe-area-pb space-y-2">
          <Button 
            onClick={handlePaymentDone}
            className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base font-semibold"
          >
            Payment Done
          </Button>
          <Button 
            onClick={() => setCheckoutStep('payment')}
            variant="outline"
            className="w-full h-10"
          >
            Change Payment Method
          </Button>
        </div>
      </div>
    )
  }

  // Cart Step (default)
  return (
    <div className="min-h-screen bg-background pb-40">
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center gap-4 px-4 py-3">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold">Your Cart</h1>
        </div>
      </header>

      <div className="p-4">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">1</div>
            <span className="text-xs text-primary font-medium">Cart</span>
          </div>
          <div className="w-8 h-0.5 bg-muted" />
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs">2</div>
            <span className="text-xs text-muted-foreground">Details</span>
          </div>
          <div className="w-8 h-0.5 bg-muted" />
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs">3</div>
            <span className="text-xs text-muted-foreground">Payment</span>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-1">Review Your Order</h2>
        <p className="text-sm text-muted-foreground mb-4">{items.length} items in your cart</p>

        {/* Cart Items */}
        <div className="space-y-3 mb-4">
          {items.map((item, index) => (
            <div key={`${item.id}-${item.size}-${index}`} className="bg-card rounded-xl border border-border p-3">
              <div className="flex gap-3">
                <div className="w-20 h-20 bg-muted rounded-lg relative overflow-hidden shrink-0">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/images/placeholder-dish.jpg'
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{item.name}</h3>
                      {item.size && (
                        <p className="text-xs text-muted-foreground capitalize">Size: {item.size}</p>
                      )}
                    </div>
                    <button 
                      onClick={() => removeItem(item.lineId)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 bg-muted rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-border rounded-l-lg transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-border rounded-r-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">Rs.{item.price * item.quantity}</p>
                      <p className="text-xs text-muted-foreground">Rs.{item.price} each</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Free Item Display */}
          {freeItem && (
            <div className="bg-green-50 rounded-xl border-2 border-green-200 p-3">
              <div className="flex gap-3">
                <div className="w-20 h-20 bg-green-100 rounded-lg relative overflow-hidden shrink-0 flex items-center justify-center">
                  <Gift className="w-8 h-8 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded font-medium">FREE</span>
                  </div>
                  <h3 className="font-semibold text-green-800 text-sm mt-1">{freeItem.name}</h3>
                  <p className="text-xs text-green-600 mt-1">Added with code {appliedCoupon?.code}</p>
                  <p className="text-sm text-green-700 font-medium mt-1">Worth Rs.{freeItem.price}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Promo Code Section */}
        <div className="bg-card rounded-xl border border-border p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Promo Code
            </h3>
            <button 
              onClick={() => setShowCoupons(!showCoupons)}
              className="text-sm text-primary font-medium"
            >
              {showCoupons ? 'Hide' : 'View All'}
            </button>
          </div>
          
          {appliedCoupon ? (
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800">{appliedCoupon.code}</p>
                    <p className="text-xs text-green-600">{appliedCoupon.description}</p>
                  </div>
                </div>
                <button 
                  onClick={handleRemoveCoupon}
                  className="text-sm text-red-600 font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Enter promo code"
                className="flex-1"
              />
              <Button 
                onClick={() => handleApplyPromo()}
                className="bg-primary text-primary-foreground"
              >
                Apply
              </Button>
            </div>
          )}
          
          {promoError && (
            <p className="text-xs text-destructive mt-2">{promoError}</p>
          )}

          {/* Available Coupons List */}
          {showCoupons && !appliedCoupon && (
            <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
              <p className="text-xs text-muted-foreground mb-2">Available Coupons</p>
              {availableCoupons.map(coupon => {
                const isEligible = subtotal >= coupon.minOrderValue
                return (
                  <div 
                    key={coupon.id} 
                    className={cn(
                      "border rounded-lg p-3 transition-all",
                      isEligible 
                        ? "border-primary/30 bg-primary/5 cursor-pointer hover:border-primary" 
                        : "border-border bg-muted/50 opacity-60"
                    )}
                    onClick={() => isEligible && handleApplyPromo(coupon.code)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">{coupon.code}</span>
                          {coupon.type === 'free_delivery' && <Truck className="w-4 h-4 text-green-600" />}
                          {coupon.type === 'free_item' && <Gift className="w-4 h-4 text-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{coupon.description}</p>
                        {coupon.minOrderValue > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Min order: Rs.{coupon.minOrderValue}
                            {!isEligible && ` (Add Rs.${coupon.minOrderValue - subtotal} more)`}
                          </p>
                        )}
                      </div>
                      {isEligible && (
                        <span className="text-xs font-medium text-primary">Apply</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-semibold text-foreground mb-3">Order Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">Rs.{subtotal}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount ({appliedCoupon?.code})</span>
                <span>-Rs.{discount}</span>
              </div>
            )}
            {freeItem && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Free {freeItem.name}</span>
                <span>-Rs.{freeItem.price}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">SGST (2.5%)</span>
              <span className="text-foreground">Rs.{sgst}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">CGST (2.5%)</span>
              <span className="text-foreground">Rs.{cgst}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery Fee</span>
              <span className={cn(
                actualDeliveryFee === 0 ? "text-green-600 font-medium" : "text-foreground"
              )}>
                {actualDeliveryFee === 0 ? 'FREE' : `Rs.${actualDeliveryFee}`}
              </span>
            </div>
            {actualDeliveryFee > 0 && subtotal < menuData.restaurantInfo.minOrderForFreeDelivery && (
              <p className="text-xs text-muted-foreground">
                Add Rs.{menuData.restaurantInfo.minOrderForFreeDelivery - subtotal} more for free delivery
              </p>
            )}
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-bold text-foreground">Total</span>
                <span className="font-bold text-primary text-lg">Rs.{total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Footer */}
      <div className="fixed bottom-16 left-0 right-0 bg-background border-t border-border p-4 safe-area-pb">
        {hasSoldOut && (
          <div className="mb-3 rounded-xl border border-red-300 bg-red-50 p-3">
            <p className="text-sm font-medium text-red-700">
              Currently unavailable: {soldOut.map(i => i.name).join(', ')}
            </p>
            <button
              onClick={() => soldOut.forEach(i => removeItem(i.lineId))}
              className="mt-1 text-xs font-semibold text-red-700 underline"
            >
              Remove from cart
            </button>
          </div>
        )}
        <Button 
          onClick={() => setCheckoutStep('details')}
          disabled={hasSoldOut}
          className="w-full bg-primary text-primary-foreground h-12 text-base font-semibold disabled:opacity-50"
        >
          {hasSoldOut ? 'Remove out-of-stock items' : `Proceed to Checkout - Rs.${total}`}
        </Button>
      </div>

      <BottomNav />
    </div>
  )
}
