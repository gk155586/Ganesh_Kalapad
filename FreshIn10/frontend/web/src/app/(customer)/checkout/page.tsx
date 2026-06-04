"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, CreditCard, Tag, ChevronRight, Clock, Shield, Plus } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { formatPrice } from "@freshin10/utils";
import { FREE_DELIVERY_THRESHOLD, DELIVERY_FEE } from "@freshin10/utils";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { SafeImage } from "@/components/ui/SafeImage";

interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "WALLET" | "UPI" | "RAZORPAY">("COD");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isVerifyingUpi, setIsVerifyingUpi] = useState(false);
  const [notes, setNotes] = useState("");
  const [showUpiModal, setShowUpiModal] = useState<any>(null);

  const sub = subtotal();
  const deliveryFee = sub >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const platformFee = 5;
  const total = sub + deliveryFee + platformFee - couponDiscount;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    if (items.length === 0) {
      router.push("/");
      return;
    }
    fetchAddresses();
  }, [isAuthenticated, items.length]);

  const fetchAddresses = async () => {
    try {
      const { data } = await api.get("/api/users/addresses");
      setAddresses(data);
      const defaultAddr = data.find((a: Address & { isDefault: boolean }) => a.isDefault);
      if (defaultAddr) setSelectedAddress(defaultAddr.id);
      else if (data.length > 0) setSelectedAddress(data[0].id);
    } catch {}
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const { data } = await api.post("/api/coupons/validate", {
        code: couponCode,
        orderAmount: sub,
      });
      setCouponDiscount(data.discount);
      toast.success(`Coupon applied! You save ${formatPrice(data.discount)}`);
    } catch (err: any) {
      setCouponDiscount(0);
      toast.error(err.response?.data?.error || "Invalid coupon");
    }
  };

  const handleRazorpay = async (order: any) => {
    try {
      // For razorpay.me links, we redirect the user to the payment page
      toast.success("Redirecting to Razorpay Secure Payment...");
      
      // We still want to clear the cart and move to a "Payment Pending" or "Success" state
      // depending on the business logic. Usually for links, we show a success page with a "Processing" message.
      setTimeout(() => {
        window.open(`https://razorpay.me/@FreshIn10`, "_blank");
        clearCart();
        router.push(`/orders/${order.id}/success?method=online`);
      }, 1500);
    } catch {
      toast.error("Failed to initiate payment");
    }
  };

  const placeOrder = async () => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }

    setIsPlacingOrder(true);
    try {
      const orderData = {
        addressId: selectedAddress,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        paymentMethod,
        couponCode: couponCode || undefined,
        notes: notes || undefined,
      };

      const { data: order } = await api.post("/api/orders/create", orderData);

      if (paymentMethod === "UPI") {
        setShowUpiModal(order);
        setIsPlacingOrder(false);
      } else if (paymentMethod === "RAZORPAY") {
        handleRazorpay(order);
        setIsPlacingOrder(false);
      } else {
        await clearCart();
        toast.success("Order placed successfully!");
        router.push(`/orders/${order.id}/success`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to place order");
      setIsPlacingOrder(false);
    }
  };

  const handleUpiPayClick = () => {
    setIsVerifyingUpi(true);
    const upiUrl = `upi://pay?pa=ganeshkalapadgk@oksbi&pn=Ganesha&am=${total}&cu=INR&mc=0000&tr=${showUpiModal?.id || Date.now()}&tn=FreshIn10%20Order`;
    window.location.href = upiUrl;
    
    // Simulate auto-verification
    setTimeout(async () => {
      await clearCart();
      toast.success("Payment verified successfully! 🎉");
      router.push(`/orders/${showUpiModal.id}/success`);
    }, 5000); // 5 second simulated wait for payment app to return
  };

  if (items.length === 0) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-app">
        <h1 className="text-2xl font-black text-gray-900 mb-6">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Address + Payment */}
          <div className="lg:col-span-2 space-y-4">
            {/* Delivery Address */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-600" />
                  <h2 className="font-bold text-gray-900">Delivery Address</h2>
                </div>
                <button
                  onClick={() => router.push("/profile/addresses/new")}
                  className="flex items-center gap-1 text-sm text-green-600 font-semibold hover:underline"
                >
                  <Plus className="w-4 h-4" />
                  Add New
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm mb-3">No addresses saved</p>
                  <button
                    onClick={() => router.push("/profile/addresses/new")}
                    className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold"
                  >
                    Add Address
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedAddress === addr.id
                          ? "border-green-500 bg-green-50"
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={addr.id}
                        checked={selectedAddress === addr.id}
                        onChange={() => setSelectedAddress(addr.id)}
                        className="mt-1 accent-green-600"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-gray-900">{addr.fullName}</span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {addr.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {addr.addressLine1}
                          {addr.addressLine2 && `, ${addr.addressLine2}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">📞 {addr.phone}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-green-600" />
                <h2 className="font-bold text-gray-900">Payment Method</h2>
              </div>

              <div className="space-y-3">
                {[
                  { value: "COD", label: "Cash on Delivery", desc: "Pay when delivered", icon: "💵" },
                  { value: "RAZORPAY", label: "Online Payment", desc: "Cards, Net Banking, Wallets", icon: "💳" },
                  { value: "UPI", label: "Direct UPI / Scan QR", desc: "Pay directly with QR", icon: "📸" },
                  { value: "WALLET", label: `Wallet (₹${user?.walletBalance || 0})`, desc: "Use your FreshIn10 wallet", icon: "👛" },
                ].map((method) => (
                  <label
                    key={method.value}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === method.value
                        ? "border-green-500 bg-green-50"
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.value}
                      checked={paymentMethod === method.value}
                      onChange={() => setPaymentMethod(method.value as any)}
                      className="accent-green-600"
                    />
                    <span className="text-xl">{method.icon}</span>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{method.label}</p>
                      <p className="text-xs text-gray-500">{method.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Order Notes */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-3">Order Notes (Optional)</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions for delivery..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>
          </div>

          {/* Right - Order Summary */}
          <div className="space-y-4">
            {/* Items */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-4">
                Order Summary ({items.length} items)
              </h2>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      <SafeImage
                        src={item.product.images?.[0]}
                        alt={item.product.name}
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                        fallbackIcon="🛒"
                        fallbackClassName="w-full h-full flex items-center justify-center"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                      <p className="text-xs text-gray-400">x{item.quantity}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Coupon */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-green-600" />
                <h2 className="font-bold text-gray-900 text-sm">Apply Coupon</h2>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={applyCoupon}
                  className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-4">Price Details</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(sub)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className={deliveryFee === 0 ? "text-green-600 font-semibold" : ""}>
                    {deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Platform Fee</span>
                  <span>{formatPrice(platformFee)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Coupon Discount</span>
                    <span>-{formatPrice(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-gray-900 text-base pt-3 border-t border-gray-100">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {/* Delivery time */}
              <div className="mt-4 flex items-center gap-2 bg-green-50 rounded-xl p-3">
                <Clock className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700 font-semibold">Estimated delivery: 10 minutes</span>
              </div>

              <button
                onClick={placeOrder}
                disabled={isPlacingOrder || !selectedAddress}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-green-600 text-white py-4 rounded-xl font-black text-base hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPlacingOrder ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Place Order • {formatPrice(total)}
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-400">
                <Shield className="w-3.5 h-3.5" />
                <span>100% secure payment</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* UPI Payment Modal */}
      {showUpiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="bg-gray-900 text-white p-6 text-center relative">
              <h3 className="text-xl font-black mb-1">Pay via UPI</h3>
              <p className="text-gray-300 text-sm">Scan QR or use any UPI App</p>
            </div>
            
            <div className="p-6 flex flex-col items-center">
              <div className="mb-4 bg-gray-50 p-4 rounded-2xl border-2 border-gray-100 flex flex-col items-center w-full max-w-[240px]">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=ganeshkalapadgk@oksbi&pn=Ganesha&am=${total}&cu=INR&mc=0000&tr=${showUpiModal?.id || Date.now()}&tn=FreshIn10%20Order`} 
                  alt="UPI QR Code" 
                  className="w-48 h-48 mix-blend-multiply"
                />
              </div>
              
              <div className="w-full bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100 text-center space-y-1">
                <p className="text-sm text-gray-500">UPI ID</p>
                <p className="font-bold text-gray-900 font-mono">ganeshkalapadgk@oksbi</p>
                <p className="text-sm text-gray-500 mt-2">Amount to Pay</p>
                <p className="text-2xl font-black text-green-600">{formatPrice(total)}</p>
              </div>

              <div className="flex flex-col w-full gap-3">
                <button 
                  onClick={handleUpiPayClick}
                  disabled={isVerifyingUpi}
                  className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-blue-200 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isVerifyingUpi ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Verifying Payment...
                    </div>
                  ) : (
                    "Pay Now with UPI App"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
